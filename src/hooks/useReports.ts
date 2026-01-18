// src/hooks/useReports.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { useAuth } from '../contexts/AuthContext'; // ADD THIS

// ==================== TYPE DEFINITIONS ====================

export interface ReportsSummary {
  total_orders: number;
  total_revenue: number;
  average_order_value: number;
  total_products_sold: number;
  conversion_rate?: number;
  refund_rate?: number;
  customer_count: number;
  repeat_customer_rate?: number;
}

export interface SalesTrendPoint {
  date: string;
  revenue: number;
  orders_count: number;
  average_order_value: number;
  day_of_week?: number;
  week_number?: number;
  month?: number;
}

export interface TopProduct {
  product_id: string;
  name: string;
  sku?: string;
  category?: string;
  total_sold: number;
  revenue: number;
  average_price: number;
  stock_quantity: number;
  image_url?: string;
  rating?: number;
  status: 'active' | 'inactive';
}

export interface OrderStatusStat {
  status: string;
  count: number;
  percentage: number;
  revenue: number;
}

export interface InventoryHealth {
  product_id: string;
  name: string;
  sku?: string;
  category?: string;
  current_stock: number;
  minimum_stock: number;
  status: 'healthy' | 'low_stock' | 'out_of_stock' | 'overstock';
  days_of_supply?: number;
  monthly_sales_avg: number;
  last_restocked?: string;
  restock_urgency: 'low' | 'medium' | 'high' | 'critical';
}

export interface CategoryPerformance {
  category: string;
  revenue: number;
  units_sold: number;
  average_price: number;
  product_count: number;
  growth_rate?: number;
}

export interface TimePeriod {
  startDate: string;
  endDate: string;
  label: string;
  granularity: 'daily' | 'weekly' | 'monthly';
}

// ==================== UTILITY FUNCTIONS ====================

const formatDateForQuery = (date: string | Date): string => {
  return new Date(date).toISOString();
};

const calculatePercentage = (part: number, total: number): number => {
  return total > 0 ? Math.round((part / total) * 100) : 0;
};

const getDefaultTimePeriod = (): TimePeriod => {
  const endDate = new Date();
  const startDate = subDays(endDate, 30);
  
  return {
    startDate: formatDateForQuery(startDate),
    endDate: formatDateForQuery(endDate),
    label: 'Last 30 Days',
    granularity: 'daily'
  };
};

// ==================== MAIN ANALYTICS HOOK ====================

