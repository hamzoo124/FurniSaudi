// src/hooks/useVAT.ts
import { useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

// ============================================
// TYPE DEFINITIONS
// ============================================

export enum VATStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
  EXEMPT = 'exempt'
}

export enum VATTransactionType {
  SALE = 'sale',
  PURCHASE = 'purchase',
  ADJUSTMENT = 'adjustment',
  REFUND = 'refund',
  PAYMENT = 'payment'
}

export interface VATTransaction {
  id: string;
  seller_id: string;
  order_id?: string;
  invoice_number?: string;
  transaction_type: VATTransactionType;
  
  // Amount details
  base_amount: number; // Amount without VAT
  vat_amount: number;
  total_amount: number; // base_amount + vat_amount
  currency: string;
  
  // VAT details
  vat_rate: number; // 15% for KSA
  vat_period?: string; // YYYY-MM format
  vat_code?: string; // KSA VAT code if applicable
  
  // Status and metadata
  status: VATStatus;
  description: string;
  notes?: string;
  
  // Payment details
  paid_at?: string;
  payment_reference?: string;
  payment_method?: 'bank_transfer' | 'online' | 'credit';
  
  // Due dates
  due_date: string;
  paid_by_seller?: boolean; // Whether seller paid or platform deducted
  
  // Timestamps
  created_at: string;
  updated_at: string;
  transaction_date: string;
}

export interface VATSummary {
  period: string; // YYYY-MM
  start_date: string;
  end_date: string;
  
  // VAT Totals
  total_vat_collected: number;
  total_vat_deductible: number;
  total_vat_payable: number;
  total_vat_paid: number;
  total_vat_due: number;
  
  // Transaction counts
  total_transactions: number;
  pending_transactions: number;
  paid_transactions: number;
  overdue_transactions: number;
  
  // Period comparisons
  previous_period_vat: number;
  vat_growth_rate: number;
  
  // Next filing
  next_filing_date: string;
  next_payment_date: string;
  
  // VAT rates breakdown
  standard_rate_vat: number; // 15%
  zero_rate_vat: number; // 0%
  exempt_vat: number; // Exempt transactions
}

export interface VATFiling {
  id: string;
  seller_id: string;
  filing_period: string; // YYYY-MM
  total_vat_payable: number;
  total_vat_paid: number;
  filing_status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submitted_at?: string;
  approved_at?: string;
  payment_status: 'pending' | 'paid' | 'overdue';
  payment_due_date: string;
  payment_reference?: string;
  created_at: string;
  updated_at: string;
}

export interface VATPayment {
  id: string;
  vat_transaction_id: string;
  seller_id: string;
  amount: number;
  currency: string;
  payment_date: string;
  payment_method: 'bank_transfer' | 'online' | 'credit';
  reference_number: string;
  status: 'pending' | 'completed' | 'failed' | 'reversed';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedVATResponse {
  transactions: VATTransaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================
// MAIN HOOK - VAT TRANSACTIONS
// ============================================

interface UseVATTransactionsProps {
  sellerId: string;
  page?: number;
  limit?: number;
  status?: VATStatus;
  transactionType?: VATTransactionType;
  startDate?: string;
  endDate?: string;
  vatPeriod?: string;
}

export const useVATTransactions = ({
  sellerId,
  page = 1,
  limit = 20,
  status,
  transactionType,
  startDate,
  endDate,
  vatPeriod
}: UseVATTransactionsProps) => {
  const [transactions, setTransactions] = useState<VATTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page,
    limit,
    total: 0,
    totalPages: 0
  });

