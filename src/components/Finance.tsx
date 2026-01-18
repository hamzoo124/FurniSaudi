import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, Wallet, TrendingUp, TrendingDown, 
  Download, RefreshCw, Eye, Filter, Calendar,
  CheckCircle, Clock, XCircle, FileText, CreditCard,
  ChevronDown, ChevronRight, Check, X, AlertCircle,
  BarChart, Percent, Receipt, Banknote, ShoppingBag,
  Settings, Users, Truck, Package, Home, Calculator
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// ============== TYPES ==============
interface WalletInfo {
  available_balance: number;
  pending_balance: number;
  last_payout_date: string | null;
  next_payout_date: string;
  payout_method: string;
  minimum_payout: number;
}

interface Transaction {
  id: string;
  transaction_id: string;
  order_id: string;
  type: 'sale' | 'refund' | 'payout' | 'platform_fee' | 'vat_payment';
  description: string;
  gross_amount: number;
  vat_amount: number;
  platform_fee: number;
  net_amount: number;
  status: 'completed' | 'pending' | 'failed' | 'processing';
  created_at: string;
  customer_name?: string;
  customer_email?: string;
  payment_method?: string;
  notes?: string;
}

interface EarningsSummary {
  total_revenue: number;
  net_earnings: number;
  platform_fees: number;
  vat_collected: number;
  pending_payout: number;
  this_month_revenue: number;
  last_month_revenue: number;
  growth_rate: number;
}

interface EarningsBreakdown {
  category: 'products' | 'custom_orders' | 'installation' | 'delivery';
  gross_amount: number;
  platform_fee: number;
  vat_amount: number;
  net_amount: number;
  transaction_count: number;
}

interface PayoutRequest {
  amount: number;
  method: string;
  notes?: string;
}

