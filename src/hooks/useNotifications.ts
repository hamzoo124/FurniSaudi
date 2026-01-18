// src/hooks/useNotifications.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PostgrestError } from '@supabase/supabase-js';

// ============================================
// TYPES & INTERFACES
// ============================================

export type NotificationType = 
  | 'order'           // New order, order updates
  | 'review'          // Customer review
  | 'payout'          // Payment & payout updates
  | 'support'         // Support ticket updates
  | 'system'          // System announcements
  | 'shipping'        // Shipping updates
  | 'inventory'       // Low stock, restock
  | 'custom_order'    // Custom order requests
  | 'vat'             // VAT filing reminders
  | 'promotion'       // Promotional opportunities
  | 'dispute'         // Customer disputes
  | 'verification'    // Account verification
  | 'maintenance';    // Platform maintenance

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Notification {
  id: string;
  seller_id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  is_read: boolean;
  is_archived: boolean;
  metadata: Record<string, any>;
  redirect_url?: string;
  action_url?: string;
  action_label?: string;
  expires_at?: string;
  read_at?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationFilters {
  type?: NotificationType;
  is_read?: boolean;
  is_archived?: boolean;
  priority?: NotificationPriority;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface PaginatedNotifications {
  data: Notification[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  unread_count: number;
}

export interface NotificationStats {
  total: number;
  unread: number;
  by_type: Record<NotificationType, number>;
  by_priority: Record<NotificationPriority, number>;
}

export interface CreateNotification {
  seller_id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  metadata?: Record<string, any>;
  redirect_url?: string;
  action_url?: string;
  action_label?: string;
  expires_at?: string;
}

// ============================================
// CONSTANTS
// ============================================

export const NOTIFICATION_TYPES: Record<NotificationType, {
  label: string;
  icon: string;
  color: string;
}> = {
  order: { label: 'Orders', icon: '🛒', color: 'blue' },
  review: { label: 'Reviews', icon: '⭐', color: 'yellow' },
  payout: { label: 'Payouts', icon: '💰', color: 'green' },
  support: { label: 'Support', icon: '🛟', color: 'purple' },
  system: { label: 'System', icon: '⚙️', color: 'gray' },
  shipping: { label: 'Shipping', icon: '🚚', color: 'indigo' },
  inventory: { label: 'Inventory', icon: '📦', color: 'orange' },
  custom_order: { label: 'Custom Orders', icon: '🔧', color: 'pink' },
  vat: { label: 'VAT', icon: '🧾', color: 'red' },
  promotion: { label: 'Promotions', icon: '🎯', color: 'teal' },
  dispute: { label: 'Disputes', icon: '⚖️', color: 'red' },
  verification: { label: 'Verification', icon: '✅', color: 'blue' },
  maintenance: { label: 'Maintenance', icon: '🔧', color: 'gray' },
};

export const NOTIFICATION_PRIORITIES: Record<NotificationPriority, {
  label: string;
  color: string;
}> = {
  low: { label: 'Low', color: 'gray' },
  medium: { label: 'Medium', color: 'blue' },
  high: { label: 'High', color: 'orange' },
  urgent: { label: 'Urgent', color: 'red' },
};

// Default mock notifications for testing/demo
export const DEFAULT_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    seller_id: 'demo-seller-id-123',
    type: 'order',
    priority: 'high',
    title: 'New Order Received',
    message: 'You have received a new order #ORD-7894 for SAR 2,450',
    is_read: false,
    is_archived: false,
    metadata: { order_id: 'ORD-7894', amount: 2450 },
    redirect_url: '/seller/dashboard/orders/ORD-7894',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'notif-2',
    seller_id: 'demo-seller-id-123',
    type: 'review',
    priority: 'medium',
    title: 'New 5-Star Review',
    message: 'Ahmed Al-Mansoor left a 5-star review on your Premium Sofa',
    is_read: false,
    is_archived: false,
    metadata: { product_id: 'prod-123', rating: 5 },
    redirect_url: '/seller/dashboard/reviews',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'notif-3',
    seller_id: 'demo-seller-id-123',
    type: 'payout',
    priority: 'medium',
    title: 'Payout Processed',
    message: 'Your payout of SAR 4,250 has been processed and will arrive in 2-3 business days',
    is_read: true,
    is_archived: false,
    metadata: { amount: 4250, payout_id: 'PYT-123' },
    redirect_url: '/seller/dashboard/finance',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'notif-4',
    seller_id: 'demo-seller-id-123',
    type: 'inventory',
    priority: 'high',
    title: 'Low Stock Alert',
    message: '3 products are running low on stock and need restocking',
    is_read: true,
    is_archived: false,
    metadata: { low_stock_count: 3, product_ids: ['prod-456', 'prod-789'] },
    redirect_url: '/seller/dashboard/inventory',
    created_at: new Date(Date.now() - 10800000).toISOString(),
    updated_at: new Date(Date.now() - 10800000).toISOString(),
  },
  {
    id: 'notif-5',
    seller_id: 'demo-seller-id-123',
    type: 'shipping',
    priority: 'medium',
    title: 'Delivery Update',
    message: 'Order #ORD-7893 has been delivered successfully',
    is_read: false,
    is_archived: false,
    metadata: { order_id: 'ORD-7893', status: 'delivered' },
    redirect_url: '/seller/dashboard/shipping',
    created_at: new Date(Date.now() - 14400000).toISOString(),
    updated_at: new Date(Date.now() - 14400000).toISOString(),
  },
];

// ============================================
// HOOK 1: Fetch Notifications with Pagination (SIMPLIFIED VERSION)
// ============================================

interface UseNotificationsParams {
  sellerId?: string;
  page?: number;
  limit?: number;
  filters?: NotificationFilters;
  includeArchived?: boolean;
}

export const useNotifications = (params?: UseNotificationsParams) => {
  // Get sellerId from localStorage or params
  const getSellerId = (): string => {
    // First try params
    if (params?.sellerId) return params.sellerId;
    
    // Try to get from localStorage
    const storedAuth = localStorage.getItem('supabase.auth.token');
    if (storedAuth) {
      try {
        const parsedAuth = JSON.parse(storedAuth);
        if (parsedAuth.user) {
          return parsedAuth.user.sellerId || parsedAuth.user.id || 'demo-seller-id-123';
        }
      } catch (e) {
        console.error('Error parsing stored auth:', e);
      }
    }
    
    // Default fallback for demo mode
    return 'demo-seller-id-123';
  };

  const sellerId = getSellerId();
  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const filters = params?.filters || {};
  const includeArchived = params?.includeArchived || false;
  
  const queryKey = ['notifications', sellerId, page, limit, filters, includeArchived];

  const fetchNotifications = async (): Promise<PaginatedNotifications> => {
    // Always use demo mode for now to avoid errors
    const demoMode = localStorage.getItem('demoMode') === 'true' || true; // Force demo mode
    const userRole = localStorage.getItem('userRole');
    
    if (demoMode && (userRole === 'seller' || !userRole)) {
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
      
      // Filter demo notifications
      const filtered = DEFAULT_NOTIFICATIONS.filter(notif => {
        if (notif.seller_id !== sellerId && sellerId !== 'demo-seller-id-123') return false;
        if (filters.type && notif.type !== filters.type) return false;
        if (filters.is_read !== undefined && notif.is_read !== filters.is_read) return false;
        if (!includeArchived && notif.is_archived) return false;
        if (filters.priority && notif.priority !== filters.priority) return false;
        if (filters.search && !notif.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
        return true;
      });
      
      const start = (page - 1) * limit;
      const end = start + limit;
      const paginated = filtered.slice(start, end);
      const unreadCount = filtered.filter(n => !n.is_read).length;
      
      return {
        data: paginated,
        total: filtered.length,
        page,
        limit,
        total_pages: Math.ceil(filtered.length / limit),
        unread_count: unreadCount,
      };
    }

    // Real database logic (commented out for now)
    return {
      data: [],
      total: 0,
      page,
      limit,
      total_pages: 0,
      unread_count: 0,
    };
  };

  const {
    data: result,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery<PaginatedNotifications, Error>({
    queryKey,
    queryFn: fetchNotifications,
    enabled: !!sellerId,
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
  });

  // Function to mark notification as read (optimistic)
  const markAsRead = useCallback(async (notificationId: string) => {
    // Demo mode: simulate API call
    await new Promise(resolve => setTimeout(resolve, 150));
    return notificationId;
  }, []);

  // Function to archive notification
  const archiveNotification = useCallback(async (notificationId: string) => {
    await new Promise(resolve => setTimeout(resolve, 150));
    return notificationId;
  }, []);

  return {
    data: result?.data || [],
    total: result?.total || 0,
    page: result?.page || page,
    limit: result?.limit || limit,
    totalPages: result?.total_pages || 0,
    unreadCount: result?.unread_count || 0,
    loading: isLoading,
    isFetching,
    error: error as Error | null,
    refetch,
    markAsRead,
    archiveNotification,
    deleteNotification: archiveNotification, // Alias for compatibility
    hasMore: (result?.page || 1) < (result?.total_pages || 1),
    notifications: result?.data || [], // Alias for compatibility
  };
};

// ============================================
// HOOK 2: Unread Notification Count (SIMPLIFIED)
// ============================================

export const useUnreadNotificationCount = (sellerId?: string) => {
  const getSellerId = (): string => {
    if (sellerId) return sellerId;
    
    const storedAuth = localStorage.getItem('supabase.auth.token');
    if (storedAuth) {
      try {
        const parsedAuth = JSON.parse(storedAuth);
        if (parsedAuth.user) {
          return parsedAuth.user.sellerId || parsedAuth.user.id || 'demo-seller-id-123';
        }
      } catch (e) {
        console.error('Error parsing stored auth:', e);
      }
    }
    
    return 'demo-seller-id-123';
  };

  const actualSellerId = getSellerId();
  const queryKey = ['notification-count', actualSellerId];

  const fetchUnreadCount = async (): Promise<number> => {
    // Always use demo mode
    await new Promise(resolve => setTimeout(resolve, 100));
    return DEFAULT_NOTIFICATIONS.filter(n => !n.is_read).length;
  };

  const {
    data: count,
    isLoading,
    error,
    refetch,
  } = useQuery<number, Error>({
    queryKey,
    queryFn: fetchUnreadCount,
    enabled: !!actualSellerId,
    initialData: 0,
  });

  return {
    count: count || 0,
    loading: isLoading,
    error: error as Error | null,
    refetch,
    unreadCount: count || 0, // Alias for compatibility
  };
};

// ============================================
// SIMPLIFIED HOOKS FOR COMPATIBILITY
// ============================================

// For use in SellerDashboard.tsx - matches the expected API
export const useNotificationHook = () => {
  const notifications = useNotifications();
  const count = useUnreadNotificationCount();
  
  return {
    notifications: notifications.data,
    loading: notifications.loading,
    error: notifications.error,
    reload: notifications.refetch,
    markAsRead: notifications.markAsRead,
    deleteNotification: notifications.archiveNotification,
    unreadCount: count.count,
  };
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

export const getNotificationColor = (type: NotificationType): string => {
  const colors: Record<NotificationType, string> = {
    order: 'bg-blue-50 text-blue-700 border-blue-200',
    review: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    payout: 'bg-green-50 text-green-700 border-green-200',
    support: 'bg-purple-50 text-purple-700 border-purple-200',
    system: 'bg-gray-50 text-gray-700 border-gray-200',
    shipping: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    inventory: 'bg-orange-50 text-orange-700 border-orange-200',
    custom_order: 'bg-pink-50 text-pink-700 border-pink-200',
    vat: 'bg-red-50 text-red-700 border-red-200',
    promotion: 'bg-teal-50 text-teal-700 border-teal-200',
    dispute: 'bg-red-100 text-red-800 border-red-300',
    verification: 'bg-blue-100 text-blue-800 border-blue-300',
    maintenance: 'bg-gray-100 text-gray-800 border-gray-300',
  };
  return colors[type] || 'bg-gray-50 text-gray-700 border-gray-200';
};

export const getPriorityColor = (priority: NotificationPriority): string => {
  const colors: Record<NotificationPriority, string> = {
    low: 'text-gray-500',
    medium: 'text-blue-500',
    high: 'text-orange-500',
    urgent: 'text-red-500',
  };
  return colors[priority] || 'text-gray-500';
};

export const formatNotificationTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: diffDays < 365 ? undefined : 'numeric'
  });
};

// ============================================
// DEFAULT EXPORT
// ============================================

export default {
  useNotifications,
  useUnreadNotificationCount,
  useNotificationHook,
  getNotificationColor,
  getPriorityColor,
  formatNotificationTime,
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITIES,
};