export const useReports = (sellerId?: string, timePeriod?: TimePeriod) => {
  const { user } = useAuth();
  const effectiveSellerId = sellerId || user?.id;
  
  const [summary, setSummary] = useState<ReportsSummary | null>(null);
  const [salesTrend, setSalesTrend] = useState<SalesTrendPoint[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [orderStatus, setOrderStatus] = useState<OrderStatusStat[]>([]);
  const [inventoryHealth, setInventoryHealth] = useState<InventoryHealth[]>([]);
  const [categories, setCategories] = useState<CategoryPerformance[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const period = timePeriod || getDefaultTimePeriod();

  const refreshAllData = useCallback(async () => {
    // CRITICAL FIX: Check demo mode
    const isDemoMode = localStorage.getItem('demoMode') === 'seller';
    
    if (!effectiveSellerId && !isDemoMode) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isDemoMode || !effectiveSellerId) {
        // Use mock data for demo
        setTimeout(() => {
          setSummary(getMockReportsSummary());
          setSalesTrend(getMockSalesTrend());
          setTopProducts(getMockTopProducts());
          setOrderStatus(getMockOrderStatus());
          setInventoryHealth(getMockInventoryHealth());
          setCategories([]);
          setLastUpdated(new Date());
          setLoading(false);
        }, 1000);
        return;
      }

      await Promise.all([
        fetchSummary(),
        fetchSalesTrend(),
        fetchTopProducts(),
        fetchOrderStatus(),
        fetchInventoryHealth(),
        fetchCategoryPerformance()
      ]);
      
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [effectiveSellerId, period]);

  // Add reload function
  const reload = useCallback(async () => {
    await refreshAllData();
  }, [refreshAllData]);

  // Add generateReport function for SellerDashboard
  const generateReport = useCallback(async (type: string) => {
    return Promise.resolve();
  }, []);

  // Initialize with empty reports array
  const reports: any[] = [];

  // Fetch high-level summary
  const fetchSummary = async () => {
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('id, total_amount, status, buyer_id, created_at')
        .eq('seller_id', effectiveSellerId)
        .gte('created_at', period.startDate)
        .lte('created_at', period.endDate)
        .in('status', ['completed', 'delivered', 'shipped', 'processing']);

      if (ordersError) throw ordersError;

      const { data: orderItemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('quantity, price, order_id')
        .in('order_id', ordersData?.map(o => o.id) || []);

      if (itemsError) throw itemsError;

      const { data: customerData, error: customerError } = await supabase
        .from('orders')
        .select('buyer_id')
        .eq('seller_id', effectiveSellerId)
        .gte('created_at', period.startDate)
        .lte('created_at', period.endDate);

      if (customerError) throw customerError;

      // Calculate metrics
      const totalOrders = ordersData?.length || 0;
      const totalRevenue = ordersData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      const totalProductsSold = orderItemsData?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      
      const uniqueCustomers = new Set(customerData?.map(c => c.buyer_id).filter(Boolean)).size;
      
      // Calculate repeat customer rate
      const customerOrderCounts: Record<string, number> = {};
      customerData?.forEach(order => {
        if (order.buyer_id) {
          customerOrderCounts[order.buyer_id] = (customerOrderCounts[order.buyer_id] || 0) + 1;
        }
      });
      
      const repeatCustomers = Object.values(customerOrderCounts).filter(count => count > 1).length;
      const repeatCustomerRate = uniqueCustomers > 0 ? (repeatCustomers / uniqueCustomers) * 100 : 0;

      const summaryData: ReportsSummary = {
        total_orders: totalOrders,
        total_revenue: Math.round(totalRevenue),
        average_order_value: Math.round(averageOrderValue),
        total_products_sold: totalProductsSold,
        customer_count: uniqueCustomers,
        repeat_customer_rate: Math.round(repeatCustomerRate),
        conversion_rate: 0,
        refund_rate: 0,
      };

      setSummary(summaryData);
    } catch (err) {
      console.error('Error fetching summary:', err);
      throw err;
    }
  };

  // Fetch sales trend data
  const fetchSalesTrend = async () => {
    try {
      let query = supabase
        .from('orders')
        .select('id, total_amount, created_at, status')
        .eq('seller_id', effectiveSellerId)
        .gte('created_at', period.startDate)
        .lte('created_at', period.endDate)
        .in('status', ['completed', 'delivered', 'shipped']);

      // Adjust granularity based on time period
      if (period.granularity === 'weekly') {
        // Group by week
        const { data, error } = await query;
        if (error) throw error;

        const weeklyData: Record<string, SalesTrendPoint> = {};
        
        data?.forEach(order => {
          const weekStart = format(new Date(order.created_at), 'yyyy-MM-dd');
          if (!weeklyData[weekStart]) {
            weeklyData[weekStart] = {
              date: weekStart,
              revenue: 0,
              orders_count: 0,
              average_order_value: 0,
              week_number: Math.ceil(new Date(order.created_at).getDate() / 7)
            };
          }
          
          weeklyData[weekStart].revenue += order.total_amount || 0;
          weeklyData[weekStart].orders_count += 1;
        });

        // Calculate averages
        const trendData = Object.values(weeklyData).map(point => ({
          ...point,
          average_order_value: point.orders_count > 0 ? point.revenue / point.orders_count : 0
        })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        setSalesTrend(trendData);
      } else {
        // Daily or monthly granularity
        const { data, error } = await query;
        if (error) throw error;

        const dailyData: Record<string, SalesTrendPoint> = {};
        
        data?.forEach(order => {
          const dateKey = format(new Date(order.created_at), 'yyyy-MM-dd');
          if (!dailyData[dateKey]) {
            dailyData[dateKey] = {
              date: dateKey,
              revenue: 0,
              orders_count: 0,
              average_order_value: 0,
              day_of_week: new Date(order.created_at).getDay()
            };
          }
          
          dailyData[dateKey].revenue += order.total_amount || 0;
          dailyData[dateKey].orders_count += 1;
        });

        // Calculate averages and fill missing dates
        const allDates = [];
        const currentDate = new Date(period.startDate);
        const endDate = new Date(period.endDate);
        
        while (currentDate <= endDate) {
          const dateKey = format(currentDate, 'yyyy-MM-dd');
          if (!dailyData[dateKey]) {
            dailyData[dateKey] = {
              date: dateKey,
              revenue: 0,
              orders_count: 0,
              average_order_value: 0,
              day_of_week: currentDate.getDay()
            };
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }

        const trendData = Object.values(dailyData)
          .map(point => ({
            ...point,
            average_order_value: point.orders_count > 0 ? point.revenue / point.orders_count : 0
          }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        setSalesTrend(trendData);
      }
    } catch (err) {
      console.error('Error fetching sales trend:', err);
      throw err;
    }
  };

  // Fetch top products
  const fetchTopProducts = async (limit: number = 10) => {
    try {
      const { data: orderItemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('product_id, quantity, price, product:products(*)')
        .eq('order.seller_id', effectiveSellerId)
        .gte('order.created_at', period.startDate)
        .lte('order.created_at', period.endDate)
        .order('quantity', { ascending: false })
        .limit(limit);

      if (itemsError) throw itemsError;

      // Group by product
      const productMap: Record<string, TopProduct> = {};
      
      orderItemsData?.forEach(item => {
        const product = item.product as any;
        if (!product) return;

        if (!productMap[product.id]) {
          productMap[product.id] = {
            product_id: product.id,
            name: product.name,
            sku: product.sku,
            category: product.category,
            total_sold: 0,
            revenue: 0,
            average_price: 0,
            stock_quantity: product.stock_quantity || 0,
            image_url: product.images?.[0],
            rating: product.average_rating,
            status: product.status || 'active'
          };
        }

        productMap[product.id].total_sold += item.quantity || 0;
        productMap[product.id].revenue += (item.quantity || 0) * (item.price || 0);
      });

      // Calculate average prices
      Object.keys(productMap).forEach(productId => {
        const product = productMap[productId];
        product.average_price = product.total_sold > 0 ? product.revenue / product.total_sold : 0;
      });

      const topProductsData = Object.values(productMap)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, limit);

      setTopProducts(topProductsData);
    } catch (err) {
      console.error('Error fetching top products:', err);
      throw err;
    }
  };

  // Fetch order status breakdown
  const fetchOrderStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('status, total_amount, created_at')
        .eq('seller_id', effectiveSellerId)
        .gte('created_at', period.startDate)
        .lte('created_at', period.endDate);

      if (error) throw error;

      // Group by status
      const statusMap: Record<string, OrderStatusStat> = {};
      let totalOrders = 0;
      let totalRevenue = 0;

      data?.forEach(order => {
        if (!statusMap[order.status]) {
          statusMap[order.status] = {
            status: order.status,
            count: 0,
            percentage: 0,
            revenue: 0
          };
        }

        statusMap[order.status].count += 1;
        statusMap[order.status].revenue += order.total_amount || 0;
        totalOrders += 1;
        totalRevenue += order.total_amount || 0;
      });

      // Calculate percentages
      Object.keys(statusMap).forEach(status => {
        statusMap[status].percentage = calculatePercentage(statusMap[status].count, totalOrders);
      });

      const statusData = Object.values(statusMap).sort((a, b) => b.count - a.count);
      setOrderStatus(statusData);
    } catch (err) {
      console.error('Error fetching order status:', err);
      throw err;
    }
  };

  // Fetch inventory health
  const fetchInventoryHealth = async () => {
    try {
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, sku, category, stock_quantity, minimum_stock, status, images, created_at')
        .eq('seller_id', effectiveSellerId)
        .eq('status', 'active')
        .order('stock_quantity', { ascending: true });

      if (productsError) throw productsError;

      // Get sales data for each product
      const { data: salesData, error: salesError } = await supabase
        .from('order_items')
        .select('product_id, quantity, created_at')
        .gte('created_at', formatDateForQuery(subDays(new Date(), 90)))
        .in('product_id', productsData?.map(p => p.id) || []);

      if (salesError) throw salesError;

      // Calculate monthly sales average
      const salesByProduct: Record<string, number> = {};
      salesData?.forEach(sale => {
        salesByProduct[sale.product_id] = (salesByProduct[sale.product_id] || 0) + (sale.quantity || 0);
      });

      const healthData: InventoryHealth[] = productsData?.map(product => {
        const monthlySales = (salesByProduct[product.id] || 0) / 3; // Average over 90 days
        const daysOfSupply = product.stock_quantity > 0 && monthlySales > 0 
          ? Math.round(product.stock_quantity / (monthlySales / 30))
          : 999;

        let status: InventoryHealth['status'] = 'healthy';
        let restockUrgency: InventoryHealth['restock_urgency'] = 'low';

        if (product.stock_quantity <= 0) {
          status = 'out_of_stock';
          restockUrgency = 'critical';
        } else if (product.stock_quantity <= (product.minimum_stock || 5)) {
          status = 'low_stock';
          restockUrgency = monthlySales > 0 ? 'high' : 'medium';
        } else if (product.stock_quantity > 100 && monthlySales < 10) {
          status = 'overstock';
          restockUrgency = 'low';
        }

        // Adjust urgency based on sales velocity
        if (status === 'low_stock' && monthlySales > 50) {
          restockUrgency = 'critical';
        }

        return {
          product_id: product.id,
          name: product.name,
          sku: product.sku,
          category: product.category,
          current_stock: product.stock_quantity,
          minimum_stock: product.minimum_stock || 5,
          status,
          days_of_supply: daysOfSupply,
          monthly_sales_avg: Math.round(monthlySales),
          last_restocked: product.created_at,
          restock_urgency: restockUrgency
        };
      }) || [];

      setInventoryHealth(healthData.sort((a, b) => {
        const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return urgencyOrder[a.restock_urgency] - urgencyOrder[b.restock_urgency];
      }));
    } catch (err) {
      console.error('Error fetching inventory health:', err);
      throw err;
    }
  };

  // Fetch category performance
  const fetchCategoryPerformance = async () => {
    try {
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, category, name')
        .eq('seller_id', effectiveSellerId);

      if (productsError) throw productsError;

      const { data: salesData, error: salesError } = await supabase
        .from('order_items')
        .select('product_id, quantity, price, product:products(category)')
        .eq('order.seller_id', effectiveSellerId)
        .gte('order.created_at', period.startDate)
        .lte('order.created_at', period.endDate);

      if (salesError) throw salesError;

      // Group by category
      const categoryMap: Record<string, CategoryPerformance> = {};
      
      // Initialize with all categories
      productsData?.forEach(product => {
        if (product.category && !categoryMap[product.category]) {
          categoryMap[product.category] = {
            category: product.category,
            revenue: 0,
            units_sold: 0,
            average_price: 0,
            product_count: 0,
            growth_rate: 0
          };
        }
      });

      // Count products per category
      productsData?.forEach(product => {
        if (product.category) {
          categoryMap[product.category].product_count += 1;
        }
      });

      // Add sales data
      salesData?.forEach(sale => {
        const product = sale.product as any;
        if (product?.category && categoryMap[product.category]) {
          categoryMap[product.category].units_sold += sale.quantity || 0;
          categoryMap[product.category].revenue += (sale.quantity || 0) * (sale.price || 0);
        }
      });

      // Calculate averages
      Object.keys(categoryMap).forEach(category => {
        const cat = categoryMap[category];
        cat.average_price = cat.units_sold > 0 ? cat.revenue / cat.units_sold : 0;
      });

      const categoryData = Object.values(categoryMap)
        .filter(cat => cat.units_sold > 0)
        .sort((a, b) => b.revenue - a.revenue);

      setCategories(categoryData);
    } catch (err) {
      console.error('Error fetching category performance:', err);
      throw err;
    }
  };

  useEffect(() => {
    const isDemoMode = localStorage.getItem('demoMode') === 'seller';
    if (effectiveSellerId || isDemoMode) {
      refreshAllData();
    } else {
      setLoading(false);
    }
  }, [effectiveSellerId, refreshAllData]);

  // Export data function
  const exportData = useCallback(async (format: 'csv' | 'json' = 'json') => {
    try {
      const exportPayload = {
        summary,
        salesTrend,
        topProducts,
        orderStatus,
        inventoryHealth,
        categories,
        generated_at: new Date().toISOString(),
        period,
        seller_id: effectiveSellerId
      };

      if (format === 'csv') {
        // Basic CSV export implementation
        const csvContent = [
          ['Metric', 'Value'],
          ['Total Orders', summary?.total_orders],
          ['Total Revenue', summary?.total_revenue],
          ['Average Order Value', summary?.average_order_value],
          ['Total Products Sold', summary?.total_products_sold],
          ['Unique Customers', summary?.customer_count]
        ].map(row => row.join(',')).join('\n');

        return csvContent;
      }

      return JSON.stringify(exportPayload, null, 2);
    } catch (err) {
      console.error('Export error:', err);
      throw err;
    }
  }, [summary, salesTrend, topProducts, orderStatus, inventoryHealth, categories, period, effectiveSellerId]);

  return {
    // Data
    summary,
    salesTrend,
    topProducts,
    orderStatus,
    inventoryHealth,
    categories,
    reports,
    
    // State
    loading,
    error,
    lastUpdated,
    
    // Actions
    refreshAllData,
    exportData,
    reload,
    generateReport,
    
    // Individual fetch functions (for on-demand loading)
    fetchSummary: async () => {},
    fetchSalesTrend: async () => {},
    fetchTopProducts: async () => {},
    fetchOrderStatus: async () => {},
    fetchInventoryHealth: async () => {},
    fetchCategoryPerformance: async () => {},
    
    // Helper data
    period,
    sellerId: effectiveSellerId
  };
};

// ==================== INDIVIDUAL HOOKS ====================

export const useReportsSummary = (sellerId: string, startDate: string, endDate: string) => {
  const [data, setData] = useState<ReportsSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!sellerId) return;
      
      setLoading(true);
      try {
        // Use RPC for complex aggregation
        const { data: summaryData, error: summaryError } = await supabase
          .rpc('get_seller_summary', {
            p_seller_id: sellerId,
            p_start_date: startDate,
            p_end_date: endDate
          });

        if (summaryError) throw summaryError;

        // Fallback to manual calculation if RPC not available
        if (!summaryData) {
          const { data: ordersData, error: ordersError } = await supabase
            .from('orders')
            .select('id, total_amount, status, buyer_id')
            .eq('seller_id', sellerId)
            .gte('created_at', startDate)
            .lte('created_at', endDate)
            .in('status', ['completed', 'delivered']);

          if (ordersError) throw ordersError;

          const totalOrders = ordersData?.length || 0;
          const totalRevenue = ordersData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
          const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
          const uniqueCustomers = new Set(ordersData?.map(o => o.buyer_id).filter(Boolean)).size;

          setData({
            total_orders: totalOrders,
            total_revenue: Math.round(totalRevenue),
            average_order_value: Math.round(averageOrderValue),
            total_products_sold: 0,
            customer_count: uniqueCustomers,
            repeat_customer_rate: 0,
            conversion_rate: 0,
            refund_rate: 0
          });
        } else {
          setData(summaryData[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch summary');
        console.error('Error in useReportsSummary:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sellerId, startDate, endDate]);

  return { data, loading, error };
};

export const useSalesTrend = (sellerId: string, startDate: string, endDate: string) => {
  const [data, setData] = useState<SalesTrendPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!sellerId) return;
      
      setLoading(true);
      try {
        // Use RPC for date-based aggregation
        const { data: trendData, error: trendError } = await supabase
          .rpc('get_sales_trend', {
            p_seller_id: sellerId,
            p_start_date: startDate,
            p_end_date: endDate,
            p_granularity: 'daily'
          });

        if (trendError) {
          // Fallback to manual aggregation
          const { data: ordersData, error: ordersError } = await supabase
            .from('orders')
            .select('id, total_amount, created_at')
            .eq('seller_id', sellerId)
            .gte('created_at', startDate)
            .lte('created_at', endDate)
            .in('status', ['completed', 'delivered']);

          if (ordersError) throw ordersError;

          const dailyData: Record<string, SalesTrendPoint> = {};
          
          ordersData?.forEach(order => {
            const dateKey = format(new Date(order.created_at), 'yyyy-MM-dd');
            if (!dailyData[dateKey]) {
              dailyData[dateKey] = {
                date: dateKey,
                revenue: 0,
                orders_count: 0,
                average_order_value: 0
              };
            }
            
            dailyData[dateKey].revenue += order.total_amount || 0;
            dailyData[dateKey].orders_count += 1;
          });

          // Calculate averages
          const trendPoints = Object.values(dailyData).map(point => ({
            ...point,
            average_order_value: point.orders_count > 0 ? point.revenue / point.orders_count : 0
          })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

          setData(trendPoints);
        } else {
          setData(trendData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch sales trend');
        console.error('Error in useSalesTrend:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sellerId, startDate, endDate]);

  return { data, loading, error };
};

export const useTopProducts = (sellerId: string, limit: number = 10) => {
  const [data, setData] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!sellerId) return;
      
      setLoading(true);
      try {
        // Use RPC for product performance
        const { data: topProductsData, error: productsError } = await supabase
          .rpc('get_top_products', {
            p_seller_id: sellerId,
            p_limit: limit,
            p_days: 30
          });

        if (productsError) {
          // Fallback to manual query
          const { data: orderItemsData, error: itemsError } = await supabase
            .from('order_items')
            .select('product_id, quantity, price, product:products(*)')
            .eq('order.seller_id', sellerId)
            .gte('order.created_at', formatDateForQuery(subDays(new Date(), 30)))
            .lte('order.created_at', formatDateForQuery(new Date()))
            .order('quantity', { ascending: false })
            .limit(limit);

          if (itemsError) throw itemsError;

          const productMap: Record<string, TopProduct> = {};
          
          orderItemsData?.forEach(item => {
            const product = item.product as any;
            if (!product) return;

            if (!productMap[product.id]) {
              productMap[product.id] = {
                product_id: product.id,
                name: product.name,
                total_sold: 0,
                revenue: 0,
                average_price: 0,
                stock_quantity: product.stock_quantity || 0,
                status: 'active'
              };
            }

            productMap[product.id].total_sold += item.quantity || 0;
            productMap[product.id].revenue += (item.quantity || 0) * (item.price || 0);
          });

          // Calculate averages
          Object.keys(productMap).forEach(productId => {
            const product = productMap[productId];
            product.average_price = product.total_sold > 0 ? product.revenue / product.total_sold : 0;
          });

          const topProducts = Object.values(productMap)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, limit);

          setData(topProducts);
        } else {
          setData(topProductsData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch top products');
        console.error('Error in useTopProducts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sellerId, limit]);

  return { data, loading, error };
};

export const useOrderStatusBreakdown = (sellerId: string, startDate: string, endDate: string) => {
  const [data, setData] = useState<OrderStatusStat[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!sellerId) return;
      
      setLoading(true);
      try {
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('status, total_amount')
          .eq('seller_id', sellerId)
          .gte('created_at', startDate)
          .lte('created_at', endDate);

        if (ordersError) throw ordersError;

        const statusMap: Record<string, OrderStatusStat> = {};
        let totalOrders = 0;

        ordersData?.forEach(order => {
          if (!statusMap[order.status]) {
            statusMap[order.status] = {
              status: order.status,
              count: 0,
              percentage: 0,
              revenue: 0
            };
          }

          statusMap[order.status].count += 1;
          statusMap[order.status].revenue += order.total_amount || 0;
          totalOrders += 1;
        });

        // Calculate percentages
        Object.keys(statusMap).forEach(status => {
          statusMap[status].percentage = calculatePercentage(statusMap[status].count, totalOrders);
        });

        const statusData = Object.values(statusMap).sort((a, b) => b.count - a.count);
        setData(statusData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch order status');
        console.error('Error in useOrderStatusBreakdown:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sellerId, startDate, endDate]);

  return { data, loading, error };
};

export const useInventoryHealth = (sellerId: string) => {
  const [data, setData] = useState<InventoryHealth[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!sellerId) return;
      
      setLoading(true);
      try {
        // Get products and their sales data
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('id, name, stock_quantity, minimum_stock, status')
          .eq('seller_id', sellerId)
          .eq('status', 'active');

        if (productsError) throw productsError;

        // Get sales in last 30 days
        const thirtyDaysAgo = formatDateForQuery(subDays(new Date(), 30));
        
        const { data: salesData, error: salesError } = await supabase
          .from('order_items')
          .select('product_id, quantity')
          .gte('order.created_at', thirtyDaysAgo)
          .lte('order.created_at', formatDateForQuery(new Date()))
          .in('product_id', productsData?.map(p => p.id) || []);

        if (salesError) throw salesError;

        // Calculate sales by product
        const salesByProduct: Record<string, number> = {};
        salesData?.forEach(sale => {
          salesByProduct[sale.product_id] = (salesByProduct[sale.product_id] || 0) + (sale.quantity || 0);
        });

        const healthData: InventoryHealth[] = productsData?.map(product => {
          const monthlySales = salesByProduct[product.id] || 0;
          const daysOfSupply = product.stock_quantity > 0 && monthlySales > 0 
            ? Math.round(product.stock_quantity / (monthlySales / 30))
            : 999;

          let status: InventoryHealth['status'] = 'healthy';
          let restockUrgency: InventoryHealth['restock_urgency'] = 'low';

          if (product.stock_quantity <= 0) {
            status = 'out_of_stock';
            restockUrgency = 'critical';
          } else if (product.stock_quantity <= (product.minimum_stock || 5)) {
            status = 'low_stock';
            restockUrgency = monthlySales > 0 ? 'high' : 'medium';
          }

          return {
            product_id: product.id,
            name: product.name,
            current_stock: product.stock_quantity,
            minimum_stock: product.minimum_stock || 5,
            status,
            days_of_supply: daysOfSupply,
            monthly_sales_avg: monthlySales,
            restock_urgency: restockUrgency
          };
        }) || [];

        setData(healthData.sort((a, b) => {
          const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          return urgencyOrder[a.restock_urgency] - urgencyOrder[b.restock_urgency];
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch inventory health');
        console.error('Error in useInventoryHealth:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sellerId]);

  return { data, loading, error };
};

// ==================== MOCK DATA FOR DEVELOPMENT ====================

export const getMockReportsSummary = (): ReportsSummary => ({
  total_orders: 156,
  total_revenue: 15500,
  average_order_value: 99,
  total_products_sold: 425,
  conversion_rate: 3.2,
  refund_rate: 1.5,
  customer_count: 42,
  repeat_customer_rate: 35
});

export const getMockSalesTrend = (days: number = 30): SalesTrendPoint[] => {
  const trend: SalesTrendPoint[] = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    const baseRevenue = isWeekend ? 800 : 1200;
    const variance = Math.random() * 400 - 200;
    const revenue = Math.max(300, baseRevenue + variance);
    const ordersCount = Math.floor(revenue / (80 + Math.random() * 40));
    
    trend.push({
      date: format(date, 'yyyy-MM-dd'),
      revenue: Math.round(revenue),
      orders_count: ordersCount,
      average_order_value: Math.round(revenue / ordersCount),
      day_of_week: dayOfWeek
    });
  }
  
  return trend;
};

export const getMockTopProducts = (limit: number = 10): TopProduct[] => {
  const products = [
    { id: '1', name: 'Premium Office Chair', category: 'Chairs' },
    { id: '2', name: 'Executive Desk', category: 'Desks' },
    { id: '3', name: 'Bookshelf Unit', category: 'Storage' },
    { id: '4', name: 'Conference Table', category: 'Tables' },
    { id: '5', name: 'Ergonomic Stool', category: 'Chairs' },
    { id: '6', name: 'Filing Cabinet', category: 'Storage' },
    { id: '7', name: 'Visitor Chair', category: 'Chairs' },
    { id: '8', name: 'Side Table', category: 'Tables' },
    { id: '9', name: 'Monitor Stand', category: 'Accessories' },
    { id: '10', name: 'Office Lamp', category: 'Accessories' }
  ];
  
  return products.map((product, index) => ({
    product_id: product.id,
    name: product.name,
    category: product.category,
    total_sold: Math.floor(Math.random() * 100) + 20,
    revenue: Math.floor(Math.random() * 5000) + 1000,
    average_price: Math.floor(Math.random() * 200) + 50,
    stock_quantity: Math.floor(Math.random() * 50),
    status: 'active'
  })).sort((a, b) => b.revenue - a.revenue).slice(0, limit);
};

export const getMockOrderStatus = (): OrderStatusStat[] => [
  { status: 'delivered', count: 85, percentage: 54, revenue: 8500 },
  { status: 'processing', count: 45, percentage: 29, revenue: 4500 },
  { status: 'pending', count: 12, percentage: 8, revenue: 1200 },
  { status: 'cancelled', count: 8, percentage: 5, revenue: 800 },
  { status: 'refunded', count: 6, percentage: 4, revenue: 500 }
];

export const getMockInventoryHealth = (): InventoryHealth[] => [
  { product_id: '1', name: 'Premium Office Chair', current_stock: 2, minimum_stock: 5, status: 'low_stock', monthly_sales_avg: 15, restock_urgency: 'high' },
  { product_id: '2', name: 'Executive Desk', current_stock: 0, minimum_stock: 3, status: 'out_of_stock', monthly_sales_avg: 8, restock_urgency: 'critical' },
  { product_id: '3', name: 'Bookshelf Unit', current_stock: 25, minimum_stock: 10, status: 'healthy', monthly_sales_avg: 12, restock_urgency: 'low' },
  { product_id: '4', name: 'Conference Table', current_stock: 8, minimum_stock: 5, status: 'healthy', monthly_sales_avg: 5, restock_urgency: 'low' },
  { product_id: '5', name: 'Ergonomic Stool', current_stock: 45, minimum_stock: 15, status: 'overstock', monthly_sales_avg: 8, restock_urgency: 'low' }
];

// ==================== RPC FUNCTION DEFINITIONS (FOR Supabase SQL) ====================

/*
-- Run these in your Supabase SQL editor to create the RPC functions:

1. get_seller_summary function:

CREATE OR REPLACE FUNCTION get_seller_summary(
  p_seller_id UUID,
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
  total_orders BIGINT,
  total_revenue DECIMAL,
  average_order_value DECIMAL,
  total_products_sold BIGINT,
  customer_count BIGINT,
  repeat_customer_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH order_stats AS (
    SELECT 
      COUNT(DISTINCT o.id) as total_orders,
      COALESCE(SUM(o.total_amount), 0) as total_revenue,
      COALESCE(AVG(o.total_amount), 0) as avg_order_value
    FROM orders o
    WHERE o.seller_id = p_seller_id
      AND o.created_at BETWEEN p_start_date AND p_end_date
      AND o.status IN ('completed', 'delivered')
  ),
  product_stats AS (
    SELECT 
      COALESCE(SUM(oi.quantity), 0) as total_products
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.seller_id = p_seller_id
      AND o.created_at BETWEEN p_start_date AND p_end_date
  ),
  customer_stats AS (
    SELECT 
      COUNT(DISTINCT buyer_id) as unique_customers,
      COUNT(DISTINCT CASE WHEN order_count > 1 THEN buyer_id END) as repeat_customers
    FROM (
      SELECT 
        buyer_id,
        COUNT(*) as order_count
      FROM orders
      WHERE seller_id = p_seller_id
        AND created_at BETWEEN p_start_date AND p_end_date
      GROUP BY buyer_id
    ) customer_orders
  )
  SELECT 
    os.total_orders::BIGINT,
    os.total_revenue,
    os.avg_order_value,
    ps.total_products::BIGINT,
    cs.unique_customers::BIGINT,
    CASE 
      WHEN cs.unique_customers > 0 
      THEN (cs.repeat_customers::DECIMAL / cs.unique_customers::DECIMAL) * 100
      ELSE 0 
    END as repeat_rate
  FROM order_stats os, product_stats ps, customer_stats cs;
END;
$$ LANGUAGE plpgsql;

2. get_sales_trend function:

CREATE OR REPLACE FUNCTION get_sales_trend(
  p_seller_id UUID,
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE,
  p_granularity TEXT DEFAULT 'daily'
)
RETURNS TABLE (
  date TEXT,
  revenue DECIMAL,
  orders_count BIGINT,
  average_order_value DECIMAL
) AS $$
BEGIN
  IF p_granularity = 'weekly' THEN
    RETURN QUERY
    SELECT 
      TO_CHAR(DATE_TRUNC('week', o.created_at), 'YYYY-MM-DD') as date,
      COALESCE(SUM(o.total_amount), 0) as revenue,
      COUNT(o.id) as orders_count,
      CASE 
        WHEN COUNT(o.id) > 0 
        THEN COALESCE(SUM(o.total_amount), 0) / COUNT(o.id)
        ELSE 0 
      END as average_order_value
    FROM orders o
    WHERE o.seller_id = p_seller_id
      AND o.created_at BETWEEN p_start_date AND p_end_date
      AND o.status IN ('completed', 'delivered')
    GROUP BY DATE_TRUNC('week', o.created_at)
    ORDER BY DATE_TRUNC('week', o.created_at);
  ELSE
    RETURN QUERY
    SELECT 
      TO_CHAR(DATE_TRUNC('day', o.created_at), 'YYYY-MM-DD') as date,
      COALESCE(SUM(o.total_amount), 0) as revenue,
      COUNT(o.id) as orders_count,
      CASE 
        WHEN COUNT(o.id) > 0 
        THEN COALESCE(SUM(o.total_amount), 0) / COUNT(o.id)
        ELSE 0 
      END as average_order_value
    FROM orders o
    WHERE o.seller_id = p_seller_id
      AND o.created_at BETWEEN p_start_date AND p_end_date
      AND o.status IN ('completed', 'delivered')
    GROUP BY DATE_TRUNC('day', o.created_at)
    ORDER BY DATE_TRUNC('day', o.created_at);
  END IF;
END;
$$ LANGUAGE plpgsql;

3. get_top_products function:

CREATE OR REPLACE FUNCTION get_top_products(
  p_seller_id UUID,
  p_limit INTEGER DEFAULT 10,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  product_id UUID,
  name TEXT,
  total_sold BIGINT,
  revenue DECIMAL,
  average_price DECIMAL,
  stock_quantity INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH product_sales AS (
    SELECT 
      p.id as product_id,
      p.name,
      p.stock_quantity,
      COALESCE(SUM(oi.quantity), 0) as total_sold,
      COALESCE(SUM(oi.quantity * oi.price), 0) as revenue
    FROM products p
    LEFT JOIN order_items oi ON p.id = oi.product_id
    LEFT JOIN orders o ON oi.order_id = o.id
      AND o.created_at >= NOW() - (p_days || ' days')::INTERVAL
      AND o.seller_id = p_seller_id
      AND o.status IN ('completed', 'delivered')
    WHERE p.seller_id = p_seller_id
      AND p.status = 'active'
    GROUP BY p.id, p.name, p.stock_quantity
  )
  SELECT 
    ps.product_id,
    ps.name,
    ps.total_sold,
    ps.revenue,
    CASE 
      WHEN ps.total_sold > 0 
      THEN ps.revenue / ps.total_sold
      ELSE 0 
    END as average_price,
    ps.stock_quantity
  FROM product_sales ps
  WHERE ps.total_sold > 0
  ORDER BY ps.revenue DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
*/