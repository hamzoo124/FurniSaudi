// src/api/advertising.ts
import { supabase } from '@/lib/supabase';



export interface Advertisement {
  id: string;
  title: string;
  description: string;
  ad_type: 'banner' | 'sidebar' | 'product_feature' | 'homepage' | 'email';
  position: string;
  target_url: string;
  image_url: string;
  seller_id?: string;
  product_id?: string;
  category_id?: string;
  budget: number;
  spent: number;
  status: 'draft' | 'pending' | 'active' | 'paused' | 'completed' | 'rejected';
  start_date: string;
  end_date: string;
  impressions: number;
  clicks: number;
  ctr: number; // Click-through rate
  created_by: string;
  approved_by?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface AdStats {
  total_ads: number;
  active_ads: number;
  pending_ads: number;
  total_impressions: number;
  total_clicks: number;
  total_spent: number;
  average_ctr: number;
  today_impressions: number;
  today_clicks: number;
}

export interface AdPerformance {
  ad_id: string;
  title: string;
  impressions: number;
  clicks: number;
  ctr: number;
  spent: number;
  conversions: number;
  conversion_rate: number;
  roi: number;
}

/**
 * Fetch all advertisements
 */
export const fetchAdvertisements = async (
  filters?: {
    status?: string;
    ad_type?: string;
    seller_id?: string;
    start_date?: string;
    end_date?: string;
  }
): Promise<Advertisement[]> => {
  try {
    let query = supabase
      .from('advertisements')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.ad_type) {
      query = query.eq('ad_type', filters.ad_type);
    }
    if (filters?.seller_id) {
      query = query.eq('seller_id', filters.seller_id);
    }
    if (filters?.start_date) {
      query = query.gte('created_at', filters.start_date);
    }
    if (filters?.end_date) {
      query = query.lte('created_at', filters.end_date);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching advertisements:', error);
      throw error;
    }

    return data as Advertisement[];
  } catch (error) {
    console.error('Error in fetchAdvertisements:', error);
    return [];
  }
};

/**
 * Fetch advertisement by ID
 */
export const fetchAdvertisementById = async (
  adId: string
): Promise<Advertisement | null> => {
  try {
    const { data, error } = await supabase
      .from('advertisements')
      .select(`
        *,
        sellers:seller_id (*),
        products:product_id (*)
      `)
      .eq('id', adId)
      .single();

    if (error) {
      console.error('Error fetching advertisement:', error);
      throw error;
    }

    return data as Advertisement;
  } catch (error) {
    console.error('Error in fetchAdvertisementById:', error);
    return null;
  }
};

/**
 * Fetch advertisement statistics
 */
export const fetchAdStats = async (): Promise<AdStats | null> => {
  try {
    const { data: ads, error } = await supabase
      .from('advertisements')
      .select('status, impressions, clicks, spent, created_at');

    if (error) throw error;

    let totalAds = 0;
    let activeAds = 0;
    let pendingAds = 0;
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalSpent = 0;
    let totalCtr = 0;
    let todayImpressions = 0;
    let todayClicks = 0;

    const today = new Date().toISOString().split('T')[0];

    ads?.forEach(ad => {
      totalAds++;
      
      if (ad.status === 'active') {
        activeAds++;
      } else if (ad.status === 'pending') {
        pendingAds++;
      }

      totalImpressions += ad.impressions || 0;
      totalClicks += ad.clicks || 0;
      totalSpent += ad.spent || 0;
      
      // Calculate CTR for this ad
      const adCtr = ad.impressions > 0 ? (ad.clicks / ad.impressions) * 100 : 0;
      totalCtr += adCtr;

      // Check if ad was active today
      const adDate = new Date(ad.created_at).toISOString().split('T')[0];
      if (adDate === today) {
        todayImpressions += ad.impressions || 0;
        todayClicks += ad.clicks || 0;
      }
    });

    return {
      total_ads: totalAds,
      active_ads: activeAds,
      pending_ads: pendingAds,
      total_impressions: totalImpressions,
      total_clicks: totalClicks,
      total_spent: totalSpent,
      average_ctr: totalAds > 0 ? totalCtr / totalAds : 0,
      today_impressions: todayImpressions,
      today_clicks: todayClicks,
    };
  } catch (error) {
    console.error('Error fetching ad stats:', error);
    return null;
  }
};

/**
 * Create a new advertisement
 */
export const createAdvertisement = async (
  adData: Omit<Advertisement, 'id' | 'impressions' | 'clicks' | 'ctr' | 'created_at' | 'updated_at'> & {
    impressions?: number;
    clicks?: number;
  }
): Promise<{ success: boolean; adId?: string; error?: string }> => {
  try {
    const ctr = (adData.impressions || 0) > 0 
      ? ((adData.clicks || 0) / adData.impressions!) * 100 
      : 0;

    const { data, error } = await supabase
      .from('advertisements')
      .insert({
        ...adData,
        impressions: adData.impressions || 0,
        clicks: adData.clicks || 0,
        ctr: ctr,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating advertisement:', error);
      throw error;
    }

    return {
      success: true,
      adId: data.id,
    };
  } catch (error) {
    console.error('Error in createAdvertisement:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create advertisement',
    };
  }
};

/**
 * Update advertisement status
 */
export const updateAdStatus = async (
  adId: string,
  status: Advertisement['status'],
  rejection_reason?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'active') {
      updateData.approved_by = 'admin'; // Should be actual admin ID from auth
      updateData.start_date = new Date().toISOString();
    }

    if (status === 'rejected' && rejection_reason) {
      updateData.rejection_reason = rejection_reason;
    }

    const { error } = await supabase
      .from('advertisements')
      .update(updateData)
      .eq('id', adId);

    if (error) {
      console.error('Error updating ad status:', error);
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error in updateAdStatus:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update ad status',
    };
  }
};

/**
 * Update advertisement details
 */
export const updateAdvertisement = async (
  adId: string,
  updates: Partial<Advertisement>
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('advertisements')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', adId);

    if (error) {
      console.error('Error updating advertisement:', error);
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error in updateAdvertisement:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update advertisement',
    };
  }
};

/**
 * Record ad impression
 */
export const recordImpression = async (
  adId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Get current ad data
    const { data: ad, error: fetchError } = await supabase
      .from('advertisements')
      .select('impressions, clicks')
      .eq('id', adId)
      .single();

    if (fetchError) throw fetchError;

    const newImpressions = (ad.impressions || 0) + 1;
    const ctr = newImpressions > 0 ? ((ad.clicks || 0) / newImpressions) * 100 : 0;

    const { error } = await supabase
      .from('advertisements')
      .update({
        impressions: newImpressions,
        ctr: ctr,
        updated_at: new Date().toISOString(),
      })
      .eq('id', adId);

    if (error) {
      console.error('Error recording impression:', error);
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error in recordImpression:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to record impression',
    };
  }
};

/**
 * Record ad click
 */
export const recordClick = async (
  adId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Get current ad data
    const { data: ad, error: fetchError } = await supabase
      .from('advertisements')
      .select('impressions, clicks, spent, budget')
      .eq('id', adId)
      .single();

    if (fetchError) throw fetchError;

    const newClicks = (ad.clicks || 0) + 1;
    const newImpressions = ad.impressions || 0;
    const ctr = newImpressions > 0 ? (newClicks / newImpressions) * 100 : 0;

    // Check if we should charge for click (PPC model)
    const costPerClick = 0.10; // $0.10 per click
    const newSpent = (ad.spent || 0) + costPerClick;

    // Check if budget is exceeded
    const status = newSpent >= (ad.budget || 0) ? 'completed' : 'active';

    const { error } = await supabase
      .from('advertisements')
      .update({
        clicks: newClicks,
        ctr: ctr,
        spent: newSpent,
        status: status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', adId);

    if (error) {
      console.error('Error recording click:', error);
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error in recordClick:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to record click',
    };
  }
};

/**
 * Fetch ad performance metrics
 */
export const fetchAdPerformance = async (
  startDate?: string,
  endDate?: string
): Promise<AdPerformance[]> => {
  try {
    let query = supabase
      .from('advertisements')
      .select('id, title, impressions, clicks, spent, created_at')
      .eq('status', 'active')
      .order('clicks', { ascending: false });

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    // TODO: In production, get actual conversion data from orders
    const performanceData: AdPerformance[] = (data || []).map(ad => {
      const conversions = Math.floor((ad.clicks || 0) * 0.03); // 3% conversion rate estimate
      const conversionRate = (ad.clicks || 0) > 0 ? (conversions / ad.clicks!) * 100 : 0;
      const roi = (ad.spent || 0) > 0 ? ((conversions * 50) / ad.spent!) * 100 : 0; // Assuming $50 average order value

      return {
        ad_id: ad.id,
        title: ad.title,
        impressions: ad.impressions || 0,
        clicks: ad.clicks || 0,
        ctr: (ad.impressions || 0) > 0 ? ((ad.clicks || 0) / ad.impressions!) * 100 : 0,
        spent: ad.spent || 0,
        conversions: conversions,
        conversion_rate: conversionRate,
        roi: roi,
      };
    });

    return performanceData;
  } catch (error) {
    console.error('Error fetching ad performance:', error);
    return [];
  }
};

/**
 * Delete advertisement
 */
export const deleteAdvertisement = async (
  adId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('advertisements')
      .delete()
      .eq('id', adId);

    if (error) {
      console.error('Error deleting advertisement:', error);
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteAdvertisement:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete advertisement',
    };
  }
};