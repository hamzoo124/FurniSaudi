import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  FileText,
  Calculator,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Check,
  X,
  ChevronRight,
  ChevronDown,
  Calendar,
  FileSpreadsheet,
  Hash,
  Package,
  User,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  Percent,
  CalendarDays,
  Ban,
  ExternalLink
} from 'lucide-react';

// TypeScript Interfaces
interface VATTransaction {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  customerName: string;
  transactionType: 'sale' | 'refund' | 'adjustment';
  netAmount: number;
  vatAmount: number;
  totalAmount: number;
  status: 'collected' | 'pending' | 'paid' | 'refunded';
  createdAt: string;
  dueDate?: string;
  paymentDate?: string;
  invoiceNumber?: string;
  category: 'furniture' | 'custom' | 'delivery' | 'service';
}

interface VATSummary {
  totalVATCollected: number;
  vatPayable: number;
  vatPaid: number;
  vatRefunds: number;
  pendingVAT: number;
  currentPeriodVAT: number;
  previousPeriodVAT: number;
  vatRate: number;
  nextPaymentDue: string;
  lastPaymentDate: string;
  taxableSales: number;
  nonTaxableSales: number;
}

interface FilterState {
  dateRange: 'all' | 'current-quarter' | 'last-quarter' | 'month' | 'custom';
  startDate?: string;
  endDate?: string;
  status: string;
  transactionType: string;
  category: string;
  search: string;
}

