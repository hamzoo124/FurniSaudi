import React, { useState } from "react";
// import AdminLayout from "@/components/admin/AdminLayout";
import { supabase, supabaseAdmin} from "../../lib/supabase";

import { 
  Search, 
  Filter, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Download,
  Upload,
  Wallet,
  CreditCard,
  Banknote,
  Clock,
  CheckCircle,
  XCircle,
  MoreVertical,
  BarChart3,
  Plus,
  Minus
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

interface Transaction {
  id: string;
  date: string;
  description: string;
  type: 'credit' | 'debit';
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  category: 'sales' | 'withdrawal' | 'refund' | 'fee' | 'transfer';
  user: string;
  reference: string;
}

interface WalletBalance {
  available: number;
  pending: number;
  total: number;
  currency: string;
}
interface WalletPageProps {
  onNavigate: (page: string) => void;
  onBack: () => void | Promise<void>;
}

const WalletPage: React.FC<WalletPageProps> = ({ onNavigate, onBack }) => {
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("month");

  const wallet: WalletBalance = {
    available: 125430,
    pending: 25430,
    total: 150860,
    currency: "USD"
  };

  const transactions: Transaction[] = [
    { id: "TXN-001", date: "2024-01-15", description: "Sales Revenue - Modern Leather Sofa", type: "credit", amount: 1299, status: "completed", category: "sales", user: "John Smith", reference: "ORD-001" },
    { id: "TXN-002", date: "2024-01-16", description: "Seller Payout - Johnson Furnishings", type: "debit", amount: 899, status: "completed", category: "withdrawal", user: "Sarah Johnson", reference: "Payout-001" },
    { id: "TXN-003", date: "2024-01-17", description: "Platform Fee", type: "debit", amount: 129.99, status: "completed", category: "fee", user: "System", reference: "FEE-001" },
    { id: "TXN-004", date: "2024-01-18", description: "Sales Revenue - Office Chair", type: "credit", amount: 299, status: "completed", category: "sales", user: "Emma Wilson", reference: "ORD-004" },
    { id: "TXN-005", date: "2024-01-19", description: "Refund - Cancelled Order", type: "debit", amount: 2499, status: "failed", category: "refund", user: "David Brown", reference: "REF-001" },
    { id: "TXN-006", date: "2024-01-20", description: "Sales Revenue - Coffee Table", type: "credit", amount: 399, status: "pending", category: "sales", user: "Lisa Taylor", reference: "ORD-006" },
    { id: "TXN-007", date: "2024-01-21", description: "Bank Transfer", type: "credit", amount: 5000, status: "completed", category: "transfer", user: "Admin", reference: "TRF-001" },
    { id: "TXN-008", date: "2024-01-22", description: "Seller Payout - Martinez Designs", type: "debit", amount: 1899, status: "pending", category: "withdrawal", user: "Maria Martinez", reference: "Payout-002" },
  ];

  const revenueData = [
    { month: 'Jan', revenue: 12000, fees: 1200, payouts: 8000 },
    { month: 'Feb', revenue: 15000, fees: 1500, payouts: 10000 },
    { month: 'Mar', revenue: 18000, fees: 1800, payouts: 12000 },
    { month: 'Apr', revenue: 22000, fees: 2200, payouts: 15000 },
    { month: 'May', revenue: 25000, fees: 2500, payouts: 18000 },
    { month: 'Jun', revenue: 28000, fees: 2800, payouts: 20000 },
  ];

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.id.toLowerCase().includes(search.toLowerCase()) || 
                         transaction.description.toLowerCase().includes(search.toLowerCase()) ||
                         transaction.user.toLowerCase().includes(search.toLowerCase()) ||
                         transaction.reference.toLowerCase().includes(search.toLowerCase());
    const matchesType = selectedType === "all" || transaction.type === selectedType;
    const matchesStatus = selectedStatus === "all" || transaction.status === selectedStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const stats = {
    totalRevenue: transactions.filter(t => t.type === 'credit' && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0),
    totalPayouts: transactions.filter(t => t.category === 'withdrawal' && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0),
    totalFees: transactions.filter(t => t.category === 'fee' && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0),
    pendingTransactions: transactions.filter(t => t.status === 'pending').length,
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'completed': return <CheckCircle className="h-3 w-3" />;
      case 'pending': return <Clock className="h-3 w-3" />;
      case 'failed': return <XCircle className="h-3 w-3" />;
      default: return null;
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'credit' ? 'text-green-600' : 'text-red-600';
  };

  const getCategoryIcon = (category: string) => {
    switch(category) {
      case 'sales': return <TrendingUp className="h-4 w-4" />;
      case 'withdrawal': return <TrendingDown className="h-4 w-4" />;
      case 'refund': return <Minus className="h-4 w-4" />;
      case 'fee': return <Banknote className="h-4 w-4" />;
      case 'transfer': return <CreditCard className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch(category) {
      case 'sales': return 'bg-blue-50 text-blue-700';
      case 'withdrawal': return 'bg-purple-50 text-purple-700';
      case 'refund': return 'bg-red-50 text-red-700';
      case 'fee': return 'bg-yellow-50 text-yellow-700';
      case 'transfer': return 'bg-green-50 text-green-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  return (
    
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Wallet Management</h1>
              <p className="text-gray-600">Manage platform finances and transactions</p>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                <Plus className="h-4 w-4" />
                Add Funds
              </button>
              <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>

          {/* Wallet Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <Wallet className="h-8 w-8" />
                <div className="text-sm">Available Balance</div>
              </div>
              <div className="text-3xl font-bold mb-2">
                ${wallet.available.toLocaleString()}
              </div>
              <div className="text-blue-100 text-sm">Ready for withdrawal</div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <Clock className="h-8 w-8" />
                <div className="text-sm">Pending Balance</div>
              </div>
              <div className="text-3xl font-bold mb-2">
                ${wallet.pending.toLocaleString()}
              </div>
              <div className="text-purple-100 text-sm">Processing transactions</div>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <BarChart3 className="h-8 w-8" />
                <div className="text-sm">Total Balance</div>
              </div>
              <div className="text-3xl font-bold mb-2">
                ${wallet.total.toLocaleString()}
              </div>
              <div className="text-green-100 text-sm">Overall platform funds</div>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">${stats.totalRevenue.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Revenue</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">${stats.totalPayouts.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Payouts</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">${stats.totalFees.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Platform Fees</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">{stats.pendingTransactions}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">Revenue Overview</h3>
              <p className="text-sm text-gray-600">Last 6 months financial performance</p>
            </div>
            <select 
              className="border border-gray-300 rounded-lg px-3 py-2"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="month">Last 6 Months</option>
              <option value="quarter">Last 4 Quarters</option>
              <option value="year">Last Year</option>
            </select>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
                <Area type="monotone" dataKey="fees" name="Fees" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} />
                <Area type="monotone" dataKey="payouts" name="Payouts" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search transactions by ID, description, or user..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <select 
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="credit">Credits</option>
                <option value="debit">Debits</option>
              </select>
              
              <select 
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
              
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Filter className="h-4 w-4" />
                More Filters
              </button>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-mono text-sm text-gray-900">{transaction.id}</div>
                      <div className="text-xs text-gray-500">{transaction.reference}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900 line-clamp-1">{transaction.description}</div>
                        <div className="text-sm text-gray-500">{transaction.user}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${getCategoryColor(transaction.category)}`}>
                        {getCategoryIcon(transaction.category)}
                        <span className="ml-1">{transaction.category.charAt(0).toUpperCase() + transaction.category.slice(1)}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`font-bold ${getTypeColor(transaction.type)}`}>
                        {transaction.type === 'credit' ? '+' : '-'}${transaction.amount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(transaction.status)}`}>
                        {getStatusIcon(transaction.status)}
                        <span className="ml-1">{transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(transaction.date).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(transaction.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                          {/* <Eye className="h-4 w-4" /> */}
                        </button>
                        <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {transaction.status === 'pending' && (
                          <button className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">
                            Process
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Empty State */}
        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">💰</div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No transactions found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your search or filters</p>
            <button
              onClick={() => {
                setSearch("");
                setSelectedType("all");
                setSelectedStatus("all");
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    
  );
};

export default WalletPage;