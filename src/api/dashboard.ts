import { supabase } from '@/lib/supabase';

// ==================== TYPE DEFINITIONS ====================

export interface DashboardSummary {
  // Core Metrics
  total_orders: number;
  total_revenue: number;
  total_products: number;
  active_listings: number;
  pending_orders: number;
  
  // Financial Metrics
  today_revenue: number;
  yesterday_revenue: number;
  this_month_revenue: number;
  last_month_revenue: number;
  average_order_value: number;
  conversion_rate: number;
  
  // Inventory Metrics
  low_stock_items: number;
  out_of_stock_items: number;
  
  // Customer Metrics
  total_customers: number;
  repeat_customers: number;
  customer_satisfaction: number; // Average rating
  
  // Operational Metrics
  pending_reviews: number;
  pending_messages: number;
  pending_refunds: number;
  on_time_delivery_rate: number;
  
  // Performance Metrics
  revenue_growth_percentage: number;
  order_growth_percentage: number;
  customer_growth_percentage: number;
  
  // Time-based Metrics
  daily_average_revenue: number;
  weekly_revenue: number;
  monthly_revenue: number;
  quarterly_revenue: number;
  
  // VAT & Commission
  vat_obligation: number;
  total_commission: number;
  net_revenue: number;
  
  // Payouts
  available_payout: number;
  pending_payout: number;
  total_payouts: number;
}

export interface RecentOrder {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  total_amount: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  shipping_status: ShippingStatus;
  item_count: number;
  created_at: string;
  updated_at: string;
  items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
}

export interface RecentNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata: Record<string, any>;
  is_read: boolean;
  is_important: boolean;
  action_url: string | null;
  expires_at: string | null;
  created_at: string;
  read_at: string | null;
}

export interface DashboardAnalytics {
  summary: DashboardSummary;
  recent_orders: RecentOrder[];
  recent_notifications: RecentNotification[];
  revenue_trend: RevenueDataPoint[];
  top_products: TopProduct[];
  sales_by_category: SalesByCategory[];
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  orders: number;
  average_order_value: number;
}

export interface TopProduct {
  product_id: string;
  product_name: string;
  category: string;
  total_sales: number;
  total_orders: number;
  total_revenue: number;
  stock_quantity: number;
  image_url: string;
}

export interface SalesByCategory {
  category: string;
  total_revenue: number;
  total_orders: number;
  percentage: number;
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'
  | 'disputed';

export type PaymentStatus = 
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'partially_refunded';

export type ShippingStatus = 
  | 'pending'
  | 'packed'
  | 'shipped'
  | 'in_transit'
  | 'delivered'
  | 'returned';

export type NotificationType = 
  | 'order'
  | 'payment'
  | 'review'
  | 'inventory'
  | 'system'
  | 'promotion'
  | 'customer_message';

// ==================== API FUNCTIONS ====================

/**
 * Get comprehensive dashboard summary for seller
 */
export const getDashboardSummary = async (
  sellerId: string
): Promise<{ data: DashboardSummary | null; error: string | null }> => {
  try {
    if (!sellerId) {
      return { data: null, error: 'Seller ID is required' };
    }

    // Get current date ranges
    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0));
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Fetch all data in parallel for performance
    const [
      ordersPromise,
      productsPromise,
      customersPromise,
      todayOrdersPromise,
      yesterdayOrdersPromise,
      thisMonthOrdersPromise,
      lastMonthOrdersPromise,
      reviewsPromise,
      messagesPromise,
      refundsPromise
    ] = await Promise.all([
      // All orders for seller
      supabase
        .from('orders')
        .select('id, total_amount, status, created_at, payment_status, shipping_status')
        .eq('seller_id', sellerId)
        .neq('status', 'cancelled'),

      // All products for seller
      supabase
        .from('products')
        .select('id, stock_quantity, status, category')
        .eq('seller_id', sellerId),

      // All customers who ordered from seller
      supabase
        .from('orders')
        .select('customer_id')
        .eq('seller_id', sellerId)
        .neq('status', 'cancelled'),

      // Today's orders
      supabase
        .from('orders')
        .select('total_amount')
        .eq('seller_id', sellerId)
        .gte('created_at', today.toISOString())
        .neq('status', 'cancelled'),

      // Yesterday's orders
      supabase
        .from('orders')
        .select('total_amount')
        .eq('seller_id', sellerId)
        .gte('created_at', yesterday.toISOString())
        .lt('created_at', today.toISOString())
        .neq('status', 'cancelled'),

      // This month's orders
      supabase
        .from('orders')
        .select('total_amount')
        .eq('seller_id', sellerId)
        .gte('created_at', firstDayOfMonth.toISOString())
        .neq('status', 'cancelled'),

      // Last month's orders
      supabase
        .from('orders')
        .select('total_amount')
        .eq('seller_id', sellerId)
        .gte('created_at', firstDayOfLastMonth.toISOString())
        .lte('created_at', lastDayOfLastMonth.toISOString())
        .neq('status', 'cancelled'),

      // Pending reviews
      supabase
        .from('reviews')
        .select('id, status')
        .eq('seller_id', sellerId)
        .eq('status', 'pending'),

      // Unread messages
      supabase
        .from('messages')
        .select('id, is_read')
        .eq('seller_id', sellerId)
        .eq('is_read', false),

      // Pending refunds
      supabase
        .from('orders')
        .select('id, refund_status')
        .eq('seller_id', sellerId)
        .eq('refund_status', 'pending')
    ]);

    // Extract data from promises
    const { data: allOrders, error: ordersError } = await ordersPromise;
    const { data: allProducts, error: productsError } = await productsPromise;
    const { data: allCustomers, error: customersError } = await customersPromise;
    const { data: todayOrders, error: todayError } = await todayOrdersPromise;
    const { data: yesterdayOrders, error: yesterdayError } = await yesterdayOrdersPromise;
    const { data: thisMonthOrders, error: thisMonthError } = await thisMonthOrdersPromise;
    const { data: lastMonthOrders, error: lastMonthError } = await lastMonthOrdersPromise;
    const { data: pendingReviews, error: reviewsError } = await reviewsPromise;
    const { data: unreadMessages, error: messagesError } = await messagesPromise;
    const { data: pendingRefunds, error: refundsError } = await refundsPromise;

    // Check for errors
    const errors = [
      ordersError, productsError, customersError, todayError, yesterdayError,
      thisMonthError, lastMonthError, reviewsError, messagesError, refundsError
    ].filter(error => error);

    if (errors.length > 0) {
      console.error('Errors fetching dashboard summary:', errors);
      throw new Error(`Failed to fetch dashboard data: ${errors[0]?.message}`);
    }

    // Calculate metrics
    const totalOrders = allOrders?.length || 0;
    const totalRevenue = allOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
    const totalProducts = allProducts?.length || 0;
    const activeListings = allProducts?.filter(p => p.status === 'active').length || 0;
    const pendingOrders = allOrders?.filter(o => o.status === 'pending').length || 0;
    
