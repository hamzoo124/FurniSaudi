import React, { useState, useEffect } from 'react';
import {
  AiOutlineDollar,
  AiOutlineWallet,
  AiOutlineClockCircle,
  AiOutlineDownload,
  AiOutlineBank,
  AiOutlineAlert,
  AiOutlineCheckCircle,
  AiOutlineCloseCircle,
  AiOutlineEye,
  AiOutlineFilter,
  AiOutlineSearch,
  AiOutlineCalendar,
  AiOutlineArrowUp,
  AiOutlineArrowDown,
  AiOutlinePrinter,
  AiOutlineSend,
  AiOutlineReload,
  AiOutlineSetting,
  AiOutlineInfoCircle,
  AiOutlineClose,
  AiOutlineUser,
  AiOutlineCreditCard,
  AiOutlineFileText,
  AiOutlineExclamationCircle,
  AiOutlineLeft,
  AiOutlineHome,
  AiOutlinePieChart,
  AiOutlineTransaction,
  AiOutlineMoneyCollect
} from 'react-icons/ai';

// Types
interface EarningsData {
  totalEarnings: number;
  availableBalance: number;
  pendingBalance: number;
  totalWithdrawn: number;
  todayEarnings: number;
  monthEarnings: number;
  totalCommission: number;
}

interface Transaction {
  id: string;
  transactionId: string;
  date: string;
  amount: number;
  type: 'sale' | 'commission' | 'withdrawal' | 'refund_adjustment' | 'bonus';
  status: 'completed' | 'pending' | 'failed';
  paymentMethod: string;
  description: string;
  orderId?: string;
  productName?: string;
}

interface Withdrawal {
  id: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  bankDetails: {
    bankName: string;
    accountHolder: string;
    iban: string;
  };
  requestedAt: string;
  processedAt?: string;
  rejectionReason?: string;
  transactionId?: string;
}

interface SettlementReport {
  id: string;
  period: string;
  startDate: string;
  endDate: string;
  totalSales: number;
  totalCommission: number;
  refundAdjustments: number;
  bonusAmount: number;
  payableAmount: number;
  status: 'pending' | 'processing' | 'paid';
  paidAt?: string;
  downloadUrl?: string;
}

interface RefundLog {
  id: string;
  orderId: string;
  productName: string;
  refundAmount: number;
  reason: string;
  status: 'requested' | 'approved' | 'rejected' | 'processed';
  initiatedBy: 'customer' | 'seller' | 'admin';
  createdAt: string;
  processedAt?: string;
  notes?: string;
}

interface BankDetails {
  bankName: string;
  accountHolder: string;
  iban: string;
  swiftCode: string;
  isVerified: boolean;
}

// Mock Data
const mockEarningsData: EarningsData = {
  totalEarnings: 47892.50,
  availableBalance: 15420.75,
  pendingBalance: 8450.25,
  totalWithdrawn: 24021.50,
  todayEarnings: 845.00,
  monthEarnings: 12850.75,
  totalCommission: 7250.30
};

const mockTransactions: Transaction[] = [
  {
    id: '1',
    transactionId: 'TXN-001',
    date: '2024-01-15',
    amount: 1249.00,
    type: 'sale',
    status: 'completed',
    paymentMethod: 'credit_card',
    description: 'Luxury Queen Bed Frame',
    orderId: 'ORD-001',
    productName: 'Luxury Queen Bed Frame'
  },
  {
    id: '2',
    transactionId: 'TXN-002',
    date: '2024-01-15',
    amount: -187.35,
    type: 'commission',
    status: 'completed',
    paymentMethod: 'system',
    description: 'Marketplace Commission (15%)',
    orderId: 'ORD-001'
  },
  {
    id: '3',
    transactionId: 'TXN-003',
    date: '2024-01-14',
    amount: 949.50,
    type: 'sale',
    status: 'pending',
    paymentMethod: 'bank_transfer',
    description: 'Custom Dining Table - 50% Deposit',
    orderId: 'ORD-002',
    productName: 'Custom Dining Table'
  },
  {
    id: '4',
    transactionId: 'TXN-004',
    date: '2024-01-13',
    amount: -1500.00,
    type: 'withdrawal',
    status: 'completed',
    paymentMethod: 'bank_transfer',
    description: 'Withdrawal to Bank Account'
  },
  {
    id: '5',
    transactionId: 'TXN-005',
    date: '2024-01-12',
    amount: -450.00,
    type: 'refund_adjustment',
    status: 'completed',
    paymentMethod: 'system',
    description: 'Refund for Order ORD-005',
    orderId: 'ORD-005'
  },
  {
    id: '6',
    transactionId: 'TXN-006',
    date: '2024-01-11',
    amount: 50.00,
    type: 'bonus',
    status: 'completed',
    paymentMethod: 'system',
    description: 'Seller Performance Bonus'
  }
];

