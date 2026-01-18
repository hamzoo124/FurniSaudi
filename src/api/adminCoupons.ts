// src/api/adminCoupons.ts (NEW)
import { supabase } from '@/lib/supabase';

export const adminCouponAPI = {
  // Get all coupons
  getCoupons: async () => {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Create coupon
  createCoupon: async (couponData: any) => {
    const { data, error } = await supabase
      .from('coupons')
      .insert([{
        ...couponData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update coupon
  updateCoupon: async (couponId: string, updates: any) => {
    const { data, error } = await supabase
      .from('coupons')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', couponId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete coupon
  deleteCoupon: async (couponId: string) => {
    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', couponId);

    if (error) throw error;
    return { success: true };
  },

  // Toggle coupon status
  toggleCouponStatus: async (couponId: string, isActive: boolean) => {
    const { data, error } = await supabase
      .from('coupons')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', couponId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};