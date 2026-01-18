// src/components/admin/PermissionsManager.tsx
import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  UserPlus,
  UserMinus,
  Check,
  X,
  Edit,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Save,
  RotateCcw,
  Star,
  Crown,
  Award,
  Key,
  UserCheck,
  UserX,
  Settings,
  List,
  Grid,
  Menu,
  Home,
  Package,
  ShoppingBag,
  MessageCircle,
  Wallet,
  FileCheck,
  Megaphone,
  BarChart3,
  Activity,
  Tag,
  FolderTree,
  CreditCard,
  Store,
  Truck,
  Calendar,
  Bell,
  FileText
} from 'lucide-react';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { format } from 'date-fns';

interface PermissionsManagerProps {
  compact?: boolean;
}

const PermissionsManager: React.FC<PermissionsManagerProps> = ({ compact = false }) => {
  const {
    roles,
    loading,
    error,
    fetchRoles,
    createRole,
    updateRole,
    deleteRole,
    assignRole,
    getUserRole,
    checkPermission
  } = useAdminPermissions();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [expandedRoleId, setExpandedRoleId] = useState<string | null>(null);
  const [bulkAction, setBulkAction] = useState<string>('');

  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    level: 50,
    permissions: {
      dashboard: true,
      users: false,
      sellers: false,
      products: false,
      orders: false,
      reviews: false,
      wallet: false,
      contracts: false,
      reports: false,
      coupons: false,
      advertising: false,
      activity: false,
      settings: false,
      categories: false,
      shipping: false,
      custom_orders: false,
      support: false
    }
  });

  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [userRoles, setUserRoles] = useState<Record<string, any>>({});

  // Permission categories for organization
  const permissionCategories = [
    {
      id: 'core',
      name: 'Core Features',
      icon: Home,
      permissions: ['dashboard', 'activity']
    },
    {
      id: 'user_management',
      name: 'User Management',
      icon: Users,
      permissions: ['users', 'sellers']
    },
    {
      id: 'content',
      name: 'Content Management',
      icon: Package,
      permissions: ['products', 'categories', 'reviews', 'custom_orders']
    },
    {
      id: 'commerce',
      name: 'Commerce',
      icon: ShoppingBag,
      permissions: ['orders', 'shipping', 'wallet']
    },
    {
      id: 'promotions',
      name: 'Promotions',
      icon: Megaphone,
      permissions: ['coupons', 'advertising']
    },
    {
      id: 'analytics',
      name: 'Analytics',
      icon: BarChart3,
      permissions: ['reports', 'contracts']
    },
    {
      id: 'system',
      name: 'System',
      icon: Settings,
      permissions: ['settings', 'support']
    }
  ];

  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleIcon = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'super admin':
      case 'super_admin':
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 'admin':
        return <Shield className="w-5 h-5 text-blue-500" />;
      case 'moderator':
        return <UserCheck className="w-5 h-5 text-green-500" />;
      case 'support':
        return <Award className="w-5 h-5 text-purple-500" />;
      default:
        return <Key className="w-5 h-5 text-gray-500" />;
    }
  };

  const getRoleColor = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'super admin':
      case 'super_admin':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'moderator':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'support':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleCreateRole = async () => {
    try {
      const result = await createRole(newRole);
      if (result.success) {
        setShowCreateModal(false);
        setNewRole({
          name: '',
          description: '',
          level: 50,
          permissions: {
            dashboard: true,
            users: false,
            sellers: false,
            products: false,
            orders: false,
            reviews: false,
            wallet: false,
            contracts: false,
            reports: false,
            coupons: false,
            advertising: false,
            activity: false,
            settings: false,
            categories: false,
            shipping: false,
            custom_orders: false,
            support: false
          }
        });
      }
    } catch (error) {
      console.error('Error creating role:', error);
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedRole) return;
    
    try {
      const result = await updateRole(selectedRole.id, selectedRole);
      if (result.success) {
        setShowEditModal(false);
        setSelectedRole(null);
      }
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role? Users with this role will lose access.')) {
      return;
    }
    
    try {
      await deleteRole(roleId);
    } catch (error) {
      console.error('Error deleting role:', error);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedRole || !selectedUser) return;
    
    try {
      const result = await assignRole(selectedUser.id, selectedRole.id);
      if (result.success) {
        setUserRoles(prev => ({
          ...prev,
          [selectedUser.id]: selectedRole
        }));
        setShowAssignModal(false);
        setSelectedUser(null);
      }
    } catch (error) {
      console.error('Error assigning role:', error);
    }
  };

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      // This would call your user search API
      // For now, using mock data
      const mockUsers = [
        { id: '1', name: 'John Doe', email: 'john@example.com', avatar: null },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com', avatar: null },
        { id: '3', name: 'Bob Johnson', email: 'bob@example.com', avatar: null }
      ];
      
      setSearchResults(mockUsers.filter(user => 
        user.name.toLowerCase().includes(query.toLowerCase()) ||
        user.email.toLowerCase().includes(query.toLowerCase())
      ));
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const togglePermission = (permission: string) => {
    if (selectedRole) {
      setSelectedRole({
        ...selectedRole,
        permissions: {
          ...selectedRole.permissions,
          [permission]: !selectedRole.permissions[permission]
        }
      });
    }
  };

  const toggleAllPermissions = (enabled: boolean) => {
    if (selectedRole) {
      const allPermissions = Object.keys(selectedRole.permissions).reduce((acc, key) => {
        acc[key] = enabled;
        return acc;
      }, {} as any);
      
      setSelectedRole({
        ...selectedRole,
        permissions: allPermissions
      });
    }
  };

  const exportRoles = () => {
    const csvContent = [
      ['Role Name', 'Description', 'Level', 'Permissions', 'Created At'],
      ...roles.map(role => [
        role.name,
        role.description || '',
        role.level,
        Object.entries(role.permissions || {})
          .filter(([_, value]) => value)
          .map(([key]) => key)
          .join('; '),
        format(new Date(role.created_at), 'yyyy-MM-dd HH:mm')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin_roles_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const stats = {
    totalRoles: roles.length,
    activeUsers: Object.keys(userRoles).length,
    superAdmins: roles.filter(r => r.name.toLowerCase().includes('super')).length,
    customRoles: roles.filter(r => !['super admin', 'admin', 'moderator', 'support'].includes(r.name.toLowerCase())).length
  };

  if (compact) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Roles & Permissions</h3>
            <p className="text-xs text-gray-600">{stats.totalRoles} roles defined</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-2 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <UserPlus className="w-3 h-3 mr-1" />
            New Role
          </button>
        </div>

        <div className="space-y-2">
          {filteredRoles.slice(0, 5).map(role => (
            <div key={role.id} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
              <div className="flex items-center space-x-2">
                {getRoleIcon(role.name)}
                <div>
                  <div className="text-xs font-medium text-gray-900">{role.name}</div>
                  <div className="text-xs text-gray-600">
                    Level: {role.level} • {Object.values(role.permissions || {}).filter(Boolean).length} permissions
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedRole(role);
                  setShowEditModal(true);
                }}
                className="p-1 text-gray-500 hover:text-gray-700"
              >
                <MoreVertical className="w-3 h-3" />
              </button>
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
            <h1 className="text-2xl font-bold text-gray-900">Roles & Permissions</h1>
            <p className="text-gray-600 mt-1">Manage admin roles and their access permissions</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={exportRoles}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
            <button
              onClick={fetchRoles}
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
              <UserPlus className="w-4 h-4 mr-2" />
              Create Role
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Roles</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalRoles}</p>
              </div>
              <Shield className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700">Active Users</p>
                <p className="text-2xl font-bold text-blue-900">{stats.activeUsers}</p>
              </div>
              <Users className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-700">Super Admins</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.superAdmins}</p>
              </div>
              <Crown className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700">Custom Roles</p>
                <p className="text-2xl font-bold text-purple-900">{stats.customRoles}</p>
              </div>
              <Key className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search roles by name or description..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
              </div>
              
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Bulk Actions</option>
                <option value="export">Export Selected</option>
                <option value="disable">Disable Selected</option>
                <option value="delete">Delete Selected</option>
              </select>
            </div>
          </div>
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

        {/* Roles Display */}
        {viewMode === 'list' ? (
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Level
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Permissions
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Users
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-2 text-sm text-gray-600">Loading roles...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredRoles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Shield className="w-12 h-12 text-gray-300 mb-2" />
                        <p className="text-gray-600">No roles found</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {searchTerm ? 'Try adjusting your search' : 'Create your first role to get started'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRoles.map((role) => (
                    <React.Fragment key={role.id}>
                      <tr className={`hover:bg-gray-50 ${expandedRoleId === role.id ? 'bg-blue-50' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center bg-gray-100">
                              {getRoleIcon(role.name)}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-semibold text-gray-900">{role.name}</div>
                              <div className="text-sm text-gray-500">{role.description || 'No description'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${Math.min(100, (role.level / 100) * 100)}%` }}
                              />
                            </div>
                            <span className="ml-2 text-sm font-medium text-gray-900">{role.level}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(role.permissions || {})
                              .filter(([_, value]) => value)
                              .slice(0, 3)
                              .map(([key]) => (
                                <span key={key} className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                                  {key}
                                </span>
                              ))}
                            {Object.values(role.permissions || {}).filter(Boolean).length > 3 && (
                              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                +{Object.values(role.permissions || {}).filter(Boolean).length - 3} more
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Users className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">
                              {Object.values(userRoles).filter((ur: any) => ur?.id === role.id).length} users
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(role.created_at), 'MMM d, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                if (expandedRoleId === role.id) {
                                  setExpandedRoleId(null);
                                } else {
                                  setExpandedRoleId(role.id);
                                }
                              }}
                              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                            >
                              {expandedRoleId === role.id ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setSelectedRole(role);
                                setShowEditModal(true);
                              }}
                              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setShowAssignModal(true)}
                              className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                            >
                              <UserPlus className="w-4 h-4" />
                            </button>
                            {!['super admin', 'admin', 'moderator', 'support'].includes(role.name.toLowerCase()) && (
                              <button
                                onClick={() => handleDeleteRole(role.id)}
                                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      
                      {/* Expanded View */}
                      {expandedRoleId === role.id && (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 bg-blue-50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-3">Permissions Details</h4>
                                <div className="space-y-2">
                                  {permissionCategories.map(category => {
                                    const categoryPermissions = Object.entries(role.permissions || {})
                                      .filter(([key, value]) => value && category.permissions.includes(key))
                                      .map(([key]) => key);
                                    
                                    if (categoryPermissions.length === 0) return null;
                                    
                                    return (
                                      <div key={category.id} className="flex items-center justify-between p-2 bg-white rounded border">
                                        <div className="flex items-center">
                                          <category.icon className="w-4 h-4 text-gray-400 mr-2" />
                                          <span className="text-sm font-medium text-gray-900">{category.name}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                          {categoryPermissions.map(permission => (
                                            <span key={permission} className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                                              {permission}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h4>
                                <div className="space-y-2">
                                  <button
                                    onClick={() => {
                                      setSelectedRole(role);
                                      setShowEditModal(true);
                                    }}
                                    className="w-full flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50"
                                  >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit Role
                                  </button>
                                  <button
                                    onClick={() => setShowAssignModal(true)}
                                    className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                  >
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    Assign to User
                                  </button>
                                  <button
                                    onClick={() => {
                                      const roleData = JSON.stringify(role, null, 2);
                                      navigator.clipboard.writeText(roleData);
                                      alert('Role data copied to clipboard!');
                                    }}
                                    className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                  >
                                    <Copy className="w-4 h-4 mr-2" />
                                    Copy Role Data
                                  </button>
                                </div>
                                
                                <div className="mt-4">
                                  <h4 className="text-sm font-medium text-gray-900 mb-2">Role Information</h4>
                                  <dl className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                      <dt className="text-gray-500">Created:</dt>
                                      <dd className="text-gray-900">
                                        {format(new Date(role.created_at), 'MMM d, yyyy HH:mm')}
                                      </dd>
                                    </div>
                                    {role.updated_at && (
                                      <div className="flex justify-between">
                                        <dt className="text-gray-500">Last Updated:</dt>
                                        <dd className="text-gray-900">
                                          {format(new Date(role.updated_at), 'MMM d, yyyy HH:mm')}
                                        </dd>
                                      </div>
                                    )}
                                    <div className="flex justify-between">
                                      <dt className="text-gray-500">Total Permissions:</dt>
                                      <dd className="text-gray-900">
                                        {Object.values(role.permissions || {}).filter(Boolean).length}
                                      </dd>
                                    </div>
                                  </dl>
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
        ) : (
          // Grid View
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRoles.map((role) => (
              <div key={role.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-gray-100">
                      {getRoleIcon(role.name)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{role.name}</h3>
                      <p className="text-sm text-gray-500">{role.description || 'No description'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(role.name)}`}>
                      Level {role.level}
                    </span>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Permissions</span>
                    <span className="text-xs text-gray-500">
                      {Object.values(role.permissions || {}).filter(Boolean).length} enabled
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(role.permissions || {})
                      .filter(([_, value]) => value)
                      .slice(0, 5)
                      .map(([key]) => (
                        <span key={key} className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                          {key}
                        </span>
                      ))}
                    {Object.values(role.permissions || {}).filter(Boolean).length > 5 && (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                        +{Object.values(role.permissions || {}).filter(Boolean).length - 5} more
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    <span>{Object.values(userRoles).filter((ur: any) => ur?.id === role.id).length} users</span>
                  </div>
                  <div>
                    {format(new Date(role.created_at), 'MMM d')}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setSelectedRole(role);
                      setShowEditModal(true);
                    }}
                    className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    <Edit className="w-4 h-4 inline mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="flex-1 px-3 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                  >
                    <UserPlus className="w-4 h-4 inline mr-1" />
                    Assign
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {filteredRoles.length > 0 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{filteredRoles.length}</span> of{' '}
              <span className="font-medium">{roles.length}</span> roles
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

      {/* Create Role Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Create New Role</h2>
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
                        Role Name *
                      </label>
                      <input
                        type="text"
                        value={newRole.name}
                        onChange={(e) => setNewRole({...newRole, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Content Manager"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Level (1-100) *
                      </label>
                      <input
                        type="number"
                        value={newRole.level}
                        onChange={(e) => setNewRole({...newRole, level: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="1"
                        max="100"
                        required
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={newRole.description}
                      onChange={(e) => setNewRole({...newRole, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                      placeholder="Describe the role's purpose and responsibilities..."
                    />
                  </div>
                </div>

                {/* Permissions */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900">Permissions</h3>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => toggleAllPermissions(true)}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Select All
                      </button>
                      <span className="text-gray-400">|</span>
                      <button
                        type="button"
                        onClick={() => toggleAllPermissions(false)}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {permissionCategories.map((category) => (
                      <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center mb-3">
                          <category.icon className="w-4 h-4 text-gray-500 mr-2" />
                          <h4 className="text-sm font-medium text-gray-900">{category.name}</h4>
                        </div>
                        <div className="space-y-2">
                          {category.permissions.map((permission) => (
                            <div key={permission} className="flex items-center">
                              <input
                                type="checkbox"
                                id={`perm_${permission}`}
                                checked={newRole.permissions[permission as keyof typeof newRole.permissions]}
                                onChange={(e) => setNewRole({
                                  ...newRole,
                                  permissions: {
                                    ...newRole.permissions,
                                    [permission]: e.target.checked
                                  }
                                })}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <label
                                htmlFor={`perm_${permission}`}
                                className="ml-2 text-sm text-gray-900 capitalize"
                              >
                                {permission.replace('_', ' ')}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
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
                  onClick={handleCreateRole}
                  disabled={!newRole.name || loading}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Role'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {showEditModal && selectedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Edit Role: {selectedRole.name}</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedRole(null);
                  }}
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
                        Role Name *
                      </label>
                      <input
                        type="text"
                        value={selectedRole.name}
                        onChange={(e) => setSelectedRole({...selectedRole, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Level (1-100) *
                      </label>
                      <input
                        type="number"
                        value={selectedRole.level}
                        onChange={(e) => setSelectedRole({...selectedRole, level: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="1"
                        max="100"
                        required
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={selectedRole.description || ''}
                      onChange={(e) => setSelectedRole({...selectedRole, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                    />
                  </div>
                </div>

                {/* Permissions */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900">Permissions</h3>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => toggleAllPermissions(true)}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Select All
                      </button>
                      <span className="text-gray-400">|</span>
                      <button
                        type="button"
                        onClick={() => toggleAllPermissions(false)}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {permissionCategories.map((category) => (
                      <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center mb-3">
                          <category.icon className="w-4 h-4 text-gray-500 mr-2" />
                          <h4 className="text-sm font-medium text-gray-900">{category.name}</h4>
                        </div>
                        <div className="space-y-2">
                          {category.permissions.map((permission) => (
                            <div key={permission} className="flex items-center">
                              <input
                                type="checkbox"
                                id={`edit_perm_${permission}`}
                                checked={selectedRole.permissions[permission as keyof typeof selectedRole.permissions]}
                                onChange={() => togglePermission(permission)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <label
                                htmlFor={`edit_perm_${permission}`}
                                className="ml-2 text-sm text-gray-900 capitalize"
                              >
                                {permission.replace('_', ' ')}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedRole(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdateRole}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Role Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Assign Role to User</h2>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-6">
                {/* User Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search User
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => {
                        setUserSearch(e.target.value);
                        searchUsers(e.target.value);
                      }}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Search by name or email..."
                    />
                  </div>
                  
                  {searchResults.length > 0 && (
                    <div className="mt-2 border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                      {searchResults.map((user) => (
                        <div
                          key={user.id}
                          onClick={() => {
                            setSelectedUser(user);
                            setUserSearch(`${user.name} (${user.email})`);
                            setSearchResults([]);
                          }}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                        >
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                              {user.avatar ? (
                                <img src={user.avatar} alt="" className="h-8 w-8 rounded-full" />
                              ) : (
                                <span className="text-sm font-semibold text-gray-600">
                                  {user.name.charAt(0)}
                                </span>
                              )}
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Role
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {roles.map((role) => (
                      <div
                        key={role.id}
                        onClick={() => setSelectedRole(role)}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedRole?.id === role.id 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            {getRoleIcon(role.name)}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{role.name}</div>
                            <div className="text-xs text-gray-500">Level {role.level}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Selected Information */}
                {(selectedUser || selectedRole) && (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Assignment Summary</h4>
                    {selectedUser && (
                      <div className="mb-2">
                        <span className="text-xs text-gray-500">User:</span>
                        <div className="text-sm font-medium text-gray-900">
                          {selectedUser.name} ({selectedUser.email})
                        </div>
                      </div>
                    )}
                    {selectedRole && (
                      <div>
                        <span className="text-xs text-gray-500">Role:</span>
                        <div className="text-sm font-medium text-gray-900">
                          {selectedRole.name} (Level {selectedRole.level})
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-8 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAssignRole}
                  disabled={!selectedUser || !selectedRole || loading}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Assigning...' : 'Assign Role'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionsManager;