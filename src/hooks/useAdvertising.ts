import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface Campaign {
  id: string;
  seller_id: string;
  title: string;
  budget: number;
  spent: number;
  status: 'draft' | 'pending' | 'active' | 'paused' | 'rejected' | 'ended';
  ad_type: 'banner' | 'product' | 'promoted';
  start_date?: string;
  end_date?: string;
  created_at: string;
}

export const useAdvertising = (sellerId?: string) => {
  const { user } = useAuth();
  const effectiveSellerId = sellerId || user?.id;
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    const isDemoMode = localStorage.getItem('demoMode') === 'seller';
    
    if (!effectiveSellerId && !isDemoMode) {
      setCampaigns([]);
      setLoading(false);
      return [];
    }

    try {
      setLoading(true);
      setError(null);

      if (isDemoMode || !effectiveSellerId) {
        setTimeout(() => {
          const mockCampaigns = [
            {
              id: '1',
              seller_id: effectiveSellerId || 'demo-seller',
              title: 'Summer Sale Campaign',
              budget: 5000,
              spent: 2450,
              status: 'active' as const,
              ad_type: 'banner' as const,
              start_date: '2024-06-01',
              end_date: '2024-08-31',
              created_at: '2024-05-15T10:30:00Z'
            },
            {
              id: '2',
              seller_id: effectiveSellerId || 'demo-seller',
              title: 'New Product Launch',
              budget: 3000,
              spent: 1200,
              status: 'pending' as const,
              ad_type: 'product' as const,
              created_at: '2024-06-10T09:15:00Z'
            }
          ];
          setCampaigns(mockCampaigns);
          setLoading(false);
        }, 800);
        return;
      }

      const { data, error: supabaseError } = await supabase
        .from('advertisements')
        .select('*')
        .eq('seller_id', effectiveSellerId)
        .order('created_at', { ascending: false });

      if (supabaseError) throw supabaseError;
      
      setCampaigns(data || []);
    } catch (err: any) {
      console.error('Error fetching campaigns:', err);
      setError(err.message);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, [effectiveSellerId]);

  const reload = useCallback(async () => {
    await fetchCampaigns();
  }, [fetchCampaigns]);

  const createCampaign = useCallback(async (data: any) => {
    return Promise.resolve({ success: true });
  }, []);

  const updateCampaign = useCallback(async (id: string, data: any) => {
    return Promise.resolve({ success: true });
  }, []);

  useEffect(() => {
    const isDemoMode = localStorage.getItem('demoMode') === 'seller';
    if (effectiveSellerId || isDemoMode) {
      fetchCampaigns();
    } else {
      setLoading(false);
    }
  }, [effectiveSellerId, fetchCampaigns]);

  return {
    campaigns,
    loading,
    error,
    reload,
    createCampaign,
    updateCampaign
  };
};