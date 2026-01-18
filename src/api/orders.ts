import { supabase } from '../lib/supabase';
// import { formatCurrency } from '../utils';
import { formatCurrency } from '../utils/currency';

export interface Order {
  id: string;
  order_number: string;
  seller_id: string;
  buyer_id: string;
  total_amount: number;
  subtotal_amount: number;
  vat_amount: number;
  shipping_fee: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  payment_status: 'pending' | 'paid' | 'partially_paid' | 'refunded' | 'failed';
  payment_method: string;
  shipping_address: any;
  order_type: 'ready-made' | 'custom';
  is_urgent: boolean;
  notes?: string;
  estimated_delivery?: string;
  created_at: string;
  updated_at: string;
  tracking_number?: string;
  courier_name?: string;
  refund_amount?: number;
  refund_reason?: string;
  seller_notes?: string;
  internal_notes?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
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

export interface CustomerInfo {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  profile_image_url?: string;
}

export interface OrderDetail extends Order {
  customer: CustomerInfo;
  items: OrderItem[];
  seller: {
    business_name: string;
    email: string;
    phone: string;
  };
}

export interface OrderFilters {
  seller_id?: string;
  status?: string[];
  payment_status?: string[];
  date_from?: string;
  date_to?: string;
  min_amount?: number;
  max_amount?: number;
  search?: string;
  order_type?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface OrderStats {
  total: number;
  pending: number;
  confirmed: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  refunded: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  totalRevenue: number;
  avgOrderValue: number;
  pendingPayment: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export const ordersAPI = {
  /**
   * Fetch orders with seller-specific filtering
   */
  async getSellerOrders(
    sellerId: string,
    filters?: Partial<OrderFilters>,
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<PaginatedResponse<Order>>> {
    try {
      const offset = (page - 1) * limit;

      let query = supabase
        .from('orders')
        .select(`
          *,
          buyer:users!orders_buyer_id_fkey (
            full_name,
            email,
            phone
          ),
          items:order_items(*)
        `, { count: 'exact' })
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.status?.length) query = query.in('status', filters.status);
      if (filters?.payment_status?.length) query = query.in('payment_status', filters.payment_status);
      if (filters?.date_from) query = query.gte('created_at', filters.date_from);
      if (filters?.date_to) query = query.lte('created_at', filters.date_to);
      if (filters?.min_amount !== undefined) query = query.gte('total_amount', filters.min_amount);
      if (filters?.max_amount !== undefined) query = query.lte('total_amount', filters.max_amount);
      if (filters?.order_type) query = query.eq('order_type', filters.order_type);
      if (filters?.search) {
        query = query.or(`
          order_number.ilike.%${filters.search}%,
          users.full_name.ilike.%${filters.search}%
        `);
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      const orders: Order[] = (data || []).map(order => ({
        ...order,
        shipping_address: order.shipping_address as any,
        buyer: order.buyer as any,
        items: order.items as OrderItem[],
      }));

      return {
        data: {
          data: orders,
          total: count || 0,
          page,
          limit,
          totalPages: Math.ceil((count || 0) / limit),
        },
        error: null,
        success: true,
      };
    } catch (error: any) {
      console.error('Error fetching seller orders:', error);
      return { 
        data: null, 
        error: error.message || 'Failed to fetch orders', 
        success: false 
      };
    }
  },

  /**
   * Fetch single order with full details for seller
   */
  async getSellerOrderById(orderId: string, sellerId: string): Promise<ApiResponse<OrderDetail>> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          buyer:users!orders_buyer_id_fkey (
            full_name,
            email,
            phone,
            profile_image_url
          ),
          seller:sellers!orders_seller_id_fkey (
            business_name,
            email,
            phone
          ),
          items:order_items(
            *,
            product:products(
              name,
              images,
              sku
            )
          )
        `)
        .eq('id', orderId)
        .eq('seller_id', sellerId)
        .single();

      if (error) throw error;

      const orderDetail: OrderDetail = {
        ...data,
        shipping_address: data.shipping_address as any,
        buyer: data.buyer as CustomerInfo,
        seller: data.seller as any,
        items: (data.items || []).map((item: any) => ({
          id: item.id,
          order_id: item.order_id,
          product_id: item.product_id,
          product_name: item.product?.name || item.product_name || 'Unknown Product',
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          is_custom: item.is_custom || false,
          customization_details: item.customization_details,
          specifications: item.specifications,
          product_image_url: item.product?.images?.[0] || item.product_image_url
        }))
      };

      return { data: orderDetail, error: null, success: true };
    } catch (error: any) {
      console.error('Error fetching order details:', error);
      return { 
        data: null, 
        error: error.message || 'Failed to fetch order details', 
        success: false 
      };
    }
  },

  /**
   * Update order status (seller version)
   */
  async updateOrderStatus(
    orderId: string,
    status: Order['status'],
    sellerId: string,
    notes?: string
  ): Promise<ApiResponse<Order>> {
    try {
      // First verify the order belongs to this seller
      const { data: existingOrder, error: verifyError } = await supabase
        .from('orders')
        .select('seller_id, order_number, buyer_id')
        .eq('id', orderId)
        .eq('seller_id', sellerId)
        .single();

      if (verifyError) throw new Error('Order not found or unauthorized');

      const updateData: any = { 
        status, 
        updated_at: new Date().toISOString(),
        seller_notes: notes 
      };

      // Set timestamps based on status
      switch(status) {
        case 'confirmed':
          updateData.confirmed_at = new Date().toISOString();
          break;
        case 'processing':
          updateData.processed_at = new Date().toISOString();
          break;
        case 'shipped':
          updateData.shipped_at = new Date().toISOString();
          break;
        case 'delivered':
          updateData.delivered_at = new Date().toISOString();
          updateData.fulfillment_status = 'fulfilled';
          break;
        case 'cancelled':
          updateData.cancelled_at = new Date().toISOString();
          break;
      }

      const { data, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: sellerId,
        user_type: 'seller',
        action: 'ORDER_STATUS_UPDATED',
        action_type: 'order',
        target_type: 'order',
        target_id: orderId,
        details: {
          order_number: existingOrder.order_number,
          old_status: existingOrder.status,
          new_status: status,
          notes,
          updated_by: sellerId
        },
        created_at: new Date().toISOString()
      });

      // Notify buyer
      await supabase.from('notifications').insert({
        user_id: existingOrder.buyer_id,
        title: 'Order Status Updated',
        message: `Your order #${existingOrder.order_number} has been updated to ${status}`,
        type: 'order_update',
        related_id: orderId,
        related_type: 'order',
        read: false,
        created_at: new Date().toISOString()
      });

      return { data: data as Order, error: null, success: true };
    } catch (error: any) {
      console.error('Error updating order status:', error);
      return { 
        data: null, 
        error: error.message || 'Failed to update order status', 
        success: false 
      };
    }
  },

