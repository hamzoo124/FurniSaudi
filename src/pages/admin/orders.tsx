// src/pages/admin/OrdersPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { 
  Search, Filter, Package, CheckCircle, XCircle,
  Truck, DollarSign, User, Calendar, Download,
  Eye, MoreVertical, TrendingUp, TrendingDown,
  RefreshCw, Loader2, AlertCircle, CreditCard,
  MapPin, Phone, Mail, ShoppingBag
} from "lucide-react";
import { supabaseAdmin as supabase } from '@/lib/supabase';

interface Order {
  id: string;
  order_number: string;
  buyer_id: string;
  seller_id: string;
  total_amount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  items: number;
  shipping_address: string;
  shipping_method: string;
  created_at: string;
  updated_at: string;
  buyer?: {
    full_name: string;
    email: string;
    phone: string;
  };
  seller?: {
    business_name: string;
    email: string;
  };
}

const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState("all");
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    totalRevenue: 0,
    avgOrder: 0,
    todayOrders: 0
  });

  // Fetch orders from database
  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Fetch orders with buyer and seller info
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`
          *,
          buyers:buyer_id (
            full_name,
            email,
            phone
          ),
          sellers:seller_id (
            business_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const processedOrders = (ordersData || []).map(order => ({
        ...order,
        buyer: order.buyers,
        seller: order.sellers
      }));

      setOrders(processedOrders);

      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      const todayOrders = processedOrders.filter(o => 
        o.created_at.split('T')[0] === today
      ).length;

      const paidOrders = processedOrders.filter(o => o.payment_status === 'paid');
      const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total_amount, 0);
      const avgOrder = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

      setStats({
        total: processedOrders.length,
        pending: processedOrders.filter(o => o.status === 'pending').length,
        processing: processedOrders.filter(o => o.status === 'processing').length,
        shipped: processedOrders.filter(o => o.status === 'shipped').length,
        delivered: processedOrders.filter(o => o.status === 'delivered').length,
        cancelled: processedOrders.filter(o => o.status === 'cancelled' || o.status === 'refunded').length,
        totalRevenue,
        avgOrder,
        todayOrders
      });

    } catch (error) {
      console.error('Error fetching orders:', error);
      alert('Failed to load orders. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(search.toLowerCase()) || 
      order.buyer?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      order.buyer?.email?.toLowerCase().includes(search.toLowerCase()) ||
      order.seller?.business_name?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = selectedStatus === "all" || order.status === selectedStatus;
    const matchesPayment = selectedPayment === "all" || order.payment_status === selectedPayment;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  // Handle order actions
  const handleOrderAction = async (orderId: string, action: string) => {
    try {
      switch (action) {
        case 'view':
          navigate(`/admin/orders/${orderId}`);
          break;
          
        case 'process':
          await supabase
            .from('orders')
            .update({ 
              status: 'processing',
              updated_at: new Date().toISOString()
            })
            .eq('id', orderId);
          alert('Order marked as processing.');
          await fetchOrders();
          break;
          
        case 'ship':
          await supabase
            .from('orders')
            .update({ 
              status: 'shipped',
              updated_at: new Date().toISOString()
            })
            .eq('id', orderId);
          alert('Order marked as shipped.');
          await fetchOrders();
          break;
          
        case 'deliver':
          await supabase
            .from('orders')
            .update({ 
              status: 'delivered',
              updated_at: new Date().toISOString()
            })
            .eq('id', orderId);
          alert('Order marked as delivered.');
          await fetchOrders();
          break;
          
        case 'cancel':
          if (confirm('Cancel this order?')) {
            await supabase
              .from('orders')
              .update({ 
                status: 'cancelled',
                updated_at: new Date().toISOString()
              })
              .eq('id', orderId);
            alert('Order cancelled.');
            await fetchOrders();
          }
          break;
          
        case 'refund':
          if (confirm('Issue refund for this order?')) {
            await supabase
              .from('orders')
              .update({ 
                status: 'refunded',
                payment_status: 'refunded',
                updated_at: new Date().toISOString()
              })
              .eq('id', orderId);
            alert('Refund issued.');
            await fetchOrders();
          }
          break;
          
        case 'update_payment':
          await supabase
            .from('orders')
            .update({ 
              payment_status: 'paid',
              updated_at: new Date().toISOString()
            })
            .eq('id', orderId);
          alert('Payment marked as paid.');
          await fetchOrders();
          break;
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'cancelled': 
      case 'refunded': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'shipped': return <Truck className="h-4 w-4" />;
      case 'processing': return <Package className="h-4 w-4" />;
      case 'pending': return <AlertCircle className="h-4 w-4" />;
      case 'cancelled': 
      case 'refunded': return <XCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  // Get payment color
  const getPaymentColor = (status: string) => {
    switch(status) {
      case 'paid': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'failed': return 'text-red-600';
      case 'refunded': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  // Initialize
  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Orders Management</h1>
              <p className="text-gray-600">Manage and track all customer orders</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={fetchOrders}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Orders</div>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                {stats.todayOrders} today
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">{stats.delivered}</div>
              <div className="text-sm text-gray-600">Delivered</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">${stats.totalRevenue.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Revenue</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">${stats.avgOrder.toFixed(0)}</div>
              <div className="text-sm text-gray-600">Avg Order Value</div>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
              <div className="text-lg font-bold text-orange-600">{stats.pending}</div>
              <div className="text-xs text-orange-800">Pending</div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <div className="text-lg font-bold text-yellow-600">{stats.processing}</div>
              <div className="text-xs text-yellow-800">Processing</div>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="text-lg font-bold text-blue-600">{stats.shipped}</div>
              <div className="text-xs text-blue-800">Shipped</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <div className="text-lg font-bold text-green-600">{stats.delivered}</div>
              <div className="text-xs text-green-800">Delivered</div>
            </div>
            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
              <div className="text-lg font-bold text-red-600">{stats.cancelled}</div>
              <div className="text-xs text-red-800">Cancelled</div>
            </div>
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
                  placeholder="Search orders by ID, customer, or seller..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <select 
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>
              
              <select 
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedPayment}
                onChange={(e) => setSelectedPayment(e.target.value)}
              >
                <option value="all">All Payment</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
              
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button 
                  className={`px-3 py-2 ${view === 'list' ? 'bg-gray-100' : 'bg-white'}`}
                  onClick={() => setView('list')}
                >
                  List
                </button>
                <button 
                  className={`px-3 py-2 ${view === 'grid' ? 'bg-gray-100' : 'bg-white'}`}
                  onClick={() => setView('grid')}
                >
                  Grid
                </button>
              </div>
              
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Filter className="h-4 w-4" />
                More Filters
              </button>
            </div>
          </div>
        </div>

        {/* Orders Table/Grid */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-3" />
            <p className="text-gray-600">Loading orders from database...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No orders found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your search or filters</p>
            <button
              onClick={() => {
                setSearch("");
                setSelectedStatus("all");
                setSelectedPayment("all");
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Clear Filters
            </button>
          </div>
        ) : view === 'list' ? (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Seller
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-mono font-medium text-gray-900">{order.order_number}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{order.buyer?.full_name || 'Unknown'}</div>
                          <div className="text-sm text-gray-500">{order.buyer?.email || ''}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{order.seller?.business_name || 'Unknown'}</div>
                          <div className="text-sm text-gray-500">{order.seller?.email || ''}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(order.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-gray-900">${order.total_amount.toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1">{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${getPaymentColor(order.payment_status)}`}>
                          {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOrderAction(order.id, 'view')}
                            className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          
                          {order.status === 'pending' && (
                            <button
                              onClick={() => handleOrderAction(order.id, 'process')}
                              className="p-2 text-yellow-600 hover:text-yellow-900 hover:bg-yellow-50 rounded-lg"
                              title="Mark as Processing"
                            >
                              <Package className="h-4 w-4" />
                            </button>
                          )}
                          
                          {order.status === 'processing' && (
                            <button
                              onClick={() => handleOrderAction(order.id, 'ship')}
                              className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg"
                              title="Mark as Shipped"
                            >
                              <Truck className="h-4 w-4" />
                            </button>
                          )}
                          
                          {order.status === 'shipped' && (
                            <button
                              onClick={() => handleOrderAction(order.id, 'deliver')}
                              className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg"
                              title="Mark as Delivered"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          
                          {order.payment_status === 'pending' && (
                            <button
                              onClick={() => handleOrderAction(order.id, 'update_payment')}
                              className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg"
                              title="Mark as Paid"
                            >
                              <CreditCard className="h-4 w-4" />
                            </button>
                          )}
                          
                          {order.status !== 'cancelled' && order.status !== 'refunded' && (
                            <button
                              onClick={() => handleOrderAction(order.id, 'cancel')}
                              className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg"
                              title="Cancel Order"
                            >
                              <XCircle className="h-4 w-4" />
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="font-mono font-bold text-gray-900 text-lg">{order.order_number}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    <span className="ml-1">{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                  </span>
                </div>

                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900">{order.buyer?.full_name || 'Unknown'}</div>
                      <div className="text-sm text-gray-500">{order.buyer?.email || ''}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Store className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900">{order.seller?.business_name || 'Unknown'}</div>
                      <div className="text-sm text-gray-500">{order.seller?.email || ''}</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 line-clamp-1 mt-2">
                    <MapPin className="h-3 w-3 inline mr-1" />
                    {order.shipping_address}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <div className="font-bold text-gray-900">${order.total_amount.toFixed(2)}</div>
                    </div>
                    <div className="text-xs text-gray-600">Total</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Package className="h-4 w-4 text-gray-400" />
                      <div className="font-bold text-gray-900">{order.items || 1} items</div>
                    </div>
                    <div className="text-xs text-gray-600">Items</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <div className={`text-sm font-medium ${getPaymentColor(order.payment_status)}`}>
                      Payment: {order.payment_status}
                    </div>
                    <div className="text-xs text-gray-500">{order.shipping_method || 'Standard'}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOrderAction(order.id, 'view')}
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                    >
                      View
                    </button>
                    {order.status === 'pending' && (
                      <button
                        onClick={() => handleOrderAction(order.id, 'process')}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Process
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default OrdersPage;