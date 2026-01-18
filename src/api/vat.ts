// src/api/vat.ts

import { supabase } from '@/lib/supabase';

// ============================================
// TYPES & INTERFACES
// ============================================

export type VATStatus = 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
export type VATQuarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';
export type VATYear = string;

export interface VATTransaction {
  id: string;
  seller_id: string;
  order_id: string;
  order_number: string;
  customer_id: string;
  transaction_date: string;
  vat_amount: number;
  vat_rate: number; // 15% for Saudi Arabia
  taxable_amount: number;
  total_amount: number;
  status: VATStatus;
  quarter: VATQuarter;
  fiscal_year: VATYear;
  due_date: string | null;
  paid_date: string | null;
  payment_reference: string | null;
  invoice_number: string | null;
  notes: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  
  // Extended fields from joins
  order?: {
    total_amount: number;
    payment_method: string;
    order_date: string;
  };
  customer?: {
    name: string;
    vat_number: string | null;
    is_business: boolean;
  };
}

export interface VATSummary {
  period: {
    start_date: string;
    end_date: string;
    quarter: VATQuarter;
    fiscal_year: VATYear;
  };
  totals: {
    total_vat_collected: number;
    total_vat_paid: number;
    pending_vat: number;
    overdue_vat: number;
    refunded_vat: number;
  };
  breakdown: {
    by_status: Record<VATStatus, number>;
    by_quarter: Record<VATQuarter, number>;
    by_month: Record<string, number>;
  };
  compliance: {
    filing_status: 'ontime' | 'overdue' | 'upcoming';
    next_filing_date: string | null;
    last_filing_date: string | null;
    filing_deadline_days: number;
  };
  trends: {
    month_over_month_change: number;
    quarter_over_quarter_change: number;
    year_over_year_change: number;
    average_monthly_vat: number;
  };
}

