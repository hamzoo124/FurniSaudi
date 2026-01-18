// src/api/adminAPI.ts
import { supabase } from '../lib/supabase'

export const adminAPI = {
  // Get all seller applications
  async getSellerApplications() {
    try {
      const { data, error } = await supabase
        .from('seller_applications')
        .select('*')
        .order('submitted_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching seller applications:', error);
      return [];
    }
  },

  // Get all users
  async getAllUsers() {
    try {
      // Get auth users
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      if (authError) throw authError;

      // Get seller applications
      const { data: sellerApplications } = await supabase
        .from('seller_applications')
        .select('*');

      // Get profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*');

      // Get sellers
      const { data: sellers } = await supabase
        .from('sellers')
        .select('*');

      // Combine data
      const combinedUsers = authUsers.users.map(authUser => {
        const profile = profiles?.find(p => p.id === authUser.id);
        const sellerApp = sellerApplications?.find(app => app.user_id === authUser.id);
        const seller = sellers?.find(s => s.user_id === authUser.id);
        
        let userType = authUser.user_metadata?.user_type || profile?.user_type || 'buyer';
        let status: 'active' | 'suspended' | 'pending' | 'banned' = 'active';
        let approvalStatus: 'approved' | 'pending' | 'rejected' = 'approved';
        
        if (authUser.banned) {
          status = 'banned';
        }
        
        if (userType.includes('seller')) {
          if (sellerApp) {
            if (sellerApp.status === 'pending' || sellerApp.status === 'under_review') {
              status = 'pending';
              approvalStatus = 'pending';
              userType = 'seller_pending';
            } else if (sellerApp.status === 'approved') {
              status = 'active';
              approvalStatus = 'approved';
              userType = 'seller';
            } else if (sellerApp.status === 'rejected') {
              status = 'suspended';
              approvalStatus = 'rejected';
              userType = 'seller_rejected';
            }
          }
          
          if (seller) {
            if (seller.status === 'suspended') {
              status = 'suspended';
            } else if (seller.approval_status === 'pending') {
              status = 'pending';
              approvalStatus = 'pending';
              userType = 'seller_pending';
            }
          }
        }

        return {
          id: authUser.id,
          email: authUser.email,
          full_name: authUser.user_metadata?.full_name || 
                    profile?.full_name || 
                    sellerApp?.full_name || 
                    'Unknown User',
          user_type: userType,
          phone: sellerApp?.contact_number || profile?.phone || '',
          business_name: sellerApp?.business_name || seller?.business_name || '',
          status,
          approval_status: approvalStatus,
          created_at: authUser.created_at,
          total_orders: 0,
          total_spent: 0,
          total_products: seller?.total_products || 0,
        };
      });

      return combinedUsers;
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  },

  // Approve seller application
  async approveSellerApplication(applicationId: string, adminId: string, notes?: string) {
    try {
      // Get application
      const { data: application, error: appError } = await supabase
        .from('seller_applications')
        .select('*')
        .eq('id', applicationId)
        .single();

      if (appError) throw appError;

      // Update application status
      await supabase
        .from('seller_applications')
        .update({
          status: 'approved',
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
          admin_notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      // Create seller record
      await supabase
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
          commission_rate: 10.00,
          total_products: 0,
          total_orders: 0,
          total_revenue: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      // Update user metadata
      await supabase.auth.admin.updateUserById(
        application.user_id,
        {
          user_metadata: {
            user_type: 'seller',
            seller_status: 'approved',
            approved_at: new Date().toISOString()
          }
        }
      );

      return { success: true, message: 'Seller approved successfully' };
    } catch (error) {
      console.error('Error approving seller:', error);
      return { success: false, message: 'Failed to approve seller' };
    }
  },

  // Reject seller application
  async rejectSellerApplication(applicationId: string, adminId: string, reason: string, notes?: string) {
    try {
      // Get application
      const { data: application, error: appError } = await supabase
        .from('seller_applications')
        .select('*')
        .eq('id', applicationId)
        .single();

      if (appError) throw appError;

      // Update application status
      await supabase
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

      // Update user metadata
      await supabase.auth.admin.updateUserById(
        application.user_id,
        {
          user_metadata: {
            user_type: 'seller_rejected',
            seller_status: 'rejected',
            rejection_reason: reason,
            rejected_at: new Date().toISOString()
          }
        }
      );

      return { success: true, message: 'Seller application rejected' };
    } catch (error) {
      console.error('Error rejecting seller:', error);
      return { success: false, message: 'Failed to reject seller' };
    }
  },

  // Request more information
  async requestMoreInfo(applicationId: string, adminId: string, requestDetails: string) {
    try {
      await supabase
        .from('seller_applications')
        .update({
          status: 'more_info_needed',
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
          admin_notes: requestDetails,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      return { success: true, message: 'Information requested successfully' };
    } catch (error) {
      console.error('Error requesting info:', error);
      return { success: false, message: 'Failed to request information' };
    }
  },

  // Update user status
  async updateUserStatus(userId: string, status: 'active' | 'suspended' | 'banned') {
    try {
      if (status === 'banned') {
        await supabase.auth.admin.updateUserById(
          userId,
          { ban_duration: '87600h' }
        );
      } else {
        await supabase.auth.admin.updateUserById(
          userId,
          { ban_duration: 'none' }
        );

        // Update seller status if exists
        await supabase
          .from('sellers')
          .update({ 
            status: status === 'active' ? 'active' : 'suspended',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
      }

      return { success: true, message: 'User status updated' };
    } catch (error) {
      console.error('Error updating user status:', error);
      return { success: false, message: 'Failed to update user status' };
    }
  },

  // Delete user
  async deleteUser(userId: string) {
    try {
      // Delete from auth
      await supabase.auth.admin.deleteUser(userId);

      // Delete from related tables
      await supabase.from('profiles').delete().eq('id', userId);
      await supabase.from('seller_applications').delete().eq('user_id', userId);
      await supabase.from('sellers').delete().eq('user_id', userId);

      return { success: true, message: 'User deleted successfully' };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { success: false, message: 'Failed to delete user' };
    }
  }
};