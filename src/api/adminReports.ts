// src/api/adminReports.ts
import { supabase } from '../lib/supabase';

export const adminReportAPI = {
  // Generate sales report
  generateSalesReport: async (startDate: string, endDate: string) => {
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*),
        buyers:buyer_id (full_name, email, phone),
        sellers:seller_id (business_name, email)
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });

    if (ordersError) throw ordersError;

    // Calculate metrics
    const metrics = {
      total_orders: orders?.length || 0,
      total_revenue: orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0,
      average_order_value: orders?.length > 0 
        ? orders.reduce((sum, order) => sum + (order.total_amount || 0), 0) / orders.length 
        : 0,
      delivered_orders: orders?.filter(order => order.status === 'delivered').length || 0,
      cancelled_orders: orders?.filter(order => order.status === 'cancelled').length || 0,
      pending_orders: orders?.filter(order => order.status === 'pending').length || 0,
      processing_orders: orders?.filter(order => order.status === 'processing').length || 0,
      shipped_orders: orders?.filter(order => order.status === 'shipped').length || 0,
      total_items_sold: orders?.reduce((sum, order) => 
        sum + (order.order_items?.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0) || 0), 0) || 0,
      unique_customers: new Set(orders?.map(order => order.buyer_id)).size || 0,
      unique_sellers: new Set(orders?.filter(order => order.seller_id).map(order => order.seller_id)).size || 0
    };

    // Daily breakdown
    const dailyData = orders?.reduce((acc: any, order) => {
      const date = new Date(order.created_at).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          date,
          orders: 0,
          revenue: 0,
          items: 0
        };
      }
      acc[date].orders += 1;
      acc[date].revenue += order.total_amount || 0;
      acc[date].items += order.order_items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
      return acc;
    }, {});

    const dailyBreakdown = Object.values(dailyData || {});

    return {
      orders,
      metrics,
      daily_breakdown: dailyBreakdown,
      period: {
        start: startDate,
        end: endDate,
        duration: Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
      }
    };
  },

  // Generate user report
  generateUserReport: async () => {
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select(`
        *,
        orders (count),
        sellers (*)
      `)
      .order('created_at', { ascending: false });

    if (usersError) throw usersError;

    const { data: sellers, error: sellersError } = await supabase
      .from('sellers')
      .select('*');

    if (sellersError) throw sellersError;

    const metrics = {
      total_users: users?.length || 0,
      new_users_today: users?.filter(user => {
        const userDate = new Date(user.created_at);
        const today = new Date();
        return userDate.toDateString() === today.toDateString();
      }).length || 0,
      new_users_this_week: users?.filter(user => {
        const userDate = new Date(user.created_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return userDate >= weekAgo;
      }).length || 0,
      new_users_this_month: users?.filter(user => {
        const userDate = new Date(user.created_at);
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return userDate >= monthAgo;
      }).length || 0,
      active_sellers: sellers?.filter(seller => seller.status === 'active' && seller.approval_status === 'approved').length || 0,
      pending_sellers: sellers?.filter(seller => seller.approval_status === 'pending').length || 0,
      buyers: users?.filter(user => !user.sellers?.length).length || 0,
      admins: users?.filter(user => user.user_type === 'admin').length || 0,
      suspended_users: users?.filter(user => user.status === 'suspended').length || 0
    };

    // User growth by month
    const monthlyGrowth = users?.reduce((acc: any, user) => {
      const month = new Date(user.created_at).toISOString().slice(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = 0;
      }
      acc[month] += 1;
      return acc;
    }, {});

    const monthlyBreakdown = Object.entries(monthlyGrowth || {}).map(([month, count]) => ({
      month,
      count
    })).sort((a, b) => a.month.localeCompare(b.month));

    return {
      users,
      sellers,
      metrics,
      monthly_growth: monthlyBreakdown,
      generated_at: new Date().toISOString()
    };
  },

  // Generate financial report
  generateFinancialReport: async (month: string, year: string) => {
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];

    const [
      { data: orders, error: ordersError },
      { data: payouts, error: payoutsError },
      { data: refunds, error: refundsError },
      { data: transactions, error: transactionsError }
    ] = await Promise.all([
      supabase
        .from('orders')
        .select('total_amount, status, created_at')
        .eq('status', 'delivered')
        .gte('created_at', startDate)
        .lte('created_at', endDate),
      supabase
        .from('payouts')
        .select('amount, status, created_at')
        .gte('created_at', startDate)
        .lte('created_at', endDate),
      supabase
        .from('refunds')
        .select('amount, status, created_at')
        .gte('created_at', startDate)
        .lte('created_at', endDate),
      supabase
        .from('transactions')
        .select('amount, type, status, created_at')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
    ]);

    if (ordersError) throw ordersError;
    if (payoutsError) throw payoutsError;
    if (refundsError) throw refundsError;
    if (transactionsError) throw transactionsError;

    const totalRevenue = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
    const totalPayouts = payouts?.filter(p => p.status === 'completed').reduce((sum, payout) => sum + (payout.amount || 0), 0) || 0;
    const totalRefunds = refunds?.filter(r => r.status === 'approved').reduce((sum, refund) => sum + (refund.amount || 0), 0) || 0;
    
    // Platform commission (assuming 10%)
    const platformCommission = totalRevenue * 0.10;
    const netProfit = totalRevenue - totalPayouts - totalRefunds;

    const metrics = {
      total_revenue: totalRevenue,
      total_payouts: totalPayouts,
      total_refunds: totalRefunds,
      platform_commission: platformCommission,
      net_profit: netProfit,
      order_count: orders?.length || 0,
      payout_count: payouts?.length || 0,
      refund_count: refunds?.length || 0,
      transaction_count: transactions?.length || 0
    };

    // Daily financial breakdown
    const dailyData = orders?.reduce((acc: any, order) => {
      const date = new Date(order.created_at).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          date,
          revenue: 0,
          orders: 0
        };
      }
      acc[date].revenue += order.total_amount || 0;
      acc[date].orders += 1;
      return acc;
    }, {});

    const dailyBreakdown = Object.values(dailyData || {});

    return {
      orders,
      payouts,
      refunds,
      transactions,
      metrics,
      daily_breakdown: dailyBreakdown,
      period: {
        month,
        year,
        start: startDate,
        end: endDate
      }
    };
  },

  // Generate product performance report
  generateProductReport: async (startDate: string, endDate: string) => {
    const { data: orderItems, error: orderItemsError } = await supabase
      .from('order_items')
      .select(`
        *,
        order:order_id (created_at, status),
        product:product_id (name, price, category_id, seller_id)
      `)
      .gte('order.created_at', startDate)
      .lte('order.created_at', endDate);

    if (orderItemsError) throw orderItemsError;

    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .order('orders', { ascending: false })
      .limit(100);

    if (productsError) throw productsError;

    // Product performance analysis
    const productPerformance = products?.map(product => {
      const productOrders = orderItems?.filter(item => item.product_id === product.id) || [];
      const totalSold = productOrders.reduce((sum, item) => sum + (item.quantity || 0), 0);
      const totalRevenue = productOrders.reduce((sum, item) => sum + (item.price * (item.quantity || 0)), 0);

      return {
        ...product,
        total_sold: totalSold,
        total_revenue: totalRevenue,
        average_rating: product.rating || 0,
        order_count: productOrders.length
      };
    }).sort((a, b) => b.total_revenue - a.total_revenue);

    // Category analysis
    const categoryAnalysis = products?.reduce((acc: any, product) => {
      const category = product.category_id || 'uncategorized';
      if (!acc[category]) {
        acc[category] = {
          category_id: category,
          product_count: 0,
          total_revenue: 0,
          total_sold: 0
        };
      }
      acc[category].product_count += 1;
      return acc;
    }, {});

    const categoryBreakdown = Object.values(categoryAnalysis || {});

    const metrics = {
      total_products: products?.length || 0,
      total_items_sold: orderItems?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0,
      total_product_revenue: orderItems?.reduce((sum, item) => sum + (item.price * (item.quantity || 0)), 0) || 0,
      average_price: products?.length > 0 
        ? products.reduce((sum, p) => sum + (p.price || 0), 0) / products.length 
        : 0,
      top_performing_count: 10,
      low_stock_count: products?.filter(p => (p.stock_quantity || 0) <= 10).length || 0,
      out_of_stock_count: products?.filter(p => (p.stock_quantity || 0) === 0).length || 0
    };

    return {
      products,
      product_performance: productPerformance,
      category_breakdown: categoryBreakdown,
      metrics,
      period: {
        start: startDate,
        end: endDate
      }
    };
  },

  // Save generated report
  saveReport: async (reportData: {
    type: string;
    period: string;
    title: string;
    description?: string;
    data: any;
    generated_by?: string;
  }) => {
    const { data, error } = await supabase
      .from('admin_reports')
      .insert([{
        ...reportData,
        generated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get saved reports with pagination
  getSavedReports: async (limit: number = 20, page: number = 1, filters: any = {}) => {
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    let query = supabase
      .from('admin_reports')
      .select('*', { count: 'exact' })
      .order('generated_at', { ascending: false });

    if (filters.type && filters.type !== 'all') {
      query = query.eq('type', filters.type);
    }

    if (filters.period && filters.period !== 'all') {
      query = query.eq('period', filters.period);
    }

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    const { data, error, count } = await query.range(start, end);

    if (error) throw error;
    return { data, total: count, page, limit };
  },

  // Get report by ID
  getReport: async (reportId: string) => {
    const { data, error } = await supabase
      .from('admin_reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (error) throw error;
    return data;
  },

  // Update report
  updateReport: async (reportId: string, updates: any) => {
    const { data, error } = await supabase
      .from('admin_reports')
      .update(updates)
      .eq('id', reportId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete report
  deleteReport: async (reportId: string) => {
    const { error } = await supabase
      .from('admin_reports')
      .delete()
      .eq('id', reportId);

    if (error) throw error;
    return { success: true };
  },

  // Bulk delete reports
  bulkDeleteReports: async (reportIds: string[]) => {
    const { error } = await supabase
      .from('admin_reports')
      .delete()
      .in('id', reportIds);

    if (error) throw error;
    return { success: true, deleted: reportIds.length };
  },

  // Export report data
  exportReportData: async (reportId: string, format: 'csv' | 'json' = 'csv') => {
    const report = await adminReportAPI.getReport(reportId);
    
    if (format === 'json') {
      return JSON.stringify(report.data, null, 2);
    }

    // Convert to CSV
    if (Array.isArray(report.data)) {
      const headers = Object.keys(report.data[0] || {}).join(',');
      const rows = report.data.map(row => 
        Object.values(row).map(value => 
          typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
        ).join(',')
      ).join('\n');
      return `${headers}\n${rows}`;
    }

    return JSON.stringify(report.data);
  },

  // Get report analytics
  getReportAnalytics: async () => {
    const { data: reports, error } = await supabase
      .from('admin_reports')
      .select('*');

    if (error) throw error;

    const analytics = {
      total_reports: reports?.length || 0,
      by_type: reports?.reduce((acc: any, report) => {
        acc[report.type] = (acc[report.type] || 0) + 1;
        return acc;
      }, {}) || {},
      by_period: reports?.reduce((acc: any, report) => {
        acc[report.period] = (acc[report.period] || 0) + 1;
        return acc;
      }, {}) || {},
      recent_reports: reports?.slice(0, 5) || [],
      total_size: reports?.reduce((sum, report) => 
        sum + JSON.stringify(report.data).length, 0) || 0
    };

    return analytics;
  },

  // Generate custom report
  generateCustomReport: async (config: {
    type: string;
    metrics: string[];
    filters: any;
    groupBy?: string;
    sortBy?: string;
    limit?: number;
  }) => {
    let query;
    
    switch (config.type) {
      case 'orders':
        query = supabase.from('orders').select('*');
        break;
      case 'users':
        query = supabase.from('profiles').select('*');
        break;
      case 'products':
        query = supabase.from('products').select('*');
        break;
      case 'transactions':
        query = supabase.from('transactions').select('*');
        break;
      default:
        throw new Error('Invalid report type');
    }

    // Apply filters
    if (config.filters.startDate) {
      query = query.gte('created_at', config.filters.startDate);
    }
    if (config.filters.endDate) {
      query = query.lte('created_at', config.filters.endDate);
    }
    if (config.filters.status && config.filters.status !== 'all') {
      query = query.eq('status', config.filters.status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return {
      data,
      config,
      generated_at: new Date().toISOString()
    };
  }
};