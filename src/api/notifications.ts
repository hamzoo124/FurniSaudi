// src/api/notifications.ts

import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

// ============================================
// TYPES & INTERFACES
// ============================================

export type NotificationType = 
  | 'info'        // General information
  | 'warning'     // Important alerts
  | 'alert'       // Critical alerts
  | 'promo'       // Promotional offers
  | 'order'       // Order updates
  | 'review'      // Review updates
  | 'shipping'    // Shipping updates
  | 'payment'     // Payment updates
  | 'support'     // Support messages
  | 'system';     // System announcements

export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export interface NotificationMetadata {
  order_id?: string;
  product_id?: string;
  review_id?: string;
  shipping_id?: string;
  payment_id?: string;
  support_ticket_id?: string;
  action_url?: string;
  action_label?: string;
  [key: string]: any;
}

export interface Notification {
  id: string;
  seller_id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  is_read: boolean;
  is_archived: boolean;
  metadata: NotificationMetadata | null;
  expires_at?: string | null;
  read_at?: string | null;
  created_at: string;
  updated_at: string;
  
  // Extended fields for UI
  avatar_url?: string;
  sender_name?: string;
  sender_type?: 'system' | 'customer' | 'admin';
}

export interface NotificationSummary {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  priority: NotificationPriority;
  created_at: string;
  time_ago: string;
}

export interface PaginatedNotifications {
  notifications: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  unread_count: number;
}

export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  archived: number;
  by_type: Record<NotificationType, number>;
  by_priority: Record<NotificationPriority, number>;
  today_count: number;
  week_count: number;
}

export interface NotificationPreferences {
  email_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
  order_updates: boolean;
  review_notifications: boolean;
  promo_notifications: boolean;
  system_announcements: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface RealtimeNotificationEvent {
  event: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Notification;
  old?: Notification;
}

export type NotificationCallback = (event: RealtimeNotificationEvent) => void;

// ============================================
// CONSTANTS & CONFIG
// ============================================

const VALID_NOTIFICATION_TYPES: NotificationType[] = [
  'info', 'warning', 'alert', 'promo', 'order', 
  'review', 'shipping', 'payment', 'support', 'system'
];

const VALID_PRIORITIES: NotificationPriority[] = [
  'low', 'medium', 'high', 'critical'
];

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const NOTIFICATION_EXPIRY_DAYS = 90; // Auto-archive after 90 days

// ============================================
// VALIDATION & HELPER FUNCTIONS
// ============================================

function validateNotificationType(type: string): type is NotificationType {
  return VALID_NOTIFICATION_TYPES.includes(type as NotificationType);
}

function validatePriority(priority: string): priority is NotificationPriority {
  return VALID_PRIORITIES.includes(priority as NotificationPriority);
}

function parsePaginationParams(page?: number, limit?: number): { offset: number; limit: number } {
  const pageNum = Math.max(1, page || 1);
  const pageSize = Math.min(Math.max(1, limit || DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);
  
  return {
    offset: (pageNum - 1) * pageSize,
    limit: pageSize
  };
}

function formatTimeAgo(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return then.toLocaleDateString();
}

// ============================================
// NOTIFICATION MANAGEMENT API
// ============================================

/**
 * Fetch paginated notifications for a seller
 */
export async function getNotifications(
  sellerId: string,
  page: number = 1,
  limit: number = DEFAULT_PAGE_SIZE,
  includeArchived: boolean = false
): Promise<ApiResponse<PaginatedNotifications>> {
  try {
    if (!sellerId) {
      throw new Error('Seller ID is required');
    }

    const { offset, limit: pageSize } = parsePaginationParams(page, limit);

    // Build base query
    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    // Exclude archived unless explicitly requested
    if (!includeArchived) {
      query = query.eq('is_archived', false);
    }

    // Apply pagination
    query = query.range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    // Get unread count separately for accurate stats
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', sellerId)
      .eq('is_read', false)
      .eq('is_archived', false);

    // Format data with time ago for UI
    const formattedNotifications: Notification[] = (data || []).map(notification => ({
      ...notification,
      time_ago: formatTimeAgo(notification.created_at)
    }));

    // Calculate pagination metadata
    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    const result: PaginatedNotifications = {
      notifications: formattedNotifications,
      total,
      page,
      limit: pageSize,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      unread_count: unreadCount || 0
    };

    return {
      data: result,
      error: null,
      success: true
    };

  } catch (error) {
    console.error('Error fetching notifications:', error);
    
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch notifications',
      success: false
    };
  }
}

/**
 * Get unread notification count for a seller
 */
export async function getUnreadNotificationCount(
  sellerId: string
): Promise<ApiResponse<number>> {
  try {
    if (!sellerId) {
      throw new Error('Seller ID is required');
    }

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', sellerId)
      .eq('is_read', false)
      .eq('is_archived', false);

    if (error) {
      throw error;
    }

    return {
      data: count || 0,
      error: null,
      success: true
    };

  } catch (error) {
    console.error('Error fetching unread count:', error);
    
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch unread count',
      success: false
    };
  }
}

