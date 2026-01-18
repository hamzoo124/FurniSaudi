import React, { useState, useEffect, useMemo } from 'react';
import {
  Wallet as WalletIcon,
  DollarSign,
  Clock,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download,
  Filter,
  Calendar,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Building,
  Receipt,
  Banknote,
  Lock,
  Unlock,
  MoreVertical,
  ExternalLink,
  Copy,
  Shield,
  QrCode,
  History,
  BarChart3,
  PiggyBank,
  AlertTriangle,
  Info
} from 'lucide-react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface WalletBalance {
  available_balance: number;
  pending_balance: number;
  total_earnings: number;
  total_withdrawn: number;
  next_payout_date: string;
  last_payout_date: string;
  minimum_payout_threshold: number;
  currency: string;
  payout_method: 'bank_transfer';
  bank_account?: {
    bank_name: string;
    account_number: string;
    iban: string;
    account_holder: string;
  };
}

interface LedgerEntry {
  id: string;
  entry_id: string;
  type: 'credit' | 'debit';
  description: string;
  order_id: string | null;
  amount: number;
  balance_before: number;
  balance_after: number;
  status: 'completed' | 'pending' | 'failed' | 'processing';
  created_at: string;
  reference_type: 'sale' | 'payout' | 'refund' | 'commission' | 'adjustment';
  metadata?: Record<string, any>;
}

interface PayoutRequest {
  amount: number;
  available_balance: number;
  minimum_threshold: number;
  estimated_processing_days: number;
  bank_account: {
    bank_name: string;
    last_four: string;
  };
}

interface FilterOptions {
  date_range: 'all' | '7d' | '30d' | '90d' | 'custom';
  type: 'all' | 'credit' | 'debit';
  status: 'all' | 'completed' | 'pending' | 'failed';
  start_date?: string;
  end_date?: string;
}

// ============================================================================
// MOCK DATA
// ============================================================================

// Mock wallet data
const MOCK_WALLET: WalletBalance = {
  available_balance: 48570,
  pending_balance: 12850,
  total_earnings: 154850,
  total_withdrawn: 89000,
  next_payout_date: '2024-02-15',
  last_payout_date: '2024-01-31',
  minimum_payout_threshold: 1000,
  currency: 'SAR',
  payout_method: 'bank_transfer',
  bank_account: {
    bank_name: 'Al Rajhi Bank',
    account_number: 'SA4420000001234567890',
    iban: 'SA4420000001234567890',
    account_holder: 'Premium Furniture Store'
  }
};

