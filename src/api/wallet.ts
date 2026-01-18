// src/api/wallet.ts
import { supabase } from '@/lib/supabase';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type TransactionType = 
  | 'credit'         // Order payment, refund reversal
  | 'debit'          // Refund, chargeback
  | 'payout'         // Withdrawal to bank
  | 'refund'         // Customer refund
  | 'commission'     // Platform commission
  | 'fee'            // Service fees
  | 'adjustment';    // Manual adjustment

export type TransactionStatus = 
  | 'pending' 
  | 'completed' 
  | 'failed' 
  | 'cancelled';

export type PayoutStatus = 
  | 'requested' 
  | 'approved' 
  | 'processing' 
  | 'paid' 
  | 'rejected' 
  | 'cancelled';

export interface WalletTransaction {
  id: string;
  seller_id: string;
  type: TransactionType;
  reference_id: string | null; // Order ID, Payout ID, etc.
  amount: number;
  description: string | null;
  status: TransactionStatus;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  order?: {
    id: string;
    order_number: string;
    buyer_name?: string;
  };
  payout?: {
    id: string;
    reference_number: string;
  };
}

export interface WalletSummary {
  available_balance: number;
  pending_balance: number;
  total_earnings: number;
  total_payouts: number;
  total_refunds: number;
  total_commission: number;
  total_fees: number;
  last_payout_date: string | null;
  next_payout_eligible: boolean;
  payout_hold_reason: string | null;
  currency: string;
}

export interface PayoutRequest {
  id: string;
  seller_id: string;
  amount: number;
  requested_amount: number;
  fee_amount: number;
  net_amount: number;
  status: PayoutStatus;
  payment_method: 'bank_transfer' | 'paypal' | 'stripe';
  payment_details: Record<string, any> | null;
  reference_number: string;
  requested_at: string;
  processed_at: string | null;
  completed_at: string | null;
  rejection_reason: string | null;
  notes: string | null;
}