/**
 * Mark a specific notification as read
 */
export async function markNotificationRead(
  notificationId: string,
  sellerId?: string
): Promise<ApiResponse<Notification>> {
  try {
    if (!notificationId) {
      throw new Error('Notification ID is required');
    }

    // Verify notification exists and belongs to seller if sellerId provided
    if (sellerId) {
      const { data: existingNotification, error: fetchError } = await supabase
        .from('notifications')
        .select('seller_id, is_read')
        .eq('id', notificationId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      if (existingNotification.seller_id !== sellerId) {
        throw new Error('Unauthorized: Notification does not belong to this seller');
      }

      if (existingNotification.is_read) {
        throw new Error('Notification is already read');
      }
    }

    const updateData = {
      is_read: true,
      read_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('notifications')
      .update(updateData)
      .eq('id', notificationId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      data: data as Notification,
      error: null,
      success: true
    };

  } catch (error) {
    console.error('Error marking notification as read:', error);
    
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to mark notification as read',
      success: false
    };
  }
}

/**
 * Mark all notifications as read for a seller
 */
export async function markAllNotificationsRead(
  sellerId: string
): Promise<ApiResponse<{ updated_count: number }>> {
  try {
    if (!sellerId) {
      throw new Error('Seller ID is required');
    }

    // Get count of unread notifications first
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', sellerId)
      .eq('is_read', false)
      .eq('is_archived', false);

    if (unreadCount === 0) {
      return {
        data: { updated_count: 0 },
        error: null,
        success: true
      };
    }

    const updateData = {
      is_read: true,
      read_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('notifications')
      .update(updateData)
      .eq('seller_id', sellerId)
      .eq('is_read', false)
      .eq('is_archived', false);

    if (error) {
      throw error;
    }

    return {
      data: { updated_count: unreadCount || 0 },
      error: null,
      success: true
    };

  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to mark all notifications as read',
      success: false
    };
  }
}

/**
 * Archive a notification (soft delete)
 */
export async function archiveNotification(
  notificationId: string,
  sellerId?: string
): Promise<ApiResponse<Notification>> {
  try {
    if (!notificationId) {
      throw new Error('Notification ID is required');
    }

    // Verify ownership if sellerId provided
    if (sellerId) {
      const { data: existingNotification } = await supabase
        .from('notifications')
        .select('seller_id')
        .eq('id', notificationId)
        .single();

      if (existingNotification?.seller_id !== sellerId) {
        throw new Error('Unauthorized: Notification does not belong to this seller');
      }
    }

    const updateData = {
      is_archived: true,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('notifications')
      .update(updateData)
      .eq('id', notificationId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      data: data as Notification,
      error: null,
      success: true
    };

  } catch (error) {
    console.error('Error archiving notification:', error);
    
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to archive notification',
      success: false
    };
  }
}

/**
 * Bulk mark notifications as read
 */
export async function bulkMarkNotificationsRead(
  notificationIds: string[],
  sellerId: string
): Promise<ApiResponse<{ updated: number; failed: string[] }>> {
  try {
    if (!notificationIds.length || !sellerId) {
      throw new Error('Notification IDs and seller ID are required');
    }

    const failedIds: string[] = [];
    const updatePromises = notificationIds.map(async (id) => {
      try {
        const result = await markNotificationRead(id, sellerId);
        if (!result.success) {
          failedIds.push(id);
        }
        return result.success;
      } catch {
        failedIds.push(id);
        return false;
      }
    });

    await Promise.all(updatePromises);

    return {
      data: {
        updated: notificationIds.length - failedIds.length,
        failed: failedIds
      },
      error: failedIds.length > 0 ? `Failed to update ${failedIds.length} notifications` : null,
      success: failedIds.length === 0
    };

  } catch (error) {
    console.error('Error in bulk mark read:', error);
    
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to bulk mark notifications as read',
      success: false
    };
  }
}

/**
 * Get notification statistics for dashboard
 */