  /**
   * Update shipping info (seller version)
   */
  async updateShippingInfo(
    orderId: string,
    shippingInfo: {
      tracking_number?: string;
      shipping_carrier?: string;
      estimated_delivery?: string;
    },
    sellerId: string
  ): Promise<ApiResponse<Order>> {
    try {
      // Verify ownership
      const { data: existingOrder, error: verifyError } = await supabase
        .from('orders')
        .select('seller_id, order_number, buyer_id')
        .eq('id', orderId)
        .eq('seller_id', sellerId)
        .single();

      if (verifyError) throw new Error('Order not found or unauthorized');

      const { data, error } = await supabase
        .from('orders')
        .update({
          ...shippingInfo,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: sellerId,
        user_type: 'seller',
        action: 'SHIPPING_INFO_UPDATED',
        action_type: 'order',
        target_type: 'order',
        target_id: orderId,
        details: {
          order_number: existingOrder.order_number,
          shipping_info: shippingInfo,
          updated_by: sellerId
        },
        created_at: new Date().toISOString()
      });

      // Notify buyer
      if (shippingInfo.tracking_number) {
        await supabase.from('notifications').insert({
          user_id: existingOrder.buyer_id,
          title: 'Tracking Information Updated',
          message: `Tracking number ${shippingInfo.tracking_number} has been added to your order #${existingOrder.order_number}`,
          type: 'shipping_update',
          related_id: orderId,
          related_type: 'order',
          read: false,
          created_at: new Date().toISOString()
        });
      }

      return { data: data as Order, error: null, success: true };
    } catch (error: any) {
      console.error('Error updating shipping info:', error);
      return { 
        data: null, 
        error: error.message || 'Failed to update shipping info', 
        success: false 
      };
    }
  },

