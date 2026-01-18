import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';// ADD THIS

// ============== TYPES ==============
export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  is_custom: boolean;
  customization_details?: string;
  specifications?: string;
  product_image_url?: string;
}

export interface ShippingInfo {
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  recipient_name: string;
  recipient_phone: string;
  delivery_instructions?: string;
}

export interface CustomerInfo {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  profile_image_url?: string;
}

export interface Order {
  id: string;
  order_id: string;
  seller_id: string;
  customer_id: string;
  total_amount: number;
  subtotal_amount: number;
  vat_amount: number;
  shipping_fee: number;
  status: 'pending' | 'accepted' | 'in_production' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  payment_status: 'pending' | 'paid' | 'partially_paid' | 'refunded' | 'failed';
  payment_method: string;
  shipping_address: ShippingInfo;
  order_type: 'ready-made' | 'custom';
  is_urgent: boolean;
  notes?: string;
  estimated_delivery?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderDetail extends Order {
  customer: CustomerInfo;
  items: OrderItem[];
  seller_notes?: string;
  internal_notes?: string;
  tracking_number?: string;
  courier_name?: string;
  delivered_at?: string;
  cancelled_at?: string;
  cancelled_reason?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface OrdersResponse {
  orders: Order[];
  meta: PaginationMeta;
}

// ============== MOCK DATA ==============
const MOCK_ORDERS: Order[] = [
  {
    id: '1',
    order_id: 'ORD-2024-001',
    seller_id: 'seller_123',
    customer_id: 'cust_001',
    total_amount: 6755,
    subtotal_amount: 5700,
    vat_amount: 855,
    shipping_fee: 200,
    status: 'in_production',
    payment_status: 'paid',
    payment_method: 'Credit Card',
    shipping_address: {
      address: '123 King Fahd Road',
      city: 'Riyadh',
      state: 'Riyadh Province',
      zip_code: '11564',
      country: 'Saudi Arabia',
      recipient_name: 'Ahmed Al-Mansoor',
      recipient_phone: '+966 55 123 4567'
    },
    order_type: 'custom',
    is_urgent: true,
    notes: 'Customer requested quick delivery for wedding',
    estimated_delivery: '2024-02-10',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-16T14:20:00Z'
  },
  {
    id: '2',
    order_id: 'ORD-2024-002',
    seller_id: 'seller_123',
    customer_id: 'cust_002',
    total_amount: 3830,
    subtotal_amount: 3200,
    vat_amount: 480,
    shipping_fee: 150,
    status: 'shipped',
    payment_status: 'paid',
    payment_method: 'Apple Pay',
    shipping_address: {
      address: '456 Corniche Road',
      city: 'Jeddah',
      state: 'Makkah Province',
      zip_code: '23456',
      country: 'Saudi Arabia',
      recipient_name: 'Sarah Johnson',
      recipient_phone: '+966 55 987 6543'
    },
    order_type: 'ready-made',
    is_urgent: false,
    estimated_delivery: '2024-01-20',
    created_at: '2024-01-14T09:15:00Z',
    updated_at: '2024-01-18T11:45:00Z'
  },
  // Add more mock orders as needed
];

const MOCK_ORDER_DETAILS: OrderDetail = {
  id: '1',
  order_id: 'ORD-2024-001',
  seller_id: 'seller_123',
  customer_id: 'cust_001',
  total_amount: 6755,
  subtotal_amount: 5700,
  vat_amount: 855,
  shipping_fee: 200,
  status: 'in_production',
  payment_status: 'paid',
  payment_method: 'Credit Card',
  shipping_address: {
    address: '123 King Fahd Road',
    city: 'Riyadh',
    state: 'Riyadh Province',
    zip_code: '11564',
    country: 'Saudi Arabia',
    recipient_name: 'Ahmed Al-Mansoor',
    recipient_phone: '+966 55 123 4567',
    delivery_instructions: 'Call before delivery'
  },
  order_type: 'custom',
  is_urgent: true,
  notes: 'Customer requested quick delivery for wedding',
  estimated_delivery: '2024-02-10',
  created_at: '2024-01-15T10:30:00Z',
  updated_at: '2024-01-16T14:20:00Z',
  customer: {
    id: 'cust_001',
    full_name: 'Ahmed Al-Mansoor',
    email: 'ahmed@example.com',
    phone: '+966 55 123 4567',
    profile_image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'
  },
  items: [
    {
      id: 'item_1',
      product_id: 'prod_001',
      product_name: 'Custom Leather Sofa',
      quantity: 1,
      unit_price: 4500,
      total_price: 4500,
      is_custom: true,
      customization_details: 'Brown leather, L-shaped, 3-seater, extra cushions',
      specifications: 'Dimensions: 220cm x 160cm x 85cm',
      product_image_url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400'
    },
    {
      id: 'item_2',
      product_id: 'prod_002',
      product_name: 'Coffee Table',
      quantity: 1,
      unit_price: 1200,
      total_price: 1200,
      is_custom: false,
      product_image_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w-400'
    }
  ],
  seller_notes: 'Start production immediately',
  internal_notes: 'VIP customer - prioritize',
  tracking_number: 'TRK789123456',
  courier_name: 'Aramex'
};

// ============== HOOK 1: useOrders ==============
export interface UseOrdersOptions {
  page?: number;
  limit?: number;
  status?: string;
  orderType?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export const useOrders = (
  sellerId?: string,
  options: UseOrdersOptions = {}
) => {
  const { user } = useAuth();
  const effectiveSellerId = sellerId || user?.id;
  
  const {
    page = 1,
    limit = 10,
    status,
    orderType,
    dateFrom,
    dateTo,
    search
  } = options;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<PaginationMeta>({
    page,
    limit,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  const fetchOrders = useCallback(async () => {
    // CRITICAL FIX: Check for demo mode first
    const isDemoMode = localStorage.getItem('demoMode') === 'seller';
    
    try {
      setLoading(true);
      setError(null);

      if (!effectiveSellerId && !isDemoMode) {
        setOrders([]);
        setLoading(false);
        return;
      }

      if (isDemoMode || !effectiveSellerId) {
        // Mock data for demo
        setTimeout(() => {
          const filteredOrders = MOCK_ORDERS;
          const total = filteredOrders.length;
          const startIndex = (page - 1) * limit;
          const endIndex = startIndex + limit;
          const paginatedOrders = filteredOrders.slice(startIndex, endIndex);
          
          setOrders(paginatedOrders);
          setMeta({
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: endIndex < total,
            hasPrev: page > 1
          });
          setLoading(false);
        }, 500);
        return;
      }

      // Real Supabase query
      let query = supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .eq('seller_id', effectiveSellerId)
        .order('created_at', { ascending: false });

      // Apply filters
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      if (orderType && orderType !== 'all') {
        query = query.eq('order_type', orderType);
      }

      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }

      if (dateTo) {
        query = query.lte('created_at', `${dateTo}T23:59:59.999Z`);
      }

      if (search) {
        query = query.or(`order_id.ilike.%${search}%,customer_name.ilike.%${search}%`);
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error: supabaseError, count } = await query;

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      const total = count || 0;
      setOrders(data as Order[]);
      setMeta({
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: to < total - 1,
        hasPrev: page > 1
      });

    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Failed to fetch orders');
      // Fallback to mock data on error
      const filteredOrders = MOCK_ORDERS.filter(order => 
        order.seller_id === sellerId
      );
      setOrders(filteredOrders);
      setMeta({
        page,
        limit,
        total: filteredOrders.length,
        totalPages: Math.ceil(filteredOrders.length / limit),
        hasNext: false,
        hasPrev: false
      });
    } finally {
      setLoading(false);
    }
  }, [effectiveSellerId, page, limit, status, orderType, dateFrom, dateTo, search]);

  const refetch = useCallback(() => {
    fetchOrders();
  }, [fetchOrders]);

  const reload = useCallback(async () => {
    await fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (effectiveSellerId) {
      fetchOrders();
    }
  }, [effectiveSellerId, fetchOrders]);

  return {
    orders,
    loading,
    error,
    meta,
    refetch,
    reload
  };
};

// ============== HOOK 2: useOrderDetails ==============
export const useOrderDetails = (orderId: string) => {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrderDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check for demo mode
      const demoMode = localStorage.getItem('demoMode');
      if (demoMode === 'true') {
        // Mock data for demo
        setTimeout(() => {
          setOrder(MOCK_ORDER_DETAILS);
          setLoading(false);
        }, 500);
        return;
      }

      // Real Supabase query with joins
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('order_id', orderId)
        .single();

      if (orderError) {
        throw new Error(orderError.message);
      }

      if (!orderData) {
        throw new Error('Order not found');
      }

      // Fetch customer details
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', orderData.customer_id)
        .single();

      if (customerError) {
        console.warn('Error fetching customer:', customerError);
        // Continue without customer details
      }

      // Fetch order items
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          products (
            name,
            image_url
          )
        `)
        .eq('order_id', orderData.id);

      if (itemsError) {
        console.warn('Error fetching items:', itemsError);
      }

      // Construct order detail object
      const orderDetail: OrderDetail = {
        ...orderData,
        customer: customerData ? {
          id: customerData.id,
          full_name: customerData.full_name,
          email: customerData.email,
          phone: customerData.phone,
          profile_image_url: customerData.profile_image_url
        } : {
          id: orderData.customer_id,
          full_name: 'Unknown Customer',
          email: 'unknown@example.com',
          phone: 'N/A'
        },
        items: itemsData?.map(item => ({
          id: item.id,
          product_id: item.product_id,
          product_name: item.products?.name || 'Unknown Product',
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          is_custom: item.is_custom,
          customization_details: item.customization_details,
          specifications: item.specifications,
          product_image_url: item.products?.image_url
        })) || []
      };

      setOrder(orderDetail);

    } catch (err: any) {
      console.error('Error fetching order details:', err);
      setError(err.message || 'Failed to fetch order details');
      // Fallback to mock data on error
      setOrder(MOCK_ORDER_DETAILS);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  const refetch = useCallback(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId, fetchOrderDetails]);

  return {
    order,
    loading,
    error,
    refetch
  };
};

// ============== HOOK 3: useUpdateOrderStatus ==============
export interface UpdateStatusParams {
  orderId: string;
  status: Order['status'];
  notes?: string;
  trackingNumber?: string;
  courierName?: string;
}

export const useUpdateOrderStatus = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const updateOrderStatus = useCallback(async (
    params: UpdateStatusParams,
    optimisticUpdate?: (orderId: string, newStatus: Order['status']) => void
  ) => {
    const { orderId, status, notes, trackingNumber, courierName } = params;
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      // Perform optimistic update if callback provided
      if (optimisticUpdate) {
        optimisticUpdate(orderId, status);
      }

      // Check for demo mode
      const demoMode = localStorage.getItem('demoMode');
      if (demoMode === 'true') {
        // Simulate API call for demo
        setTimeout(() => {
          console.log('Demo: Updating order status', { orderId, status });
          setSuccess(true);
          setLoading(false);
        }, 1000);
        return;
      }

      // Real Supabase update
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (notes) {
        updateData.seller_notes = notes;
      }

      if (trackingNumber) {
        updateData.tracking_number = trackingNumber;
      }

      if (courierName) {
        updateData.courier_name = courierName;
      }

      // If status is delivered, set delivered_at
      if (status === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      }

      // If status is cancelled, set cancelled_at
      if (status === 'cancelled') {
        updateData.cancelled_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Create a notification for the customer
      const statusMessages = {
        accepted: 'Your order has been accepted',
        in_production: 'Your order is now in production',
        shipped: 'Your order has been shipped',
        delivered: 'Your order has been delivered',
        cancelled: 'Your order has been cancelled'
      };

      await supabase
        .from('notifications')
        .insert({
          user_id: 'customer_id_here', // Would get from order
          type: 'order_update',
          title: 'Order Status Updated',
          description: statusMessages[status] || 'Order status updated',
          related_id: orderId,
          related_type: 'order',
          status: 'unread',
          priority: status === 'shipped' || status === 'delivered' ? 'high' : 'medium',
          created_at: new Date().toISOString()
        });

      setSuccess(true);

    } catch (err: any) {
      console.error('Error updating order status:', err);
      setError(err.message || 'Failed to update order status');
      setSuccess(false);
      
      // If optimistic update was performed, we might want to revert it here
      // or show an error message to the user
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setSuccess(false);
  }, []);

  return {
    updateOrderStatus,
    loading,
    error,
    success,
    reset
  };
};

// ============== ADDITIONAL HOOK: useOrderStatistics ==============
export const useOrderStatistics = (sellerId: string) => {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    in_production: 0,
    shipped: 0,
    delivered: 0,
    revenue: 0,
    thisMonthRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check for demo mode
      const demoMode = localStorage.getItem('demoMode');
      if (demoMode === 'true') {
        // Mock data for demo
        setTimeout(() => {
          const mockStats = {
            total: 156,
            pending: 12,
            in_production: 15,
            shipped: 28,
            delivered: 98,
            revenue: 155500,
            thisMonthRevenue: 12500
          };
          setStats(mockStats);
          setLoading(false);
        }, 500);
        return;
      }

      // Real Supabase queries for statistics
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('status, total_amount, created_at')
        .eq('seller_id', sellerId);

      if (ordersError) {
        throw new Error(ordersError.message);
      }

      // Calculate statistics
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const statistics = {
        total: ordersData.length,
        pending: ordersData.filter(o => o.status === 'pending').length,
        in_production: ordersData.filter(o => o.status === 'in_production').length,
        shipped: ordersData.filter(o => o.status === 'shipped').length,
        delivered: ordersData.filter(o => o.status === 'delivered').length,
        revenue: ordersData.reduce((sum, order) => sum + (order.total_amount || 0), 0),
        thisMonthRevenue: ordersData
          .filter(order => order.created_at >= thisMonthStart)
          .reduce((sum, order) => sum + (order.total_amount || 0), 0)
      };

      setStats(statistics);

    } catch (err: any) {
      console.error('Error fetching order statistics:', err);
      setError(err.message || 'Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  }, [sellerId]);

  useEffect(() => {
    if (sellerId) {
      fetchStatistics();
    }
  }, [sellerId, fetchStatistics]);

  const refetch = useCallback(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  return {
    stats,
    loading,
    error,
    refetch
  };
};

// ============== ADDITIONAL HOOK: useBulkOrderActions ==============
export const useBulkOrderActions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const markOrdersAsShipped = useCallback(async (
    orderIds: string[],
    trackingNumber: string,
    courierName: string,
    optimisticUpdate?: (orderIds: string[]) => void
  ) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      // Perform optimistic update if callback provided
      if (optimisticUpdate) {
        optimisticUpdate(orderIds);
      }

      // Check for demo mode
      const demoMode = localStorage.getItem('demoMode');
      if (demoMode === 'true') {
        setTimeout(() => {
          console.log('Demo: Bulk shipping orders', { orderIds, trackingNumber, courierName });
          setSuccess(true);
          setLoading(false);
        }, 1000);
        return;
      }

      // Real Supabase bulk update
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'shipped',
          tracking_number: trackingNumber,
          courier_name: courierName,
          updated_at: new Date().toISOString()
        })
        .in('id', orderIds);

      if (updateError) {
        throw new Error(updateError.message);
      }

      setSuccess(true);

    } catch (err: any) {
      console.error('Error in bulk shipping:', err);
      setError(err.message || 'Failed to update orders');
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setSuccess(false);
  }, []);

  return {
    markOrdersAsShipped,
    loading,
    error,
    success,
    reset
  };
};

export default {
  useOrders,
  useOrderDetails,
  useUpdateOrderStatus,
  useOrderStatistics,
  useBulkOrderActions
};