    const todayRevenue = todayOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
    const yesterdayRevenue = yesterdayOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
    const thisMonthRevenue = thisMonthOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
    const lastMonthRevenue = lastMonthOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
    
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    const lowStockItems = allProducts?.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 5).length || 0;
    const outOfStockItems = allProducts?.filter(p => p.stock_quantity === 0).length || 0;
    
    // Get unique customers
    const uniqueCustomers = [...new Set(allCustomers?.map(c => c.customer_id).filter(Boolean))];
    const totalCustomers = uniqueCustomers.length;
    
    // Get wallet info
    const { data: wallet } = await supabase
      .from('seller_wallet')
      .select('available_balance, pending_balance')
      .eq('seller_id', sellerId)
      .single();

    // Get average rating
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('seller_id', sellerId)
      .eq('status', 'approved');

    const customerSatisfaction = reviews && reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

    // Calculate growth percentages
    const revenueGrowthPercentage = lastMonthRevenue > 0
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : thisMonthRevenue > 0 ? 100 : 0;

    const orderGrowthPercentage = (() => {
      const thisMonthOrderCount = thisMonthOrders?.length || 0;
      const lastMonthOrderCount = lastMonthOrders?.length || 0;
      return lastMonthOrderCount > 0
        ? ((thisMonthOrderCount - lastMonthOrderCount) / lastMonthOrderCount) * 100
        : thisMonthOrderCount > 0 ? 100 : 0;
    })();

    // Calculate customer growth (this month vs last month)
    const thisMonthCustomers = await getCustomersThisMonth(sellerId);
    const lastMonthCustomers = await getCustomersLastMonth(sellerId);
    const customerGrowthPercentage = lastMonthCustomers > 0
      ? ((thisMonthCustomers - lastMonthCustomers) / lastMonthCustomers) * 100
      : thisMonthCustomers > 0 ? 100 : 0;

    // Calculate time-based metrics
    const daysSinceFirstOrder = await getDaysSinceFirstOrder(sellerId);
    const dailyAverageRevenue = daysSinceFirstOrder > 0 ? totalRevenue / daysSinceFirstOrder : 0;

    // Calculate VAT and commission (15% each)
    const vatRate = 0.15;
    const commissionRate = 0.15;
    const vatObligation = totalRevenue * vatRate;
    const totalCommission = totalRevenue * commissionRate;
    const netRevenue = totalRevenue - vatObligation - totalCommission;

    const summary: DashboardSummary = {
      // Core Metrics
      total_orders: totalOrders,
      total_revenue: parseFloat(totalRevenue.toFixed(2)),
      total_products: totalProducts,
      active_listings: activeListings,
      pending_orders: pendingOrders,
      
      // Financial Metrics
      today_revenue: parseFloat(todayRevenue.toFixed(2)),
      yesterday_revenue: parseFloat(yesterdayRevenue.toFixed(2)),
      this_month_revenue: parseFloat(thisMonthRevenue.toFixed(2)),
      last_month_revenue: parseFloat(lastMonthRevenue.toFixed(2)),
      average_order_value: parseFloat(averageOrderValue.toFixed(2)),
      conversion_rate: 0, // Would require tracking product views
      
      // Inventory Metrics
      low_stock_items: lowStockItems,
      out_of_stock_items: outOfStockItems,
      
      // Customer Metrics
      total_customers: totalCustomers,
      repeat_customers: 0, // Would require tracking repeat purchases
      customer_satisfaction: parseFloat(customerSatisfaction.toFixed(1)),
      
      // Operational Metrics
      pending_reviews: pendingReviews?.length || 0,
      pending_messages: unreadMessages?.length || 0,
      pending_refunds: pendingRefunds?.length || 0,
      on_time_delivery_rate: 95, // Would require delivery tracking
      
      // Performance Metrics
      revenue_growth_percentage: parseFloat(revenueGrowthPercentage.toFixed(1)),
      order_growth_percentage: parseFloat(orderGrowthPercentage.toFixed(1)),
      customer_growth_percentage: parseFloat(customerGrowthPercentage.toFixed(1)),
      
      // Time-based Metrics
      daily_average_revenue: parseFloat(dailyAverageRevenue.toFixed(2)),
      weekly_revenue: parseFloat((dailyAverageRevenue * 7).toFixed(2)),
      monthly_revenue: parseFloat((dailyAverageRevenue * 30).toFixed(2)),
      quarterly_revenue: parseFloat((dailyAverageRevenue * 90).toFixed(2)),
      
      // VAT & Commission
      vat_obligation: parseFloat(vatObligation.toFixed(2)),
      total_commission: parseFloat(totalCommission.toFixed(2)),
      net_revenue: parseFloat(netRevenue.toFixed(2)),
      
      // Payouts
      available_payout: wallet?.available_balance || 0,
      pending_payout: wallet?.pending_balance || 0,
      total_payouts: 0 // Would require payout history
    };

    return { data: summary, error: null };
  } catch (error) {
    console.error('Error in getDashboardSummary:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch dashboard summary'
    };
  }
};

/**
 * Get recent orders for seller
 */
