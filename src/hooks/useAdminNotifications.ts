// src/hooks/useAdminNotifications.ts
import { useState, useEffect, useCallback } from 'react';
import { adminNotificationAPI } from '@/api/adminNotifications';
import { supabase } from '@/lib/supabase';

export const useAdminNotifications = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  const fetchNotifications = useCallback(async (page: number = 1, limit: number = 20) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await adminNotificationAPI.getNotifications(limit, page);
      
      setNotifications(result.data || []);
      setPagination({
        page,
        limit,
        total: result.total || 0,
        totalPages: Math.ceil((result.total || 0) / limit)
      });
    } catch (err: any) {
      setError(err.message || 'Failed to fetch notifications');
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await adminNotificationAPI.getUnreadCount();
      setUnreadCount(count);
    } catch (err: any) {
      console.error('Error fetching unread count:', err);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await adminNotificationAPI.markAsRead(notificationId);
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, status: 'read' } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      return { success: true };
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
      return { success: false, error: err.message };
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await adminNotificationAPI.markAllAsRead();
      
      setNotifications(prev => 
        prev.map(n => ({ ...n, status: 'read' }))
      );
      setUnreadCount(0);
      
      return { success: true };
    } catch (err: any) {
      console.error('Error marking all as read:', err);
      return { success: false, error: err.message };
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await adminNotificationAPI.deleteNotification(notificationId);
      
      const notificationToDelete = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      if (notificationToDelete?.status === 'unread') {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      return { success: true };
    } catch (err: any) {
      console.error('Error deleting notification:', err);
      return { success: false, error: err.message };
    }
  }, [notifications]);

  const createNotification = useCallback(async (data: any) => {
    try {
      const notification = await adminNotificationAPI.createNotification(data);
      
      setNotifications(prev => [notification, ...prev]);
      if (notification.status === 'unread') {
        setUnreadCount(prev => prev + 1);
      }
      
      return { success: true, data: notification };
    } catch (err: any) {
      console.error('Error creating notification:', err);
      return { success: false, error: err.message };
    }
  }, []);

  const getNotification = useCallback(async (notificationId: string) => {
    try {
      const notification = await adminNotificationAPI.getNotification(notificationId);
      return { success: true, data: notification };
    } catch (err: any) {
      console.error('Error fetching notification:', err);
      return { success: false, error: err.message };
    }
  }, []);

  const updateNotification = useCallback(async (notificationId: string, updates: any) => {
    try {
      const updatedNotification = await adminNotificationAPI.updateNotification(notificationId, updates);
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? updatedNotification : n)
      );
      
      return { success: true, data: updatedNotification };
    } catch (err: any) {
      console.error('Error updating notification:', err);
      return { success: false, error: err.message };
    }
  }, []);

  const searchNotifications = useCallback(async (query: string) => {
    try {
      setLoading(true);
      const results = await adminNotificationAPI.searchNotifications(query);
      return { success: true, data: results };
    } catch (err: any) {
      console.error('Error searching notifications:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getNotificationsByType = useCallback(async (type: string) => {
    try {
      setLoading(true);
      const results = await adminNotificationAPI.getNotificationsByType(type);
      return { success: true, data: results };
    } catch (err: any) {
      console.error('Error fetching notifications by type:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkDeleteNotifications = useCallback(async (notificationIds: string[]) => {
    try {
      await adminNotificationAPI.bulkDeleteNotifications(notificationIds);
      
      setNotifications(prev => 
        prev.filter(n => !notificationIds.includes(n.id))
      );
      
      // Update unread count
      const deletedUnreadCount = notifications.filter(n => 
        notificationIds.includes(n.id) && n.status === 'unread'
      ).length;
      
      setUnreadCount(prev => Math.max(0, prev - deletedUnreadCount));
      
      return { success: true, deleted: notificationIds.length };
    } catch (err: any) {
      console.error('Error bulk deleting notifications:', err);
      return { success: false, error: err.message };
    }
  }, [notifications]);

  // Helper function to create specific notification types
  const createSellerApprovalNotification = useCallback(async (sellerId: string, sellerName: string) => {
    return createNotification({
      type: 'seller_approval',
      title: 'New Seller Application',
      message: `${sellerName} has applied to become a seller`,
      link: `/admin/sellers?application=${sellerId}`,
      metadata: { seller_id: sellerId }
    });
  }, [createNotification]);

  const createOrderNotification = useCallback(async (orderId: string, orderNumber: string, amount: number) => {
    return createNotification({
      type: 'new_order',
      title: 'New Order Received',
      message: `Order #${orderNumber} for $${amount.toFixed(2)} has been placed`,
      link: `/admin/orders/${orderId}`,
      metadata: { order_id: orderId, order_number: orderNumber, amount }
    });
  }, [createNotification]);

  // Real-time subscription for new notifications
  useEffect(() => {
    const unsubscribe = adminNotificationAPI.subscribeToNotifications((payload) => {
      setNotifications(prev => [payload.new, ...prev]);
      if (payload.new.status === 'unread') {
        setUnreadCount(prev => prev + 1);
      }
    });

    return unsubscribe;
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    pagination,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    getNotification,
    updateNotification,
    searchNotifications,
    getNotificationsByType,
    bulkDeleteNotifications,
    createSellerApprovalNotification,
    createOrderNotification
  };
};