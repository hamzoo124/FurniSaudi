// src/api/finance.ts
import { supabase } from '@/lib/supabase';
import { PostgrestResponse } from '@supabase/supabase-js';

// ============================================================================
// INTERFACES
// ============================================================================

export interface FinanceTransaction {
  id: string;
  seller_id: string;
  type: 'credit' | 'debit' | 'payout' | 'refund' | 'commission' | 'vat' | 'fee';
  reference_type: 'order' | 'refund' | 'payout' | 'adjustment' | 'commission' | 'vat';
  reference_id: string | null;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'reversed';
  description: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface FinanceSummary {
  total_revenue: number;
  total_payouts: number;
  total_fees: number;
  total_commission: number;
  total_vat_collected: number;
  total_vat_paid: number;
  available_balance: number;
  pending_balance: number;
  current_period_revenue: number;
  last_payout_date: string | null;
  next_payout_eligible: boolean;
  vat_obligation: number;
}

export interface PayoutRequest {
  id: string;
  seller_id: string;
  amount: number;
  status: 'requested' | 'approved' | 'paid' | 'rejected' | 'cancelled';
  requested_at: string;
  processed_at: string | null;
  processor_id: string | null;
  reason: string | null;
  payment_method: 'bank_transfer' | 'paypal' | 'wallet' | 'other';
  payment_reference: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface SellerWallet {
  id: string;
  seller_id: string;
  available_balance: number;
  pending_balance: number;
  total_credited: number;
  total_debited: number;
  last_updated: string;
  version: number; // For optimistic concurrency control
}

export interface EarningsPeriodSummary {
  period_start: string;
  period_end: string;
  total_credited: number;
  total_debited: number;
  net_earnings: number;
  transaction_count: number;
  breakdown_by_type: {
    credit: number;
    debit: number;
    refund: number;
    commission: number;
    vat: number;
    fee: number;
  };
  daily_breakdown: Array<{
    date: string;
    revenue: number;
    fees: number;
    net: number;
  }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TRANSACTION_TYPES = {
  CREDIT: 'credit',
  DEBIT: 'debit',
  PAYOUT: 'payout',
  REFUND: 'refund',
  COMMISSION: 'commission',
  VAT: 'vat',
  FEE: 'fee',
} as const;

const PAYOUT_STATUS = {
  REQUESTED: 'requested',
  APPROVED: 'approved',
  PAID: 'paid',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
} as const;

const DEFAULT_PAGE_SIZE = 20;
const MINIMUM_PAYOUT_AMOUNT = 100; // SAR 100 minimum payout

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const handleSupabaseError = (error: any): Error => {
  console.error('Supabase error:', error);
  return new Error(error.message || 'Database operation failed');
};

const validateSellerId = (sellerId: string): void => {
  if (!sellerId || typeof sellerId !== 'string') {
    throw new Error('Invalid seller ID');
  }
};

const validateAmount = (amount: number): void => {
  if (typeof amount !== 'number' || amount <= 0) {
    throw new Error('Amount must be a positive number');
  }
};

// ============================================================================
// MAIN API FUNCTIONS
// ============================================================================

/**
 * Get overall financial summary for a seller
 */
export const getFinanceSummary = async (sellerId: string): Promise<ApiResponse<FinanceSummary>> => {
  try {
    validateSellerId(sellerId);

    // Get wallet balance
    const { data: wallet, error: walletError } = await supabase
      .from('seller_wallet')
      .select('*')
      .eq('seller_id', sellerId)
      .single();

    if (walletError && walletError.code !== 'PGRST116') {
      throw walletError;
    }

    // Calculate totals from transactions
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

    const { data: transactions, error: transactionsError } = await supabase
      .from('wallet_transactions')
      .select('type, amount, status, created_at')
      .eq('seller_id', sellerId)
      .eq('status', 'completed');

    if (transactionsError) {
      throw transactionsError;
    }

    // Calculate summary
    const totals = transactions?.reduce(
      (acc, transaction) => {
        switch (transaction.type) {
          case 'credit':
            acc.total_revenue += transaction.amount;
            if (new Date(transaction.created_at) >= new Date(firstDayOfMonth)) {
              acc.current_period_revenue += transaction.amount;
            }
            break;
          case 'payout':
            acc.total_payouts += transaction.amount;
            break;
          case 'commission':
          case 'fee':
            acc.total_fees += transaction.amount;
            if (transaction.type === 'commission') {
              acc.total_commission += transaction.amount;
            }
            break;
          case 'vat':
            if (transaction.amount > 0) {
              acc.total_vat_collected += transaction.amount;
            } else {
              acc.total_vat_paid += Math.abs(transaction.amount);
            }
            break;
        }
        return acc;
      },
      {
        total_revenue: 0,
        total_payouts: 0,
        total_fees: 0,
        total_commission: 0,
        total_vat_collected: 0,
        total_vat_paid: 0,
        current_period_revenue: 0,
      }
    );

    // Get last payout
    const { data: lastPayout } = await supabase
      .from('payout_requests')
      .select('processed_at')
      .eq('seller_id', sellerId)
      .eq('status', 'paid')
      .order('processed_at', { ascending: false })
      .limit(1)
      .single();

    // Check next payout eligibility (minimum balance and no pending payouts)
    const { count: pendingPayouts } = await supabase
      .from('payout_requests')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', sellerId)
      .in('status', ['requested', 'approved']);

    const summary: FinanceSummary = {
      total_revenue: totals?.total_revenue || 0,
      total_payouts: totals?.total_payouts || 0,
      total_fees: totals?.total_fees || 0,
      total_commission: totals?.total_commission || 0,
      total_vat_collected: totals?.total_vat_collected || 0,
      total_vat_paid: totals?.total_vat_paid || 0,
      available_balance: wallet?.available_balance || 0,
      pending_balance: wallet?.pending_balance || 0,
      current_period_revenue: totals?.current_period_revenue || 0,
      last_payout_date: lastPayout?.processed_at || null,
      next_payout_eligible: (wallet?.available_balance || 0) >= MINIMUM_PAYOUT_AMOUNT && !pendingPayouts,
      vat_obligation: Math.max(0, (totals?.total_vat_collected || 0) - (totals?.total_vat_paid || 0)),
    };

    return { data: summary, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

/**
 * Fetch detailed financial transactions with pagination and filtering
 */
export const getFinanceTransactions = async (
  sellerId: string,
  page: number = 1,
  limit: number = DEFAULT_PAGE_SIZE,
  typeFilter?: string
): Promise<ApiResponse<PaginatedResponse<FinanceTransaction>>> => {
  try {
    validateSellerId(sellerId);

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('wallet_transactions')
      .select('*', { count: 'exact' })
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    // Apply type filter if provided
    if (typeFilter && typeFilter !== 'all') {
      query = query.eq('type', typeFilter);
    }

    // Add pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    const paginatedResponse: PaginatedResponse<FinanceTransaction> = {
      data: data as FinanceTransaction[],
      total,
      page,
      limit,
      total_pages: totalPages,
      has_next: page < totalPages,
      has_prev: page > 1,
    };

    return { data: paginatedResponse, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

/**
 * Request a payout from seller balance with optimistic locking
 */
export const requestPayout = async (
  sellerId: string,
  amount: number,
  paymentMethod: PayoutRequest['payment_method'] = 'bank_transfer'
): Promise<ApiResponse<{ payout: PayoutRequest; newBalance: number }>> => {
  try {
    validateSellerId(sellerId);
    validateAmount(amount);

    if (amount < MINIMUM_PAYOUT_AMOUNT) {
      throw new Error(`Minimum payout amount is ${formatCurrency(MINIMUM_PAYOUT_AMOUNT)}`);
    }

    // Start transaction
    const { data: wallet, error: walletError } = await supabase
      .from('seller_wallet')
      .select('*')
      .eq('seller_id', sellerId)
      .single();

    if (walletError) {
      throw walletError;
    }

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    if (wallet.available_balance < amount) {
      throw new Error('Insufficient balance');
    }

    // Check for pending payouts
    const { count: pendingPayouts } = await supabase
      .from('payout_requests')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', sellerId)
      .in('status', ['requested', 'approved']);

    if (pendingPayouts && pendingPayouts > 0) {
      throw new Error('You have pending payout requests');
    }

    // Create payout request
    const payoutRequest: Partial<PayoutRequest> = {
      seller_id: sellerId,
      amount,
      status: 'requested',
      requested_at: new Date().toISOString(),
      payment_method: paymentMethod,
      metadata: {},
    };

    const { data: payout, error: payoutError } = await supabase
      .from('payout_requests')
      .insert(payoutRequest)
      .select()
      .single();

    if (payoutError) {
      throw payoutError;
    }

    // Create transaction record for the payout
    const transaction: Partial<FinanceTransaction> = {
      seller_id: sellerId,
      type: 'payout',
      reference_type: 'payout',
      reference_id: payout.id,
      amount: -amount, // Negative amount for payout
      status: 'pending',
      description: `Payout request #${payout.id}`,
      metadata: { payout_id: payout.id, payment_method: paymentMethod },
    };

    const { error: transactionError } = await supabase
      .from('wallet_transactions')
      .insert(transaction);

    if (transactionError) {
      // Rollback payout request if transaction fails
      await supabase
        .from('payout_requests')
        .delete()
        .eq('id', payout.id);
      throw transactionError;
    }

    // Update wallet balance with optimistic locking
    const { data: updatedWallet, error: updateError } = await supabase
      .from('seller_wallet')
      .update({
        available_balance: wallet.available_balance - amount,
        pending_balance: wallet.pending_balance + amount,
        version: wallet.version + 1,
        last_updated: new Date().toISOString(),
      })
      .eq('seller_id', sellerId)
      .eq('version', wallet.version) // Optimistic locking
      .select()
      .single();

    if (updateError) {
      // Rollback everything if wallet update fails
      await supabase
        .from('payout_requests')
        .delete()
        .eq('id', payout.id);
      await supabase
        .from('wallet_transactions')
        .delete()
        .eq('reference_id', payout.id);
      throw updateError;
    }

    return {
      data: {
        payout: payout as PayoutRequest,
        newBalance: updatedWallet.available_balance,
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

/**
 * Aggregate earnings for a given date range with detailed breakdown
 */
export const getEarningsByPeriod = async (
  sellerId: string,
  startDate: string,
  endDate: string
): Promise<ApiResponse<EarningsPeriodSummary>> => {
  try {
    validateSellerId(sellerId);

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      throw new Error('Start date must be before end date');
    }

    // Get all transactions in date range
    const { data: transactions, error } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('seller_id', sellerId)
      .eq('status', 'completed')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    // Calculate totals
    const breakdownByType = {
      credit: 0,
      debit: 0,
      refund: 0,
      commission: 0,
      vat: 0,
      fee: 0,
    };

    let totalCredited = 0;
    let totalDebited = 0;

    transactions?.forEach(transaction => {
      if (transaction.amount > 0) {
        totalCredited += transaction.amount;
      } else {
        totalDebited += Math.abs(transaction.amount);
      }

      switch (transaction.type) {
        case 'credit':
          breakdownByType.credit += transaction.amount;
          break;
        case 'debit':
          breakdownByType.debit += Math.abs(transaction.amount);
          break;
        case 'refund':
          breakdownByType.refund += Math.abs(transaction.amount);
          break;
        case 'commission':
          breakdownByType.commission += Math.abs(transaction.amount);
          break;
        case 'vat':
          breakdownByType.vat += transaction.amount;
          break;
        case 'fee':
          breakdownByType.fee += Math.abs(transaction.amount);
          break;
      }
    });

    // Calculate daily breakdown
    const dailyBreakdown = transactions?.reduce((acc, transaction) => {
      const date = transaction.created_at.split('T')[0];
      const existing = acc.find(item => item.date === date);

      if (existing) {
        if (transaction.amount > 0) {
          existing.revenue += transaction.amount;
        } else {
          existing.fees += Math.abs(transaction.amount);
        }
        existing.net = existing.revenue - existing.fees;
      } else {
        acc.push({
          date,
          revenue: transaction.amount > 0 ? transaction.amount : 0,
          fees: transaction.amount < 0 ? Math.abs(transaction.amount) : 0,
          net: transaction.amount,
        });
      }

      return acc;
    }, [] as Array<{ date: string; revenue: number; fees: number; net: number }>);

    // Sort daily breakdown by date
    dailyBreakdown?.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const summary: EarningsPeriodSummary = {
      period_start: startDate,
      period_end: endDate,
      total_credited: totalCredited,
      total_debited: totalDebited,
      net_earnings: totalCredited - totalDebited,
      transaction_count: transactions?.length || 0,
      breakdown_by_type: breakdownByType,
      daily_breakdown: dailyBreakdown || [],
    };

    return { data: summary, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

/**
 * Get payout history for a seller
 */
export const getPayoutHistory = async (
  sellerId: string,
  page: number = 1,
  limit: number = DEFAULT_PAGE_SIZE
): Promise<ApiResponse<PaginatedResponse<PayoutRequest>>> => {
  try {
    validateSellerId(sellerId);

    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('payout_requests')
      .select('*', { count: 'exact' })
      .eq('seller_id', sellerId)
      .order('requested_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    const paginatedResponse: PaginatedResponse<PayoutRequest> = {
      data: data as PayoutRequest[],
      total,
      page,
      limit,
      total_pages: totalPages,
      has_next: page < totalPages,
      has_prev: page > 1,
    };

    return { data: paginatedResponse, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

/**
 * Cancel a pending payout request
 */
export const cancelPayoutRequest = async (
  sellerId: string,
  payoutId: string
): Promise<ApiResponse<{ success: boolean; newBalance: number }>> => {
  try {
    validateSellerId(sellerId);

    // Get the payout request
    const { data: payout, error: payoutError } = await supabase
      .from('payout_requests')
      .select('*')
      .eq('id', payoutId)
      .eq('seller_id', sellerId)
      .single();

    if (payoutError) {
      throw payoutError;
    }

    if (!['requested', 'approved'].includes(payout.status)) {
      throw new Error('Only requested or approved payouts can be cancelled');
    }

    // Get wallet
    const { data: wallet, error: walletError } = await supabase
      .from('seller_wallet')
      .select('*')
      .eq('seller_id', sellerId)
      .single();

    if (walletError) {
      throw walletError;
    }

    // Update payout status
    const { error: updateError } = await supabase
      .from('payout_requests')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', payoutId);

    if (updateError) {
      throw updateError;
    }

    // Update transaction status
    const { error: transactionError } = await supabase
      .from('wallet_transactions')
      .update({
        status: 'reversed',
        updated_at: new Date().toISOString(),
      })
      .eq('reference_id', payoutId)
      .eq('seller_id', sellerId);

    if (transactionError) {
      throw transactionError;
    }

    // Add reversal transaction
    const reversalTransaction: Partial<FinanceTransaction> = {
      seller_id: sellerId,
      type: 'credit',
      reference_type: 'payout',
      reference_id: payoutId,
      amount: payout.amount,
      status: 'completed',
      description: `Payout cancellation for request #${payoutId}`,
      metadata: { original_payout_id: payoutId },
    };

    const { error: reversalError } = await supabase
      .from('wallet_transactions')
      .insert(reversalTransaction);

    if (reversalError) {
      throw reversalError;
    }

    // Update wallet balance
    const { data: updatedWallet, error: walletUpdateError } = await supabase
      .from('seller_wallet')
      .update({
        available_balance: wallet.available_balance + payout.amount,
        pending_balance: wallet.pending_balance - payout.amount,
        version: wallet.version + 1,
        last_updated: new Date().toISOString(),
      })
      .eq('seller_id', sellerId)
      .eq('version', wallet.version)
      .select()
      .single();

    if (walletUpdateError) {
      throw walletUpdateError;
    }

    return {
      data: {
        success: true,
        newBalance: updatedWallet.available_balance,
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

// ============================================================================
// HELPER FUNCTIONS FOR UI INTEGRATION
// ============================================================================

/**
 * Format currency for display (SAR)
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Get transaction type label for display
 */
export const getTransactionTypeLabel = (type: FinanceTransaction['type']): string => {
  const labels: Record<FinanceTransaction['type'], string> = {
    credit: 'Sale',
    debit: 'Purchase',
    payout: 'Payout',
    refund: 'Refund',
    commission: 'Commission',
    vat: 'VAT',
    fee: 'Fee',
  };
  return labels[type] || type;
};

/**
 * Get transaction status color for UI
 */
export const getTransactionStatusColor = (status: FinanceTransaction['status']): string => {
  const colors: Record<FinanceTransaction['status'], string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    reversed: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

/**
 * Get payout status label for display
 */
export const getPayoutStatusLabel = (status: PayoutRequest['status']): string => {
  const labels: Record<PayoutRequest['status'], string> = {
    requested: 'Requested',
    approved: 'Approved',
    paid: 'Paid',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
  };
  return labels[status] || status;
};

/**
 * Get payout status color for UI
 */
export const getPayoutStatusColor = (status: PayoutRequest['status']): string => {
  const colors: Record<PayoutRequest['status'], string> = {
    requested: 'bg-blue-100 text-blue-800',
    approved: 'bg-purple-100 text-purple-800',
    paid: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

// ============================================================================
// MOCK DATA FOR TESTING/DEMO
// ============================================================================

export const getMockFinanceSummary = (): FinanceSummary => ({
  total_revenue: 15500,
  total_payouts: 25400,
  total_fees: 2325,
  total_commission: 2325,
  total_vat_collected: 2325,
  total_vat_paid: 0,
  available_balance: 3810,
  pending_balance: 1250,
  current_period_revenue: 4650,
  last_payout_date: '2024-01-15T10:30:00Z',
  next_payout_eligible: true,
  vat_obligation: 2325,
});

export const getMockTransactions = (count: number = 10): FinanceTransaction[] => {
  const types: FinanceTransaction['type'][] = ['credit', 'debit', 'payout', 'refund', 'commission', 'vat', 'fee'];
  const statuses: FinanceTransaction['status'][] = ['pending', 'completed', 'failed', 'reversed'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `txn_${i + 1}`,
    seller_id: 'seller_123',
    type: types[i % types.length],
    reference_type: 'order',
    reference_id: `ref_${i + 1}`,
    amount: i % 2 === 0 ? Math.floor(Math.random() * 5000) : -Math.floor(Math.random() * 2000),
    status: statuses[i % statuses.length],
    description: `Transaction ${i + 1}`,
    metadata: {},
    created_at: new Date(Date.now() - i * 86400000).toISOString(),
    updated_at: new Date(Date.now() - i * 86400000).toISOString(),
  }));
};