// Mock Data Generation
const generateMockVATTransactions = (): VATTransaction[] => [
  {
    id: 'VAT-001',
    orderId: 'ORD-7845',
    productId: '1',
    productName: 'Modern Executive Office Chair',
    customerName: 'Ahmed Al-Mansoor',
    transactionType: 'sale',
    netAmount: 2499,
    vatAmount: 375,
    totalAmount: 2874,
    status: 'collected',
    createdAt: '2024-01-15',
    dueDate: '2024-04-30',
    invoiceNumber: 'INV-2024-001',
    category: 'furniture'
  },
  {
    id: 'VAT-002',
    orderId: 'ORD-7844',
    productId: '2',
    productName: 'Leather Reclining Sofa',
    customerName: 'Sarah Johnson',
    transactionType: 'sale',
    netAmount: 8999,
    vatAmount: 1350,
    totalAmount: 10349,
    status: 'collected',
    createdAt: '2024-01-14',
    dueDate: '2024-04-30',
    invoiceNumber: 'INV-2024-002',
    category: 'furniture'
  },
  {
    id: 'VAT-003',
    orderId: 'ORD-7843',
    productId: '3',
    productName: 'Custom Wood Dining Table',
    customerName: 'Mohammed Khan',
    transactionType: 'sale',
    netAmount: 12999,
    vatAmount: 1950,
    totalAmount: 14949,
    status: 'pending',
    createdAt: '2024-01-14',
    dueDate: '2024-04-30',
    invoiceNumber: 'INV-2024-003',
    category: 'custom'
  },
  {
    id: 'VAT-004',
    orderId: 'ORD-7842',
    productId: '4',
    productName: 'Minimalist Coffee Table',
    customerName: 'Fatima Al-Sayed',
    transactionType: 'refund',
    netAmount: 2499,
    vatAmount: 375,
    totalAmount: 2874,
    status: 'refunded',
    createdAt: '2024-01-13',
    paymentDate: '2024-01-16',
    invoiceNumber: 'INV-2024-004',
    category: 'furniture'
  },
  {
    id: 'VAT-005',
    orderId: 'ORD-7841',
    productId: '5',
    productName: 'Ergonomic Study Desk',
    customerName: 'Robert Chen',
    transactionType: 'sale',
    netAmount: 3499,
    vatAmount: 525,
    totalAmount: 4024,
    status: 'collected',
    createdAt: '2024-01-13',
    dueDate: '2024-04-30',
    invoiceNumber: 'INV-2024-005',
    category: 'furniture'
  },
  {
    id: 'VAT-006',
    orderId: 'ORD-7840',
    productId: '6',
    productName: 'Queen Size Storage Bed',
    customerName: 'Khalid Abdullah',
    transactionType: 'sale',
    netAmount: 6999,
    vatAmount: 1050,
    totalAmount: 8049,
    status: 'collected',
    createdAt: '2024-01-12',
    dueDate: '2024-04-30',
    invoiceNumber: 'INV-2024-006',
    category: 'furniture'
  },
  {
    id: 'VAT-007',
    orderId: 'ORD-7839',
    productId: '7',
    productName: 'Outdoor Patio Set',
    customerName: 'Layla Mohammed',
    transactionType: 'refund',
    netAmount: 12999,
    vatAmount: 1950,
    totalAmount: 14949,
    status: 'pending',
    createdAt: '2024-01-12',
    dueDate: '2024-04-30',
    invoiceNumber: 'INV-2024-007',
    category: 'furniture'
  },
  {
    id: 'VAT-008',
    orderId: 'ORD-7838',
    productId: '8',
    productName: 'Custom Bookshelf',
    customerName: 'Yusuf Ahmed',
    transactionType: 'sale',
    netAmount: 8999,
    vatAmount: 1350,
    totalAmount: 10349,
    status: 'collected',
    createdAt: '2024-01-11',
    dueDate: '2024-04-30',
    invoiceNumber: 'INV-2024-008',
    category: 'custom'
  },
  {
    id: 'VAT-009',
    orderId: 'ORD-7837',
    productId: '1',
    productName: 'Modern Executive Office Chair',
    customerName: 'Amira Hassan',
    transactionType: 'sale',
    netAmount: 2999,
    vatAmount: 450,
    totalAmount: 3449,
    status: 'collected',
    createdAt: '2024-01-10',
    dueDate: '2024-04-30',
    invoiceNumber: 'INV-2024-009',
    category: 'furniture'
  },
  {
    id: 'VAT-010',
    orderId: 'ORD-7836',
    productId: '2',
    productName: 'Leather Reclining Sofa',
    customerName: 'David Wilson',
    transactionType: 'sale',
    netAmount: 8999,
    vatAmount: 1350,
    totalAmount: 10349,
    status: 'collected',
    createdAt: '2024-01-09',
    dueDate: '2024-04-30',
    invoiceNumber: 'INV-2024-010',
    category: 'furniture'
  },
  {
    id: 'VAT-011',
    orderId: 'ORD-7835',
    productId: '3',
    productName: 'Custom Wood Dining Table',
    customerName: 'Noura Al-Rashid',
    transactionType: 'sale',
    netAmount: 12999,
    vatAmount: 1950,
    totalAmount: 14949,
    status: 'paid',
    createdAt: '2024-01-08',
    paymentDate: '2024-01-15',
    invoiceNumber: 'INV-2024-011',
    category: 'custom'
  },
  {
    id: 'VAT-012',
    orderId: 'ORD-7834',
    productId: '4',
    productName: 'Minimalist Coffee Table',
    customerName: 'Carlos Rodriguez',
    transactionType: 'sale',
    netAmount: 2499,
    vatAmount: 375,
    totalAmount: 2874,
    status: 'paid',
    createdAt: '2024-01-07',
    paymentDate: '2024-01-14',
    invoiceNumber: 'INV-2024-012',
    category: 'furniture'
  },
  {
    id: 'VAT-013',
    orderId: 'ORD-7833',
    productId: '1',
    productName: 'Modern Executive Office Chair',
    customerName: 'Samira Khalid',
    transactionType: 'adjustment',
    netAmount: -2999,
    vatAmount: -450,
    totalAmount: -3449,
    status: 'collected',
    createdAt: '2024-01-06',
    dueDate: '2024-04-30',
    invoiceNumber: 'INV-2024-013',
    category: 'furniture'
  },
  {
    id: 'VAT-014',
    orderId: 'ORD-7832',
    productId: '5',
    productName: 'Ergonomic Study Desk',
    customerName: 'Thomas Brown',
    transactionType: 'sale',
    netAmount: 3499,
    vatAmount: 525,
    totalAmount: 4024,
    status: 'collected',
    createdAt: '2024-01-05',
    dueDate: '2024-04-30',
    invoiceNumber: 'INV-2024-014',
    category: 'furniture'
  },
  {
    id: 'VAT-015',
    orderId: 'ORD-7831',
    productId: '6',
    productName: 'Queen Size Storage Bed',
    customerName: 'Fatima Zahra',
    transactionType: 'sale',
    netAmount: 6999,
    vatAmount: 1050,
    totalAmount: 8049,
    status: 'collected',
    createdAt: '2024-01-04',
    dueDate: '2024-04-30',
    invoiceNumber: 'INV-2024-015',
    category: 'furniture'
  }
];

