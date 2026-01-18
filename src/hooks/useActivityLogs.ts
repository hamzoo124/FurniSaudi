// src/hooks/useActivityLogs.ts
import { supabase } from '@/lib/supabase';
import { useState, useCallback, useEffect } from 'react';
import { supabaseAdmin as supabase } from '../lib/supabase';


import {
  ActivityLog,
  ActivityStats,
  logActivity,
  fetchActivityLogs,
  fetchRecentActivities,
  fetchActivityStats,
  searchActivityLogs,
  clearOldActivityLogs,
  exportActivityLogs,
  logAdminLogin,
  logSellerAction,
  logBuyerAction,
} from '../api/activityLogs';

export const useActivityLogs = () => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState({
    activities: false,
    recent: false,
    stats: false,
    action: false,
  });
  const [error, setError] = useState<string | null>(null);

  // Log activity
  const logNewActivity = useCallback(async (
    activityData: Omit<ActivityLog, 'id' | 'created_at'> & {
      ip_address?: string;
      user_agent?: string;
    }
  ) => {
    setError(null);
    
    try {
      const result = await logActivity(activityData);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to log activity';
      console.error('Error logging activity:', err);
      return { success: false, error: message };
    }
  }, []);

  // Fetch activity logs
  const fetchAllActivities = useCallback(async (filters?: any, limit?: number) => {
    setLoading(prev => ({ ...prev, activities: true }));
    setError(null);
    
    try {
      const activitiesData = await fetchActivityLogs(filters, limit);
      setActivities(activitiesData);
      return activitiesData;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch activities';
      setError(message);
      console.error('Error fetching activities:', err);
      return [];
    } finally {
      setLoading(prev => ({ ...prev, activities: false }));
    }
  }, []);

  // Fetch recent activities
  const fetchRecent = useCallback(async (limit: number = 10) => {
    setLoading(prev => ({ ...prev, recent: true }));
    setError(null);
    
    try {
      const recentData = await fetchRecentActivities(limit);
      setRecentActivities(recentData);
      return recentData;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch recent activities';
      setError(message);
      console.error('Error fetching recent activities:', err);
      return [];
    } finally {
      setLoading(prev => ({ ...prev, recent: false }));
    }
  }, []);

  // Fetch activity statistics
  const fetchAllActivityStats = useCallback(async () => {
    setLoading(prev => ({ ...prev, stats: true }));
    setError(null);
    
    try {
      const statsData = await fetchActivityStats();
      setStats(statsData);
      return statsData;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch activity stats';
      setError(message);
      console.error('Error fetching activity stats:', err);
      return null;
    } finally {
      setLoading(prev => ({ ...prev, stats: false }));
    }
  }, []);

  // Search activity logs
  const searchActivities = useCallback(async (searchTerm: string, limit: number = 20) => {
    setLoading(prev => ({ ...prev, activities: true }));
    setError(null);
    
    try {
      const searchResults = await searchActivityLogs(searchTerm, limit);
      setActivities(searchResults);
      return searchResults;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to search activities';
      setError(message);
      console.error('Error searching activities:', err);
      return [];
    } finally {
      setLoading(prev => ({ ...prev, activities: false }));
    }
  }, []);

  // Clear old activity logs
  const clearOldLogs = useCallback(async (olderThanDays: number = 90) => {
    setLoading(prev => ({ ...prev, action: true }));
    setError(null);
    
    try {
      const result = await clearOldActivityLogs(olderThanDays);
      if (result.success) {
        // Refresh data
        await Promise.all([
          fetchAllActivities(),
          fetchRecent(),
          fetchAllActivityStats(),
        ]);
      }
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to clear old logs';
      setError(message);
      console.error('Error clearing old logs:', err);
      return { success: false, error: message };
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  }, [fetchAllActivities, fetchRecent, fetchAllActivityStats]);

  // Export activity logs
  const exportLogs = useCallback(async (
    startDate: string,
    endDate: string,
    format: 'csv' | 'json' = 'csv'
  ) => {
    setError(null);
    
    try {
      const result = await exportActivityLogs(startDate, endDate, format);
      if (!result) {
        throw new Error('Failed to export logs');
      }
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to export activity logs';
      setError(message);
      console.error('Error exporting activity logs:', err);
      return null;
    }
  }, []);

  // Convenience methods for specific action types
  const logAdminAction = useCallback(async (
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ) => {
    return logAdminLogin(userId, ipAddress, userAgent);
  }, []);

  const logSellerActivity = useCallback(async (
    sellerId: string,
    action: string,
    targetType: string,
    targetId: string,
    details?: Record<string, any>
  ) => {
    return logSellerAction(sellerId, action, targetType, targetId, details);
  }, []);

  const logBuyerActivity = useCallback(async (
    buyerId: string,
    action: string,
    targetType: string,
    targetId: string,
    details?: Record<string, any>
  ) => {
    return logBuyerAction(buyerId, action, targetType, targetId, details);
  }, []);

  // Initialize data on mount
  useEffect(() => {
    const initialize = async () => {
      await Promise.all([
        fetchRecent(10),
        fetchAllActivityStats(),
      ]);
    };
    
    initialize();
  }, [fetchRecent, fetchAllActivityStats]);

  return {
    // Data
    activities,
    recentActivities,
    stats,
    
    // Loading states
    loading,
    
    // Errors
    error,
    
    // Methods
    logActivity: logNewActivity,
    fetchAllActivities,
    fetchRecent,
    fetchAllActivityStats,
    searchActivities,
    clearOldLogs,
    exportLogs,
    logAdminLogin: logAdminAction,
    logSellerAction: logSellerActivity,
    logBuyerAction: logBuyerActivity,
    
    // Helper computed values
    getAdminActivities: () => activities.filter(a => a.user_type === 'admin'),
    getSellerActivities: () => activities.filter(a => a.user_type === 'seller'),
    getBuyerActivities: () => activities.filter(a => a.user_type === 'buyer'),
    getTodayActivities: () => {
      const today = new Date().toISOString().split('T')[0];
      return activities.filter(a => 
        new Date(a.created_at).toISOString().split('T')[0] === today
      );
    },
    getActivitiesByAction: (action: string) => 
      activities.filter(a => a.action === action),
  };
};