export const getRecentOrders = async (
  sellerId: string,
  limit: number = 5
): Promise<{ data: RecentOrder[] | null; error: string | null }> => {
  try {
    if (!sellerId) {
      return { data: null, error: 'Seller ID is required' };
    }

    // Fetch recent orders with customer and item details
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        customer_id,
        total_amount,
        status,
        payment_status,
        shipping_status,
        created_at,
        updated_at,
        customer:profiles!orders_customer_id_fkey (
          full_name,
          email,
          phone
        ),
        items:order_items (
          product_id,
          quantity,
          unit_price,
          product:products (
            name
          )
        )
      `)
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (ordersError) throw ordersError;

    // Transform the data
    const recentOrders: RecentOrder[] = (orders || []).map(order => ({
      id: order.id,
      order_number: order.order_number || `ORD-${order.id.slice(-6).toUpperCase()}`,
      customer_id: order.customer_id,
      customer_name: (order.customer as any)?.full_name || 'Customer',
      customer_email: (order.customer as any)?.email || '',
      customer_phone: (order.customer as any)?.phone || '',
      total_amount: order.total_amount || 0,
      status: order.status as OrderStatus,
      payment_status: order.payment_status as PaymentStatus,
      shipping_status: order.shipping_status as ShippingStatus,
      item_count: Array.isArray(order.items) ? order.items.length : 0,
      created_at: order.created_at,
      updated_at: order.updated_at,
      items: Array.isArray(order.items) ? order.items.map(item => ({
        product_id: item.product_id,
        product_name: (item.product as any)?.name || 'Product',
        quantity: item.quantity || 1,
        unit_price: item.unit_price || 0,
        total_price: (item.quantity || 1) * (item.unit_price || 0)
      })) : []
    }));

    return { data: recentOrders, error: null };
  } catch (error) {
    console.error('Error in getRecentOrders:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch recent orders'
    };
  }
};

/**
 * Get recent notifications for seller
 */
export const getRecentNotifications = async (
  sellerId: string,
  limit: number = 5
): Promise<{ data: RecentNotification[] | null; error: string | null }> => {
  try {
    if (!sellerId) {
      return { data: null, error: 'Seller ID is required' };
    }

    // Fetch recent notifications
    const { data: notifications, error: notificationsError } = await supabase
      .from('notifications')
      .select(`
        id,
        type,
        title,
        message,
        metadata,
        is_read,
        is_important,
        action_url,
        expires_at,
        created_at,
        read_at
      `)
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (notificationsError) throw notificationsError;

    const recentNotifications: RecentNotification[] = (notifications || []).map(notification => ({
      id: notification.id,
      type: notification.type as NotificationType,
      title: notification.title,
      message: notification.message,
      metadata: notification.metadata || {},
      is_read: notification.is_read || false,
      is_important: notification.is_important || false,
      action_url: notification.action_url,
      expires_at: notification.expires_at,
      created_at: notification.created_at,
      read_at: notification.read_at
    }));

    return { data: recentNotifications, error: null };
  } catch (error) {
    console.error('Error in getRecentNotifications:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch recent notifications'
    };
  }
};

/**
 * Get complete dashboard analytics (all data in one call)
 */
export const getDashboardAnalytics = async (
  sellerId: string
): Promise<{ data: DashboardAnalytics | null; error: string | null }> => {
  try {
    if (!sellerId) {
      return { data: null, error: 'Seller ID is required' };
    }

    // Fetch all data in parallel
    const [
      summaryResult,
      recentOrdersResult,
      recentNotificationsResult,
      revenueTrendResult,
      topProductsResult,
      salesByCategoryResult
    ] = await Promise.all([
      getDashboardSummary(sellerId),
      getRecentOrders(sellerId, 10),
      getRecentNotifications(sellerId, 10),
      getRevenueTrend(sellerId, 7), // Last 7 days
      getTopProducts(sellerId, 5),
      getSalesByCategory(sellerId)
    ]);

    // Check for errors
    const errors = [
      summaryResult.error,
      recentOrdersResult.error,
      recentNotificationsResult.error,
      revenueTrendResult.error,
      topProductsResult.error,
      salesByCategoryResult.error
    ].filter(error => error);

    if (errors.length > 0) {
      throw new Error(`Failed to fetch dashboard analytics: ${errors[0]}`);
    }

    const analytics: DashboardAnalytics = {
      summary: summaryResult.data!,
      recent_orders: recentOrdersResult.data || [],
      recent_notifications: recentNotificationsResult.data || [],
      revenue_trend: revenueTrendResult.data || [],
      top_products: topProductsResult.data || [],
      sales_by_category: salesByCategoryResult.data || []
    };

    return { data: analytics, error: null };
  } catch (error) {
    console.error('Error in getDashboardAnalytics:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch dashboard analytics'
    };
  }
};

/**
 * Get revenue trend for the last N days
 */
export const getRevenueTrend = async (
  sellerId: string,
  days: number = 7
): Promise<{ data: RevenueDataPoint[] | null; error: string | null }> => {
  try {
    if (!sellerId) {
      return { data: null, error: 'Seller ID is required' };
    }

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    // Fetch orders for the date range
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('total_amount, created_at')
      .eq('seller_id', sellerId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .neq('status', 'cancelled');

    if (ordersError) throw ordersError;

    // Group orders by date
    const revenueByDate = new Map<string, { revenue: number; orders: number }>();

    // Initialize all dates in range
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateString = date.toISOString().split('T')[0];
      revenueByDate.set(dateString, { revenue: 0, orders: 0 });
    }

    // Aggregate orders by date
    orders?.forEach(order => {
      const orderDate = new Date(order.created_at).toISOString().split('T')[0];
      const current = revenueByDate.get(orderDate) || { revenue: 0, orders: 0 };
      current.revenue += order.total_amount || 0;
      current.orders += 1;
      revenueByDate.set(orderDate, current);
    });

    // Convert to array
    const revenueTrend: RevenueDataPoint[] = Array.from(revenueByDate.entries())
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        orders: data.orders,
        average_order_value: data.orders > 0 ? data.revenue / data.orders : 0
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return { data: revenueTrend, error: null };
  } catch (error) {
    console.error('Error in getRevenueTrend:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch revenue trend'
    };
  }
};

/**
 * Get top products by revenue
 */
export const getTopProducts = async (
  sellerId: string,
  limit: number = 5
): Promise<{ data: TopProduct[] | null; error: string | null }> => {
  try {
    if (!sellerId) {
      return { data: null, error: 'Seller ID is required' };
    }

    // Fetch top products from order items
    const { data: topProducts, error: productsError } = await supabase
      .rpc('get_top_products', {
        p_seller_id: sellerId,
        p_limit: limit
      });

    if (productsError) {
      // Fallback to manual query if RPC doesn't exist
      const { data: orderItems, error: orderItemsError } = await supabase
        .from('order_items')
        .select(`
          product_id,
          quantity,
          unit_price,
          product:products (
            name,
            category,
            stock_quantity,
            image_url
          ),
          order:orders!inner (
            seller_id
          )
        `)
        .eq('order.seller_id', sellerId)
        .neq('order.status', 'cancelled');

      if (orderItemsError) throw orderItemsError;

      // Manually aggregate product data
      const productMap = new Map<string, TopProduct>();

      orderItems?.forEach(item => {
        const productId = item.product_id;
        const current = productMap.get(productId) || {
          product_id: productId,
          product_name: (item.product as any)?.name || 'Product',
          category: (item.product as any)?.category || 'Uncategorized',
          total_sales: 0,
          total_orders: 0,
          total_revenue: 0,
          stock_quantity: (item.product as any)?.stock_quantity || 0,
          image_url: (item.product as any)?.image_url || ''
        };

        current.total_sales += item.quantity || 1;
        current.total_orders += 1;
        current.total_revenue += (item.quantity || 1) * (item.unit_price || 0);
        productMap.set(productId, current);
      });

      const topProductsData = Array.from(productMap.values())
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .slice(0, limit);

      return { data: topProductsData, error: null };
    }

    return { data: topProducts, error: null };
  } catch (error) {
    console.error('Error in getTopProducts:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch top products'
    };
  }
};

/**
 * Get sales distribution by category
 */
export const getSalesByCategory = async (
  sellerId: string
): Promise<{ data: SalesByCategory[] | null; error: string | null }> => {
  try {
    if (!sellerId) {
      return { data: null, error: 'Seller ID is required' };
    }

    // Fetch sales by category
    const { data: salesData, error: salesError } = await supabase
      .rpc('get_sales_by_category', {
        p_seller_id: sellerId
      });

    if (salesError) {
      // Fallback to manual query
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          total_amount,
          items:order_items (
            product:products (
              category
            )
          )
        `)
        .eq('seller_id', sellerId)
        .neq('status', 'cancelled');

      if (ordersError) throw ordersError;

      const categoryMap = new Map<string, SalesByCategory>();

      orders?.forEach(order => {
        const items = Array.isArray(order.items) ? order.items : [];
        items.forEach(item => {
          const category = (item.product as any)?.category || 'Uncategorized';
          const current = categoryMap.get(category) || {
            category,
            total_revenue: 0,
            total_orders: 0,
            percentage: 0
          };

          current.total_revenue += order.total_amount || 0;
          current.total_orders += 1;
          categoryMap.set(category, current);
        });
      });

      const totalRevenue = Array.from(categoryMap.values())
        .reduce((sum, cat) => sum + cat.total_revenue, 0);

      const salesByCategory = Array.from(categoryMap.values()).map(cat => ({
        ...cat,
        percentage: totalRevenue > 0 ? (cat.total_revenue / totalRevenue) * 100 : 0
      }));

      return { data: salesByCategory, error: null };
    }

    return { data: salesData, error: null };
  } catch (error) {
    console.error('Error in getSalesByCategory:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch sales by category'
    };
  }
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Get number of customers who placed orders this month
 */
const getCustomersThisMonth = async (sellerId: string): Promise<number> => {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const { data, error } = await supabase
    .from('orders')
    .select('customer_id')
    .eq('seller_id', sellerId)
    .gte('created_at', firstDayOfMonth.toISOString())
    .neq('status', 'cancelled');

  if (error) {
    console.error('Error fetching this month customers:', error);
    return 0;
  }

  const uniqueCustomers = new Set(data?.map(order => order.customer_id).filter(Boolean));
  return uniqueCustomers.size;
};

/**
 * Get number of customers who placed orders last month
 */
const getCustomersLastMonth = async (sellerId: string): Promise<number> => {
  const now = new Date();
  const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const { data, error } = await supabase
    .from('orders')
    .select('customer_id')
    .eq('seller_id', sellerId)
    .gte('created_at', firstDayOfLastMonth.toISOString())
    .lte('created_at', lastDayOfLastMonth.toISOString())
    .neq('status', 'cancelled');

  if (error) {
    console.error('Error fetching last month customers:', error);
    return 0;
  }

  const uniqueCustomers = new Set(data?.map(order => order.customer_id).filter(Boolean));
  return uniqueCustomers.size;
};

/**
 * Get days since first order
 */
const getDaysSinceFirstOrder = async (sellerId: string): Promise<number> => {
  const { data, error } = await supabase
    .from('orders')
    .select('created_at')
    .eq('seller_id', sellerId)
    .neq('status', 'cancelled')
    .order('created_at', { ascending: true })
    .limit(1);

  if (error || !data || data.length === 0) {
    return 30; // Default to 30 days if no orders
  }

  const firstOrderDate = new Date(data[0].created_at);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - firstOrderDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > 0 ? diffDays : 1; // At least 1 day
};

// ==================== EXPORT API COLLECTION ====================

export const dashboardAPI = {
  getDashboardSummary,
  getRecentOrders,
  getRecentNotifications,
  getDashboardAnalytics,
  getRevenueTrend,
  getTopProducts,
  getSalesByCategory
};

export type DashboardAPI = typeof dashboardAPI;