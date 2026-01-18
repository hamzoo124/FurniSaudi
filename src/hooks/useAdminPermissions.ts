// src/hooks/useAdminPermissions.ts
import { useState, useEffect, useCallback } from 'react';
import { adminPermissionAPI } from '@/api/adminPermissions';
import { supabase } from '@/lib/supabase';

export const useAdminPermissions = () => {
  const [roles, setRoles] = useState<any[]>([]);
  const [usersWithRoles, setUsersWithRoles] = useState<any[]>([]);
  const [usersWithoutRoles, setUsersWithoutRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    role_id: 'all'
  });
  const [stats, setStats] = useState<any>(null);
  const [availablePermissions, setAvailablePermissions] = useState<any>(null);

  const fetchRoles = useCallback(async (page: number = 1, customFilters?: any) => {
    try {
      setLoading(true);
      setError(null);
      
      const currentFilters = customFilters || filters;
      const result = await adminPermissionAPI.getRoles(pagination.limit, page, currentFilters);
      
      setRoles(result.data || []);
      setPagination({
        page,
        limit: pagination.limit,
        total: result.total || 0,
        totalPages: Math.ceil((result.total || 0) / pagination.limit)
      });
    } catch (err: any) {
      setError(err.message || 'Failed to fetch roles');
      console.error('Error fetching roles:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit]);

  const fetchUsersWithRoles = useCallback(async (page: number = 1, customFilters?: any) => {
    try {
      setLoading(true);
      setError(null);
      
      const currentFilters = customFilters || filters;
      const result = await adminPermissionAPI.getUsersWithRoles(pagination.limit, page, currentFilters);
      
      setUsersWithRoles(result.users_with_roles || []);
      setUsersWithoutRoles(result.users_without_roles || []);
      
      return { success: true, data: result };
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users with roles');
      console.error('Error fetching users with roles:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit]);

  const fetchRole = useCallback(async (roleId: string) => {
    try {
      setLoading(true);
      const role = await adminPermissionAPI.getRole(roleId);
      return { success: true, data: role };
    } catch (err: any) {
      setError(err.message || 'Failed to fetch role');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const createRole = useCallback(async (roleData: any) => {
    try {
      setLoading(true);
      setError(null);
      
      const newRole = await adminPermissionAPI.createRole(roleData);
      setRoles(prev => [newRole, ...prev]);
      
      // Update stats
      if (stats) {
        setStats(prev => ({
          ...prev,
          total_roles: prev.total_roles + 1
        }));
      }
      
      return { success: true, data: newRole };
    } catch (err: any) {
      setError(err.message || 'Failed to create role');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [stats]);

  const updateRole = useCallback(async (roleId: string, updates: any) => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedRole = await adminPermissionAPI.updateRole(roleId, updates);
      
      setRoles(prev => 
        prev.map(role => role.id === roleId ? updatedRole : role)
      );
      
      // Update users with this role
      setUsersWithRoles(prev => 
        prev.map(userRole => 
          userRole.role_id === roleId 
            ? { ...userRole, admin_roles: updatedRole }
            : userRole
        )
      );
      
      return { success: true, data: updatedRole };
    } catch (err: any) {
      setError(err.message || 'Failed to update role');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteRole = useCallback(async (roleId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await adminPermissionAPI.deleteRole(roleId);
      
      const deletedRole = roles.find(r => r.id === roleId);
      setRoles(prev => prev.filter(role => role.id !== roleId));
      
      // Remove this role from users
      setUsersWithRoles(prev => 
        prev.filter(userRole => userRole.role_id !== roleId)
      );
      
      // Update stats
      if (stats && deletedRole) {
        setStats(prev => ({
          ...prev,
          total_roles: prev.total_roles - 1
        }));
      }
      
      return { success: true };
    } catch (err: any) {
      setError(err.message || 'Failed to delete role');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [roles, stats]);

  const getUserRole = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      const userRole = await adminPermissionAPI.getUserRole(userId);
      return { success: true, data: userRole };
    } catch (err: any) {
      setError(err.message || 'Failed to fetch user role');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const assignRole = useCallback(async (userId: string, roleId: string, assignedBy?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const assignment = await adminPermissionAPI.assignRole(userId, roleId, assignedBy);
      
      // Update local state
      setUsersWithRoles(prev => {
        // Remove user from usersWithoutRoles
        setUsersWithoutRoles(prevWithout => 
          prevWithout.filter(user => user.id !== userId)
        );
        
        // Add to usersWithRoles
        const existingIndex = prev.findIndex(ur => ur.user_id === userId);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = assignment;
          return updated;
        } else {
          return [assignment, ...prev];
        }
      });
      
      // Update stats
      if (stats) {
        setStats(prev => ({
          ...prev,
          assigned_roles: prev.assigned_roles + 1,
          unassigned_admins: Math.max(0, prev.unassigned_admins - 1),
          role_distribution: prev.role_distribution.map((rd: any) => 
            rd.role_id === roleId 
              ? { ...rd, user_count: rd.user_count + 1 }
              : rd
          )
        }));
      }
      
      return { success: true, data: assignment };
    } catch (err: any) {
      setError(err.message || 'Failed to assign role');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [stats]);

  const removeRole = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await adminPermissionAPI.removeRole(userId);
      
      // Update local state
      const removedUserRole = usersWithRoles.find(ur => ur.user_id === userId);
      setUsersWithRoles(prev => prev.filter(ur => ur.user_id !== userId));
      
      if (removedUserRole?.users) {
        setUsersWithoutRoles(prev => [removedUserRole.users, ...prev]);
      }
      
      // Update stats
      if (stats && removedUserRole) {
        setStats(prev => ({
          ...prev,
          assigned_roles: Math.max(0, prev.assigned_roles - 1),
          unassigned_admins: prev.unassigned_admins + 1,
          role_distribution: prev.role_distribution.map((rd: any) => 
            rd.role_id === removedUserRole.role_id 
              ? { ...rd, user_count: Math.max(0, rd.user_count - 1) }
              : rd
          )
        }));
      }
      
      return { success: true };
    } catch (err: any) {
      setError(err.message || 'Failed to remove role');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [usersWithRoles, stats]);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const statsData = await adminPermissionAPI.getRoleStats();
      setStats(statsData);
      return { success: true, data: statsData };
    } catch (err: any) {
      setError(err.message || 'Failed to fetch stats');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const checkPermission = useCallback(async (userId: string, permission: string) => {
    try {
      const hasPermission = await adminPermissionAPI.checkPermission(userId, permission);
      return { success: true, data: hasPermission };
    } catch (err: any) {
      console.error('Error checking permission:', err);
      return { success: false, error: err.message };
    }
  }, []);

  const getAvailablePermissions = useCallback(() => {
    const permissions = adminPermissionAPI.getAvailablePermissions();
    setAvailablePermissions(permissions);
    return permissions;
  }, []);

  const bulkAssignRoles = useCallback(async (userIds: string[], roleId: string, assignedBy?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const assignments = await adminPermissionAPI.bulkAssignRoles(userIds, roleId, assignedBy);
      
      // Update local state
      userIds.forEach(userId => {
        setUsersWithoutRoles(prev => prev.filter(user => user.id !== userId));
      });
      
      // Add to usersWithRoles
      setUsersWithRoles(prev => {
        const newAssignments = assignments.map((assignment: any) => ({
          ...assignment,
          users: usersWithoutRoles.find(user => user.id === assignment.user_id)
        }));
        return [...newAssignments, ...prev.filter(ur => !userIds.includes(ur.user_id))];
      });
      
      // Update stats
      if (stats) {
        setStats(prev => ({
          ...prev,
          assigned_roles: prev.assigned_roles + userIds.length,
          unassigned_admins: Math.max(0, prev.unassigned_admins - userIds.length),
          role_distribution: prev.role_distribution.map((rd: any) => 
            rd.role_id === roleId 
              ? { ...rd, user_count: rd.user_count + userIds.length }
              : rd
          )
        }));
      }
      
      return { success: true, data: assignments };
    } catch (err: any) {
      setError(err.message || 'Failed to bulk assign roles');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [usersWithoutRoles, stats]);

  const bulkRemoveRoles = useCallback(async (userIds: string[]) => {
    try {
      setLoading(true);
      setError(null);
      
      await adminPermissionAPI.bulkRemoveRoles(userIds);
      
      // Update local state
      const removedUserRoles = usersWithRoles.filter(ur => userIds.includes(ur.user_id));
      setUsersWithRoles(prev => prev.filter(ur => !userIds.includes(ur.user_id)));
      
      removedUserRoles.forEach(ur => {
        if (ur.users) {
          setUsersWithoutRoles(prev => [ur.users, ...prev]);
        }
      });
      
      // Update stats
      if (stats) {
        const roleCounts = removedUserRoles.reduce((acc, ur) => {
          acc[ur.role_id] = (acc[ur.role_id] || 0) + 1;
          return acc;
        }, {} as any);
        
        setStats(prev => ({
          ...prev,
          assigned_roles: Math.max(0, prev.assigned_roles - userIds.length),
          unassigned_admins: prev.unassigned_admins + userIds.length,
          role_distribution: prev.role_distribution.map((rd: any) => ({
            ...rd,
            user_count: Math.max(0, rd.user_count - (roleCounts[rd.role_id] || 0))
          }))
        }));
      }
      
      return { success: true, removed: userIds.length };
    } catch (err: any) {
      setError(err.message || 'Failed to bulk remove roles');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [usersWithRoles, stats]);

  const searchUsersForAssignment = useCallback(async (query: string) => {
    try {
      setLoading(true);
      const users = await adminPermissionAPI.searchUsersForAssignment(query);
      return { success: true, data: users };
    } catch (err: any) {
      setError(err.message || 'Failed to search users');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateRolePermissions = useCallback(async (roleId: string, permissions: any) => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedRole = await adminPermissionAPI.updateRolePermissions(roleId, permissions);
      
      setRoles(prev => 
        prev.map(role => role.id === roleId ? updatedRole : role)
      );
      
      return { success: true, data: updatedRole };
    } catch (err: any) {
      setError(err.message || 'Failed to update role permissions');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const cloneRole = useCallback(async (roleId: string, newName: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const clonedRole = await adminPermissionAPI.cloneRole(roleId, newName);
      setRoles(prev => [clonedRole, ...prev]);
      
      // Update stats
      if (stats) {
        setStats(prev => ({
          ...prev,
          total_roles: prev.total_roles + 1
        }));
      }
      
      return { success: true, data: clonedRole };
    } catch (err: any) {
      setError(err.message || 'Failed to clone role');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [stats]);

  // Update filters
  const updateFilters = useCallback((newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Change page
  const changePage = useCallback((page: number) => {
    fetchRoles(page);
  }, [fetchRoles]);

  // Change limit
  const changeLimit = useCallback((limit: number) => {
    setPagination(prev => ({ ...prev, limit }));
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchRoles();
    fetchUsersWithRoles();
    fetchStats();
    getAvailablePermissions();
  }, [fetchRoles, fetchUsersWithRoles, fetchStats, getAvailablePermissions]);

  return {
    roles,
    usersWithRoles,
    usersWithoutRoles,
    loading,
    error,
    pagination,
    filters,
    stats,
    availablePermissions,
    fetchRoles,
    fetchUsersWithRoles,
    fetchRole,
    createRole,
    updateRole,
    deleteRole,
    getUserRole,
    assignRole,
    removeRole,
    fetchStats,
    checkPermission,
    getAvailablePermissions,
    bulkAssignRoles,
    bulkRemoveRoles,
    searchUsersForAssignment,
    updateRolePermissions,
    cloneRole,
    updateFilters,
    changePage,
    changeLimit
  };
};