  /**
   * Get seller order statistics
   */
  async getSellerOrderStats(sellerId: string): Promise<ApiResponse<OrderStats>> {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('status, payment_status, total_amount, created_at')
        .eq('seller_id', sellerId);

      if (error) throw error;

      const today = new Date(); 
      today.setHours(0, 0, 0, 0);
      
      const weekAgo = new Date(); 
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const monthAgo = new Date(); 
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      const stats: OrderStats = {
        total: 0,
        pending: 0,
        confirmed: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
        refunded: 0,
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        totalRevenue: 0,
        avgOrderValue: 0,
        pendingPayment: 0
      };

      let totalRevenue = 0;
      let deliveredCount = 0;

      (orders || []).forEach(order => {
        const orderDate = new Date(order.created_at);
        stats.total++;
        
        // Status counts
        const statusKey = order.status as keyof OrderStats;
        if (statusKey in stats) (stats[statusKey] as number)++;
        
        // Time-based counts
        if (orderDate >= today) stats.today++;
        if (orderDate >= weekAgo) stats.thisWeek++;
        if (orderDate >= monthAgo) stats.thisMonth++;
        
        // Payment status
        if (order.payment_status === 'pending' || order.payment_status === 'failed') {
          stats.pendingPayment++;
        }
        
        // Revenue calculation (only for delivered and paid orders)
        if (order.status === 'delivered' && order.payment_status === 'paid') {
          totalRevenue += order.total_amount || 0;
          deliveredCount++;
        }
      });

      stats.totalRevenue = totalRevenue;
      stats.avgOrderValue = deliveredCount > 0 ? totalRevenue / deliveredCount : 0;

      return { data: stats, error: null, success: true };
    } catch (error: any) {
      console.error('Error fetching order stats:', error);
      return { 
        data: null, 
        error: error.message || 'Failed to fetch order stats', 
        success: false 
      };
    }
  },

  /**
   * Process refund (seller version)
   */
  async processRefund(
    orderId: string,
    refundData: {
      amount: number;
      reason: string;
      refund_method?: string;
    },
    sellerId: string
  ): Promise<ApiResponse<Order>> {
    try {
      // Verify ownership
      const { data: order, error: verifyError } = await supabase
        .from('orders')
        .select('total_amount, refund_amount, order_number, buyer_id, seller_id')
        .eq('id', orderId)
        .eq('seller_id', sellerId)
        .single();

      if (verifyError) throw new Error('Order not found or unauthorized');

      const availableAmount = order.total_amount - (order.refund_amount || 0);
      
      if (refundData.amount > availableAmount) {
        throw new Error(`Refund amount exceeds available amount: ${formatCurrency(availableAmount)}`);
      }

      const updateData: any = {
        refund_amount: (order.refund_amount || 0) + refundData.amount,
        refund_reason: refundData.reason,
        refund_date: new Date().toISOString(),
        refunded_by: sellerId,
        updated_at: new Date().toISOString()
      };

      // Update status based on refund amount
      if (refundData.amount === order.total_amount) {
        updateData.status = 'refunded';
        updateData.payment_status = 'refunded';
      } else if (refundData.amount === availableAmount) {
        updateData.payment_status = 'refunded';
      } else {
        updateData.payment_status = 'partially_refunded';
      }

      const { data, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;

      // Create refund transaction
      await supabase.from('transactions').insert({
        order_id: orderId,
        user_id: order.buyer_id,
        seller_id: sellerId,
        amount: refundData.amount,
        type: 'refund',
        status: 'completed',
        payment_method: refundData.refund_method || 'original',
        details: {
          order_number: order.order_number,
          reason: refundData.reason,
          refunded_by: sellerId
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: sellerId,
        user_type: 'seller',
        action: 'ORDER_REFUNDED',
        action_type: 'order',
        target_type: 'order',
        target_id: orderId,
        details: {
          order_number: order.order_number,
          amount: refundData.amount,
          reason: refundData.reason,
          refunded_by: sellerId
        },
        created_at: new Date().toISOString()
      });

      // Notify buyer
      await supabase.from('notifications').insert({
        user_id: order.buyer_id,
        title: 'Refund Processed',
        message: `A refund of ${formatCurrency(refundData.amount)} has been processed for your order #${order.order_number}`,
        type: 'refund',
        related_id: orderId,
        related_type: 'order',
        read: false,
        created_at: new Date().toISOString()
      });

      return { data: data as Order, error: null, success: true };
    } catch (error: any) {
      console.error('Error processing refund:', error);
      return { 
        data: null, 
        error: error.message || 'Failed to process refund', 
        success: false 
      };
    }
  },

  /**
   * Cancel order (seller version)
   */
  async cancelOrder(
    orderId: string,
    reason: string,
    sellerId: string
  ): Promise<ApiResponse<Order>> {
    try {
      // Verify ownership
      const { data: existingOrder, error: verifyError } = await supabase
        .from('orders')
        .select('seller_id, order_number, buyer_id')
        .eq('id', orderId)
        .eq('seller_id', sellerId)
        .single();

      if (verifyError) throw new Error('Order not found or unauthorized');

      const { data, error } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: sellerId,
        user_type: 'seller',
        action: 'ORDER_CANCELLED',
        action_type: 'order',
        target_type: 'order',
        target_id: orderId,
        details: {
          order_number: existingOrder.order_number,
          reason,
          cancelled_by: sellerId
        },
        created_at: new Date().toISOString()
      });

      // Notify buyer
      await supabase.from('notifications').insert({
        user_id: existingOrder.buyer_id,
        title: 'Order Cancelled',
        message: `Your order #${existingOrder.order_number} has been cancelled. Reason: ${reason}`,
        type: 'order_cancelled',
        related_id: orderId,
        related_type: 'order',
        read: false,
        created_at: new Date().toISOString()
      });

      return { data: data as Order, error: null, success: true };
    } catch (error: any) {
      console.error('Error cancelling order:', error);
      return { 
        data: null, 
        error: error.message || 'Failed to cancel order', 
        success: false 
      };
    }
  },

  /**
   * Get recent orders for seller
   */
  async getRecentSellerOrders(
    sellerId: string,
    limit: number = 10
  ): Promise<ApiResponse<Order[]>> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return { 
        data: data as Order[], 
        error: null, 
        success: true 
      };
    } catch (error: any) {
      console.error('Error fetching recent orders:', error);
      return { 
        data: null, 
        error: error.message || 'Failed to fetch recent orders', 
        success: false 
      };
    }
  },

  /**
   * Get seller order summary
   */
  async getSellerOrdersSummary(sellerId: string): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('total_amount, status, payment_status, created_at')
        .eq('seller_id', sellerId);

      if (error) throw error;

      let totalRevenue = 0;
      let totalOrders = 0;
      let pendingOrders = 0;
      let deliveredOrders = 0;
      let todayRevenue = 0;
      let thisMonthRevenue = 0;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

      (data || []).forEach(order => {
        const orderDate = new Date(order.created_at);
        totalOrders++;
        
        if (order.status === 'pending') pendingOrders++;
        if (order.status === 'delivered') deliveredOrders++;
        
        if (order.payment_status === 'paid') {
          totalRevenue += order.total_amount || 0;
          
          if (orderDate >= today) {
            todayRevenue += order.total_amount || 0;
          }
          
          if (orderDate >= monthStart) {
            thisMonthRevenue += order.total_amount || 0;
          }
        }
      });

      return {
        data: {
          totalRevenue,
          totalOrders,
          pendingOrders,
          deliveredOrders,
          todayRevenue,
          thisMonthRevenue,
          avgOrderValue: deliveredOrders > 0 ? totalRevenue / deliveredOrders : 0
        },
        error: null,
        success: true
      };
    } catch (error: any) {
      console.error('Error fetching orders summary:', error);
      return { 
        data: null, 
        error: error.message || 'Failed to fetch summary', 
        success: false 
      };
    }
  }
};