const calculateVATSummary = (transactions: VATTransaction[]): VATSummary => {
  const now = new Date();
  const currentQuarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  const lastQuarterStart = new Date(now.getFullYear(), (Math.floor(now.getMonth() / 3) - 1) * 3, 1);
  const lastQuarterEnd = new Date(currentQuarterStart.getTime() - 1);

  const currentQuarterTransactions = transactions.filter(t => 
    new Date(t.createdAt) >= currentQuarterStart
  );
  
  const lastQuarterTransactions = transactions.filter(t => 
    new Date(t.createdAt) >= lastQuarterStart && new Date(t.createdAt) < currentQuarterStart
  );

  const totalVATCollected = transactions
    .filter(t => t.status === 'collected' && t.vatAmount > 0)
    .reduce((sum, t) => sum + t.vatAmount, 0);

  const vatPaid = transactions
    .filter(t => t.status === 'paid')
    .reduce((sum, t) => sum + t.vatAmount, 0);

  const vatRefunds = transactions
    .filter(t => t.transactionType === 'refund')
    .reduce((sum, t) => sum + Math.abs(t.vatAmount), 0);

  const pendingVAT = transactions
    .filter(t => t.status === 'pending')
    .reduce((sum, t) => sum + t.vatAmount, 0);

  const vatPayable = totalVATCollected - vatPaid;

  const currentPeriodVAT = currentQuarterTransactions
    .filter(t => t.vatAmount > 0)
    .reduce((sum, t) => sum + t.vatAmount, 0);

  const previousPeriodVAT = lastQuarterTransactions
    .filter(t => t.vatAmount > 0)
    .reduce((sum, t) => sum + t.vatAmount, 0);

  const taxableSales = transactions
    .filter(t => t.transactionType === 'sale')
    .reduce((sum, t) => sum + t.netAmount, 0);

  const nonTaxableSales = transactions
    .filter(t => t.transactionType === 'sale' && t.vatAmount === 0)
    .reduce((sum, t) => sum + t.netAmount, 0) || 0;

  // Calculate next payment due (last day of current quarter)
  const currentQuarter = Math.floor(now.getMonth() / 3);
  const quarterEndMonth = currentQuarter * 3 + 2; // 0-based: 2, 5, 8, 11
  const quarterEndDay = new Date(now.getFullYear(), quarterEndMonth + 1, 0).getDate();
  const nextPaymentDue = `${now.getFullYear()}-${String(quarterEndMonth + 1).padStart(2, '0')}-${String(quarterEndDay).padStart(2, '0')}`;

  const lastPaidTransaction = transactions
    .filter(t => t.status === 'paid')
    .sort((a, b) => new Date(b.paymentDate!).getTime() - new Date(a.paymentDate!).getTime())[0];

  return {
    totalVATCollected,
    vatPayable,
    vatPaid,
    vatRefunds,
    pendingVAT,
    currentPeriodVAT,
    previousPeriodVAT,
    vatRate: 15,
    nextPaymentDue,
    lastPaymentDate: lastPaidTransaction?.paymentDate || '2023-12-31',
    taxableSales,
    nonTaxableSales
  };
};

