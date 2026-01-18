// src/api/adminNotifications.ts
import { supabase } from '@/lib/supabase';

export const adminNotificationAPI = {
  // Get all notifications
  getNotifications: async (limit: number = 50, page: number = 1) => {
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    const { data, error, count } = await supabase
      .from('admin_notifications')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(start, end);

    if (error) throw error;
    return { data, total: count, page, limit };
  },

  // Get unread notifications count
  getUnreadCount: async () => {
    const { count, error } = await supabase
      .from('admin_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'unread');

    if (error) throw error;
    return count || 0;
  },

  // Mark as read
  markAsRead: async (notificationId: string) => {
    const { error } = await supabase
      .from('admin_notifications')
      .update({ 
        status: 'read', 
        read_at: new Date().toISOString() 
      })
      .eq('id', notificationId);

    if (error) throw error;
    return { success: true };
  },

  // Mark all as read
  markAllAsRead: async () => {
    const { error } = await supabase
      .from('admin_notifications')
      .update({ 
        status: 'read', 
        read_at: new Date().toISOString() 
      })
      .eq('status', 'unread');

    if (error) throw error;
    return { success: true };
  },

  // Delete notification
  deleteNotification: async (notificationId: string) => {
    const { error } = await supabase
      .from('admin_notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
    return { success: true };
  },

  // Create notification
  createNotification: async (data: {
    type: string;
    title: string;
    message: string;
    link?: string;
    target_user_id?: string;
    metadata?: any;
  }) => {
    const { data: result, error } = await supabase
      .from('admin_notifications')
      .insert([{
        ...data,
        status: 'unread',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return result;
  },

  // Get notification by ID
  getNotification: async (notificationId: string) => {
    const { data, error } = await supabase
      .from('admin_notifications')
      .select('*')
      .eq('id', notificationId)
      .single();

    if (error) throw error;
    return data;
  },

  // Update notification
  updateNotification: async (notificationId: string, updates: any) => {
    const { data, error } = await supabase
      .from('admin_notifications')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Search notifications
  searchNotifications: async (query: string, limit: number = 20) => {
    const { data, error } = await supabase
      .from('admin_notifications')
      .select('*')
      .or(`title.ilike.%${query}%,message.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  // Get notifications by type
  getNotificationsByType: async (type: string, limit: number = 20) => {
    const { data, error } = await supabase
      .from('admin_notifications')
      .select('*')
      .eq('type', type)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  // Get recent notifications (last 24 hours)
  getRecentNotifications: async (hours: number = 24) => {
    const date = new Date();
    date.setHours(date.getHours() - hours);

    const { data, error } = await supabase
      .from('admin_notifications')
      .select('*')
      .gte('created_at', date.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Subscribe to real-time notifications
  subscribeToNotifications: (callback: (payload: any) => void) => {
    const channel = supabase
      .channel('admin_notifications_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_notifications'
        },
        callback
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // Create notification for seller approval
  createSellerApprovalNotification: async (sellerId: string, sellerName: string) => {
    return adminNotificationAPI.createNotification({
      type: 'seller_approval',
      title: 'New Seller Application',
      message: `${sellerName} has applied to become a seller`,
      link: `/admin/sellers?application=${sellerId}`,
      metadata: { seller_id: sellerId }
    });
  },

  // Create notification for new order
  createOrderNotification: async (orderId: string, orderNumber: string, amount: number) => {
    return adminNotificationAPI.createNotification({
      type: 'new_order',
      title: 'New Order Received',
      message: `Order #${orderNumber} for $${amount.toFixed(2)} has been placed`,
      link: `/admin/orders/${orderId}`,
      metadata: { order_id: orderId, order_number: orderNumber, amount }
    });
  },

  // Create notification for payout request
  createPayoutNotification: async (payoutId: string, sellerName: string, amount: number) => {
    return adminNotificationAPI.createNotification({
      type: 'payout_request',
      title: 'Payout Request',
      message: `${sellerName} requested a payout of $${amount.toFixed(2)}`,
      link: `/admin/wallet/payouts/${payoutId}`,
      metadata: { payout_id: payoutId, seller_name: sellerName, amount }
    });
  },

  // Create notification for review reported
  createReviewNotification: async (reviewId: string, productName: string) => {
    return adminNotificationAPI.createNotification({
      type: 'review_reported',
      title: 'Review Reported',
      message: `A review for "${productName}" has been reported`,
      link: `/admin/reviews/${reviewId}`,
      metadata: { review_id: reviewId, product_name: productName }
    });
  },

  // Bulk delete notifications
  bulkDeleteNotifications: async (notificationIds: string[]) => {
    const { error } = await supabase
      .from('admin_notifications')
      .delete()
      .in('id', notificationIds);

    if (error) throw error;
    return { success: true, deleted: notificationIds.length };
  },

  // Archive old notifications (older than 30 days)
  archiveOldNotifications: async (days: number = 30) => {
    const date = new Date();
    date.setDate(date.getDate() - days);

    const { error } = await supabase
      .from('admin_notifications')
      .update({ archived: true })
      .lt('created_at', date.toISOString())
      .eq('archived', false);

    if (error) throw error;
    return { success: true };
  }
};