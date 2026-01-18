import { supabase } from '../lib/supabase'

export const categoriesAPI = {
  // Get all categories for admin
  async getAdminCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  // Create new category
  async createCategory(categoryData: {
    name: string;
    description?: string;
    parent_id?: string;
    is_active?: boolean;
  }) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{
          ...categoryData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  },

  // Update category
  async updateCategory(id: string, updates: any) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  },

  // Delete category
  async deleteCategory(id: string) {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  },

  // Get products by category for admin
  async getProductsByCategory(categoryId: string, filters?: {
    status?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          sellers:user_id (
            business_name,
            email
          ),
          categories:category_id (
            name,
            description
          )
        `)
        .eq('category_id', categoryId);
      
      // Apply filters
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('approval_status', filters.status);
      }
      
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
      
      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      
      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching products by category:', error);
      throw error;
    }
  },

  // Get category statistics
  async getCategoryStats() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select(`
          *,
          products_count:products(count)
        `);
      
      if (error) throw error;
      
      // Get approval status counts per category
      const categoriesWithStats = await Promise.all(
        data.map(async (category) => {
          const { data: pending } = await supabase
            .from('products')
            .select('id', { count: 'exact' })
            .eq('category_id', category.id)
            .eq('approval_status', 'pending');
          
          const { data: approved } = await supabase
            .from('products')
            .select('id', { count: 'exact' })
            .eq('category_id', category.id)
            .eq('approval_status', 'approved');
          
          return {
            ...category,
            pending_count: pending?.length || 0,
            approved_count: approved?.length || 0
          };
        })
      );
      
      return categoriesWithStats;
    } catch (error) {
      console.error('Error fetching category stats:', error);
      throw error;
    }
  }
};