// ============== MOCK DATA ==============
const MOCK_WALLET: WalletInfo = {
  available_balance: 24500,
  pending_balance: 8100,
  last_payout_date: '2024-01-10',
  next_payout_date: '2024-02-10',
  payout_method: 'Bank Transfer',
  minimum_payout: 1000
};

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    transaction_id: 'TXN-2024-001',
    order_id: 'ORD-2024-001',
    type: 'sale',
    description: 'Custom Leather Sofa Sale',
    gross_amount: 6755,
    vat_amount: 855,
    platform_fee: 1013.25,
    net_amount: 4886.75,
    status: 'completed',
    created_at: '2024-01-15T10:30:00Z',
    customer_name: 'Ahmed Al-Mansoor',
    customer_email: 'ahmed@example.com',
    payment_method: 'Credit Card'
  },
  {
    id: '2',
    transaction_id: 'TXN-2024-002',
    order_id: 'ORD-2024-002',
    type: 'sale',
    description: 'Dining Table Set',
    gross_amount: 3830,
    vat_amount: 480,
    platform_fee: 574.5,
    net_amount: 2775.5,
    status: 'completed',
    created_at: '2024-01-14T09:15:00Z',
    customer_name: 'Sarah Johnson',
    customer_email: 'sarah@example.com',
    payment_method: 'Apple Pay'
  },
  {
    id: '3',
    transaction_id: 'TXN-2024-003',
    order_id: 'ORD-2024-003',
    type: 'sale',
    description: 'Custom Wardrobe',
    gross_amount: 6740,
    vat_amount: 840,
    platform_fee: 1011,
    net_amount: 4889,
    status: 'pending',
    created_at: '2024-01-16T14:45:00Z',
    customer_name: 'Mohammed Khan',
    customer_email: 'mohammed@example.com',
    payment_method: 'Bank Transfer',
    notes: 'Payment confirmation pending'
  },
  {
    id: '4',
    transaction_id: 'TXN-2024-004',
    order_id: 'ORD-2024-004',
    type: 'payout',
    description: 'Payout Request',
    gross_amount: 15000,
    vat_amount: 0,
    platform_fee: 0,
    net_amount: 15000,
    status: 'completed',
    created_at: '2024-01-10T11:00:00Z',
    payment_method: 'Bank Transfer'
  },
  {
    id: '5',
    transaction_id: 'TXN-2024-005',
    order_id: 'ORD-2024-005',
    type: 'platform_fee',
    description: 'Monthly Platform Fee',
    gross_amount: 500,
    vat_amount: 75,
    platform_fee: 500,
    net_amount: -575,
    status: 'completed',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '6',
    transaction_id: 'TXN-2024-006',
    order_id: 'ORD-2024-006',
    type: 'refund',
    description: 'Bookshelf Return',
    gross_amount: -2190,
    vat_amount: -270,
    platform_fee: -328.5,
    net_amount: -1591.5,
    status: 'completed',
    created_at: '2024-01-14T10:15:00Z',
    customer_name: 'Layla Ahmed',
    notes: 'Customer returned damaged product'
  },
  {
    id: '7',
    transaction_id: 'TXN-2024-007',
    order_id: 'ORD-2024-007',
    type: 'sale',
    description: 'Custom Kitchen Cabinets',
    gross_amount: 10175,
    vat_amount: 1275,
    platform_fee: 1526.25,
    net_amount: 7373.75,
    status: 'completed',
    created_at: '2024-01-17T14:30:00Z',
    customer_name: 'Khalid Omar',
    payment_method: 'Bank Transfer'
  },
  {
    id: '8',
    transaction_id: 'TXN-2024-008',
    order_id: 'ORD-2024-008',
    type: 'vat_payment',
    description: 'VAT Remittance Q4 2023',
    gross_amount: 4250,
    vat_amount: 4250,
    platform_fee: 0,
    net_amount: -4250,
    status: 'completed',
    created_at: '2024-01-05T09:00:00Z'
  },
  {
    id: '9',
    transaction_id: 'TXN-2024-009',
    order_id: 'ORD-2024-009',
    type: 'sale',
    description: 'Custom Dining Table',
    gross_amount: 6575,
    vat_amount: 825,
    platform_fee: 986.25,
    net_amount: 4763.75,
    status: 'pending',
    created_at: '2024-01-18T16:20:00Z',
    customer_name: 'Yousef Hassan',
    payment_method: 'Cash on Delivery',
    notes: 'COD - Pending collection'
  },
  {
    id: '10',
    transaction_id: 'TXN-2024-010',
    order_id: 'ORD-2024-010',
    type: 'payout',
    description: 'Payout Request - Processing',
    gross_amount: 12000,
    vat_amount: 0,
    platform_fee: 0,
    net_amount: 12000,
    status: 'processing',
    created_at: '2024-01-18T14:00:00Z',
    payment_method: 'Bank Transfer'
  }
];

const MOCK_EARNINGS: EarningsSummary = {
  total_revenue: 45855,
  net_earnings: 33232.25,
  platform_fees: 6878.25,
  vat_collected: 6920,
  pending_payout: 8100,
  this_month_revenue: 38755,
  last_month_revenue: 32890,
  growth_rate: 17.8
};

const MOCK_BREAKDOWN: EarningsBreakdown[] = [
  {
    category: 'products',
    gross_amount: 12880,
    platform_fee: 1932,
    vat_amount: 1932,
    net_amount: 9016,
    transaction_count: 4
  },
  {
    category: 'custom_orders',
    gross_amount: 30190,
    platform_fee: 4528.5,
    vat_amount: 4528.5,
    net_amount: 21133,
    transaction_count: 4
  },
  {
    category: 'installation',
    gross_amount: 2785,
    platform_fee: 417.75,
    vat_amount: 417.75,
    net_amount: 1950.25,
    transaction_count: 3
  },
  {
    category: 'delivery',
    gross_amount: 0,
    platform_fee: 0,
    vat_amount: 0,
    net_amount: 0,
    transaction_count: 0
  }
];

// ============== UTILITY FUNCTIONS ==============
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-SA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('en-SA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const calculateVAT = (amount: number): number => {
  return Math.round(amount * 0.15);
};

