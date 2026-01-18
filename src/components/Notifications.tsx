import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Bell, CheckCircle, AlertCircle, Package, ShoppingBag,
  DollarSign, Star, Truck, Settings, MessageSquare,
  Clock, Eye, EyeOff, Trash2, Filter, Search,
  RefreshCw, X, Check, CheckCheck, ChevronDown,
  Calendar, FileText, Users, CreditCard, Home,
  ShoppingCart, TrendingUp, TrendingDown, Info,
  Shield, UserCheck, Mail, Phone, Download,
  MoreVertical, ExternalLink, Copy, Archive
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// ============== TYPES ==============
interface Notification {
  id: string;
  notification_id: string;
  type: 'order_update' | 'custom_order' | 'review' | 'shipping' | 'finance' | 'system' | 'support' | 'marketing';
  title: string;
  description: string;
  status: 'read' | 'unread';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  related_id?: string;
  related_type?: string;
  related_name?: string;
  created_at: string;
  action_url?: string;
  metadata?: Record<string, any>;
  sender?: string;
}

interface NotificationFilters {
  type: string;
  status: string;
  priority: string;
  dateRange: string;
  search: string;
  dateFrom: string;
  dateTo: string;
}

interface NotificationStats {
  total: number;
  unread: number;
  urgent: number;
  today: number;
  order_updates: number;
  finance_alerts: number;
}

