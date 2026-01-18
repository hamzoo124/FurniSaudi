// src/components/admin/UserDetailModal.tsx
import React, { useState } from 'react';
import { 
  X, User, Mail, Phone, Calendar, MapPin, 
  ShoppingBag, Store, Shield, CreditCard, 
  MessageSquare, Edit, Trash2, Ban, Check,
  ExternalLink, AlertCircle, Clock, Package,
  DollarSign, Activity
} from 'lucide-react';
import { usersAPI } from '@/api/users';
import { supabase } from '@/lib/supabase';

interface UserDetailModalProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({ 
  user, isOpen, onClose 
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'orders' | 'activity'>('info');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  if (!isOpen) return null;

  const fetchUserOrders = async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('buyer_id', user.id)
        .limit(10);
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserActivities = async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .limit(10);
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as any);
    
    switch (tab) {
      case 'orders':
        fetchUserOrders();
        break;
      case 'activity':
        fetchUserActivities();
        break;
    }
  };

  const handleAction = async (action: string) => {
    switch (action) {
      case 'suspend':
        if (confirm('Are you sure you want to suspend this user?')) {
          try {
            await usersAPI.updateUserStatus(user.id, 'suspended');
            alert('User suspended successfully');
            onClose();
          } catch (error) {
            alert('Error suspending user');
          }
        }
        break;
        
      case 'activate':
        if (confirm('Are you sure you want to activate this user?')) {
          try {
            await usersAPI.updateUserStatus(user.id, 'active');
            alert('User activated successfully');
            onClose();
          } catch (error) {
            alert('Error activating user');
          }
        }
        break;
        
      case 'delete':
        if (confirm('Are you sure you want to delete this user?')) {
          try {
            await usersAPI.deleteUser(user.id);
            alert('User deleted successfully');
            onClose();
          } catch (error) {
            alert('Error deleting user');
          }
        }
        break;
        
      case 'message':
        const message = prompt('Enter your message to the user:');
        if (message) {
          try {
            await usersAPI.sendMessageToUser(
              user.id,
              'Message from Admin',
              message
            );
            alert('Message sent successfully');
          } catch (error) {
            alert('Error sending message');
          }
        }
        break;
        
      case 'approve_seller':
        if (confirm('Approve this seller application?')) {
          const notes = prompt('Add approval notes (optional):');
          try {
            await usersAPI.updateSellerApproval(user.id, 'approved', notes);
            alert('Seller approved successfully');
            onClose();
          } catch (error) {
            alert('Error approving seller');
          }
        }
        break;
        
      case 'reject_seller':
        if (confirm('Reject this seller application?')) {
          const reason = prompt('Enter rejection reason:');
          try {
            await usersAPI.updateSellerApproval(user.id, 'rejected', reason);
            alert('Seller rejected successfully');
            onClose();
          } catch (error) {
            alert('Error rejecting seller');
          }
        }
        break;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'banned': return 'bg-gray-800 text-white';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = () => {
    if (user.user_type === 'admin') {
      return <Shield className="w-4 h-4 text-purple-600" />;
    } else if (user.user_type.includes('seller')) {
      return <Store className="w-4 h-4 text-blue-600" />;
    } else {
      return <ShoppingBag className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleText = () => {
    if (user.user_type === 'admin') {
      return 'Admin';
    } else if (user.user_type === 'seller') {
      return 'Seller';
    } else if (user.user_type === 'seller_pending') {
      return 'Seller (Pending Approval)';
    } else {
      return 'Buyer';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-lg">
                {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {user.full_name || 'User Details'}
                </h2>
                <div className="flex items-center gap-2">
                  <p className="text-gray-600 text-sm">{user.email}</p>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {getRoleIcon()}
                    {getRoleText()}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                    {user.status}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAction('message')}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-1"
              >
                <MessageSquare className="w-4 h-4" />
                Message
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex space-x-1 px-6">
            {[
              { id: 'info', label: 'Information', icon: User },
              { id: 'orders', label: 'Orders', icon: ShoppingBag },
              { id: 'activity', label: 'Activity', icon: Activity }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 font-medium ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto max-h-[calc(90vh-180px)]">
          {activeTab === 'info' && (
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">User Information</h3>
                  <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Full Name</p>
                        <p className="font-medium">{user.full_name || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Mail className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-medium">{user.phone || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Joined Date</p>
                        <p className="font-medium">{formatDate(user.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Last Login</p>
                        <p className="font-medium">
                          {user.last_sign_in_at ? formatDate(user.last_sign_in_at) : 'Never'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Statistics */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Statistics</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">{user.total_orders || 0}</div>
                      <div className="text-sm text-gray-600">Total Orders</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">${user.total_spent || 0}</div>
                      <div className="text-sm text-gray-600">Total Spent</div>
                    </div>
                    {user.user_type.includes('seller') && (
                      <>
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <div className="text-2xl font-bold text-gray-900">{user.total_products || 0}</div>
                          <div className="text-sm text-gray-600">Products</div>
                        </div>
                        <div className="bg-yellow-50 p-3 rounded-lg">
                          <div className="text-2xl font-bold text-gray-900">{user.business_name || 'N/A'}</div>
                          <div className="text-sm text-gray-600">Business</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-4 lg:col-span-2">
                  <h3 className="font-semibold text-gray-900">Actions</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    {user.status === 'active' ? (
                      <button
                        onClick={() => handleAction('suspend')}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                      >
                        <Ban className="w-4 h-4" />
                        Suspend
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAction('activate')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        Activate
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleAction('message')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Send Message
                    </button>
                    
                    {user.user_type === 'seller_pending' && (
                      <>
                        <button
                          onClick={() => handleAction('approve_seller')}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          Approve Seller
                        </button>
                        
                        <button
                          onClick={() => handleAction('reject_seller')}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          Reject Seller
                        </button>
                      </>
                    )}
                    
                    <button
                      onClick={() => handleAction('delete')}
                      className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete User
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">User Orders</h3>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No orders found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map(order => (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">Order #{order.order_number}</h4>
                          <p className="text-sm text-gray-600">
                            ${order.total_amount} • {formatDate(order.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {order.status}
                          </span>
                          <button className="p-1 text-gray-400 hover:text-gray-600">
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">User Activity</h3>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No activity found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activities.map(activity => (
                    <div key={activity.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900 capitalize">
                            {activity.action.replace(/_/g, ' ')}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {activity.details ? JSON.stringify(activity.details) : 'No details'}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(activity.created_at)}
                          </p>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                          {activity.user_type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal;