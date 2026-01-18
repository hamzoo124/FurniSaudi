// src/api/reports.ts

import { supabase } from '../lib/supabase';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface SalesTrend {
  date: string;
  sales_count: number;
  revenue: number;
}

export interface TopProduct {
  product_id: string;
  name: string;
  image_url: string | null;
  category_name: string | null;
  total_sold: number;
  total_revenue: number;
  average_rating: number | null;
}

export interface OrderStatusBreakdown {
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  count: number;
  revenue: number;
  percentage: number;
}

export interface InventoryHealth {
  total_products: number;
  low_stock: number;
  out_of_stock: number;
  healthy_stock: number;
  average_stock_level: number;
  restock_recommendations: Array<{
    product_id: string;
    name: string;
    current_stock: number;
    min_stock_threshold: number;
    days_of_supply: number;
  }>;
}

export interface CategoryPerformance {
  category_id: string;
  category_name: string;
  total_sales: number;
  total_revenue: number;
  product_count: number;
  average_price: number;
}

export interface ReportsSummary {
  total_sales: number;
  total_orders: number;
  total_revenue: number;
  average_order_value: number;
  conversion_rate: number;
  top_categories: CategoryPerformance[];
  date_range: {
    start_date: string;
    end_date: string;
  };
}

export interface CustomerAnalytics {
  total_customers: number;
  repeat_customers: number;
  new_customers: number;
  average_purchase_frequency: number;
  average_customer_value: number;
  top_customers: Array<{
    customer_id: string;
    customer_name: string;
    total_orders: number;
    total_spent: number;
    last_order_date: string;
  }>;
}

export interface FinancialMetrics {
  gross_revenue: number;
  net_revenue: number;
  vat_collected: number;
  commission_paid: number;
  shipping_revenue: number;
  refund_amount: number;
  profit_margin: number;
}