// ============== MOCK DATA ==============
const MOCK_NOTIFICATIONS: Notification[] = [
  // Today's Notifications (High Priority)
  {
    id: '1',
    notification_id: 'NOTIF-2024-001',
    type: 'order_update',
    title: 'New Order Received',
    description: 'Order ORD-2024-015 for Custom Leather Sofa has been placed by Ahmed Al-Rashid',
    status: 'unread',
    priority: 'urgent',
    related_id: 'ORD-2024-015',
    related_type: 'order',
    related_name: 'Custom Leather Sofa',
    created_at: new Date().toISOString(),
    action_url: '/seller/orders/ORD-2024-015',
    metadata: { amount: 6755, customer: 'Ahmed Al-Rashid' }
  },
  {
    id: '2',
    notification_id: 'NOTIF-2024-002',
    type: 'custom_order',
    title: 'Custom Order Request',
    description: 'Sarah Johnson requested a custom dining table with specific measurements',
    status: 'unread',
    priority: 'high',
    related_id: 'CUST-2024-008',
    related_type: 'custom_order',
    related_name: 'Custom Dining Table',
    created_at: new Date().toISOString(),
    action_url: '/seller/custom-orders/CUST-2024-008',
    metadata: { deadline: '2024-02-15', budget: 2500 }
  },
  {
    id: '3',
    notification_id: 'NOTIF-2024-003',
    type: 'review',
    title: 'New 5-Star Review',
    description: 'Mohammed Khan left a 5-star review for your Executive Office Desk',
    status: 'unread',
    priority: 'medium',
    related_id: 'REV-2024-025',
    related_type: 'review',
    created_at: new Date().toISOString(),
    action_url: '/seller/reviews',
    metadata: { rating: 5, product: 'Executive Office Desk' }
  },

  // Yesterday's Notifications
  {
    id: '4',
    notification_id: 'NOTIF-2024-004',
    type: 'shipping',
    title: 'Order Shipped Successfully',
    description: 'Order ORD-2024-012 has been shipped to Fatima Abdullah. Tracking number: TRK-789123',
    status: 'read',
    priority: 'medium',
    related_id: 'ORD-2024-012',
    related_type: 'order',
    related_name: 'Dining Chair Set',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    action_url: '/seller/orders/ORD-2024-012',
    metadata: { tracking_number: 'TRK-789123', courier: 'Aramex' }
  },
  {
    id: '5',
    notification_id: 'NOTIF-2024-005',
    type: 'finance',
    title: 'Payment Received',
    description: 'Payment of SAR 4,890 has been received for Order ORD-2024-010',
    status: 'read',
    priority: 'medium',
    related_id: 'ORD-2024-010',
    related_type: 'order',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    action_url: '/seller/finance',
    metadata: { amount: 4890, payment_method: 'Credit Card' }
  },
  {
    id: '6',
    notification_id: 'NOTIF-2024-006',
    type: 'system',
    title: 'System Maintenance Notice',
    description: 'Scheduled maintenance on February 1, 2024 from 2:00 AM to 4:00 AM KSA Time',
    status: 'read',
    priority: 'low',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    action_url: '/seller/support',
    sender: 'System Administrator'
  },

  // Last Week's Notifications
  {
    id: '7',
    notification_id: 'NOTIF-2024-007',
    type: 'order_update',
    title: 'Order Status Updated',
    description: 'Order ORD-2024-008 status changed from "Processing" to "Ready for Shipping"',
    status: 'read',
    priority: 'medium',
    related_id: 'ORD-2024-008',
    related_type: 'order',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    action_url: '/seller/orders/ORD-2024-008'
  },
  {
    id: '8',
    notification_id: 'NOTIF-2024-008',
    type: 'custom_order',
    title: 'Custom Order Approved',
    description: 'Your custom wardrobe design has been approved by the customer',
    status: 'read',
    priority: 'high',
    related_id: 'CUST-2024-005',
    related_type: 'custom_order',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    action_url: '/seller/custom-orders/CUST-2024-005',
    metadata: { customer: 'Layla Ahmed', deadline: '2024-01-30' }
  },
  {
    id: '9',
    notification_id: 'NOTIF-2024-009',
    type: 'review',
    title: 'Review Requires Response',
    description: 'A customer left a 3-star review that requires your attention',
    status: 'unread',
    priority: 'high',
    related_id: 'REV-2024-022',
    related_type: 'review',
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    action_url: '/seller/reviews/REV-2024-022',
    metadata: { rating: 3, product: 'Bookshelf Unit' }
  },
  {
    id: '10',
    notification_id: 'NOTIF-2024-010',
    type: 'shipping',
    title: 'Delivery Delay Alert',
    description: 'Shipment for Order ORD-2024-007 delayed due to weather conditions',
    status: 'read',
    priority: 'urgent',
    related_id: 'ORD-2024-007',
    related_type: 'order',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    action_url: '/seller/orders/ORD-2024-007',
    metadata: { estimated_delay: '2-3 days', courier: 'SMSA Express' }
  },
  {
    id: '11',
    notification_id: 'NOTIF-2024-011',
    type: 'finance',
    title: 'Payout Processed',
    description: 'Your payout of SAR 15,000 has been processed and sent to your bank account',
    status: 'read',
    priority: 'medium',
    related_id: 'PAYOUT-2024-001',
    related_type: 'payout',
    created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    action_url: '/seller/finance',
    metadata: { amount: 15000, method: 'Bank Transfer' }
  },
  {
    id: '12',
    notification_id: 'NOTIF-2024-012',
    type: 'system',
    title: 'New Feature Available',
    description: 'Advanced analytics dashboard is now available in your seller panel',
    status: 'read',
    priority: 'low',
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    action_url: '/seller/reports',
    sender: 'Product Team'
  },
  {
    id: '13',
    notification_id: 'NOTIF-2024-013',
    type: 'support',
    title: 'Support Ticket Update',
    description: 'Your support ticket #TKT-789 has been updated with new information',
    status: 'unread',
    priority: 'medium',
    related_id: 'TKT-789',
    related_type: 'support_ticket',
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    action_url: '/seller/support/TKT-789'
  },
  {
    id: '14',
    notification_id: 'NOTIF-2024-014',
    type: 'marketing',
    title: 'Promotion Opportunity',
    description: 'Featured seller slot available for the upcoming Home & Living Expo',
    status: 'unread',
    priority: 'medium',
    created_at: new Date(Date.now() - 9 * 86400000).toISOString(),
    action_url: '/seller/marketing',
    sender: 'Marketing Team'
  },
  {
    id: '15',
    notification_id: 'NOTIF-2024-015',
    type: 'order_update',
    title: 'Order Cancellation Request',
    description: 'Customer requested cancellation for Order ORD-2024-006',
    status: 'unread',
    priority: 'urgent',
    related_id: 'ORD-2024-006',
    related_type: 'order',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    action_url: '/seller/orders/ORD-2024-006',
    metadata: { customer: 'Robert Chen', reason: 'Change of plans' }
  },
  {
    id: '16',
    notification_id: 'NOTIF-2024-016',
    type: 'custom_order',
    title: 'Design Revision Requested',
    description: 'Customer requested design changes for custom kitchen cabinets',
    status: 'read',
    priority: 'high',
    related_id: 'CUST-2024-003',
    related_type: 'custom_order',
    created_at: new Date(Date.now() - 11 * 86400000).toISOString(),
    action_url: '/seller/custom-orders/CUST-2024-003'
  },
  {
    id: '17',
    notification_id: 'NOTIF-2024-017',
    type: 'review',
    title: 'Product Review Flagged',
    description: 'A review for your product has been flagged and requires moderation',
    status: 'read',
    priority: 'high',
    related_id: 'REV-2024-020',
    related_type: 'review',
    created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
    action_url: '/seller/reviews/REV-2024-020'
  },
  {
    id: '18',
    notification_id: 'NOTIF-2024-018',
    type: 'shipping',
    title: 'Delivery Attempt Failed',
    description: 'Delivery attempt failed for Order ORD-2024-005. Customer not available',
    status: 'read',
    priority: 'urgent',
    related_id: 'ORD-2024-005',
    related_type: 'order',
    created_at: new Date(Date.now() - 13 * 86400000).toISOString(),
    action_url: '/seller/orders/ORD-2024-005',
    metadata: { attempts: 2, next_attempt: '2024-01-20' }
  },
  {
    id: '19',
    notification_id: 'NOTIF-2024-019',
    type: 'finance',
    title: 'VAT Filing Reminder',
    description: 'Quarterly VAT filing deadline approaching on January 31, 2024',
    status: 'unread',
    priority: 'high',
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    action_url: '/seller/finance/vat',
    metadata: { deadline: '2024-01-31', amount_due: 4250 }
  },
  {
    id: '20',
    notification_id: 'NOTIF-2024-020',
    type: 'system',
    title: 'API Rate Limit Warning',
    description: 'You are approaching your API rate limit for this month',
    status: 'read',
    priority: 'low',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    action_url: '/seller/settings/api',
    sender: 'System'
  },
  {
    id: '21',
    notification_id: 'NOTIF-2024-021',
    type: 'support',
    title: 'Support Ticket Resolved',
    description: 'Your support ticket #TKT-456 has been marked as resolved',
    status: 'read',
    priority: 'low',
    related_id: 'TKT-456',
    related_type: 'support_ticket',
    created_at: new Date(Date.now() - 16 * 86400000).toISOString(),
    action_url: '/seller/support'
  },
  {
    id: '22',
    notification_id: 'NOTIF-2024-022',
    type: 'marketing',
    title: 'Sales Performance Report',
    description: 'Your monthly sales performance report for December 2023 is ready',
    status: 'read',
    priority: 'medium',
    created_at: new Date(Date.now() - 17 * 86400000).toISOString(),
    action_url: '/seller/reports',
    metadata: { period: 'December 2023', growth: '+12.5%' }
  },
  {
    id: '23',
    notification_id: 'NOTIF-2024-023',
    type: 'order_update',
    title: 'Bulk Order Received',
    description: 'Corporate bulk order for 20 office chairs from XYZ Corporation',
    status: 'read',
    priority: 'urgent',
    related_id: 'ORD-2024-019',
    related_type: 'order',
    created_at: new Date(Date.now() - 18 * 86400000).toISOString(),
    action_url: '/seller/orders/ORD-2024-019',
    metadata: { quantity: 20, amount: 6400, customer: 'XYZ Corporation' }
  },
  {
    id: '24',
    notification_id: 'NOTIF-2024-024',
    type: 'custom_order',
    title: 'Material Availability Alert',
    description: 'Requested wood material for custom order is out of stock',
    status: 'read',
    priority: 'high',
    related_id: 'CUST-2024-002',
    related_type: 'custom_order',
    created_at: new Date(Date.now() - 19 * 86400000).toISOString(),
    action_url: '/seller/custom-orders/CUST-2024-002'
  },
  {
    id: '25',
    notification_id: 'NOTIF-2024-025',
    type: 'review',
    title: 'Review Response Received',
    description: 'Customer responded to your review reply',
    status: 'unread',
    priority: 'medium',
    related_id: 'REV-2024-018',
    related_type: 'review',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    action_url: '/seller/reviews/REV-2024-018'
  }
];

