//// src/api/auth.ts
import { supabase } from '../lib/supabase';

// Types
export interface Admin {
  id: string
  email: string
  name: string
  role: 'super_admin' | 'admin' | 'moderator'
  permissions: string[]
  avatar_url: string | null
  last_login: string | null
  created_at: string
  updated_at: string
  status: 'active' | 'inactive' | 'suspended'
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  name: string
  role?: Admin['role']
  permissions?: string[]
}

// Auth API Functions
export const authApi = {
  // Login admin
  async loginAdmin(credentials: LoginCredentials): Promise<{ data: Admin | null; error: string | null }> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      })

      if (authError) throw authError

      if (!authData.user) {
        throw new Error('No user data returned')
      }

      // Get admin profile
      const { data: adminProfile, error: profileError } = await supabase
        .from('admins')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      if (profileError) {
        // If admin profile doesn't exist, check if user is an admin
        const { data: user } = await supabase
          .from('users')
          .select('role')
          .eq('id', authData.user.id)
          .single()

        if (user?.role !== 'admin') {
          throw new Error('User is not authorized as admin')
        }

        // Create admin profile if doesn't exist
        const newAdmin: Omit<Admin, 'id' | 'created_at' | 'updated_at'> = {
          email: authData.user.email!,
          name: authData.user.user_metadata?.name || authData.user.email!.split('@')[0],
          role: 'admin',
          permissions: ['read', 'write', 'delete'],
          avatar_url: authData.user.user_metadata?.avatar_url || null,
          last_login: new Date().toISOString(),
          status: 'active'
        }

        const { data: createdAdmin } = await supabase
          .from('admins')
          .insert([newAdmin])
          .select()
          .single()

        return { data: createdAdmin, error: null }
      }

      // Update last login
      const { data: updatedAdmin } = await supabase
        .from('admins')
        .update({ last_login: new Date().toISOString() })
        .eq('id', authData.user.id)
        .select()
        .single()

      return { data: updatedAdmin, error: null }
    } catch (error: any) {
      console.error('Login error:', error)
      
      // Handle specific error cases
      let errorMessage = error.message || 'Failed to login'
      
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password'
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Please verify your email address'
      } else if (error.message.includes('User is not authorized')) {
        errorMessage = 'You are not authorized to access the admin panel'
      }

      return { data: null, error: errorMessage }
    }
  },

  // Logout admin
  async logoutAdmin(): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) throw error
      return { success: true, error: null }
    } catch (error: any) {
      console.error('Logout error:', error)
      return { success: false, error: error.message || 'Failed to logout' }
    }
  },

  // Get current admin
  async getCurrentAdmin(): Promise<{ data: Admin | null; error: string | null }> {
    try {
      const { data: session } = await supabase.auth.getSession()
      
      if (!session.session?.user) {
        return { data: null, error: 'No active session' }
      }

      const { data: admin, error } = await supabase
        .from('admins')
        .select('*')
        .eq('id', session.session.user.id)
        .single()

      if (error) throw error
      return { data: admin, error: null }
    } catch (error: any) {
      console.error('Error getting current admin:', error)
      return { data: null, error: error.message || 'Failed to get admin data' }
    }
  },

  // Get admin session
  async getAdminSession(): Promise<{ data: any | null; error: string | null }> {
    try {
      const { data, error } = await supabase.auth.getSession()
      
      if (error) throw error
      return { data, error: null }
    } catch (error: any) {
      console.error('Error getting session:', error)
      return { data: null, error: error.message || 'Failed to get session' }
    }
  },

  // Register new admin (super admin only)
  async registerAdmin(
    adminData: RegisterData,
    createdBy: string
  ): Promise<{ data: Admin | null; error: string | null }> {
    try {
      // Check if current user is super admin
      const { data: currentAdmin } = await this.getCurrentAdmin()
      
      if (!currentAdmin || currentAdmin.role !== 'super_admin') {
        throw new Error('Only super admins can register new admins')
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: adminData.email,
        password: adminData.password,
        options: {
          data: {
            name: adminData.name,
            role: 'admin'
          }
        }
      })

      if (authError) throw authError

      if (!authData.user) {
        throw new Error('Failed to create user')
      }

      // Create admin profile
      const newAdmin: Omit<Admin, 'id' | 'created_at' | 'updated_at'> = {
        email: adminData.email,
        name: adminData.name,
        role: adminData.role || 'admin',
        permissions: adminData.permissions || ['read'],
        avatar_url: null,
        last_login: null,
        status: 'active'
      }

      const { data: admin, error: adminError } = await supabase
        .from('admins')
        .insert([newAdmin])
        .select()
        .single()

      if (adminError) throw adminError

      // Log admin creation
      await supabase
        .from('admin_audit_logs')
        .insert([{
          admin_id: currentAdmin.id,
          action: 'create_admin',
          target_id: admin.id,
          details: `Created new admin: ${admin.email} with role: ${admin.role}`,
          created_at: new Date().toISOString()
        }])

      return { data: admin, error: null }
    } catch (error: any) {
      console.error('Error registering admin:', error)
      return { data: null, error: error.message || 'Failed to register admin' }
    }
  },

  // Update admin profile
  async updateAdminProfile(
    adminId: string,
    updates: Partial<Admin>,
    updatedBy: string
  ): Promise<{ data: Admin | null; error: string | null }> {
    try {
      // Check permissions
      const { data: currentAdmin } = await this.getCurrentAdmin()
      
      if (!currentAdmin || (currentAdmin.id !== adminId && currentAdmin.role !== 'super_admin')) {
        throw new Error('You do not have permission to update this admin')
      }

      const { data, error } = await supabase
        .from('admins')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', adminId)
        .select()
        .single()

      if (error) throw error

      // Log update
      await supabase
        .from('admin_audit_logs')
        .insert([{
          admin_id: updatedBy,
          action: 'update_admin',
          target_id: adminId,
          details: `Updated admin profile: ${JSON.stringify(updates)}`,
          created_at: new Date().toISOString()
        }])

      return { data, error: null }
    } catch (error: any) {
      console.error('Error updating admin profile:', error)
      return { data: null, error: error.message || 'Failed to update admin profile' }
    }
  },

  // Delete admin (super admin only)
  async deleteAdmin(
    adminId: string,
    deletedBy: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      // Check if current user is super admin
      const { data: currentAdmin } = await this.getCurrentAdmin()
      
      if (!currentAdmin || currentAdmin.role !== 'super_admin') {
        throw new Error('Only super admins can delete admins')
      }

      // Cannot delete self
      if (currentAdmin.id === adminId) {
        throw new Error('Cannot delete your own account')
      }

      const { error } = await supabase
        .from('admins')
        .delete()
        .eq('id', adminId)

      if (error) throw error

      // Log deletion
      await supabase
        .from('admin_audit_logs')
        .insert([{
          admin_id: deletedBy,
          action: 'delete_admin',
          target_id: adminId,
          details: `Deleted admin account`,
          created_at: new Date().toISOString()
        }])

      return { success: true, error: null }
    } catch (error: any) {
      console.error('Error deleting admin:', error)
      return { success: false, error: error.message || 'Failed to delete admin' }
    }
  },

  // Get all admins (super admin only)
  async getAllAdmins(): Promise<{ data: Admin[] | null; error: string | null }> {
    try {
      // Check if current user is super admin
      const { data: currentAdmin } = await this.getCurrentAdmin()
      
      if (!currentAdmin || currentAdmin.role !== 'super_admin') {
        throw new Error('Only super admins can view all admins')
      }

      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return { data, error: null }
    } catch (error: any) {
      console.error('Error fetching admins:', error)
      return { data: null, error: error.message || 'Failed to fetch admins' }
    }
  },

  // Reset admin password
  async resetAdminPassword(
    adminId: string,
    newPassword: string,
    resetBy: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      // Check if current user is super admin
      const { data: currentAdmin } = await this.getCurrentAdmin()
      
      if (!currentAdmin || currentAdmin.role !== 'super_admin') {
        throw new Error('Only super admins can reset passwords')
      }

      // Get admin email
      const { data: admin } = await supabase
        .from('admins')
        .select('email')
        .eq('id', adminId)
        .single()

      if (!admin) {
        throw new Error('Admin not found')
      }

      // Update password via Supabase Auth
      const { error } = await supabase.auth.admin.updateUserById(
        adminId,
        { password: newPassword }
      )

      if (error) throw error

      // Log password reset
      await supabase
        .from('admin_audit_logs')
        .insert([{
          admin_id: resetBy,
          action: 'reset_password',
          target_id: adminId,
          details: 'Password was reset',
          created_at: new Date().toISOString()
        }])

      return { success: true, error: null }
    } catch (error: any) {
      console.error('Error resetting password:', error)
      return { success: false, error: error.message || 'Failed to reset password' }
    }
  },

  // Get admin audit logs
  async getAdminAuditLogs(
    adminId?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ data: any[] | null; count: number | null; error: string | null }> {
    try {
      const offset = (page - 1) * limit
      let query = supabase
        .from('admin_audit_logs')
        .select('*', { count: 'exact' })

      if (adminId) {
        query = query.eq('admin_id', adminId)
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error

      return { data, count, error: null }
    } catch (error: any) {
      console.error('Error fetching audit logs:', error)
      return { data: null, count: null, error: error.message || 'Failed to fetch audit logs' }
    }
  },

  // Check admin permissions
  async checkPermissions(requiredPermissions: string[]): Promise<{ allowed: boolean; error: string | null }> {
    try {
      const { data: admin } = await this.getCurrentAdmin()
      
      if (!admin) {
        return { allowed: false, error: 'Not authenticated' }
      }

      if (admin.role === 'super_admin') {
        return { allowed: true, error: null }
      }

      const hasAllPermissions = requiredPermissions.every(permission => 
        admin.permissions.includes(permission)
      )

      if (!hasAllPermissions) {
        return { 
          allowed: false, 
          error: 'Insufficient permissions' 
        }
      }

      return { allowed: true, error: null }
    } catch (error: any) {
      console.error('Error checking permissions:', error)
      return { allowed: false, error: error.message || 'Failed to check permissions' }
    }
  },

  // Subscribe to auth state changes
  subscribeToAuthState(callback: (admin: Admin | null) => void) {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: admin } = await this.getCurrentAdmin()
        callback(admin)
      } else if (event === 'SIGNED_OUT') {
        callback(null)
      }
    })
  }
}