// Transaction Details Modal
const TransactionModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  transaction: VATTransaction | null;
  onMarkAsPaid: (transactionId: string) => void;
}> = ({ isOpen, onClose, transaction, onMarkAsPaid }) => {
  if (!isOpen || !transaction) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getStatusBadge = (status: VATTransaction['status']) => {
    const config = {
      collected: { color: 'bg-green-100 text-green-800', icon: Clock, label: 'Collected' },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle, label: 'Pending' },
      paid: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, label: 'Paid' },
      refunded: { color: 'bg-purple-100 text-purple-800', icon: ArrowDownRight, label: 'Refunded' }
    };
    
    const { color, icon: Icon, label } = config[status];
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${color}`}>
        <Icon className="w-4 h-4" />
        {label}
      </span>
    );
  };

  const getTransactionTypeBadge = (type: VATTransaction['transactionType']) => {
    const config = {
      sale: { color: 'bg-blue-100 text-blue-800', icon: ArrowUpRight, label: 'Sale' },
      refund: { color: 'bg-red-100 text-red-800', icon: ArrowDownRight, label: 'Refund' },
      adjustment: { color: 'bg-gray-100 text-gray-800', icon: Calculator, label: 'Adjustment' }
    };
    
    const { color, icon: Icon, label } = config[type];
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${color}`}>
        <Icon className="w-4 h-4" />
        {label}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">VAT Transaction Details</h2>
            <p className="text-gray-600 text-sm mt-1">Transaction ID: {transaction.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Transaction Details */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Transaction ID</label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Hash className="w-4 h-4 text-gray-500" />
                  <span className="font-mono font-medium">{transaction.id}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Order ID</label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Receipt className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">{transaction.orderId}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Customer</label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">{transaction.customerName}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Package className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">{transaction.productName}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Type</label>
                <div className="p-3">
                  {getTransactionTypeBadge(transaction.transactionType)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <div className="p-3">
                  {getStatusBadge(transaction.status)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Number</label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">{transaction.invoiceNumber || 'N/A'}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <div className="p-3">
                  <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                    {transaction.category.charAt(0).toUpperCase() + transaction.category.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Amount Details */}
          <div className="mt-6 p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Amount Details</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Net Amount</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(transaction.netAmount)}</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-2">VAT Amount (15%)</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(transaction.vatAmount)}</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Total Amount</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(transaction.totalAmount)}</p>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="mt-6 grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Date</label>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="font-medium">{transaction.createdAt}</span>
              </div>
            </div>
            {transaction.dueDate && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <CalendarDays className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">{transaction.dueDate}</span>
                </div>
              </div>
            )}
            {transaction.paymentDate && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Date</label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="font-medium text-green-600">{transaction.paymentDate}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
          >
            Close
          </button>
          {transaction.status === 'collected' && (
            <button
              onClick={() => {
                onMarkAsPaid(transaction.id);
                onClose();
              }}
              className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              <Check className="w-4 h-4 inline mr-2" />
              Mark as Paid
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Component
const VATSummary: React.FC = () => {
  const [transactions, setTransactions] = useState<VATTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<VATTransaction[]>([]);
  const [summary, setSummary] = useState<VATSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<VATTransaction | null>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    dateRange: 'current-quarter',
    status: 'all',
    transactionType: 'all',
    category: 'all',
    search: ''
  });
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadVATData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [transactions, filters]);

  const loadVATData = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const mockTransactions = generateMockVATTransactions();
    setTransactions(mockTransactions);
    setFilteredTransactions(mockTransactions);
    setSummary(calculateVATSummary(mockTransactions));
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(t => 
        t.id.toLowerCase().includes(searchTerm) ||
        t.orderId.toLowerCase().includes(searchTerm) ||
        t.productName.toLowerCase().includes(searchTerm) ||
        t.customerName.toLowerCase().includes(searchTerm) ||
        t.invoiceNumber?.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(t => t.status === filters.status);
    }

    if (filters.transactionType !== 'all') {
      filtered = filtered.filter(t => t.transactionType === filters.transactionType);
    }

    if (filters.category !== 'all') {
      filtered = filtered.filter(t => t.category === filters.category);
    }

    // Date range filter
    const now = new Date();
    let startDate = new Date(0);
    
    switch (filters.dateRange) {
      case 'current-quarter':
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      case 'last-quarter':
        startDate = new Date(now.getFullYear(), (Math.floor(now.getMonth() / 3) - 1) * 3, 1);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'custom':
        if (filters.startDate) {
          startDate = new Date(filters.startDate);
        }
        break;
    }

    if (filters.dateRange !== 'all') {
      filtered = filtered.filter(t => new Date(t.createdAt) >= startDate);
    }

    setFilteredTransactions(filtered);
    setPage(1);
  };

  const handleMarkAsPaid = (transactionId: string) => {
    setTransactions(transactions.map(t => 
      t.id === transactionId 
        ? { 
            ...t, 
            status: 'paid' as const,
            paymentDate: new Date().toISOString().split('T')[0]
          }
        : t
    ));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatCurrencyWithDecimals = (amount: number) => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getStatusBadge = (status: VATTransaction['status']) => {
    const config = {
      collected: { color: 'bg-green-100 text-green-800', icon: Clock },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
      paid: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      refunded: { color: 'bg-purple-100 text-purple-800', icon: ArrowDownRight }
    };
    
    const { color, icon: Icon } = config[status];
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getTransactionTypeIcon = (type: VATTransaction['transactionType']) => {
    const config = {
      sale: { icon: ArrowUpRight, color: 'text-green-600' },
      refund: { icon: ArrowDownRight, color: 'text-red-600' },
      adjustment: { icon: Calculator, color: 'text-gray-600' }
    };
    
    const { icon: Icon, color } = config[type];
    return <Icon className={`w-4 h-4 ${color}`} />;
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Order ID', 'Product', 'Customer', 'Type', 'Net Amount', 'VAT Amount', 'Total', 'Status', 'Date', 'Invoice'];
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(t => [
        t.id,
        t.orderId,
        `"${t.productName}"`,
        t.customerName,
        t.transactionType,
        t.netAmount,
        t.vatAmount,
        t.totalAmount,
        t.status,
        t.createdAt,
        t.invoiceNumber || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vat-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const paginatedTransactions = filteredTransactions.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading VAT data...</p>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">VAT Summary</h1>
            <p className="text-gray-600 mt-1">Manage VAT collected, payable, and refunds - Saudi VAT 15%</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={loadVATData}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Data
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              <Download className="w-4 h-4" />
              Export VAT Report
            </button>
          </div>
        </div>
      </div>

      {/* VAT Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        {/* Total VAT Collected */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-gradient-to-br from-green-100 to-green-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              summary.totalVATCollected > summary.previousPeriodVAT 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {summary.totalVATCollected > summary.previousPeriodVAT ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {Math.round((summary.totalVATCollected / (summary.previousPeriodVAT || 1) - 1) * 100)}%
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalVATCollected)}</p>
          <p className="text-sm text-gray-700">Total VAT Collected</p>
          <p className="text-xs text-gray-500 mt-1">At 15% rate</p>
        </div>

        {/* VAT Payable */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-gradient-to-br from-yellow-100 to-yellow-50 rounded-lg">
              <Receipt className="w-6 h-6 text-yellow-600" />
            </div>
            {summary.vatPayable > 0 && (
              <span className="text-xs font-medium px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                Due: {summary.nextPaymentDue}
              </span>
            )}
          </div>
          <p className={`text-2xl font-bold ${summary.vatPayable > 0 ? 'text-yellow-600' : 'text-gray-900'}`}>
            {formatCurrency(summary.vatPayable)}
          </p>
          <p className="text-sm text-gray-700">VAT Payable</p>
          <p className="text-xs text-gray-500 mt-1">
            {summary.vatPayable > 0 ? `Due on ${summary.nextPaymentDue}` : 'No outstanding VAT'}
          </p>
        </div>

        {/* VAT Paid */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xs text-gray-500">
              Last: {new Date(summary.lastPaymentDate).toLocaleDateString('en-SA', { month: 'short', day: 'numeric' })}
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.vatPaid)}</p>
          <p className="text-sm text-gray-700">VAT Paid</p>
          <p className="text-xs text-gray-500 mt-1">To Saudi Tax Authority</p>
        </div>

        {/* VAT on Refunds */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-gradient-to-br from-red-100 to-red-50 rounded-lg">
              <ArrowDownRight className="w-6 h-6 text-red-600" />
            </div>
            {summary.vatRefunds > 0 && (
              <span className="text-xs font-medium px-2 py-1 bg-red-100 text-red-800 rounded-full">
                {summary.vatRefunds > 1000 ? 'Significant' : 'Minor'}
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.vatRefunds)}</p>
          <p className="text-sm text-gray-700">VAT on Refunds</p>
          <p className="text-xs text-gray-500 mt-1">Refunded to customers</p>
        </div>

        {/* Pending VAT */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-gradient-to-br from-orange-100 to-orange-50 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            {summary.pendingVAT > 0 && (
              <span className="text-xs font-medium px-2 py-1 bg-orange-100 text-orange-800 rounded-full">
                Needs Review
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-orange-600">{formatCurrency(summary.pendingVAT)}</p>
          <p className="text-sm text-gray-700">Pending VAT</p>
          <p className="text-xs text-gray-500 mt-1">Awaiting resolution</p>
        </div>
      </div>

      {/* VAT Rate & Compliance Info */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-gray-900">Saudi VAT Compliance</h3>
              </div>
              <p className="text-gray-700 text-sm">
                Standard VAT Rate: <span className="font-bold text-blue-600">15%</span> • 
                Next VAT Return: <span className="font-bold text-blue-600">{summary.nextPaymentDue}</span> • 
                Last Payment: <span className="font-bold text-blue-600">{summary.lastPaymentDate}</span>
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{summary.vatRate}%</div>
                <div className="text-xs text-gray-600">VAT Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {summary.taxableSales > 0 ? Math.round((summary.vatPayable / summary.taxableSales) * 10000) / 100 : 0}%
                </div>
                <div className="text-xs text-gray-600">Effective Rate</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column: Filters & Export */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Filters</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters({ ...filters, dateRange: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Time</option>
                  <option value="current-quarter">Current Quarter</option>
                  <option value="last-quarter">Last Quarter</option>
                  <option value="month">This Month</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="collected">Collected</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Type</label>
                <select
                  value={filters.transactionType}
                  onChange={(e) => setFilters({ ...filters, transactionType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="sale">Sales</option>
                  <option value="refund">Refunds</option>
                  <option value="adjustment">Adjustments</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  <option value="furniture">Furniture</option>
                  <option value="custom">Custom Orders</option>
                  <option value="delivery">Delivery</option>
                  <option value="service">Services</option>
                </select>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h4>
              <div className="space-y-2">
                <button
                  onClick={() => setFilters({
                    dateRange: 'all',
                    status: 'all',
                    transactionType: 'all',
                    category: 'all',
                    search: ''
                  })}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
                >
                  <span className="text-sm font-medium text-gray-900">Reset All Filters</span>
                  <RefreshCw className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={handleExportCSV}
                  className="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                >
                  <span className="text-sm font-medium text-blue-900">Export as CSV</span>
                  <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                </button>
                <button
                  onClick={() => console.log('Generate PDF')}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
                >
                  <span className="text-sm font-medium text-gray-900">Generate PDF Report</span>
                  <FilePdf className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Period Summary</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Taxable Sales</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(summary.taxableSales)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Non-Taxable Sales</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(summary.nonTaxableSales)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">VAT Rate</span>
                  <span className="font-semibold text-blue-600">{summary.vatRate}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Next Payment Due</span>
                  <span className="font-semibold text-yellow-600">{summary.nextPaymentDue}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Transactions Table */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Table Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">VAT Transactions</h2>
                  <p className="text-gray-600 text-sm mt-1">
                    Showing {paginatedTransactions.length} of {filteredTransactions.length} transactions
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search transactions..."
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
                    />
                  </div>
                  <div className="text-sm text-gray-600">
                    Total VAT: <span className="font-bold text-blue-600">{formatCurrency(filteredTransactions.reduce((sum, t) => sum + t.vatAmount, 0))}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction</th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order & Product</th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Amount</th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VAT (15%)</th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50 transition">
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{transaction.id}</p>
                          <p className="text-xs text-gray-500">{transaction.invoiceNumber}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{transaction.orderId}</p>
                          <p className="text-xs text-gray-600 truncate max-w-xs">{transaction.productName}</p>
                          <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                            {transaction.category}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <p className="font-medium text-gray-900 text-sm">{transaction.customerName}</p>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          {getTransactionTypeIcon(transaction.transactionType)}
                          <span className="text-sm text-gray-900 capitalize">{transaction.transactionType}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <p className={`font-bold text-sm ${
                          transaction.netAmount >= 0 ? 'text-gray-900' : 'text-red-600'
                        }`}>
                          {formatCurrencyWithDecimals(transaction.netAmount)}
                        </p>
                      </td>
                      <td className="py-4 px-6">
                        <p className={`font-bold text-sm ${
                          transaction.vatAmount >= 0 ? 'text-blue-600' : 'text-red-600'
                        }`}>
                          {formatCurrencyWithDecimals(transaction.vatAmount)}
                        </p>
                        <p className="text-xs text-gray-500">15% of net</p>
                      </td>
                      <td className="py-4 px-6">
                        {getStatusBadge(transaction.status)}
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="text-sm text-gray-900">{transaction.createdAt}</p>
                          {transaction.dueDate && (
                            <p className="text-xs text-gray-500">Due: {transaction.dueDate}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedTransaction(transaction);
                              setShowTransactionModal(true);
                            }}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {transaction.status === 'collected' && (
                            <button
                              onClick={() => handleMarkAsPaid(transaction.id)}
                              className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition"
                              title="Mark as Paid"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          {transaction.invoiceNumber && (
                            <button
                              onClick={() => console.log('View invoice', transaction.invoiceNumber)}
                              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
                              title="View Invoice"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No VAT transactions found</h3>
                <p className="text-gray-500 mb-6">Try adjusting your filters or check back later</p>
              </div>
            ) : (
              <>
                {/* Summary */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Page {page} of {Math.ceil(filteredTransactions.length / itemsPerPage)} • 
                      Total VAT in view: <span className="font-bold text-blue-600">
                        {formatCurrency(filteredTransactions.reduce((sum, t) => sum + t.vatAmount, 0))}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span>{filteredTransactions.filter(t => t.status === 'collected').length} collected</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span>{filteredTransactions.filter(t => t.status === 'paid').length} paid</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                        <span>{filteredTransactions.filter(t => t.status === 'pending').length} pending</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: Math.ceil(filteredTransactions.length / itemsPerPage) }, (_, i) => i + 1)
                      .slice(Math.max(0, page - 3), Math.min(Math.ceil(filteredTransactions.length / itemsPerPage), page + 2))
                      .map((pageNum) => (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`px-3 py-1.5 rounded-lg ${
                            page === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}
                  </div>
                  <button
                    onClick={() => setPage(p => Math.min(Math.ceil(filteredTransactions.length / itemsPerPage), p + 1))}
                    disabled={page === Math.ceil(filteredTransactions.length / itemsPerPage)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Export Section */}
          <div className="mt-6 bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Export VAT Reports</h3>
                <p className="text-gray-600 text-sm mt-1">Generate reports for Saudi Tax Authority (GAZT)</p>
              </div>
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={handleExportCSV}
                className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-left"
              >
                <FileSpreadsheet className="w-8 h-8 text-green-600 mb-3" />
                <h4 className="font-bold text-gray-900 mb-1">CSV Export</h4>
                <p className="text-sm text-gray-600">Export all VAT data in CSV format for Excel</p>
              </button>
              
              <button
                onClick={() => console.log('Generate quarterly report')}
                className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-left"
              >
                <FilePdf className="w-8 h-8 text-red-600 mb-3" />
                <h4 className="font-bold text-gray-900 mb-1">Quarterly Report</h4>
                <p className="text-sm text-gray-600">Generate GAZT-compliant quarterly VAT report</p>
              </button>
              
              <button
                onClick={() => console.log('Download VAT certificate')}
                className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-left"
              >
                <Shield className="w-8 h-8 text-blue-600 mb-3" />
                <h4 className="font-bold text-gray-900 mb-1">VAT Certificate</h4>
                <p className="text-sm text-gray-600">Download official VAT registration certificate</p>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={showTransactionModal}
        onClose={() => {
          setShowTransactionModal(false);
          setSelectedTransaction(null);
        }}
        transaction={selectedTransaction}
        onMarkAsPaid={handleMarkAsPaid}
      />
    </div>
  );
};

export default VATSummary;