// ============== UTILITY FUNCTIONS ==============
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString('en-SA', {
      day: 'numeric',
      month: 'short',
      year: diffDays > 365 ? 'numeric' : undefined
    });
  }
};

const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('en-SA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getTypeIcon = (type: string) => {
  const icons = {
    order_update: ShoppingBag,
    custom_order: Settings,
    review: Star,
    shipping: Truck,
    finance: DollarSign,
    system: AlertCircle,
    support: MessageSquare,
    marketing: TrendingUp
  };
  return icons[type as keyof typeof icons] || Bell;
};

const getTypeColor = (type: string): string => {
  const colors = {
    order_update: 'bg-blue-100 text-blue-800',
    custom_order: 'bg-purple-100 text-purple-800',
    review: 'bg-yellow-100 text-yellow-800',
    shipping: 'bg-green-100 text-green-800',
    finance: 'bg-emerald-100 text-emerald-800',
    system: 'bg-gray-100 text-gray-800',
    support: 'bg-orange-100 text-orange-800',
    marketing: 'bg-pink-100 text-pink-800'
  };
  return colors[type as keyof typeof colors] || colors.system;
};

const getPriorityColor = (priority: string): string => {
  const colors = {
    urgent: 'bg-red-100 text-red-800 border-red-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-gray-100 text-gray-800 border-gray-200'
  };
  return colors[priority as keyof typeof colors] || colors.low;
};

