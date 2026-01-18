// src/api/sellerManagement.ts
import { supabase } from '../lib/supabase';

export interface SellerApplication {
  id: string;
  application_id: string;
  user_id: string;
  full_name: string;
  email: string;
  business_name: string;
  contact_number: string;
  address: string;
  city: string;
  business_type: 'individual' | 'company';
  business_description: string;
  cr_number: string;
  cr_document_url: string | null;
  bank_name: string;
  account_number: string;
  iban: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'more_info_needed';
  admin_notes: string | null;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  submitted_at: string;
  updated_at: string;
}

export interface Seller {
  id: string;
  user_id: string;
  application_id: string;
  full_name: string;
  email: string;
  business_name: string;
  contact_number: string;
  address: string;
  city: string;
  business_type: 'individual' | 'company';
  business_description: string;
  cr_number: string;
  cr_document_url: string | null;
  bank_name: string;
  account_number: string;
  iban: string;
  approval_status: 'pending' | 'approved' | 'rejected' | 'suspended';
  status: 'active' | 'inactive' | 'suspended';
  commission_rate: number;
  total_earnings: number;
  pending_payouts: number;
  rating: number;
  total_reviews: number;
  total_products: number;
  total_orders: number;
  total_revenue: number;
  created_at: string;
  updated_at: string;
}

export const sellerManagementAPI = {
  // Get all seller applications with filters
  async getSellerApplications(filters?: {
    status?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    let query = supabase
      .from('seller_applications')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters?.search) {
      query = query.or(
        `full_name.ilike.%${filters.search}%,business_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
      );
    }

    if (filters?.dateFrom) {
      query = query.gte('submitted_at', filters.dateFrom);
    }

    if (filters?.dateTo) {
      query = query.lte('submitted_at', filters.dateTo);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as SellerApplication[];
  },

  // Get single application
  async getSellerApplication(id: string) {
    const { data, error } = await supabase
      .from('seller_applications')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as SellerApplication;
  },

  // Approve seller application
  async approveSellerApplication(
    applicationId: string,
    adminId: string,
    notes?: string
  ) {
    // Start transaction
    const { data: application, error: appError } = await supabase
      .from('seller_applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (appError) throw appError;

    // Update application status
    const { error: updateError } = await supabase
      .from('seller_applications')
      .update({
        status: 'approved',
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
        admin_notes: notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId);

    if (updateError) throw updateError;

    // Create seller record
    const { error: sellerError } = await supabase
      .from('sellers')
      .insert({
        user_id: application.user_id,
        application_id: application.application_id,
        full_name: application.full_name,
        email: application.email,
        business_name: application.business_name,
        contact_number: application.contact_number,
        address: application.address,
        city: application.city,
        business_type: application.business_type,
        business_description: application.business_description,
        cr_number: application.cr_number,
        cr_document_url: application.cr_document_url,
        bank_name: application.bank_name,
        account_number: application.account_number,
        iban: application.iban,
        approval_status: 'approved',
        status: 'active',
        commission_rate: 10.00, // Default commission
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (sellerError) throw sellerError;

    // Update user metadata
    const { error: userError } = await supabase.auth.admin.updateUserById(
      application.user_id,
      {
        user_metadata: {
          ...application,
          user_type: 'seller',
          seller_status: 'approved',
          approved_at: new Date().toISOString()
        }
      }
    );

    if (userError) throw userError;

    // Log the approval
    await supabase
      .from('seller_approval_logs')
      .insert({
        application_id: application.application_id,
        action: 'approved',
        performed_by: adminId,
        notes: notes,
        previous_status: 'pending',
        new_status: 'approved',
        created_at: new Date().toISOString()
      });

    return { success: true, message: 'Seller approved successfully' };
  },

  // Reject seller application
  async rejectSellerApplication(
    applicationId: string,
    adminId: string,
    reason: string,
    notes?: string
  ) {
    const { data: application, error: appError } = await supabase
      .from('seller_applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (appError) throw appError;

    // Update application status
    const { error: updateError } = await supabase
      .from('seller_applications')
      .update({
        status: 'rejected',
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
        rejection_reason: reason,
        admin_notes: notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId);

    if (updateError) throw updateError;

    // Update user metadata
    const { error: userError } = await supabase.auth.admin.updateUserById(
      application.user_id,
      {
        user_metadata: {
          ...application,
          user_type: 'seller_rejected',
          seller_status: 'rejected',
          rejection_reason: reason,
          rejected_at: new Date().toISOString()
        }
      }
    );

    if (userError) throw userError;

    // Log the rejection
    await supabase
      .from('seller_approval_logs')
      .insert({
        application_id: application.application_id,
        action: 'rejected',
        performed_by: adminId,
        reason: reason,
        notes: notes,
        previous_status: 'pending',
        new_status: 'rejected',
        created_at: new Date().toISOString()
      });

    return { success: true, message: 'Seller application rejected' };
  },

  // Request more information
  async requestMoreInfo(
    applicationId: string,
    adminId: string,
    requestDetails: string
  ) {
    const { error } = await supabase
      .from('seller_applications')
      .update({
        status: 'more_info_needed',
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
        admin_notes: requestDetails,
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId);

    if (error) throw error;

    await supabase
      .from('seller_approval_logs')
      .insert({
        application_id: applicationId,
        action: 'requested_more_info',
        performed_by: adminId,
        notes: requestDetails,
        previous_status: 'pending',
        new_status: 'more_info_needed',
        created_at: new Date().toISOString()
      });

    return { success: true, message: 'More information requested' };
  },

  // Get seller stats
  async getSellerStats() {
    const { data: applications, error: appError } = await supabase
      .from('seller_applications')
      .select('status');

    if (appError) throw appError;

    const { data: sellers, error: sellerError } = await supabase
      .from('sellers')
      .select('approval_status, status');

    if (sellerError) throw sellerError;

    return {
      applications: {
        total: applications.length,
        pending: applications.filter(a => a.status === 'pending').length,
        under_review: applications.filter(a => a.status === 'under_review').length,
        approved: applications.filter(a => a.status === 'approved').length,
        rejected: applications.filter(a => a.status === 'rejected').length,
        more_info_needed: applications.filter(a => a.status === 'more_info_needed').length
      },
      sellers: {
        total: sellers.length,
        approved: sellers.filter(s => s.approval_status === 'approved').length,
        pending: sellers.filter(s => s.approval_status === 'pending').length,
        rejected: sellers.filter(s => s.approval_status === 'rejected').length,
        suspended: sellers.filter(s => s.status === 'suspended').length,
        active: sellers.filter(s => s.status === 'active').length
      }
    };
  },

  // Get approval logs
  async getApprovalLogs(applicationId?: string) {
    let query = supabase
      .from('seller_approval_logs')
      .select(`
        *,
        profiles:performed_by(full_name, email)
      `)
      .order('created_at', { ascending: false });

    if (applicationId) {
      query = query.eq('application_id', applicationId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }
};