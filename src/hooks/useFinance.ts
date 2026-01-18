// src/hooks/useFinance.ts
import { useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

// ============================================
// TYPE DEFINITIONS
// ============================================

export enum TransactionType {
  SALE = 'sale',
  REFUND = 'refund',
  PAYOUT = 'payout',
  COMMISSION = 'commission',
  VAT = 'vat',
  ADJUSTMENT = 'adjustment'
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum PayoutStatus {
  REQUESTED = 'requested',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PAID = 'paid',
  PROCESSING = 'processing'
}

export interface FinanceTransaction {
  id: string;
  seller_id: string;
  type: TransactionType;
  order_id?: string;
  payout_request_id?: string;
  amount: number;
  currency: string;
  description: string;
  status: TransactionStatus;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface FinanceSummary {
  total_earnings: number;
  total_paid: number;
  pending_balance: number;
  wallet_balance: number;
  available_for_payout: number;
  this_month_earnings: number;
  last_month_earnings: number;
  vat_obligation: number;
  commission_deducted: number;
  total_transactions: number;
  updated_at: string;
}

export interface PayoutRequest {
  id: string;
  seller_id: string;
  amount: number;
  currency: string;
  status: PayoutStatus;
  payment_method: 'bank_transfer' | 'paypal' | 'stripe';
  bank_details?: {
    account_number: string;
    bank_name: string;
    iban?: string;
  };
  requested_at: string;
  processed_at?: string;
  processed_by?: string;
  notes?: string;
  transactions: FinanceTransaction[];
}

export interface DailyEarning {
  date: string;
  total_earnings: number;
  total_sales: number;
  total_refunds: number;
  total_commissions: number;
  total_vat: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================
// MAIN HOOK - FINANCE SUMMARY
// ============================================

interface UseFinanceSummaryProps {
  sellerId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const useFinanceSummary = ({ 
  sellerId, 
  autoRefresh = true, 
  refreshInterval = 30000 
}: UseFinanceSummaryProps) => {
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSummary = useCallback(async () => {
    if (!sellerId) {
      setError('Seller ID is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Calculate date ranges for monthly summaries
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

      // Fetch wallet balance
      const { data: wallet, error: walletError } = await supabase
        .from('seller_wallet')
        .select('balance, pending_payout, available_balance')
        .eq('seller_id', sellerId)
        .single();

      if (walletError && walletError.code !== 'PGRST116') {
        throw walletError;
      }

      // Fetch total earnings (completed sales only)
      const { data: earningsData, error: earningsError } = await supabase
        .rpc('get_seller_earnings_summary', {
          p_seller_id: sellerId
        });

      if (earningsError) {
        // Fallback to manual calculation if RPC fails
        const { data: transactions } = await supabase
          .from('finance_transactions')
          .select('amount, type, status, created_at')
          .eq('seller_id', sellerId)
          .eq('status', TransactionStatus.COMPLETED);

        const totalEarnings = transactions
          ?.filter(t => t.type === TransactionType.SALE)
          .reduce((sum, t) => sum + t.amount, 0) || 0;

        const totalPaid = transactions
          ?.filter(t => t.type === TransactionType.PAYOUT && t.status === TransactionStatus.COMPLETED)
          .reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;

        const commissionDeducted = transactions
          ?.filter(t => t.type === TransactionType.COMMISSION)
          .reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;

        const thisMonthEarnings = transactions
          ?.filter(t => 
            t.type === TransactionType.SALE && 
            new Date(t.created_at) >= new Date(thisMonthStart)
          )
          .reduce((sum, t) => sum + t.amount, 0) || 0;

        const lastMonthEarnings = transactions
          ?.filter(t => 
            t.type === TransactionType.SALE && 
            new Date(t.created_at) >= new Date(lastMonthStart) &&
            new Date(t.created_at) <= new Date(lastMonthEnd)
          )
          .reduce((sum, t) => sum + t.amount, 0) || 0;

        const vatObligation = totalEarnings * 0.15; // 15% VAT for KSA

        const result: FinanceSummary = {
          total_earnings: totalEarnings,
          total_paid: totalPaid,
          pending_balance: (wallet?.pending_payout || 0),
          wallet_balance: (wallet?.balance || 0),
          available_for_payout: (wallet?.available_balance || 0),
          this_month_earnings: thisMonthEarnings,
          last_month_earnings: lastMonthEarnings,
          vat_obligation: vatObligation,
          commission_deducted: commissionDeducted,
          total_transactions: transactions?.length || 0,
          updated_at: new Date().toISOString()
        };

        setSummary(result);
      } else if (earningsData) {
        // Use RPC result
        const result: FinanceSummary = {
          total_earnings: earningsData.total_earnings || 0,
          total_paid: earningsData.total_paid || 0,
          pending_balance: wallet?.pending_payout || 0,
          wallet_balance: wallet?.balance || 0,
          available_for_payout: wallet?.available_balance || 0,
          this_month_earnings: earningsData.this_month_earnings || 0,
          last_month_earnings: earningsData.last_month_earnings || 0,
          vat_obligation: earningsData.vat_obligation || 0,
          commission_deducted: earningsData.commission_deducted || 0,
          total_transactions: earningsData.total_transactions || 0,
          updated_at: new Date().toISOString()
        };
        setSummary(result);
      }

      // If no wallet exists, create one
      if (!wallet) {
        await supabase
          .from('seller_wallet')
          .insert({
            seller_id: sellerId,
            balance: 0,
            pending_payout: 0,
            available_balance: 0,
            currency: 'SAR'
          });
      }
    } catch (err) {
      console.error('Error fetching finance summary:', err);
      setError(err instanceof Error ? err.message : 'Failed to load finance summary');
      toast({
        title: 'Error',
        description: 'Failed to load finance summary',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [sellerId, toast]);

  // Auto-refresh
  useEffect(() => {
    fetchSummary();

    if (autoRefresh) {
      const interval = setInterval(fetchSummary, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchSummary, autoRefresh, refreshInterval]);

  // Mock data for development/demo
  const mockSummary = useMemo((): FinanceSummary => ({
    total_earnings: 155000,
    total_paid: 105000,
    pending_balance: 25000,
    wallet_balance: 25400,
    available_for_payout: 25400,
    this_month_earnings: 25500,
    last_month_earnings: 30000,
    vat_obligation: 23250,
    commission_deducted: 23250,
    total_transactions: 156,
    updated_at: new Date().toISOString()
  }), []);

  return {
    summary: summary || mockSummary,
    loading,
    error,
    refresh: fetchSummary,
    isMock: !summary
  };
};

// ============================================
// FINANCE TRANSACTIONS HOOK
// ============================================

interface UseFinanceTransactionsProps {
  sellerId: string;
  page?: number;
  limit?: number;
  type?: TransactionType;
  status?: TransactionStatus;
  startDate?: string;
  endDate?: string;
}

export const useFinanceTransactions = ({
  sellerId,
  page = 1,
  limit = 20,
  type,
  status,
  startDate,
  endDate
}: UseFinanceTransactionsProps) => {
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page,
    limit,
    total: 0,
    totalPages: 0
  });

  const fetchTransactions = useCallback(async () => {
    if (!sellerId) {
      setError('Seller ID is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Build query
      let query = supabase
        .from('finance_transactions')
        .select('*', { count: 'exact' })
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

      // Apply filters
      if (type) query = query.eq('type', type);
      if (status) query = query.eq('status', status);
      if (startDate) query = query.gte('created_at', startDate);
      if (endDate) query = query.lte('created_at', endDate);

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error: queryError, count } = await query;

      if (queryError) throw queryError;

      // Transform data to ensure proper typing
      const typedData = (data || []).map(transaction => ({
        ...transaction,
        type: transaction.type as TransactionType,
        status: transaction.status as TransactionStatus,
        currency: transaction.currency || 'SAR'
      })) as FinanceTransaction[];

      setTransactions(typedData);
      setPagination({
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      });
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [sellerId, page, limit, type, status, startDate, endDate]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Mock transactions for development
  const mockTransactions = useMemo((): FinanceTransaction[] => [
    {
      id: 'txn_001',
      seller_id: sellerId,
      type: TransactionType.SALE,
      order_id: 'ORD-7894',
      amount: 2450,
      currency: 'SAR',
      description: 'Sale for order ORD-7894',
      status: TransactionStatus.COMPLETED,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'txn_002',
      seller_id: sellerId,
      type: TransactionType.COMMISSION,
      amount: -367.5,
      currency: 'SAR',
      description: 'Platform commission (15%)',
      status: TransactionStatus.COMPLETED,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'txn_003',
      seller_id: sellerId,
      type: TransactionType.PAYOUT,
      amount: -2000,
      currency: 'SAR',
      description: 'Payout to bank account',
      status: TransactionStatus.COMPLETED,
      created_at: new Date(Date.now() - 172800000).toISOString(),
      updated_at: new Date(Date.now() - 172800000).toISOString()
    },
    {
      id: 'txn_004',
      seller_id: sellerId,
      type: TransactionType.VAT,
      amount: -367.5,
      currency: 'SAR',
      description: 'VAT payment',
      status: TransactionStatus.PENDING,
      created_at: new Date(Date.now() - 259200000).toISOString(),
      updated_at: new Date(Date.now() - 259200000).toISOString()
    },
    {
      id: 'txn_005',
      seller_id: sellerId,
      type: TransactionType.REFUND,
      order_id: 'ORD-7890',
      amount: -500,
      currency: 'SAR',
      description: 'Refund for order ORD-7890',
      status: TransactionStatus.COMPLETED,
      created_at: new Date(Date.now() - 345600000).toISOString(),
      updated_at: new Date(Date.now() - 345600000).toISOString()
    }
  ], [sellerId]);

  return {
    transactions: transactions.length > 0 ? transactions : mockTransactions,
    loading,
    error,
    pagination,
    refresh: fetchTransactions,
    isMock: transactions.length === 0
  };
};

// ============================================
// REQUEST PAYOUT HOOK
// ============================================

interface UseRequestPayoutProps {
  sellerId: string;
  onSuccess?: (payout: PayoutRequest) => void;
  onError?: (error: string) => void;
}

export const useRequestPayout = ({ sellerId, onSuccess, onError }: UseRequestPayoutProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const requestPayout = useCallback(async (
    amount: number,
    paymentMethod: PayoutRequest['payment_method'],
    bankDetails?: PayoutRequest['bank_details']
  ) => {
    if (!sellerId) {
      const err = 'Seller ID is required';
      setError(err);
      onError?.(err);
      return null;
    }

    if (amount <= 0) {
      const err = 'Payout amount must be greater than 0';
      setError(err);
      onError?.(err);
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Check available balance
      const { data: wallet, error: walletError } = await supabase
        .from('seller_wallet')
        .select('available_balance, currency')
        .eq('seller_id', sellerId)
        .single();

      if (walletError) throw walletError;

      if (wallet.available_balance < amount) {
        const err = `Insufficient balance. Available: ${wallet.currency} ${wallet.available_balance}`;
        setError(err);
        toast({
          title: 'Insufficient Balance',
          description: err,
          variant: 'destructive'
        });
        onError?.(err);
        return null;
      }

      // 2. Start transaction
      const payoutId = `payout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // 3. Create payout request
      const payoutRequest: Omit<PayoutRequest, 'id' | 'transactions'> = {
        seller_id: sellerId,
        amount,
        currency: wallet.currency || 'SAR',
        status: PayoutStatus.REQUESTED,
        payment_method: paymentMethod,
        bank_details: bankDetails,
        requested_at: new Date().toISOString(),
        notes: `Payout request for ${wallet.currency} ${amount}`
      };

      const { data: newPayout, error: payoutError } = await supabase
        .from('payout_requests')
        .insert([payoutRequest])
        .select()
        .single();

      if (payoutError) throw payoutError;

      // 4. Create transaction record
      const transaction: Omit<FinanceTransaction, 'id' | 'created_at' | 'updated_at'> = {
        seller_id: sellerId,
        type: TransactionType.PAYOUT,
        payout_request_id: newPayout.id,
        amount: -amount, // Negative for payout
        currency: wallet.currency || 'SAR',
        description: `Payout request #${newPayout.id.substring(0, 8)}`,
        status: TransactionStatus.PENDING,
        metadata: {
          payment_method: paymentMethod,
          bank_details: bankDetails
        }
      };

      const { error: transactionError } = await supabase
        .from('finance_transactions')
        .insert([transaction]);

      if (transactionError) throw transactionError;

      // 5. Update wallet balance optimistically
      const { error: updateError } = await supabase
        .from('seller_wallet')
        .update({
          available_balance: wallet.available_balance - amount,
          pending_payout: (wallet.pending_payout || 0) + amount,
          updated_at: new Date().toISOString()
        })
        .eq('seller_id', sellerId);

      if (updateError) throw updateError;

      // 6. Return complete payout data
      const completePayout: PayoutRequest = {
        ...newPayout,
        transactions: [{
          ...transaction,
          id: `temp_${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as FinanceTransaction]
      };

      toast({
        title: 'Payout Requested',
        description: `Your payout request for ${wallet.currency} ${amount} has been submitted.`,
        variant: 'default'
      });

      onSuccess?.(completePayout);
      return completePayout;
    } catch (err) {
      console.error('Error requesting payout:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to request payout';
      setError(errorMsg);
      toast({
        title: 'Payout Failed',
        description: errorMsg,
        variant: 'destructive'
      });
      onError?.(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [sellerId, toast, onSuccess, onError]);

  return {
    requestPayout,
    loading,
    error,
    resetError: () => setError(null)
  };
};

// ============================================
// EARNINGS BY PERIOD HOOK
// ============================================

interface UseEarningsByPeriodProps {
  sellerId: string;
  startDate: string;
  endDate: string;
  groupBy?: 'day' | 'week' | 'month';
}

export const useEarningsByPeriod = ({
  sellerId,
  startDate,
  endDate,
  groupBy = 'day'
}: UseEarningsByPeriodProps) => {
  const [earnings, setEarnings] = useState<DailyEarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEarnings = useCallback(async () => {
    if (!sellerId || !startDate || !endDate) {
      setError('Seller ID and date range are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Use Supabase RPC for complex aggregations
      const { data, error: rpcError } = await supabase
        .rpc('get_seller_earnings_by_period', {
          p_seller_id: sellerId,
          p_start_date: startDate,
          p_end_date: endDate,
          p_group_by: groupBy
        });

      if (rpcError) {
        // Fallback to client-side aggregation
        const { data: transactions } = await supabase
          .from('finance_transactions')
          .select('amount, type, created_at, status')
          .eq('seller_id', sellerId)
          .eq('status', TransactionStatus.COMPLETED)
          .gte('created_at', startDate)
          .lte('created_at', endDate)
          .order('created_at', { ascending: true });

        if (!transactions) {
          setEarnings([]);
          return;
        }

        // Group transactions by date
        const earningsByDate = new Map<string, DailyEarning>();

        transactions.forEach(transaction => {
          const date = new Date(transaction.created_at);
          let dateKey: string;
          
          switch (groupBy) {
            case 'week':
              const weekStart = new Date(date);
              weekStart.setDate(date.getDate() - date.getDay());
              dateKey = weekStart.toISOString().split('T')[0];
              break;
            case 'month':
              dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
              break;
            case 'day':
            default:
              dateKey = date.toISOString().split('T')[0];
          }

          if (!earningsByDate.has(dateKey)) {
            earningsByDate.set(dateKey, {
              date: dateKey,
              total_earnings: 0,
              total_sales: 0,
              total_refunds: 0,
              total_commissions: 0,
              total_vat: 0
            });
          }

          const dayEarnings = earningsByDate.get(dateKey)!;

          switch (transaction.type) {
            case TransactionType.SALE:
              dayEarnings.total_earnings += transaction.amount;
              dayEarnings.total_sales += transaction.amount;
              break;
            case TransactionType.REFUND:
              dayEarnings.total_earnings += transaction.amount; // Negative amount
              dayEarnings.total_refunds += Math.abs(transaction.amount);
              break;
            case TransactionType.COMMISSION:
              dayEarnings.total_commissions += Math.abs(transaction.amount);
              break;
            case TransactionType.VAT:
              dayEarnings.total_vat += Math.abs(transaction.amount);
              break;
          }
        });

        const sortedEarnings = Array.from(earningsByDate.values())
          .sort((a, b) => a.date.localeCompare(b.date));

        setEarnings(sortedEarnings);
      } else if (data) {
        setEarnings(data);
      }
    } catch (err) {
      console.error('Error fetching earnings by period:', err);
      setError(err instanceof Error ? err.message : 'Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  }, [sellerId, startDate, endDate, groupBy]);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  // Mock data for development
  const mockEarnings = useMemo((): DailyEarning[] => {
    const days: DailyEarning[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const totalSales = Math.floor(Math.random() * 5000) + 1000;
      const totalRefunds = Math.floor(Math.random() * 500);
      const totalCommissions = Math.floor(totalSales * 0.15);
      const totalVat = Math.floor(totalSales * 0.15);
      
      days.push({
        date: dateStr,
        total_earnings: totalSales - totalRefunds,
        total_sales: totalSales,
        total_refunds: totalRefunds,
        total_commissions: totalCommissions,
        total_vat: totalVat
      });
    }
    
    return days;
  }, [startDate, endDate]);

  return {
    earnings: earnings.length > 0 ? earnings : mockEarnings,
    loading,
    error,
    refresh: fetchEarnings,
    isMock: earnings.length === 0
  };
};

// ============================================
// COMPOSITE HOOK - MAIN EXPORT
// ============================================

export const useFinance = (sellerId: string) => {
  const summary = useFinanceSummary({ sellerId });
  const transactions = useFinanceTransactions({ sellerId });
  const payout = useRequestPayout({ sellerId });
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const earnings = useEarningsByPeriod({
    sellerId,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate
  });

  // Helper function to format currency
  const formatCurrency = useCallback((amount: number, currency: string = 'SAR') => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  }, []);

  // Calculate VAT summary
  const vatSummary = useMemo(() => {
    if (!summary.summary) return null;

    const vatRate = 0.15; // 15% for KSA
    const vatCollected = summary.summary.total_earnings * vatRate;
    const vatPaid = summary.summary.commission_deducted * vatRate;
    const vatPayable = vatCollected - vatPaid;

    return {
      vatRate,
      vatCollected,
      vatPaid,
      vatPayable,
      nextFilingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
  }, [summary.summary]);

  // Get payout history
  const [payoutHistory, setPayoutHistory] = useState<PayoutRequest[]>([]);
  
  const fetchPayoutHistory = useCallback(async () => {
    if (!sellerId) return;

    try {
      const { data, error } = await supabase
        .from('payout_requests')
        .select('*')
        .eq('seller_id', sellerId)
        .order('requested_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        setPayoutHistory(data as PayoutRequest[]);
      }
    } catch (err) {
      console.error('Error fetching payout history:', err);
    }
  }, [sellerId]);

  useEffect(() => {
    fetchPayoutHistory();
  }, [fetchPayoutHistory]);

  // Refresh all data
  const refreshAll = useCallback(() => {
    summary.refresh();
    transactions.refresh();
    earnings.refresh();
    fetchPayoutHistory();
  }, [summary, transactions, earnings, fetchPayoutHistory]);

  return {
    // Summary data
    summary: summary.summary,
    summaryLoading: summary.loading,
    summaryError: summary.error,
    
    // Transactions
    transactions: transactions.transactions,
    transactionsLoading: transactions.loading,
    transactionsError: transactions.error,
    transactionsPagination: transactions.pagination,
    
    // Payout functionality
    requestPayout: payout.requestPayout,
    payoutLoading: payout.loading,
    payoutError: payout.error,
    
    // Earnings by period
    earnings: earnings.earnings,
    earningsLoading: earnings.loading,
    earningsError: earnings.error,
    setDateRange,
    dateRange,
    
    // VAT
    vatSummary,
    
    // Payout history
    payoutHistory,
    fetchPayoutHistory,
    
    // Utility functions
    formatCurrency,
    refreshAll,
    
    // Mock flags
    isMock: summary.isMock || transactions.isMock || earnings.isMock
  };
};

export default useFinance;