export async function getNotificationStats(
  sellerId: string
): Promise<ApiResponse<NotificationStats>> {
  try {
    if (!sellerId) {
      throw new Error('Seller ID is required');
    }

    // Get all notifications for this seller (excluding archived)
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('type, priority, is_read, created_at')
      .eq('seller_id', sellerId)
      .eq('is_archived', false);

    if (error) throw error;

    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Initialize counters
    const stats: NotificationStats = {
      total: 0,
      unread: 0,
      read: 0,
      archived: 0,
      by_type: {} as Record<NotificationType, number>,
      by_priority: {} as Record<NotificationPriority, number>,
      today_count: 0,
      week_count: 0
    };

    // Initialize type and priority counters
    VALID_NOTIFICATION_TYPES.forEach(type => {
      stats.by_type[type] = 0;
    });
    
    VALID_PRIORITIES.forEach(priority => {
      stats.by_priority[priority] = 0;
    });

    // Calculate statistics
    notifications?.forEach(notification => {
      stats.total++;
      
      if (notification.is_read) {
        stats.read++;
      } else {
        stats.unread++;
      }

      // Count by type
      if (validateNotificationType(notification.type)) {
        stats.by_type[notification.type]++;
      }

      // Count by priority
      if (validatePriority(notification.priority)) {
        stats.by_priority[notification.priority]++;
      }

      // Count recent notifications
      const createdDate = new Date(notification.created_at);
      if (createdDate.toDateString() === today.toDateString()) {
        stats.today_count++;
      }
      if (createdDate >= weekAgo) {
        stats.week_count++;
      }
    });

    return {
      data: stats,
      error: null,
      success: true
    };

  } catch (error) {
    console.error('Error fetching notification stats:', error);
    
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch notification statistics',
      success: false
    };
  }
}

/**
 * Create a new notification (for system/admin use)
 */
export async function createNotification(
  sellerId: string,
  title: string,
  message: string,
  type: NotificationType = 'info',
  priority: NotificationPriority = 'medium',
  metadata?: NotificationMetadata
): Promise<ApiResponse<Notification>> {
  try {
    if (!sellerId || !title || !message) {
      throw new Error('Seller ID, title, and message are required');
    }

    if (!validateNotificationType(type)) {
      throw new Error(`Invalid notification type: ${type}`);
    }

    if (!validatePriority(priority)) {
      throw new Error(`Invalid priority: ${priority}`);
    }

    const notificationData = {
      seller_id: sellerId,
      title,
      message,
      type,
      priority,
      metadata: metadata || null,
      is_read: false,
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      data: data as Notification,
      error: null,
      success: true
    };

  } catch (error) {
    console.error('Error creating notification:', error);
    
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to create notification',
      success: false
    };
  }
}

/**
 * Get or update notification preferences
 */
export async function getNotificationPreferences(
  sellerId: string
): Promise<ApiResponse<NotificationPreferences>> {
  try {
    if (!sellerId) {
      throw new Error('Seller ID is required');
    }

    const { data, error } = await supabase
      .from('seller_preferences')
      .select('notification_preferences')
      .eq('seller_id', sellerId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    // Default preferences
    const defaultPreferences: NotificationPreferences = {
      email_enabled: true,
      push_enabled: true,
      in_app_enabled: true,
      order_updates: true,
      review_notifications: true,
      promo_notifications: true,
      system_announcements: true,
      quiet_hours_enabled: false,
      quiet_hours_start: '22:00',
      quiet_hours_end: '08:00'
    };

    const preferences = data?.notification_preferences || defaultPreferences;

    return {
      data: preferences,
      error: null,
      success: true
    };

  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch notification preferences',
      success: false
    };
  }
}

export async function updateNotificationPreferences(
  sellerId: string,
  preferences: Partial<NotificationPreferences>
): Promise<ApiResponse<NotificationPreferences>> {
  try {
    if (!sellerId) {
      throw new Error('Seller ID is required');
    }

    // Get existing preferences
    const { data: existingData } = await supabase
      .from('seller_preferences')
      .select('notification_preferences')
      .eq('seller_id', sellerId)
      .single();

    const existingPreferences = existingData?.notification_preferences || {};
    const mergedPreferences = { ...existingPreferences, ...preferences };

    const { data, error } = await supabase
      .from('seller_preferences')
      .upsert({
        seller_id: sellerId,
        notification_preferences: mergedPreferences,
        updated_at: new Date().toISOString()
      }, { onConflict: 'seller_id' })
      .select('notification_preferences')
      .single();

    if (error) {
      throw error;
    }

    return {
      data: data.notification_preferences,
      error: null,
      success: true
    };

  } catch (error) {
    console.error('Error updating notification preferences:', error);
    
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update notification preferences',
      success: false
    };
  }
}

// ============================================
// REALTIME NOTIFICATIONS
// ============================================

const realtimeChannels = new Map<string, RealtimeChannel>();

/**
 * Subscribe to real-time notifications for a seller
 */