export interface PaginatedTransactions {
  transactions: WalletTransaction[];
  total: number;
  page: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface PaginatedPayouts {
  payouts: PayoutRequest[];
  total: number;
  page: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface WalletLedger {
  opening_balance: number;
  closing_balance: number;
  total_credits: number;
  total_debits: number;
  period_start: string;
  period_end: string;
  transactions: WalletTransaction[];
}

export interface PayoutMethod {
  id: string;
  seller_id: string;
  type: 'bank_account' | 'paypal' | 'stripe_connect';
  is_default: boolean;
  details: Record<string, any>;
  created_at: string;
  verified_at: string | null;
  status: 'active' | 'pending' | 'failed';
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface PayoutValidation {
  isValid: boolean;
  availableBalance: number;
  minimumPayout: number;
  maximumPayout: number;
  feeAmount: number;
  netAmount: number;
  message: string;
}

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const WALLET_CONFIG = {
  MINIMUM_PAYOUT_AMOUNT: 100, // SAR
  MAXIMUM_PAYOUT_AMOUNT: 50000, // SAR
  PAYOUT_FEE_PERCENTAGE: 2.5, // 2.5% fee
  PAYOUT_PROCESSING_DAYS: 2, // Business days
  CURRENCY: 'SAR' as const,
  SETTLEMENT_PERIOD: 14, // Days to hold funds for order disputes
} as const;

// ============================================================================
// WALLET MANAGEMENT API
// ============================================================================

/**
 * Fetch current wallet balance and summary for a seller
 */
export async function getWalletBalance(
  sellerId: string
): Promise<ApiResponse<WalletSummary>> {
  try {
    // Get seller wallet record
    const { data: wallet, error: walletError } = await supabase
      .from('seller_wallets')
      .select('*')
      .eq('seller_id', sellerId)
      .single();

    if (walletError) {
      console.error('Error fetching wallet:', walletError);
      return {
        data: null,
        error: walletError.message
      };
    }

    // Calculate aggregated totals from transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('wallet_transactions')
      .select('type, amount, status')
      .eq('seller_id', sellerId)
      .eq('status', 'completed');

    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError);
      return {
        data: null,
        error: transactionsError.message
      };
    }

    // Calculate totals
    const totals = {
      total_earnings: 0,
      total_payouts: 0,
      total_refunds: 0,
      total_commission: 0,
      total_fees: 0,
    };

    transactions?.forEach(transaction => {
      const amount = Math.abs(transaction.amount);
      switch (transaction.type) {
        case 'credit':
          totals.total_earnings += amount;
          break;
        case 'payout':
          totals.total_payouts += amount;
          break;
        case 'refund':
          totals.total_refunds += amount;
          break;
        case 'commission':
          totals.total_commission += amount;
          break;
        case 'fee':
          totals.total_fees += amount;
          break;
      }
    });

    // Get last successful payout
    const { data: lastPayout } = await supabase
      .from('payout_requests')
      .select('completed_at')
      .eq('seller_id', sellerId)
      .eq('status', 'paid')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    // Check if next payout is eligible (no pending disputes, minimum balance)
    const { count: pendingDisputes } = await supabase
      .from('order_disputes')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', sellerId)
      .eq('status', 'open');

    const next_payout_eligible = 
      wallet.available_balance >= WALLET_CONFIG.MINIMUM_PAYOUT_AMOUNT &&
      (pendingDisputes || 0) === 0;

    const summary: WalletSummary = {
      available_balance: wallet.available_balance,
      pending_balance: wallet.pending_balance,
      total_earnings: totals.total_earnings,
      total_payouts: totals.total_payouts,
      total_refunds: totals.total_refunds,
      total_commission: totals.total_commission,
      total_fees: totals.total_fees,
      last_payout_date: lastPayout?.completed_at || null,
      next_payout_eligible,
      payout_hold_reason: pendingDisputes ? 'Pending disputes' : null,
      currency: WALLET_CONFIG.CURRENCY
    };

    return {
      data: summary,
      error: null
    };
  } catch (error) {
    console.error('Unexpected error in getWalletBalance:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch wallet balance'
    };
  }
}

/**
 * Fetch wallet transaction history with pagination and filtering
 */
export async function getWalletTransactions(
  sellerId: string,
  options?: {
    page?: number;
    limit?: number;
    type?: TransactionType;
    status?: TransactionStatus;
    start_date?: string;
    end_date?: string;
    search?: string;
  }
): Promise<ApiResponse<PaginatedTransactions>> {
  try {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const offset = (page - 1) * limit;

    // Build the base query
    let query = supabase
      .from('wallet_transactions')
      .select(`
        *,
        order:orders!reference_id (
          id,
          order_number,
          profiles!orders_buyer_id_fkey (
            full_name
          )
        ),
        payout:payout_requests!reference_id (
          id,
          reference_number
        )
      `, { count: 'exact' })
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    // Apply type filter
    if (options?.type) {
      query = query.eq('type', options.type);
    }

    // Apply status filter
    if (options?.status) {
      query = query.eq('status', options.status);
    }

    // Apply date range filter
    if (options?.start_date) {
      query = query.gte('created_at', options.start_date);
    }
    if (options?.end_date) {
      query = query.lte('created_at', options.end_date);
    }

    // Apply search filter on description
    if (options?.search) {
      query = query.ilike('description', `%${options.search}%`);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching wallet transactions:', error);
      return {
        data: null,
        error: error.message
      };
    }

    // Transform the data to include buyer name from order
    const transformedTransactions = (data || []).map(transaction => {
      const transformed: WalletTransaction = {
        ...transaction,
        order: transaction.order ? {
          id: transaction.order.id,
          order_number: transaction.order.order_number,
          buyer_name: (transaction.order as any).profiles?.full_name
        } : undefined,
        payout: transaction.payout ? {
          id: transaction.payout.id,
          reference_number: transaction.payout.reference_number
        } : undefined
      };
      return transformed;
    });

    const total = count || 0;
    const total_pages = Math.ceil(total / limit);

    const response: PaginatedTransactions = {
      transactions: transformedTransactions,
      total,
      page,
      total_pages,
      has_next: page < total_pages,
      has_previous: page > 1
    };

    return {
      data: response,
      error: null
    };
  } catch (error) {
    console.error('Unexpected error in getWalletTransactions:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch transactions'
    };
  }
}

/**
 * Request a payout from wallet balance
 */
export async function requestWalletPayout(
  sellerId: string,
  amount: number,
  paymentMethodId: string
): Promise<ApiResponse<{ payout: PayoutRequest; newBalance: number }>> {
  try {
    // Validate payout amount
    const validation = await validatePayoutRequest(sellerId, amount);
    if (!validation.isValid) {
      return {
        data: null,
        error: validation.message
      };
    }

    // Get seller's payment method
    const { data: paymentMethod, error: methodError } = await supabase
      .from('seller_payment_methods')
      .select('*')
      .eq('id', paymentMethodId)
      .eq('seller_id', sellerId)
      .eq('status', 'active')
      .single();

    if (methodError || !paymentMethod) {
      return {
        data: null,
        error: 'Invalid or inactive payment method'
      };
    }

    // Generate reference number
    const referenceNumber = `PAYOUT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Start a database transaction
    const { data: payout, error: payoutError } = await supabase
      .from('payout_requests')
      .insert({
        seller_id: sellerId,
        amount: validation.netAmount,
        requested_amount: amount,
        fee_amount: validation.feeAmount,
        net_amount: validation.netAmount,
        status: 'requested',
        payment_method: paymentMethod.type,
        payment_details: paymentMethod.details,
        reference_number: referenceNumber,
        requested_at: new Date().toISOString(),
        notes: `Payout request for ${validation.netAmount} ${WALLET_CONFIG.CURRENCY}`
      })
      .select()
      .single();

    if (payoutError) {
      console.error('Error creating payout request:', payoutError);
      return {
        data: null,
        error: payoutError.message
      };
    }

    // Create wallet transaction for the payout
    const { error: transactionError } = await supabase
      .from('wallet_transactions')
      .insert({
        seller_id: sellerId,
        type: 'payout',
        reference_id: payout.id,
        amount: -validation.netAmount, // Negative for payout
        description: `Payout request #${referenceNumber}`,
        status: 'pending',
        metadata: {
          fee: validation.feeAmount,
          payment_method: paymentMethod.type
        }
      });

    if (transactionError) {
      console.error('Error creating payout transaction:', transactionError);
      // Rollback payout request if transaction fails
      await supabase.from('payout_requests').delete().eq('id', payout.id);
      return {
        data: null,
        error: transactionError.message
      };
    }

    // Update wallet balance
    const { data: updatedWallet, error: balanceError } = await supabase
      .from('seller_wallets')
      .update({
        available_balance: validation.availableBalance - validation.netAmount,
        updated_at: new Date().toISOString()
      })
      .eq('seller_id', sellerId)
      .select('available_balance')
      .single();

    if (balanceError) {
      console.error('Error updating wallet balance:', balanceError);
      return {
        data: null,
        error: balanceError.message
      };
    }

    return {
      data: {
        payout,
        newBalance: updatedWallet.available_balance
      },
      error: null
    };
  } catch (error) {
    console.error('Unexpected error in requestWalletPayout:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to request payout'
    };
  }
}

/**
 * Validate payout request before processing
 */
async function validatePayoutRequest(
  sellerId: string,
  amount: number
): Promise<PayoutValidation> {
  try {
    // Get current wallet balance
    const { data: wallet, error } = await supabase
      .from('seller_wallets')
      .select('available_balance')
      .eq('seller_id', sellerId)
      .single();

    if (error || !wallet) {
      return {
        isValid: false,
        availableBalance: 0,
        minimumPayout: WALLET_CONFIG.MINIMUM_PAYOUT_AMOUNT,
        maximumPayout: WALLET_CONFIG.MAXIMUM_PAYOUT_AMOUNT,
        feeAmount: 0,
        netAmount: 0,
        message: 'Wallet not found'
      };
    }

    const availableBalance = wallet.available_balance;

    // Check minimum payout amount
    if (amount < WALLET_CONFIG.MINIMUM_PAYOUT_AMOUNT) {
      return {
        isValid: false,
        availableBalance,
        minimumPayout: WALLET_CONFIG.MINIMUM_PAYOUT_AMOUNT,
        maximumPayout: WALLET_CONFIG.MAXIMUM_PAYOUT_AMOUNT,
        feeAmount: 0,
        netAmount: 0,
        message: `Minimum payout amount is ${WALLET_CONFIG.MINIMUM_PAYOUT_AMOUNT} ${WALLET_CONFIG.CURRENCY}`
      };
    }

    // Check maximum payout amount
    if (amount > WALLET_CONFIG.MAXIMUM_PAYOUT_AMOUNT) {
      return {
        isValid: false,
        availableBalance,
        minimumPayout: WALLET_CONFIG.MINIMUM_PAYOUT_AMOUNT,
        maximumPayout: WALLET_CONFIG.MAXIMUM_PAYOUT_AMOUNT,
        feeAmount: 0,
        netAmount: 0,
        message: `Maximum payout amount is ${WALLET_CONFIG.MAXIMUM_PAYOUT_AMOUNT} ${WALLET_CONFIG.CURRENCY}`
      };
    }

    // Check if enough balance
    if (amount > availableBalance) {
      return {
        isValid: false,
        availableBalance,
        minimumPayout: WALLET_CONFIG.MINIMUM_PAYOUT_AMOUNT,
        maximumPayout: WALLET_CONFIG.MAXIMUM_PAYOUT_AMOUNT,
        feeAmount: 0,
        netAmount: 0,
        message: `Insufficient balance. Available: ${availableBalance} ${WALLET_CONFIG.CURRENCY}`
      };
    }

    // Calculate fee and net amount
    const feeAmount = Math.max(
      (amount * WALLET_CONFIG.PAYOUT_FEE_PERCENTAGE) / 100,
      10 // Minimum fee
    );
    const netAmount = amount - feeAmount;

    return {
      isValid: true,
      availableBalance,
      minimumPayout: WALLET_CONFIG.MINIMUM_PAYOUT_AMOUNT,
      maximumPayout: WALLET_CONFIG.MAXIMUM_PAYOUT_AMOUNT,
      feeAmount,
      netAmount,
      message: ''
    };
  } catch (error) {
    console.error('Error validating payout:', error);
    return {
      isValid: false,
      availableBalance: 0,
      minimumPayout: WALLET_CONFIG.MINIMUM_PAYOUT_AMOUNT,
      maximumPayout: WALLET_CONFIG.MAXIMUM_PAYOUT_AMOUNT,
      feeAmount: 0,
      netAmount: 0,
      message: 'Validation failed'
    };
  }
}