// ============================================
// API RESPONSE INTERFACE
// ============================================

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  meta?: {
    total_count?: number;
    page?: number;
    page_size?: number;
    has_more?: boolean;
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

const getDateRangeFilter = (startDate?: string, endDate?: string) => {
  const filters: any = {};
  
  if (startDate) {
    filters.created_at = { gte: startDate };
  }
  
  if (endDate) {
    filters.created_at = { ...filters.created_at, lte: endDate };
  }
  
  return filters;
};

const calculatePercentage = (value: number, total: number): number => {
  return total > 0 ? Math.round((value / total) * 100) : 0;
};

// ============================================
// MAIN API FUNCTIONS
// ============================================

/**
 * Fetch overall reports summary for a seller
 */
export const getReportsSummary = async (
  sellerId: string,
  startDate?: string,
  endDate?: string
): Promise<ApiResponse<ReportsSummary>> => {
  try {
    const dateFilter = getDateRangeFilter(startDate, endDate);
    
    // Get total orders and revenue
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('id, total_amount, status, created_at')
      .eq('seller_id', sellerId)
      .match(dateFilter);

    if (ordersError) throw ordersError;

    const totalOrders = ordersData?.length || 0;
    const totalRevenue = ordersData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Get category performance
    const { data: categoryData, error: categoryError } = await supabase
      .rpc('get_seller_category_performance', {
        p_seller_id: sellerId,
        p_start_date: startDate,
        p_end_date: endDate
      });

    if (categoryError) {
      console.warn('RPC function not available, using fallback query:', categoryError);
      
      // Fallback query using regular Supabase
      const { data: fallbackData } = await supabase
        .from('order_items')
        .select(`
          product:products (
            category:categories (id, name)
          ),
          quantity,
          price
        `)
        .eq('products.seller_id', sellerId)
        .match(dateFilter);

      const categoryMap = new Map<string, CategoryPerformance>();
      
      fallbackData?.forEach(item => {
        const category = item.product?.category;
        if (category) {
          const existing = categoryMap.get(category.id) || {
            category_id: category.id,
            category_name: category.name,
            total_sales: 0,
            total_revenue: 0,
            product_count: 0,
            average_price: 0
          };
          
          existing.total_sales += item.quantity || 0;
          existing.total_revenue += (item.price || 0) * (item.quantity || 0);
          categoryMap.set(category.id, existing);
        }
      });

      const topCategories = Array.from(categoryMap.values())
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .slice(0, 5);
    }

    const summary: ReportsSummary = {
      total_sales: ordersData?.filter(o => o.status === 'delivered').length || 0,
      total_orders,
      total_revenue,
      average_order_value,
      conversion_rate: 0, // This would come from separate analytics
      top_categories: categoryData || [],
      date_range: {
        start_date: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: endDate || new Date().toISOString()
      }
    };

    return {
      data: summary,
      error: null,
      meta: {
        total_count: totalOrders
      }
    };
  } catch (error) {
    console.error('Error fetching reports summary:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch reports summary',
    };
  }
};

/**
 * Fetch sales trend data for a date range
 */
export const getSalesTrend = async (
  sellerId: string,
  startDate: string,
  endDate: string,
  groupBy: 'day' | 'week' | 'month' = 'day'
): Promise<ApiResponse<SalesTrend[]>> => {
  try {
    const { data, error } = await supabase
      .rpc('get_seller_sales_trend', {
        p_seller_id: sellerId,
        p_start_date: startDate,
        p_end_date: endDate,
        p_group_by: groupBy
      });

    if (error) {
      console.warn('RPC function not available, using fallback query:', error);
      
      // Fallback: Fetch orders and group manually
      const { data: ordersData } = await supabase
        .from('orders')
        .select('created_at, total_amount, status')
        .eq('seller_id', sellerId)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .eq('status', 'delivered');

      const salesByDate = new Map<string, { sales_count: number; revenue: number }>();
      
      ordersData?.forEach(order => {
        const date = new Date(order.created_at);
        let formattedDate: string;
        
        switch (groupBy) {
          case 'week':
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            formattedDate = weekStart.toISOString().split('T')[0];
            break;
          case 'month':
            formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            break;
          default:
            formattedDate = date.toISOString().split('T')[0];
        }
        
        const existing = salesByDate.get(formattedDate) || { sales_count: 0, revenue: 0 };
        existing.sales_count += 1;
        existing.revenue += order.total_amount || 0;
        salesByDate.set(formattedDate, existing);
      });

      const trendData = Array.from(salesByDate.entries())
        .map(([date, metrics]) => ({
          date,
          sales_count: metrics.sales_count,
          revenue: metrics.revenue
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        data: trendData,
        error: null
      };
    }

    return {
      data,
      error: null
    };
  } catch (error) {
    console.error('Error fetching sales trend:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch sales trend',
    };
  }
};

/**
 * Fetch top-selling products for a seller
 */
export const getTopProducts = async (
  sellerId: string,
  limit: number = 5,
  startDate?: string,
  endDate?: string
): Promise<ApiResponse<TopProduct[]>> => {
  try {
    const dateFilter = getDateRangeFilter(startDate, endDate);
    
    const { data, error } = await supabase
      .from('order_items')
      .select(`
        product_id,
        quantity,
        price,
        product:products (
          name,
          image_url,
          category:categories (name),
          average_rating
        )
      `)
      .eq('products.seller_id', sellerId)
      .match(dateFilter)
      .order('quantity', { ascending: false })
      .limit(limit * 10); // Get more initially to group by product

    if (error) throw error;

    // Group by product and calculate totals
    const productMap = new Map<string, TopProduct>();
    
    data?.forEach(item => {
      const existing = productMap.get(item.product_id) || {
        product_id: item.product_id,
        name: item.product?.name || 'Unknown Product',
        image_url: item.product?.image_url,
        category_name: item.product?.category?.name,
        total_sold: 0,
        total_revenue: 0,
        average_rating: item.product?.average_rating || null
      };
      
      existing.total_sold += item.quantity || 0;
      existing.total_revenue += (item.price || 0) * (item.quantity || 0);
      productMap.set(item.product_id, existing);
    });

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, limit);

    return {
      data: topProducts,
      error: null
    };
  } catch (error) {
    console.error('Error fetching top products:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch top products',
    };
  }
};

/**
 * Return count of orders grouped by status
 */
export const getOrderStatusBreakdown = async (
  sellerId: string,
  startDate?: string,
  endDate?: string
): Promise<ApiResponse<OrderStatusBreakdown[]>> => {
  try {
    const dateFilter = getDateRangeFilter(startDate, endDate);
    
    const { data, error } = await supabase
      .from('orders')
      .select('status, total_amount, id')
      .eq('seller_id', sellerId)
      .match(dateFilter);

    if (error) throw error;

    const statusMap = new Map<string, { count: number; revenue: number }>();
    let totalOrders = 0;
    let totalRevenue = 0;

    data?.forEach(order => {
      const existing = statusMap.get(order.status) || { count: 0, revenue: 0 };
      existing.count += 1;
      existing.revenue += order.total_amount || 0;
      statusMap.set(order.status, existing);
      totalOrders += 1;
      totalRevenue += order.total_amount || 0;
    });

    const breakdown: OrderStatusBreakdown[] = Array.from(statusMap.entries())
      .map(([status, metrics]) => ({
        status: status as OrderStatusBreakdown['status'],
        count: metrics.count,
        revenue: metrics.revenue,
        percentage: calculatePercentage(metrics.count, totalOrders)
      }))
      .sort((a, b) => b.count - a.count);

    return {
      data: breakdown,
      error: null,
      meta: {
        total_count: totalOrders,
        total_revenue
      }
    };
  } catch (error) {
    console.error('Error fetching order status breakdown:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch order status breakdown',
    };
  }
};

/**
 * Fetch inventory health summary
 */
export const getInventoryHealth = async (
  sellerId: string
): Promise<ApiResponse<InventoryHealth>> => {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, stock_quantity, min_stock_threshold, average_monthly_sales')
      .eq('seller_id', sellerId)
      .eq('is_active', true);

    if (error) throw error;

    let totalProducts = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let healthyStock = 0;
    let totalStock = 0;
    const restockRecommendations: InventoryHealth['restock_recommendations'] = [];

    products?.forEach(product => {
      totalProducts++;
      totalStock += product.stock_quantity || 0;

      if ((product.stock_quantity || 0) === 0) {
        outOfStock++;
      } else if ((product.stock_quantity || 0) <= (product.min_stock_threshold || 5)) {
        lowStock++;
        // Calculate days of supply if we have average monthly sales
        const daysOfSupply = product.average_monthly_sales 
          ? (product.stock_quantity || 0) / (product.average_monthly_sales / 30)
          : 0;
        
        restockRecommendations.push({
          product_id: product.id,
          name: product.name,
          current_stock: product.stock_quantity || 0,
          min_stock_threshold: product.min_stock_threshold || 5,
          days_of_supply: Math.round(daysOfSupply)
        });
      } else {
        healthyStock++;
      }
    });

    const inventoryHealth: InventoryHealth = {
      total_products: totalProducts,
      low_stock: lowStock,
      out_of_stock: outOfStock,
      healthy_stock: healthyStock,
      average_stock_level: totalProducts > 0 ? Math.round(totalStock / totalProducts) : 0,
      restock_recommendations: restockRecommendations
        .sort((a, b) => a.days_of_supply - b.days_of_supply)
        .slice(0, 10)
    };

    return {
      data: inventoryHealth,
      error: null
    };
  } catch (error) {
    console.error('Error fetching inventory health:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch inventory health',
    };
  }
};

/**
 * Get customer analytics for a seller
 */
export const getCustomerAnalytics = async (
  sellerId: string,
  startDate?: string,
  endDate?: string
): Promise<ApiResponse<CustomerAnalytics>> => {
  try {
    const dateFilter = getDateRangeFilter(startDate, endDate);
    
    const { data: orders, error } = await supabase
      .from('orders')
      .select('buyer_id, total_amount, created_at')
      .eq('seller_id', sellerId)
      .match(dateFilter)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Group orders by customer
    const customerMap = new Map<string, {
      orders: number;
      total_spent: number;
      last_order_date: string;
    }>();

    orders?.forEach(order => {
      const existing = customerMap.get(order.buyer_id) || {
        orders: 0,
        total_spent: 0,
        last_order_date: order.created_at
      };
      
      existing.orders += 1;
      existing.total_spent += order.total_amount || 0;
      if (new Date(order.created_at) > new Date(existing.last_order_date)) {
        existing.last_order_date = order.created_at;
      }
      
      customerMap.set(order.buyer_id, existing);
    });

    const totalCustomers = customerMap.size;
    const repeatCustomers = Array.from(customerMap.values()).filter(c => c.orders > 1).length;
    const totalOrders = orders?.length || 0;
    const totalRevenue = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

    const topCustomers = Array.from(customerMap.entries())
      .map(([customer_id, stats]) => ({
        customer_id,
        customer_name: `Customer ${customer_id.slice(-6)}`, // In production, join with user profiles
        total_orders: stats.orders,
        total_spent: stats.total_spent,
        last_order_date: stats.last_order_date
      }))
      .sort((a, b) => b.total_spent - a.total_spent)
      .slice(0, 10);

    const analytics: CustomerAnalytics = {
      total_customers: totalCustomers,
      repeat_customers: repeatCustomers,
      new_customers: totalCustomers - repeatCustomers,
      average_purchase_frequency: totalCustomers > 0 ? totalOrders / totalCustomers : 0,
      average_customer_value: totalCustomers > 0 ? totalRevenue / totalCustomers : 0,
      top_customers
    };

    return {
      data: analytics,
      error: null
    };
  } catch (error) {
    console.error('Error fetching customer analytics:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch customer analytics',
    };
  }
};

/**
 * Get financial metrics for a seller
 */
export const getFinancialMetrics = async (
  sellerId: string,
  startDate?: string,
  endDate?: string
): Promise<ApiResponse<FinancialMetrics>> => {
  try {
    const dateFilter = getDateRangeFilter(startDate, endDate);
    
    // Get order data
    const { data: orders, error } = await supabase
      .from('orders')
      .select('total_amount, vat_amount, commission_amount, shipping_fee, refund_amount, status')
      .eq('seller_id', sellerId)
      .match(dateFilter);

    if (error) throw error;

    const deliveredOrders = orders?.filter(o => o.status === 'delivered') || [];
    const refundedOrders = orders?.filter(o => o.status === 'refunded') || [];

    const grossRevenue = deliveredOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
    const vatCollected = deliveredOrders.reduce((sum, order) => sum + (order.vat_amount || 0), 0);
    const commissionPaid = deliveredOrders.reduce((sum, order) => sum + (order.commission_amount || 0), 0);
    const shippingRevenue = deliveredOrders.reduce((sum, order) => sum + (order.shipping_fee || 0), 0);
    const refundAmount = refundedOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);

    const netRevenue = grossRevenue - commissionPaid - refundAmount;
    const profitMargin = grossRevenue > 0 ? (netRevenue / grossRevenue) * 100 : 0;

    const metrics: FinancialMetrics = {
      gross_revenue: grossRevenue,
      net_revenue: netRevenue,
      vat_collected: vatCollected,
      commission_paid: commissionPaid,
      shipping_revenue: shippingRevenue,
      refund_amount: refundAmount,
      profit_margin: Math.round(profitMargin * 100) / 100 // Round to 2 decimal places
    };

    return {
      data: metrics,
      error: null
    };
  } catch (error) {
    console.error('Error fetching financial metrics:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch financial metrics',
    };
  }
};

/**
 * Export report data in various formats
 */
export const exportReportData = async (
  sellerId: string,
  reportType: 'sales' | 'inventory' | 'customers' | 'financial',
  format: 'csv' | 'json' | 'pdf' = 'csv',
  startDate?: string,
  endDate?: string
): Promise<ApiResponse<{ download_url: string; file_name: string }>> => {
  try {
    // In production, this would generate a file and return a download URL
    // For now, simulate the response
    
    const fileName = `${reportType}_report_${sellerId.slice(-8)}_${new Date().toISOString().split('T')[0]}.${format}`;
    
    return {
      data: {
        download_url: `/api/exports/${fileName}`,
        file_name: fileName
      },
      error: null
    };
  } catch (error) {
    console.error('Error exporting report data:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to export report data',
    };
  }
};

// ============================================
// MOCK DATA FOR TESTING/DEMO
// ============================================

export const getMockReportsSummary = (): ReportsSummary => ({
  total_sales: 156,
  total_orders: 189,
  total_revenue: 15500,
  average_order_value: 82,
  conversion_rate: 3.2,
  top_categories: [
    { category_id: '1', category_name: 'Living Room', total_sales: 45, total_revenue: 5200, product_count: 12, average_price: 115 },
    { category_id: '2', category_name: 'Bedroom', total_sales: 38, total_revenue: 4200, product_count: 8, average_price: 110 },
    { category_id: '3', category_name: 'Office', total_sales: 32, total_revenue: 3800, product_count: 6, average_price: 119 },
    { category_id: '4', category_name: 'Dining', total_sales: 25, total_revenue: 1800, product_count: 4, average_price: 72 },
    { category_id: '5', category_name: 'Outdoor', total_sales: 16, total_revenue: 500, product_count: 3, average_price: 31 },
  ],
  date_range: {
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date().toISOString()
  }
});

