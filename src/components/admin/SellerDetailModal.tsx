import React, { useState, useEffect } from 'react';
import { 
  X, Store, User, Mail, Phone, MapPin, 
  FileText, Calendar, CheckCircle,
  XCircle, AlertCircle, DollarSign, Package,
  ShoppingBag, MessageSquare, Shield, Edit,
  Trash2, Ban, Check, ExternalLink, Eye
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface SellerDetailModalProps {
  seller: any;
  isOpen: boolean;
  onClose: () => void;
  onAction?: (action: string, sellerId: string) => void;
}

const SellerDetailModal: React.FC<SellerDetailModalProps> = ({ 
  seller, isOpen, onClose, onAction 
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'products' | 'orders' | 'activity'>('info');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  // Fetch data when tab changes
  useEffect(() => {
    if (isOpen && seller) {
      switch (activeTab) {
        case 'products':
          fetchSellerProducts();
          break;
        case 'orders':
          fetchSellerOrders();
          break;
        case 'activity':
          fetchSellerActivities();
          break;
      }
    }
  }, [activeTab, isOpen, seller]);

  const fetchSellerProducts = async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', seller.id || seller.user_id)
        .limit(10);
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSellerOrders = async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('seller_id', seller.id || seller.user_id)
        .limit(10);
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSellerActivities = async () => {
    try {
      setLoading(true);
      // Fetch activities from activity_logs table
      const { data } = await supabase
        .from('activity_logs')
        .select('*')
        .or(`target_id.eq.${seller.id || seller.user_id},details->>seller_id.eq.${seller.id || seller.user_id}`)
        .order('created_at', { ascending: false })
        .limit(10);
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string) => {
    if (onAction) {
      onAction(action, seller.id || seller.user_id);
    }
    
    const adminId = 'admin'; // You should get actual admin ID from auth
    
    switch (action) {
      case 'suspend':
        if (confirm('Are you sure you want to suspend this seller?')) {
          try {
            // Update seller status in database
            await supabase
              .from('sellers')
              .update({
                approval_status: 'suspended',
                status: 'inactive',
                suspension_reason: 'Suspended by admin',
                updated_at: new Date().toISOString()
              })
              .eq('id', seller.id || seller.user_id);
            
            alert('Seller suspended successfully');
            onClose();
          } catch (error) {
            console.error('Error suspending seller:', error);
            alert('Error suspending seller');
          }
        }
        break;
        
      case 'activate':
        if (confirm('Are you sure you want to activate this seller?')) {
          try {
            // Update seller status in database
            await supabase
              .from('sellers')
              .update({
                approval_status: 'approved',
                status: 'active',
                suspension_reason: null,
                updated_at: new Date().toISOString()
              })
              .eq('id', seller.id || seller.user_id);
            
            alert('Seller activated successfully');
            onClose();
          } catch (error) {
            console.error('Error activating seller:', error);
            alert('Error activating seller');
          }
        }
        break;
        
      case 'delete':
        if (confirm('Are you sure you want to delete this seller?')) {
          try {
            await supabase
              .from('sellers')
              .delete()
              .eq('id', seller.id || seller.user_id);
            alert('Seller deleted successfully');
            onClose();
          } catch (error) {
            console.error('Error deleting seller:', error);
            alert('Error deleting seller');
          }
        }
        break;
        
      case 'message':
        const message = prompt('Enter your message to the seller:');
        if (message) {
          try {
            // Create message record
            await supabase
              .from('admin_messages')
              .insert({
                sender_id: adminId,
                sender_type: 'admin',
                receiver_id: seller.user_id || seller.id,
                receiver_type: 'seller',
                subject: 'Message from Admin',
                message: message,
                is_read: false,
                created_at: new Date().toISOString()
              });
            
            alert('Message sent successfully');
          } catch (error) {
            console.error('Error sending message:', error);
            alert('Error sending message');
          }
        }
        break;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {seller.business_name || 'Seller Details'}
                </h2>
                <p className="text-gray-600 text-sm flex items-center gap-2">
                  {seller.email}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(seller.status || seller.approval_status)}`}>
                    {seller.status || seller.approval_status || 'Unknown'}
                  </span>
                </p>
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
              { id: 'products', label: 'Products', icon: Package },
              { id: 'orders', label: 'Orders', icon: ShoppingBag },
              { id: 'activity', label: 'Activity', icon: MessageSquare }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
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
                {/* Business Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Business Information</h3>
                  <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Store className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Business Name</p>
                        <p className="font-medium">{seller.business_name || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Contact Person</p>
                        <p className="font-medium">{seller.full_name || seller.contact_person || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Mail className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium">{seller.email || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-medium">{seller.contact_number || seller.phone || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Address</p>
                        <p className="font-medium">
                          {seller.address ? `${seller.address}, ${seller.city}` : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Business Type</p>
                        <p className="font-medium capitalize">{seller.business_type || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Financial Information</h3>
                  <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">CR Number</p>
                        <p className="font-medium">{seller.cr_number || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Bank Name</p>
                        <p className="font-medium">{seller.bank_name || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Account Number</p>
                        <p className="font-medium">{seller.account_number || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">IBAN</p>
                        <p className="font-medium">{seller.iban || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <DollarSign className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Commission Rate</p>
                        <p className="font-medium">{seller.commission_rate || 10}%</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Performance Stats</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">{seller.total_products || 0}</div>
                      <div className="text-sm text-gray-600">Products</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">{seller.total_orders || 0}</div>
                      <div className="text-sm text-gray-600">Orders</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">${seller.total_sales || 0}</div>
                      <div className="text-sm text-gray-600">Total Sales</div>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">${seller.total_earnings || 0}</div>
                      <div className="text-sm text-gray-600">Earnings</div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Actions</h3>
                  <div className="space-y-2">
                    {(seller.status === 'active' || seller.approval_status === 'approved') ? (
                      <button
                        onClick={() => handleAction('suspend')}
                        className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                      >
                        <Ban className="w-4 h-4" />
                        Suspend Seller
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAction('activate')}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        Activate Seller
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleAction('message')}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Send Message
                    </button>
                    
                    <button
                      onClick={() => handleAction('delete')}
                      className="w-full px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Seller
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Seller Products</h3>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No products found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {products.map(product => (
                    <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {product.images && product.images[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <h4 className="font-medium text-gray-900">{product.name}</h4>
                            <p className="text-sm text-gray-600">${product.price} • {product.stock} in stock</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            product.approval_status === 'approved' ? 'bg-green-100 text-green-800' :
                            product.approval_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {product.approval_status}
                          </span>
                          <button className="p-1 text-gray-400 hover:text-gray-600">
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Recent Orders</h3>
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
                          <h4 className="font-medium text-gray-900">Order #{order.order_number || order.id}</h4>
                          <p className="text-sm text-gray-600">
                            ${order.total_amount || 0} • {formatDate(order.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {order.status || 'unknown'}
                          </span>
                          <button className="p-1 text-gray-400 hover:text-gray-600">
                            <Eye className="w-4 h-4" />
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
              <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No activity found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activities.map(activity => (
                    <div key={activity.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900 capitalize">
                            {activity.action?.replace(/_/g, ' ') || 'Activity'}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {activity.details ? 
                              (typeof activity.details === 'string' ? activity.details : JSON.stringify(activity.details)) 
                              : 'No details'}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(activity.created_at)}
                          </p>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                          {activity.user_type || 'system'}
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

export default SellerDetailModal;