  const fetchVATTransactions = useCallback(async () => {
    if (!sellerId) {
      setError('Seller ID is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Build query
      let query = supabase
        .from('vat_transactions')
        .select('*', { count: 'exact' })
        .eq('seller_id', sellerId)
        .order('transaction_date', { ascending: false });

      // Apply filters
      if (status) query = query.eq('status', status);
      if (transactionType) query = query.eq('transaction_type', transactionType);
      if (startDate) query = query.gte('transaction_date', startDate);
      if (endDate) query = query.lte('transaction_date', endDate);
      if (vatPeriod) query = query.eq('vat_period', vatPeriod);

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error: queryError, count } = await query;

      if (queryError) throw queryError;

      // Transform and validate data
      const typedData = (data || []).map(transaction => ({
        ...transaction,
        transaction_type: transaction.transaction_type as VATTransactionType,
        status: transaction.status as VATStatus,
        currency: transaction.currency || 'SAR',
        base_amount: Number(transaction.base_amount) || 0,
        vat_amount: Number(transaction.vat_amount) || 0,
        total_amount: Number(transaction.total_amount) || 0,
        vat_rate: Number(transaction.vat_rate) || 0.15
      })) as VATTransaction[];

      setTransactions(typedData);
      setPagination({
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      });
    } catch (err) {
      console.error('Error fetching VAT transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load VAT transactions');
    } finally {
      setLoading(false);
    }
  }, [sellerId, page, limit, status, transactionType, startDate, endDate, vatPeriod]);

  useEffect(() => {
    fetchVATTransactions();
  }, [fetchVATTransactions]);

  // Mock transactions for development
  const mockTransactions = useMemo((): VATTransaction[] => {
    const generateVATTransaction = (index: number): VATTransaction => {
      const baseAmount = Math.floor(Math.random() * 10000) + 1000;
      const vatRate = 0.15;
      const vatAmount = baseAmount * vatRate;
      const now = new Date();
      const transactionDate = new Date(now.getTime() - index * 86400000 * 7);
      
      const statuses = [VATStatus.PENDING, VATStatus.PAID, VATStatus.OVERDUE];
      const status = statuses[index % statuses.length];
      
      const transactionTypes = [
        VATTransactionType.SALE,
        VATTransactionType.REFUND,
        VATTransactionType.PAYMENT
      ];
      const transactionType = transactionTypes[index % transactionTypes.length];

      return {
        id: `vat_${Date.now()}_${index}`,
        seller_id: sellerId,
        order_id: `ORD-${7890 + index}`,
        invoice_number: `INV-${2024000 + index}`,
        transaction_type: transactionType,
        base_amount: baseAmount,
        vat_amount: vatAmount,
        total_amount: baseAmount + vatAmount,
        currency: 'SAR',
        vat_rate: vatRate,
        vat_period: `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}`,
        vat_code: 'KSA-VAT-15',
        status: status,
        description: transactionType === VATTransactionType.SALE 
          ? 'VAT on furniture sale' 
          : transactionType === VATTransactionType.REFUND
          ? 'VAT refund for returned item'
          : 'VAT payment',
        notes: transactionType === VATTransactionType.SALE ? 'Standard rated supply' : undefined,
        paid_at: status === VATStatus.PAID 
          ? new Date(transactionDate.getTime() + 86400000 * 5).toISOString()
          : undefined,
        payment_reference: status === VATStatus.PAID ? `PAY-${2024000 + index}` : undefined,
        payment_method: 'bank_transfer',
        due_date: new Date(transactionDate.getTime() + 86400000 * 30).toISOString().split('T')[0],
        paid_by_seller: index % 2 === 0,
        created_at: transactionDate.toISOString(),
        updated_at: transactionDate.toISOString(),
        transaction_date: transactionDate.toISOString().split('T')[0]
      };
    };

    return Array.from({ length: 15 }, (_, i) => generateVATTransaction(i));
  }, [sellerId]);

  return {
    transactions: transactions.length > 0 ? transactions : mockTransactions,
    loading,
    error,
    pagination,
    refresh: fetchVATTransactions,
    isMock: transactions.length === 0
  };
};

// ============================================
// VAT SUMMARY HOOK
// ============================================

interface UseVATSummaryProps {
  sellerId: string;
  startDate: string;
  endDate: string;
  vatPeriod?: string;
}