export const getMockSalesTrend = (): SalesTrend[] => {
  const trend = [];
  const today = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    
    const salesCount = Math.floor(Math.random() * 10) + 1;
    const revenue = salesCount * (Math.random() * 200 + 50);
    
    trend.push({
      date: date.toISOString().split('T')[0],
      sales_count: salesCount,
      revenue: Math.round(revenue)
    });
  }
  
  return trend;
};

export const getMockTopProducts = (): TopProduct[] => [
  { product_id: '1', name: 'Premium Leather Sofa', image_url: null, category_name: 'Living Room', total_sold: 45, total_revenue: 22500, average_rating: 4.8 },
  { product_id: '2', name: 'Executive Office Chair', image_url: null, category_name: 'Office', total_sold: 38, total_revenue: 19000, average_rating: 4.6 },
  { product_id: '3', name: 'King Size Bed Frame', image_url: null, category_name: 'Bedroom', total_sold: 32, total_revenue: 16000, average_rating: 4.9 },
  { product_id: '4', name: 'Dining Table Set', image_url: null, category_name: 'Dining', total_sold: 25, total_revenue: 12500, average_rating: 4.7 },
  { product_id: '5', name: 'Outdoor Patio Set', image_url: null, category_name: 'Outdoor', total_sold: 16, total_revenue: 8000, average_rating: 4.5 },
];