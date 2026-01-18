// src/hooks/useAdminCoupons.ts
import { useState, useEffect, useCallback } from 'react';
import { adminCouponAPI } from '@/api/adminCoupons';
import { supabase } from '@/lib/supabase';

export const useAdminCoupons = () => {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    search: '',
    expired: 'false'
  });
  const [analytics, setAnalytics] = useState<any>(null);

  const fetchCoupons = useCallback(async (page: number = 1, customFilters?: any) => {
    try {
      setLoading(true);
      setError(null);
      
      const currentFilters = customFilters || filters;
      const result = await adminCouponAPI.getCoupons(pagination.limit, page, currentFilters);
      
      setCoupons(result.data || []);
      setPagination({
        page,
        limit: pagination.limit,
        total: result.total || 0,
        totalPages: Math.ceil((result.total || 0) / pagination.limit)
      });
    } catch (err: any) {
      setError(err.message || 'Failed to fetch coupons');
      console.error('Error fetching coupons:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit]);

  const fetchCoupon = useCallback(async (couponId: string) => {
    try {
      setLoading(true);
      const coupon = await adminCouponAPI.getCoupon(couponId);
      return { success: true, data: coupon };
    } catch (err: any) {
      setError(err.message || 'Failed to fetch coupon');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const createCoupon = useCallback(async (couponData: any) => {
    try {
      setLoading(true);
      setError(null);
      
      const newCoupon = await adminCouponAPI.createCoupon(couponData);
      setCoupons(prev => [newCoupon, ...prev]);
      
      // Update analytics
      if (analytics) {
        setAnalytics(prev => ({
          ...prev,
          total_coupons: prev.total_coupons + 1,
          active_coupons: couponData.is_active ? prev.active_coupons + 1 : prev.active_coupons,
          by_type: {
            ...prev.by_type,
            [couponData.discount_type]: prev.by_type[couponData.discount_type] + 1
          }
        }));
      }
      
      return { success: true, data: newCoupon };
    } catch (err: any) {
      setError(err.message || 'Failed to create coupon');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [analytics]);

  const updateCoupon = useCallback(async (couponId: string, updates: any) => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedCoupon = await adminCouponAPI.updateCoupon(couponId, updates);
      
      setCoupons(prev => 
        prev.map(coupon => coupon.id === couponId ? updatedCoupon : coupon)
      );
      
      return { success: true, data: updatedCoupon };
    } catch (err: any) {
      setError(err.message || 'Failed to update coupon');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteCoupon = useCallback(async (couponId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await adminCouponAPI.deleteCoupon(couponId);
      
      const deletedCoupon = coupons.find(c => c.id === couponId);
      setCoupons(prev => prev.filter(coupon => coupon.id !== couponId));
      
      // Update analytics
      if (analytics && deletedCoupon) {
        setAnalytics(prev => ({
          ...prev,
          total_coupons: prev.total_coupons - 1,
          active_coupons: deletedCoupon.is_active ? prev.active_coupons - 1 : prev.active_coupons,
          expired_coupons: new Date(deletedCoupon.valid_until) < new Date() 
            ? prev.expired_coupons - 1 
            : prev.expired_coupons,
          by_type: {
            ...prev.by_type,
            [deletedCoupon.discount_type]: prev.by_type[deletedCoupon.discount_type] - 1
          }
        }));
      }
      
      return { success: true };
    } catch (err: any) {
      setError(err.message || 'Failed to delete coupon');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [coupons, analytics]);

  const toggleCouponStatus = useCallback(async (couponId: string, isActive: boolean) => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedCoupon = await adminCouponAPI.toggleCouponStatus(couponId, isActive);
      
      setCoupons(prev => 
        prev.map(coupon => coupon.id === couponId ? updatedCoupon : coupon)
      );
      
      // Update analytics
      if (analytics) {
        setAnalytics(prev => ({
          ...prev,
          active_coupons: isActive ? prev.active_coupons + 1 : prev.active_coupons - 1
        }));
      }
      
      return { success: true, data: updatedCoupon };
    } catch (err: any) {
      setError(err.message || 'Failed to toggle coupon status');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [analytics]);

  const getCouponStats = useCallback(async (couponId: string) => {
    try {
      setLoading(true);
      const stats = await adminCouponAPI.getCouponStats(couponId);
      return { success: true, data: stats };
    } catch (err: any) {
      setError(err.message || 'Failed to fetch coupon stats');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const validateCoupon = useCallback(async (code: string, amount: number = 0) => {
    try {
      const coupon = await adminCouponAPI.validateCoupon(code, amount);
      return { success: true, data: coupon };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, []);

  const applyCoupon = useCallback(async (code: string) => {
    try {
      await adminCouponAPI.applyCoupon(code);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, []);

  const bulkCreateCoupons = useCallback(async (couponsData: any[]) => {
    try {
      setLoading(true);
      setError(null);
      
      const createdCoupons = await adminCouponAPI.bulkCreateCoupons(couponsData);
      setCoupons(prev => [...createdCoupons, ...prev]);
      
      return { success: true, data: createdCoupons };
    } catch (err: any) {
      setError(err.message || 'Failed to bulk create coupons');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkUpdateCoupons = useCallback(async (couponIds: string[], updates: any) => {
    try {
      setLoading(true);
      setError(null);
      
      await adminCouponAPI.bulkUpdateCoupons(couponIds, updates);
      
      // Update local state
      setCoupons(prev => 
        prev.map(coupon => 
          couponIds.includes(coupon.id) 
            ? { ...coupon, ...updates, updated_at: new Date().toISOString() }
            : coupon
        )
      );
      
      return { success: true, updated: couponIds.length };
    } catch (err: any) {
      setError(err.message || 'Failed to bulk update coupons');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkDeleteCoupons = useCallback(async (couponIds: string[]) => {
    try {
      setLoading(true);
      setError(null);
      
      await adminCouponAPI.bulkDeleteCoupons(couponIds);
      
      setCoupons(prev => prev.filter(coupon => !couponIds.includes(coupon.id)));
      
      return { success: true, deleted: couponIds.length };
    } catch (err: any) {
      setError(err.message || 'Failed to bulk delete coupons');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }// src/hooks/useAdminCoupons.ts
import { useState, useEffect, useCallback } from 'react';
import { adminCouponAPI } from '@/api/adminCoupons';

export const useAdminCoupons = () => {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    search: '',
    expired: 'false'
  });
  const [analytics, setAnalytics] = useState<any>(null);

  const fetchCoupons = useCallback(async (page: number = 1, customFilters?: any) => {
    try {
      setLoading(true);
      setError(null);
      
      const currentFilters = customFilters || filters;
      const result = await adminCouponAPI.getCoupons(pagination.limit, page, currentFilters);
      
      setCoupons(result.data || []);
      setPagination({
        page,
        limit: pagination.limit,
        total: result.total || 0,
        totalPages: Math.ceil((result.total || 0) / pagination.limit)
      });
    } catch (err: any) {
      setError(err.message || 'Failed to fetch coupons');
      console.error('Error fetching coupons:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit]);

  const fetchCoupon = useCallback(async (couponId: string) => {
    try {
      setLoading(true);
      const coupon = await adminCouponAPI.getCoupon(couponId);
      return { success: true, data: coupon };
    } catch (err: any) {
      setError(err.message || 'Failed to fetch coupon');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const createCoupon = useCallback(async (couponData: any) => {
    try {
      setLoading(true);
      setError(null);
      
      const newCoupon = await adminCouponAPI.createCoupon(couponData);
      setCoupons(prev => [newCoupon, ...prev]);
      
      // Update analytics
      if (analytics) {
        setAnalytics(prev => ({
          ...prev,
          total_coupons: prev.total_coupons + 1,
          active_coupons: couponData.is_active ? prev.active_coupons + 1 : prev.active_coupons,
          by_type: {
            ...prev.by_type,
            [couponData.discount_type]: prev.by_type[couponData.discount_type] + 1
          }
        }));
      }
      
      return { success: true, data: newCoupon };
    } catch (err: any) {
      setError(err.message || 'Failed to create coupon');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [analytics]);

  const updateCoupon = useCallback(async (couponId: string, updates: any) => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedCoupon = await adminCouponAPI.updateCoupon(couponId, updates);
      
      setCoupons(prev => 
        prev.map(coupon => coupon.id === couponId ? updatedCoupon : coupon)
      );
      
      return { success: true, data: updatedCoupon };
    } catch (err: any) {
      setError(err.message || 'Failed to update coupon');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteCoupon = useCallback(async (couponId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await adminCouponAPI.deleteCoupon(couponId);
      
      const deletedCoupon = coupons.find(c => c.id === couponId);
      setCoupons(prev => prev.filter(coupon => coupon.id !== couponId));
      
      // Update analytics
      if (analytics && deletedCoupon) {
        setAnalytics(prev => ({
          ...prev,
          total_coupons: prev.total_coupons - 1,
          active_coupons: deletedCoupon.is_active ? prev.active_coupons - 1 : prev.active_coupons,
          expired_coupons: new Date(deletedCoupon.valid_until) < new Date() 
            ? prev.expired_coupons - 1 
            : prev.expired_coupons,
          by_type: {
            ...prev.by_type,
            [deletedCoupon.discount_type]: prev.by_type[deletedCoupon.discount_type] - 1
          }
        }));
      }
      
      return { success: true };
    } catch (err: any) {
      setError(err.message || 'Failed to delete coupon');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [coupons, analytics]);

  const toggleCouponStatus = useCallback(async (couponId: string, isActive: boolean) => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedCoupon = await adminCouponAPI.toggleCouponStatus(couponId, isActive);
      
      setCoupons(prev => 
        prev.map(coupon => coupon.id === couponId ? updatedCoupon : coupon)
      );
      
      // Update analytics
      if (analytics) {
        setAnalytics(prev => ({
          ...prev,
          active_coupons: isActive ? prev.active_coupons + 1 : prev.active_coupons - 1
        }));
      }
      
      return { success: true, data: updatedCoupon };
    } catch (err: any) {
      setError(err.message || 'Failed to toggle coupon status');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [analytics]);

  const getCouponStats = useCallback(async (couponId: string) => {
    try {
      setLoading(true);
      const stats = await adminCouponAPI.getCouponStats(couponId);
      return { success: true, data: stats };
    } catch (err: any) {
      setError(err.message || 'Failed to fetch coupon stats');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const validateCoupon = useCallback(async (code: string, amount: number = 0) => {
    try {
      const coupon = await adminCouponAPI.validateCoupon(code, amount);
      return { success: true, data: coupon };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, []);

  const applyCoupon = useCallback(async (code: string) => {
    try {
      await adminCouponAPI.applyCoupon(code);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, []);

  const bulkCreateCoupons = useCallback(async (couponsData: any[]) => {
    try {
      setLoading(true);
      setError(null);
      
      const createdCoupons = await adminCouponAPI.bulkCreateCoupons(couponsData);
      setCoupons(prev => [...createdCoupons, ...prev]);
      
      return { success: true, data: createdCoupons };
    } catch (err: any) {
      setError(err.message || 'Failed to bulk create coupons');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkUpdateCoupons = useCallback(async (couponIds: string[], updates: any) => {
    try {
      setLoading(true);
      setError(null);
      
      await adminCouponAPI.bulkUpdateCoupons(couponIds, updates);
      
      // Update local state
      setCoupons(prev => 
        prev.map(coupon => 
          couponIds.includes(coupon.id) 
            ? { ...coupon, ...updates, updated_at: new Date().toISOString() }
            : coupon
        )
      );
      
      return { success: true, updated: couponIds.length };
    } catch (err: any) {
      setError(err.message || 'Failed to bulk update coupons');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkDeleteCoupons = useCallback(async (couponIds: string[]) => {
    try {
      setLoading(true);
      setError(null);
      
      await adminCouponAPI.bulkDeleteCoupons(couponIds);
      
      setCoupons(prev => prev.filter(coupon => !couponIds.includes(coupon.id)));
      
      return { success: true, deleted: couponIds.length };
    } catch (err: any) {
      setError(err.message || 'Failed to bulk delete coupons');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getExpiringCoupons = useCallback(async (days: number = 7) => {
    try {
      setLoading(true);
      const coupons = await adminCouponAPI.getExpiringCoupons(days);
      return { success: true, data: coupons };
    } catch (err: any) {
      setError(err.message || 'Failed to fetch expiring coupons');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const searchCoupons = useCallback(async (query: string) => {
    try {
      setLoading(true);
      const results = await adminCouponAPI.searchCoupons(query);
      return { success: true, data: results };
    } catch (err: any) {
      setError(err.message || 'Failed to search coupons');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const analyticsData = await adminCouponAPI.getCouponAnalytics();
      setAnalytics(analyticsData);
      return { success: true, data: analyticsData };
    } catch (err: any) {
      setError(err.message || 'Failed to fetch analytics');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Update filters
  const updateFilters = useCallback((newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Change page
  const changePage = useCallback((page: number) => {
    fetchCoupons(page);
  }, [fetchCoupons]);

  // Change limit
  const changeLimit = useCallback((limit: number) => {
    setPagination(prev => ({ ...prev, limit }));
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchCoupons();
    fetchAnalytics();
  }, [fetchCoupons, fetchAnalytics]);

  return {
    coupons,
    loading,
    error,
    pagination,
    filters,
    analytics,
    fetchCoupons,
    fetchCoupon,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    toggleCouponStatus,
    getCouponStats,
    validateCoupon,
    applyCoupon,
    bulkCreateCoupons,
    bulkUpdateCoupons,
    bulkDeleteCoupons,
    getExpiringCoupons,
    searchCoupons,
    fetchAnalytics,
    updateFilters,
    changePage,
    changeLimit
  };
};
  }, []);

  const getExpiringCoupons = useCallback(async (days: number = 7) => {
    try {
      set