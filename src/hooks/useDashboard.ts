import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  activeOrders: number;
  averageRating: number;
  recentOrders: any[];
  topProducts: any[];
}

export const useDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    activeOrders: 0,
    averageRating: 4.5,
    recentOrders: [],
    topProducts: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is authenticated
      if (!user?.id) {
        console.log('No user ID available for dashboard');
        setLoading(false);
        return;
      }

      // Check demo mode
      const isDemoMode = localStorage.getItem('demoMode') === 'seller';
      
      if (isDemoMode) {
        // Demo data
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const demoStats: DashboardStats = {
          totalProducts: 24,
          totalOrders: 156,
          totalRevenue: 154850,
          pendingOrders: 12,
          activeOrders: 15,
          averageRating: 4.8,
          recentOrders: [
            { id: '1', order_number: 'ORD-7894', customer_name: 'Ahmed Al-Mansoor', total: 2450, status: 'processing' },
            { id: '2', order_number: 'ORD-7893', customer_name: 'Sarah Johnson', total: 1890, status: 'shipped' }
          ],
          topProducts: [
            { id: '1', name: 'Executive Office Chair', sales: 87, revenue: 43500 },
            { id: '2', name: 'Luxury Leather Sofa', sales: 65, revenue: 81250 }
          ]
        };
        
        setStats(demoStats);
        return;
      }

      console.log('Fetching dashboard data for seller ID:', user.id);
      
      // REAL DATA: Fetch all stats in parallel
      const [
        productsPromise,
        ordersPromise,
        revenuePromise,
        recentOrdersPromise
      ] = await Promise.all([
        // Total Products
        supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('seller_id', user.id),
        
        // Total Orders
        supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('seller_id', user.id),
        
        // Total Revenue (from completed orders)
        supabase
          .from('orders')
          .select('total_amount')
          .eq('seller_id', user.id)
          .eq('status', 'completed'),
        
        // Recent Orders (last 5)
        supabase
          .from('orders')
          .select(`
            id,
            order_number,
            total_amount,
            status,
            created_at,
            profiles!orders_customer_id_fkey(full_name)
          `)
          .eq('seller_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      // Process results
      const totalProducts = productsPromise.count || 0;
      const totalOrders = ordersPromise.count || 0;
      
      // Calculate revenue
      const revenueData = revenuePromise.data || [];
      const totalRevenue = revenueData.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      
      // Process recent orders
      const recentOrders = (recentOrdersPromise.data || []).map(order => ({
        id: order.id,
        order_number: order.order_number,
        customer_name: (order.profiles as any)?.full_name || 'Unknown',
        total: order.total_amount,
        status: order.status,
        created_at: order.created_at
      }));

      // Get pending and active orders
      const { count: pendingOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', user.id)
        .eq('status', 'pending');

      const { count: activeOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', user.id)
        .in('status', ['processing', 'shipped']);

      // Get top products
      const { data: topProductsData } = await supabase
        .from('order_items')
        .select(`
          quantity,
          unit_price,
          products!inner(id, name, seller_id)
        `)
        .eq('products.seller_id', user.id)
        .limit(5);

      const topProducts = (topProductsData || []).map(item => ({
        id: (item.products as any)?.id,
        name: (item.products as any)?.name || 'Unknown',
        sales: item.quantity,
        revenue: item.quantity * item.unit_price
      }));

      const dashboardStats: DashboardStats = {
        totalProducts,
        totalOrders,
        totalRevenue,
        pendingOrders: pendingOrders || 0,
        activeOrders: activeOrders || 0,
        averageRating: 4.5, // Would need reviews data
        recentOrders,
        topProducts
      };

      console.log('Dashboard stats loaded:', dashboardStats);
      setStats(dashboardStats);
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      
      // Fallback to demo data on error
      const fallbackStats: DashboardStats = {
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        activeOrders: 0,
        averageRating: 4.5,
        recentOrders: [],
        topProducts: []
      };
      setStats(fallbackStats);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const reload = useCallback(async () => {
    await fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user?.id, fetchDashboardData]);

  return {
    stats,
    loading,
    error,
    reload
  };
};