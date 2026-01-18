import { useState, useEffect, useCallback } from 'react';
import { ordersApi, Order, OrderStats, OrderFilters } from '@/api/orders';
import { useDashboardData } from '../hooks/useDashboardData'; // adjust relative path
import { supabaseAdmin as supabase } from '../lib/supabase';
import { supabase } from '@/lib/supabase';


interface UseOrdersReturn {
  // Data
  orders: Order[];
  orderStats: OrderStats | null;
  selectedOrder: Order | null;
  recentOrders: Order[];
  
  // States
  loading: boolean;
  loadingAction: boolean;
  error: string | null;
  
  // Actions
  fetchOrders: (filters?: OrderFilters, limit?: number, offset?: number) => Promise<{ data: Order[]; count: number }>;
  fetchOrderStats: () => Promise<void>;
  getOrderById: (orderId: string) => Promise<Order | null>;
  getOrderByNumber: (orderNumber: string) => Promise<Order | null>;
  updateOrderStatus: (orderId: string, status: Order['status'], notes?: string) => Promise<{ success: boolean; data?: Order; error?: string }>;
  updatePaymentStatus: (orderId: string, paymentStatus: Order['payment_status'], paymentDetails?: any) => Promise<{ success: boolean; data?: Order; error?: string }>;
  updateShippingInfo: (orderId: string, shippingInfo: any) => Promise<{ success: boolean; data?: Order; error?: string }>;
  processRefund: (orderId: string, refundData: any) => Promise<{ success: boolean; data?: Order; error?: string }>;
  cancelOrder: (orderId: string, reason: string) => Promise<{ success: boolean; data?: Order; error?: string }>;
  getRecentOrders: (limit?: number) => Promise<Order[]>;
  setSelectedOrder: (order: Order | null) => void;
}

export const useOrders = (): UseOrdersReturn => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get admin ID from auth context
  const getAdminId = () => {
    return 'admin-user-id'; // Replace with actual auth context
  };

  // Fetch orders with optional filters
  const fetchOrders = useCallback(async (filters?: OrderFilters, limit?: number, offset?: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await ordersApi.getAllOrders(filters, limit, offset);
      setOrders(result.data);
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch orders';
      setError(errorMsg);
      console.error('Error fetching orders:', err);
      return { data: [], count: 0 };
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch order statistics
  const fetchOrderStats = useCallback(async () => {
    try {
      const stats = await ordersApi.getOrderStats();
      setOrderStats(stats);
    } catch (err) {
      console.error('Error fetching order stats:', err);
    }
  }, []);

  // Get single order by ID
  const getOrderById = useCallback(async (orderId: string): Promise<Order | null> => {
    try {
      setLoadingAction(true);
      const order = await ordersApi.getOrderById(orderId);
      return order;
    } catch (err) {
      console.error('Error fetching order:', err);
      return null;
    } finally {
      setLoadingAction(false);
    }
  }, []);

  // Get order by order number
  const getOrderByNumber = useCallback(async (orderNumber: string): Promise<Order | null> => {
    try {
      setLoadingAction(true);
      const order = await ordersApi.getOrderByNumber(orderNumber);
      return order;
    } catch (err) {
      console.error('Error fetching order:', err);
      return null;
    } finally {
      setLoadingAction(false);
    }
  }, []);

  // Update order status action
  const updateOrderStatus = useCallback(async (orderId: string, status: Order['status'], notes?: string) => {
    try {
      setLoadingAction(true);
      const adminId = getAdminId();
      const data = await ordersApi.updateOrderStatus(orderId, status, adminId, notes);
      
      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === orderId ? data : order
      ));
      
      await fetchOrderStats(); // Refresh stats
      
      return { success: true, data };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update order status';
      return { success: false, error: errorMsg };
    } finally {
      setLoadingAction(false);
    }
  }, [fetchOrderStats]);

  // Update payment status action
  const updatePaymentStatus = useCallback(async (orderId: string, paymentStatus: Order['payment_status'], paymentDetails?: any) => {
    try {
      setLoadingAction(true);
      const adminId = getAdminId();
      const data = await ordersApi.updatePaymentStatus(orderId, paymentStatus, adminId, paymentDetails);
      
      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === orderId ? data : order
      ));
      
      await fetchOrderStats(); // Refresh stats
      
      return { success: true, data };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update payment status';
      return { success: false, error: errorMsg };
    } finally {
      setLoadingAction(false);
    }
  }, [fetchOrderStats]);

  // Update shipping info action
  const updateShippingInfo = useCallback(async (orderId: string, shippingInfo: any) => {
    try {
      setLoadingAction(true);
      const adminId = getAdminId();
      const data = await ordersApi.updateShippingInfo(orderId, shippingInfo, adminId);
      
      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === orderId ? data : order
      ));
      
      return { success: true, data };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update shipping info';
      return { success: false, error: errorMsg };
    } finally {
      setLoadingAction(false);
    }
  }, []);

  // Process refund action
  const processRefund = useCallback(async (orderId: string, refundData: any) => {
    try {
      setLoadingAction(true);
      const adminId = getAdminId();
      const data = await ordersApi.processRefund(orderId, refundData, adminId);
      
      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === orderId ? data : order
      ));
      
      await fetchOrderStats(); // Refresh stats
      
      return { success: true, data };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to process refund';
      return { success: false, error: errorMsg };
    } finally {
      setLoadingAction(false);
    }
  }, [fetchOrderStats]);

  // Cancel order action
  const cancelOrder = useCallback(async (orderId: string, reason: string) => {
    try {
      setLoadingAction(true);
      const adminId = getAdminId();
      const data = await ordersApi.cancelOrder(orderId, reason, adminId);
      
      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === orderId ? data : order
      ));
      
      await fetchOrderStats(); // Refresh stats
      
      return { success: true, data };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to cancel order';
      return { success: false, error: errorMsg };
    } finally {
      setLoadingAction(false);
    }
  }, [fetchOrderStats]);

  // Get recent orders
  const getRecentOrders = useCallback(async (limit: number = 10) => {
    try {
      const recent = await ordersApi.getRecentOrders(limit);
      setRecentOrders(recent);
      return recent;
    } catch (err) {
      console.error('Error fetching recent orders:', err);
      return [];
    }
  }, []);

  // Initialize data
  useEffect(() => {
    const initData = async () => {
      await Promise.all([
        fetchOrders(),
        fetchOrderStats(),
        getRecentOrders(5),
      ]);
    };

    initData();

    // Set up real-time subscription for orders
    const { supabase } = require('@/lib/supabase');
    
    const ordersChannel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders' }, 
        () => {
          fetchOrders();
          fetchOrderStats();
          getRecentOrders(5);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
    };
  }, [fetchOrders, fetchOrderStats, getRecentOrders]);

  return {
    orders,
    orderStats,
    selectedOrder,
    recentOrders,
    loading,
    loadingAction,
    error,
    fetchOrders,
    fetchOrderStats,
    getOrderById,
    getOrderByNumber,
    updateOrderStatus,
    updatePaymentStatus,
    updateShippingInfo,
    processRefund,
    cancelOrder,
    getRecentOrders,
    setSelectedOrder,
  };
};