import React, { useState } from 'react';
import { supabaseAdmin as supabase } from '@/lib/supabase';

import {
  AiOutlineArrowLeft,
  AiOutlineSearch,
  AiOutlineFilter,
  AiOutlinePlus,
  AiOutlineEye,
  AiOutlineEdit,
  AiOutlineDelete,
  AiOutlineMail,
  AiOutlinePhone,
  AiOutlineUser,
  AiOutlineShopping,
  AiOutlineDollar,
  AiOutlineCalendar,
  AiOutlineStar,
  AiOutlineMessage,
  AiOutlineTag,
  AiOutlineExport,
  AiOutlineImport,
  AiOutlineTeam,
  AiOutlineHistory,
  AiOutlineHeart,
  AiOutlineWarning,
  AiOutlineCheckCircle,
  AiOutlineCloseCircle,
  AiOutlineMore
} from 'react-icons/ai';

interface CustomersPageProps {
  onNavigate?: (page: string) => void;
  onBack?: () => void;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinDate: string;
  lastPurchase: string;
  totalOrders: number;
  totalSpent: number;
  status: 'active' | 'inactive' | 'blocked';
  loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  favoriteCategories: string[];
  notes: string;
  address: string;
  city: string;
  country: string;
}

interface Order {
  id: string;
  customerId: string;
  date: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  items: number;
  type: 'customized' | 'ready-made';
}

interface CustomerNote {
  id: string;
  customerId: string;
  date: string;
  author: string;
  content: string;
  type: 'general' | 'follow-up' | 'issue' | 'praise';
}