/**
 * Fetch detailed ledger entries for a specific period
 */
export async function getWalletLedger(
  sellerId: string,
  startDate: string,
  endDate: string
): Promise<ApiResponse<WalletLedger>> {
  try {
    // Get opening balance (balance before start date)
    const { data: openingTransactions } = await supabase
      .from('wallet_transactions')
      .select('type, amount, status')
      .eq('seller_id', sellerId)
      .eq('status', 'completed')
      .lt('created_at', startDate);

    const openingBalance = (openingTransactions || []).reduce((balance, transaction) => {
      const amount = transaction.amount;
      return transaction.type === 'credit' ? balance + amount : balance - Math.abs(amount);
    }, 0);

    // Get transactions for the period
    const { data: periodTransactions } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('seller_id', sellerId)
      .eq('status', 'completed')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: true });

    // Calculate period totals
    const periodTotals = (periodTransactions || []).reduce(
      (totals, transaction) => {
        const amount = Math.abs(transaction.amount);
        if (transaction.type === 'credit') {
          totals.credits += amount;
        } else {
          totals.debits += amount;
        }
        return totals;
      },
      { credits: 0, debits: 0 }
    );

    const closingBalance = openingBalance + periodTotals.credits - periodTotals.debits;

    const ledger: WalletLedger = {
      opening_balance: openingBalance,
      closing_balance: closingBalance,
      total_credits: periodTotals.credits,
      total_debits: periodTotals.debits,
      period_start: startDate,
      period_end: endDate,
      transactions: periodTransactions || []
    };

    return {
      data: ledger,
      error: null
    };
  } catch (error) {
    console.error('Unexpected error in getWalletLedger:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch ledger'
    };
  }
}

