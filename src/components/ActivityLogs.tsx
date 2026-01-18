// src/components/ActivityLogs.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Activity, 
  Search, 
  Filter, 
  Calendar, 
  RefreshCw, 
  Eye, 
  User, 
  Store, 
  Users, 
  FileText,
  ShoppingBag,
  Megaphone,
  Wallet,
  Star,
  Shield,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Download,
  Clock,
  Globe,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  ArrowUpRight,
  TrendingUp,
  BarChart3,
  Database,
  ChevronDown,
  ExternalLink as ExternalLinkIcon
} from 'lucide-react';
import { supabaseAdmin as supabase } from '@/lib/supabase';

interface ActivityLog {
  id: string;
  actor_id: string;
  actor_name: string;
  actor_role: 'admin' | 'seller' | 'user';
  action: string;
  entity_type: 'seller' | 'product' | 'order' | 'campaign' | 'wallet' | 'review' | 'advertising' | 'contract' | 'user';
  entity_id: string;
  description: string;
  ip_address?: string;
  metadata?: any;
  created_at: string;
}

interface ActivityStats {
  total: number;
  admin: number;
  seller: number;
  user: number;
  today: number;
}

const ActivityLogs = () => {
  // State for activities and pagination
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [actorRole, setActorRole] = useState<string>('all');
  const [entityType, setEntityType] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('today');
  const [selectedActivity, setSelectedActivity] = useState<ActivityLog | null>(null);
  
  // Stats
  const [stats, setStats] = useState<ActivityStats>({
    total: 0,
    admin: 0,
    seller: 0,
    user: 0,
    today: 0
  });
  
  // Custom date formatting functions
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return formatDate(dateString);
  };

  // Calculate date range
  const getDateRange = useCallback(() => {
    const now = new Date();
    const start = new Date();
    
    switch (dateRange) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case '7days':
        start.setDate(now.getDate() - 7);
        break;
      case '30days':
        start.setDate(now.getDate() - 30);
        break;
      default:
        start.setFullYear(2000); // All time
    }
    
    return { start, end: now };
  }, [dateRange]);

  // Fetch activities
  const fetchActivities = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { start, end } = getDateRange();
      
      // Build query
      let query = supabase
        .from('activity_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);
      
      // Apply date filter
      query = query.gte('created_at', start.toISOString());
      query = query.lte('created_at', end.toISOString());
      
      // Apply actor role filter
      if (actorRole !== 'all') {
        query = query.eq('actor_role', actorRole);
      }
      
      // Apply entity type filter
      if (entityType !== 'all') {
        query = query.eq('entity_type', entityType);
      }
      
      // Apply search
      if (searchQuery) {
        query = query.or(`actor_name.ilike.%${searchQuery}%,action.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      setActivities(data || []);
      setTotalCount(count || 0);
      setTotalPages(Math.ceil((count || 0) / pageSize));
    } catch (err: any) {
      console.error('Error fetching activity logs:', err);
      setError(err.message || 'Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, actorRole, entityType, dateRange, getDateRange]);

  // Fetch statistics
  const fetchStats = useCallback(async () => {
    try {
      const { start, end } = getDateRange();
      
      // Get total count
      const { count: totalCount } = await supabase
        .from('activity_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());
      
      // Get counts by role
      const { count: adminCount } = await supabase
        .from('activity_logs')
        .select('*', { count: 'exact', head: true })
        .eq('actor_role', 'admin')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());
      
      const { count: sellerCount } = await supabase
        .from('activity_logs')
        .select('*', { count: 'exact', head: true })
        .eq('actor_role', 'seller')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());
      
      const { count: userCount } = await supabase
        .from('activity_logs')
        .select('*', { count: 'exact', head: true })
        .eq('actor_role', 'user')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());
      
      // Get today's count
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const { count: todayCount } = await supabase
        .from('activity_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart.toISOString());
      
      setStats({
        total: totalCount || 0,
        admin: adminCount || 0,
        seller: sellerCount || 0,
        user: userCount || 0,
        today: todayCount || 0
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, [getDateRange]);

  // Load data on mount and filter changes
  useEffect(() => {
    fetchActivities();
    fetchStats();
  }, [fetchActivities, fetchStats]);

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // Handle export to CSV
  const handleExport = async () => {
    try {
      const { start, end } = getDateRange();
      
      let query = supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());
      
      if (actorRole !== 'all') query = query.eq('actor_role', actorRole);
      if (entityType !== 'all') query = query.eq('entity_type', entityType);
      if (searchQuery) {
        query = query.or(`actor_name.ilike.%${searchQuery}%,action.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Format data for CSV
      const csvHeader = [
        'Date & Time',
        'Actor Name',
        'Actor Role',
        'Action',
        'Entity Type',
        'Description',
        'IP Address',
        'Activity ID'
      ].join(',');
      
      const csvRows = data?.map(log => [
        formatDateTime(log.created_at),
        `"${log.actor_name}"`,
        log.actor_role.toUpperCase(),
        log.action.replace('_', ' ').toUpperCase(),
        log.entity_type.toUpperCase(),
        `"${log.description}"`,
        log.ip_address || 'N/A',
        log.id
      ].join(',')) || [];
      
      const csvContent = [csvHeader, ...csvRows].join('\n');
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().split('T')[0] + '_' + 
                       new Date().getHours() + '-' + 
                       new Date().getMinutes();
      const filename = `activity_logs_${timestamp}.csv`;
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export activity logs');
    }
  };

  // Get entity icon
  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'seller': return <Store className="w-4 h-4" />;
      case 'product': return <ShoppingBag className="w-4 h-4" />;
      case 'order': return <FileText className="w-4 h-4" />;
      case 'campaign': return <Megaphone className="w-4 h-4" />;
      case 'advertising': return <TrendingUp className="w-4 h-4" />;
      case 'wallet': return <Wallet className="w-4 h-4" />;
      case 'review': return <Star className="w-4 h-4" />;
      case 'contract': return <FileText className="w-4 h-4" />;
      case 'user': return <User className="w-4 h-4" />;
      default: return <Database className="w-4 h-4" />;
    }
  };

  // Get action color
  const getActionColor = (action: string) => {
    const criticalActions = ['delete', 'reject', 'suspend', 'block', 'terminate', 'cancel', 'rejected', 'failed'];
    const positiveActions = ['approve', 'activate', 'complete', 'confirm', 'success', 'approved', 'completed', 'activated'];
    const warningActions = ['update', 'modified', 'edited', 'changed'];
    
    if (criticalActions.some(ca => action.toLowerCase().includes(ca))) {
      return 'text-red-700 bg-red-50 border-red-200';
    }
    if (positiveActions.some(pa => action.toLowerCase().includes(pa))) {
      return 'text-green-700 bg-green-50 border-green-200';
    }
    if (warningActions.some(wa => action.toLowerCase().includes(wa))) {
      return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    }
    return 'text-gray-700 bg-gray-50 border-gray-200';
  };

  // Get role badge
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 border border-blue-200">Admin</span>;
      case 'seller':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 border border-green-200">Seller</span>;
      case 'user':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 border border-gray-200">User</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 border border-gray-200">Unknown</span>;
    }
  };

  // Format action text
  const formatAction = (action: string) => {
    return action
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setActorRole('all');
    setEntityType('all');
    setDateRange('today');
    setCurrentPage(1);
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, start + maxVisiblePages - 1);
      
      if (end - start + 1 < maxVisiblePages) {
        start = Math.max(1, end - maxVisiblePages + 1);
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] p-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Activity className="w-7 h-7 text-blue-600" />
              Activity Logs
            </h1>
            <p className="text-gray-600 mt-1">
              Track all admin, seller, and user actions across the platform
            </p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
          >
            <Download className="w-4 h-4" />
            Export to CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Activities</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total.toLocaleString()}</p>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Admin Actions</p>
              <p className="text-2xl font-bold text-blue-600">{stats.admin.toLocaleString()}</p>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Seller Actions</p>
              <p className="text-2xl font-bold text-green-600">{stats.seller.toLocaleString()}</p>
            </div>
            <div className="p-2 bg-green-50 rounded-lg">
              <Store className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">User Actions</p>
              <p className="text-2xl font-bold text-gray-600">{stats.user.toLocaleString()}</p>
            </div>
            <div className="p-2 bg-gray-50 rounded-lg">
              <Users className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Today's Activities</p>
              <p className="text-2xl font-bold text-orange-600">{stats.today.toLocaleString()}</p>
            </div>
            <div className="p-2 bg-orange-50 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </h3>
          <button
            onClick={handleResetFilters}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Reset all filters
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, action, description..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Actor Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Actor Role
            </label>
            <select
              value={actorRole}
              onChange={(e) => setActorRole(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="seller">Seller</option>
              <option value="user">User</option>
            </select>
          </div>

          {/* Entity Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Entity Type
            </label>
            <select
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Entities</option>
              <option value="seller">Seller</option>
              <option value="product">Product</option>
              <option value="order">Order</option>
              <option value="campaign">Campaign</option>
              <option value="advertising">Advertising</option>
              <option value="wallet">Wallet</option>
              <option value="review">Review</option>
              <option value="contract">Contract</option>
              <option value="user">User</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="today">Today</option>
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
              <option value="all">All time</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-600">
            Showing {activities.length} of {totalCount.toLocaleString()} activities
          </div>
          <button
            onClick={() => {
              fetchActivities();
              fetchStats();
            }}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Activity Logs Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading activity logs...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Activities</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchActivities}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        ) : activities.length === 0 ? (
          <div className="p-12 text-center">
            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No activities found</h3>
            <p className="text-gray-600">
              {searchQuery || actorRole !== 'all' || entityType !== 'all' 
                ? 'Try adjusting your filters' 
                : 'No activity logs recorded yet'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activities.map((activity) => (
                    <tr key={activity.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(activity.created_at)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatTime(activity.created_at)}
                          <span className="ml-2 text-gray-400">
                            ({getTimeAgo(activity.created_at)})
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full bg-gray-100">
                            {activity.actor_role === 'admin' ? (
                              <Shield className="w-4 h-4 text-blue-600" />
                            ) : activity.actor_role === 'seller' ? (
                              <Store className="w-4 h-4 text-green-600" />
                            ) : (
                              <User className="w-4 h-4 text-gray-600" />
                            )}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {activity.actor_name}
                            </div>
                            <div className="mt-1">
                              {getRoleBadge(activity.actor_role)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getActionColor(activity.action)}`}>
                          {formatAction(activity.action)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getEntityIcon(activity.entity_type)}
                          <span className="text-sm text-gray-900 capitalize">
                            {activity.entity_type}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          ID: {activity.entity_id.substring(0, 8)}...
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-md">
                          {activity.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900 font-mono">
                            {activity.ip_address || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => setSelectedActivity(activity)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-white px-6 py-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages} • {totalCount.toLocaleString()} total activities
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  {getPageNumbers().map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1.5 border rounded-lg ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Activity Details Modal */}
      {selectedActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Activity Details</h3>
                <button
                  onClick={() => setSelectedActivity(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Actor Info */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Actor Information
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Name</p>
                        <p className="text-sm font-medium text-gray-900">{selectedActivity.actor_name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Role</p>
                        <div className="mt-1">{getRoleBadge(selectedActivity.actor_role)}</div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Actor ID</p>
                        <p className="text-sm font-mono text-gray-900">{selectedActivity.actor_id}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Details */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Action Details
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Action</p>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border mt-1 ${getActionColor(selectedActivity.action)}`}>
                          {formatAction(selectedActivity.action)}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Entity Type</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getEntityIcon(selectedActivity.entity_type)}
                          <span className="text-sm font-medium text-gray-900 capitalize">
                            {selectedActivity.entity_type}
                          </span>
                        </div>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500">Entity ID</p>
                        <p className="text-sm font-mono text-gray-900 bg-white p-2 rounded border mt-1">
                          {selectedActivity.entity_id}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Description
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">
                      {selectedActivity.description}
                    </p>
                  </div>
                </div>

                {/* Technical Details */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    Technical Details
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">IP Address</p>
                        <p className="text-sm font-mono text-gray-900 mt-1">
                          {selectedActivity.ip_address || 'Not recorded'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Timestamp</p>
                        <p className="text-sm text-gray-900 mt-1">
                          {formatDateTime(selectedActivity.created_at)}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500">Activity ID</p>
                        <p className="text-sm font-mono text-gray-900 bg-white p-2 rounded border mt-1">
                          {selectedActivity.id}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Metadata if available */}
                {selectedActivity.metadata && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Additional Data</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <pre className="text-xs text-gray-900 overflow-auto">
                        {JSON.stringify(selectedActivity.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setSelectedActivity(null)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityLogs;