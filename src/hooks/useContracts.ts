import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface Contract {
  id: string;
  seller_id: string;
  title: string;
  type: string;
  status: string;
  start_date: string;
  end_date: string;
  created_at: string;
}

export const useContracts = (sellerId?: string) => {
  const { user } = useAuth();
  const effectiveSellerId = sellerId || user?.id;
  
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContracts = useCallback(async () => {
    const isDemoMode = localStorage.getItem('demoMode') === 'seller';
    
    if (!effectiveSellerId && !isDemoMode) {
      setContracts([]);
      setLoading(false);
      return [];
    }

    try {
      setLoading(true);
      setError(null);

      if (isDemoMode || !effectiveSellerId) {
        setTimeout(() => {
          const mockContracts = [
            {
              id: '1',
              seller_id: effectiveSellerId || 'demo-seller',
              title: 'Supplier Agreement - Wood Materials',
              type: 'supplier',
              status: 'active',
              start_date: '2024-01-01',
              end_date: '2024-12-31',
              created_at: '2024-01-01T09:00:00Z'
            },
            {
              id: '2',
              seller_id: effectiveSellerId || 'demo-seller',
              title: 'Client Contract - Office Furniture',
              type: 'client',
              status: 'pending',
              start_date: '2024-07-01',
              end_date: '2025-06-30',
              created_at: '2024-06-15T14:30:00Z'
            }
          ];
          setContracts(mockContracts);
          setLoading(false);
        }, 800);
        return;
      }

      const { data, error: supabaseError } = await supabase
        .from('contracts')
        .select('*')
        .eq('seller_id', effectiveSellerId)
        .order('created_at', { ascending: false });

      if (supabaseError) throw supabaseError;
      
      setContracts(data || []);
    } catch (err: any) {
      console.error('Error fetching contracts:', err);
      setError(err.message);
      setContracts([]);
    } finally {
      setLoading(false);
    }
  }, [effectiveSellerId]);

  const reload = useCallback(async () => {
    await fetchContracts();
  }, [fetchContracts]);

  const signContract = useCallback(async (id: string) => {
    return Promise.resolve({ success: true });
  }, []);

  const renewContract = useCallback(async (id: string, endDate: string) => {
    return Promise.resolve({ success: true });
  }, []);

  useEffect(() => {
    const isDemoMode = localStorage.getItem('demoMode') === 'seller';
    if (effectiveSellerId || isDemoMode) {
      fetchContracts();
    } else {
      setLoading(false);
    }
  }, [effectiveSellerId, fetchContracts]);

  return {
    contracts,
    loading,
    error,
    reload,
    signContract,
    renewContract
  };
};