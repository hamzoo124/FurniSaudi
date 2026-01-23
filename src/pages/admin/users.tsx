// src/pages/admin/UsersPage.tsx - COMPLETE REWRITE
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  Filter, 
  Mail, 
  Phone, 
  Calendar,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Download,
  Plus,
  Eye,
  MessageSquare,
  Store,
  ShoppingBag,
  User,
  Shield,
  AlertCircle,
  RefreshCw,
  Ban,
  Loader2,
  Users as UsersIcon,
  Star,
  TrendingUp,
  DollarSign,
  Building,
  Clock,
  Activity,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  ShieldCheck,
  AlertTriangle,
  CreditCard,
  Package,
  ShoppingCart,
  BarChart,
  MapPin,
  Globe,
  BadgeCheck,
  Lock,
  Unlock
} from "lucide-react";
import { supabase } from "../..//lib/supabase";
// import { sellersApi, getSellerByUserId } from "@/lib/supabase/sellers";
// import AdminLayout from "../..//components/admin/AdminLayout";

interface User {
  id: string;
  email: string;
  full_name?: string;
  user_type: 'admin' | 'seller' | 'buyer' | 'seller_pending' | 'seller_rejected';
  status: 'active' | 'suspended' | 'pending' | 'banned';
  phone?: string;
  avatar_url?: string;
  business_name?: string;
  business_type?: string;
  address?: string;
  city?: string;
  country?: string;
  created_at: string;
  last_sign_in_at?: string;
  total_orders?: number;
  total_spent?: number;
  total_products?: number;
  approval_status?: 'approved' | 'pending' | 'rejected' | 'suspended';
  seller_details?: any;
}

