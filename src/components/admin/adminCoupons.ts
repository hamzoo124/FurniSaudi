// src/api/adminCoupons.ts
import { supabaseAdmin as supabase } from '@/lib/supabase';

export const adminCouponAPI = {
  // Get all coupons with pagination
  getCoupons: async (limit: number = 20, page: number = 1, filters: any = {}) => {
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    let query = supabase
      .from('coupons')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.status && filters.status !== 'all') {
      query = query.eq('is_active', filters.status === 'active');
    }

    if (filters.type && filters.type !== 'all') {
      query = query.eq('discount_type', filters.type);
    }

    if (filters.search) {
      query = query.or(`code.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    if (filters.expired === 'true') {
      const now = new Date().toISOString();
      query = query.lt('valid_until', now);
    }

    const { data, error, count } = await query.range(start, end);

    if (error) throw error;
    return { data, total: count, page, limit };
  },

  // Get coupon by ID
  getCoupon: async (couponId: string) => {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('id', couponId)
      .single();

    if (error) throw error;
    return data;
  },

  // Create coupon
  createCoupon: async (couponData: {
    code: string;
    discount_type: 'percentage' | 'fixed_amount';
    discount_value: number;
    min_purchase_amount?: number;
    max_uses: number;
    valid_from: string;
    valid_until: string;
    description?: string;
    is_active?: boolean;
    created_by?: string;
  }) => {
    // Check if code already exists
    const { data: existing } = await supabase
      .from('coupons')
      .select('code')
      .eq('code', couponData.code.toUpperCase())
      .single();

    if (existing) {
      throw new Error('Coupon code already exists');
    }

    const { data, error } = await supabase
      .from('coupons')
      .insert([{
        ...couponData,
        code: couponData.code.toUpperCase(),
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
  },

  // Get coupon usage stats
  getCouponStats: async (couponId: string) => {
    const { data: coupon, error: couponError } = await supabase
      .from('coupons')
      .select('*')
      .eq('id', couponId)
      .single();

    if (couponError) throw couponError;

    // Get orders that used this coupon
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('total_amount, created_at')
      .eq('coupon_code', coupon.code)
      .order('created_at', { ascending: false });

    if (ordersError) throw ordersError;

    const stats = {
      total_uses: orders?.length || 0,
      total_revenue: orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0,
      remaining_uses: coupon.max_uses - (coupon.used_count || 0),
      usage_rate: coupon.max_uses > 0 ? ((coupon.used_count || 0) / coupon.max_uses) * 100 : 0,
      recent_orders: orders?.slice(0, 10) || []
    };

    return stats;
  },

  // Validate coupon
  validateCoupon: async (code: string, amount: number = 0) => {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Coupon not found');
      }
      throw error;
    }

    const now = new Date();
    const validFrom = new Date(data.valid_from);
    const validUntil = new Date(data.valid_until);

    if (now < validFrom) {
      throw new Error('Coupon is not yet valid');
    }

    if (now > validUntil) {
      throw new Error('Coupon has expired');
    }

    if (data.used_count >= data.max_uses) {
      throw new Error('Coupon usage limit reached');
    }

    if (amount > 0 && data.min_purchase_amount && amount < data.min_purchase_amount) {
      throw new Error(`Minimum purchase amount of $${data.min_purchase_amount} required`);
    }

    return data;
  },

  // Apply coupon (increment usage)
  applyCoupon: async (code: string) => {
    const { data: coupon, error: couponError } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (couponError) throw couponError;

    const { error } = await supabase
      .from('coupons')
      .update({
        used_count: (coupon.used_count || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', coupon.id);

    if (error) throw error;
    return { success: true };
  },

  // Bulk create coupons
  bulkCreateCoupons: async (coupons: any[]) => {
    const couponsWithMeta = coupons.map(coupon => ({
      ...coupon,
      code: coupon.code.toUpperCase(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('coupons')
      .insert(couponsWithMeta)
      .select();

    if (error) throw error;
    return data;
  },

  // Bulk update coupons
  bulkUpdateCoupons: async (couponIds: string[], updates: any) => {
    const { error } = await supabase
      .from('coupons')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .in('id', couponIds);

    if (error) throw error;
    return { success: true, updated: couponIds.length };
  },

  // Bulk delete coupons
  bulkDeleteCoupons: async (couponIds: string[]) => {
    const { error } = await supabase
      .from('coupons')
      .delete()
      .in('id', couponIds);

    if (error) throw error;
    return { success: true, deleted: couponIds.length };
  },

  // Get coupons expiring soon (within 7 days)
  getExpiringCoupons: async (days: number = 7) => {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);

    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .gte('valid_until', now.toISOString())
      .lte('valid_until', futureDate.toISOString())
      .eq('is_active', true)
      .order('valid_until', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Search coupons
  searchCoupons: async (query: string, limit: number = 20) => {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .or(`code.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  // Get coupon analytics
  getCouponAnalytics: async () => {
    const { data: coupons, error } = await supabase
      .from('coupons')
      .select('*');

    if (error) throw error;

    const analytics = {
      total_coupons: coupons.length,
      active_coupons: coupons.filter(c => c.is_active).length,
      expired_coupons: coupons.filter(c => new Date(c.valid_until) < new Date()).length,
      total_uses: coupons.reduce((sum, c) => sum + (c.used_count || 0), 0),
      total_discount_given: coupons.reduce((sum, c) => {
        const discountValue = c.discount_type === 'percentage' 
          ? (c.used_count || 0) * (c.discount_value / 100) * 100 // Assuming average order value of $100
          : (c.used_count || 0) * c.discount_value;
        return sum + discountValue;
      }, 0),
      by_type: {
        percentage: coupons.filter(c => c.discount_type === 'percentage').length,
        fixed_amount: coupons.filter(c => c.discount_type === 'fixed_amount').length
      }
    };

    return analytics;
  }
};