/**
 * Get payout history for a seller
 */
export async function getPayoutHistory(
  sellerId: string,
  page?: number,
  limit?: number
): Promise<ApiResponse<PaginatedPayouts>> {
  try {
    const pageNum = page || 1;
    const limitNum = limit || 10;
    const offset = (pageNum - 1) * limitNum;

    const { data, error, count } = await supabase
      .from('payout_requests')
      .select('*', { count: 'exact' })
      .eq('seller_id', sellerId)
      .order('requested_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (error) {
      console.error('Error fetching payout history:', error);
      return {
        data: null,
        error: error.message
      };
    }

    const total = count || 0;
    const total_pages = Math.ceil(total / limitNum);

    const response: PaginatedPayouts = {
      payouts: data || [],
      total,
      page: pageNum,
      total_pages,
      has_next: pageNum < total_pages,
      has_previous: pageNum > 1
    };

    return {
      data: response,
      error: null
    };
  } catch (error) {
    console.error('Unexpected error in getPayoutHistory:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch payout history'
    };
  }
}

/**
 * Get seller's payment methods
 */
export async function getPaymentMethods(
  sellerId: string
): Promise<ApiResponse<PayoutMethod[]>> {
  try {
    const { data, error } = await supabase
      .from('seller_payment_methods')
      .select('*')
      .eq('seller_id', sellerId)
      .eq('status', 'active')
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching payment methods:', error);
      return {
        data: null,
        error: error.message
      };
    }

    return {
      data: data || [],
      error: null
    };
  } catch (error) {
    console.error('Unexpected error in getPaymentMethods:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch payment methods'
    };
  }
}

/**
 * Add a new payment method for payouts
 */
