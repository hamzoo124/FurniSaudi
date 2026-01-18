// lib/supabase/sellers.ts
import { supabaseAdmin as supabase } from '../supabase';

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
  business_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  business_type: string;
  business_description: string;
  cr_number: string;
  cr_document_url: string | null;
  bank_name: string;
  account_number: string;
  iban: string;
  approval_status: 'pending' | 'approved' | 'rejected' | 'suspended';
  status: 'active' | 'inactive';
  commission_rate: number;
  total_sales: number;
  total_earnings: number;
  pending_payout: number;
  rating_avg: number;
  total_products: number;
  total_orders: number;
  suspension_reason: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string;
    avatar_url: string;
    email: string;
    phone: string;
    created_at: string;
  };
}

export const sellersApi = {
  // ============ SELLER APPLICATIONS ============
  async getSellerApplications(filters?: {
    status?: string[];
    search?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<SellerApplication[]> {
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
          email.ilike.%${filters.search}%,
          contact_number.ilike.%${filters.search}%
        `);
      }
      
      if (filters?.date_from) {
        query = query.gte('submitted_at', filters.date_from);
      }
      
      if (filters?.date_to) {
        query = query.lte('submitted_at', filters.date_to);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching applications:', error);
        // Try alternative table
        const { data: altData, error: altError } = await supabase
          .from('seller_applications')
          .select('*');
        
        if (altError) throw altError;
        return altData as SellerApplication[];
      }
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
      console.log('Approving seller application:', applicationId);
      
      // 1. Get application
      const { data: application, error: appError } = await supabase
        .from('seller_applications')
        .select('*')
        .eq('id', applicationId)
        .single();

      if (appError) {
        console.error('Error getting application:', appError);
        throw new Error('Application not found');
      }

      console.log('Application found for user:', application.user_id);

      // 2. Update application status
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

      if (updateError) {
        console.error('Error updating application:', updateError);
        throw updateError;
      }

      // 3. Check if profile exists
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', application.user_id)
        .maybeSingle();

      if (profileCheckError && profileCheckError.code !== 'PGRST116') {
        console.warn('Error checking profile:', profileCheckError.message);
      }

      // 4. Update profile to seller
      const profileUpdate = {
        user_type: 'seller',
        full_name: application.full_name,
        business_name: application.business_name,
        business_type: application.business_type,
        phone: application.contact_number,
        address: application.address,
        city: application.city,
        updated_at: new Date().toISOString()
      };

      if (!existingProfile) {
        // Create profile if doesn't exist
        console.log('Creating new profile for seller');
        const { error: createError } = await supabase
          .from('profiles')
          .insert({
            id: application.user_id,
            email: application.email,
            ...profileUpdate,
            created_at: new Date().toISOString()
          });

        if (createError) {
          console.error('Error creating profile:', createError);
          throw createError;
        }
      } else {
        // Update existing profile
        console.log('Updating existing profile');
        const { error: updateProfileError } = await supabase
          .from('profiles')
          .update(profileUpdate)
          .eq('id', application.user_id);

        if (updateProfileError) {
          console.error('Error updating profile:', updateProfileError);
        }
      }

      // 5. Check if seller already exists
      const { data: existingSeller, error: sellerCheckError } = await supabase
        .from('sellers')
        .select('*')
        .eq('user_id', application.user_id)
        .maybeSingle();

      let seller;
      
      if (existingSeller) {
        // Update existing seller
        console.log('Updating existing seller record');
        const { data: updatedSeller, error: updateSellerError } = await supabase
          .from('sellers')
          .update({
            approval_status: 'approved',
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSeller.id)
          .select()
          .single();

        if (updateSellerError) throw updateSellerError;
        seller = updatedSeller as Seller;
      } else {
        // Create new seller record
        console.log('Creating new seller record');
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

        const { data: newSeller, error: sellerError } = await supabase
          .from('sellers')
          .insert([sellerData])
          .select()
          .single();

        if (sellerError) {
          console.error('Error creating seller:', sellerError);
          
          // Try alternative table
          const { data: altSeller, error: altError } = await supabase
            .from('sellers')
            .insert([sellerData])
            .select()
            .single();
            
          if (altError) throw altError;
          seller = altSeller as Seller;
        } else {
          seller = newSeller as Seller;
        }
      }

      // 6. Update user metadata in auth
      try {
        await supabase.auth.admin.updateUserById(application.user_id, {
          user_metadata: {
            user_type: 'seller',
            seller_status: 'approved',
            business_name: application.business_name,
            approved_at: new Date().toISOString()
          }
        });
      } catch (authError) {
        console.warn('Could not update user metadata:', authError);
      }

      // 7. Send notification
      try {
        await supabase.from('notifications').insert({
          user_id: application.user_id,
          title: 'Seller Application Approved',
          message: `Congratulations! Your seller application for "${application.business_name}" has been approved. You can now start selling on our platform.`,
          type: 'seller_approval',
          data: {
            application_id: applicationId,
            status: 'approved',
            business_name: application.business_name
          },
          created_at: new Date().toISOString()
        });
      } catch (notificationError) {
        console.warn('Could not send notification:', notificationError);
      }

      // 8. Log activity
      try {
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
            user_id: application.user_id,
            timestamp: new Date().toISOString()
          },
          created_at: new Date().toISOString()
        });
      } catch (logError) {
        console.warn('Could not log activity:', logError);
      }

      // 9. Trigger refresh events
      window.dispatchEvent(new Event('refreshUsers'));
      window.dispatchEvent(new Event('refreshSellers'));

      console.log('✅ Seller approval completed successfully');
      
      return {
        success: true,
        message: 'Seller approved successfully',
        seller
      };
    } catch (error: any) {
      console.error('❌ Error approving seller application:', error);
      throw new Error(error.message || 'Failed to approve seller application');
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

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          user_type: 'seller_rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', application.user_id);

      if (profileError) {
        console.warn('Could not update profile:', profileError.message);
      }

      // Update user metadata
      try {
        await supabase.auth.admin.updateUserById(application.user_id, {
          user_metadata: {
            user_type: 'seller_rejected',
            seller_status: 'rejected',
            rejection_reason: reason,
            rejected_at: new Date().toISOString()
          }
        });
      } catch (authError) {
        console.warn('Could not update auth metadata:', authError);
      }

      // Send notification
      try {
        await supabase.from('notifications').insert({
          user_id: application.user_id,
          title: 'Seller Application Rejected',
          message: `Your seller application has been rejected. Reason: ${reason}`,
          type: 'seller_rejection',
          data: {
            application_id: applicationId,
            status: 'rejected',
            reason: reason
          },
          created_at: new Date().toISOString()
        });
      } catch (notificationError) {
        console.warn('Could not send notification:', notificationError);
      }

      // Log activity
      try {
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
          },
          created_at: new Date().toISOString()
        });
      } catch (logError) {
        console.warn('Could not log activity:', logError);
      }

      // Trigger refresh events
      window.dispatchEvent(new Event('refreshUsers'));

      return {
        success: true,
        message: 'Seller application rejected successfully'
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

      // Send notification to seller
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

  // ============ SELLER MANAGEMENT ============
  async getAllSellers(filters?: {
    status?: string[];
    approval_status?: string[];
    search?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<Seller[]> {
    try {
      let query = supabase
        .from('sellers')
        .select(`
          *,
          profiles!inner (
            full_name,
            avatar_url,
            email as profile_email,
            phone as profile_phone,
            created_at as profile_created_at
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
        query = query.or(`
          business_name.ilike.%${filters.search}%,
          email.ilike.%${filters.search}%,
          profiles.full_name.ilike.%${filters.search}%
        `);
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
          profiles!inner (
            full_name,
            avatar_url,
            email as user_email,
            phone as user_phone,
            address as user_address,
            created_at as user_created_at
          )
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

  async getSellerStats() {
    try {
      // Applications stats
      const { data: applications, error: appError } = await supabase
        .from('seller_applications')
        .select('status');

      let appsData: any[] = [];
      if (!appError && applications) {
        appsData = applications;
      }

      // Sellers stats
      const { data: sellers, error: sellerError } = await supabase
        .from('sellers')
        .select('approval_status, status');

      let sellersData: any[] = [];
      if (!sellerError && sellers) {
        sellersData = sellers;
      }

      // Financial stats
      const { data: financialData, error: financialError } = await supabase
        .from('sellers')
        .select('total_sales, total_earnings, pending_payout');

      let financialStats = { totalSales: 0, totalEarnings: 0, pendingPayouts: 0 };
      if (!financialError && financialData) {
        financialStats = financialData.reduce(
          (acc: any, seller: any) => ({
            totalSales: acc.totalSales + (seller.total_sales || 0),
            totalEarnings: acc.totalEarnings + (seller.total_earnings || 0),
            pendingPayouts: acc.pendingPayouts + (seller.pending_payout || 0),
          }),
          { totalSales: 0, totalEarnings: 0, pendingPayouts: 0 }
        );
      }

      return {
        applications: {
          total: appsData.length,
          pending: appsData.filter((a: any) => a.status === 'pending').length,
          under_review: appsData.filter((a: any) => a.status === 'under_review').length,
          approved: appsData.filter((a: any) => a.status === 'approved').length,
          rejected: appsData.filter((a: any) => a.status === 'rejected').length,
          more_info_needed: appsData.filter((a: any) => a.status === 'more_info_needed').length
        },
        sellers: {
          total: sellersData.length,
          approved: sellersData.filter((s: any) => s.approval_status === 'approved').length,
          pending: sellersData.filter((s: any) => s.approval_status === 'pending').length,
          rejected: sellersData.filter((s: any) => s.approval_status === 'rejected').length,
          suspended: sellersData.filter((s: any) => s.approval_status === 'suspended').length,
          active: sellersData.filter((s: any) => s.status === 'active').length
        },
        financial: financialStats
      };
    } catch (error) {
      console.error('Error fetching seller stats:', error);
      throw error;
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
          profiles!inner (
            full_name,
            avatar_url,
            email as user_email
          )
        `)
        .single();

      if (error) throw error;

      // Update profile
      await supabase
        .from('profiles')
        .update({
          user_type: 'seller',
          updated_at: new Date().toISOString()
        })
        .eq('id', data.user_id);

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

      // Trigger refresh
      window.dispatchEvent(new Event('refreshUsers'));
      window.dispatchEvent(new Event('refreshSellers'));

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
          profiles!inner (
            full_name,
            avatar_url,
            email as user_email
          )
        `)
        .single();

      if (error) throw error;

      // Update profile
      await supabase
        .from('profiles')
        .update({
          user_type: 'seller',
          updated_at: new Date().toISOString()
        })
        .eq('id', data.user_id);

      // Send notification
      await supabase.from('notifications').insert({
        user_id: data.user_id,
        title: 'Account Activated',
        message: 'Your seller account has been activated and you can now sell on our platform.',
        type: 'account_activated',
        data: {
          seller_id: sellerId
        },
        created_at: new Date().toISOString()
      });

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

      // Trigger refresh
      window.dispatchEvent(new Event('refreshUsers'));
      window.dispatchEvent(new Event('refreshSellers'));

      return data as Seller;
    } catch (error) {
      console.error('Error activating seller:', error);
      throw error;
    }
  },

  async deleteSeller(sellerId: string, adminId: string, reason?: string): Promise<{ success: boolean; message: string }> {
    try {
      // Get seller info before deletion
      const { data: seller, error: sellerError } = await supabase
        .from('sellers')
        .select('user_id, business_name')
        .eq('id', sellerId)
        .single();

      if (sellerError) throw sellerError;

      // Delete seller record
      const { error: deleteError } = await supabase
        .from('sellers')
        .delete()
        .eq('id', sellerId);

      if (deleteError) throw deleteError;

      // Update profile to buyer
      await supabase
        .from('profiles')
        .update({
          user_type: 'buyer',
          business_name: null,
          business_type: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', seller.user_id);

      // Send notification
      await supabase.from('notifications').insert({
        user_id: seller.user_id,
        title: 'Seller Account Deleted',
        message: `Your seller account has been deleted${reason ? `. Reason: ${reason}` : ''}`,
        type: 'account_deleted',
        data: {
          seller_id: sellerId,
          reason: reason
        },
        created_at: new Date().toISOString()
      });

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: adminId,
        user_type: 'admin',
        action: 'SELLER_DELETED',
        target_type: 'seller',
        target_id: sellerId,
        details: {
          seller_name: seller.business_name,
          user_id: seller.user_id,
          reason: reason,
          timestamp: new Date().toISOString()
        }
      });

      // Trigger refresh
      window.dispatchEvent(new Event('refreshUsers'));
      window.dispatchEvent(new Event('refreshSellers'));

      return {
        success: true,
        message: 'Seller deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting seller:', error);
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
  }
};

// Export individual functions for direct use
export const getSellerById = sellersApi.getSellerById;
export const approveSellerApplication = sellersApi.approveSellerApplication;
export const rejectSellerApplication = sellersApi.rejectSellerApplication;
export const suspendSeller = sellersApi.suspendSeller;
export const activateSeller = sellersApi.activateSeller;
export const deleteSeller = sellersApi.deleteSeller;
export const getAllSellers = sellersApi.getAllSellers;
export const getSellerApplications = sellersApi.getSellerApplications;
export const getSellerStats = sellersApi.getSellerStats;
export const getSellerActivities = sellersApi.getSellerActivities;

// Export update seller function
export const updateSeller = async (sellerId: string, updates: any): Promise<Seller | null> => {
  try {
    const { data, error } = await supabase
      .from('sellers')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', sellerId)
      .select(`
        *,
        profiles!inner (
          full_name,
          avatar_url,
          email as user_email,
          phone as user_phone,
          address as user_address,
          created_at as user_created_at
        )
      `)
      .single();
    if (error) throw error;
    return data as Seller;
  } catch (error) {
    console.error('Error updating seller:', error);
    return null;
  }
};