export const useVATSummary = ({
  sellerId,
  startDate,
  endDate,
  vatPeriod
}: UseVATSummaryProps) => {
  const [summary, setSummary] = useState<VATSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchVATSummary = useCallback(async () => {
    if (!sellerId || !startDate || !endDate) {
      setError('Seller ID and date range are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Try to use RPC for complex aggregation
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_vat_summary', {
          p_seller_id: sellerId,
          p_start_date: startDate,
          p_end_date: endDate,
          p_vat_period: vatPeriod
        });

      if (!rpcError && rpcData) {
        setSummary(rpcData);
        return;
      }

      // Fallback to manual aggregation
      const { data: transactions, error: transactionsError } = await supabase
        .from('vat_transactions')
        .select('*')
        .eq('seller_id', sellerId)
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate);

      if (transactionsError) throw transactionsError;

      const { data: previousPeriodTransactions } = await supabase
        .from('vat_transactions')
        .select('vat_amount')
        .eq('seller_id', sellerId)
        .gte('transaction_date', getPreviousPeriodStart(startDate))
        .lte('transaction_date', getPreviousPeriodEnd(endDate));

      // Calculate summary
      const totalVATCollected = transactions
        ?.filter(t => t.transaction_type === VATTransactionType.SALE)
        .reduce((sum, t) => sum + (Number(t.vat_amount) || 0), 0) || 0;

      const totalVATDeductible = transactions
        ?.filter(t => t.transaction_type === VATTransactionType.PURCHASE)
        .reduce((sum, t) => sum + (Number(t.vat_amount) || 0), 0) || 0;

      const totalVATPaid = transactions
        ?.filter(t => t.status === VATStatus.PAID)
        .reduce((sum, t) => sum + (Number(t.vat_amount) || 0), 0) || 0;

      const pendingTransactions = transactions
        ?.filter(t => t.status === VATStatus.PENDING).length || 0;

      const overdueTransactions = transactions
        ?.filter(t => t.status === VATStatus.OVERDUE).length || 0;

      const previousPeriodVAT = previousPeriodTransactions
        ?.reduce((sum, t) => sum + (Number(t.vat_amount) || 0), 0) || 0;

      const vatGrowthRate = previousPeriodVAT > 0 
        ? ((totalVATCollected - previousPeriodVAT) / previousPeriodVAT) * 100 
        : 0;

      const standardRateVAT = transactions
        ?.filter(t => t.vat_rate === 0.15)
        .reduce((sum, t) => sum + (Number(t.vat_amount) || 0), 0) || 0;

      const nextFilingDate = new Date(new Date().setMonth(new Date().getMonth() + 1))
        .toISOString().split('T')[0];

      const nextPaymentDate = new Date(new Date().setDate(new Date().getDate() + 30))
        .toISOString().split('T')[0];

      const summaryData: VATSummary = {
        period: vatPeriod || `${new Date(startDate).getFullYear()}-${String(new Date(startDate).getMonth() + 1).padStart(2, '0')}`,
        start_date: startDate,
        end_date: endDate,
        total_vat_collected: totalVATCollected,
        total_vat_deductible: totalVATDeductible,
        total_vat_payable: totalVATCollected - totalVATDeductible,
        total_vat_paid: totalVATPaid,
        total_vat_due: totalVATCollected - totalVATDeductible - totalVATPaid,
        total_transactions: transactions?.length || 0,
        pending_transactions: pendingTransactions,
        paid_transactions: transactions?.filter(t => t.status === VATStatus.PAID).length || 0,
        overdue_transactions: overdueTransactions,
        previous_period_vat: previousPeriodVAT,
        vat_growth_rate: vatGrowthRate,
        next_filing_date: nextFilingDate,
        next_payment_date: nextPaymentDate,
        standard_rate_vat: standardRateVAT,
        zero_rate_vat: 0, // Would need specific transactions with 0% rate
        exempt_vat: 0 // Would need exempt transactions
      };

      setSummary(summaryData);
    } catch (err) {
      console.error('Error fetching VAT summary:', err);
      setError(err instanceof Error ? err.message : 'Failed to load VAT summary');
      toast({
        title: 'Error',
        description: 'Failed to load VAT summary',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [sellerId, startDate, endDate, vatPeriod, toast]);

  const getPreviousPeriodStart = (currentStart: string): string => {
    const date = new Date(currentStart);
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  };

  const getPreviousPeriodEnd = (currentEnd: string): string => {
    const date = new Date(currentEnd);
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  };

  useEffect(() => {
    fetchVATSummary();
  }, [fetchVATSummary]);

  // Mock summary for development
  const mockSummary = useMemo((): VATSummary => {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const totalVATCollected = 23250;
    const totalVATDeductible = 2500;
    const totalVATPaid = 15000;
    
    return {
      period: `${periodStart.getFullYear()}-${String(periodStart.getMonth() + 1).padStart(2, '0')}`,
      start_date: periodStart.toISOString().split('T')[0],
      end_date: periodEnd.toISOString().split('T')[0],
      total_vat_collected: totalVATCollected,
      total_vat_deductible: totalVATDeductible,
      total_vat_payable: totalVATCollected - totalVATDeductible,
      total_vat_paid: totalVATPaid,
      total_vat_due: totalVATCollected - totalVATDeductible - totalVATPaid,
      total_transactions: 45,
      pending_transactions: 8,
      paid_transactions: 35,
      overdue_transactions: 2,
      previous_period_vat: 20500,
      vat_growth_rate: 13.4,
      next_filing_date: new Date(now.getFullYear(), now.getMonth() + 1, 15).toISOString().split('T')[0],
      next_payment_date: new Date(now.getFullYear(), now.getMonth() + 1, 20).toISOString().split('T')[0],
      standard_rate_vat: totalVATCollected,
      zero_rate_vat: 0,
      exempt_vat: 0
    };
  }, []);

  return {
    summary: summary || mockSummary,
    loading,
    error,
    refresh: fetchVATSummary,
    isMock: !summary
  };
};

// ============================================
// MARK VAT AS PAID HOOK
// ============================================

interface UseMarkVATPaidProps {
  sellerId: string;
  onSuccess?: (transaction: VATTransaction) => void;
  onError?: (error: string) => void;
}

export const useMarkVATPaid = ({ sellerId, onSuccess, onError }: UseMarkVATPaidProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const markVATPaid = useCallback(async (
    vatTransactionId: string,
    paymentDetails: {
      payment_date: string;
      payment_method: VATTransaction['payment_method'];
      payment_reference: string;
      notes?: string;
    }
  ) => {
    if (!sellerId) {
      const err = 'Seller ID is required';
      setError(err);
      onError?.(err);
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Verify transaction exists and belongs to seller
      const { data: transaction, error: fetchError } = await supabase
        .from('vat_transactions')
        .select('*')
        .eq('id', vatTransactionId)
        .eq('seller_id', sellerId)
        .single();

      if (fetchError) throw fetchError;

      if (!transaction) {
        const err = 'VAT transaction not found';
        setError(err);
        onError?.(err);
        return null;
      }

      if (transaction.status === VATStatus.PAID) {
        const err = 'VAT transaction is already marked as paid';
        setError(err);
        toast({
          title: 'Already Paid',
          description: err,
          variant: 'warning'
        });
        onError?.(err);
        return transaction as VATTransaction;
      }

      // 2. Start transaction - mark as paid and create payment record
      const now = new Date().toISOString();
      
      // Update VAT transaction
      const updatePayload = {
        status: VATStatus.PAID,
        paid_at: paymentDetails.payment_date,
        payment_method: paymentDetails.payment_method,
        payment_reference: paymentDetails.payment_reference,
        updated_at: now,
        notes: paymentDetails.notes
      };

      const { data: updatedTransaction, error: updateError } = await supabase
        .from('vat_transactions')
        .update(updatePayload)
        .eq('id', vatTransactionId)
        .eq('seller_id', sellerId)
        .select()
        .single();

      if (updateError) throw updateError;

      // 3. Create payment record
      const paymentPayload = {
        vat_transaction_id: vatTransactionId,
        seller_id: sellerId,
        amount: updatedTransaction.vat_amount,
        currency: updatedTransaction.currency,
        payment_date: paymentDetails.payment_date,
        payment_method: paymentDetails.payment_method,
        reference_number: paymentDetails.payment_reference,
        status: 'completed' as const,
        notes: paymentDetails.notes
      };

      const { error: paymentError } = await supabase
        .from('vat_payments')
        .insert([paymentPayload]);

      if (paymentError) throw paymentError;

      // 4. Update seller's wallet if VAT was deducted
      if (updatedTransaction.paid_by_seller) {
        const { error: walletError } = await supabase.rpc('deduct_vat_from_wallet', {
          p_seller_id: sellerId,
          p_amount: updatedTransaction.vat_amount,
          p_reference: paymentDetails.payment_reference
        });

        if (walletError) console.warn('Failed to update wallet:', walletError);
      }

      toast({
        title: 'VAT Marked as Paid',
        description: `VAT of ${updatedTransaction.currency} ${updatedTransaction.vat_amount.toFixed(2)} has been marked as paid.`,
        variant: 'default'
      });

      onSuccess?.(updatedTransaction as VATTransaction);
      return updatedTransaction as VATTransaction;
    } catch (err) {
      console.error('Error marking VAT as paid:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to mark VAT as paid';
      setError(errorMsg);
      toast({
        title: 'Payment Failed',
        description: errorMsg,
        variant: 'destructive'
      });
      onError?.(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [sellerId, toast, onSuccess, onError]);

  const markVATPaidOptimistic = useCallback(async (
    vatTransactionId: string,
    paymentDetails: {
      payment_date: string;
      payment_method: VATTransaction['payment_method'];
      payment_reference: string;
      notes?: string;
    },
    currentTransaction: VATTransaction
  ) => {
    // Create optimistic update
    const optimisticTransaction: VATTransaction = {
      ...currentTransaction,
      status: VATStatus.PAID,
      paid_at: paymentDetails.payment_date,
      payment_method: paymentDetails.payment_method,
      payment_reference: paymentDetails.payment_reference,
      updated_at: new Date().toISOString(),
      notes: paymentDetails.notes
    };

    try {
      const result = await markVATPaid(vatTransactionId, paymentDetails);
      return result || optimisticTransaction;
    } catch {
      // Return optimistic transaction on error
      return optimisticTransaction;
    }
  }, [markVATPaid]);

  return {
    markVATPaid,
    markVATPaidOptimistic,
    loading,
    error,
    resetError: () => setError(null)
  };
};

// ============================================
// PENDING VAT HOOK
// ============================================

interface UsePendingVATProps {
  sellerId: string;
  includeOverdue?: boolean;
}

export const usePendingVAT = ({ sellerId, includeOverdue = true }: UsePendingVATProps) => {
  const [pendingTransactions, setPendingTransactions] = useState<VATTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState({
    totalPendingAmount: 0,
    totalOverdueAmount: 0,
    nextDueDate: '',
    pendingCount: 0,
    overdueCount: 0
  });

  const fetchPendingVAT = useCallback(async () => {
    if (!sellerId) {
      setError('Seller ID is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Build query for pending VAT
      let query = supabase
        .from('vat_transactions')
        .select('*')
        .eq('seller_id', sellerId)
        .in('status', includeOverdue ? [VATStatus.PENDING, VATStatus.OVERDUE] : [VATStatus.PENDING])
        .order('due_date', { ascending: true });

      const { data: transactions, error: queryError } = await query;

      if (queryError) throw queryError;

      const typedTransactions = (transactions || []).map(t => ({
        ...t,
        transaction_type: t.transaction_type as VATTransactionType,
        status: t.status as VATStatus
      })) as VATTransaction[];

      // Calculate summary
      const now = new Date();
      const pendingTxns = typedTransactions.filter(t => t.status === VATStatus.PENDING);
      const overdueTxns = typedTransactions.filter(t => 
        t.status === VATStatus.OVERDUE || 
        (t.due_date && new Date(t.due_date) < now)
      );

      const totalPendingAmount = pendingTxns.reduce((sum, t) => sum + t.vat_amount, 0);
      const totalOverdueAmount = overdueTxns.reduce((sum, t) => sum + t.vat_amount, 0);

      // Find next due date
      const upcomingDueDates = pendingTxns
        .map(t => t.due_date)
        .filter(Boolean)
        .sort();
      
      const nextDueDate = upcomingDueDates[0] || '';

      setPendingTransactions(typedTransactions);
      setSummary({
        totalPendingAmount,
        totalOverdueAmount,
        nextDueDate,
        pendingCount: pendingTxns.length,
        overdueCount: overdueTxns.length
      });
    } catch (err) {
      console.error('Error fetching pending VAT:', err);
      setError(err instanceof Error ? err.message : 'Failed to load pending VAT');
    } finally {
      setLoading(false);
    }
  }, [sellerId, includeOverdue]);

  useEffect(() => {
    fetchPendingVAT();
  }, [fetchPendingVAT]);

  // Mock pending VAT for development
  const mockPendingTransactions = useMemo((): VATTransaction[] => {
    const now = new Date();
    return [
      {
        id: 'vat_pending_001',
        seller_id: sellerId,
        order_id: 'ORD-7894',
        invoice_number: 'INV-2024001',
        transaction_type: VATTransactionType.SALE,
        base_amount: 15000,
        vat_amount: 2250,
        total_amount: 17250,
        currency: 'SAR',
        vat_rate: 0.15,
        vat_period: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
        status: VATStatus.PENDING,
        description: 'VAT on premium sofa sale',
        due_date: new Date(now.getTime() + 86400000 * 15).toISOString().split('T')[0],
        paid_by_seller: true,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        transaction_date: now.toISOString().split('T')[0]
      },
      {
        id: 'vat_overdue_001',
        seller_id: sellerId,
        order_id: 'ORD-7890',
        invoice_number: 'INV-2024002',
        transaction_type: VATTransactionType.SALE,
        base_amount: 8000,
        vat_amount: 1200,
        total_amount: 9200,
        currency: 'SAR',
        vat_rate: 0.15,
        vat_period: `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`,
        status: VATStatus.OVERDUE,
        description: 'VAT on dining table sale - OVERDUE',
        due_date: new Date(now.getTime() - 86400000 * 5).toISOString().split('T')[0],
        paid_by_seller: true,
        created_at: new Date(now.getTime() - 86400000 * 30).toISOString(),
        updated_at: new Date(now.getTime() - 86400000 * 30).toISOString(),
        transaction_date: new Date(now.getTime() - 86400000 * 30).toISOString().split('T')[0]
      },
      {
        id: 'vat_pending_002',
        seller_id: sellerId,
        order_id: 'ORD-7895',
        invoice_number: 'INV-2024003',
        transaction_type: VATTransactionType.SALE,
        base_amount: 12000,
        vat_amount: 1800,
        total_amount: 13800,
        currency: 'SAR',
        vat_rate: 0.15,
        vat_period: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
        status: VATStatus.PENDING,
        description: 'VAT on bedroom set sale',
        due_date: new Date(now.getTime() + 86400000 * 20).toISOString().split('T')[0],
        paid_by_seller: false,
        created_at: new Date(now.getTime() - 86400000 * 3).toISOString(),
        updated_at: new Date(now.getTime() - 86400000 * 3).toISOString(),
        transaction_date: new Date(now.getTime() - 86400000 * 3).toISOString().split('T')[0]
      }
    ];
  }, [sellerId]);

  const mockSummary = useMemo(() => ({
    totalPendingAmount: 4050, // 2250 + 1800
    totalOverdueAmount: 1200,
    nextDueDate: new Date(Date.now() + 86400000 * 15).toISOString().split('T')[0],
    pendingCount: 2,
    overdueCount: 1
  }), []);

  return {
    pendingTransactions: pendingTransactions.length > 0 ? pendingTransactions : mockPendingTransactions,
    summary: pendingTransactions.length > 0 ? summary : mockSummary,
    loading,
    error,
    refresh: fetchPendingVAT,
    isMock: pendingTransactions.length === 0
  };
};

// ============================================
// COMPOSITE HOOK - MAIN EXPORT
// ============================================

export const useVAT = (sellerId: string) => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Individual hooks
  const transactions = useVATTransactions({
    sellerId,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate
  });

  const summary = useVATSummary({
    sellerId,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate
  });

  const markPaid = useMarkVATPaid({ sellerId });
  const pending = usePendingVAT({ sellerId });

  // VAT filing history
  const [vatFilings, setVatFilings] = useState<VATFiling[]>([]);
  
  const fetchVATFilings = useCallback(async () => {
    if (!sellerId) return;

    try {
      const { data, error } = await supabase
        .from('vat_filings')
        .select('*')
        .eq('seller_id', sellerId)
        .order('filing_period', { ascending: false });

      if (!error && data) {
        setVatFilings(data as VATFiling[]);
      }
    } catch (err) {
      console.error('Error fetching VAT filings:', err);
    }
  }, [sellerId]);

  // Generate VAT report
  const generateVATReport = useCallback(async (period: string) => {
    if (!sellerId) return null;

    try {
      const { data: transactions } = await supabase
        .from('vat_transactions')
        .select('*')
        .eq('seller_id', sellerId)
        .eq('vat_period', period);

      if (!transactions) return null;

      // Group by transaction type
      const report = {
        period,
        transactions: transactions.map(t => ({
          date: t.transaction_date,
          invoice_number: t.invoice_number,
          base_amount: t.base_amount,
          vat_amount: t.vat_amount,
          vat_rate: t.vat_rate,
          status: t.status
        })),
        summary: {
          total_sales: transactions
            .filter(t => t.transaction_type === VATTransactionType.SALE)
            .reduce((sum, t) => sum + t.base_amount, 0),
          total_vat_collected: transactions
            .filter(t => t.transaction_type === VATTransactionType.SALE)
            .reduce((sum, t) => sum + t.vat_amount, 0),
          total_vat_paid: transactions
            .filter(t => t.status === VATStatus.PAID)
            .reduce((sum, t) => sum + t.vat_amount, 0)
        }
      };

      return report;
    } catch (err) {
      console.error('Error generating VAT report:', err);
      return null;
    }
  }, [sellerId]);

  // Format currency helper
  const formatCurrency = useCallback((amount: number, currency: string = 'SAR') => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }, []);

  // Calculate VAT for an order
  const calculateVATForOrder = useCallback((amount: number, vatRate: number = 0.15) => {
    const vatAmount = amount * vatRate;
    const totalAmount = amount + vatAmount;
    
    return {
      base_amount: amount,
      vat_amount: vatAmount,
      total_amount: totalAmount,
      vat_rate: vatRate
    };
  }, []);

  // Refresh all data
  const refreshAll = useCallback(() => {
    transactions.refresh();
    summary.refresh();
    pending.refresh();
    fetchVATFilings();
  }, [transactions, summary, pending, fetchVATFilings]);

  useEffect(() => {
    fetchVATFilings();
  }, [fetchVATFilings]);

  return {
    // Transactions
    transactions: transactions.transactions,
    transactionsLoading: transactions.loading,
    transactionsError: transactions.error,
    transactionsPagination: transactions.pagination,
    
    // Summary
    summary: summary.summary,
    summaryLoading: summary.loading,
    summaryError: summary.error,
    
    // Pending VAT
    pendingTransactions: pending.pendingTransactions,
    pendingSummary: pending.summary,
    pendingLoading: pending.loading,
    pendingError: pending.error,
    
    // Mark as paid
    markVATPaid: markPaid.markVATPaid,
    markVATPaidOptimistic: markPaid.markVATPaidOptimistic,
    markPaidLoading: markPaid.loading,
    markPaidError: markPaid.error,
    
    // Date range
    dateRange,
    setDateRange,
    
    // VAT filings
    vatFilings,
    fetchVATFilings,
    
    // Utility functions
    formatCurrency,
    calculateVATForOrder,
    generateVATReport,
    refreshAll,
    
    // Mock flags
    isMock: transactions.isMock || summary.isMock || pending.isMock
  };
};

export default useVAT;