export function subscribeNotificationsRealtime(
  sellerId: string,
  callback: NotificationCallback
): RealtimeChannel {
  try {
    if (!sellerId) {
      throw new Error('Seller ID is required');
    }

    // Clean up existing channel for this seller
    const existingChannel = realtimeChannels.get(sellerId);
    if (existingChannel) {
      existingChannel.unsubscribe();
      realtimeChannels.delete(sellerId);
    }

    // Create new channel with optimized parameters
    const channel = supabase
      .channel(`notifications:${sellerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `seller_id=eq.${sellerId}`
        },
        (payload) => {
          const event: RealtimeNotificationEvent = {
            event: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            new: payload.new as Notification,
            old: payload.old as Notification
          };
          callback(event);
        }
      )
      .subscribe((status) => {
        console.log(`Realtime subscription status for seller ${sellerId}:`, status);
        
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Realtime notifications enabled for seller ${sellerId}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`❌ Realtime subscription error for seller ${sellerId}`);
          // Attempt reconnection after delay
          setTimeout(() => {
            subscribeNotificationsRealtime(sellerId, callback);
          }, 5000);
        }
      });

    // Store channel reference for cleanup
    realtimeChannels.set(sellerId, channel);

    return channel;

  } catch (error) {
    console.error('Error setting up realtime subscription:', error);
    throw error;
  }
}

/**
 * Unsubscribe from real-time notifications
 */
export function unsubscribeNotificationsRealtime(sellerId: string): boolean {
  try {
    const channel = realtimeChannels.get(sellerId);
    if (channel) {
      channel.unsubscribe();
      realtimeChannels.delete(sellerId);
      console.log(`✅ Unsubscribed from realtime notifications for seller ${sellerId}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error unsubscribing from realtime:', error);
    return false;
  }
}

/**
 * Clean up all real-time subscriptions
 */
export function cleanupAllRealtimeSubscriptions(): void {
  realtimeChannels.forEach((channel, sellerId) => {
    try {
      channel.unsubscribe();
      console.log(`🧹 Cleaned up realtime subscription for seller ${sellerId}`);
    } catch (error) {
      console.error(`Error cleaning up subscription for seller ${sellerId}:`, error);
    }
  });
  realtimeChannels.clear();
}

// ============================================
// MOCK DATA FOR TESTING
// ============================================

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif_001',
    seller_id: 'seller_123',
    title: 'New Order Received',
    message: 'You have received a new order #ORD-7894 from Ahmed Al-Mansoor',
    type: 'order',
    priority: 'high',
    is_read: false,
    is_archived: false,
    metadata: {
      order_id: 'ORD-7894',
      action_url: '/seller/orders/ORD-7894',
      action_label: 'View Order'
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'notif_002',
    seller_id: 'seller_123',
    title: 'Product Review Submitted',
    message: 'Sarah Johnson left a 5-star review for "Premium Leather Sofa"',
    type: 'review',
    priority: 'medium',
    is_read: true,
    is_archived: false,
    metadata: {
      product_id: 'prod_001',
      review_id: 'rev_001',
      action_url: '/seller/reviews'
    },
    read_at: new Date(Date.now() - 3600000).toISOString(),
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'notif_003',
    seller_id: 'seller_123',
    title: 'Low Stock Alert',
    message: 'Product "Modern Coffee Table" is running low on stock (3 items left)',
    type: 'warning',
    priority: 'high',
    is_read: false,
    is_archived: false,
    metadata: {
      product_id: 'prod_002',
      action_url: '/seller/products/prod_002',
      action_label: 'Restock Now'
    },
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString()
  }
];

// ============================================
// AUTO-CLEANUP AND MAINTENANCE
// ============================================

/**
 * Auto-archive old notifications (should be run periodically)
 */
export async function autoArchiveOldNotifications(): Promise<ApiResponse<{ archived_count: number }>> {
  try {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() - NOTIFICATION_EXPIRY_DAYS);

    const { count, error } = await supabase
      .from('notifications')
      .update({
        is_archived: true,
        updated_at: new Date().toISOString()
      })
      .eq('is_archived', false)
      .lt('created_at', expiryDate.toISOString())
      .select('*', { count: 'exact', head: true });

    if (error) {
      throw error;
    }

    console.log(`Auto-archived ${count || 0} old notifications`);

    return {
      data: { archived_count: count || 0 },
      error: null,
      success: true
    };

  } catch (error) {
    console.error('Error auto-archiving notifications:', error);
    
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to auto-archive notifications',
      success: false
    };
  }
}

// ============================================
// EXPORT ALL TYPES & FUNCTIONS
// ============================================

export type {
  Notification,
  NotificationSummary,
  PaginatedNotifications,
  NotificationStats,
  NotificationPreferences,
  RealtimeNotificationEvent,
  NotificationCallback,
  ApiResponse
};