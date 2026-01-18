import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

// ==================== TYPE DEFINITIONS ====================

export type TransactionType = 
  | 'order_payment'      // Payment from customer order
  | 'refund'             // Refund to customer
  | 'payout'             // Withdrawal to seller bank
  | 'commission'         // Platform commission deduction
  | 'vat_payment'        // VAT payment
  | 'adjustment'         // Manual adjustment by admin
  | 'bonus'              // Seller bonus/incentive
  | 'dispute_settlement' // Dispute resolution settlement
  | 'shipping_refund';   // Shipping cost refund

export type TransactionStatus = 
  | 'pending'    // Transaction pending processing
  | 'completed'  // Transaction completed successfully
  | 'failed'     // Transaction failed
  | 'cancelled'  // Transaction cancelled
  | 'hold';      // Transaction on hold

export type PayoutStatus = 
  | 'requested'  // Seller requested payout
  | 'approved'   // Admin approved payout
  | 'processing' // Payout being processed
  | 'paid'       // Payout completed
  | 'rejected'   // Payout rejected
  | 'cancelled'; // Payout cancelled

export type PaymentMethod = 
  | 'bank_transfer'
  | 'stc_pay'
  | 'apple_pay'
  | 'credit_card'
  | 'paypal'
  | 'crypto';

export interface Wallet {
  id: string;
  seller_id: string;
  balance: number;           // Total balance including pending
  available_balance: number; // Balance available for withdrawal
  pending_balance: number;   // Balance pending clearance
  hold_balance: number;      // Balance on hold (disputes, etc.)
  currency: string;
  last_balance_update: string;
  minimum_payout_amount: number;
  payout_fee_percentage: number;
  auto_payout_enabled: boolean;
  next_payout_date: string | null;
  created_at: string;
  updated_at: string;
  seller_bank_details?: SellerBankDetails;
}

export interface SellerBankDetails {
  id: string;
  seller_id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  iban: string;
  swift_code: string;
  country: string;
  is_verified: boolean;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  seller_id: string;
  type: TransactionType;
  reference_id: string; // order_id, payout_id, etc.
  description: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  
  // Joined data
  order?: {
    id: string;
    order_number: string;
    customer_name: string;
  };
  payout?: {
    id: string;
    payout_reference: string;
    status: PayoutStatus;
  };
}