const CustomersPage: React.FC<CustomersPageProps> = ({ onNavigate, onBack }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'vip' | 'inactive'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerDetail, setShowCustomerDetail] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'joinDate' | 'lastPurchase' | 'totalSpent'>('name');

  // Mock customer data
  const [customers, setCustomers] = useState<Customer[]>([
    {
      id: '1',
      name: 'Ahmed Al-Rashid',
      email: 'ahmed.alrashid@email.com',
      phone: '+966 50 123 4567',
      joinDate: '2023-01-15',
      lastPurchase: '2024-01-20',
      totalOrders: 12,
      totalSpent: 45000,
      status: 'active',
      loyaltyTier: 'platinum',
      favoriteCategories: ['custom-sofas', 'dining-tables', 'office-furniture'],
      notes: 'Prefers custom furniture. Very particular about wood finishes.',
      address: '123 King Fahd Road',
      city: 'Riyadh',
      country: 'Saudi Arabia'
    },
    {
      id: '2',
      name: 'Sarah Mohammed',
      email: 'sarah.m@email.com',
      phone: '+966 55 987 6543',
      joinDate: '2023-03-22',
      lastPurchase: '2024-01-18',
      totalOrders: 8,
      totalSpent: 28000,
      status: 'active',
      loyaltyTier: 'gold',
      favoriteCategories: ['bedroom-sets', 'dining-chairs'],
      notes: 'Interested in luxury bedroom furniture. Follow up about new collection.',
      address: '456 Olaya Street',
      city: 'Riyadh',
      country: 'Saudi Arabia'
    },
    {
      id: '3',
      name: 'Mohammed Hassan',
      email: 'm.hassan@email.com',
      phone: '+966 54 555 1234',
      joinDate: '2023-06-10',
      lastPurchase: '2023-12-05',
      totalOrders: 3,
      totalSpent: 12000,
      status: 'inactive',
      loyaltyTier: 'silver',
      favoriteCategories: ['office-desks', 'bookshelves'],
      notes: 'Business customer. Purchased office furniture.',
      address: '789 Diplomatic Quarter',
      city: 'Riyadh',
      country: 'Saudi Arabia'
    },
    {
      id: '4',
      name: 'Layla Abdullah',
      email: 'layla.a@email.com',
      phone: '+966 53 444 7890',
      joinDate: '2023-11-30',
      lastPurchase: '2024-01-22',
      totalOrders: 15,
      totalSpent: 65000,
      status: 'active',
      loyaltyTier: 'platinum',
      favoriteCategories: ['custom-cabinets', 'luxury-beds', 'dining-sets'],
      notes: 'High-value customer. Very satisfied with custom cabinet work.',
      address: '321 Al-Malaz District',
      city: 'Riyadh',
      country: 'Saudi Arabia'
    },
    {
      id: '5',
      name: 'Khalid Ibrahim',
      email: 'khalid.ibrahim@email.com',
      phone: '+966 56 777 8888',
      joinDate: '2023-02-14',
      lastPurchase: '2023-08-15',
      totalOrders: 5,
      totalSpent: 18000,
      status: 'inactive',
      loyaltyTier: 'bronze',
      favoriteCategories: ['living-room', 'outdoor-furniture'],
      notes: 'Last purchase was outdoor furniture set.',
      address: '654 Al-Nakheel',
      city: 'Riyadh',
      country: 'Saudi Arabia'
    }
  ]);

  // Mock orders data
  const [orders, setOrders] = useState<Order[]>([
    { id: 'ORD-001', customerId: '1', date: '2024-01-20', amount: 8500, status: 'delivered', items: 3, type: 'customized' },
    { id: 'ORD-002', customerId: '2', date: '2024-01-18', amount: 4200, status: 'shipped', items: 2, type: 'ready-made' },
    { id: 'ORD-003', customerId: '4', date: '2024-01-22', amount: 12500, status: 'confirmed', items: 5, type: 'customized' },
    { id: 'ORD-004', customerId: '1', date: '2023-12-15', amount: 6800, status: 'delivered', items: 2, type: 'customized' },
    { id: 'ORD-005', customerId: '3', date: '2023-12-05', amount: 3500, status: 'delivered', items: 1, type: 'ready-made' }
  ]);

  // Mock customer notes
  const [customerNotes, setCustomerNotes] = useState<CustomerNote[]>([
    { id: '1', customerId: '1', date: '2024-01-22', author: 'Sales Team', content: 'Customer very happy with custom sofa delivery. Interested in dining table next.', type: 'praise' },
    { id: '2', customerId: '1', date: '2024-01-18', author: 'Support', content: 'Follow up scheduled for maintenance check in 3 months.', type: 'follow-up' },
    { id: '3', customerId: '2', date: '2024-01-19', author: 'Design Team', content: 'Customer requested catalog for new bedroom collection.', type: 'general' }
  ]);

  // New customer form state
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'Saudi Arabia',
    status: 'active',
    loyaltyTier: 'bronze'
  });

  // Filter and search customers
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone.includes(searchTerm);
    
    const matchesStatus = filterStatus === 'all' || customer.status === filterStatus;
    const matchesTier = filterTier === 'all' || customer.loyaltyTier === filterTier;
    
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'active' && customer.status === 'active') ||
                      (activeTab === 'vip' && customer.loyaltyTier === 'platinum') ||
                      (activeTab === 'inactive' && customer.status === 'inactive');

    return matchesSearch && matchesStatus && matchesTier && matchesTab;
  });

  // Sort customers
  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'joinDate':
        return new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime();
      case 'lastPurchase':
        return new Date(b.lastPurchase).getTime() - new Date(a.lastPurchase).getTime();
      case 'totalSpent':
        return b.totalSpent - a.totalSpent;
      default:
        return 0;
    }
  });

  // Customer statistics
  const customerStats = {
    total: customers.length,
    active: customers.filter(c => c.status === 'active').length,
    vip: customers.filter(c => c.loyaltyTier === 'platinum').length,
    newThisMonth: customers.filter(c => {
      const joinDate = new Date(c.joinDate);
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return joinDate > monthAgo;
    }).length
  };

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerDetail(true);
  };

  const handleAddCustomer = () => {
    const customer: Customer = {
      id: Date.now().toString(),
      name: newCustomer.name || '',
      email: newCustomer.email || '',
      phone: newCustomer.phone || '',
      joinDate: new Date().toISOString().split('T')[0],
      lastPurchase: '',
      totalOrders: 0,
      totalSpent: 0,
      status: newCustomer.status as 'active' | 'inactive' | 'blocked',
      loyaltyTier: newCustomer.loyaltyTier as 'bronze' | 'silver' | 'gold' | 'platinum',
      favoriteCategories: [],
      notes: '',
      address: newCustomer.address || '',
      city: newCustomer.city || '',
      country: newCustomer.country || 'Saudi Arabia'
    };

    setCustomers(prev => [...prev, customer]);
    setShowAddCustomer(false);
    setNewCustomer({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      country: 'Saudi Arabia',
      status: 'active',
      loyaltyTier: 'bronze'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-yellow-100 text-yellow-800';
      case 'blocked': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum': return 'bg-purple-100 text-purple-800';
      case 'gold': return 'bg-yellow-100 text-yellow-800';
      case 'silver': return 'bg-gray-100 text-gray-800';
      case 'bronze': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const CustomerDetailModal = () => {
    if (!selectedCustomer) return null;

    const customerOrders = orders.filter(order => order.customerId === selectedCustomer.id);
    const customerNotesList = customerNotes.filter(note => note.customerId === selectedCustomer.id);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedCustomer.name}</h2>
                <p className="text-gray-600">{selectedCustomer.email} • {selectedCustomer.phone}</p>
              </div>
              <button
                onClick={() => setShowCustomerDetail(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <AiOutlineCloseCircle size={24} />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Customer Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Member Since:</span>
                    <span className="font-medium">{new Date(selectedCustomer.joinDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Purchase:</span>
                    <span className="font-medium">
                      {selectedCustomer.lastPurchase 
                        ? new Date(selectedCustomer.lastPurchase).toLocaleDateString()
                        : 'No purchases yet'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Orders:</span>
                    <span className="font-medium">{selectedCustomer.totalOrders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Spent:</span>
                    <span className="font-medium text-green-600">{selectedCustomer.totalSpent.toLocaleString()} SAR</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Loyalty Tier:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTierColor(selectedCustomer.loyaltyTier)}`}>
                      {selectedCustomer.loyaltyTier}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <AiOutlineMail className="text-gray-400" />
                    <span>{selectedCustomer.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <AiOutlinePhone className="text-gray-400" />
                    <span>{selectedCustomer.phone}</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <AiOutlineUser className="text-gray-400 mt-1" />
                    <span>{selectedCustomer.address}, {selectedCustomer.city}, {selectedCustomer.country}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Favorite Categories */}
            {selectedCustomer.favoriteCategories.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Favorite Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedCustomer.favoriteCategories.map((category, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                    >
                      {category.replace(/-/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Orders */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h3>
              {customerOrders.length > 0 ? (
                <div className="space-y-3">
                  {customerOrders.map(order => (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-gray-900">{order.id}</div>
                          <div className="text-sm text-gray-600">
                            {new Date(order.date).toLocaleDateString()} • {order.items} items • {order.type}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">{order.amount.toLocaleString()} SAR</div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOrderStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No orders found</p>
              )}
            </div>

            {/* Customer Notes */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Customer Notes</h3>
                <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                  Add Note
                </button>
              </div>
              {customerNotesList.length > 0 ? (
                <div className="space-y-3">
                  {customerNotesList.map(note => (
                    <div key={note.id} className="border-l-4 border-blue-500 bg-gray-50 rounded-r-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-gray-900">{note.author}</span>
                        <span className="text-sm text-gray-500">{new Date(note.date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-gray-700">{note.content}</p>
                      <div className="mt-2">
                        <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">
                          {note.type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No notes available</p>
              )}
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
            <button
              onClick={() => setShowCustomerDetail(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Send Email
            </button>
          </div>
        </div>
      </div>
    );
  };

  const AddCustomerModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Add New Customer</h2>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              value={newCustomer.name}
              onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter customer name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={newCustomer.email}
              onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter email address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <input
              type="tel"
              value={newCustomer.phone}
              onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
            <input
              type="text"
              value={newCustomer.address}
              onChange={(e) => setNewCustomer(prev => ({ ...prev, address: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter address"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
              <input
                type="text"
                value={newCustomer.city}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, city: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter city"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
              <input
                type="text"
                value={newCustomer.country}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, country: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter country"
              />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={() => setShowAddCustomer(false)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAddCustomer}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Add Customer
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-700 transition-colors"
              >
                <AiOutlineArrowLeft size={20} />
                <span>Back to Dashboard</span>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
                <p className="text-gray-600">Manage your customers and their interactions</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="flex items-center space-x-2 bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50">
                <AiOutlineExport size={18} />
                <span>Export</span>
              </button>
              <button className="flex items-center space-x-2 bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50">
                <AiOutlineImport size={18} />
                <span>Import</span>
              </button>
              <button 
                onClick={() => setShowAddCustomer(true)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <AiOutlinePlus size={18} />
                <span>Add Customer</span>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Customers</p>
                  <p className="text-2xl font-bold text-gray-900">{customerStats.total}</p>
                </div>
                <AiOutlineTeam className="text-blue-600 text-2xl" />
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Customers</p>
                  <p className="text-2xl font-bold text-gray-900">{customerStats.active}</p>
                </div>
                <AiOutlineCheckCircle className="text-green-600 text-2xl" />
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">VIP Customers</p>
                  <p className="text-2xl font-bold text-gray-900">{customerStats.vip}</p>
                </div>
                <AiOutlineStar className="text-purple-600 text-2xl" />
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">New This Month</p>
                  <p className="text-2xl font-bold text-gray-900">{customerStats.newThisMonth}</p>
                </div>
                <AiOutlineUser className="text-orange-600 text-2xl" />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 border-b border-gray-200">
            <nav className="flex space-x-8">
              {[
                { id: 'all', name: 'All Customers', count: customerStats.total },
                { id: 'active', name: 'Active', count: customerStats.active },
                { id: 'vip', name: 'VIP', count: customerStats.vip },
                { id: 'inactive', name: 'Inactive', count: customerStats.total - customerStats.active }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.name}</span>
                  <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <AiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search customers by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="blocked">Blocked</option>
              </select>

              <select
                value={filterTier}
                onChange={(e) => setFilterTier(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Tiers</option>
                <option value="platinum">Platinum</option>
                <option value="gold">Gold</option>
                <option value="silver">Silver</option>
                <option value="bronze">Bronze</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="name">Sort by Name</option>
                <option value="joinDate">Sort by Join Date</option>
                <option value="lastPurchase">Sort by Last Purchase</option>
                <option value="totalSpent">Sort by Total Spent</option>
              </select>
            </div>
          </div>
        </div>

        {/* Customers Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {sortedCustomers.length === 0 ? (
            <div className="text-center py-12">
              <AiOutlineUser className="mx-auto text-gray-400 text-4xl mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">No customers found</h4>
              <p className="text-gray-600 mb-4">Try adjusting your search or filters</p>
              <button
                onClick={() => setShowAddCustomer(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Add New Customer
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orders
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Spent
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
                  {sortedCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {customer.name.charAt(0)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {customer.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              Joined {new Date(customer.joinDate).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{customer.email}</div>
                        <div className="text-sm text-gray-500">{customer.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{customer.totalOrders} orders</div>
                        <div className="text-sm text-gray-500">
                          Last: {customer.lastPurchase ? new Date(customer.lastPurchase).toLocaleDateString() : 'Never'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-green-600">
                          {customer.totalSpent.toLocaleString()} SAR
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${getTierColor(customer.loyaltyTier)}`}>
                          {customer.loyaltyTier}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(customer.status)}`}>
                          {customer.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewCustomer(customer)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="View Details"
                          >
                            <AiOutlineEye size={18} />
                          </button>
                          <button
                            className="text-green-600 hover:text-green-900 p-1"
                            title="Send Email"
                          >
                            <AiOutlineMail size={18} />
                          </button>
                          <button
                            className="text-purple-600 hover:text-purple-900 p-1"
                            title="Edit"
                          >
                            <AiOutlineEdit size={18} />
                          </button>
                          <button
                            className="text-gray-600 hover:text-gray-900 p-1"
                            title="More Options"
                          >
                            <AiOutlineMore size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {sortedCustomers.length > 0 && (
          <div className="bg-white px-6 py-3 border-t border-gray-200 rounded-b-lg flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">1</span> to <span className="font-medium">{sortedCustomers.length}</span> of{' '}
              <span className="font-medium">{sortedCustomers.length}</span> results
            </div>
            <div className="flex space-x-2">
              <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                Previous
              </button>
              <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCustomerDetail && <CustomerDetailModal />}
      {showAddCustomer && <AddCustomerModal />}
    </div>
  );
};

export default CustomersPage;