// Mock ledger entries (30 days)
const generateLedgerEntries = (): LedgerEntry[] => {
  const entries: LedgerEntry[] = [];
  let runningBalance = 48570;
  
  const entryTypes = [
    { type: 'credit' as const, description: 'Order Payment', reference: 'sale' as const },
    { type: 'credit' as const, description: 'Custom Order Payment', reference: 'sale' as const },
    { type: 'credit' as const, description: 'Commission Adjustment', reference: 'adjustment' as const },
    { type: 'debit' as const, description: 'Payout to Bank', reference: 'payout' as const },
    { type: 'debit' as const, description: 'Refund to Customer', reference: 'refund' as const },
    { type: 'debit' as const, description: 'Platform Commission', reference: 'commission' as const },
  ];
  
  const statuses: Array<LedgerEntry['status']> = ['completed', 'pending', 'processing', 'failed'];
  const statusWeights = [0.8, 0.1, 0.08, 0.02];
  
  // Generate 50 ledger entries
  for (let i = 0; i < 50; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const entryDate = new Date();
    entryDate.setDate(entryDate.getDate() - daysAgo);
    
    const entryType = entryTypes[Math.floor(Math.random() * entryTypes.length)];
    const isCredit = entryType.type === 'credit';
    const amount = isCredit 
      ? Math.floor(Math.random() * 5000) + 1000
      : Math.floor(Math.random() * 3000) + 500;
    
    // Determine status based on weights
    const rand = Math.random();
    let cumulative = 0;
    let status: LedgerEntry['status'] = 'completed';
    for (let s = 0; s < statuses.length; s++) {
      cumulative += statusWeights[s];
      if (rand < cumulative) {
        status = statuses[s];
        break;
      }
    }
    
    // For pending payouts, ensure reasonable amounts
    if (entryType.description === 'Payout to Bank' && status === 'pending') {
      const payoutAmount = Math.floor(Math.random() * 10000) + 5000;
      runningBalance -= payoutAmount;
      entries.push({
        id: `ledger-${i}`,
        entry_id: `LED-${1000 + i}`,
        type: 'debit',
        description: 'Payout Request',
        order_id: null,
        amount: payoutAmount,
        balance_before: runningBalance + payoutAmount,
        balance_after: runningBalance,
        status: 'pending',
        created_at: entryDate.toISOString().split('T')[0],
        reference_type: 'payout',
        metadata: {
          payout_id: `PYT-${2000 + i}`,
          bank_reference: `BANK-REF-${3000 + i}`
        }
      });
      continue;
    }
    
    // Calculate balance changes
    const balanceBefore = runningBalance;
    if (isCredit) {
      runningBalance += amount;
    } else {
      runningBalance -= amount;
    }
    
    // Ensure balance doesn't go negative in mock data
    if (runningBalance < 0) {
      runningBalance = Math.abs(runningBalance) + 1000;
    }
    
    entries.push({
      id: `ledger-${i}`,
      entry_id: `LED-${1000 + i}`,
      type: entryType.type,
      description: entryType.description,
      order_id: entryType.reference === 'sale' ? `ORD-${5000 + i}` : null,
      amount: amount,
      balance_before: balanceBefore,
      balance_after: runningBalance,
      status: status,
      created_at: entryDate.toISOString().split('T')[0],
      reference_type: entryType.reference,
      metadata: entryType.reference === 'payout' ? {
        payout_id: `PYT-${2000 + i}`,
        bank_reference: `BANK-REF-${3000 + i}`
      } : undefined
    });
  }
  
  // Sort by date (most recent first)
  return entries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

const MOCK_LEDGER_ENTRIES = generateLedgerEntries();

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const Wallet: React.FC = () => {
  // State Management
  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState<WalletBalance>(MOCK_WALLET);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>(MOCK_LEDGER_ENTRIES);
  const [filteredEntries, setFilteredEntries] = useState<LedgerEntry[]>(MOCK_LEDGER_ENTRIES);
  const [selectedEntry, setSelectedEntry] = useState<LedgerEntry | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [showConfirmPayoutModal, setShowConfirmPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [payoutSuccess, setPayoutSuccess] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState<FilterOptions>({
    date_range: '30d',
    type: 'all',
    status: 'all'
  });

  // Constants
  const ITEMS_PER_PAGE = 10;
  const PROCESSING_TIME_DAYS = 3;

  // Memoized calculations
  const summaryStats = useMemo(() => {
    const totalCredits = ledgerEntries
      .filter(e => e.type === 'credit')
      .reduce((sum, entry) => sum + entry.amount, 0);
    
    const totalDebits = ledgerEntries
      .filter(e => e.type === 'debit')
      .reduce((sum, entry) => sum + entry.amount, 0);
    
    const pendingEntries = ledgerEntries.filter(e => e.status === 'pending').length;
    const failedEntries = ledgerEntries.filter(e => e.status === 'failed').length;
    
    return {
      totalCredits,
      totalDebits,
      pendingEntries,
      failedEntries,
      netFlow: totalCredits - totalDebits
    };
  }, [ledgerEntries]);

  // Format currency for Saudi Arabia
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string, includeTime: boolean = false) => {
    const date = new Date(dateString);
    if (includeTime) {
      return date.toLocaleDateString('en-SA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return date.toLocaleDateString('en-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format IBAN for display
  const formatIBAN = (iban: string) => {
    if (!iban) return '';
    return iban.replace(/(.{4})/g, '$1 ').trim();
  };

  // Format account number for display
  const formatAccountNumber = (account: string) => {
    if (!account) return '';
    const lastFour = account.slice(-4);
    return `•••• ${lastFour}`;
  };

  // Get status badge styling
  const getStatusBadge = (status: LedgerEntry['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: LedgerEntry['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'processing':
        return <RefreshCw className="w-4 h-4" />;
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  // Get type badge styling
  const getTypeBadge = (type: LedgerEntry['type']) => {
    return type === 'credit' 
      ? 'bg-green-50 text-green-700 border border-green-200'
      : 'bg-red-50 text-red-700 border border-red-200';
  };

  const getTypeIcon = (type: LedgerEntry['type']) => {
    return type === 'credit' 
      ? <ArrowUpRight className="w-4 h-4" />
      : <ArrowDownRight className="w-4 h-4" />;
  };

  // Calculate days until next payout
  const getDaysUntilPayout = () => {
    const nextPayout = new Date(wallet.next_payout_date);
    const today = new Date();
    const diffTime = nextPayout.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Handle filter changes
  useEffect(() => {
    let result = [...ledgerEntries];

    // Date range filter
    if (filters.date_range !== 'all') {
      const today = new Date();
      let cutoffDate = new Date();
      
      switch (filters.date_range) {
        case '7d':
          cutoffDate.setDate(today.getDate() - 7);
          break;
        case '30d':
          cutoffDate.setDate(today.getDate() - 30);
          break;
        case '90d':
          cutoffDate.setDate(today.getDate() - 90);
          break;
      }
      
      result = result.filter(entry => new Date(entry.created_at) >= cutoffDate);
    }

    // Custom date range filter
    if (filters.date_range === 'custom' && filters.start_date && filters.end_date) {
      const startDate = new Date(filters.start_date);
      const endDate = new Date(filters.end_date);
      endDate.setHours(23, 59, 59, 999);
      
      result = result.filter(entry => {
        const entryDate = new Date(entry.created_at);
        return entryDate >= startDate && entryDate <= endDate;
      });
    }

    // Type filter
    if (filters.type !== 'all') {
      result = result.filter(entry => entry.type === filters.type);
    }

    // Status filter
    if (filters.status !== 'all') {
      result = result.filter(entry => entry.status === filters.status);
    }

    setFilteredEntries(result);
    setCurrentPage(1);
  }, [filters, ledgerEntries]);

  // Pagination
  const paginatedEntries = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEntries.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredEntries, currentPage]);

  const totalPages = Math.ceil(filteredEntries.length / ITEMS_PER_PAGE);

  // Handle payout request
  const handlePayoutRequest = () => {
    if (wallet.available_balance < wallet.minimum_payout_threshold) {
      alert(`Minimum payout threshold is ${formatCurrency(wallet.minimum_payout_threshold)}`);
      return;
    }
    setPayoutAmount(wallet.available_balance);
    setShowPayoutModal(true);
  };

  const handleConfirmPayout = () => {
    setLoading(true);
    
    // Simulate API call to process payout
    setTimeout(() => {
      // Create a new ledger entry for the payout
      const newEntry: LedgerEntry = {
        id: `payout-${Date.now()}`,
        entry_id: `LED-${Math.floor(Math.random() * 9000) + 1000}`,
        type: 'debit',
        description: 'Payout to Bank',
        order_id: null,
        amount: payoutAmount,
        balance_before: wallet.available_balance,
        balance_after: wallet.available_balance - payoutAmount,
        status: 'pending',
        created_at: new Date().toISOString().split('T')[0],
        reference_type: 'payout',
        metadata: {
          payout_id: `PYT-${Math.floor(Math.random() * 9000) + 1000}`,
          bank_reference: `BANK-${Math.floor(Math.random() * 10000)}`,
          processing_time_days: PROCESSING_TIME_DAYS
        }
      };

      // Update wallet balance
      const updatedWallet = {
        ...wallet,
        available_balance: wallet.available_balance - payoutAmount,
        total_withdrawn: wallet.total_withdrawn + payoutAmount,
        next_payout_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };

      // Update state
      setWallet(updatedWallet);
      setLedgerEntries(prev => [newEntry, ...prev]);
      setShowPayoutModal(false);
      setShowConfirmPayoutModal(false);
      setPayoutSuccess(true);
      setLoading(false);

      // Auto-hide success message
      setTimeout(() => setPayoutSuccess(false), 5000);
    }, 1500);
  };

  const handleDownloadStatement = () => {
    setLoading(true);
    // Simulate generating and downloading statement
    setTimeout(() => {
      alert('Wallet statement downloaded successfully');
      setLoading(false);
    }, 1000);
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  // Load wallet data (simulate API call)
  const loadWalletData = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 800);
  };

  // KPI Cards Data
  const kpiCards = [
    {
      title: 'Available Balance',
      value: formatCurrency(wallet.available_balance),
      description: 'Amount available for withdrawal',
      icon: <WalletIcon className="w-6 h-6" />,
      color: 'bg-emerald-50 text-emerald-600',
      trend: 'ready',
      action: 'Withdrawable now'
    },
    {
      title: 'Pending Balance',
      value: formatCurrency(wallet.pending_balance),
      description: 'Orders pending completion',
      icon: <Clock className="w-6 h-6" />,
      color: 'bg-amber-50 text-amber-600',
      trend: 'pending',
      action: 'Will be available soon'
    },
    {
      title: 'Total Earnings',
      value: formatCurrency(wallet.total_earnings),
      description: 'Lifetime earnings from sales',
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'bg-blue-50 text-blue-600',
      trend: 'up',
      action: 'All-time revenue'
    },
    {
      title: 'Total Withdrawn',
      value: formatCurrency(wallet.total_withdrawn),
      description: 'Total amount paid out',
      icon: <TrendingDown className="w-6 h-6" />,
      color: 'bg-purple-50 text-purple-600',
      trend: 'paid',
      action: 'Historical withdrawals'
    },
    {
      title: 'Next Payout Date',
      value: formatDate(wallet.next_payout_date),
      description: `In ${getDaysUntilPayout()} days`,
      icon: <Calendar className="w-6 h-6" />,
      color: 'bg-indigo-50 text-indigo-600',
      trend: 'calendar',
      action: 'Automatic payout schedule'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Success Message */}
      {payoutSuccess && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg max-w-sm">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
              <div>
                <p className="font-medium text-green-800">Payout Request Submitted</p>
                <p className="text-sm text-green-600 mt-1">
                  Your payout of {formatCurrency(payoutAmount)} is being processed.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Wallet</h1>
            <p className="text-gray-600 mt-1">Track your balance, earnings, and payouts</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleDownloadStatement}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Download Statement</span>
            </button>
            
            <button
              onClick={loadWalletData}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-start">
            <Shield className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">Secure Financial System</p>
              <p className="text-sm text-blue-700 mt-1">
                Your funds are secured with bank-grade encryption. All transactions are monitored 
                and protected by our financial security systems.
              </p>
            </div>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {kpiCards.map((card, index) => (
            <div key={index} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2.5 rounded-lg ${card.color}`}>
                  {card.icon}
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                  {card.action}
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{card.value}</p>
              <p className="text-sm font-medium text-gray-700 mb-1">{card.title}</p>
              <p className="text-xs text-gray-500">{card.description}</p>
            </div>
          ))}
        </div>

        {/* Payout Request Section */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Request Payout</h3>
                <p className="text-sm text-gray-600">Withdraw your available balance to your bank account</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Banknote className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Payout Info */}
              <div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Available Balance</span>
                    <span className="text-lg font-bold text-emerald-600">
                      {formatCurrency(wallet.available_balance)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Minimum Payout</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(wallet.minimum_payout_threshold)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Payout Method</span>
                    <span className="text-sm font-medium text-gray-900">Bank Transfer</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Processing Time</span>
                    <span className="text-sm font-medium text-gray-900">
                      {PROCESSING_TIME_DAYS} business days
                    </span>
                  </div>
                </div>

                {/* Bank Account Info */}
                {wallet.bank_account && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Bank Account Details</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Bank</span>
                        <span className="text-sm font-medium text-gray-900">{wallet.bank_account.bank_name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Account Holder</span>
                        <span className="text-sm font-medium text-gray-900">{wallet.bank_account.account_holder}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Account Number</span>
                        <button
                          onClick={() => handleCopyToClipboard(wallet.bank_account?.account_number || '')}
                          className="text-sm font-medium text-gray-900 hover:text-blue-600 flex items-center"
                        >
                          {formatAccountNumber(wallet.bank_account.account_number)}
                          <Copy className="w-3 h-3 ml-1" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">IBAN</span>
                        <button
                          onClick={() => handleCopyToClipboard(wallet.bank_account?.iban || '')}
                          className="text-sm font-medium text-gray-900 hover:text-blue-600 flex items-center"
                        >
                          {formatIBAN(wallet.bank_account.iban)}
                          <Copy className="w-3 h-3 ml-1" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Payout Action */}
              <div className="flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Payout Summary</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Current Balance</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(wallet.available_balance)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Last Payout</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(wallet.last_payout_date)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Payouts This Month</span>
                      <span className="text-sm font-medium text-gray-900">2</span>
                    </div>
                  </div>
                </div>

                {/* Payout Button */}
                <div className="mt-6">
                  <button
                    onClick={handlePayoutRequest}
                    disabled={wallet.available_balance < wallet.minimum_payout_threshold || loading}
                    className={`w-full py-3.5 rounded-lg font-medium ${
                      wallet.available_balance >= wallet.minimum_payout_threshold
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {wallet.available_balance >= wallet.minimum_payout_threshold ? (
                      <div className="flex items-center justify-center space-x-2">
                        <ArrowUpRight className="w-5 h-5" />
                        <span>Request Payout</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <Lock className="w-5 h-5" />
                        <span>
                          Minimum {formatCurrency(wallet.minimum_payout_threshold)} required
                        </span>
                      </div>
                    )}
                  </button>
                  
                  {wallet.available_balance < wallet.minimum_payout_threshold && (
                    <p className="text-xs text-gray-500 text-center mt-2">
                      You need {formatCurrency(wallet.minimum_payout_threshold - wallet.available_balance)} more to request a payout
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wallet Ledger */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Wallet Ledger</h3>
                <p className="text-sm text-gray-600">Detailed record of all financial transactions</p>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="text-sm text-gray-700">
                  <span className="font-medium">Net Flow: </span>
                  <span className={summaryStats.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {summaryStats.netFlow >= 0 ? '+' : ''}{formatCurrency(summaryStats.netFlow)}
                  </span>
                </div>
                <div className="p-2 bg-gray-100 rounded-lg">
                  <History className="w-5 h-5 text-gray-700" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Date Range Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date Range</label>
                <select
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={filters.date_range}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    date_range: e.target.value as FilterOptions['date_range'] 
                  }))}
                >
                  <option value="all">All Time</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Transaction Type</label>
                <select
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    type: e.target.value as FilterOptions['type'] 
                  }))}
                >
                  <option value="all">All Types</option>
                  <option value="credit">Credits</option>
                  <option value="debit">Debits</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    status: e.target.value as FilterOptions['status'] 
                  }))}
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              {/* Reset Button */}
              <div className="flex items-end">
                <button
                  onClick={() => setFilters({ date_range: '30d', type: 'all', status: 'all' })}
                  className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Reset Filters
                </button>
              </div>
            </div>

            {/* Custom Date Range */}
            {filters.date_range === 'custom' && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    value={filters.start_date || ''}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      start_date: e.target.value 
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    value={filters.end_date || ''}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      end_date: e.target.value 
                    }))}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Ledger Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entry ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount (SAR)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance After
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 font-mono">
                        {entry.entry_id}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(entry.created_at)}</div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getTypeBadge(entry.type)}`}>
                        {getTypeIcon(entry.type)}
                        <span className="ml-1 capitalize">{entry.type}</span>
                      </span>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{entry.description}</div>
                      <div className="text-xs text-gray-500 capitalize">{entry.reference_type}</div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      {entry.order_id ? (
                        <div className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer">
                          {entry.order_id}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-semibold ${
                        entry.type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {entry.type === 'credit' ? '+' : '-'}{formatCurrency(entry.amount)}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(entry.balance_after)}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(entry.status)}`}>
                        {getStatusIcon(entry.status)}
                        <span className="ml-1 capitalize">{entry.status}</span>
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedEntry(entry);
                          setShowDetailsModal(true);
                        }}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Empty State */}
            {paginatedEntries.length === 0 && (
              <div className="text-center py-12">
                <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-600 mb-1">No ledger entries found</h3>
                <p className="text-gray-500 text-sm">Try adjusting your filters or refresh the data</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {paginatedEntries.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredEntries.length)}
                  </span>{' '}
                  of <span className="font-medium">{filteredEntries.length}</span> entries
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 rounded-md ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Supabase Query Examples */}
        <div className="mt-8 p-4 bg-gray-900 text-gray-300 rounded-lg text-sm font-mono">
          <div className="mb-2">// Supabase Queries for Real Implementation:</div>
          <div className="ml-4">
            <div className="text-blue-400">// Get wallet balance</div>
            <div>const {'{'} data: wallet {'}'} = await supabase</div>
            <div className="ml-4">.from('seller_wallets')</div>
            <div className="ml-4">.select('*')</div>
            <div className="ml-4">.eq('seller_id', sellerId)</div>
            <div className="ml-4">.single();</div>
            
            <div className="mt-4 text-blue-400">// Get ledger entries with pagination</div>
            <div>const {'{'} data: ledger, count {'}'} = await supabase</div>
            <div className="ml-4">.from('wallet_ledger')</div>
            <div className="ml-4">.select('*', {'{'} count: 'exact' {'}'})</div>
            <div className="ml-4">.eq('seller_id', sellerId)</div>
            <div className="ml-4">.order('created_at', {'{'} ascending: false {'}'})</div>
            <div className="ml-4">.range(start, end);</div>
          </div>
        </div>
      </div>

      {/* Ledger Entry Details Modal */}
      {showDetailsModal && selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Ledger Entry Details</h2>
                  <p className="text-gray-600">{selectedEntry.entry_id}</p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Type</label>
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getTypeBadge(selectedEntry.type)}`}>
                        {getTypeIcon(selectedEntry.type)}
                        <span className="ml-2 capitalize">{selectedEntry.type}</span>
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                    <div className={`text-2xl font-bold ${
                      selectedEntry.type === 'credit' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {selectedEntry.type === 'credit' ? '+' : '-'}{formatCurrency(selectedEntry.amount)}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date & Time</label>
                    <div className="text-gray-900">{formatDate(selectedEntry.created_at, true)}</div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(selectedEntry.status)}`}>
                        {getStatusIcon(selectedEntry.status)}
                        <span className="ml-2 capitalize">{selectedEntry.status}</span>
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reference</label>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm text-gray-600">Type:</span>
                        <span className="ml-2 text-sm font-medium capitalize">{selectedEntry.reference_type}</span>
                      </div>
                      {selectedEntry.order_id && (
                        <div>
                          <span className="text-sm text-gray-600">Order ID:</span>
                          <span className="ml-2 text-sm font-medium text-blue-600">{selectedEntry.order_id}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <div className="text-gray-900">{selectedEntry.description}</div>
                  </div>
                </div>
              </div>

              {/* Balance Information */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Balance Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Balance Before</label>
                    <div className="text-lg font-medium text-gray-900">
                      {formatCurrency(selectedEntry.balance_before)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Balance After</label>
                    <div className="text-lg font-medium text-gray-900">
                      {formatCurrency(selectedEntry.balance_after)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Metadata */}
              {selectedEntry.metadata && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Additional Information</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                      {JSON.stringify(selectedEntry.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                {selectedEntry.order_id && (
                  <button
                    onClick={() => {
                      console.log('Navigate to order:', selectedEntry.order_id);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    View Order
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payout Request Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Request Payout</h2>
                  <p className="text-gray-600 text-sm">Confirm withdrawal to your bank account</p>
                </div>
                <button
                  onClick={() => setShowPayoutModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Payout Summary */}
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-700">Available Balance</span>
                    <span className="text-lg font-bold text-emerald-600">
                      {formatCurrency(wallet.available_balance)}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Payout Amount</span>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          {formatCurrency(wallet.available_balance)}
                        </div>
                        <div className="text-xs text-gray-500">Full available balance</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Processing Fee</span>
                      <span className="text-sm font-medium text-gray-900">Free</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Estimated Delivery</span>
                      <span className="text-sm font-medium text-gray-900">
                        {PROCESSING_TIME_DAYS} business days
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bank Account */}
                {wallet.bank_account && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Bank Account</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Bank</span>
                        <span className="text-sm font-medium text-gray-900">{wallet.bank_account.bank_name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Account Number</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatAccountNumber(wallet.bank_account.account_number)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Warning */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Important Notice</p>
                      <p className="text-xs text-yellow-700 mt-1">
                        Payouts are processed within {PROCESSING_TIME_DAYS} business days. 
                        Make sure your bank account details are correct.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => setShowPayoutModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowPayoutModal(false);
                    setShowConfirmPayoutModal(true);
                  }}
                  className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Confirm Payout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payout Confirmation Modal */}
      {showConfirmPayoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Banknote className="w-8 h-8 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Confirm Payout</h2>
                <p className="text-gray-600 text-sm mt-1">
                  You are about to withdraw {formatCurrency(payoutAmount)}
                </p>
              </div>

              {/* Security Check */}
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Amount</span>
                    <span className="text-lg font-bold text-emerald-600">
                      {formatCurrency(payoutAmount)}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">New Balance</span>
                    <span className="text-lg font-medium text-gray-900">
                      {formatCurrency(wallet.available_balance - payoutAmount)}
                    </span>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center">
                    <Lock className="w-5 h-5 text-blue-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Secure Transaction</p>
                      <p className="text-xs text-blue-700 mt-1">
                        Your payout request is protected by bank-grade security
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => setShowConfirmPayoutModal(false)}
                  disabled={loading}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmPayout}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                      Processing...
                    </div>
                  ) : (
                    'Confirm & Submit'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;