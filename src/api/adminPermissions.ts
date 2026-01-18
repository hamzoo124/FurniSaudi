// src/api/adminPermissions.ts
import { supabase } from '@/lib/supabase';

export const adminPermissionAPI = {
  // Get all roles with pagination
  getRoles: async (limit: number = 20, page: number = 1, filters: any = {}) => {
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    let query = supabase
      .from('admin_roles')
      .select('*', { count: 'exact' })
      .order('level', { ascending: false });

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    const { data, error, count } = await query.range(start, end);

    if (error) throw error;
    return { data, total: count, page, limit };
  },

  // Get role by ID
  getRole: async (roleId: string) => {
    const { data, error } = await supabase
      .from('admin_roles')
      .select('*')
      .eq('id', roleId)
      .single();

    if (error) throw error;
    return data;
  },

  // Create new role
  createRole: async (roleData: {
    name: string;
    description?: string;
    level: number;
    permissions: any;
  }) => {
    // Check if role name already exists
    const { data: existing } = await supabase
      .from('admin_roles')
      .select('name')
      .eq('name', roleData.name)
      .single();

    if (existing) {
      throw new Error('Role name already exists');
    }

    const { data, error } = await supabase
      .from('admin_roles')
      .insert([{
        ...roleData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update role
  updateRole: async (roleId: string, updates: any) => {
    const { data, error } = await supabase
      .from('admin_roles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', roleId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete role
  deleteRole: async (roleId: string) => {
    // Check if role is assigned to any users
    const { data: assignedUsers, error: checkError } = await supabase
      .from('admin_user_roles')
      .select('user_id')
      .eq('role_id', roleId);

    if (checkError) throw checkError;

    if (assignedUsers && assignedUsers.length > 0) {
      throw new Error('Cannot delete role that is assigned to users');
    }

    const { error } = await supabase
      .from('admin_roles')
      .delete()
      .eq('id', roleId);

    if (error) throw error;
    return { success: true };
  },

  // Get user's role
  getUserRole: async (userId: string) => {
    const { data, error } = await supabase
      .from('admin_user_roles')
      .select(`
        *,
        admin_roles (*)
      `)
      .eq('user_id', userId)
      .single();

    if (error) {
      // If no role assigned, return null
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    return data;
  },

  // Assign role to user
  assignRole: async (userId: string, roleId: string, assignedBy?: string) => {
    const { data, error } = await supabase
      .from('admin_user_roles')
      .upsert({
        user_id: userId,
        role_id: roleId,
        assigned_by: assignedBy,
        assigned_at: new Date().toISOString()
      })
      .select(`
        *,
        admin_roles (*)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  // Remove role from user
  removeRole: async (userId: string) => {
    const { error } = await supabase
      .from('admin_user_roles')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true };
  },

  // Get all users with their roles
  getUsersWithRoles: async (limit: number = 20, page: number = 1, filters: any = {}) => {
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    let query = supabase
      .from('admin_user_roles')
      .select(`
        *,
        admin_roles (*),
        users:user_id (id, email, full_name, avatar_url, created_at, user_type)
      `, { count: 'exact' })
      .order('assigned_at', { ascending: false });

    if (filters.role_id && filters.role_id !== 'all') {
      query = query.eq('role_id', filters.role_id);
    }

    if (filters.search) {
      // We need to filter by user name/email, which requires a different approach
      // This is a simplified version
      query = query;
    }

    const { data, error, count } = await query.range(start, end);

    if (error) throw error;

    // Also get users without roles
    const { data: allUsers } = await supabase
      .from('profiles')
      .select('id, email, full_name, avatar_url, created_at, user_type')
      .eq('user_type', 'admin')
      .limit(50);

    // Combine data
    const usersWithRoles = data || [];
    const usersWithoutRoles = allUsers?.filter(user => 
      !usersWithRoles.some((ur: any) => ur.user_id === user.id)
    ) || [];

    return { 
      users_with_roles: usersWithRoles, 
      users_without_roles: usersWithoutRoles,
      total: count, 
      page, 
      limit 
    };
  },

  // Get role statistics
  getRoleStats: async () => {
    const { data: roles, error: rolesError } = await supabase
      .from('admin_roles')
      .select('*');

    if (rolesError) throw rolesError;

    const { data: userRoles, error: userRolesError } = await supabase
      .from('admin_user_roles')
      .select('*');

    if (userRolesError) throw userRolesError;

    const { data: allAdmins } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_type', 'admin');

    const stats = {
      total_roles: roles?.length || 0,
      total_admin_users: allAdmins?.length || 0,
      assigned_roles: userRoles?.length || 0,
      unassigned_admins: (allAdmins?.length || 0) - (userRoles?.length || 0),
      role_distribution: roles?.map(role => ({
        role_id: role.id,
        role_name: role.name,
        user_count: userRoles?.filter(ur => ur.role_id === role.id).length || 0
      })) || []
    };

    return stats;
  },

  // Check user permission
  checkPermission: async (userId: string, permission: string) => {
    const userRole = await adminPermissionAPI.getUserRole(userId);
    
    if (!userRole || !userRole.admin_roles) {
      return false;
    }

    const role = userRole.admin_roles;
    
    // Check if user has all permissions
    if (role.permissions?.all === true) {
      return true;
    }

    // Check specific permission
    return role.permissions?.[permission] === true;
  },

  // Get available permissions
  getAvailablePermissions: () => {
    return {
      dashboard: 'Access dashboard',
      users: 'Manage users',
      sellers: 'Manage sellers',
      products: 'Manage products',
      orders: 'Manage orders',
      reviews: 'Manage reviews',
      wallet: 'Manage wallet & payouts',
      contracts: 'Manage contracts',
      reports: 'View & generate reports',
      coupons: 'Manage coupons',
      advertising: 'Manage advertising',
      activity: 'View activity logs',
      settings: 'Manage settings',
      categories: 'Manage categories',
      shipping: 'Manage shipping',
      custom_orders: 'Manage custom orders',
      support: 'Manage support tickets'
    };
  },

  // Bulk assign roles
  bulkAssignRoles: async (userIds: string[], roleId: string, assignedBy?: string) => {
    const assignments = userIds.map(userId => ({
      user_id: userId,
      role_id: roleId,
      assigned_by: assignedBy,
      assigned_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('admin_user_roles')
      .upsert(assignments, { onConflict: 'user_id' })
      .select();

    if (error) throw error;
    return data;
  },

  // Bulk remove roles
  bulkRemoveRoles: async (userIds: string[]) => {
    const { error } = await supabase
      .from('admin_user_roles')
      .delete()
      .in('user_id', userIds);

    if (error) throw error;
    return { success: true, removed: userIds.length };
  },

  // Search users for role assignment
  searchUsersForAssignment: async (query: string, limit: number = 10) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, avatar_url, user_type, created_at')
      .or(`email.ilike.%${query}%,full_name.ilike.%${query}%`)
      .eq('user_type', 'admin')
      .limit(limit);

    if (error) throw error;
    return data;
  },

  // Update role permissions
  updateRolePermissions: async (roleId: string, permissions: any) => {
    const { data, error } = await supabase
      .from('admin_roles')
      .update({
        permissions,
        updated_at: new Date().toISOString()
      })
      .eq('id', roleId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Clone role
  cloneRole: async (roleId: string, newName: string) => {
    const role = await adminPermissionAPI.getRole(roleId);
    
    const { data, error } = await supabase
      .from('admin_roles')
      .insert([{
        name: newName,
        description: `${role.description} (Copy)`,
        level: role.level,
        permissions: role.permissions,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};