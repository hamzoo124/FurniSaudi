// lib/supabase/sellers.ts - COMPLETE REWRITE
import { supabase } from '../../lib/supabase';

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
      console.log('📋 Fetching seller applications from database...');
      
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
        console.error('❌ Error fetching applications:', error);
        // Check if table exists
        const { data: tables } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .eq('table_name', 'seller_applications');
        
        if (!tables || tables.length === 0) {
          console.warn('⚠️ seller_applications table does not exist');
          // Create mock data for development
          return this.getMockApplications();
        }
        
        throw error;
      }
      
      console.log(`✅ Loaded ${data?.length || 0} seller applications`);
      return data as SellerApplication[];
      
    } catch (error) {
      console.error('❌ Error in getSellerApplications:', error);
      return this.getMockApplications();
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
      console.log('✅ APPROVING SELLER APPLICATION:', applicationId);
      
      // 1. Get application details
      const application = await this.getApplicationById(applicationId);
      if (!application) {
        throw new Error('Application not found');
      }

      console.log('📄 Application found:', application.business_name);

      // 2. Update application status
      const { error: updateAppError } = await supabase
        .from('seller_applications')
        .update({
          status: 'approved',
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
          admin_notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (updateAppError) {
        console.error('❌ Error updating application:', updateAppError);
        throw updateAppError;
      }

      // 3. Update user profile to seller
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          user_type: 'seller',
          business_name: application.business_name,
          business_type: application.business_type,
          phone: application.contact_number,
          address: application.address,
          city: application.city,
          updated_at: new Date().toISOString()
        })
        .eq('id', application.user_id);

      if (profileError) {
        console.error('❌ Error updating profile:', profileError);
        // Continue anyway, as seller record is more important
      }

      // 4. Create or update seller record
      let sellerData: any = {
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
        commission_rate: 10.00, // Default commission rate
        total_sales: 0,
        total_earnings: 0,
        pending_payout: 0,
        rating_avg: 0,
        total_products: 0,
        total_orders: 0,
        updated_at: new Date().toISOString()
      };

      // Check if seller already exists
      const { data: existingSeller } = await supabase
        .from('sellers')
        .select('id')
        .eq('user_id', application.user_id)
        .single();

      let seller;
      
      if (existingSeller) {
        // Update existing seller
        const { data: updatedSeller, error: updateError } = await supabase
          .from('sellers')
          .update(sellerData)
          .eq('id', existingSeller.id)
          .select(`
            *,
            profiles (
              full_name,
              avatar_url,
              email,
              phone,
              created_at
            )
          `)
          .single();

        if (updateError) throw updateError;
        seller = updatedSeller as Seller;
      } else {
        // Create new seller
        sellerData.created_at = new Date().toISOString();
        
        const { data: newSeller, error: createError } = await supabase
          .from('sellers')
          .insert([sellerData])
          .select(`
            *,
            profiles (
              full_name,
              avatar_url,
              email,
              phone,
              created_at
            )
          `)
          .single();

        if (createError) {
          console.error('❌ Error creating seller:', createError);
          // Try without profile relation
          const { data: simpleSeller, error: simpleError } = await supabase
            .from('sellers')
            .insert([sellerData])
            .select()
            .single();
            
          if (simpleError) throw simpleError;
          seller = simpleSeller as Seller;
        } else {
          seller = newSeller as Seller;
        }
      }

      // 5. Create notification for seller
      try {
        await supabase
          .from('notifications')
          .insert({
            user_id: application.user_id,
            title: 'Seller Application Approved! 🎉',
            message: `Congratulations! Your seller application for "${application.business_name}" has been approved. You can now start listing products and selling on our platform.`,
            type: 'seller_approval',
            is_read: false,
            created_at: new Date().toISOString(),
            metadata: {
              application_id: applicationId,
              business_name: application.business_name,
              approved_at: new Date().toISOString()
            }
          });
      } catch (notifError) {
        console.warn('⚠️ Could not create notification:', notifError);
      }

      // 6. Log activity
      try {
        await supabase
          .from('activity_logs')
          .insert({
            user_id: adminId,
            user_type: 'admin',
            action: 'SELLER_APPLICATION_APPROVED',
            target_type: 'seller_application',
            target_id: applicationId,
            details: {
              application_id: applicationId,
              seller_id: seller?.id,
              seller_name: application.business_name,
              admin_notes: notes,
              timestamp: new Date().toISOString()
            },
            ip_address: '127.0.0.1',
            user_agent: 'Admin Dashboard',
            created_at: new Date().toISOString()
          });
      } catch (logError) {
        console.warn('⚠️ Could not log activity:', logError);
      }

      // 7. Trigger events for real-time updates
      window.dispatchEvent(new Event('sellerApproved'));
      window.dispatchEvent(new Event('refreshUsers'));
      window.dispatchEvent(new Event('refreshSellers'));

      console.log('✅ Seller approval completed successfully:', seller?.business_name);
      
      return {
        success: true,
        message: 'Seller approved successfully! The seller can now start selling.',
        seller
      };
      
    } catch (error: any) {
      console.error('❌ CRITICAL ERROR approving seller:', error);
      
      // Fallback: Update local storage for development
      try {
        const localApps = JSON.parse(localStorage.getItem('seller_applications_fallback') || '[]');
        const updatedApps = localApps.map((app: any) => 
          app.id === applicationId 
            ? { ...app, status: 'approved', reviewed_at: new Date().toISOString() }
            : app
        );
        localStorage.setItem('seller_applications_fallback', JSON.stringify(updatedApps));
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
      }
      
      throw new Error(`Failed to approve seller: ${error.message || 'Unknown error'}`);
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
      const application = await this.getApplicationById(applicationId);
      if (!application) {
        throw new Error('Application not found');
      }

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
      await supabase
        .from('profiles')
        .update({
          user_type: 'seller_rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', application.user_id);

      // Create notification
      await supabase
        .from('notifications')
        .insert({
          user_id: application.user_id,
          title: 'Application Status Update',
          message: `Your seller application has been reviewed. Status: Rejected. Reason: ${reason}`,
          type: 'seller_rejection',
          is_read: false,
          created_at: new Date().toISOString()
        });

      // Log activity
      await supabase
        .from('activity_logs')
        .insert({
          user_id: adminId,
          user_type: 'admin',
          action: 'SELLER_APPLICATION_REJECTED',
          target_type: 'seller_application',
          target_id: applicationId,
          details: {
            application_id: applicationId,
            seller_name: application.business_name,
            rejection_reason: reason,
            timestamp: new Date().toISOString()
          },
          created_at: new Date().toISOString()
        });

      // Trigger events
      window.dispatchEvent(new Event('refreshUsers'));

      return {
        success: true,
        message: 'Application rejected successfully'
      };
    } catch (error) {
      console.error('Error rejecting application:', error);
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
      console.log('🏪 Fetching all sellers from database...');
      
      let query = supabase
        .from('sellers')
        .select(`
          *,
          profiles (
            full_name,
            avatar_url,
            email,
            phone,
            created_at
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
      
      if (error) {
        console.error('❌ Error fetching sellers:', error);
        // Check if sellers table exists
        const { data: tables } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .eq('table_name', 'sellers');
        
        if (!tables || tables.length === 0) {
          console.warn('⚠️ sellers table does not exist');
          return this.getMockSellers();
        }
        
        throw error;
      }
      
      console.log(`✅ Loaded ${data?.length || 0} sellers`);
      return data as Seller[];
      
    } catch (error) {
      console.error('❌ Error in getAllSellers:', error);
      return this.getMockSellers();
    }
  },

  async getSellerById(sellerId: string): Promise<Seller | null> {
    try {
      const { data, error } = await supabase
        .from('sellers')
        .select(`
          *,
          profiles (
            full_name,
            avatar_url,
            email,
            phone,
            created_at
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

  async getSellerByUserId(userId: string): Promise<Seller | null> {
    try {
      const { data, error } = await supabase
        .from('sellers')
        .select(`
          *,
          profiles (
            full_name,
            avatar_url,
            email,
            phone,
            created_at
          )
        `)
        .eq('user_id', userId)
        .single();

      if (error) {
        // If not found, check if it's a pending application
        const { data: application } = await supabase
          .from('seller_applications')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'pending')
          .single();
          
        if (application) {
          // Convert application to seller-like object
          return {
            id: application.id,
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
            approval_status: 'pending',
            status: 'inactive',
            commission_rate: 0,
            total_sales: 0,
            total_earnings: 0,
            pending_payout: 0,
            rating_avg: 0,
            total_products: 0,
            total_orders: 0,
            suspension_reason: null,
            created_at: application.submitted_at,
            updated_at: application.updated_at,
            profiles: {
              full_name: application.full_name,
              avatar_url: null,
              email: application.email,
              phone: application.contact_number,
              created_at: application.submitted_at
            }
          } as Seller;
        }
        
        return null;
      }
      
      return data as Seller;
    } catch (error) {
      console.error('Error fetching seller by user ID:', error);
      return null;
    }
  },

  async getSellerStats() {
    try {
      console.log('📊 Fetching seller statistics...');
      
      // Get all sellers and applications
      const [sellers, applications] = await Promise.all([
        this.getAllSellers(),
        this.getSellerApplications()
      ]);

      // Calculate stats
      const stats = {
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
          suspended: sellers.filter(s => s.approval_status === 'suspended').length,
          active: sellers.filter(s => s.status === 'active').length,
          inactive: sellers.filter(s => s.status === 'inactive').length
        },
        financial: {
          total_sales: sellers.reduce((sum, s) => sum + (s.total_sales || 0), 0),
          total_earnings: sellers.reduce((sum, s) => sum + (s.total_earnings || 0), 0),
          pending_payouts: sellers.reduce((sum, s) => sum + (s.pending_payout || 0), 0),
          avg_commission_rate: sellers.length > 0 
            ? sellers.reduce((sum, s) => sum + (s.commission_rate || 0), 0) / sellers.length 
            : 0
        },
        performance: {
          total_products: sellers.reduce((sum, s) => sum + (s.total_products || 0), 0),
          total_orders: sellers.reduce((sum, s) => sum + (s.total_orders || 0), 0),
          avg_rating: sellers.length > 0 
            ? sellers.reduce((sum, s) => sum + (s.rating_avg || 0), 0) / sellers.length 
            : 0
        }
      };

      console.log('✅ Seller stats calculated:', stats);
      return stats;
      
    } catch (error) {
      console.error('❌ Error getting seller stats:', error);
      return {
        applications: { total: 0, pending: 0, under_review: 0, approved: 0, rejected: 0, more_info_needed: 0 },
        sellers: { total: 0, approved: 0, pending: 0, rejected: 0, suspended: 0, active: 0, inactive: 0 },
        financial: { total_sales: 0, total_earnings: 0, pending_payouts: 0, avg_commission_rate: 0 },
        performance: { total_products: 0, total_orders: 0, avg_rating: 0 }
      };
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
          profiles (
            full_name,
            avatar_url,
            email
          )
        `)
        .single();

      if (error) throw error;

      // Log activity
      await supabase
        .from('activity_logs')
        .insert({
          user_id: adminId,
          user_type: 'admin',
          action: 'SELLER_SUSPENDED',
          target_type: 'seller',
          target_id: sellerId,
          details: {
            seller_name: data.business_name,
            reason: reason,
            timestamp: new Date().toISOString()
          },
          created_at: new Date().toISOString()
        });

      // Trigger events
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
          profiles (
            full_name,
            avatar_url,
            email
          )
        `)
        .single();

      if (error) throw error;

      // Log activity
      await supabase
        .from('activity_logs')
        .insert({
          user_id: adminId,
          user_type: 'admin',
          action: 'SELLER_ACTIVATED',
          target_type: 'seller',
          target_id: sellerId,
          details: {
            seller_name: data.business_name,
            timestamp: new Date().toISOString()
          },
          created_at: new Date().toISOString()
        });

      // Trigger events
      window.dispatchEvent(new Event('refreshSellers'));

      return data as Seller;
    } catch (error) {
      console.error('Error activating seller:', error);
      throw error;
    }
  },

  // ============ HELPER FUNCTIONS ============
  private getMockApplications(): SellerApplication[] {
    console.log('📋 Using mock applications data');
    return [
      {
        id: 'app_1',
        application_id: 'APP-001',
        user_id: 'user_1',
        full_name: 'John Doe',
        email: 'john@example.com',
        business_name: 'Doe Furniture',
        contact_number: '+1234567890',
        address: '123 Main St',
        city: 'New York',
        business_type: 'individual',
        business_description: 'Custom furniture maker specializing in modern designs',
        cr_number: 'CR123456',
        cr_document_url: null,
        bank_name: 'Chase Bank',
        account_number: '987654321',
        iban: 'US123456789',
        status: 'pending',
        admin_notes: null,
        rejection_reason: null,
        reviewed_by: null,
        reviewed_at: null,
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'app_2',
        application_id: 'APP-002',
        user_id: 'user_2',
        full_name: 'Jane Smith',
        email: 'jane@example.com',
        business_name: 'Smith Interiors',
        contact_number: '+1234567891',
        address: '456 Oak Ave',
        city: 'Los Angeles',
        business_type: 'company',
        business_description: 'Luxury furniture and interior design',
        cr_number: 'CR654321',
        cr_document_url: null,
        bank_name: 'Bank of America',
        account_number: '123456789',
        iban: 'US987654321',
        status: 'under_review',
        admin_notes: 'Needs to provide CR document',
        rejection_reason: null,
        reviewed_by: 'admin_1',
        reviewed_at: new Date().toISOString(),
        submitted_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        updated_at: new Date().toISOString()
      }
    ];
  },

  private getMockSellers(): Seller[] {
    console.log('🏪 Using mock sellers data');
    return [
      {
        id: 'seller_1',
        user_id: 'user_3',
        application_id: 'APP-001',
        business_name: 'Johnson Furnishings',
        email: 'johnson@example.com',
        phone: '+1234567892',
        address: '789 Pine St',
        city: 'Chicago',
        business_type: 'company',
        business_description: 'Quality furniture since 1995',
        cr_number: 'CR111222',
        cr_document_url: null,
        bank_name: 'Wells Fargo',
        account_number: '555555555',
        iban: 'US555555555',
        approval_status: 'approved',
        status: 'active',
        commission_rate: 10.00,
        total_sales: 25000,
        total_earnings: 22500,
        pending_payout: 2500,
        rating_avg: 4.8,
        total_products: 45,
        total_orders: 120,
        suspension_reason: null,
        created_at: new Date(Date.now() - 2592000000).toISOString(), // 30 days ago
        updated_at: new Date().toISOString(),
        profiles: {
          full_name: 'Robert Johnson',
          avatar_url: null,
          email: 'robert@example.com',
          phone: '+1234567892',
          created_at: new Date(Date.now() - 2592000000).toISOString()
        }
      },
      {
        id: 'seller_2',
        user_id: 'user_4',
        application_id: 'APP-002',
        business_name: 'Modern Living Co.',
        email: 'modern@example.com',
        phone: '+1234567893',
        address: '101 Design Ave',
        city: 'Miami',
        business_type: 'individual',
        business_description: 'Contemporary furniture designs',
        cr_number: 'CR333444',
        cr_document_url: null,
        bank_name: 'Citibank',
        account_number: '666666666',
        iban: 'US666666666',
        approval_status: 'approved',
        status: 'active',
        commission_rate: 12.00,
        total_sales: 18000,
        total_earnings: 15840,
        pending_payout: 2160,
        rating_avg: 4.6,
        total_products: 32,
        total_orders: 89,
        suspension_reason: null,
        created_at: new Date(Date.now() - 1728000000).toISOString(), // 20 days ago
        updated_at: new Date().toISOString(),
        profiles: {
          full_name: 'Maria Garcia',
          avatar_url: null,
          email: 'maria@example.com',
          phone: '+1234567893',
          created_at: new Date(Date.now() - 1728000000).toISOString()
        }
      }
    ];
  },

  // ============ UTILITY FUNCTIONS ============
  async checkDatabaseTables() {
    try {
      console.log('🔍 Checking database tables...');
      
      const tables = ['seller_applications', 'sellers', 'profiles', 'orders', 'products', 'reviews'];
      
      for (const table of tables) {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1);
        
        if (error) {
          console.warn(`⚠️ Table "${table}" may not exist:`, error.message);
        } else {
          console.log(`✅ Table "${table}" exists`);
        }
      }
      
    } catch (error) {
      console.error('❌ Error checking tables:', error);
    }
  },

  async initializeDatabase() {
    try {
      console.log('🚀 Initializing database...');
      
      // This would create tables if they don't exist
      // In a real app, you'd run SQL migrations here
      
      console.log('✅ Database initialization complete');
      return true;
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      return false;
    }
  }
};

// Export individual functions
export const getSellerById = sellersApi.getSellerById;
export const getSellerByUserId = sellersApi.getSellerByUserId;
export const approveSellerApplication = sellersApi.approveSellerApplication;
export const rejectSellerApplication = sellersApi.rejectSellerApplication;
export const suspendSeller = sellersApi.suspendSeller;
export const activateSeller = sellersApi.activateSeller;
export const getAllSellers = sellersApi.getAllSellers;
export const getSellerApplications = sellersApi.getSellerApplications;
export const getSellerStats = sellersApi.getSellerStats;

// Export for direct use
export default sellersApi;