import { useState, useEffect, useCallback } from 'react';
import { supabaseAdmin as supabase } from '../lib/supabase';

interface DashboardMetrics {
  totalRevenue: number;
  totalOrders: number;
  activeUsers: number;
  conversionRate: number;
  avgOrderValue: number;
}

interface ChartDataPoint {
  created_at: string;
  total_amount: number;
}

interface ActivityLog {
  id: string;
  user_type: string;
  user_id: string;
  action: string;
  details: any;
  created_at: string;
  ip_address?: string;
  user_agent?: string;
}

interface DashboardData {
  metrics: DashboardMetrics | null;
  chartData: ChartDataPoint[] | null;
  categoryDistribution: any | null;
  recentActivities: ActivityLog[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  fetchDashboardData: () => Promise<void>;
  logActivity: (activity: Omit<ActivityLog, 'id' | 'created_at'>) => Promise<void>;
}

export const useDashboardData = (): DashboardData => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[] | null>(null);
  const [categoryDistribution, setCategoryDistribution] = useState<any | null>(null);
  const [recentActivities, setRecentActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Fetching dashboard data...');

      // Set timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout after 15 seconds')), 15000);
      });

      // Fetch critical data in parallel
      const criticalPromises = Promise.all([
        // Fetch delivered orders for revenue
        supabase
          .from('orders')
          .select('total_amount, status')
          .eq('status', 'delivered')
          .then(({ data, error }) => {
            if (error) throw new Error(`Orders: ${error.message}`);
            return data || [];
          }),

        // Fetch user count
        supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .then(({ count, error }) => {
            if (error) throw new Error(`Users: ${error.message}`);
            return count || 0;
          }),

        // Fetch total orders count
        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .then(({ count, error }) => {
            if (error) throw new Error(`Order count: ${error.message}`);
            return count || 0;
          }),
      ]);

      const [deliveredOrders, userCount, orderCount] = await Promise.race([
        criticalPromises,
        timeoutPromise
      ]) as [any[], number, number];

      console.log('📊 Orders loaded:', deliveredOrders.length);
      console.log('👥 Users count:', userCount);
      console.log('📦 Order count:', orderCount);

      // Calculate metrics
      const totalRevenue = deliveredOrders.reduce((sum: number, order: any) => 
        sum + (Number(order.total_amount) || 0), 0);

      const calculatedMetrics = {
        totalRevenue,
        totalOrders: orderCount,
        activeUsers: userCount,
        conversionRate: userCount > 0 ? (orderCount / userCount) * 100 : 0,
        avgOrderValue: orderCount > 0 ? totalRevenue / orderCount : 0,
      };

      setMetrics(calculatedMetrics);
      console.log('✅ Metrics calculated:', calculatedMetrics);

      // Fetch chart data (non-critical)
      try {
        const { data: chartData, error: chartError } = await supabase
          .from('orders')
          .select('created_at, total_amount')
          .order('created_at', { ascending: true })
          .limit(30);

        if (!chartError && chartData) {
          const formattedChartData = chartData.map(item => ({
            created_at: item.created_at,
            total_amount: Number(item.total_amount) || 0
          }));
          setChartData(formattedChartData);
          console.log('📈 Chart data loaded:', formattedChartData.length, 'records');
        } else {
          console.warn('⚠️ Chart data error:', chartError?.message);
        }
      } catch (chartErr) {
        console.warn('⚠️ Chart data fetch failed:', chartErr);
      }

      // Fetch recent activities (non-critical)
      try {
        const { data: activities, error: activitiesError } = await supabase
          .from('activity_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (!activitiesError) {
          setRecentActivities(activities || []);
          console.log('📝 Activities loaded:', activities?.length || 0, 'records');
        } else {
          console.warn('⚠️ Activities error:', activitiesError.message);
        }
      } catch (activitiesErr) {
        console.warn('⚠️ Activities fetch failed:', activitiesErr);
      }

      // Fetch category distribution (non-critical)
      try {
        const { data: distribution, error: distError } = await supabase
          .from('products')
          .select('category')
          .eq('approval_status', 'approved');

        if (!distError && distribution) {
          const categoryCount: Record<string, number> = {};
          distribution.forEach((item: any) => {
            if (item.category) {
              categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
            }
          });
          setCategoryDistribution(categoryCount);
          console.log('📊 Category distribution loaded');
        }
      } catch (distErr) {
        console.warn('⚠️ Category distribution fetch failed:', distErr);
      }

    } catch (err: any) {
      console.error('❌ Error fetching dashboard data:', err);
      const errorMessage = err.message || 'Failed to fetch dashboard data. Please check your database connection.';
      setError(errorMessage);
      
      // Set fallback data for development
      setMetrics({
        totalRevenue: 0,
        totalOrders: 0,
        activeUsers: 0,
        conversionRate: 0,
        avgOrderValue: 0,
      });
    } finally {
      setLoading(false);
      console.log('🏁 Dashboard data fetch completed');
    }
  }, []);

  const logActivity = useCallback(async (activity: Omit<ActivityLog, 'id' | 'created_at'>) => {
    try {
      console.log('📝 Logging activity:', activity);
      
      const activityWithTimestamp = {
        ...activity,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('activity_logs')
        .insert(activityWithTimestamp);

      if (error) {
        console.error('❌ Error logging activity:', error);
        throw error;
      }
      console.log('✅ Activity logged successfully');
      
      // Refresh recent activities
      const { data: activities } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (activities) {
        setRecentActivities(activities);
      }
    } catch (err: any) {
      console.error('❌ Error logging activity:', err);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const refresh = useCallback(async () => {
    console.log('🔄 Refreshing dashboard data...');
    await fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    metrics,
    chartData,
    categoryDistribution,
    recentActivities,
    loading,
    error,
    refresh,
    fetchDashboardData,
    logActivity,
  };
};