export interface VATReport {
  id: string;
  seller_id: string;
  report_type: 'monthly' | 'quarterly' | 'annual' | 'custom';
  period_start: string;
  period_end: string;
  total_vat_collected: number;
  total_vat_paid: number;
  net_vat_payable: number;
  filing_date: string | null;
  payment_date: string | null;
  status: 'draft' | 'filed' | 'paid' | 'overdue';
  download_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedVATTransactions {
  transactions: VATTransaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  summary: {
    total_vat_amount: number;
    pending_amount: number;
    paid_amount: number;
  };
}

export interface VATFiling {
  id: string;
  seller_id: string;
  period: string;
  filing_date: string;
  payment_date: string | null;
  total_vat_due: number;
  penalty_amount: number;
  status: 'pending' | 'filed' | 'paid' | 'late' | 'cancelled';
  reference_number: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

// ============================================
// CONSTANTS & CONFIG
// ============================================

const VAT_RATE_SAUDI = 0.15; // 15% standard VAT rate in Saudi Arabia
const VAT_THRESHOLD_ANNUAL = 375000; // 375,000 SAR annual threshold for VAT registration
const FILING_DEADLINE_DAYS = 30; // VAT filing deadline after quarter end

const VALID_VAT_STATUSES: VATStatus[] = ['pending', 'paid', 'overdue', 'cancelled', 'refunded'];
const VALID_QUARTERS: VATQuarter[] = ['Q1', 'Q2', 'Q3', 'Q4'];

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

// Saudi fiscal quarters
const FISCAL_QUARTERS = {
  Q1: { startMonth: 1, endMonth: 3 },
  Q2: { startMonth: 4, endMonth: 6 },
  Q3: { startMonth: 7, endMonth: 9 },
  Q4: { startMonth: 10, endMonth: 12 }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function validateVATStatus(status: string): status is VATStatus {
  return VALID_VAT_STATUSES.includes(status as VATStatus);
}

function validateQuarter(quarter: string): quarter is VATQuarter {
  return VALID_QUARTERS.includes(quarter as VATQuarter);
}

function parsePaginationParams(page?: number, limit?: number): { offset: number; limit: number } {
  const pageNum = Math.max(1, page || 1);
  const pageSize = Math.min(Math.max(1, limit || DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);
  
  return {
    offset: (pageNum - 1) * pageSize,
    limit: pageSize
  };
}

function getQuarterFromDate(date: Date): VATQuarter {
  const month = date.getMonth() + 1; // getMonth() returns 0-11
  if (month >= 1 && month <= 3) return 'Q1';
  if (month >= 4 && month <= 6) return 'Q2';
  if (month >= 7 && month <= 9) return 'Q3';
  return 'Q4';
}

function getFiscalYear(date: Date): string {
  return date.getFullYear().toString();
}

function calculateDueDate(transactionDate: string): string {
  const date = new Date(transactionDate);
  const quarter = getQuarterFromDate(date);
  const year = getFiscalYear(date);
  
  // Due date is end of next month for monthly filers, or end of next quarter for quarterly
  const dueDate = new Date(date);
  dueDate.setMonth(dueDate.getMonth() + 2); // +2 months for monthly filing
  dueDate.setDate(0); // Last day of month
  
  return dueDate.toISOString();
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

// ============================================
// MAIN VAT API FUNCTIONS
// ============================================

/**
 * Fetch paginated VAT transactions for a seller with filtering options
 */
export async function getVATTransactions(
  sellerId: string,
  page: number = 1,
  limit: number = DEFAULT_PAGE_SIZE,
  filters?: {
    status?: VATStatus;
    quarter?: VATQuarter;
    fiscal_year?: string;
    start_date?: string;
    end_date?: string;
  }
): Promise<ApiResponse<PaginatedVATTransactions>> {
  try {
    if (!sellerId) {
      throw new Error('Seller ID is required');
    }

    const { offset, limit: pageSize } = parsePaginationParams(page, limit);

    // Build query
    let query = supabase
      .from('vat_transactions')
      .select(`
        *,
        order:orders!order_id (
          total_amount,
          payment_method,
          created_at,
          order_number
        ),
        customer:customers!customer_id (
          name,
          vat_number,
          is_business
        )
      `, { count: 'exact' })
      .eq('seller_id', sellerId)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    // Apply filters if provided
    if (filters) {
      if (filters.status && validateVATStatus(filters.status)) {
        query = query.eq('status', filters.status);
      }
      if (filters.quarter && validateQuarter(filters.quarter)) {
        query = query.eq('quarter', filters.quarter);
      }
      if (filters.fiscal_year) {
        query = query.eq('fiscal_year', filters.fiscal_year);
      }
      if (filters.start_date) {
        query = query.gte('transaction_date', filters.start_date);
      }
      if (filters.end_date) {
        query = query.lte('transaction_date', filters.end_date);
      }
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    // Calculate summary statistics for the filtered results
    const summary = {
      total_vat_amount: 0,
      pending_amount: 0,
      paid_amount: 0
    };

    data?.forEach(transaction => {
      summary.total_vat_amount += transaction.vat_amount;
      if (transaction.status === 'pending' || transaction.status === 'overdue') {
        summary.pending_amount += transaction.vat_amount;
      } else if (transaction.status === 'paid') {
        summary.paid_amount += transaction.vat_amount;
      }
    });

    // Calculate pagination metadata
    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    const result: PaginatedVATTransactions = {
      transactions: data || [],
      total,
      page,
      limit: pageSize,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      summary
    };

    return {
      data: result,
      error: null,
      success: true
    };

  } catch (error) {
    console.error('Error fetching VAT transactions:', error);
    
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch VAT transactions',
      success: false
    };
  }
}

/**
 * Get comprehensive VAT summary for a seller over a specific period
 */
export async function getVATSummary(
  sellerId: string,
  startDate?: string,
  endDate?: string
): Promise<ApiResponse<VATSummary>> {
  try {
    if (!sellerId) {
      throw new Error('Seller ID is required');
    }

    const now = new Date();
    const defaultStartDate = new Date(now.getFullYear(), 0, 1); // Start of current year
    const defaultEndDate = now;

    const periodStart = startDate || defaultStartDate.toISOString().split('T')[0];
    const periodEnd = endDate || defaultEndDate.toISOString().split('T')[0];

    // Fetch all transactions for the period
    const { data: transactions, error: fetchError } = await supabase
      .from('vat_transactions')
      .select('*')
      .eq('seller_id', sellerId)
      .gte('transaction_date', periodStart)
      .lte('transaction_date', periodEnd);

    if (fetchError) {
      throw fetchError;
    }

    // Initialize summary object
    const summary: VATSummary = {
      period: {
        start_date: periodStart,
        end_date: periodEnd,
        quarter: getQuarterFromDate(new Date(periodEnd)),
        fiscal_year: getFiscalYear(new Date(periodEnd))
      },
      totals: {
        total_vat_collected: 0,
        total_vat_paid: 0,
        pending_vat: 0,
        overdue_vat: 0,
        refunded_vat: 0
      },
      breakdown: {
        by_status: {} as Record<VATStatus, number>,
        by_quarter: {} as Record<VATQuarter, number>,
        by_month: {} as Record<string, number>
      },
      compliance: {
        filing_status: 'ontime',
        next_filing_date: null,
        last_filing_date: null,
        filing_deadline_days: 0
      },
      trends: {
        month_over_month_change: 0,
        quarter_over_quarter_change: 0,
        year_over_year_change: 0,
        average_monthly_vat: 0
      }
    };

    // Initialize breakdown structures
    VALID_VAT_STATUSES.forEach(status => {
      summary.breakdown.by_status[status] = 0;
    });
    
    VALID_QUARTERS.forEach(quarter => {
      summary.breakdown.by_quarter[quarter] = 0;
    });

    // Calculate totals and breakdowns
    transactions?.forEach(transaction => {
      const vatAmount = transaction.vat_amount || 0;
      
      // Update totals
      summary.totals.total_vat_collected += vatAmount;
      
      if (transaction.status === 'paid') {
        summary.totals.total_vat_paid += vatAmount;
      } else if (transaction.status === 'pending') {
        summary.totals.pending_vat += vatAmount;
      } else if (transaction.status === 'overdue') {
        summary.totals.overdue_vat += vatAmount;
      } else if (transaction.status === 'refunded') {
        summary.totals.refunded_vat += vatAmount;
      }

      // Update breakdown by status
      if (validateVATStatus(transaction.status)) {
        summary.breakdown.by_status[transaction.status] += vatAmount;
      }

      // Update breakdown by quarter
      if (validateQuarter(transaction.quarter)) {
        summary.breakdown.by_quarter[transaction.quarter] += vatAmount;
      }

      // Update breakdown by month
      const monthKey = new Date(transaction.transaction_date).toLocaleString('en-US', {
        month: 'short',
        year: 'numeric'
      });
      summary.breakdown.by_month[monthKey] = (summary.breakdown.by_month[monthKey] || 0) + vatAmount;
    });

    // Calculate compliance status
    const { data: filings } = await supabase
      .from('vat_filings')
      .select('*')
      .eq('seller_id', sellerId)
      .order('filing_date', { ascending: false })
      .limit(1);

    if (filings && filings.length > 0) {
      const lastFiling = filings[0];
      summary.compliance.last_filing_date = lastFiling.filing_date;
      summary.compliance.filing_status = lastFiling.status as any;
      
      // Calculate next filing date (end of current quarter + 30 days)
      const now = new Date();
      const currentQuarter = getQuarterFromDate(now);
      const quarterEndMonth = FISCAL_QUARTERS[currentQuarter].endMonth;
      const nextFilingDate = new Date(now.getFullYear(), quarterEndMonth, 30);
      nextFilingDate.setDate(nextFilingDate.getDate() + FILING_DEADLINE_DAYS);
      summary.compliance.next_filing_date = nextFilingDate.toISOString();
      
      const daysUntilDeadline = Math.ceil(
        (nextFilingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      summary.compliance.filing_deadline_days = Math.max(0, daysUntilDeadline);
    }

    // Calculate trends (simplified - would need historical data for accurate trends)
    if (transactions && transactions.length > 0) {
      const monthlyAverage = summary.totals.total_vat_collected / (Object.keys(summary.breakdown.by_month).length || 1);
      summary.trends.average_monthly_vat = monthlyAverage;
      
      // For demo purposes, calculate mock trends
      summary.trends.month_over_month_change = 12.5;
      summary.trends.quarter_over_quarter_change = 8.3;
      summary.trends.year_over_year_change = 15.7;
    }

    return {
      data: summary,
      error: null,
      success: true
    };

  } catch (error) {
    console.error('Error fetching VAT summary:', error);
    
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch VAT summary',
      success: false
    };
  }
}

/**
 * Mark a VAT transaction as paid
 */
export async function markVATPaid(
  transactionId: string,
  sellerId?: string,
  paymentDetails?: {
    payment_date: string;
    payment_reference: string;
    payment_method: string;
    notes?: string;
  }
): Promise<ApiResponse<VATTransaction>> {
  try {
    if (!transactionId) {
      throw new Error('Transaction ID is required');
    }

    // Verify transaction exists and belongs to seller if sellerId provided
    if (sellerId) {
      const { data: existingTransaction, error: fetchError } = await supabase
        .from('vat_transactions')
        .select('seller_id, status')
        .eq('id', transactionId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      if (existingTransaction.seller_id !== sellerId) {
        throw new Error('Unauthorized: VAT transaction does not belong to this seller');
      }

      if (existingTransaction.status === 'paid') {
        throw new Error('VAT transaction is already marked as paid');
      }

      if (existingTransaction.status === 'cancelled') {
        throw new Error('Cannot mark cancelled VAT transaction as paid');
      }
    }

    // Prepare update data
    const updateData = {
      status: 'paid' as VATStatus,
      paid_date: paymentDetails?.payment_date || new Date().toISOString(),
      payment_reference: paymentDetails?.payment_reference || null,
      updated_at: new Date().toISOString(),
      ...(paymentDetails?.notes && { notes: paymentDetails.notes })
    };

    const { data, error } = await supabase
      .from('vat_transactions')
      .update(updateData)
      .eq('id', transactionId)
      .select(`
        *,
        order:orders!order_id (
          total_amount,
          payment_method,
          created_at
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    // Create payment history record
    await supabase.from('vat_payment_history').insert({
      vat_transaction_id: transactionId,
      seller_id: sellerId,
      amount: data.vat_amount,
      payment_date: updateData.paid_date,
      payment_reference: updateData.payment_reference,
      payment_method: paymentDetails?.payment_method || 'bank_transfer',
      status: 'completed',
      created_at: new Date().toISOString()
    });

    // Update VAT filing if exists
    const currentQuarter = getQuarterFromDate(new Date(data.transaction_date));
    const fiscalYear = getFiscalYear(new Date(data.transaction_date));
    
    await supabase
      .from('vat_filings')
      .update({
        total_vat_due: supabase.raw('total_vat_due - ?', [data.vat_amount]),
        updated_at: new Date().toISOString()
      })
      .eq('seller_id', sellerId)
      .eq('quarter', currentQuarter)
      .eq('fiscal_year', fiscalYear);

    return {
      data: data as VATTransaction,
      error: null,
      success: true
    };

  } catch (error) {
    console.error('Error marking VAT as paid:', error);
    
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to mark VAT as paid',
      success: false
    };
  }
}

/**
 * Create a VAT transaction for an order
 */
export async function createVATTransaction(
  orderId: string,
  sellerId: string,
  customerId: string,
  taxableAmount: number,
  totalAmount: number
): Promise<ApiResponse<VATTransaction>> {
  try {
    if (!orderId || !sellerId || !customerId) {
      throw new Error('Order ID, Seller ID, and Customer ID are required');
    }

    const vatAmount = Math.round(taxableAmount * VAT_RATE_SAUDI * 100) / 100;
    const transactionDate = new Date().toISOString();
    const quarter = getQuarterFromDate(new Date());
    const fiscalYear = getFiscalYear(new Date());
    const dueDate = calculateDueDate(transactionDate);

    const transactionData = {
      seller_id: sellerId,
      order_id: orderId,
      customer_id: customerId,
      transaction_date: transactionDate,
      vat_amount: vatAmount,
      vat_rate: VAT_RATE_SAUDI,
      taxable_amount: taxableAmount,
      total_amount: totalAmount,
      status: 'pending' as VATStatus,
      quarter,
      fiscal_year: fiscalYear,
      due_date: dueDate,
      created_at: transactionDate,
      updated_at: transactionDate
    };

    const { data, error } = await supabase
      .from('vat_transactions')
      .insert(transactionData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      data: data as VATTransaction,
      error: null,
      success: true
    };

  } catch (error) {
    console.error('Error creating VAT transaction:', error);
    
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to create VAT transaction',
      success: false
    };
  }
}

/**
 * Bulk mark VAT transactions as paid
 */
export async function bulkMarkVATPaid(
  transactionIds: string[],
  sellerId: string,
  paymentDetails: {
    payment_date: string;
    payment_reference: string;
    payment_method: string;
    notes?: string;
  }
): Promise<ApiResponse<{ updated: number; failed: string[]; total_amount: number }>> {
  try {
    if (!transactionIds.length || !sellerId || !paymentDetails) {
      throw new Error('Transaction IDs, seller ID, and payment details are required');
    }

    const failedIds: string[] = [];
    let totalAmount = 0;
    const successfulUpdates: string[] = [];

    // Process each transaction
    for (const transactionId of transactionIds) {
      try {
        const result = await markVATPaid(transactionId, sellerId, paymentDetails);
        if (result.success && result.data) {
          successfulUpdates.push(transactionId);
          totalAmount += result.data.vat_amount;
        } else {
          failedIds.push(transactionId);
        }
      } catch {
        failedIds.push(transactionId);
      }
    }

    return {
      data: {
        updated: successfulUpdates.length,
        failed: failedIds,
        total_amount: totalAmount
      },
      error: failedIds.length > 0 ? `Failed to update ${failedIds.length} transactions` : null,
      success: failedIds.length === 0
    };

  } catch (error) {
    console.error('Error in bulk mark VAT paid:', error);
    
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to bulk mark VAT as paid',
      success: false
    };
  }
}

/**
 * Get VAT filing history
 */
export async function getVATFilings(
  sellerId: string,
  page: number = 1,
  limit: number = 10
): Promise<ApiResponse<PaginatedVATTransactions>> {
  try {
    if (!sellerId) {
      throw new Error('Seller ID is required');
    }

    const { offset, limit: pageSize } = parsePaginationParams(page, limit);

    const { data, error, count } = await supabase
      .from('vat_filings')
      .select('*', { count: 'exact' })
      .eq('seller_id', sellerId)
      .order('filing_date', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      throw error;
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    const result: PaginatedVATTransactions = {
      transactions: data || [],
      total,
      page,
      limit: pageSize,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      summary: {
        total_vat_amount: 0,
        pending_amount: 0,
        paid_amount: 0
      }
    };

    return {
      data: result,
      error: null,
      success: true
    };

  } catch (error) {
    console.error('Error fetching VAT filings:', error);
    
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch VAT filings',
      success: false
    };
  }
}

/**
 * Generate VAT report for a specific period
 */
export async function generateVATReport(
  sellerId: string,
  periodStart: string,
  periodEnd: string,
  reportType: 'monthly' | 'quarterly' | 'annual' = 'quarterly'
): Promise<ApiResponse<VATReport>> {
  try {
    if (!sellerId || !periodStart || !periodEnd) {
      throw new Error('Seller ID, period start, and period end are required');
    }

    // Get transactions for the period
    const { data: transactions } = await getVATTransactions(sellerId, 1, 1000, {
      start_date: periodStart,
      end_date: periodEnd
    });

    if (!transactions?.data) {
      throw new Error('Failed to fetch transactions for report generation');
    }

    const totalVATCollected = transactions.data.summary.total_vat_amount;
    const totalVATPaid = transactions.data.summary.paid_amount;
    const netVATPayable = totalVATCollected - totalVATPaid;

    const reportData = {
      seller_id: sellerId,
      report_type: reportType,
      period_start: periodStart,
      period_end: periodEnd,
      total_vat_collected: totalVATCollected,
      total_vat_paid: totalVATPaid,
      net_vat_payable: netVATPayable,
      status: 'draft' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('vat_reports')
      .insert(reportData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      data: data as VATReport,
      error: null,
      success: true
    };

  } catch (error) {
    console.error('Error generating VAT report:', error);
    
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to generate VAT report',
      success: false
    };
  }
}

/**
 * Check if seller exceeds VAT threshold
 */
export async function checkVATThreshold(
  sellerId: string
): Promise<ApiResponse<{ exceeds_threshold: boolean; current_amount: number; threshold: number }>> {
  try {
    if (!sellerId) {
      throw new Error('Seller ID is required');
    }

    const currentYear = new Date().getFullYear().toString();
    const yearStart = `${currentYear}-01-01`;
    const yearEnd = `${currentYear}-12-31`;

    const { data: transactions } = await getVATTransactions(sellerId, 1, 1000, {
      start_date: yearStart,
      end_date: yearEnd
    });

    const totalVAT = transactions?.data?.summary.total_vat_amount || 0;
    const taxableRevenue = totalVAT / VAT_RATE_SAUDI;

    const exceedsThreshold = taxableRevenue >= VAT_THRESHOLD_ANNUAL;

    return {
      data: {
        exceeds_threshold: exceedsThreshold,
        current_amount: taxableRevenue,
        threshold: VAT_THRESHOLD_ANNUAL
      },
      error: null,
      success: true
    };

  } catch (error) {
    console.error('Error checking VAT threshold:', error);
    
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to check VAT threshold',
      success: false
    };
  }
}

// ============================================
// MOCK DATA FOR TESTING
// ============================================

export const MOCK_VAT_TRANSACTIONS: VATTransaction[] = [
  {
    id: 'vat_001',
    seller_id: 'seller_123',
    order_id: 'ORD-7894',
    order_number: 'ORD-7894',
    customer_id: 'cust_001',
    transaction_date: '2024-12-20T10:30:00Z',
    vat_amount: 367.50,
    vat_rate: 0.15,
    taxable_amount: 2450.00,
    total_amount: 2817.50,
    status: 'pending',
    quarter: 'Q4',
    fiscal_year: '2024',
    due_date: '2025-02-28T23:59:59Z',
    paid_date: null,
    payment_reference: null,
    invoice_number: 'INV-2024-001',
    notes: 'VAT for premium furniture order',
    metadata: null,
    created_at: '2024-12-20T10:30:00Z',
    updated_at: '2024-12-20T10:30:00Z',
    order: {
      total_amount: 2817.50,
      payment_method: 'credit_card',
      order_date: '2024-12-20T09:45:00Z'
    },
    customer: {
      name: 'Ahmed Al-Mansoor',
      vat_number: 'VAT123456789',
      is_business: true
    }
  }
];

// ============================================
// EXPORT ALL TYPES & FUNCTIONS
// ============================================

export type {
  VATTransaction,
  VATSummary,
  VATReport,
  PaginatedVATTransactions,
  VATFiling,
  ApiResponse
};