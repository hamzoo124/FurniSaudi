// src/components/admin/CouponManagement.tsx
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Tag, 
  Calendar, 
  Percent, 
  DollarSign,
  Check,
  X,
  Copy,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  Users,
  Clock,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react';
import { useAdminCoupons } from '@/hooks/useAdminCoupons';
import { format } from 'date-fns';

interface CouponManagementProps {
  compact?: boolean;
}

const CouponManagement: React.FC<CouponManagementProps> = ({ compact = false }) => {
  const {
    coupons,
    loading,
    error,
    fetchCoupons,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    toggleCouponStatus
  } = useAdminCoupons();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'percentage' | 'fixed_amount'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'most_used' | 'least_used'>('newest');
  const [expandedCouponId, setExpandedCouponId] = useState<string | null>(null);
  const [bulkAction, setBulkAction] = useState<string>('');
  const [selectedCoupons, setSelectedCoupons] = useState<string[]>([]);

  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discount_type: 'percentage' as 'percentage' | 'fixed_amount',
    discount_value: 10,
    min_purchase_amount: 0,
    max_uses: 100,
    valid_from: format(new Date(), 'yyyy-MM-dd'),
    valid_until: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    description: '',
    is_active: true
  });

  const filteredCoupons = coupons.filter(coupon => {
    const matchesSearch = coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         coupon.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && coupon.is_active) ||
                         (statusFilter === 'inactive' && !coupon.is_active);
    const matchesType = typeFilter === 'all' || coupon.discount_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const sortedCoupons = [...filteredCoupons].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'most_used':
        return (b.used_count || 0) - (a.used_count || 0);
      case 'least_used':
        return (a.used_count || 0) - (b.used_count || 0);
      default:
        return 0;
    }
  });

  const stats = {
    total: coupons.length,
    active: coupons.filter(c => c.is_active).length,
    expired: coupons.filter(c => new Date(c.valid_until) < new Date()).length,
    totalUses: coupons.reduce((sum, c) => sum + (c.used_count || 0), 0),
    redemptionRate: coupons.length > 0 
      ? (coupons.reduce((sum, c) => sum + (c.used_count || 0), 0) / coupons.reduce((sum, c) => sum + (c.max_uses || 0), 0)) * 100 
      : 0
  };

  const handleCreateCoupon = async () => {
    try {
      const result = await createCoupon(newCoupon);
      if (result.success) {
        setShowCreateModal(false);
        setNewCoupon({
          code: '',
          discount_type: 'percentage',
          discount_value: 10,
          min_purchase_amount: 0,
          max_uses: 100,
          valid_from: format(new Date(), 'yyyy-MM-dd'),
          valid_until: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
          description: '',
          is_active: true
        });
      }
    } catch (error) {
      console.error('Error creating coupon:', error);
    }
  };

  const handleEditCoupon = async () => {
    if (!selectedCoupon) return;
    
    try {
      const result = await updateCoupon(selectedCoupon.id, selectedCoupon);
      if (result.success) {
        setShowEditModal(false);
        setSelectedCoupon(null);
      }
    } catch (error) {
      console.error('Error updating coupon:', error);
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    if (!confirm('Are you sure you want to delete this coupon? This action cannot be undone.')) {
      return;
    }
    
    try {
      await deleteCoupon(couponId);
    } catch (error) {
      console.error('Error deleting coupon:', error);
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedCoupons.length === 0) return;
    
    try {
      switch (bulkAction) {
        case 'activate':
          await Promise.all(selectedCoupons.map(id => 
            toggleCouponStatus(id, true)
          ));
          break;
        case 'deactivate':
          await Promise.all(selectedCoupons.map(id => 
            toggleCouponStatus(id, false)
          ));
          break;
        case 'delete':
          if (!confirm(`Delete ${selectedCoupons.length} selected coupons?`)) return;
          await Promise.all(selectedCoupons.map(id => 
            deleteCoupon(id)
          ));
          break;
      }
      
      setSelectedCoupons([]);
      setBulkAction('');
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Coupon code copied to clipboard!');
  };

  const exportCoupons = () => {
    const csvContent = [
      ['Code', 'Type', 'Value', 'Min Purchase', 'Uses', 'Status', 'Valid From', 'Valid Until'],
      ...coupons.map(c => [
        c.code,
        c.discount_type,
        c.discount_value,
        c.min_purchase_amount,
        `${c.used_count || 0}/${c.max_uses}`,
        c.is_active ? 'Active' : 'Inactive',
        format(new Date(c.valid_from), 'yyyy-MM-dd'),
        format(new Date(c.valid_until), 'yyyy-MM-dd')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coupons_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  if (compact) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Coupons</h3>
            <p className="text-xs text-gray-600">{stats.total} total coupons</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-2 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Plus className="w-3 h-3 mr-1" />
            New
          </button>
        </div>

        <div className="space-y-2">
          {sortedCoupons.slice(0, 5).map(coupon => (
            <div key={coupon.id} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
              <div className="flex items-center space-x-2">
                <Tag className="w-3 h-3 text-gray-500" />
                <div>
                  <div className="flex items-center space-x-1">
                    <code className="text-xs font-mono font-semibold">{coupon.code}</code>
                    <button
                      onClick={() => copyToClipboard(coupon.code)}
                      className="p-0.5 hover:bg-gray-200 rounded"
                    >
                      <Copy className="w-2.5 h-2.5 text-gray-500" />
                    </button>
                  </div>
                  <div className="text-xs text-gray-600">
                    {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `$${coupon.discount_value}`}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <span className={`px-1.5 py-0.5 text-xs rounded ${
                  coupon.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {coupon.is_active ? 'Active' : 'Inactive'}
                </span>
                <button
                  onClick={() => {
                    setSelectedCoupon(coupon);
                    setShowEditModal(true);
                  }}
                  className="p-0.5 text-gray-500 hover:text-gray-700"
                >
                  <MoreVertical className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Coupon Management</h1>
            <p className="text-gray-600 mt-1">Create and manage discount coupons for your platform</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={exportCoupons}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
            <button
              onClick={fetchCoupons}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Coupon
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Coupons</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Tag className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700">Active</p>
                <p className="text-2xl font-bold text-green-900">{stats.active}</p>
              </div>
              <Check className="w-8 h-8 text-green-400" />
            </div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700">Expired</p>
                <p className="text-2xl font-bold text-red-900">{stats.expired}</p>
              </div>
              <X className="w-8 h-8 text-red-400" />
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700">Redemption Rate</p>
                <p className="text-2xl font-bold text-blue-900">{stats.redemptionRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-400" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search coupons by code or description..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="percentage">Percentage</option>
                <option value="fixed_amount">Fixed Amount</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="most_used">Most Used</option>
                <option value="least_used">Least Used</option>
              </select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedCoupons.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-blue-900">
                    {selectedCoupons.length} coupon(s) selected
                  </span>
                  <div className="flex items-center space-x-2">
                    <select
                      value={bulkAction}
                      onChange={(e) => setBulkAction(e.target.value)}
                      className="px-3 py-1 text-sm border border-blue-300 rounded bg-white"
                    >
                      <option value="">Bulk Actions</option>
                      <option value="activate">Activate</option>
                      <option value="deactivate">Deactivate</option>
                      <option value="delete">Delete</option>
                    </select>
                    <button
                      onClick={handleBulkAction}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Apply
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCoupons([])}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Coupons Table */}
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedCoupons.length === sortedCoupons.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCoupons(sortedCoupons.map(c => c.id));
                      } else {
                        setSelectedCoupons([]);
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Coupon
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Discount
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Validity
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="mt-2 text-sm text-gray-600">Loading coupons...</p>
                    </div>
                  </td>
                </tr>
              ) : sortedCoupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Tag className="w-12 h-12 text-gray-300 mb-2" />
                      <p className="text-gray-600">No coupons found</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {searchTerm ? 'Try adjusting your search or filters' : 'Create your first coupon to get started'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedCoupons.map((coupon) => (
                  <React.Fragment key={coupon.id}>
                    <tr className={`hover:bg-gray-50 ${expandedCouponId === coupon.id ? 'bg-blue-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedCoupons.includes(coupon.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCoupons([...selectedCoupons, coupon.id]);
                            } else {
                              setSelectedCoupons(selectedCoupons.filter(id => id !== coupon.id));
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Tag className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="flex items-center space-x-2">
                              <code className="text-sm font-mono font-semibold text-gray-900">
                                {coupon.code}
                              </code>
                              <button
                                onClick={() => copyToClipboard(coupon.code)}
                                className="p-1 hover:bg-gray-200 rounded"
                                title="Copy code"
                              >
                                <Copy className="w-3 h-3 text-gray-500" />
                              </button>
                            </div>
                            {coupon.description && (
                              <p className="text-xs text-gray-500 mt-1">{coupon.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {coupon.discount_type === 'percentage' ? (
                            <>
                              <Percent className="w-4 h-4 text-gray-400 mr-1" />
                              <span className="text-lg font-bold text-gray-900">{coupon.discount_value}%</span>
                            </>
                          ) : (
                            <>
                              <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
                              <span className="text-lg font-bold text-gray-900">${coupon.discount_value}</span>
                            </>
                          )}
                          {coupon.min_purchase_amount > 0 && (
                            <span className="ml-2 text-xs text-gray-500">
                              Min: ${coupon.min_purchase_amount}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {coupon.used_count || 0} / {coupon.max_uses}
                            </div>
                            <div className="text-xs text-gray-500">
                              {((coupon.used_count || 0) / coupon.max_uses * 100).toFixed(1)}% used
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm text-gray-900">
                              {format(new Date(coupon.valid_from), 'MMM d, yyyy')}
                            </div>
                            <div className="text-xs text-gray-500">
                              to {format(new Date(coupon.valid_until), 'MMM d, yyyy')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            coupon.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {coupon.is_active ? 'Active' : 'Inactive'}
                          </span>
                          {new Date(coupon.valid_until) < new Date() && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Expired
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              if (expandedCouponId === coupon.id) {
                                setExpandedCouponId(null);
                              } else {
                                setExpandedCouponId(coupon.id);
                              }
                            }}
                            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                          >
                            {expandedCouponId === coupon.id ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedCoupon(coupon);
                              setShowEditModal(true);
                            }}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleCouponStatus(coupon.id, !coupon.is_active)}
                            className={`p-1 rounded ${
                              coupon.is_active 
                                ? 'text-red-600 hover:text-red-800 hover:bg-red-50' 
                                : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                            }`}
                          >
                            {coupon.is_active ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expanded View */}
                    {expandedCouponId === coupon.id && (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 bg-blue-50">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-2">Details</h4>
                              <dl className="space-y-1">
                                <div className="flex justify-between">
                                  <dt className="text-xs text-gray-500">Created</dt>
                                  <dd className="text-xs text-gray-900">
                                    {format(new Date(coupon.created_at), 'MMM d, yyyy HH:mm')}
                                  </dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-xs text-gray-500">Last Updated</dt>
                                  <dd className="text-xs text-gray-900">
                                    {coupon.updated_at ? format(new Date(coupon.updated_at), 'MMM d, yyyy HH:mm') : 'Never'}
                                  </dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-xs text-gray-500">Created By</dt>
                                  <dd className="text-xs text-gray-900">
                                    {coupon.created_by || 'System'}
                                  </dd>
                                </div>
                              </dl>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-2">Usage Stats</h4>
                              <dl className="space-y-1">
                                <div className="flex justify-between">
                                  <dt className="text-xs text-gray-500">Remaining Uses</dt>
                                  <dd className="text-xs text-gray-900">
                                    {coupon.max_uses - (coupon.used_count || 0)}
                                  </dd>
                                </div>
                                <div className="flex justify-between">
                                  <dt className="text-xs text-gray-500">Days Remaining</dt>
                                  <dd className="text-xs text-gray-900">
                                    {Math.ceil((new Date(coupon.valid_until).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
                                  </dd>
                                </div>
                              </dl>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-2">Actions</h4>
                              <div className="flex flex-wrap gap-2">
                                <button
                                  onClick={() => {
                                    const link = `${window.location.origin}/checkout?coupon=${coupon.code}`;
                                    copyToClipboard(link);
                                  }}
                                  className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                >
                                  Copy Link
                                </button>
                                <button
                                  onClick={() => handleDeleteCoupon(coupon.id)}
                                  className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                                >
                                  Delete
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedCoupon(coupon);
                                    setShowEditModal(true);
                                  }}
                                  className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                >
                                  Edit Details
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {sortedCoupons.length > 0 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{sortedCoupons.length}</span> of{' '}
              <span className="font-medium">{coupons.length}</span> coupons
            </div>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">
                Previous
              </button>
              <span className="px-3 py-1 text-sm text-gray-700">Page 1 of 1</span>
              <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Coupon Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Create New Coupon</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Coupon Code *
                      </label>
                      <input
                        type="text"
                        value={newCoupon.code}
                        onChange={(e) => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="SUMMER2024"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={newCoupon.description}
                        onChange={(e) => setNewCoupon({...newCoupon, description: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Summer Sale Discount"
                      />
                    </div>
                  </div>
                </div>

                {/* Discount Details */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Discount Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Discount Type *
                      </label>
                      <select
                        value={newCoupon.discount_type}
                        onChange={(e) => setNewCoupon({...newCoupon, discount_type: e.target.value as any})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed_amount">Fixed Amount ($)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Discount Value *
                      </label>
                      <input
                        type="number"
                        value={newCoupon.discount_value}
                        onChange={(e) => setNewCoupon({...newCoupon, discount_value: parseFloat(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                        step={newCoupon.discount_type === 'percentage' ? '1' : '0.01'}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Minimum Purchase ($)
                      </label>
                      <input
                        type="number"
                        value={newCoupon.min_purchase_amount}
                        onChange={(e) => setNewCoupon({...newCoupon, min_purchase_amount: parseFloat(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>

                {/* Usage Limits */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Usage Limits</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Maximum Uses *
                      </label>
                      <input
                        type="number"
                        value={newCoupon.max_uses}
                        onChange={(e) => setNewCoupon({...newCoupon, max_uses: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="1"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Validity Period */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Validity Period</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valid From *
                      </label>
                      <input
                        type="date"
                        value={newCoupon.valid_from}
                        onChange={(e) => setNewCoupon({...newCoupon, valid_from: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valid Until *
                      </label>
                      <input
                        type="date"
                        value={newCoupon.valid_until}
                        onChange={(e) => setNewCoupon({...newCoupon, valid_until: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Status</h3>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={newCoupon.is_active}
                      onChange={(e) => setNewCoupon({...newCoupon, is_active: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                      Activate coupon immediately
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateCoupon}
                  disabled={!newCoupon.code || loading}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Coupon'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Coupon Modal */}
      {showEditModal && selectedCoupon && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Edit Coupon</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedCoupon(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Edit form would go here */}
              <div className="text-center py-8">
                <p className="text-gray-600">Edit functionality would be implemented here</p>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedCoupon(null);
                  }}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponManagement;