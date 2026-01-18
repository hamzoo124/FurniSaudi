// lib/supabase/sellers.ts
import { supabase } from '../lib/supabase';
import { Seller,SellerApplication } from '../lib/supabase/sellers';
type ApplicationStatus =
  | "pending"
  | "under_review"
  | "approved"
  | "rejected"
  | "more_info_needed";

interface ApplicationStatRow {
  status: ApplicationStatus;
}

type SellerApprovalStatus =
  | "approved"
  | "pending"
  | "rejected"
  | "suspended";

type SellerStatus = "active" | "inactive";

interface SellerStatRow {
  approval_status: SellerApprovalStatus;
  status: SellerStatus;
}

interface FinancialRow {
  total_sales: number | null;
  total_earnings: number | null;
  pending_payout: number | null;
}




  
export const sellersApi = {
  // ============ SELLER APPLICATIONS ============
  async getSellerApplications(filters?: {
    status?: string[];
    search?: string;
    date_from?: string;
    date_to?: string;
  }) {
    try {
      let query = supabase
        .from('seller_applications')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (filters?.status?.length) {
        query = query.in('status', filters.status);
      }
      
      if (filters?.search) {
        query = query.or(`
          full_name.ilike.%${filters.search}%,
          business_name.ilike.%${filters.search}%,
          email.ilike.%${filters.search}%
        `);
      }
      
      if (filters?.date_from) {
        query = query.gte('submitted_at', filters.date_from);
      }
      
      if (filters?.date_to) {
        query = query.lte('submitted_at', filters.date_to);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SellerApplication[];
    } catch (error) {
      console.error('Error fetching applications:', error);
      throw error;
    }
  },

  async getApplicationById(applicationId: string): Promise<SellerApplication | null> {
    try {
      const { data, error } = await supabase
        .from('seller_applications')
        .select('*')
        .eq('id', applicationId)
        .single();

      if (error) throw error;
      return data as SellerApplication;
    } catch (error) {
      console.error('Error fetching application:', error);
      return null;
    }
  },

  async approveSellerApplication(
    applicationId: string,
    adminId: string,
    notes?: string
  ): Promise<{ success: boolean; message: string; seller?: Seller }> {
    try {
      // Get application
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
      const sellerData = {
        user_id: application.user_id,
        application_id: application.application_id,
        business_name: application.business_name,
        email: application.email,
        phone: application.contact_number,
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
        commission_rate: 10.00,
        total_sales: 0,
        total_earnings: 0,
        pending_payout: 0,
        rating_avg: 0,
        total_products: 0,
        total_orders: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: seller, error: sellerError } = await supabase
        .from('sellers')
        .insert([sellerData])
        .select()
        .single();

      if (sellerError) throw sellerError;

      // Update user role
      await supabase.auth.admin.updateUserById(application.user_id, {
        user_metadata: {
          user_type: 'seller',
          seller_status: 'approved',
          business_name: application.business_name,
          approved_at: new Date().toISOString()
        }
      });

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: adminId,
        user_type: 'admin',
        action: 'SELLER_APPLICATION_APPROVED',
        target_type: 'seller_application',
        target_id: applicationId,
        details: {
          application_id: applicationId,
          seller_name: application.business_name,
          admin_notes: notes,
          timestamp: new Date().toISOString()
        }
      });

      return {
        success: true,
        message: 'Seller approved successfully',
        seller
      };
    } catch (error) {
      console.error('Error approving seller application:', error);
      throw error;
    }
  },

  async rejectSellerApplication(
    applicationId: string,
    adminId: string,
    reason: string,
    notes?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Get application
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
      await supabase.auth.admin.updateUserById(application.user_id, {
        user_metadata: {
          user_type: 'seller_rejected',
          seller_status: 'rejected',
          rejection_reason: reason,
          rejected_at: new Date().toISOString()
        }
      });

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: adminId,
        user_type: 'admin',
        action: 'SELLER_APPLICATION_REJECTED',
        target_type: 'seller_application',
        target_id: applicationId,
        details: {
          application_id: applicationId,
          seller_name: application.business_name,
          rejection_reason: reason,
          admin_notes: notes,
          timestamp: new Date().toISOString()
        }
      });

      return {
        success: true,
        message: 'Seller application rejected'
      };
    } catch (error) {
      console.error('Error rejecting seller application:', error);
      throw error;
    }
  },

  async requestMoreInfo(
    applicationId: string,
    adminId: string,
    requestDetails: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Get application
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
          status: 'more_info_needed',
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
          admin_notes: requestDetails,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (updateError) throw updateError;

      // Send notification to seller (implement your notification system)
      await supabase.from('notifications').insert({
        user_id: application.user_id,
        title: 'More Information Required',
        message: `Admin has requested more information: ${requestDetails}`,
        type: 'seller_application_update',
        data: {
          application_id: applicationId,
          status: 'more_info_needed',
          request_details: requestDetails
        },
        created_at: new Date().toISOString()
      });

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: adminId,
        user_type: 'admin',
        action: 'SELLER_APPLICATION_INFO_REQUESTED',
        target_type: 'seller_application',
        target_id: applicationId,
        details: {
          application_id: applicationId,
          seller_name: application.business_name,
          request_details: requestDetails,
          timestamp: new Date().toISOString()
        }
      });

      return {
        success: true,
        message: 'Information requested successfully'
      };
    } catch (error) {
      console.error('Error requesting more info:', error);
      throw error;
    }
  },

  async sendMessageToSeller(
    sellerId: string,
    adminId: string,
    message: string,
    subject: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Get seller info
      const { data: seller, error: sellerError } = await supabase
        .from('sellers')
        .select('user_id, business_name, email')
        .eq('id', sellerId)
        .single();

      if (sellerError) throw sellerError;

      // Create message record
      const { error: messageError } = await supabase
        .from('admin_messages')
        .insert({
          sender_id: adminId,
          sender_type: 'admin',
          receiver_id: seller.user_id,
          receiver_type: 'seller',
          subject: subject,
          message: message,
          is_read: false,
          created_at: new Date().toISOString()
        });

      if (messageError) throw messageError;

      // Send email notification (you'll need to implement this)
      // await sendEmailNotification(seller.email, subject, message);

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: adminId,
        user_type: 'admin',
        action: 'ADMIN_MESSAGE_SENT',
        target_type: 'seller',
        target_id: sellerId,
        details: {
          seller_id: sellerId,
          seller_name: seller.business_name,
          subject: subject,
          timestamp: new Date().toISOString()
        }
      });

      return {
        success: true,
        message: 'Message sent successfully'
      };
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  async getSellerMessages(sellerId: string) {
    try {
      const { data, error } = await supabase
        .from('admin_messages')
        .select('*')
        .or(`receiver_id.eq.${sellerId},sender_id.eq.${sellerId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  },
  

  // ============ SELLER MANAGEMENT ============
  async getAllSellers(filters?: {
    status?: string[];
    approval_status?: string[];
    search?: string;
    date_from?: string;
    date_to?: string;
  }) {
    try {
      let query = supabase
        .from('sellers')
        .select(`
          *,
          users!inner (
            full_name,
            avatar_url,
            email as user_email,
            phone as user_phone,
            created_at as user_created_at,
            last_login
          )
        `)
        .order('created_at', { ascending: false });

      if (filters?.status?.length) {
        query = query.in('status', filters.status);
      }
      
      if (filters?.approval_status?.length) {
        query = query.in('approval_status', filters.approval_status);
      }
      
      if (filters?.search) {
        query = query.or(`business_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,users.full_name.ilike.%${filters.search}%`);
      }
      
      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      
      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Seller[];
    } catch (error) {
      console.error('Error fetching sellers:', error);
      throw error;
    }
  },

  async getSellerById(sellerId: string): Promise<Seller | null> {
    try {
      const { data, error } = await supabase
        .from('sellers')
        .select(`
          *,
          users!inner (
            full_name,
            avatar_url,
            email as user_email,
            phone as user_phone,
            address as user_address,
            created_at as user_created_at,
            last_login
          ),
          products:products(count),
          orders:orders(count),
          reviews:reviews(count)
        `)
        .eq('id', sellerId)
        .single();

      if (error) throw error;
      return data as Seller;
    } catch (error) {
      console.error('Error fetching seller:', error);
      return null;
    }
  },

 
  async suspendSeller(sellerId: string, reason: string, adminId: string): Promise<Seller> {
    try {
      const { data, error } = await supabase
        .from('sellers')
        .update({
          approval_status: 'suspended',
          status: 'inactive',
          suspension_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sellerId)
        .select(`
          *,
          users!inner (
            full_name,
            avatar_url,
            email as user_email
          )
        `)
        .single();

      if (error) throw error;

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: adminId,
        user_type: 'admin',
        action: 'SELLER_SUSPENDED',
        target_type: 'seller',
        target_id: sellerId,
        details: {
          seller_name: data.business_name,
          reason: reason,
          suspended_by: adminId,
          timestamp: new Date().toISOString()
        },
      });

      // Send notification
      await supabase.from('notifications').insert({
        user_id: data.user_id,
        title: 'Account Suspended',
        message: `Your seller account has been suspended. Reason: ${reason}`,
        type: 'account_suspended',
        data: {
          seller_id: sellerId,
          reason: reason,
          suspended_by: adminId
        },
        created_at: new Date().toISOString()
      });

      return data as Seller;
    } catch (error) {
      console.error('Error suspending seller:', error);
      throw error;
    }
  },

  async activateSeller(sellerId: string, adminId: string): Promise<Seller> {
    try {
      const { data, error } = await supabase
        .from('sellers')
        .update({
          approval_status: 'approved',
          status: 'active',
          suspension_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sellerId)
        .select(`
          *,
          users!inner (
            full_name,
            avatar_url,
            email as user_email
          )
        `)
        .single();

      if (error) throw error;

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: adminId,
        user_type: 'admin',
        action: 'SELLER_ACTIVATED',
        target_type: 'seller',
        target_id: sellerId,
        details: {
          seller_name: data.business_name,
          activated_by: adminId,
          timestamp: new Date().toISOString()
        },
      });

      return data as Seller;
    } catch (error) {
      console.error('Error activating seller:', error);
      throw error;
    }
  },

  async updateCommission(sellerId: string, commissionRate: number, reason: string, adminId: string): Promise<Seller> {
    try {
      const { data, error } = await supabase
        .from('sellers')
        .update({
          commission_rate: commissionRate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sellerId)
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: adminId,
        user_type: 'admin',
        action: 'COMMISSION_UPDATED',
        target_type: 'seller',
        target_id: sellerId,
        details: {
          old_rate: data.commission_rate,
          new_rate: commissionRate,
          reason: reason,
          updated_by: adminId,
          timestamp: new Date().toISOString()
        },
      });

      return data as Seller;
    } catch (error) {
      console.error('Error updating commission:', error);
      throw error;
    }
  },

  async getSellerActivities(sellerId: string, limit: number = 10) {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .or(`target_id.eq.${sellerId},details->>seller_id.eq.${sellerId}`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching seller activities:', error);
      throw error;
    }
  }
};