// ============== MAIN COMPONENT ==============
const Finance: React.FC = () => {
  // State Management
  const [wallet, setWallet] = useState<WalletInfo>(MOCK_WALLET);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [earnings, setEarnings] = useState<EarningsSummary>(MOCK_EARNINGS);
  const [breakdown, setBreakdown] = useState<EarningsBreakdown[]>(MOCK_BREAKDOWN);
  const [loading, setLoading] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [payoutRequest, setPayoutRequest] = useState<PayoutRequest>({
    amount: 0,
    method: 'Bank Transfer',
    notes: ''
  });
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: ''
  });
  const [activeView, setActiveView] = useState<'overview' | 'transactions' | 'earnings'>('overview');

  // Load Data from Supabase
  const loadFinancialData = async () => {
    try {
      setLoading(true);
      
      // Check for demo mode
      const demoMode = localStorage.getItem('demoMode');
      if (demoMode === 'true') {
        setTimeout(() => {
          setLoading(false);
        }, 500);
        return;
      }
      
      // Real Supabase queries
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // Load wallet info
      const { data: walletData, error: walletError } = await supabase
        .from('seller_wallets')
        .select('*')
        .eq('seller_id', user.id)
        .single();
      
      if (walletError) throw walletError;
      
      // Load transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });
      
      if (transactionsError) throw transactionsError;
      
      // Load earnings summary
      const { data: earningsData, error: earningsError } = await supabase
        .rpc('get_seller_earnings_summary', { seller_id: user.id });
      
      if (earningsError) throw earningsError;
      
      // Set data
      if (walletData) setWallet(walletData as WalletInfo);
      if (transactionsData) setTransactions(transactionsData as Transaction[]);
      if (earningsData) setEarnings(earningsData[0] as EarningsSummary);
      
    } catch (error) {
      console.error('Error loading financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinancialData();
  }, []);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      // Type filter
      if (filters.type !== 'all' && transaction.type !== filters.type) {
        return false;
      }
      
      // Status filter
      if (filters.status !== 'all' && transaction.status !== filters.status) {
        return false;
      }
      
      // Date range filter
      if (filters.dateFrom) {
        const transactionDate = new Date(transaction.created_at);
        const fromDate = new Date(filters.dateFrom);
        if (transactionDate < fromDate) return false;
      }
      
      if (filters.dateTo) {
        const transactionDate = new Date(transaction.created_at);
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (transactionDate > toDate) return false;
      }
      
      return true;
    });
  }, [transactions, filters]);

  // Handle Payout Request
  const handlePayoutRequest = () => {
    if (wallet.available_balance < wallet.minimum_payout) {
      alert(`Minimum payout amount is ${formatCurrency(wallet.minimum_payout)}`);
      return;
    }
    
    setPayoutRequest({
      ...payoutRequest,
      amount: wallet.available_balance
    });
    setShowPayoutModal(true);
  };

  const handleConfirmPayout = async () => {
    try {
      // Create transaction record
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        transaction_id: `PAYOUT-${Date.now()}`,
        order_id: 'N/A',
        type: 'payout',
        description: 'Payout Request',
        gross_amount: payoutRequest.amount,
        vat_amount: 0,
        platform_fee: 0,
        net_amount: -payoutRequest.amount,
        status: 'processing',
        created_at: new Date().toISOString(),
        payment_method: payoutRequest.method,
        notes: payoutRequest.notes
      };

      // Update wallet balance
      const updatedWallet = {
        ...wallet,
        available_balance: wallet.available_balance - payoutRequest.amount,
        pending_balance: wallet.pending_balance + payoutRequest.amount
      };

      // Update state
      setTransactions(prev => [newTransaction, ...prev]);
      setWallet(updatedWallet);
      setEarnings(prev => ({
        ...prev,
        pending_payout: updatedWallet.pending_balance
      }));

      // Update in Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('transactions').insert({
          ...newTransaction,
          seller_id: user.id
        });
        
        await supabase
          .from('seller_wallets')
          .update({
            available_balance: updatedWallet.available_balance,
            pending_balance: updatedWallet.pending_balance,
            updated_at: new Date().toISOString()
          })
          .eq('seller_id', user.id);
      }

      setShowPayoutModal(false);
      setPayoutRequest({ amount: 0, method: 'Bank Transfer', notes: '' });
      alert('Payout request submitted successfully!');
      
    } catch (error) {
      console.error('Error processing payout:', error);
      alert('Error processing payout request. Please try again.');
    }
  };

  // Handle Transaction Details View
  const handleViewTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionModal(true);
  };

  // Handle Download Invoice
  const handleDownloadInvoice = (transaction: Transaction) => {
    // Generate invoice data
    const invoiceData = {
      invoice_id: `INV-${transaction.transaction_id}`,
      date: new Date().toISOString().split('T')[0],
      transaction,
      seller: {
        name: 'Premium Furniture Store',
        vat_number: 'VAT123456789',
        address: 'Riyadh, Saudi Arabia'
      }
    };

    // Convert to JSON and download (in production, generate PDF)
    const dataStr = JSON.stringify(invoiceData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(dataBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${transaction.transaction_id}.json`;
    a.click();
    
    alert(`Invoice for ${transaction.transaction_id} downloaded`);
  };

  // Handle Export Financial Data
  const handleExportData = () => {
    const exportData = {
      earnings_summary: earnings,
      wallet_info: wallet,
      transactions: filteredTransactions,
      earnings_breakdown: breakdown,
      export_date: new Date().toISOString()
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(dataBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  // Get Status Badge
  const getStatusBadge = (status: string) => {
    const config = {
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      processing: { color: 'bg-blue-100 text-blue-800', icon: RefreshCw },
      failed: { color: 'bg-red-100 text-red-800', icon: XCircle }
    };
    
    const { color, icon: Icon } = config[status as keyof typeof config] || config.pending;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Get Type Badge
  const getTypeBadge = (type: string) => {
    const config = {
      sale: { color: 'bg-green-100 text-green-800', label: 'Sale' },
      refund: { color: 'bg-red-100 text-red-800', label: 'Refund' },
      payout: { color: 'bg-blue-100 text-blue-800', label: 'Payout' },
      platform_fee: { color: 'bg-purple-100 text-purple-800', label: 'Platform Fee' },
      vat_payment: { color: 'bg-orange-100 text-orange-800', label: 'VAT Payment' }
    };
    
    const { color, label } = config[type as keyof typeof config] || { color: 'bg-gray-100 text-gray-800', label: type };
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${color}`}>
        {label}
      </span>
    );
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading financial data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Financial Management</h1>
            <p className="text-gray-600">Track earnings, manage payouts, and monitor VAT</p>
          </div>
          <div className="flex items-center space-x-3 mt-4 md:mt-0">
            <button
              onClick={loadFinancialData}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleExportData}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download className="w-4 h-4" />
              <span>Export Data</span>
            </button>
          </div>
        </div>

        {/* Finance Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {/* Total Revenue Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-green-600">
                  +{earnings.growth_rate}%
                </span>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(earnings.total_revenue)}
            </p>
            <p className="text-sm font-medium text-gray-700">Total Revenue</p>
            <p className="text-xs text-gray-500 mt-1">
              This month: {formatCurrency(earnings.this_month_revenue)}
            </p>
          </div>

          {/* Net Earnings Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Wallet className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-sm font-medium text-green-600">
                {Math.round((earnings.net_earnings / earnings.total_revenue) * 100)}% margin
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(earnings.net_earnings)}
            </p>
            <p className="text-sm font-medium text-gray-700">Net Earnings</p>
            <p className="text-xs text-gray-500 mt-1">
              After fees & VAT
            </p>
          </div>

          {/* Platform Fees Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Percent className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">
                15% commission
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(earnings.platform_fees)}
            </p>
            <p className="text-sm font-medium text-gray-700">Platform Fees</p>
            <p className="text-xs text-gray-500 mt-1">
              Total commission paid
            </p>
          </div>

          {/* VAT Collected Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Receipt className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">
                15% VAT rate
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(earnings.vat_collected)}
            </p>
            <p className="text-sm font-medium text-gray-700">VAT Collected</p>
            <p className="text-xs text-gray-500 mt-1">
              Quarterly filing required
            </p>
          </div>

          {/* Pending Payout Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              {wallet.pending_balance > 0 && (
                <span className="text-sm font-medium text-yellow-600">
                  Processing
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(earnings.pending_payout)}
            </p>
            <p className="text-sm font-medium text-gray-700">Pending Payout</p>
            <p className="text-xs text-gray-500 mt-1">
              Next payout: {formatDate(wallet.next_payout_date)}
            </p>
          </div>
        </div>
      </div>

      {/* Wallet & Payout Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Wallet & Payouts</h2>
              <p className="text-gray-600">Manage your earnings and request payouts</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePayoutRequest}
                disabled={wallet.available_balance < wallet.minimum_payout}
                className={`px-4 py-2 rounded-lg font-medium ${
                  wallet.available_balance < wallet.minimum_payout
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Request Payout
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Available Balance */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-blue-700">Available Balance</p>
                  <p className="text-3xl font-bold text-blue-900 mt-2">
                    {formatCurrency(wallet.available_balance)}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-blue-500" />
              </div>
              <p className="text-sm text-blue-600">
                Ready for immediate payout
              </p>
            </div>

            {/* Pending Balance */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-yellow-700">Pending Balance</p>
                  <p className="text-3xl font-bold text-yellow-900 mt-2">
                    {formatCurrency(wallet.pending_balance)}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
              <p className="text-sm text-yellow-600">
                Processing or in-transit
              </p>
            </div>

            {/* Payout Info */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Next Payout Date</p>
                  <p className="font-semibold text-gray-900">
                    {formatDate(wallet.next_payout_date)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Minimum Payout</p>
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(wallet.minimum_payout)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Payment Method</p>
                  <p className="font-semibold text-gray-900">{wallet.payout_method}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payout History Button */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => setActiveView('transactions')}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              View Payout History →
            </button>
          </div>
        </div>
      </div>

      {/* Tabs for Views */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveView('overview')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeView === 'overview'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Earnings Breakdown
          </button>
          <button
            onClick={() => setActiveView('transactions')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeView === 'transactions'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Transaction History
          </button>
          <button
            onClick={() => setActiveView('earnings')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeView === 'earnings'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Financial Reports
          </button>
        </div>
      </div>

      {/* Content Based on Active View */}
      {activeView === 'overview' && (
        /* Earnings Breakdown */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Earnings Breakdown</h2>
                <p className="text-gray-600">Detailed analysis by revenue source</p>
              </div>
              <div className="text-sm font-medium text-gray-700">
                All amounts in SAR
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">
                      Revenue Source
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">
                      Gross Amount
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">
                      Platform Fee (15%)
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">
                      VAT (15%)
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">
                      Net Amount
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">
                      Transactions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {breakdown.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${
                            item.category === 'products' ? 'bg-blue-100' :
                            item.category === 'custom_orders' ? 'bg-purple-100' :
                            item.category === 'installation' ? 'bg-green-100' :
                            'bg-gray-100'
                          }`}>
                            {item.category === 'products' && <Package className="w-4 h-4" />}
                            {item.category === 'custom_orders' && <Settings className="w-4 h-4" />}
                            {item.category === 'installation' && <Truck className="w-4 h-4" />}
                            {item.category === 'delivery' && <Truck className="w-4 h-4" />}
                          </div>
                          <span className="font-medium text-gray-900 capitalize">
                            {item.category.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-medium text-gray-900">
                        {formatCurrency(item.gross_amount)}
                      </td>
                      <td className="py-4 px-6 text-red-600 font-medium">
                        -{formatCurrency(item.platform_fee)}
                      </td>
                      <td className="py-4 px-6 text-orange-600 font-medium">
                        -{formatCurrency(item.vat_amount)}
                      </td>
                      <td className="py-4 px-6 font-bold text-gray-900">
                        {formatCurrency(item.net_amount)}
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        {item.transaction_count}
                      </td>
                    </tr>
                  ))}
                  {/* Totals Row */}
                  <tr className="bg-gray-50 border-t-2 border-gray-300">
                    <td className="py-4 px-6 font-bold text-gray-900">
                      Totals
                    </td>
                    <td className="py-4 px-6 font-bold text-gray-900">
                      {formatCurrency(breakdown.reduce((sum, item) => sum + item.gross_amount, 0))}
                    </td>
                    <td className="py-4 px-6 font-bold text-red-600">
                      -{formatCurrency(breakdown.reduce((sum, item) => sum + item.platform_fee, 0))}
                    </td>
                    <td className="py-4 px-6 font-bold text-orange-600">
                      -{formatCurrency(breakdown.reduce((sum, item) => sum + item.vat_amount, 0))}
                    </td>
                    <td className="py-4 px-6 font-bold text-gray-900">
                      {formatCurrency(breakdown.reduce((sum, item) => sum + item.net_amount, 0))}
                    </td>
                    <td className="py-4 px-6 font-bold text-gray-900">
                      {breakdown.reduce((sum, item) => sum + item.transaction_count, 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeView === 'transactions' && (
        /* Transaction History */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Transaction History</h2>
                <p className="text-gray-600">All financial transactions and payouts</p>
              </div>
              
              {/* Filters */}
              <div className="flex items-center space-x-3 mt-4 lg:mt-0">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="sale">Sales</option>
                    <option value="refund">Refunds</option>
                    <option value="payout">Payouts</option>
                    <option value="platform_fee">Platform Fees</option>
                    <option value="vat_payment">VAT Payments</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="text-gray-400">to</span>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">
                      Transaction ID
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">
                      Date
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">
                      Type
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">
                      Description
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">
                      Gross Amount
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">
                      Net Amount
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">
                      Status
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="py-4 px-6">
                          <p className="font-medium text-gray-900 text-sm">
                            {transaction.transaction_id}
                          </p>
                          {transaction.order_id !== 'N/A' && (
                            <p className="text-xs text-gray-500">Order: {transaction.order_id}</p>
                          )}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <p className="text-sm text-gray-900">{formatDate(transaction.created_at)}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(transaction.created_at).toLocaleTimeString('en-SA', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </td>
                        <td className="py-4 px-6">
                          {getTypeBadge(transaction.type)}
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                          {transaction.customer_name && (
                            <p className="text-xs text-gray-500">{transaction.customer_name}</p>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <p className={`text-sm font-medium ${
                            transaction.gross_amount >= 0 ? 'text-gray-900' : 'text-red-600'
                          }`}>
                            {formatCurrency(transaction.gross_amount)}
                          </p>
                          {transaction.vat_amount !== 0 && (
                            <p className="text-xs text-gray-500">
                              VAT: {formatCurrency(transaction.vat_amount)}
                            </p>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <p className={`text-sm font-bold ${
                            transaction.net_amount >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(transaction.net_amount)}
                          </p>
                          {transaction.platform_fee !== 0 && (
                            <p className="text-xs text-gray-500">
                              Fee: {formatCurrency(transaction.platform_fee)}
                            </p>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          {getStatusBadge(transaction.status)}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleViewTransaction(transaction)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDownloadInvoice(transaction)}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                              title="Download Invoice"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center">
                        <div className="text-gray-500">
                          <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p className="text-lg font-medium text-gray-600">No transactions found</p>
                          <p className="text-sm mt-1">Try adjusting your filters</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredTransactions.length > 0 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">1</span> to{' '}
                  <span className="font-medium">{filteredTransactions.length}</span> of{' '}
                  <span className="font-medium">{filteredTransactions.length}</span> transactions
                </div>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                    Previous
                  </button>
                  <button className="px-3 py-1 border border-gray-300 rounded text-sm bg-blue-50 text-blue-600 border-blue-200">
                    1
                  </button>
                  <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeView === 'earnings' && (
        /* Financial Reports Placeholder */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <BarChart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Financial Reports</h3>
          <p className="text-gray-500 text-sm mb-6">Generate and download detailed financial reports</p>
          <div className="space-y-3 max-w-md mx-auto">
            <button className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200">
              <span className="font-medium text-gray-900">Monthly Revenue Report</span>
              <Download className="w-4 h-4 text-gray-500" />
            </button>
            <button className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200">
              <span className="font-medium text-gray-900">VAT Filing Report</span>
              <Download className="w-4 h-4 text-gray-500" />
            </button>
            <button className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200">
              <span className="font-medium text-gray-900">Annual Financial Statement</span>
              <Download className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      )}

      {/* Payout Request Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Request Payout</h3>
                <button
                  onClick={() => setShowPayoutModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-700">
                    Available Balance: <span className="font-bold">{formatCurrency(wallet.available_balance)}</span>
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Minimum payout amount: {formatCurrency(wallet.minimum_payout)}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payout Amount (SAR)
                  </label>
                  <input
                    type="number"
                    value={payoutRequest.amount}
                    onChange={(e) => setPayoutRequest({ ...payoutRequest, amount: parseFloat(e.target.value) })}
                    min={wallet.minimum_payout}
                    max={wallet.available_balance}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payout Method
                  </label>
                  <select
                    value={payoutRequest.method}
                    onChange={(e) => setPayoutRequest({ ...payoutRequest, method: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="PayPal">PayPal</option>
                    <option value="STC Pay">STC Pay</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={payoutRequest.notes}
                    onChange={(e) => setPayoutRequest({ ...payoutRequest, notes: e.target.value })}
                    placeholder="Add any notes about this payout request..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    rows={3}
                  />
                </div>
                
                <div className="flex items-center space-x-3 pt-4">
                  <button
                    onClick={() => setShowPayoutModal(false)}
                    className="flex-1 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmPayout}
                    disabled={payoutRequest.amount < wallet.minimum_payout || payoutRequest.amount > wallet.available_balance}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium ${
                      payoutRequest.amount < wallet.minimum_payout || payoutRequest.amount > wallet.available_balance
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    Confirm Payout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Details Modal */}
      {showTransactionModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Transaction Details</h2>
                  <p className="text-gray-600">{selectedTransaction.transaction_id}</p>
                </div>
                <button
                  onClick={() => setShowTransactionModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Transaction Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Transaction Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Transaction ID:</span>
                      <span className="font-medium text-gray-900">{selectedTransaction.transaction_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Order ID:</span>
                      <span className="font-medium text-gray-900">{selectedTransaction.order_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Date & Time:</span>
                      <span className="font-medium text-gray-900">{formatDateTime(selectedTransaction.created_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Type:</span>
                      <span>{getTypeBadge(selectedTransaction.type)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <span>{getStatusBadge(selectedTransaction.status)}</span>
                    </div>
                  </div>
                </div>

                {/* Financial Info */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Financial Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Gross Amount:</span>
                      <span className={`font-medium ${selectedTransaction.gross_amount >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                        {formatCurrency(selectedTransaction.gross_amount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Platform Fee (15%):</span>
                      <span className="font-medium text-red-600">-{formatCurrency(selectedTransaction.platform_fee)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">VAT Amount (15%):</span>
                      <span className="font-medium text-orange-600">{formatCurrency(selectedTransaction.vat_amount)}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-900">Net Amount:</span>
                        <span className={`font-bold ${selectedTransaction.net_amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(selectedTransaction.net_amount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              {selectedTransaction.customer_name && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Customer Information</h3>
                  <div className="space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">Name:</span> {selectedTransaction.customer_name}
                    </p>
                    {selectedTransaction.customer_email && (
                      <p className="text-sm">
                        <span className="font-medium">Email:</span> {selectedTransaction.customer_email}
                      </p>
                    )}
                    {selectedTransaction.payment_method && (
                      <p className="text-sm">
                        <span className="font-medium">Payment Method:</span> {selectedTransaction.payment_method}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedTransaction.notes && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-yellow-800 mb-2">Notes</h4>
                  <p className="text-sm text-yellow-700">{selectedTransaction.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                  onClick={() => handleDownloadInvoice(selectedTransaction)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Invoice</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;