const mockWithdrawals: Withdrawal[] = [
  {
    id: '1',
    amount: 1500.00,
    status: 'completed',
    bankDetails: {
      bankName: 'Dubai Islamic Bank',
      accountHolder: 'Ahmed Al-Rashid',
      iban: 'AE070331234567890123456'
    },
    requestedAt: '2024-01-10',
    processedAt: '2024-01-13',
    transactionId: 'TXN-004'
  },
  {
    id: '2',
    amount: 2000.00,
    status: 'processing',
    bankDetails: {
      bankName: 'Emirates NBD',
      accountHolder: 'Ahmed Al-Rashid',
      iban: 'AE260211000000123456789'
    },
    requestedAt: '2024-01-15'
  },
  {
    id: '3',
    amount: 1000.00,
    status: 'pending',
    bankDetails: {
      bankName: 'Mashreq Bank',
      accountHolder: 'Ahmed Al-Rashid',
      iban: 'AE100330000123456789012'
    },
    requestedAt: '2024-01-16'
  }
];

const mockSettlements: SettlementReport[] = [
  {
    id: '1',
    period: 'January 2024',
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    totalSales: 15800.00,
    totalCommission: 2370.00,
    refundAdjustments: -450.00,
    bonusAmount: 50.00,
    payableAmount: 13030.00,
    status: 'paid',
    paidAt: '2024-02-05',
    downloadUrl: '/reports/settlement-jan-2024.pdf'
  },
  {
    id: '2',
    period: 'December 2023',
    startDate: '2023-12-01',
    endDate: '2023-12-31',
    totalSales: 14250.00,
    totalCommission: 2137.50,
    refundAdjustments: -320.00,
    bonusAmount: 100.00,
    payableAmount: 11892.50,
    status: 'paid',
    paidAt: '2024-01-05',
    downloadUrl: '/reports/settlement-dec-2023.pdf'
  },
  {
    id: '3',
    period: 'November 2023',
    startDate: '2023-11-01',
    endDate: '2023-11-30',
    totalSales: 12500.00,
    totalCommission: 1875.00,
    refundAdjustments: -150.00,
    bonusAmount: 0.00,
    payableAmount: 10475.00,
    status: 'paid',
    paidAt: '2023-12-05',
    downloadUrl: '/reports/settlement-nov-2023.pdf'
  }
];

const mockRefunds: RefundLog[] = [
  {
    id: '1',
    orderId: 'ORD-005',
    productName: 'Designer Coffee Table',
    refundAmount: 450.00,
    reason: 'Customer changed mind before delivery',
    status: 'processed',
    initiatedBy: 'customer',
    createdAt: '2024-01-10',
    processedAt: '2024-01-12',
    notes: 'Full refund processed successfully'
  },
  {
    id: '2',
    orderId: 'ORD-007',
    productName: 'Dining Chair Set',
    refundAmount: 320.00,
    reason: 'Product damaged during shipping',
    status: 'approved',
    initiatedBy: 'customer',
    createdAt: '2024-01-18',
    notes: 'Approved for partial refund, waiting for product return'
  },
  {
    id: '3',
    orderId: 'ORD-008',
    productName: 'Bookshelf Unit',
    refundAmount: 280.00,
    reason: 'Wrong color delivered',
    status: 'requested',
    initiatedBy: 'customer',
    createdAt: '2024-01-19',
    notes: 'Customer provided photos of wrong color'
  }
];

const mockBankDetails: BankDetails = {
  bankName: 'Dubai Islamic Bank',
  accountHolder: 'Ahmed Al-Rashid',
  iban: 'AE070331234567890123456',
  swiftCode: 'DUIBAEAD',
  isVerified: true
};