export async function addPaymentMethod(
  sellerId: string,
  method: Omit<PayoutMethod, 'id' | 'seller_id' | 'created_at'>
): Promise<ApiResponse<PayoutMethod>> {
  try {
    const { data, error } = await supabase
      .from('seller_payment_methods')
      .insert({
        seller_id: sellerId,
        ...method,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding payment method:', error);
      return {
        data: null,
        error: error.message
      };
    }

    return {
      data,
      error: null
    };
  } catch (error) {
    console.error('Unexpected error in addPaymentMethod:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to add payment method'
    };
  }
}

// ============================================================================
// MOCK DATA FOR DEVELOPMENT/TESTING
// ============================================================================

export const mockWalletSummary: WalletSummary = {
  available_balance: 25400,
  pending_balance: 3810,
  total_earnings: 155000,
  total_payouts: 129600,
  total_refunds: 3200,
  total_commission: 23250,
  total_fees: 1550,
  last_payout_date: '2024-01-10T14:30:00Z',
  next_payout_eligible: true,
  payout_hold_reason: null,
  currency: 'SAR'
};

export const mockTransactions: WalletTransaction[] = [
  {
    id: 'txn-001',
    seller_id: 'seller-123',
    type: 'credit',
    reference_id: 'order-7894',
    amount: 2450,
    description: 'Payment for order #ORD-7894',
    status: 'completed',
    metadata: { order_number: 'ORD-7894' },
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z'
  },
  {
    id: 'txn-002',
    seller_id: 'seller-123',
    type: 'payout',
    reference_id: 'payout-001',
    amount: -10000,
    description: 'Payout to bank account',
    status: 'completed',
    metadata: { reference: 'PAYOUT-001', method: 'bank_transfer' },
    created_at: '2024-01-10T14:30:00Z',
    updated_at: '2024-01-10T14:30:00Z'
  },
  {
    id: 'txn-003',
    seller_id: 'seller-123',
    type: 'commission',
    reference_id: 'order-7893',
    amount: -367.5,
    description: 'Platform commission for order #ORD-7893',
    status: 'completed',
    metadata: { commission_rate: 15, order_total: 2450 },
    created_at: '2024-01-15T11:45:00Z',
    updated_at: '2024-01-15T11:45:00Z'
  },
  {
    id: 'txn-004',
    seller_id: 'seller-123',
    type: 'credit',
    reference_id: 'order-7892',
    amount: 1890,
    description: 'Payment for order #ORD-7892',
    status: 'completed',
    metadata: { order_number: 'ORD-7892' },
    created_at: '2024-01-14T09:15:00Z',
    updated_at: '2024-01-14T09:15:00Z'
  },
  {
    id: 'txn-005',
    seller_id: 'seller-123',
    type: 'refund',
    reference_id: 'order-7889',
    amount: -850,
    description: 'Refund for order #ORD-7889',
    status: 'completed',
    metadata: { reason: 'Customer request', order_number: 'ORD-7889' },
    created_at: '2024-01-13T16:20:00Z',
    updated_at: '2024-01-13T16:20:00Z'
  }
];

export const mockPayouts: PayoutRequest[] = [
  {
    id: 'payout-001',
    seller_id: 'seller-123',
    amount: 9750,
    requested_amount: 10000,
    fee_amount: 250,
    net_amount: 9750,
    status: 'paid',
    payment_method: 'bank_transfer',
    payment_details: { bank_name: 'Al Rajhi Bank', account_number: '****1234' },
    reference_number: 'PAYOUT-20240110-001',
    requested_at: '2024-01-08T10:30:00Z',
    processed_at: '2024-01-09T14:15:00Z',
    completed_at: '2024-01-10T14:30:00Z',
    rejection_reason: null,
    notes: 'Regular monthly payout'
  },
  {
    id: 'payout-002',
    seller_id: 'seller-123',
    amount: 4900,
    requested_amount: 5000,
    fee_amount: 100,
    net_amount: 4900,
    status: 'processing',
    payment_method: 'bank_transfer',
    payment_details: { bank_name: 'Al Rajhi Bank', account_number: '****1234' },
    reference_number: 'PAYOUT-20240115-001',
    requested_at: '2024-01-15T11:00:00Z',
    processed_at: '2024-01-15T11:05:00Z',
    completed_at: null,
    rejection_reason: null,
    notes: 'Additional payout request'
  }
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: string = WALLET_CONFIG.CURRENCY): string {
  return new Intl.NumberFormat('en-SA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Get transaction type label
 */
export function getTransactionTypeLabel(type: TransactionType): string {
  const labels: Record<TransactionType, string> = {
    credit: 'Credit',
    debit: 'Debit',
    payout: 'Payout',
    refund: 'Refund',
    commission: 'Commission',
    fee: 'Fee',
    adjustment: 'Adjustment'
  };
  return labels[type] || type;
}

/**
 * Get transaction type color
 */
export function getTransactionTypeColor(type: TransactionType): string {
  const colors: Record<TransactionType, string> = {
    credit: 'text-green-600',
    debit: 'text-red-600',
    payout: 'text-blue-600',
    refund: 'text-orange-600',
    commission: 'text-purple-600',
    fee: 'text-yellow-600',
    adjustment: 'text-gray-600'
  };
  return colors[type] || 'text-gray-600';
}

/**
 * Get payout status color
 */
export function getPayoutStatusColor(status: PayoutStatus): string {
  const colors: Record<PayoutStatus, string> = {
    requested: 'text-yellow-600',
    approved: 'text-blue-600',
    processing: 'text-purple-600',
    paid: 'text-green-600',
    rejected: 'text-red-600',
    cancelled: 'text-gray-600'
  };
  return colors[status] || 'text-gray-600';
}

/**
 * Calculate fee for a payout amount
 */
export function calculatePayoutFee(amount: number): number {
  const fee = (amount * WALLET_CONFIG.PAYOUT_FEE_PERCENTAGE) / 100;
  return Math.max(fee, 10); // Minimum fee of 10 SAR
}

/**
 * Get estimated payout date based on requested date
 */
export function getEstimatedPayoutDate(requestedDate: string): string {
  const date = new Date(requestedDate);
  date.setDate(date.getDate() + WALLET_CONFIG.PAYOUT_PROCESSING_DAYS);
  return date.toISOString();
}

/**
 * Check if a transaction is a credit (positive amount)
 */
export function isCreditTransaction(type: TransactionType, amount: number): boolean {
  const creditTypes: TransactionType[] = ['credit', 'adjustment'];
  return creditTypes.includes(type) || amount > 0;
}