// src/hooks/useAdminFeatures.ts (NEW FILE)
import { useState, useEffect, useCallback } from 'react';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

export const useAdminFeatures = () => {
  const [adminMetrics, setAdminMetrics] = useState<any>(null);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAdminMetrics = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch comprehensive metrics
      const [
        { data: usersData },
        { data: productsData },
        { data: ordersData },
        { data: sellersData },
        { data: paymentsData }
      ] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('products').select('*'),
        supabase.from('orders').select('*'),
        supabase.from('sellers').select('*'),
        supabase.from('payouts').select('*')
      ]);

      const metrics = {
        totalUsers: usersData?.length || 0,
        totalProducts: productsData?.length || 0,
        totalOrders: ordersData?.length || 0,
        activeSellers: sellersData?.filter(s => s.status === 'active').length || 0,
        pendingApprovals: sellersData?.filter(s => s.approval_status === 'pending').length || 0,
        totalRevenue: ordersData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0,
        commissionEarned: paymentsData?.reduce((sum, payment) => sum + (payment.commission_amount || 0), 0) || 0
      };

      setAdminMetrics(metrics);
    } catch (error) {
      console.error('Error fetching admin metrics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCoupons = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (error) {
      console.error('Error fetching coupons:', error);
    }
  }, []);

  const fetchReports = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('admin_reports')
        .select('*')
        .order('generated_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  }, []);

  const createCoupon = useCallback(async (couponData: any) => {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .insert([{
          ...couponData,
          created_by: 'admin',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      
      setCoupons(prev => [data, ...prev]);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, []);

  const toggleCouponStatus = useCallback(async (couponId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: isActive })
        .eq('id', couponId);

      if (error) throw error;
      
      setCoupons(prev => prev.map(coupon => 
        coupon.id === couponId ? { ...coupon, is_active: isActive } : coupon
      ));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, []);

  const generateReport = useCallback(async (reportType: string, period: string) => {
    try {
      const reportData = {
        type: reportType,
        period,
        data: {},
        generated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('admin_reports')
        .insert([reportData])
        .select()
        .single();

      if (error) throw error;
      
      setReports(prev => [data, ...prev]);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, []);

  useEffect(() => {
    fetchAdminMetrics();
    fetchCoupons();
    fetchReports();
  }, [fetchAdminMetrics, fetchCoupons, fetchReports]);

  return {
    adminMetrics,
    coupons,
    reports,
    loading,
    fetchAdminMetrics,
    fetchCoupons,
    fetchReports,
    createCoupon,
    toggleCouponStatus,
    generateReport
  };
};