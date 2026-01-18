// src/api/users.ts - COMPLETE UPDATED VERSION
import { supabase } from '../lib/supabase';
import { sellersApi } from '@/lib/supabase/sellers';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  name?: string;
  user_type: 'admin' | 'seller' | 'buyer' | 'seller_pending' | 'seller_rejected';
  user_metadata?: any;
  created_at: string;
  last_sign_in_at?: string;
  banned?: boolean;
  phone?: string;
  avatar_url?: string;
  business_name?: string;
  business_type?: string;
  status: 'active' | 'suspended' | 'pending' | 'banned';
  total_orders?: number;
  total_spent?: number;
  total_products?: number;
  approval_status?: 'approved' | 'pending' | 'rejected' | 'suspended';
}

export interface UserStats {
  total_orders: number;
  total_spent: number;
  total_products: number;
  avg_order_value: number;
  last_order_date: string | null;
}

export const usersAPI = {
  // Get all users with SIMPLIFIED LOGIC - Profile is PRIMARY source
  async getAllUsers() {
    try {
      console.log('=== FETCHING ALL USERS ===');
      
      // STEP 1: Get all profiles - PRIMARY SOURCE OF TRUTH
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      if (!profiles || profiles.length === 0) {
        console.log('No profiles found');
        return [];
      }

      console.log('Total profiles found:', profiles.length);

      // STEP 2: Get sellers for additional data (optional)
      const { data: sellers = [], error: sellersError } = await supabase
        .from('sellers')
        .select('*');

      if (sellersError) {
        console.warn('Note: Could not fetch sellers:', sellersError.message);
      }

      console.log('Total sellers found:', sellers.length);

      // STEP 3: Create user objects - SIMPLE AND DIRECT LOGIC
      const combinedUsers = profiles.map(profile => {
        // Find matching seller (if exists)
        const seller = sellers.find(s => s.user_id === profile.id);
        
        // PRIMARY LOGIC: Use profile.user_type DIRECTLY
        // This is set by sellersApi.approveSellerApplication()
        let userType: User['user_type'] = profile.user_type as any || 'buyer';
        let status: User['status'] = 'active';
        let approval_status: User['approval_status'] = 'approved';

        // DEBUG LOG
        console.log(`Processing user ${profile.email}:`, {
          profileUserType: profile.user_type,
          sellerExists: !!seller,
          sellerApproval: seller?.approval_status
        });

        // For sellers or seller_pending users
        if (userType === 'seller' || userType === 'seller_pending' || userType === 'seller_rejected') {
          if (seller) {
            // If we have seller record, use its status
            approval_status = seller.approval_status as any || 'pending';
            status = seller.status === 'active' ? 'active' : 
                     seller.status === 'inactive' ? 'suspended' : 'pending';
            
            // Ensure user_type matches seller approval status
            if (seller.approval_status === 'approved') {
              userType = 'seller';
              status = 'active';
            } else if (seller.approval_status === 'pending') {
              userType = 'seller_pending';
              status = 'pending';
            } else if (seller.approval_status === 'rejected') {
              userType = 'seller_rejected';
              status = 'suspended';
            } else if (seller.approval_status === 'suspended') {
              userType = 'seller';
              status = 'suspended';
            }
          } else {
            // No seller record but profile says seller type
            // This happens right after approval before seller record is created
            if (userType === 'seller') {
              // Profile already updated to seller, treat as approved
              approval_status = 'approved';
              status = 'active';
            } else if (userType === 'seller_pending') {
              approval_status = 'pending';
              status = 'pending';
            } else if (userType === 'seller_rejected') {
              approval_status = 'rejected';
              status = 'suspended';
            }
          }
        }

        // For non-seller users
        if (userType === 'buyer' || userType === 'admin') {
          status = 'active';
          approval_status = 'approved';
        }

        // Create user object
        const userObj: User = {
          id: profile.id,
          email: profile.email || 'No email',
          full_name: profile.full_name || 'Unknown User',
          user_type: userType,
          user_metadata: {},
          created_at: profile.created_at,
          last_sign_in_at: null,
          banned: false,
          phone: profile.phone || '',
          avatar_url: profile.avatar_url,
          business_name: profile.business_name || seller?.business_name,
          business_type: profile.business_type || seller?.business_type,
          status,
          approval_status,
          total_orders: 0,
          total_spent: 0,
          total_products: seller?.total_products || 0,
        };

        // DEBUG: Log seller users
        if (userType.includes('seller')) {
          console.log('Seller user created:', {
            email: userObj.email,
            user_type: userObj.user_type,
            approval_status: userObj.approval_status,
            business_name: userObj.business_name
          });
        }

        return userObj;
      });

      // Summary statistics
      console.log('=== USER SUMMARY ===');
      const userTypeCount = combinedUsers.reduce((acc: any, user: any) => {
        acc[user.user_type] = (acc[user.user_type] || 0) + 1;
        return acc;
      }, {});
      console.log('User type counts:', userTypeCount);

      const approvedSellers = combinedUsers.filter((u: any) => 
        u.user_type === 'seller' && u.approval_status === 'approved'
      );
      console.log('Approved sellers found:', approvedSellers.length);

      return combinedUsers.filter(user => user !== null && user.email !== 'No email');
      
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      
      // Fallback: Try to get auth users
      try {
        console.log('Trying fallback to auth users...');
        const { data: authUsers } = await supabase.auth.admin.listUsers();
        
        if (authUsers?.users) {
          console.log('Fallback successful, got auth users:', authUsers.users.length);
          return authUsers.users.map(user => ({
            id: user.id,
            email: user.email || 'No email',
            full_name: user.user_metadata?.full_name || 'Unknown',
            user_type: user.user_metadata?.user_type || 'buyer',
            user_metadata: user.user_metadata,
            created_at: user.created_at,
            last_sign_in_at: user.last_sign_in_at,
            banned: user.banned || false,
            status: user.banned ? 'banned' : 'active',
            approval_status: 'approved',
            total_orders: 0,
            total_spent: 0,
            total_products: 0,
          } as User));
        }
        
        return [];
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        return [];
      }
    }
  },

  // Update user status (activate/suspend/ban)
  async updateUserStatus(userId: string, status: 'active' | 'suspended' | 'banned') {
    try {
      if (status === 'banned') {
        // Ban user in auth
        const { data, error } = await supabase.auth.admin.updateUserById(
          userId,
          { ban_duration: '87600h' }
        );
        if (error) throw error;
        
        // Update seller status if exists
        await supabase
          .from('sellers')
          .update({ 
            approval_status: 'suspended',
            status: 'inactive',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
          
        return { success: true, data };
      } else {
        // Unban user if previously banned
        const { data, error } = await supabase.auth.admin.updateUserById(
          userId,
          { ban_duration: 'none' }
        );
        if (error) throw error;

        // Update user metadata
        await supabase.auth.admin.updateUserById(
          userId,
          {
            user_metadata: {
              status: status,
              updated_at: new Date().toISOString()
            }
          }
        );

        // Update seller status if exists
        const sellerStatus = status === 'active' ? 'active' : 'inactive';
        const sellerApprovalStatus = status === 'active' ? 'approved' : 'suspended';
        
        await supabase
          .from('sellers')
          .update({ 
            status: sellerStatus,
            approval_status: sellerApprovalStatus,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        return { success: true, data };
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  },

  // Update seller approval status
  async updateSellerApproval(userId: string, approvalStatus: 'approved' | 'rejected', notes?: string) {
    try {
      console.log(`Updating seller approval for ${userId} to ${approvalStatus}`);
      
      // CRITICAL: Update profile FIRST - this ensures users page shows correct type immediately
      const profileUpdateData: any = {
        updated_at: new Date().toISOString()
      };

      if (approvalStatus === 'approved') {
        profileUpdateData.user_type = 'seller';
      } else {
        profileUpdateData.user_type = 'seller_rejected';
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdateData)
        .eq('id', userId);

      if (profileError) {
        console.error('Error updating profile:', profileError);
      } else {
        console.log('Profile updated successfully to:', profileUpdateData.user_type);
      }

      // Find seller application
      const { data: sellerApp, error: sellerAppError } = await supabase
        .from('seller_applications')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (sellerAppError && sellerAppError.code !== 'PGRST116') {
        throw sellerAppError;
      }

      if (sellerApp) {
        if (approvalStatus === 'approved') {
          const adminId = 'admin';
          const result = await sellersApi.approveSellerApplication(sellerApp.id, adminId, notes);
          return { success: true, ...result };
        } else {
          const adminId = 'admin';
          const result = await sellersApi.rejectSellerApplication(sellerApp.id, adminId, notes || 'No reason provided', notes);
          return { success: true, ...result };
        }
      } else {
        // Update seller directly if no application
        const { error: sellerError } = await supabase
          .from('sellers')
          .update({ 
            approval_status: approvalStatus,
            status: approvalStatus === 'approved' ? 'active' : 'inactive',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (sellerError) throw sellerError;

        // Trigger refresh event
        window.dispatchEvent(new Event('refreshUsers'));

        return { success: true, message: `Seller ${approvalStatus} successfully` };
      }
    } catch (error) {
      console.error('Error updating seller approval:', error);
      throw error;
    }
  },

  // Suspend a seller
  async suspendUser(userId: string, reason: string) {
    try {
      console.log(`Suspending user ${userId}, reason: ${reason}`);
      
      // Check if it's a seller
      const { data: seller, error: sellerError } = await supabase
        .from('sellers')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (sellerError && sellerError.code !== 'PGRST116') {
        throw sellerError;
      }

      if (seller) {
        const adminId = 'admin';
        const result = await sellersApi.suspendSeller(seller.id, reason, adminId);
        return { success: true, ...result };
      } else {
        const result = await this.updateUserStatus(userId, 'suspended');
        return { success: true, ...result };
      }
    } catch (error) {
      console.error('Error suspending user:', error);
      throw error;
    }
  },

  // Activate a seller
  async activateUser(userId: string) {
    try {
      console.log(`Activating user ${userId}`);
      
      const { data: seller, error: sellerError } = await supabase
        .from('sellers')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (sellerError && sellerError.code !== 'PGRST116') {
        throw sellerError;
      }

      if (seller) {
        const adminId = 'admin';
        const result = await sellersApi.activateSeller(seller.id, adminId);
        return { success: true, ...result };
      } else {
        const result = await this.updateUserStatus(userId, 'active');
        return { success: true, ...result };
      }
    } catch (error) {
      console.error('Error activating user:', error);
      throw error;
    }
  },

  // Delete user
  async deleteUser(userId: string) {
    try {
      console.log(`Deleting user ${userId}`);
      
      const deletePromises = [
        supabase.from('profiles').delete().eq('id', userId),
        supabase.from('seller_applications').delete().eq('user_id', userId),
        supabase.from('sellers').delete().eq('user_id', userId),
        supabase.from('notifications').delete().eq('user_id', userId)
      ];

      await Promise.allSettled(deletePromises);

      const { data, error } = await supabase.auth.admin.deleteUser(userId);
      if (error) throw error;

      // Trigger refresh
      window.dispatchEvent(new Event('refreshUsers'));

      return { success: true, data };
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  // Send message to user
  async sendMessageToUser(userId: string, subject: string, message: string) {
    try {
      const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId);
      
      if (userError) throw userError;
      if (!user) throw new Error('User not found');
      
      const { error: insertError } = await supabase
        .from('admin_messages')
        .insert({
          receiver_id: userId,
          subject,
          message,
          is_read: false,
          created_at: new Date().toISOString()
        });

      if (insertError) throw insertError;

      return { success: true, message: 'Message sent successfully' };
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // Get user stats
  async getUserStats(userId: string): Promise<UserStats> {
    try {
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('total_amount, created_at')
        .eq('buyer_id', userId);

      if (ordersError) {
        console.warn('Note: Could not fetch orders:', ordersError.message);
      }

      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id')
        .eq('seller_id', userId);

      if (productsError) {
        console.warn('Note: Could not fetch products:', productsError.message);
      }

      const totalOrders = orders?.length || 0;
      const totalSpent = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      const totalProducts = products?.length || 0;
      const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
      const lastOrderDate = orders && orders.length > 0 
        ? new Date(Math.max(...orders.map(o => new Date(o.created_at).getTime()))).toISOString()
        : null;

      return {
        total_orders: totalOrders,
        total_spent: totalSpent,
        total_products: totalProducts,
        avg_order_value: avgOrderValue,
        last_order_date: lastOrderDate
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return {
        total_orders: 0,
        total_spent: 0,
        total_products: 0,
        avg_order_value: 0,
        last_order_date: null
      };
    }
  },

  // Get user details with all related info
  async getUserDetails(userId: string) {
    try {
      console.log(`Getting details for user ${userId}`);
      
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
      if (authError) throw authError;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      const { data: sellerApplication, error: sellerAppError } = await supabase
        .from('seller_applications')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (sellerAppError && sellerAppError.code !== 'PGRST116') {
        throw sellerAppError;
      }

      const { data: seller, error: sellerError } = await supabase
        .from('sellers')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (sellerError && sellerError.code !== 'PGRST116') {
        throw sellerError;
      }

      const stats = await this.getUserStats(userId);

      let products = [];
      if (seller) {
        const { data: userProducts, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('seller_id', userId);

        if (productsError) {
          console.warn('Note: Could not fetch products:', productsError.message);
        }
        products = userProducts || [];
      }

      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .limit(10);

      if (ordersError) {
        console.warn('Note: Could not fetch orders:', ordersError.message);
      }

      return {
        auth: authUser,
        profile,
        seller_application: sellerApplication,
        seller,
        stats,
        products,
        recent_orders: orders || []
      };
    } catch (error) {
      console.error('Error getting user details:', error);
      throw error;
    }
  },

  // Bulk actions
  async bulkUpdateUsers(userIds: string[], action: 'activate' | 'suspend' | 'delete' | 'approve_seller' | 'reject_seller') {
    try {
      console.log(`Bulk action ${action} on ${userIds.length} users`);
      
      const results = [];
      
      for (const userId of userIds) {
        try {
          let result;
          
          switch (action) {
            case 'activate':
              result = await this.activateUser(userId);
              break;
            case 'suspend':
              result = await this.suspendUser(userId, 'Bulk suspension by admin');
              break;
            case 'delete':
              result = await this.deleteUser(userId);
              break;
            case 'approve_seller':
              result = await this.updateSellerApproval(userId, 'approved');
              break;
            case 'reject_seller':
              result = await this.updateSellerApproval(userId, 'rejected');
              break;
            default:
              throw new Error(`Unknown action: ${action}`);
          }
          
          results.push({ userId, success: true, result });
        } catch (error: any) {
          results.push({ 
            userId, 
            success: false, 
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      }
      
      // Trigger refresh after bulk action
      window.dispatchEvent(new Event('refreshUsers'));
      
      return {
        success: results.every(r => r.success),
        results,
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      };
    } catch (error) {
      console.error('Error in bulk action:', error);
      throw error;
    }
  },

  // DEBUG FUNCTION: Check user data
  async debugUser(userId: string) {
    try {
      console.log(`=== DEBUG USER ${userId} ===`);
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      const { data: seller } = await supabase
        .from('sellers')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      const { data: app } = await supabase
        .from('seller_applications')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      const result = {
        profile: profile ? {
          id: profile.id,
          email: profile.email,
          user_type: profile.user_type,
          business_name: profile.business_name,
          created_at: profile.created_at
        } : null,
        seller: seller ? {
          id: seller.id,
          approval_status: seller.approval_status,
          status: seller.status,
          business_name: seller.business_name
        } : null,
        application: app ? {
          id: app.id,
          status: app.status,
          business_name: app.business_name
        } : null
      };
      
      console.log('Debug result:', result);
      
      return result;
    } catch (error) {
      console.error('Debug error:', error);
      return null;
    }
  },

  // Force refresh users (for testing)
  async forceRefreshUsers() {
    console.log('Force refreshing users data...');
    window.dispatchEvent(new CustomEvent('refreshUsers', { 
      detail: { forced: true, timestamp: new Date().toISOString() }
    }));
    return { success: true, message: 'Refresh triggered' };
  }
};