// Modern Glass Card Component
const GlassCard: React.FC<{ children: React.ReactNode; className?: string; hover?: boolean }> = ({ 
  children, 
  className = '', 
  hover = true 
}) => (
  <div className={`
    bg-white/80 backdrop-blur-lg rounded-3xl p-6 
    border border-white/20 shadow-xl shadow-black/5
    ${hover ? 'hover:shadow-2xl hover:shadow-black/10 transition-all duration-500' : ''}
    ${className}
  `}>
    {children}
  </div>
);

// Modern Button Component
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  buttonType?: 'button' | 'submit' | 'reset';
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  onClick, 
  disabled = false,
  buttonType = 'button'
}) => {
  const baseClasses = 'font-semibold rounded-2xl transition-all duration-500 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-opacity-50';
  
  const variants = {
    primary: 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl shadow-blue-500/25',
    secondary: 'bg-gradient-to-r from-gray-700 to-gray-800 text-white hover:from-gray-800 hover:to-gray-900 shadow-lg hover:shadow-xl',
    outline: 'border-2 border-gray-300 text-gray-700 hover:border-blue-500 hover:text-blue-600 bg-transparent hover:bg-blue-50',
    danger: 'bg-gradient-to-r from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700 shadow-lg hover:shadow-xl shadow-red-500/25',
    ghost: 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 bg-transparent'
  };

  const sizes = {
    sm: 'px-4 py-2.5 text-sm',
    md: 'px-6 py-3.5 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  return (
    <button
      type={buttonType}
      className={`
        ${baseClasses} 
        ${variants[variant]} 
        ${sizes[size]} 
        ${className} 
        ${disabled ? 'opacity-50 cursor-not-allowed hover:scale-100' : ''}
      `}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

// Modern Modal Component
const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className={`bg-white/90 backdrop-blur-lg rounded-3xl w-full ${sizes[size]} animate-scaleIn`}>
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-2xl transition-all duration-300 text-gray-500 hover:text-gray-700"
          >
            <AiOutlineClose size={24} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard: React.FC<{
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  color: 'blue' | 'green' | 'yellow' | 'purple';
}> = ({ title, value, icon, trend, color }) => {
  const colors = {
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
    yellow: 'from-yellow-500 to-amber-500',
    purple: 'from-purple-500 to-fuchsia-500'
  };

  return (
    <GlassCard hover={true}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mb-2">{value}</p>
          {trend && (
            <div className="flex items-center text-sm text-green-600">
              <AiOutlineArrowUp className="mr-1" />
              <span>{trend}</span>
            </div>
          )}
        </div>
        <div className={`p-3 bg-gradient-to-r ${colors[color]} rounded-2xl text-white`}>
          {icon}
        </div>
      </div>
    </GlassCard>
  );
};

// Modern Tab Navigation
type TabType = 'overview' | 'transactions' | 'withdrawals' | 'settlements' | 'refunds';

interface TabNavigationProps {
  tabs: { id: TabType; name: string; icon: React.ElementType }[];
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="flex space-x-1 p-2 bg-white/50 backdrop-blur-lg rounded-2xl border border-white/20 shadow-lg">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center space-x-2 py-3 px-4 rounded-xl font-medium text-sm 
              transition-all duration-500 transform hover:scale-105
              ${activeTab === tab.id
                ? 'bg-white shadow-lg text-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
              }
            `}
          >
            <Icon size={18} />
            <span>{tab.name}</span>
          </button>
        );
      })}
    </div>
  );
};
interface ModernPaymentsPage {
  onNavigate: (page: string) => void;
  onBack: () => void | Promise<void>;
}

const ModernPaymentsPage: React.FC<ModernPaymentsPage> = ({ onNavigate, onBack }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [earningsData, setEarningsData] = useState<EarningsData>(mockEarningsData);
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>(mockWithdrawals);
  const [settlements, setSettlements] = useState<SettlementReport[]>(mockSettlements);
  const [refunds, setRefunds] = useState<RefundLog[]>(mockRefunds);
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(mockBankDetails);
  
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [selectedSettlement, setSelectedSettlement] = useState<SettlementReport | null>(null);
  const [selectedRefund, setSelectedRefund] = useState<RefundLog | null>(null);
  
  const [transactionFilters, setTransactionFilters] = useState({
    status: 'all',
    type: 'all',
    dateRange: 'all',
    searchQuery: ''
  });

  const [bankFormData, setBankFormData] = useState({
    bankName: '',
    accountHolder: '',
    iban: '',
    swiftCode: ''
  });

  // Navigation handler (simulated since we don't have react-router-dom)
  const handleBackToDashboard = () => {
    console.log('Navigating back to seller dashboard');
    // In a real app: navigate('/seller-dashboard');
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Handle withdrawal
  const handleWithdraw = () => {
    if (!withdrawAmount || !earningsData) return;
    
    const amount = parseFloat(withdrawAmount);
    if (amount < 50) {
      alert('Minimum withdrawal amount is $50');
      return;
    }
    
    if (amount > earningsData.availableBalance) {
      alert('Insufficient balance');
      return;
    }

    const newWithdrawal: Withdrawal = {
      id: (withdrawals.length + 1).toString(),
      amount: amount,
      status: 'pending',
      bankDetails: bankDetails!,
      requestedAt: new Date().toISOString().split('T')[0]
    };

    setWithdrawals([newWithdrawal, ...withdrawals]);
    setEarningsData({
      ...earningsData,
      availableBalance: earningsData.availableBalance - amount
    });
    
    setShowWithdrawModal(false);
    setWithdrawAmount('');
  };

  // Handle bank details submission
  const handleBankSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newBankDetails: BankDetails = {
      ...bankFormData,
      isVerified: true
    };
    setBankDetails(newBankDetails);
    setShowBankModal(false);
  };

  // View transaction details
  const handleViewTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionModal(true);
  };

  // View settlement details
  const handleViewSettlement = (settlement: SettlementReport) => {
    setSelectedSettlement(settlement);
    setShowSettlementModal(true);
  };

  // View refund details
  const handleViewRefund = (refund: RefundLog) => {
    setSelectedRefund(refund);
    setShowRefundModal(true);
  };

  // Filter transactions based on filters
  const filteredTransactions = transactions.filter(transaction => {
    if (transactionFilters.status !== 'all' && transaction.status !== transactionFilters.status) return false;
    if (transactionFilters.type !== 'all' && transaction.type !== transactionFilters.type) return false;
    if (transactionFilters.searchQuery && 
        !transaction.transactionId.toLowerCase().includes(transactionFilters.searchQuery.toLowerCase()) &&
        !transaction.description.toLowerCase().includes(transactionFilters.searchQuery.toLowerCase()) &&
        !transaction.orderId?.toLowerCase().includes(transactionFilters.searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Get status color
  const getStatusColor = (status: string) => {
    const colors = {
      completed: 'bg-green-100 text-green-800 border-green-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      failed: 'bg-red-100 text-red-800 border-red-200',
      processing: 'bg-blue-100 text-blue-800 border-blue-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      requested: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-blue-100 text-blue-800 border-blue-200',
      processed: 'bg-green-100 text-green-800 border-green-200',
      paid: 'bg-green-100 text-green-800 border-green-200'
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  // Get type color
  const getTypeColor = (type: string) => {
    const colors = {
      sale: 'bg-green-100 text-green-800',
      commission: 'bg-red-100 text-red-800',
      withdrawal: 'bg-blue-100 text-blue-800',
      refund_adjustment: 'bg-orange-100 text-orange-800',
      bonus: 'bg-purple-100 text-purple-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const tabs = [
    { id: 'overview' as TabType, name: 'Overview', icon: AiOutlinePieChart },
    { id: 'transactions' as TabType, name: 'Transactions', icon: AiOutlineTransaction },
    { id: 'withdrawals' as TabType, name: 'Withdrawals', icon: AiOutlineMoneyCollect },
    { id: 'settlements' as TabType, name: 'Settlements', icon: AiOutlineDownload },
    { id: 'refunds' as TabType, name: 'Refunds', icon: AiOutlineAlert }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToDashboard}
                className="flex items-center gap-2 group"
              >
                <AiOutlineLeft 
                  size={18} 
                  className="group-hover:-translate-x-1 transition-transform duration-300" 
                />
                <span>Back to Dashboard</span>
              </Button>
            </div>
            <div className="text-right">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Payments & Earnings
              </h1>
              <p className="text-gray-600 mt-2 text-lg">Manage your earnings, withdrawals, and payment history</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <TabNavigation tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Main Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Total Earnings"
                  value={formatCurrency(earningsData.totalEarnings)}
                  icon={<AiOutlineDollar size={24} />}
                  trend="All time revenue"
                  color="green"
                />
                <StatCard
                  title="Available Balance"
                  value={formatCurrency(earningsData.availableBalance)}
                  icon={<AiOutlineWallet size={24} />}
                  color="blue"
                />
                <StatCard
                  title="Pending Balance"
                  value={formatCurrency(earningsData.pendingBalance)}
                  icon={<AiOutlineClockCircle size={24} />}
                  color="yellow"
                />
                <StatCard
                  title="This Month"
                  value={formatCurrency(earningsData.monthEarnings)}
                  icon={<AiOutlineCalendar size={24} />}
                  trend="Current period"
                  color="purple"
                />
              </div>

              {/* Additional Stats and Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <GlassCard>
                  <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                      <span className="text-gray-600">Today's Earnings</span>
                      <span className="font-semibold text-green-600">{formatCurrency(earningsData.todayEarnings)}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                      <span className="text-gray-600">Total Withdrawn</span>
                      <span className="font-semibold text-blue-600">{formatCurrency(earningsData.totalWithdrawn)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Commission Paid</span>
                      <span className="font-semibold text-red-600">{formatCurrency(earningsData.totalCommission)}</span>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard className="lg:col-span-2">
                  <h3 className="text-lg font-semibold mb-4">Earnings Overview</h3>
                  <div className="h-64 flex items-center justify-center text-gray-500 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <AiOutlineDollar className="text-white text-2xl" />
                      </div>
                      <p className="font-semibold">Earnings Visualization</p>
                      <p className="text-sm">Interactive chart showing revenue trends</p>
                    </div>
                  </div>
                </GlassCard>
              </div>

              {/* Recent Activity & Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GlassCard>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Recent Transactions</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab('transactions')}
                    >
                      View All
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {transactions.slice(0, 4).map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 hover:bg-white/50 rounded-xl transition-all duration-300">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                            transaction.type === 'sale' ? 'bg-green-100 text-green-600' :
                            transaction.type === 'commission' ? 'bg-red-100 text-red-600' :
                            transaction.type === 'withdrawal' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                          }`}>
                            <AiOutlineDollar size={18} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">
                              {transaction.description}
                            </p>
                            <p className="text-xs text-gray-500">
                              {transaction.date} • {transaction.transactionId}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${
                            transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>

                <GlassCard>
                  <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <Button 
                      onClick={() => setShowWithdrawModal(true)}
                      className="w-full justify-center"
                    >
                      <AiOutlineBank className="mr-2" />
                      Withdraw Funds
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setShowBankModal(true)}
                      className="w-full justify-center"
                    >
                      <AiOutlineSetting className="mr-2" />
                      Manage Bank Account
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setActiveTab('settlements')}
                      className="w-full justify-center"
                    >
                      <AiOutlineDownload className="mr-2" />
                      View Settlements
                    </Button>
                  </div>
                </GlassCard>
              </div>
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <GlassCard>
              <div className="space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                      <AiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search transactions..."
                        className="pl-10 pr-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64 transition-all duration-300 bg-white/50 backdrop-blur-sm"
                        value={transactionFilters.searchQuery}
                        onChange={(e) => setTransactionFilters({
                          ...transactionFilters,
                          searchQuery: e.target.value
                        })}
                      />
                    </div>
                    <select 
                      value={transactionFilters.status}
                      onChange={(e) => setTransactionFilters({
                        ...transactionFilters,
                        status: e.target.value
                      })}
                      className="border border-gray-300 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm"
                    >
                      <option value="all">All Status</option>
                      <option value="completed">Completed</option>
                      <option value="pending">Pending</option>
                      <option value="failed">Failed</option>
                    </select>
                    <select 
                      value={transactionFilters.type}
                      onChange={(e) => setTransactionFilters({
                        ...transactionFilters,
                        type: e.target.value
                      })}
                      className="border border-gray-300 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm"
                    >
                      <option value="all">All Types</option>
                      <option value="sale">Sales</option>
                      <option value="commission">Commissions</option>
                      <option value="withdrawal">Withdrawals</option>
                      <option value="refund_adjustment">Refunds</option>
                      <option value="bonus">Bonuses</option>
                    </select>
                  </div>
                  <Button variant="outline" className="flex items-center space-x-2">
                    <AiOutlineDownload size={18} />
                    <span>Export CSV</span>
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl">
                      <tr>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Transaction</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Date</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Amount</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Type</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Status</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredTransactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-white/50 transition-colors duration-200">
                          <td className="py-4 px-6">
                            <div>
                              <p className="font-medium text-gray-900">{transaction.description}</p>
                              <p className="text-xs text-gray-500">{transaction.transactionId}</p>
                              {transaction.orderId && (
                                <p className="text-xs text-gray-500">Order: {transaction.orderId}</p>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <p className="text-sm text-gray-900">{transaction.date}</p>
                          </td>
                          <td className="py-4 px-6">
                            <p className={`font-semibold ${
                              transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                            </p>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(transaction.type)}`}>
                              {transaction.type.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                              {transaction.status}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <Button 
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewTransaction(transaction)}
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Withdrawals Tab */}
          {activeTab === 'withdrawals' && (
            <GlassCard>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Withdrawal Management</h3>
                    <p className="text-gray-600">Track your withdrawal requests and status</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Button 
                      variant="outline"
                      onClick={() => setShowBankModal(true)}
                    >
                      <AiOutlineSetting className="mr-2" />
                      Bank Settings
                    </Button>
                    <Button 
                      onClick={() => setShowWithdrawModal(true)}
                    >
                      <AiOutlineBank className="mr-2" />
                      New Withdrawal
                    </Button>
                  </div>
                </div>

                {/* Bank Details */}
                {bankDetails && (
                  <GlassCard>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">Bank Account Details</h4>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        bankDetails.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {bankDetails.isVerified ? 'Verified' : 'Pending Verification'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Bank Name</p>
                        <p className="font-medium">{bankDetails.bankName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Account Holder</p>
                        <p className="font-medium">{bankDetails.accountHolder}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">IBAN</p>
                        <p className="font-medium">{bankDetails.iban}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">SWIFT Code</p>
                        <p className="font-medium">{bankDetails.swiftCode}</p>
                      </div>
                    </div>
                  </GlassCard>
                )}

                {/* Withdrawals Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl">
                      <tr>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Withdrawal ID</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Amount</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Bank</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Requested</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Status</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {withdrawals.map((withdrawal) => (
                        <tr key={withdrawal.id} className="hover:bg-white/50 transition-colors duration-200">
                          <td className="py-4 px-6">
                            <p className="font-medium text-gray-900">WD-{withdrawal.id}</p>
                            {withdrawal.transactionId && (
                              <p className="text-xs text-gray-500">{withdrawal.transactionId}</p>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <p className="font-bold text-gray-900">{formatCurrency(withdrawal.amount)}</p>
                          </td>
                          <td className="py-4 px-6">
                            <div>
                              <p className="text-sm font-medium">{withdrawal.bankDetails.bankName}</p>
                              <p className="text-xs text-gray-500">***{withdrawal.bankDetails.iban.slice(-4)}</p>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <p className="text-sm text-gray-900">{withdrawal.requestedAt}</p>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(withdrawal.status)}`}>
                              {withdrawal.status}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            {withdrawal.status === 'pending' && (
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => {
                                  setWithdrawals(withdrawals.filter(w => w.id !== withdrawal.id));
                                  setEarningsData({
                                    ...earningsData,
                                    availableBalance: earningsData.availableBalance + withdrawal.amount
                                  });
                                }}
                              >
                                Cancel
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Settlements Tab */}
          {activeTab === 'settlements' && (
            <GlassCard>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Settlement Reports</h3>
                    <p className="text-gray-600">Monthly settlement reports and payouts</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {settlements.map((settlement) => (
                    <GlassCard key={settlement.id} className="hover:shadow-2xl transition-all duration-500">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-900">{settlement.period}</h4>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(settlement.status)}`}>
                          {settlement.status}
                        </span>
                      </div>
                      
                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Total Sales</span>
                          <span className="font-medium text-green-600">{formatCurrency(settlement.totalSales)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Commission</span>
                          <span className="font-medium text-red-600">-{formatCurrency(settlement.totalCommission)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Refunds</span>
                          <span className="font-medium text-orange-600">{formatCurrency(settlement.refundAdjustments)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Bonus</span>
                          <span className="font-medium text-purple-600">+{formatCurrency(settlement.bonusAmount)}</span>
                        </div>
                        <div className="border-t border-gray-200 pt-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-900">Payable Amount</span>
                            <span className="font-bold text-blue-600">{formatCurrency(settlement.payableAmount)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="secondary"
                          onClick={() => handleViewSettlement(settlement)}
                          className="flex-1"
                        >
                          View Details
                        </Button>
                        <Button 
                          onClick={() => alert(`Downloading report for ${settlement.period}`)}
                          className="flex-1"
                        >
                          Download
                        </Button>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              </div>
            </GlassCard>
          )}

          {/* Refunds Tab */}
          {activeTab === 'refunds' && (
            <GlassCard>
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Refund & Dispute Log</h3>
                  <p className="text-gray-600">Track refund requests and their impact on your earnings</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl">
                      <tr>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Refund ID</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Order ID</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Product</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Amount</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Status</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Requested</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {refunds.map((refund) => (
                        <tr key={refund.id} className="hover:bg-white/50 transition-colors duration-200">
                          <td className="py-4 px-6">
                            <p className="font-medium text-gray-900">REF-{refund.id}</p>
                          </td>
                          <td className="py-4 px-6">
                            <p className="font-medium text-gray-900">{refund.orderId}</p>
                          </td>
                          <td className="py-4 px-6">
                            <p className="text-sm text-gray-900">{refund.productName}</p>
                          </td>
                          <td className="py-4 px-6">
                            <p className="font-bold text-red-600">-{formatCurrency(refund.refundAmount)}</p>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(refund.status)}`}>
                              {refund.status}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <p className="text-sm text-gray-600">{refund.createdAt}</p>
                          </td>
                          <td className="py-4 px-6">
                            <Button 
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewRefund(refund)}
                            >
                              View Details
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </GlassCard>
          )}
        </div>
      </div>

      {/* Withdraw Modal */}
      <Modal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        title="Withdraw Funds"
        size="sm"
      >
        {!bankDetails ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AiOutlineBank className="text-white text-2xl" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Bank Account Required</h3>
            <p className="text-gray-600 mb-6">
              You need to set up your bank account details before making withdrawals.
            </p>
            <Button
              onClick={() => {
                setShowWithdrawModal(false);
                setShowBankModal(true);
              }}
              className="w-full"
            >
              Setup Bank Account
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount to Withdraw
              </label>
              <div className="relative">
                <AiOutlineDollar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
                  max={earningsData.availableBalance}
                  min="50"
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Available: {formatCurrency(earningsData.availableBalance)} • Minimum: $50
              </p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4">
              <div className="flex items-start space-x-3">
                <AiOutlineInfoCircle className="text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-blue-700">
                    Withdrawals process within 3-5 business days. A 2.5% processing fee applies.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => setShowWithdrawModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleWithdraw}
                disabled={!withdrawAmount || parseFloat(withdrawAmount) < 50}
                className="flex-1"
              >
                Confirm Withdrawal
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Bank Details Modal */}
      <Modal
        isOpen={showBankModal}
        onClose={() => setShowBankModal(false)}
        title="Bank Account Details"
        size="sm"
      >
        <form onSubmit={handleBankSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bank Name
            </label>
            <input
              type="text"
              value={bankFormData.bankName}
              onChange={(e) => setBankFormData({ ...bankFormData, bankName: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Holder Name
            </label>
            <input
              type="text"
              value={bankFormData.accountHolder}
              onChange={(e) => setBankFormData({ ...bankFormData, accountHolder: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              IBAN
            </label>
            <input
              type="text"
              value={bankFormData.iban}
              onChange={(e) => setBankFormData({ ...bankFormData, iban: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SWIFT/BIC Code
            </label>
            <input
              type="text"
              value={bankFormData.swiftCode}
              onChange={(e) => setBankFormData({ ...bankFormData, swiftCode: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowBankModal(false)}
              className="flex-1"
              buttonType="button"
            >
              Cancel
            </Button>
            <Button
              buttonType="submit"
              className="flex-1"
            >
              Save Bank Details
            </Button>
          </div>
        </form>
      </Modal>

      {/* Transaction Details Modal */}
      <Modal
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        title="Transaction Details"
        size="md"
      >
        {selectedTransaction && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Transaction ID</p>
                <p className="font-medium">{selectedTransaction.transactionId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-medium">{selectedTransaction.date}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Type</p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(selectedTransaction.type)}`}>
                  {selectedTransaction.type.replace('_', ' ')}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTransaction.status)}`}>
                  {selectedTransaction.status}
                </span>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600">Description</p>
              <p className="font-medium">{selectedTransaction.description}</p>
            </div>

            {selectedTransaction.orderId && (
              <div>
                <p className="text-sm text-gray-600">Order ID</p>
                <p className="font-medium">{selectedTransaction.orderId}</p>
              </div>
            )}

            <div>
              <p className="text-sm text-gray-600">Amount</p>
              <p className={`text-3xl font-bold ${
                selectedTransaction.amount > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {selectedTransaction.amount > 0 ? '+' : ''}{formatCurrency(selectedTransaction.amount)}
              </p>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => setShowTransactionModal(false)}
                className="flex-1"
              >
                Close
              </Button>
              <Button className="flex-1">
                Print Receipt
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Settlement Details Modal */}
      <Modal
        isOpen={showSettlementModal}
        onClose={() => setShowSettlementModal(false)}
        title={`Settlement Report - ${selectedSettlement?.period}`}
        size="lg"
      >
        {selectedSettlement && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600">Period</p>
                <p className="font-medium">{selectedSettlement.period}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedSettlement.status)}`}>
                  {selectedSettlement.status}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Start Date</p>
                <p className="font-medium">{selectedSettlement.startDate}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">End Date</p>
                <p className="font-medium">{selectedSettlement.endDate}</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-6">
              <h3 className="font-semibold mb-4">Breakdown</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Total Sales</span>
                  <span className="font-medium text-green-600">{formatCurrency(selectedSettlement.totalSales)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Marketplace Commission (15%)</span>
                  <span className="font-medium text-red-600">-{formatCurrency(selectedSettlement.totalCommission)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Refund Adjustments</span>
                  <span className="font-medium text-orange-600">{formatCurrency(selectedSettlement.refundAdjustments)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Bonus & Incentives</span>
                  <span className="font-medium text-purple-600">+{formatCurrency(selectedSettlement.bonusAmount)}</span>
                </div>
                <div className="border-t border-gray-300 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-lg">Net Payable Amount</span>
                    <span className="font-bold text-2xl text-blue-600">{formatCurrency(selectedSettlement.payableAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {selectedSettlement.paidAt && (
              <div>
                <p className="text-sm text-gray-600">Paid Date</p>
                <p className="font-medium">{selectedSettlement.paidAt}</p>
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => setShowSettlementModal(false)}
                className="flex-1"
              >
                Close
              </Button>
              <Button 
                onClick={() => alert(`Downloading report for ${selectedSettlement.period}`)}
                className="flex-1"
              >
                Download PDF
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Refund Details Modal */}
      <Modal
        isOpen={showRefundModal}
        onClose={() => setShowRefundModal(false)}
        title="Refund Details"
        size="md"
      >
        {selectedRefund && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Refund ID</p>
                <p className="font-medium">REF-{selectedRefund.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Order ID</p>
                <p className="font-medium">{selectedRefund.orderId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedRefund.status)}`}>
                  {selectedRefund.status}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Initiated By</p>
                <p className="font-medium capitalize">{selectedRefund.initiatedBy}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600">Product</p>
              <p className="font-medium">{selectedRefund.productName}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Refund Amount</p>
              <p className="text-3xl font-bold text-red-600">-{formatCurrency(selectedRefund.refundAmount)}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Reason</p>
              <p className="font-medium">{selectedRefund.reason}</p>
            </div>

            {selectedRefund.notes && (
              <div>
                <p className="text-sm text-gray-600">Notes</p>
                <p className="font-medium">{selectedRefund.notes}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Requested</p>
                <p className="font-medium">{selectedRefund.createdAt}</p>
              </div>
              {selectedRefund.processedAt && (
                <div>
                  <p className="text-sm text-gray-600">Processed</p>
                  <p className="font-medium">{selectedRefund.processedAt}</p>
                </div>
              )}
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => setShowRefundModal(false)}
                className="flex-1"
              >
                Close
              </Button>
              {selectedRefund.status === 'approved' && (
                <Button className="flex-1">
                  Process Refund
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ModernPaymentsPage;