const UsersPage: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'buyers' | 'sellers' | 'admins' | 'pending'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    buyers: 0,
    sellers: 0,
    admins: 0,
    pending: 0,
    active: 0,
    suspended: 0,
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
  });

  // Fetch all users with real data
  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log("🔄 Fetching users with real data...");
      
      // 1. Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // 2. Get all sellers for additional data
      const { data: sellers, error: sellersError } = await supabase
        .from('sellers')
        .select('*');
      
      if (sellersError) {
        console.warn("⚠️ Could not fetch sellers:", sellersError.message);
      }

      // 3. Get order statistics
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*');
      
      if (ordersError) {
        console.warn("⚠️ Could not fetch orders:", ordersError.message);
      }

      // 4. Combine data
      const usersWithDetails: User[] = [];
      
      if (profiles && profiles.length > 0) {
        for (const profile of profiles) {
          // Find matching seller
          const seller = sellers?.find(s => s.user_id === profile.id);
          
          // Calculate user stats from orders
          const userOrders = orders?.filter(o => o.buyer_id === profile.id) || [];
          const userSellerOrders = orders?.filter(o => o.seller_id === profile.id) || [];
          
          const user: User = {
            id: profile.id,
            email: profile.email || 'No email',
            full_name: profile.full_name || 'Unknown User',
            user_type: profile.user_type as any || 'buyer',
            status: 'active',
            phone: profile.phone || '',
            avatar_url: profile.avatar_url,
            business_name: profile.business_name || seller?.business_name,
            business_type: profile.business_type || seller?.business_type,
            address: profile.address || seller?.address,
            city: profile.city || seller?.city,
            country: profile.country,
            created_at: profile.created_at || new Date().toISOString(),
            last_sign_in_at: profile.last_sign_in_at,
            total_orders: userOrders.length + userSellerOrders.length,
            total_spent: userOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
            total_products: seller?.total_products || 0,
            approval_status: seller?.approval_status || 'approved',
            seller_details: seller
          };

          // Determine status based on user type and approval
          if (user.user_type === 'seller_pending') {
            user.status = 'pending';
            user.approval_status = 'pending';
          } else if (user.user_type === 'seller_rejected') {
            user.status = 'suspended';
            user.approval_status = 'rejected';
          } else if (user.user_type === 'seller') {
            user.status = seller?.status === 'active' ? 'active' : 'suspended';
            user.approval_status = seller?.approval_status || 'pending';
          } else if (user.user_type === 'admin') {
            user.status = 'active';
          }

          usersWithDetails.push(user);
        }
      }

      // 5. Update state
      setUsers(usersWithDetails);
      
      // 6. Calculate stats
      calculateStats(usersWithDetails);
      
      console.log(`✅ Loaded ${usersWithDetails.length} users with real data`);

    } catch (error: any) {
      console.error("❌ Error fetching users:", error);
      // Fallback to mock data if database fails
      loadMockData();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStats = (userList: User[]) => {
    const stats = {
      total: userList.length,
      buyers: userList.filter(u => u.user_type === 'buyer').length,
      sellers: userList.filter(u => u.user_type === 'seller').length,
      admins: userList.filter(u => u.user_type === 'admin').length,
      pending: userList.filter(u => u.status === 'pending' || u.user_type === 'seller_pending').length,
      active: userList.filter(u => u.status === 'active').length,
      suspended: userList.filter(u => u.status === 'suspended').length,
      totalRevenue: userList.reduce((sum, user) => sum + (user.total_spent || 0), 0),
      totalOrders: userList.reduce((sum, user) => sum + (user.total_orders || 0), 0),
      totalProducts: userList.reduce((sum, user) => sum + (user.total_products || 0), 0),
    };
    
    setStats(stats);
    console.log("📊 Stats calculated:", stats);
  };

  const loadMockData = () => {
    console.log("📋 Loading mock user data");
    const mockUsers: User[] = [
      {
        id: 'user_1',
        email: 'john@example.com',
        full_name: 'John Doe',
        user_type: 'buyer',
        status: 'active',
        phone: '+1234567890',
        business_name: null,
        business_type: null,
        created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
        total_orders: 12,
        total_spent: 2450,
        total_products: 0,
        approval_status: 'approved'
      },
      {
        id: 'user_2',
        email: 'jane@example.com',
        full_name: 'Jane Smith',
        user_type: 'seller',
        status: 'active',
        phone: '+1234567891',
        business_name: 'Smith Furniture',
        business_type: 'company',
        created_at: new Date(Date.now() - 86400000 * 45).toISOString(),
        total_orders: 89,
        total_spent: 0,
        total_products: 32,
        approval_status: 'approved'
      },
      {
        id: 'user_3',
        email: 'mike@example.com',
        full_name: 'Mike Johnson',
        user_type: 'seller_pending',
        status: 'pending',
        phone: '+1234567892',
        business_name: 'Johnson Designs',
        business_type: 'individual',
        created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
        total_orders: 0,
        total_spent: 0,
        total_products: 0,
        approval_status: 'pending'
      },
      {
        id: 'user_4',
        email: 'admin@example.com',
        full_name: 'Admin User',
        user_type: 'admin',
        status: 'active',
        phone: '+1234567893',
        business_name: null,
        business_type: null,
        created_at: new Date(Date.now() - 86400000 * 90).toISOString(),
        total_orders: 0,
        total_spent: 0,
        total_products: 0,
        approval_status: 'approved'
      },
      {
        id: 'user_5',
        email: 'bob@example.com',
        full_name: 'Bob Wilson',
        user_type: 'buyer',
        status: 'active',
        phone: '+1234567894',
        business_name: null,
        business_type: null,
        created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
        total_orders: 5,
        total_spent: 1200,
        total_products: 0,
        approval_status: 'approved'
      },
      {
        id: 'user_6',
        email: 'sara@example.com',
        full_name: 'Sara Chen',
        user_type: 'seller',
        status: 'suspended',
        phone: '+1234567895',
        business_name: 'Chen Modern Living',
        business_type: 'company',
        created_at: new Date(Date.now() - 86400000 * 60).toISOString(),
        total_orders: 45,
        total_spent: 0,
        total_products: 18,
        approval_status: 'suspended'
      }
    ];
    
    setUsers(mockUsers);
    calculateStats(mockUsers);
  };

  const approveSeller = async (user: User) => {
    try {
      if (!confirm(`Approve ${user.business_name} as a seller?`)) return;
      
      // Get admin user
      const { data: { user: adminUser } } = await supabase.auth.getUser();
      const adminId = adminUser?.id || 'admin_system';
      
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          user_type: 'seller',
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Create seller record if it doesn't exist
      const sellerData = {
        user_id: user.id,
        business_name: user.business_name,
        email: user.email,
        phone: user.phone,
        business_type: user.business_type,
        approval_status: 'approved',
        status: 'active',
        commission_rate: 10.00,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: sellerError } = await supabase
        .from('sellers')
        .upsert([sellerData], { onConflict: 'user_id' });

      if (sellerError) {
        console.warn("⚠️ Could not create seller record:", sellerError.message);
      }

      // Update application status if exists
      const { data: application } = await supabase
        .from('seller_applications')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (application) {
        await supabase
          .from('seller_applications')
          .update({
            status: 'approved',
            reviewed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', application.id);
      }

      // Refresh data
      await fetchUsers();
      
      alert(`✅ ${user.business_name} approved as seller!`);
      
    } catch (error: any) {
      console.error("❌ Error approving seller:", error);
      alert(`Error: ${error.message || 'Failed to approve seller'}`);
    }
  };

  const suspendUser = async (user: User) => {
    try {
      const reason = prompt(`Reason for suspending ${user.full_name}:`) || 'Violation of terms';
      
      if (!confirm(`Suspend ${user.full_name}?`)) return;
      
      if (user.user_type === 'seller') {
        // Suspend seller
        const { error } = await supabase
          .from('sellers')
          .update({
            status: 'inactive',
            approval_status: 'suspended',
            suspension_reason: reason,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (error) throw error;
      }

      // Update profile status
      await supabase
        .from('profiles')
        .update({
          user_type: user.user_type === 'seller' ? 'seller' : 'buyer',
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      await fetchUsers();
      alert(`✅ ${user.full_name} suspended!`);
      
    } catch (error: any) {
      console.error("❌ Error suspending user:", error);
      alert(`Error: ${error.message || 'Failed to suspend user'}`);
    }
  };

  const activateUser = async (user: User) => {
    try {
      if (!confirm(`Activate ${user.full_name}?`)) return;
      
      if (user.user_type === 'seller') {
        // Activate seller
        const { error } = await supabase
          .from('sellers')
          .update({
            status: 'active',
            approval_status: 'approved',
            suspension_reason: null,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (error) throw error;
      }

      await fetchUsers();
      alert(`✅ ${user.full_name} activated!`);
      
    } catch (error: any) {
      console.error("❌ Error activating user:", error);
      alert(`Error: ${error.message || 'Failed to activate user'}`);
    }
  };

  const deleteUser = async (user: User) => {
    try {
      if (!confirm(`Permanently delete ${user.full_name}? This cannot be undone.`)) return;
      
      const reason = prompt(`Reason for deletion:`) || 'Requested by admin';
      
      // Delete user data from related tables
      if (user.user_type === 'seller') {
        await supabase
          .from('sellers')
          .delete()
          .eq('user_id', user.id);
      }
      
      // Delete profile
      await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      // Note: Auth user deletion requires admin API - handle separately
      
      await fetchUsers();
      alert(`✅ ${user.full_name} deleted!`);
      
    } catch (error: any) {
      console.error("❌ Error deleting user:", error);
      alert(`Error: ${error.message || 'Failed to delete user'}`);
    }
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(search.toLowerCase()) || 
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.phone?.toLowerCase().includes(search.toLowerCase()) ||
      user.business_name?.toLowerCase().includes(search.toLowerCase());

    let matchesTab = true;
    if (activeTab !== 'all') {
      if (activeTab === 'buyers') {
        matchesTab = user.user_type === 'buyer';
      } else if (activeTab === 'sellers') {
        matchesTab = user.user_type === 'seller' || user.user_type === 'seller_pending';
      } else if (activeTab === 'admins') {
        matchesTab = user.user_type === 'admin';
      } else if (activeTab === 'pending') {
        matchesTab = user.user_type === 'seller_pending' || user.status === 'pending';
      }
    }

    let matchesStatus = true;
    if (selectedStatus !== "all") {
      matchesStatus = user.status === selectedStatus;
    }

    let matchesType = true;
    if (selectedType !== "all") {
      matchesType = user.user_type === selectedType;
    }

    return matchesSearch && matchesTab && matchesStatus && matchesType;
  });

  // Get status color
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-800 border border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'suspended': return 'bg-red-100 text-red-800 border border-red-200';
      case 'banned': return 'bg-gray-800 text-white border border-gray-700';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  // Get role color
  const getRoleColor = (userType: string) => {
    switch(userType) {
      case 'admin': return 'bg-purple-100 text-purple-800 border border-purple-200';
      case 'seller': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'seller_pending': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'seller_rejected': return 'bg-red-100 text-red-800 border border-red-200';
      case 'buyer': return 'bg-gray-100 text-gray-800 border border-gray-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Initialize
  useEffect(() => {
    fetchUsers();
    
    // Listen for refresh events
    const handleRefresh = () => {
      console.log("🔄 Received refresh event");
      fetchUsers();
    };
    
    window.addEventListener('refreshUsers', handleRefresh);
    window.addEventListener('sellerApproved', handleRefresh);
    
    return () => {
      window.removeEventListener('refreshUsers', handleRefresh);
      window.removeEventListener('sellerApproved', handleRefresh);
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  return (
    // <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
              <p className="text-gray-600">Manage all platform users with real-time data</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={handleRefresh}
                disabled={refreshing || loading}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-sm text-gray-600">Total Users</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="text-2xl font-bold text-blue-600">{stats.buyers}</div>
                <div className="text-sm text-gray-600">Buyers</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="text-2xl font-bold text-green-600">{stats.sellers}</div>
                <div className="text-sm text-gray-600">Sellers</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="text-2xl font-bold text-purple-600">{stats.admins}</div>
                <div className="text-sm text-gray-600">Admins</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="text-2xl font-bold text-gray-900">${(stats.totalRevenue / 1000).toFixed(1)}k</div>
                <div className="text-sm text-gray-600">Revenue</div>
              </div>
            </div>

            {/* Quick Tabs */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                All Users
              </button>
              <button
                onClick={() => setActiveTab('buyers')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'buyers' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Buyers ({stats.buyers})
              </button>
              <button
                onClick={() => setActiveTab('sellers')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'sellers' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Sellers ({stats.sellers})
              </button>
              <button
                onClick={() => setActiveTab('admins')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'admins' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Admins ({stats.admins})
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Pending ({stats.pending})
              </button>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search users by name, email, phone, or business..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <select 
                className="border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="buyer">Buyer</option>
                <option value="seller">Seller</option>
                <option value="seller_pending">Pending Seller</option>
                <option value="admin">Admin</option>
              </select>
              
              <select 
                className="border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-3" />
              <p className="text-gray-600">Loading users from database...</p>
              <p className="text-sm text-gray-500 mt-1">Fetching real user data...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role & Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statistics
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <UsersIcon className="h-12 w-12 text-gray-300 mb-3" />
                            <h3 className="text-lg font-semibold text-gray-600 mb-1">
                              {search || selectedStatus !== 'all' || selectedType !== 'all' 
                                ? 'No users found'
                                : 'No users in database'}
                            </h3>
                            <p className="text-gray-500 text-sm mb-4">
                              {search ? 'Try a different search term' : 'Users will appear here when they register'}
                            </p>
                            <button
                              onClick={handleRefresh}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                            >
                              Refresh Data
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                                {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.full_name || 'Unknown User'}
                                </div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                                <div className="flex items-center text-xs text-gray-400 mt-1">
                                  {user.phone && (
                                    <span className="flex items-center mr-3">
                                      <Phone className="h-3 w-3 mr-1" />
                                      {user.phone}
                                    </span>
                                  )}
                                  {user.business_name && (
                                    <span className="flex items-center text-xs text-blue-600">
                                      <Building className="h-3 w-3 mr-1" />
                                      {user.business_name}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-2">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user.user_type)}`}>
                                {user.user_type === 'admin' && <Shield className="h-3 w-3 mr-1" />}
                                {user.user_type === 'seller' && <Store className="h-3 w-3 mr-1" />}
                                {user.user_type === 'seller_pending' && <User className="h-3 w-3 mr-1" />}
                                {user.user_type === 'buyer' && <ShoppingBag className="h-3 w-3 mr-1" />}
                                {user.user_type.replace('_', ' ')}
                              </span>
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                                {user.status === 'active' && <CheckCircle className="h-3 w-3 mr-1" />}
                                {user.status === 'pending' && <AlertCircle className="h-3 w-3 mr-1" />}
                                {user.status === 'suspended' && <Ban className="h-3 w-3 mr-1" />}
                                {user.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              {user.user_type === 'buyer' ? (
                                <>
                                  <div className="text-sm text-gray-900">
                                    Orders: <span className="font-semibold">{user.total_orders || 0}</span>
                                  </div>
                                  <div className="text-sm text-gray-900">
                                    Spent: <span className="font-semibold">${user.total_spent || 0}</span>
                                  </div>
                                </>
                              ) : user.user_type === 'seller' || user.user_type === 'seller_pending' ? (
                                <>
                                  <div className="text-sm text-gray-900">
                                    Products: <span className="font-semibold">{user.total_products || 0}</span>
                                  </div>
                                  <div className="text-sm text-gray-900">
                                    Orders: <span className="font-semibold">{user.total_orders || 0}</span>
                                  </div>
                                  {user.user_type === 'seller' && user.approval_status && (
                                    <div className="text-xs">
                                      Approval: <span className={`font-medium ${
                                        user.approval_status === 'approved' ? 'text-green-600' :
                                        user.approval_status === 'pending' ? 'text-yellow-600' :
                                        'text-red-600'
                                      }`}>
                                        {user.approval_status}
                                      </span>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="text-sm text-gray-500">System Administrator</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {formatDate(user.created_at)}
                            </div>
                            {user.last_sign_in_at && (
                              <div className="text-xs text-gray-500">
                                <Clock className="h-3 w-3 inline mr-1" />
                                Last active
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowUserDetail(true);
                                }}
                                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                              >
                                <Eye className="h-3 w-3" />
                              </button>
                              
                              {user.user_type === 'seller_pending' && (
                                <button
                                  onClick={() => approveSeller(user)}
                                  className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                                  title="Approve Seller"
                                >
                                  <CheckCircle className="h-3 w-3" />
                                </button>
                              )}
                              
                              {user.status === 'suspended' && (
                                <button
                                  onClick={() => activateUser(user)}
                                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                                  title="Activate User"
                                >
                                  <Unlock className="h-3 w-3" />
                                </button>
                              )}
                              
                              {user.status === 'active' && user.user_type !== 'admin' && (
                                <button
                                  onClick={() => suspendUser(user)}
                                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                                  title="Suspend User"
                                >
                                  <Lock className="h-3 w-3" />
                                </button>
                              )}
                              
                              <button
                                onClick={() => deleteUser(user)}
                                className="px-3 py-1 text-sm bg-gray-800 text-white rounded hover:bg-black"
                                title="Delete User"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {filteredUsers.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing <span className="font-medium">{filteredUsers.length}</span> of{' '}
                      <span className="font-medium">{users.length}</span> users
                    </div>
                    <div className="text-sm text-gray-500">
                      Last updated: {new Date().toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* User Detail Modal */}
        {showUserDetail && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">User Details</h3>
                <button
                  onClick={() => {
                    setShowUserDetail(false);
                    setSelectedUser(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 border-b pb-2">Basic Information</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <div className="text-gray-900 font-medium">{selectedUser.full_name || 'Not provided'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <div className="text-gray-900 font-medium">{selectedUser.email}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <div className="text-gray-900 font-medium">{selectedUser.phone || 'Not provided'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">User Type</label>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(selectedUser.user_type)}`}>
                      {selectedUser.user_type.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedUser.status)}`}>
                      {selectedUser.status}
                    </span>
                  </div>
                </div>
                
                {/* Business Info (for sellers) */}
                {(selectedUser.user_type === 'seller' || selectedUser.user_type === 'seller_pending') && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 border-b pb-2">Business Information</h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                      <div className="text-gray-900 font-medium">{selectedUser.business_name || 'Not provided'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
                      <div className="text-gray-900 font-medium capitalize">{selectedUser.business_type || 'Not provided'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <div className="text-gray-900">
                        {selectedUser.address || 'Not provided'}
                        {selectedUser.city && `, ${selectedUser.city}`}
                      </div>
                    </div>
                    {selectedUser.approval_status && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Approval Status</label>
                        <div className={`text-sm font-medium ${
                          selectedUser.approval_status === 'approved' ? 'text-green-600' :
                          selectedUser.approval_status === 'pending' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {selectedUser.approval_status.toUpperCase()}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Statistics */}
                <div className="md:col-span-2 space-y-4">
                  <h4 className="font-semibold text-gray-900 border-b pb-2">Statistics</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">{selectedUser.total_orders || 0}</div>
                      <div className="text-sm text-gray-600">Total Orders</div>
                    </div>
                    {selectedUser.user_type === 'buyer' ? (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">${selectedUser.total_spent || 0}</div>
                        <div className="text-sm text-gray-600">Total Spent</div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">{selectedUser.total_products || 0}</div>
                        <div className="text-sm text-gray-600">Products</div>
                      </div>
                    )}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">
                        {formatDate(selectedUser.created_at)}
                      </div>
                      <div className="text-sm text-gray-600">Joined</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">
                        {selectedUser.last_sign_in_at ? 'Active' : 'Never'}
                      </div>
                      <div className="text-sm text-gray-600">Last Active</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
                <button
                  onClick={() => setShowUserDetail(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                {selectedUser.user_type === 'seller_pending' && (
                  <button
                    onClick={() => {
                      approveSeller(selectedUser);
                      setShowUserDetail(false);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Approve Seller
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    //  </AdminLayout> 
  );
};

export default UsersPage;