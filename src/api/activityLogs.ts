// src/api/activityLogs.ts
import { supabase } from '@/lib/supabase';


export interface ActivityLog {
  id: string;
  user_id: string;
  user_type: 'admin' | 'seller' | 'buyer';
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface ActivityStats {
  total_activities: number;
  today_activities: number;
  admin_actions: number;
  seller_actions: number;
  buyer_actions: number;
  most_active_user?: {
    user_id: string;
    action_count: number;
    user_type: string;
  };
}

/**
 * Log an activity
 */
export const logActivity = async (
  activityData: Omit<ActivityLog, 'id' | 'created_at'> & {
    ip_address?: string;
    user_agent?: string;
  }
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.from('activity_logs').insert({
      ...activityData,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error logging activity:', error);
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error in logActivity:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to log activity',
    };
  }
};

/**
 * Fetch activity logs
 */
export const fetchActivityLogs = async (
  filters?: {
    user_type?: string;
    action?: string;
    target_type?: string;
    start_date?: string;
    end_date?: string;
    user_id?: string;
  },
  limit: number = 50
): Promise<ActivityLog[]> => {
  try {
    let query = supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (filters?.user_type) {
      query = query.eq('user_type', filters.user_type);
    }
    if (filters?.action) {
      query = query.ilike('action', `%${filters.action}%`);
    }
    if (filters?.target_type) {
      query = query.eq('target_type', filters.target_type);
    }
    if (filters?.start_date) {
      query = query.gte('created_at', filters.start_date);
    }
    if (filters?.end_date) {
      query = query.lte('created_at', filters.end_date);
    }
    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching activity logs:', error);
      throw error;
    }

    return data as ActivityLog[];
  } catch (error) {
    console.error('Error in fetchActivityLogs:', error);
    return [];
  }
};

/**
 * Fetch recent activities for dashboard
 */
export const fetchRecentActivities = async (
  limit: number = 10
): Promise<ActivityLog[]> => {
  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent activities:', error);
      throw error;
    }

    return data as ActivityLog[];
  } catch (error) {
    console.error('Error in fetchRecentActivities:', error);
    return [];
  }
};

/**
 * Fetch activity statistics
 */
export const fetchActivityStats = async (): Promise<ActivityStats | null> => {
  try {
    const { data: activities, error } = await supabase
      .from('activity_logs')
      .select('user_type, user_id, created_at');

    if (error) throw error;

    let totalActivities = 0;
    let todayActivities = 0;
    let adminActions = 0;
    let sellerActions = 0;
    let buyerActions = 0;
    
    const userActionCounts: Record<string, { count: number; user_type: string }> = {};
    const today = new Date().toISOString().split('T')[0];

    activities?.forEach(activity => {
      totalActivities++;
      
      // Count by user type
      if (activity.user_type === 'admin') {
        adminActions++;
      } else if (activity.user_type === 'seller') {
        sellerActions++;
      } else if (activity.user_type === 'buyer') {
        buyerActions++;
      }

      // Count today's activities
      const activityDate = new Date(activity.created_at).toISOString().split('T')[0];
      if (activityDate === today) {
        todayActivities++;
      }

      // Count activities per user
      if (activity.user_id) {
        if (!userActionCounts[activity.user_id]) {
          userActionCounts[activity.user_id] = {
            count: 0,
            user_type: activity.user_type,
          };
        }
        userActionCounts[activity.user_id].count++;
      }
    });

    // Find most active user
    let mostActiveUser = null;
    Object.entries(userActionCounts).forEach(([userId, data]) => {
      if (!mostActiveUser || data.count > mostActiveUser.action_count) {
        mostActiveUser = {
          user_id: userId,
          action_count: data.count,
          user_type: data.user_type,
        };
      }
    });

    return {
      total_activities: totalActivities,
      today_activities: todayActivities,
      admin_actions: adminActions,
      seller_actions: sellerActions,
      buyer_actions: buyerActions,
      most_active_user: mostActiveUser || undefined,
    };
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    return null;
  }
};

/**
 * Search activity logs
 */
export const searchActivityLogs = async (
  searchTerm: string,
  limit: number = 20
): Promise<ActivityLog[]> => {
  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .or(`action.ilike.%${searchTerm}%,target_type.ilike.%${searchTerm}%,details.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error searching activity logs:', error);
      throw error;
    }

    return data as ActivityLog[];
  } catch (error) {
    console.error('Error in searchActivityLogs:', error);
    return [];
  }
};

/**
 * Clear old activity logs (admin only)
 */
export const clearOldActivityLogs = async (
  olderThanDays: number = 90
): Promise<{ success: boolean; deletedCount?: number; error?: string }> => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const { error } = await supabase
      .from('activity_logs')
      .delete()
      .lt('created_at', cutoffDate.toISOString());

    if (error) {
      console.error('Error clearing old activity logs:', error);
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error in clearOldActivityLogs:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to clear old activity logs',
    };
  }
};

/**
 * Export activity logs
 */
export const exportActivityLogs = async (
  startDate: string,
  endDate: string,
  format: 'csv' | 'json' = 'csv'
): Promise<{ data: string; filename: string } | null> => {
  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (format === 'csv') {
      const headers = Object.keys(data[0] || {}).join(',');
      const rows = data.map(item => 
        Object.values(item).map(value => {
          if (typeof value === 'object') {
            return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
          }
          return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
        }).join(',')
      ).join('\n');
      
      return {
        data: `${headers}\n${rows}`,
        filename: `activity_logs_${startDate}_to_${endDate}.csv`,
      };
    } else {
      return {
        data: JSON.stringify(data, null, 2),
        filename: `activity_logs_${startDate}_to_${endDate}.json`,
      };
    }
  } catch (error) {
    console.error('Error exporting activity logs:', error);
    return null;
  }
};

/**
 * Track admin dashboard login
 */
export const logAdminLogin = async (
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> => {
  try {
    await logActivity({
      user_id: userId,
      user_type: 'admin',
      action: 'LOGIN',
      target_type: 'system',
      target_id: 'dashboard',
      details: {
        login_type: 'dashboard',
        timestamp: new Date().toISOString(),
      },
      ip_address: ipAddress,
      user_agent: userAgent,
    });
  } catch (error) {
    console.error('Error logging admin login:', error);
  }
};

/**
 * Track seller action
 */
export const logSellerAction = async (
  sellerId: string,
  action: string,
  targetType: string,
  targetId: string,
  details?: Record<string, any>
): Promise<void> => {
  try {
    await logActivity({
      user_id: sellerId,
      user_type: 'seller',
      action,
      target_type: targetType,
      target_id: targetId,
      details: {
        ...details,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error logging seller action:', error);
  }
};

/**
 * Track buyer action
 */
export const logBuyerAction = async (
  buyerId: string,
  action: string,
  targetType: string,
  targetId: string,
  details?: Record<string, any>
): Promise<void> => {
  try {
    await logActivity({
      user_id: buyerId,
      user_type: 'buyer',
      action,
      target_type: targetType,
      target_id: targetId,
      details: {
        ...details,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error logging buyer action:', error);
  }
};