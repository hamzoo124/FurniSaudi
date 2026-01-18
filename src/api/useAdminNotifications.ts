import { supabase } from '@/lib/supabase';
import { useState, useEffect, useCallback } from 'react';
import { adminNotificationAPI } from '@/api/adminNotifications';

export const useAdminNotifications = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminNotificationAPI.getNotifications();
      setNotifications(data);
      setUnreadCount(data.filter(n => n.status === 'unread').length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await adminNotificationAPI.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, status: 'read' } : n)
      );
      setUnreadCount(prev => prev - 1);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await adminNotificationAPI.markAllAsRead();
      setNotifications(prev => 
        prev.map(n => ({ ...n, status: 'read' }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await adminNotificationAPI.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      // Update unread count if needed
      const notification = notifications.find(n => n.id === notificationId);
      if (notification?.status === 'unread') {
        setUnreadCount(prev => prev - 1);
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [notifications]);

  const createNotification = useCallback(async (data: any) => {
    try {
      return await adminNotificationAPI.createNotification(data);
    } catch (error) {
      console.error('Error creating notification:', error);
      return { success: false, error };
    }
  }, []);

  // Real-time updates
  useEffect(() => {
    const unsubscribe = adminNotificationAPI.subscribeToNotifications((payload) => {
      setNotifications(prev => [payload.new, ...prev]);
      if (payload.new.status === 'unread') {
        setUnreadCount(prev => prev + 1);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification
  };
};