// ============== MAIN COMPONENT ==============
const Notifications: React.FC = () => {
  // State Management
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [loading, setLoading] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<NotificationFilters>({
    type: 'all',
    status: 'all',
    priority: 'all',
    dateRange: 'all',
    search: '',
    dateFrom: '',
    dateTo: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);

  // Load Notifications from Supabase
  const loadNotifications = async () => {
    try {
      setLoading(true);
      
      // Check for demo mode
      const demoMode = localStorage.getItem('demoMode');
      if (demoMode === 'true') {
        setTimeout(() => {
          setLoading(false);
        }, 500);
        return;
      }
      
      // Real Supabase query
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      setNotifications(data as Notification[]);
      
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize
  useEffect(() => {
    loadNotifications();
    
    // Set up real-time subscription
    if (realtimeEnabled) {
      const setupRealtime = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const channel = supabase
          .channel('notifications')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`
            },
            (payload) => {
              // New notification received
              const newNotification = payload.new as Notification;
              setNotifications(prev => [newNotification, ...prev]);
              
              // Show toast notification
              showToast(`New notification: ${newNotification.title}`);
            }
          )
          .subscribe();
        
        return () => {
          supabase.removeChannel(channel);
        };
      };
      
      setupRealtime();
    }
  }, [realtimeEnabled]);

  // Show Toast (mock implementation)
  const showToast = (message: string) => {
    // In production, use a toast library
    console.log('Toast:', message);
    // Could implement a custom toast component here
  };

  // Filtered Notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter(notification => {
      // Type filter
      if (filters.type !== 'all' && notification.type !== filters.type) {
        return false;
      }
      
      // Status filter
      if (filters.status !== 'all' && notification.status !== filters.status) {
        return false;
      }
      
      // Priority filter
      if (filters.priority !== 'all' && notification.priority !== filters.priority) {
        return false;
      }
      
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          notification.title.toLowerCase().includes(searchLower) ||
          notification.description.toLowerCase().includes(searchLower) ||
          notification.notification_id.toLowerCase().includes(searchLower) ||
          (notification.related_name && notification.related_name.toLowerCase().includes(searchLower)) ||
          (notification.sender && notification.sender.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }
      
      // Date range filter
      const notificationDate = new Date(notification.created_at);
      
      if (filters.dateRange === 'today') {
        const today = new Date();
        if (notificationDate.toDateString() !== today.toDateString()) return false;
      } else if (filters.dateRange === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        if (notificationDate < weekAgo) return false;
      } else if (filters.dateRange === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        if (notificationDate < monthAgo) return false;
      } else if (filters.dateRange === 'custom') {
        if (filters.dateFrom) {
          const fromDate = new Date(filters.dateFrom);
          if (notificationDate < fromDate) return false;
        }
        if (filters.dateTo) {
          const toDate = new Date(filters.dateTo);
          toDate.setHours(23, 59, 59, 999);
          if (notificationDate > toDate) return false;
        }
      }
      
      return true;
    });
  }, [notifications, filters]);

  // Notification Statistics
  const stats = useMemo(() => {
    const today = new Date();
    const todayStr = today.toDateString();
    
    return {
      total: notifications.length,
      unread: notifications.filter(n => n.status === 'unread').length,
      urgent: notifications.filter(n => n.priority === 'urgent').length,
      today: notifications.filter(n => 
        new Date(n.created_at).toDateString() === todayStr
      ).length,
      order_updates: notifications.filter(n => n.type === 'order_update').length,
      finance_alerts: notifications.filter(n => n.type === 'finance').length
    };
  }, [notifications]);

  // Handle Mark as Read
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      // Optimistic update
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, status: 'read' as const }
            : notif
        )
      );
      
      // Update in Supabase
      const { error } = await supabase
        .from('notifications')
        .update({ status: 'read' })
        .eq('id', notificationId);
      
      if (error) throw error;
      
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Revert optimistic update on error
      loadNotifications();
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!window.confirm('Mark all notifications as read?')) return;
    
    try {
      // Optimistic update
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, status: 'read' as const }))
      );
      
      // Update in Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('notifications')
          .update({ status: 'read' })
          .eq('user_id', user.id)
          .eq('status', 'unread');
        
        if (error) throw error;
      }
      
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      loadNotifications();
    }
  };

  // Handle Delete Notification
  const handleDeleteNotification = async (notificationId: string) => {
    if (!window.confirm('Delete this notification?')) return;
    
    try {
      // Optimistic update
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      setSelectedNotifications(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
      
      // Delete from Supabase
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
      
      if (error) throw error;
      
    } catch (error) {
      console.error('Error deleting notification:', error);
      loadNotifications();
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Delete all notifications? This action cannot be undone.')) return;
    
    try {
      setNotifications([]);
      
      // Delete all from Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('notifications')
          .delete()
          .eq('user_id', user.id);
        
        if (error) throw error;
      }
      
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      loadNotifications();
    }
  };

  // Handle Bulk Actions
  const handleBulkMarkAsRead = () => {
    if (selectedNotifications.size === 0) return;
    
    try {
      const selectedIds = Array.from(selectedNotifications);
      
      // Optimistic update
      setNotifications(prev => 
        prev.map(notif => 
          selectedNotifications.has(notif.id)
            ? { ...notif, status: 'read' as const }
            : notif
        )
      );
      
      // Clear selection
      setSelectedNotifications(new Set());
      
      // Update in Supabase
      supabase
        .from('notifications')
        .update({ status: 'read' })
        .in('id', selectedIds);
        
    } catch (error) {
      console.error('Error in bulk mark as read:', error);
      loadNotifications();
    }
  };

  const handleBulkDelete = () => {
    if (selectedNotifications.size === 0) return;
    
    if (!window.confirm(`Delete ${selectedNotifications.size} selected notifications?`)) return;
    
    try {
      const selectedIds = Array.from(selectedNotifications);
      
      // Optimistic update
      setNotifications(prev => 
        prev.filter(notif => !selectedNotifications.has(notif.id))
      );
      
      // Clear selection
      setSelectedNotifications(new Set());
      
      // Delete from Supabase
      supabase
        .from('notifications')
        .delete()
        .in('id', selectedIds);
        
    } catch (error) {
      console.error('Error in bulk delete:', error);
      loadNotifications();
    }
  };

  // Toggle Selection
  const toggleNotificationSelection = (notificationId: string) => {
    setSelectedNotifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId);
      } else {
        newSet.add(notificationId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedNotifications.size === filteredNotifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(filteredNotifications.map(n => n.id)));
    }
  };

  // Handle View Details
  const handleViewDetails = (notification: Notification) => {
    setSelectedNotification(notification);
    setShowDetailsModal(true);
    
    // Mark as read when viewing details
    if (notification.status === 'unread') {
      handleMarkAsRead(notification.id);
    }
  };

  // Handle Filter Reset
  const handleResetFilters = () => {
    setFilters({
      type: 'all',
      status: 'all',
      priority: 'all',
      dateRange: 'all',
      search: '',
      dateFrom: '',
      dateTo: ''
    });
    setShowFilters(false);
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600">Stay updated with your marketplace activities</p>
          </div>
          <div className="flex items-center space-x-3 mt-4 md:mt-0">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Real-time:</span>
              <button
                onClick={() => setRealtimeEnabled(!realtimeEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  realtimeEnabled ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    realtimeEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <button
              onClick={loadNotifications}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Bell className="w-5 h-5 text-gray-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unread</p>
                <p className="text-2xl font-bold text-blue-600">{stats.unread}</p>
              </div>
              <EyeOff className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Urgent</p>
                <p className="text-2xl font-bold text-red-600">{stats.urgent}</p>
              </div>
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today</p>
                <p className="text-2xl font-bold text-green-600">{stats.today}</p>
              </div>
              <Clock className="w-5 h-5 text-green-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Order Updates</p>
                <p className="text-2xl font-bold text-purple-600">{stats.order_updates}</p>
              </div>
              <ShoppingBag className="w-5 h-5 text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Actions Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search */}
            <div className="relative flex-1 lg:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search notifications..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={stats.unread === 0}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    stats.unread === 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  Mark All as Read
                </button>
                <button
                  onClick={handleDeleteAll}
                  disabled={notifications.length === 0}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    notifications.length === 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="p-4 border-t border-gray-200 bg-gray-50 mt-4 rounded-b-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="order_update">Order Updates</option>
                    <option value="custom_order">Custom Orders</option>
                    <option value="review">Reviews & Ratings</option>
                    <option value="shipping">Shipping & Delivery</option>
                    <option value="finance">Finance & Wallet</option>
                    <option value="system">System Alerts</option>
                    <option value="support">Support</option>
                    <option value="marketing">Marketing</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="unread">Unread</option>
                    <option value="read">Read</option>
                  </select>
                </div>

                {/* Priority Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={filters.priority}
                    onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Priority</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                {/* Date Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date Range
                  </label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>

                {/* Reset Button */}
                <div className="flex items-end">
                  <button
                    onClick={handleResetFilters}
                    className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>

              {/* Custom Date Range */}
              {filters.dateRange === 'custom' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      From Date
                    </label>
                    <input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      To Date
                    </label>
                    <input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bulk Actions Bar */}
        {selectedNotifications.size > 0 && (
          <div className="p-4 border-b border-gray-200 bg-blue-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">
                  {selectedNotifications.size} notification(s) selected
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleBulkMarkAsRead}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Mark as Read
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  Delete Selected
                </button>
                <button
                  onClick={() => setSelectedNotifications(new Set())}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {filteredNotifications.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {/* Select All Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedNotifications.size === filteredNotifications.length && filteredNotifications.length > 0}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="ml-3 text-sm text-gray-700">
                  Select all ({filteredNotifications.length})
                </span>
              </div>
            </div>

            {/* Notifications */}
            {filteredNotifications.map((notification) => {
              const Icon = getTypeIcon(notification.type);
              const isSelected = selectedNotifications.has(notification.id);
              
              return (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    notification.status === 'unread' ? 'bg-blue-50' : ''
                  } ${isSelected ? 'bg-blue-100' : ''}`}
                >
                  <div className="flex items-start space-x-4">
                    {/* Checkbox */}
                    <div className="pt-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleNotificationSelection(notification.id)}
                        className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </div>
                    
                    {/* Icon */}
                    <div className={`p-2 rounded-lg ${getTypeColor(notification.type)}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className={`font-semibold ${
                              notification.status === 'unread' ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                              {notification.priority}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.description}
                          </p>
                          
                          {/* Metadata */}
                          <div className="flex items-center space-x-4 mt-2">
                            <span className="text-xs text-gray-500 flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {formatDate(notification.created_at)}
                            </span>
                            
                            {notification.related_name && (
                              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                {notification.related_name}
                              </span>
                            )}
                            
                            {notification.sender && (
                              <span className="text-xs text-gray-500">
                                From: {notification.sender}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewDetails(notification)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          {notification.status === 'unread' ? (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                              title="Mark as Read"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="p-1.5 text-gray-600 hover:bg-gray-50 rounded-lg"
                              title="Mark as Unread"
                            >
                              <EyeOff className="w-4 h-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleDeleteNotification(notification.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="py-12 text-center">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No notifications found</h3>
            <p className="text-gray-500 text-sm mb-6">
              {filters.type !== 'all' || filters.search || filters.dateRange !== 'all'
                ? 'Try adjusting your filters'
                : 'You\'re all caught up! New notifications will appear here.'}
            </p>
            {(filters.type !== 'all' || filters.search || filters.dateRange !== 'all') && (
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredNotifications.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 rounded-b-lg">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">1</span> to{' '}
            <span className="font-medium">{filteredNotifications.length}</span> of{' '}
            <span className="font-medium">{filteredNotifications.length}</span> notifications
          </div>
          <div className="flex space-x-2">
            <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
              Previous
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded text-sm bg-blue-50 text-blue-600 border-blue-200">
              1
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
              Next
            </button>
          </div>
        </div>
      )}

      {/* Notification Details Modal */}
      {showDetailsModal && selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Notification Details</h2>
                  <p className="text-gray-600">{selectedNotification.notification_id}</p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${getTypeColor(selectedNotification.type)}`}>
                  {React.createElement(getTypeIcon(selectedNotification.type), { className: "w-6 h-6" })}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xl font-bold text-gray-900">{selectedNotification.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedNotification.priority)}`}>
                      {selectedNotification.priority}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedNotification.status === 'unread' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedNotification.status}
                    </span>
                  </div>
                  <p className="text-gray-600 mt-2">{formatDateTime(selectedNotification.created_at)}</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Description</h4>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-gray-900">{selectedNotification.description}</p>
                </div>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Related Info */}
                {selectedNotification.related_id && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Related Information</h4>
                    <div className="space-y-2">
                      <p className="text-sm">
                        <span className="font-medium text-gray-700">ID:</span> {selectedNotification.related_id}
                      </p>
                      {selectedNotification.related_name && (
                        <p className="text-sm">
                          <span className="font-medium text-gray-700">Name:</span> {selectedNotification.related_name}
                        </p>
                      )}
                      {selectedNotification.related_type && (
                        <p className="text-sm">
                          <span className="font-medium text-gray-700">Type:</span> {selectedNotification.related_type}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Additional Info */}
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Additional Information</h4>
                  <div className="space-y-2">
                    {selectedNotification.sender && (
                      <p className="text-sm">
                        <span className="font-medium text-gray-700">Sender:</span> {selectedNotification.sender}
                      </p>
                    )}
                    {selectedNotification.action_url && (
                      <p className="text-sm">
                        <span className="font-medium text-gray-700">Action URL:</span> {selectedNotification.action_url}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Metadata JSON */}
              {selectedNotification.metadata && Object.keys(selectedNotification.metadata).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Metadata</h4>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {JSON.stringify(selectedNotification.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                  onClick={() => handleDeleteNotification(selectedNotification.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  Delete
                </button>
                <button
                  onClick={() => {
                    if (selectedNotification.status === 'unread') {
                      handleMarkAsRead(selectedNotification.id);
                    }
                    setShowDetailsModal(false);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;