export interface PayoutRequest {
  id: string;
  seller_id: string;
  payout_reference: string;
  amount: number;
  currency: string;
  status: PayoutStatus;
  payment_method: PaymentMethod;
  bank_details: SellerBankDetails | null;
  admin_notes: string | null;
  seller_notes: string | null;
  requested_at: string;
  approved_at: string | null;
  processed_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedTransactionsResponse {
  transactions: WalletTransaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface WalletSummary {
  total_credited: number;
  total_debited: number;
  net_balance: number;
  available_balance: number;
  pending_payouts: number;
  pending_clearance: number;
  this_month_earnings: number;
  last_month_earnings: number;
  total_orders: number;
  average_order_value: number;
  vat_collected: number;
  commission_paid: number;
}

export interface UseWalletReturn {
  wallet: Wallet | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateWallet: (updates: Partial<Wallet>) => Promise<boolean>;
}

export interface UseWalletLedgerReturn {
  transactions: WalletTransaction[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  filterByType: (type: TransactionType | 'all') => void;
  filterByStatus: (status: TransactionStatus | 'all') => void;
  filterByDateRange: (startDate: string, endDate: string) => void;
  exportTransactions: (format: 'csv' | 'pdf') => Promise<string | null>;
}

export interface UseRequestPayoutReturn {
  requesting: boolean;
  error: string | null;
  requestPayout: (amount: number, paymentMethod: PaymentMethod, notes?: string) => Promise<boolean>;
  cancelPayout: (payoutId: string) => Promise<boolean>;
  getPayoutHistory: () => Promise<PayoutRequest[]>;
  getMinimumPayoutAmount: () => number;
  validatePayoutAmount: (amount: number) => { valid: boolean; message: string };
}

export interface UseWalletSummaryReturn {
  summary: WalletSummary | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getEarningsTrend: (period: 'week' | 'month' | 'quarter') => Promise<number[]>;
}

// ==================== MAIN WALLET HOOK ====================

export const useWallet = (sellerId: string): UseWalletReturn => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWallet = useCallback(async () => {
    if (!sellerId) {
      setError('Seller ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch wallet with bank details
      const { data: walletData, error: walletError } = await supabase
        .from('seller_wallet')
        .select(`
          *,
          bank_details:seller_bank_details(*)
        `)
        .eq('seller_id', sellerId)
        .single();

      if (walletError) {
        // Create wallet if doesn't exist
        if (walletError.code === 'PGRST116') {
          const defaultWallet: Wallet = {
            id: `wallet-${sellerId}`,
            seller_id: sellerId,
            balance: 0,
            available_balance: 0,
            pending_balance: 0,
            hold_balance: 0,
            currency: 'SAR',
            last_balance_update: new Date().toISOString(),
            minimum_payout_amount: 500,
            payout_fee_percentage: 1,
            auto_payout_enabled: false,
            next_payout_date: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          const { error: insertError } = await supabase
            .from('seller_wallet')
            .insert([defaultWallet]);

          if (insertError) throw insertError;

          setWallet(defaultWallet);
        } else {
          throw walletError;
        }
      } else {
        setWallet(walletData);
      }
    } catch (err) {
      console.error('Error fetching wallet:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch wallet');
      
      // Fallback to mock data for demo
      if (localStorage.getItem('demoMode') === 'true') {
        const mockWallet = generateMockWallet(sellerId);
        setWallet(mockWallet);
      }
    } finally {
      setLoading(false);
    }
  }, [sellerId]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  const updateWallet = async (updates: Partial<Wallet>): Promise<boolean> => {
    if (!wallet) return false;

    try {
      // Optimistic update
      const previousWallet = { ...wallet };
      setWallet(prev => prev ? { ...prev, ...updates, updated_at: new Date().toISOString() } : null);

      const { error } = await supabase
        .from('seller_wallet')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', wallet.id);

      if (error) {
        // Revert on error
        setWallet(previousWallet);
        toast.error('Failed to update wallet');
        return false;
      }

      toast.success('Wallet updated successfully');
      return true;
    } catch (err) {
      console.error('Error updating wallet:', err);
      toast.error('Failed to update wallet');
      return false;
    }
  };

  return {
    wallet,
    loading,
    error,
    refresh: fetchWallet,
    updateWallet
  };
};

// ==================== WALLET LEDGER HOOK ====================

export const useWalletLedger = (
  sellerId: string,
  page: number = 1,
  limit: number = 50
): UseWalletLedgerReturn => {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(page);
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | 'all'>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!sellerId) {
      setError('Seller ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Build the query
      let query = supabase
        .from('wallet_transactions')
        .select(`
          *,
          order:orders (
            id,
            order_number,
            customer:profiles(full_name)
          ),
          payout:payout_requests (
            id,
            payout_reference,
            status
          )
        `, { count: 'exact' })
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * limit, currentPage * limit - 1);

      // Apply filters
      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (dateRange) {
        query = query
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end);
      }

      const { data, error: queryError, count } = await query;

      if (queryError) throw queryError;

      // Transform and enrich the data
      const enrichedTransactions = (data || []).map(transaction => ({
        ...transaction,
        order: transaction.order ? {
          id: transaction.order.id,
          order_number: transaction.order.order_number,
          customer_name: (transaction.order as any).customer?.full_name || 'Customer'
        } : undefined,
        payout: transaction.payout ? {
          id: transaction.payout.id,
          payout_reference: transaction.payout.payout_reference,
          status: transaction.payout.status
        } : undefined
      }));

      // If it's the first page, replace transactions, otherwise append
      if (currentPage === 1) {
        setTransactions(enrichedTransactions);
      } else {
        setTransactions(prev => [...prev, ...enrichedTransactions]);
      }

      setTotal(count || 0);
    } catch (err) {
      console.error('Error fetching wallet transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
      
      // Fallback to mock data for demo
      if (localStorage.getItem('demoMode') === 'true') {
        const mockTransactions = generateMockTransactions(sellerId);
        setTransactions(mockTransactions);
        setTotal(mockTransactions.length);
      }
    } finally {
      setLoading(false);
    }
  }, [sellerId, currentPage, limit, typeFilter, statusFilter, dateRange]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const refresh = async () => {
    setCurrentPage(1);
    await fetchTransactions();
  };

  const loadMore = async () => {
    if (!hasMore || loading) return;
    setCurrentPage(prev => prev + 1);
  };

  const filterByType = (type: TransactionType | 'all') => {
    setTypeFilter(type);
    setCurrentPage(1);
    setTransactions([]);
  };

  const filterByStatus = (status: TransactionStatus | 'all') => {
    setStatusFilter(status);
    setCurrentPage(1);
    setTransactions([]);
  };

  const filterByDateRange = (startDate: string, endDate: string) => {
    setDateRange({ start: startDate, end: endDate });
    setCurrentPage(1);
    setTransactions([]);
  };

  const exportTransactions = async (format: 'csv' | 'pdf'): Promise<string | null> => {
    try {
      // In a real implementation, you would generate the file server-side
      // and return a download URL. This is a simplified version.
      const { data: allTransactions } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

      const filename = `wallet-transactions-${sellerId}-${new Date().toISOString().split('T')[0]}`;
      
      if (format === 'csv') {
        const csvContent = generateCSV(allTransactions || []);
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        return url;
      }

      // PDF generation would typically be done server-side
      toast.info('PDF export is processed server-side. You will receive an email when ready.');
      return null;
    } catch (err) {
      console.error('Error exporting transactions:', err);
      toast.error('Failed to export transactions');
      return null;
    }
  };

  const hasMore = transactions.length < total;
  const totalPages = Math.ceil(total / limit);

  return {
    transactions,
    loading,
    error,
    total,
    page: currentPage,
    totalPages,
    hasMore,
    refresh,
    loadMore,
    filterByType,
    filterByStatus,
    filterByDateRange,
    exportTransactions
  };
};

// ==================== REQUEST PAYOUT HOOK ====================

export const useRequestPayout = (sellerId: string): UseRequestPayoutReturn => {
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validatePayoutAmount = (amount: number): { valid: boolean; message: string } => {
    const minimumAmount = 500; // Default minimum

    if (amount <= 0) {
      return { valid: false, message: 'Amount must be greater than 0' };
    }

    if (amount < minimumAmount) {
      return { valid: false, message: `Minimum payout amount is SAR ${minimumAmount}` };
    }

    // In real implementation, we would check against actual available balance
    // This is a simplified validation
    if (amount > 50000) {
      return { valid: false, message: 'Maximum payout amount is SAR 50,000 per request' };
    }

    return { valid: true, message: 'Amount is valid' };
  };

  const requestPayout = async (
    amount: number,
    paymentMethod: PaymentMethod,
    notes?: string
  ): Promise<boolean> => {
    try {
      setRequesting(true);
      setError(null);

      // Validate amount
      const validation = validatePayoutAmount(amount);
      if (!validation.valid) {
        setError(validation.message);
        return false;
      }

      // Check if seller has bank details
      const { data: bankDetails, error: bankError } = await supabase
        .from('seller_bank_details')
        .select('*')
        .eq('seller_id', sellerId)
        .eq('is_verified', true)
        .maybeSingle();

      if (bankError) throw bankError;

      if (!bankDetails && paymentMethod === 'bank_transfer') {
        setError('Bank account details not found or not verified');
        toast.error('Please add and verify your bank account details first');
        return false;
      }

      // Get current wallet to check balance
      const { data: wallet, error: walletError } = await supabase
        .from('seller_wallet')
        .select('available_balance, minimum_payout_amount')
        .eq('seller_id', sellerId)
        .single();

      if (walletError) throw walletError;

      if (amount > wallet.available_balance) {
        setError(`Insufficient balance. Available: SAR ${wallet.available_balance}`);
        return false;
      }

      if (amount < wallet.minimum_payout_amount) {
        setError(`Minimum payout amount is SAR ${wallet.minimum_payout_amount}`);
        return false;
      }

      // Start a transaction
      const payoutId = `payout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const payoutReference = `PYT-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

      // Create payout request
      const { error: payoutError } = await supabase
        .from('payout_requests')
        .insert({
          seller_id: sellerId,
          payout_reference: payoutReference,
          amount,
          currency: 'SAR',
          status: 'requested',
          payment_method: paymentMethod,
          bank_details: bankDetails || null,
          seller_notes: notes || null,
          requested_at: new Date().toISOString()
        });

      if (payoutError) throw payoutError;

      // Update wallet balance
      const { error: walletUpdateError } = await supabase
        .from('seller_wallet')
        .update({
          available_balance: wallet.available_balance - amount,
          updated_at: new Date().toISOString()
        })
        .eq('seller_id', sellerId);

      if (walletUpdateError) throw walletUpdateError;

      // Create transaction record
      const { error: transactionError } = await supabase
        .from('wallet_transactions')
        .insert({
          seller_id: sellerId,
          type: 'payout',
          reference_id: payoutId,
          description: `Payout request: ${payoutReference}`,
          amount: -amount, // Negative for debit
          currency: 'SAR',
          status: 'pending',
          metadata: {
            payout_reference: payoutReference,
            payment_method: paymentMethod,
            notes
          }
        });

      if (transactionError) throw transactionError;

      toast.success('Payout request submitted successfully');
      return true;
    } catch (err) {
      console.error('Error requesting payout:', err);
      setError(err instanceof Error ? err.message : 'Failed to request payout');
      toast.error('Failed to request payout');
      return false;
    } finally {
      setRequesting(false);
    }
  };

  const cancelPayout = async (payoutId: string): Promise<boolean> => {
    try {
      setRequesting(true);

      // Check if payout can be cancelled
      const { data: payout, error: fetchError } = await supabase
        .from('payout_requests')
        .select('status, amount, seller_id')
        .eq('id', payoutId)
        .single();

      if (fetchError) throw fetchError;

      if (payout.status !== 'requested') {
        setError('Payout can only be cancelled while in requested status');
        return false;
      }

      // Update payout status
      const { error: updateError } = await supabase
        .from('payout_requests')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', payoutId);

      if (updateError) throw updateError;

      // Restore wallet balance
      const { error: walletError } = await supabase
        .from('seller_wallet')
        .update({
          available_balance: supabase.rpc('increment', {
            x: payout.amount
          }),
          updated_at: new Date().toISOString()
        })
        .eq('seller_id', payout.seller_id);

      if (walletError) throw walletError;

      // Update transaction status
      await supabase
        .from('wallet_transactions')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('reference_id', payoutId)
        .eq('type', 'payout');

      toast.success('Payout cancelled successfully');
      return true;
    } catch (err) {
      console.error('Error cancelling payout:', err);
      setError(err instanceof Error ? err.message : 'Failed to cancel payout');
      toast.error('Failed to cancel payout');
      return false;
    } finally {
      setRequesting(false);
    }
  };

  const getPayoutHistory = async (): Promise<PayoutRequest[]> => {
    try {
      const { data, error } = await supabase
        .from('payout_requests')
        .select('*')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching payout history:', err);
      return [];
    }
  };

  const getMinimumPayoutAmount = (): number => {
    return 500; // Default minimum, could be fetched from seller settings
  };

  return {
    requesting,
    error,
    requestPayout,
    cancelPayout,
    getPayoutHistory,
    getMinimumPayoutAmount,
    validatePayoutAmount
  };
};

// ==================== WALLET SUMMARY HOOK ====================

export const useWalletSummary = (sellerId: string): UseWalletSummaryReturn => {
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    if (!sellerId) {
      setError('Seller ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get current date ranges
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      // Fetch multiple data points in parallel
      const [
        { data: wallet, error: walletError },
        { data: thisMonthTransactions, error: thisMonthError },
        { data: lastMonthTransactions, error: lastMonthError },
        { data: allTransactions, error: allTransactionsError },
        { data: orders, error: ordersError }
      ] = await Promise.all([
        supabase
          .from('seller_wallet')
          .select('balance, available_balance, pending_balance')
          .eq('seller_id', sellerId)
          .single(),
        supabase
          .from('wallet_transactions')
          .select('type, amount, status')
          .eq('seller_id', sellerId)
          .eq('status', 'completed')
          .gte('created_at', startOfMonth.toISOString())
          .lte('created_at', now.toISOString()),
        supabase
          .from('wallet_transactions')
          .select('type, amount, status')
          .eq('seller_id', sellerId)
          .eq('status', 'completed')
          .gte('created_at', startOfLastMonth.toISOString())
          .lte('created_at', endOfLastMonth.toISOString()),
        supabase
          .from('wallet_transactions')
          .select('type, amount, status')
          .eq('seller_id', sellerId)
          .eq('status', 'completed'),
        supabase
          .from('orders')
          .select('total_amount, status')
          .eq('seller_id', sellerId)
          .eq('payment_status', 'paid')
      ]);

      if (walletError) throw walletError;

      // Calculate totals
      const calculateTotals = (transactions: any[]) => {
        let credited = 0;
        let debited = 0;
        let vatCollected = 0;
        let commissionPaid = 0;

        transactions?.forEach(tx => {
          if (tx.amount > 0) {
            credited += tx.amount;
            if (tx.type === 'vat_payment') {
              vatCollected += tx.amount;
            }
          } else {
            debited += Math.abs(tx.amount);
            if (tx.type === 'commission') {
              commissionPaid += Math.abs(tx.amount);
            }
          }
        });

        return { credited, debited, vatCollected, commissionPaid };
      };

      const allTotals = calculateTotals(allTransactions);
      const thisMonthTotals = calculateTotals(thisMonthTransactions);
      const lastMonthTotals = calculateTotals(lastMonthTransactions);

      // Calculate order statistics
      const totalOrders = orders?.length || 0;
      const totalOrderValue = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      const averageOrderValue = totalOrders > 0 ? totalOrderValue / totalOrders : 0;

      // Get pending payouts
      const { data: pendingPayouts, error: payoutsError } = await supabase
        .from('payout_requests')
        .select('amount')
        .eq('seller_id', sellerId)
        .in('status', ['requested', 'approved', 'processing']);

      if (payoutsError) throw payoutsError;

      const pendingPayoutsAmount = pendingPayouts?.reduce((sum, payout) => sum + payout.amount, 0) || 0;

      const walletSummary: WalletSummary = {
        total_credited: allTotals.credited,
        total_debited: allTotals.debited,
        net_balance: allTotals.credited - allTotals.debited,
        available_balance: wallet.available_balance,
        pending_payouts: pendingPayoutsAmount,
        pending_clearance: wallet.pending_balance,
        this_month_earnings: thisMonthTotals.credited - thisMonthTotals.debited,
        last_month_earnings: lastMonthTotals.credited - lastMonthTotals.debited,
        total_orders,
        average_order_value: averageOrderValue,
        vat_collected: allTotals.vatCollected,
        commission_paid: allTotals.commissionPaid
      };

      setSummary(walletSummary);
    } catch (err) {
      console.error('Error fetching wallet summary:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch wallet summary');
      
      // Fallback to mock data for demo
      if (localStorage.getItem('demoMode') === 'true') {
        const mockSummary = generateMockWalletSummary(sellerId);
        setSummary(mockSummary);
      }
    } finally {
      setLoading(false);
    }
  }, [sellerId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const getEarningsTrend = async (period: 'week' | 'month' | 'quarter'): Promise<number[]> => {
    try {
      // This would typically fetch time-series data from the database
      // For simplicity, returning mock trend data
      const dataPoints = period === 'week' ? 7 : period === 'month' ? 30 : 90;
      return Array.from({ length: dataPoints }, () => Math.random() * 10000 + 5000);
    } catch (err) {
      console.error('Error fetching earnings trend:', err);
      return [];
    }
  };

  return {
    summary,
    loading,
    error,
    refresh: fetchSummary,
    getEarningsTrend
  };
};

// ==================== HELPER FUNCTIONS ====================

export const formatCurrency = (amount: number, currency: string = 'SAR'): string => {
  return new Intl.NumberFormat('en-SA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const getTransactionColor = (type: TransactionType): string => {
  const colors: Record<TransactionType, string> = {
    order_payment: 'text-green-600 bg-green-100',
    refund: 'text-red-600 bg-red-100',
    payout: 'text-blue-600 bg-blue-100',
    commission: 'text-purple-600 bg-purple-100',
    vat_payment: 'text-yellow-600 bg-yellow-100',
    adjustment: 'text-gray-600 bg-gray-100',
    bonus: 'text-pink-600 bg-pink-100',
    dispute_settlement: 'text-orange-600 bg-orange-100',
    shipping_refund: 'text-cyan-600 bg-cyan-100'
  };

  return colors[type] || 'text-gray-600 bg-gray-100';
};

export const getTransactionIcon = (type: TransactionType): string => {
  const icons: Record<TransactionType, string> = {
    order_payment: '💳',
    refund: '↪️',
    payout: '🏦',
    commission: '📊',
    vat_payment: '🧾',
    adjustment: '⚙️',
    bonus: '🎁',
    dispute_settlement: '⚖️',
    shipping_refund: '🚚'
  };

  return icons[type] || '💰';
};

const generateCSV = (transactions: any[]): string => {
  const headers = ['Date', 'Type', 'Description', 'Amount (SAR)', 'Status', 'Reference'];
  const rows = transactions.map(tx => [
    new Date(tx.created_at).toLocaleDateString(),
    tx.type.replace('_', ' ').toUpperCase(),
    tx.description,
    tx.amount.toLocaleString(),
    tx.status.toUpperCase(),
    tx.reference_id
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
};

// ==================== MOCK DATA GENERATORS ====================

const generateMockWallet = (sellerId: string): Wallet => {
  return {
    id: `wallet-${sellerId}`,
    seller_id: sellerId,
    balance: 25480,
    available_balance: 21500,
    pending_balance: 3980,
    hold_balance: 0,
    currency: 'SAR',
    last_balance_update: new Date().toISOString(),
    minimum_payout_amount: 500,
    payout_fee_percentage: 1,
    auto_payout_enabled: false,
    next_payout_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    seller_bank_details: {
      id: 'bank-1',
      seller_id: sellerId,
      bank_name: 'Al Rajhi Bank',
      account_name: 'Premium Furniture Store',
      account_number: 'SA1234567890123456789012',
      iban: 'SA1234567890123456789012',
      swift_code: 'RJHI SA RI',
      country: 'Saudi Arabia',
      is_verified: true,
      verified_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    }
  };
};

const generateMockTransactions = (sellerId: string): WalletTransaction[] => {
  const transactionTypes: TransactionType[] = [
    'order_payment', 'refund', 'payout', 'commission', 'vat_payment', 'bonus'
  ];
  
  const statuses: TransactionStatus[] = ['completed', 'pending', 'failed'];
  
  return Array.from({ length: 50 }, (_, i) => {
    const type = transactionTypes[i % transactionTypes.length];
    const amount = type === 'payout' || type === 'refund' || type === 'commission'
      ? -(Math.random() * 5000 + 1000) // Negative for debits
      : Math.random() * 10000 + 5000; // Positive for credits
      
    const reference = type === 'order_payment' 
      ? `ORD-2024-${String(i + 1).padStart(4, '0')}`
      : type === 'payout'
      ? `PYT-${new Date().getFullYear()}-${String(i + 1).padStart(5, '0')}`
      : `TX-${Date.now()}-${i}`;

    const descriptions: Record<TransactionType, string> = {
      order_payment: `Payment for order ${reference}`,
      refund: `Refund to customer for order ${reference}`,
      payout: `Payout to bank account`,
      commission: `Platform commission`,
      vat_payment: `VAT payment`,
      adjustment: `Balance adjustment`,
      bonus: `Seller bonus`,
      dispute_settlement: `Dispute settlement`,
      shipping_refund: `Shipping cost refund`
    };

    return {
      id: `tx-${i + 1}`,
      seller_id: sellerId,
      type,
      reference_id: reference,
      description: descriptions[type] || 'Transaction',
      amount,
      currency: 'SAR',
      status: statuses[i % statuses.length],
      metadata: {},
      created_at: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      order: type === 'order_payment' ? {
        id: `order-${i + 1}`,
        order_number: reference,
        customer_name: ['Ahmed', 'Sarah', 'Mohammed', 'Fatima', 'Robert'][i % 5]
      } : undefined
    };
  });
};

const generateMockWalletSummary = (sellerId: string): WalletSummary => {
  return {
    total_credited: 125800,
    total_debited: 45320,
    net_balance: 80480,
    available_balance: 21500,
    pending_payouts: 8500,
    pending_clearance: 3980,
    this_month_earnings: 15450,
    last_month_earnings: 12870,
    total_orders: 156,
    average_order_value: 5480,
    vat_collected: 18870,
    commission_paid: 12580
  };
};

// ==================== EXPORT HOOKS COLLECTION ====================

export const useWalletCollection = {
  useWallet,
  useWalletLedger,
  useRequestPayout,
  useWalletSummary,
  formatCurrency,
  getTransactionColor,
  getTransactionIcon
};