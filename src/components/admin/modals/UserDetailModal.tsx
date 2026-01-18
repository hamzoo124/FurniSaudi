// src/components/admin/modals/UserDetailModal.tsx
import React, { useState, useEffect } from 'react';
import { 
  X, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Store, 
  Package, 
  ShoppingBag,
  CreditCard,
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit,
  Save,
  Loader2
} from 'lucide-react';
import { usersAPI, User } from '@/api/users';

interface UserDetailModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({ user, isOpen, onClose, onRefresh }) => {
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState<any>({});

  useEffect(() => {
    if (isOpen && user) {
      fetchUserDetails();
    }
  }, [isOpen, user]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const data = await usersAPI.getUserDetails(user.id);
      setDetails(data);
      setEditData({
        full_name: user.full_name,
        phone: user.phone,
        business_name: user.business_name,
        status: user.status
      });
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // Here you would implement update logic
      // For now, just refresh
      await onRefresh();
      setEditing(false);
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">User Details</h2>
              <p className="text-gray-600 text-sm">ID: {user.id}</p>
            </div>
            <div className="flex items-center gap-2">
              {editing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-3" />
              <p className="text-gray-600">Loading user details...</p>
            </div>
          ) : (
            <>
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Personal Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">{user.email}</span>
                    </div>
                    {user.phone && (
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600">{user.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">
                        Joined: {new Date(user.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Account Status</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">User Type</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        user.user_type === 'admin' ? 'bg-purple-100 text-purple-800' :
                        user.user_type.includes('seller') ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.user_type}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        user.status === 'active' ? 'bg-green-100 text-green-800' :
                        user.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {user.status}
                      </span>
                    </div>
                    {details?.seller && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Approval</span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          details.seller.approval_status === 'approved' ? 'bg-green-100 text-green-800' :
                          details.seller.approval_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {details.seller.approval_status}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Business Information</h3>
                  {user.business_name ? (
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Store className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600">{user.business_name}</span>
                      </div>
                      {user.business_type && (
                        <div className="text-sm text-gray-600 capitalize">
                          Type: {user.business_type}
                        </div>
                      )}
                      {details?.seller?.cr_number && (
                        <div className="text-sm text-gray-600">
                          CR: {details.seller.cr_number}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No business information</p>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900">
                    {details?.stats?.total_orders || 0}
                  </div>
                  <div className="text-sm text-gray-600 flex items-center">
                    <ShoppingBag className="h-4 w-4 mr-1" />
                    Total Orders
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900">
                    ${(details?.stats?.total_spent || 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 flex items-center">
                    <CreditCard className="h-4 w-4 mr-1" />
                    Total Spent
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900">
                    {details?.stats?.total_products || 0}
                  </div>
                  <div className="text-sm text-gray-600 flex items-center">
                    <Package className="h-4 w-4 mr-1" />
                    Products Listed
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900">
                    ${(details?.stats?.avg_order_value || 0).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">Avg Order Value</div>
                </div>
              </div>

              {/* Recent Products (for sellers) */}
              {details?.products && details.products.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Recent Products</h3>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Price</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Stock</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {details.products.slice(0, 5).map((product: any) => (
                            <tr key={product.id}>
                              <td className="px-4 py-2 text-sm text-gray-900">{product.name}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">${product.price}</td>
                              <td className="px-4 py-2">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  product.status === 'active' ? 'bg-green-100 text-green-800' :
                                  product.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {product.status}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900">{product.stock}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Orders */}
              {details?.recent_orders && details.recent_orders.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Recent Orders</h3>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Order ID</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Amount</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {details.recent_orders.map((order: any) => (
                            <tr key={order.id}>
                              <td className="px-4 py-2 text-sm text-gray-900">#{order.order_number}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {new Date(order.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900">${order.total_amount}</td>
                              <td className="px-4 py-2">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                  order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {order.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Additional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-gray-700 mb-1">Last Login</div>
                    <div className="text-gray-600">
                      {user.last_sign_in_at 
                        ? new Date(user.last_sign_in_at).toLocaleString() 
                        : 'Never'}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-700 mb-1">Account Created</div>
                    <div className="text-gray-600">
                      {new Date(user.created_at).toLocaleString()}
                    </div>
                  </div>
                  {details?.seller_application && (
                    <>
                      <div>
                        <div className="font-medium text-gray-700 mb-1">Application Status</div>
                        <div className="text-gray-600">{details.seller_application.status}</div>
                      </div>
                      {details.seller_application.admin_notes && (
                        <div>
                          <div className="font-medium text-gray-700 mb-1">Admin Notes</div>
                          <div className="text-gray-600">{details.seller_application.admin_notes}</div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal;