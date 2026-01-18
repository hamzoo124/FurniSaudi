import { useState, useEffect, useCallback } from 'react';
import { supabaseAdmin as supabase } from '../lib/supabase';
import { sellersApi } from '@/api/sellers';
import { supabase } from '@/lib/supabase';

interface Seller {
  id: string;
  business_name: string;
  email: string;
  phone: string;
  approval_status: 'pending' | 'approved' | 'suspended' | 'rejected';
  status: 'active' | 'inactive';
  commission_rate: number;
  created_at: string;
  updated_at: string;
  user_id?: string;
  business_type?: string;
  business_description?: string;
  city?: string;
  tax_id?: string;
}

interface SellerStats {
  total: number;
  pending: number;
  approved: number;
  suspended: number;
  rejected: number;
  active: number;
  inactive: number;
}

interface CommissionUpdate {
  commission_rate: number;
  reason?: string;
}

interface UseSellersReturn {
  sellers: Seller[];
  pendingSellers: Seller[];
  sellerStats: SellerStats | null;
  selectedSeller: Seller | null;
  loading: boolean;
  loadingAction: boolean;
  error: string | null;
  fetchSellers: (filters?: any) => Promise<void>;
  fetchPendingSellers: () => Promise<Seller[]>;
  fetchSellerStats: () => Promise<void>;
  getSellerById: (sellerId: string) => Promise<Seller | null>;
  approveSeller: (sellerId: string) => Promise<{ success: boolean; data?: Seller; error?: string }>;
  rejectSeller: (sellerId: string, reason: string) => Promise<{ success: boolean; data?: Seller; error?: string }>;
  suspendSeller: (sellerId: string, reason: string) => Promise<{ success: boolean; data?: Seller; error?: string }>;
  activateSeller: (sellerId: string) => Promise<{ success: boolean; data?: Seller; error?: string }>;
  updateCommission: (sellerId: string, commissionData: CommissionUpdate) => Promise<{ success: boolean; data?: Seller; error?: string }>;
  setSelectedSeller: (seller: Seller | null) => void;
}

export const useSellers = (): UseSellersReturn => {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [sellerStats, setSellerStats] = useState<SellerStats | null>(null);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to get admin ID (you should replace this with actual admin ID)
  const getAdminId = (): string => {
    // Get from localStorage or your auth context
    const adminId = localStorage.getItem('adminId') || 'default-admin-id';
    return adminId;
  };

  // Fetch all sellers
  const fetchSellers = useCallback(async (filters?: any) => {
    try {
      setLoading(true);
      setError(null);
      
      let query = supabase.from('sellers').select('*');
      
      // Apply filters if any
      if (filters) {
        if (filters.approval_status) {
          query = query.eq('approval_status', filters.approval_status);
        }
        if (filters.status) {
          query = query.eq('status', filters.status);
        }
        if (filters.search) {
          query = query.or(`business_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
        }
      }
      
      const { data, error: fetchError } = await query.order('created_at', { ascending: false });
      
      if (fetchError) throw fetchError;
      
      setSellers(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sellers');
      console.error('Error fetching sellers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch pending sellers specifically for admin approval
  const fetchPendingSellers = useCallback(async (): Promise<Seller[]> => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('sellers')
        .select('*')
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false });
      
      if (fetchError) throw fetchError;
      
      const pendingSellers = data || [];
      setSellers(prev => {
        // Update sellers list with pending sellers
        const updatedSellers = prev.filter(s => s.approval_status !== 'pending');
        return [...updatedSellers, ...pendingSellers];
      });
      
      return pendingSellers;
    } catch (err) {
      console.error('Error fetching pending sellers:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch seller statistics
  const fetchSellerStats = useCallback(async () => {
    try {
      const { data, error: statsError } = await supabase
        .from('sellers')
        .select('approval_status, status');
      
      if (statsError) throw statsError;
      
      const stats: SellerStats = {
        total: data?.length || 0,
        pending: data?.filter(s => s.approval_status === 'pending').length || 0,
        approved: data?.filter(s => s.approval_status === 'approved').length || 0,
        suspended: data?.filter(s => s.approval_status === 'suspended').length || 0,
        rejected: data?.filter(s => s.approval_status === 'rejected').length || 0,
        active: data?.filter(s => s.status === 'active').length || 0,
        inactive: data?.filter(s => s.status === 'inactive').length || 0,
      };
      
      setSellerStats(stats);
    } catch (err) {
      console.error('Error fetching seller stats:', err);
    }
  }, []);

  // Get seller by ID
  const getSellerById = useCallback(async (sellerId: string): Promise<Seller | null> => {
    try {
      setLoadingAction(true);
      const { data, error } = await supabase
        .from('sellers')
        .select('*')
        .eq('id', sellerId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error fetching seller:', err);
      return null;
    } finally {
      setLoadingAction(false);
    }
  }, []);

  // Generic function to update seller status
  const updateSellerStatus = useCallback(async (
    sellerId: string, 
    approval_status: Seller['approval_status'], 
    status?: Seller['status'],
    reason?: string
  ) => {
    try {
      setLoadingAction(true);
      const adminId = getAdminId();
      
      const updateData: any = {
        approval_status,
        updated_at: new Date().toISOString(),
        ...(status && { status }),
        ...(reason && approval_status === 'rejected' && { rejection_reason: reason }),
        ...(reason && approval_status === 'suspended' && { suspension_reason: reason }),
      };
      
      const { data, error } = await supabase
        .from('sellers')
        .update(updateData)
        .eq('id', sellerId)
        .select()
        .single();
      
      if (error) throw error;

      // Update user role if approved
      if (approval_status === 'approved' && data.user_id) {
        await supabase
          .from('users')
          .update({ role: 'seller' })
          .eq('id', data.user_id);
      }

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: adminId,
        action: `SELLER_${approval_status.toUpperCase()}`,
        target_type: 'seller',
        target_id: sellerId,
        details: {
          seller_name: data.business_name,
          reason: reason || null,
          action_by: adminId,
        },
      });
      
      // Update local state
      setSellers(prev => prev.map(s => s.id === sellerId ? data : s));
      await fetchSellerStats();
      
      return { success: true, data };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Action failed';
      return { success: false, error: errorMsg };
    } finally {
      setLoadingAction(false);
    }
  }, [fetchSellerStats]);

  // Specific seller actions
  const approveSeller = useCallback(async (sellerId: string) => {
    return updateSellerStatus(sellerId, 'approved', 'active');
  }, [updateSellerStatus]);

  const rejectSeller = useCallback(async (sellerId: string, reason: string) => {
    return updateSellerStatus(sellerId, 'rejected', 'inactive', reason);
  }, [updateSellerStatus]);

  const suspendSeller = useCallback(async (sellerId: string, reason: string) => {
    return updateSellerStatus(sellerId, 'suspended', 'inactive', reason);
  }, [updateSellerStatus]);

  const activateSeller = useCallback(async (sellerId: string) => {
    return updateSellerStatus(sellerId, 'approved', 'active');
  }, [updateSellerStatus]);

  // Update commission
  const updateCommission = useCallback(async (sellerId: string, commissionData: CommissionUpdate) => {
    try {
      setLoadingAction(true);
      const adminId = getAdminId();
      
      const updateData = {
        commission_rate: commissionData.commission_rate,
        updated_at: new Date().toISOString(),
      };
      
      const { data, error } = await supabase
        .from('sellers')
        .update(updateData)
        .eq('id', sellerId)
        .select()
        .single();
      
      if (error) throw error;

      // Log commission update
      await supabase.from('activity_logs').insert({
        user_id: adminId,
        action: 'COMMISSION_UPDATED',
        target_type: 'seller',
        target_id: sellerId,
        details: {
          old_rate: data.commission_rate,
          new_rate: commissionData.commission_rate,
          reason: commissionData.reason,
          updated_by: adminId,
        },
      });
      
      // Update local state
      setSellers(prev => prev.map(s => s.id === sellerId ? data : s));
      
      return { success: true, data };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update commission';
      return { success: false, error: errorMsg };
    } finally {
      setLoadingAction(false);
    }
  }, []);

  // Initialize data
  useEffect(() => {
    const initData = async () => {
      await Promise.all([fetchSellers(), fetchSellerStats()]);
    };
    initData();

    // Real-time subscription for sellers
    const channel = supabase
      .channel('sellers-realtime')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'sellers' 
      }, () => {
        fetchSellers();
        fetchSellerStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSellers, fetchSellerStats]);

  const pendingSellers = sellers.filter(s => s.approval_status === 'pending');

  return {
    sellers,
    pendingSellers,
    sellerStats,
    selectedSeller,
    loading,
    loadingAction,
    error,
    fetchSellers,
    fetchPendingSellers,
    fetchSellerStats,
    getSellerById,
    approveSeller,
    rejectSeller,
    suspendSeller,
    activateSeller,
    updateCommission,
    setSelectedSeller,
  };
};