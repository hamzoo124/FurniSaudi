// src/api/contracts.ts
import { supabase } from '@/lib/supabase';



export interface Contract {
  id: string;
  seller_id: string;
  contract_type: 'standard' | 'premium' | 'enterprise' | 'custom';
  title: string;
  description: string;
  terms: string;
  commission_rate: number;
  payment_terms: string;
  duration_days: number;
  start_date: string;
  end_date: string;
  status: 'draft' | 'pending_approval' | 'active' | 'expired' | 'terminated' | 'rejected';
  signed_at?: string;
  signed_by_seller?: boolean;
  signed_by_admin?: boolean;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface ContractStats {
  total_contracts: number;
  active_contracts: number;
  pending_approval: number;
  expiring_soon: number;
  average_commission_rate: number;
}

/**
 * Fetch all contracts with seller details
 */
export const fetchContracts = async (
  filters?: {
    status?: string;
    seller_id?: string;
    contract_type?: string;
  }
): Promise<Contract[]> => {
  try {
    let query = supabase
      .from('contracts')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.seller_id) {
      query = query.eq('seller_id', filters.seller_id);
    }
    if (filters?.contract_type) {
      query = query.eq('contract_type', filters.contract_type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching contracts:', error);
      throw error;
    }

    return data as Contract[];
  } catch (error) {
    console.error('Error in fetchContracts:', error);
    return [];
  }
};

/**
 * Fetch contract by ID with seller details
 */
export const fetchContractById = async (
  contractId: string
): Promise<Contract | null> => {
  try {
    const { data, error } = await supabase
      .from('contracts')
      .select(`
        *,
        sellers:user_id (*)
      `)
      .eq('id', contractId)
      .single();

    if (error) {
      console.error('Error fetching contract:', error);
      throw error;
    }

    return data as Contract;
  } catch (error) {
    console.error('Error in fetchContractById:', error);
    return null;
  }
};

/**
 * Fetch contract statistics
 */
export const fetchContractStats = async (): Promise<ContractStats | null> => {
  try {
    const { data: contracts, error } = await supabase
      .from('contracts')
      .select('status, commission_rate, end_date');

    if (error) throw error;

    let totalContracts = 0;
    let activeContracts = 0;
    let pendingApproval = 0;
    let expiringSoon = 0;
    let totalCommissionRate = 0;

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    contracts?.forEach(contract => {
      totalContracts++;
      totalCommissionRate += contract.commission_rate;

      if (contract.status === 'active') {
        activeContracts++;
        
        // Check if expiring soon
        const endDate = new Date(contract.end_date);
        if (endDate <= thirtyDaysFromNow && endDate >= now) {
          expiringSoon++;
        }
      } else if (contract.status === 'pending_approval') {
        pendingApproval++;
      }
    });

    return {
      total_contracts: totalContracts,
      active_contracts: activeContracts,
      pending_approval: pendingApproval,
      expiring_soon: expiringSoon,
      average_commission_rate: totalContracts > 0 ? totalCommissionRate / totalContracts : 0,
    };
  } catch (error) {
    console.error('Error fetching contract stats:', error);
    return null;
  }
};

/**
 * Create a new contract
 */
export const createContract = async (
  contractData: Omit<Contract, 'id' | 'created_at' | 'updated_at' | 'status'> & {
    status?: Contract['status'];
  }
): Promise<{ success: boolean; contractId?: string; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('contracts')
      .insert({
        ...contractData,
        status: contractData.status || 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating contract:', error);
      throw error;
    }

    return {
      success: true,
      contractId: data.id,
    };
  } catch (error) {
    console.error('Error in createContract:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create contract',
    };
  }
};

/**
 * Update contract status
 */
export const updateContractStatus = async (
  contractId: string,
  status: Contract['status'],
  rejection_reason?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'rejected' && rejection_reason) {
      updateData.rejection_reason = rejection_reason;
    }

    if (status === 'active') {
      updateData.signed_by_admin = true;
      updateData.signed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('contracts')
      .update(updateData)
      .eq('id', contractId);

    if (error) {
      console.error('Error updating contract status:', error);
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error in updateContractStatus:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update contract status',
    };
  }
};

/**
 * Update contract details
 */
export const updateContract = async (
  contractId: string,
  updates: Partial<Contract>
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('contracts')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', contractId);

    if (error) {
      console.error('Error updating contract:', error);
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error in updateContract:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update contract',
    };
  }
};

/**
 * Delete contract
 */
export const deleteContract = async (
  contractId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('contracts')
      .delete()
      .eq('id', contractId);

    if (error) {
      console.error('Error deleting contract:', error);
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteContract:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete contract',
    };
  }
};

/**
 * Fetch contracts expiring soon
 */
export const fetchExpiringContracts = async (
  daysThreshold: number = 30
): Promise<Contract[]> => {
  try {
    const now = new Date().toISOString();
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('status', 'active')
      .gte('end_date', now)
      .lte('end_date', thresholdDate.toISOString())
      .order('end_date', { ascending: true });

    if (error) {
      console.error('Error fetching expiring contracts:', error);
      throw error;
    }

    return data as Contract[];
  } catch (error) {
    console.error('Error in fetchExpiringContracts:', error);
    return [];
  }
};

/**
 * Send contract for approval
 */
export const sendContractForApproval = async (
  contractId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('contracts')
      .update({
        status: 'pending_approval',
        updated_at: new Date().toISOString(),
      })
      .eq('id', contractId);

    if (error) {
      console.error('Error sending contract for approval:', error);
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error in sendContractForApproval:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send contract for approval',
    };
  }
};