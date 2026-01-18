// hooks/useCategories.tsx
import { useState, useEffect, useCallback } from 'react';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

export interface Category {
  id: string;
  name: string;
  display_name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  category_type: 'customized' | 'ready_made';
  usage_type: 'indoor' | 'outdoor' | 'both';
  product_type: string | null;
  product_categories: string[];
  level: number;
  display_order: number;
  icon: string;
  color: string;
  image_url: string | null;
  is_featured: boolean;
  is_active: boolean;
  filter_tags: string[];
  hierarchy_path: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface CategoryStats {
  total: number;
  active: number;
  featured: number;
  by_type: {
    customized: number;
    ready_made: number;
  };
  by_usage: {
    indoor: number;
    outdoor: number;
    both: number;
  };
  by_product_type: Record<string, number>;
}

interface CategoryFilters {
  search?: string;
  category_type?: 'customized' | 'ready_made' | 'all';
  usage_type?: 'indoor' | 'outdoor' | 'both' | 'all';
  product_type?: string | 'all';
  is_featured?: boolean | 'all';
  is_active?: boolean | 'all';
}

interface CategoryOption {
  value: string;
  label: string;
  category_type: 'customized' | 'ready_made';
  usage_type: 'indoor' | 'outdoor' | 'both';
  product_type: string | null;
  product_categories: string[];
}

interface GroupedCategories {
  customized: {
    indoor: Category[];
    outdoor: Category[];
    both: Category[];
  };
  ready_made: {
    indoor: Category[];
    outdoor: Category[];
    both: Category[];
  };
}

interface ProductTypeOption {
  value: string;
  label: string;
  icon: string;
  color: string;
}

interface ProductCategoryOption {
  value: string;
  label: string;
  icon: string;
  color: string;
}

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategories, setActiveCategories] = useState<Category[]>([]);
  const [featuredCategories, setFeaturedCategories] = useState<Category[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [productTypeOptions, setProductTypeOptions] = useState<ProductTypeOption[]>([]);
  const [productCategoryOptions, setProductCategoryOptions] = useState<ProductCategoryOption[]>([]);
  
  const [groupedCategories, setGroupedCategories] = useState<GroupedCategories>({
    customized: { indoor: [], outdoor: [], both: [] },
    ready_made: { indoor: [], outdoor: [], both: [] }
  });
  
  const [categoryStats, setCategoryStats] = useState<CategoryStats>({
    total: 0,
    active: 0,
    featured: 0,
    by_type: { customized: 0, ready_made: 0 },
    by_usage: { indoor: 0, outdoor: 0, both: 0 },
    by_product_type: {}
  });
  
  const [loading, setLoading] = useState({
    categories: false,
    options: false,
    stats: false
  });
  
  const [error, setError] = useState<string | null>(null);

  // Initialize database tables if they don't exist
  const initializeDatabase = async () => {
    try {
      // Check if categories table exists
      const { data: tableExists } = await supabaseAdmin
        .from('categories')
        .select('id')
        .limit(1);
      
      // If no categories table or no data, create sample data
      if (!tableExists || tableExists.length === 0) {
        console.log('📦 Creating sample categories data...');
        
        // Create default product types table if doesn't exist
        const { error: productTypesError } = await supabaseAdmin
          .from('product_types')
          .upsert([
            { name: 'Sofa', value: 'sofa', icon: '🛋️', color: '#EF4444', status: 'active' },
            { name: 'Bed', value: 'bed', icon: '🛏️', color: '#6366F1', status: 'active' },
            { name: 'Table', value: 'table', icon: '🪑', color: '#F59E0B', status: 'active' },
            { name: 'Chair', value: 'chair', icon: '💺', color: '#10B981', status: 'active' },
            { name: 'Cabinet', value: 'cabinet', icon: '🗄️', color: '#8B5CF6', status: 'active' },
            { name: 'Wardrobe', value: 'wardrobe', icon: '👔', color: '#EC4899', status: 'active' },
            { name: 'Shelf', value: 'shelf', icon: '📚', color: '#8B5CF6', status: 'active' },
            { name: 'Desk', value: 'desk', icon: '💻', color: '#3B82F6', status: 'active' }
          ]);
        
        // Create default product categories table if doesn't exist
        const { error: productCategoriesError } = await supabaseAdmin
          .from('product_categories')
          .upsert([
            { name: 'Living Room', value: 'living_room', icon: '🛋️', color: '#EF4444', status: 'active' },
            { name: 'Bedroom', value: 'bedroom', icon: '🛏️', color: '#6366F1', status: 'active' },
            { name: 'Kitchen', value: 'kitchen', icon: '🍳', color: '#F59E0B', status: 'active' },
            { name: 'Office', value: 'office', icon: '💼', color: '#8B5CF6', status: 'active' },
            { name: 'Garden', value: 'garden', icon: '🌳', color: '#10B981', status: 'active' },
            { name: 'Dining', value: 'dining', icon: '🍽️', color: '#8B5CF6', status: 'active' },
            { name: 'Bathroom', value: 'bathroom', icon: '🛁', color: '#3B82F6', status: 'active' },
            { name: 'Kids Room', value: 'kids_room', icon: '🧸', color: '#EC4899', status: 'active' }
          ]);
        
        // Create sample categories
        const sampleCategories = [
          {
            name: 'Custom Sofa Indoor',
            display_name: 'Custom Sofa Indoor',
            slug: 'custom-sofa-indoor',
            description: 'Custom made sofas for indoor spaces',
            category_type: 'customized',
            usage_type: 'indoor',
            product_type: 'sofa',
            product_categories: ['living_room', 'office'],
            level: 3,
            display_order: 1,
            icon: '🛋️',
            color: '#EF4444',
            is_featured: true,
            is_active: true,
            filter_tags: ['customized', 'indoor', 'sofa', 'living_room', 'office'],
            hierarchy_path: 'Customized → Indoor → Sofa → Living Room, Office'
          },
          {
            name: 'Ready Bed Bedroom',
            display_name: 'Ready Made Bed Bedroom',
            slug: 'ready-bed-bedroom',
            description: 'Ready made beds for bedrooms',
            category_type: 'ready_made',
            usage_type: 'indoor',
            product_type: 'bed',
            product_categories: ['bedroom'],
            level: 3,
            display_order: 2,
            icon: '🛏️',
            color: '#6366F1',
            is_featured: true,
            is_active: true,
            filter_tags: ['ready_made', 'indoor', 'bed', 'bedroom'],
            hierarchy_path: 'Ready Made → Indoor → Bed → Bedroom'
          },
          {
            name: 'Custom Table Outdoor',
            display_name: 'Custom Table Outdoor',
            slug: 'custom-table-outdoor',
            description: 'Custom tables for outdoor spaces',
            category_type: 'customized',
            usage_type: 'outdoor',
            product_type: 'table',
            product_categories: ['garden', 'dining'],
            level: 3,
            display_order: 3,
            icon: '🪑',
            color: '#F59E0B',
            is_featured: false,
            is_active: true,
            filter_tags: ['customized', 'outdoor', 'table', 'garden', 'dining'],
            hierarchy_path: 'Customized → Outdoor → Table → Garden, Dining'
          }
        ];
        
        const { error: categoriesError } = await supabaseAdmin
          .from('categories')
          .insert(sampleCategories);
        
        console.log('✅ Database initialized with sample data');
      }
    } catch (error) {
      console.error('❌ Error initializing database:', error);
    }
  };

  // Fetch all categories with optional filters
  const fetchCategories = useCallback(async (filters?: CategoryFilters) => {
    setLoading(prev => ({ ...prev, categories: true }));
    setError(null);
    
    try {
      let query = supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

      // Apply filters if provided
      if (filters) {
        if (filters.category_type && filters.category_type !== 'all') {
          query = query.eq('category_type', filters.category_type);
        }
        
        if (filters.usage_type && filters.usage_type !== 'all') {
          query = query.eq('usage_type', filters.usage_type);
        }
        
        if (filters.product_type && filters.product_type !== 'all') {
          query = query.eq('product_type', filters.product_type);
        }
        
        if (filters.is_featured !== undefined && filters.is_featured !== 'all') {
          query = query.eq('is_featured', filters.is_featured);
        }
        
        if (filters.is_active !== undefined && filters.is_active !== 'all') {
          query = query.eq('is_active', filters.is_active);
        }
        
        if (filters.search) {
          query = query.or(
            `name.ilike.%${filters.search}%,display_name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,product_type.ilike.%${filters.search}%`
          );
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      const categoriesData = (data || []) as Category[];
      
      setCategories(categoriesData);
      
      // Set active categories (for homepage)
      const activeCats = categoriesData.filter(cat => cat.is_active);
      setActiveCategories(activeCats);
      
      // Set featured categories
      const featuredCats = categoriesData.filter(cat => cat.is_featured && cat.is_active);
      setFeaturedCategories(featuredCats);
      
      // Generate category options for dropdowns - FIXED HERE
      const options = categoriesData
        .filter(cat => cat.is_active) // Only include active categories
        .map(cat => {
          // Create a proper label for the dropdown
          let label = cat.display_name || cat.name;
          
          // Add additional info to label for better identification
          if (cat.product_type) {
            label += ` (${cat.category_type} - ${cat.usage_type} - ${cat.product_type})`;
          } else {
            label += ` (${cat.category_type} - ${cat.usage_type})`;
          }
          
          return {
            value: cat.id,
            label: label,
            category_type: cat.category_type,
            usage_type: cat.usage_type,
            product_type: cat.product_type,
            product_categories: cat.product_categories || []
          };
        });
      setCategoryOptions(options);
      
      // Group categories for sidebar display
      const grouped = groupCategoriesForSidebar(categoriesData);
      setGroupedCategories(grouped);
      
      // Calculate statistics
      calculateStats(categoriesData);
      
      // Fetch product types and categories options
      await fetchProductTypeOptions();
      await fetchProductCategoryOptions();
      
      return categoriesData;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch categories');
      console.error('❌ Error fetching categories:', err);
      toast.error('Failed to load categories');
      return [];
    } finally {
      setLoading(prev => ({ ...prev, categories: false }));
    }
  }, []);

  // Fetch product types options
  const fetchProductTypeOptions = async () => {
    setLoading(prev => ({ ...prev, options: true }));
    
    try {
      // Try to fetch from database
      const { data, error } = await supabase
        .from('product_types')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (error && !error.message.includes('does not exist')) {
        throw error;
      }

      if (data && data.length > 0) {
        const types = data.map(item => ({
          value: item.value || item.name.toLowerCase().replace(/\s+/g, '_'),
          label: item.name,
          icon: item.icon || '📦',
          color: item.color || '#6B7280'
        }));
        setProductTypeOptions(types);
      } else {
        // Default options if table doesn't exist
        const defaultTypes = [
          { value: 'sofa', label: 'Sofa', icon: '🛋️', color: '#EF4444' },
          { value: 'bed', label: 'Bed', icon: '🛏️', color: '#6366F1' },
          { value: 'table', label: 'Table', icon: '🪑', color: '#F59E0B' },
          { value: 'chair', label: 'Chair', icon: '💺', color: '#10B981' },
          { value: 'cabinet', label: 'Cabinet', icon: '🗄️', color: '#8B5CF6' },
          { value: 'wardrobe', label: 'Wardrobe', icon: '👔', color: '#EC4899' },
          { value: 'shelf', label: 'Shelf', icon: '📚', color: '#8B5CF6' },
          { value: 'desk', label: 'Desk', icon: '💻', color: '#3B82F6' }
        ];
        setProductTypeOptions(defaultTypes);
      }
    } catch (error) {
      console.error('Error fetching product types:', error);
      // Use default options on error
      const defaultTypes = [
        { value: 'sofa', label: 'Sofa', icon: '🛋️', color: '#EF4444' },
        { value: 'bed', label: 'Bed', icon: '🛏️', color: '#6366F1' },
        { value: 'table', label: 'Table', icon: '🪑', color: '#F59E0B' }
      ];
      setProductTypeOptions(defaultTypes);
    } finally {
      setLoading(prev => ({ ...prev, options: false }));
    }
  };

  // Fetch product categories options
  const fetchProductCategoryOptions = async () => {
    setLoading(prev => ({ ...prev, options: true }));
    
    try {
      // Try to fetch from database
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (error && !error.message.includes('does not exist')) {
        throw error;
      }

      if (data && data.length > 0) {
        const categories = data.map(item => ({
          value: item.value || item.name.toLowerCase().replace(/\s+/g, '_'),
          label: item.name,
          icon: item.icon || '🏷️',
          color: item.color || '#6B7280'
        }));
        setProductCategoryOptions(categories);
      } else {
        // Default options if table doesn't exist
        const defaultCategories = [
          { value: 'living_room', label: 'Living Room', icon: '🛋️', color: '#EF4444' },
          { value: 'bedroom', label: 'Bedroom', icon: '🛏️', color: '#6366F1' },
          { value: 'kitchen', label: 'Kitchen', icon: '🍳', color: '#F59E0B' },
          { value: 'office', label: 'Office', icon: '💼', color: '#8B5CF6' },
          { value: 'garden', label: 'Garden', icon: '🌳', color: '#10B981' },
          { value: 'dining', label: 'Dining', icon: '🍽️', color: '#8B5CF6' },
          { value: 'bathroom', label: 'Bathroom', icon: '🛁', color: '#3B82F6' },
          { value: 'kids_room', label: "Kids' Room", icon: '🧸', color: '#EC4899' }
        ];
        setProductCategoryOptions(defaultCategories);
      }
    } catch (error) {
      console.error('Error fetching product categories:', error);
      // Use default options on error
      const defaultCategories = [
        { value: 'living_room', label: 'Living Room', icon: '🛋️', color: '#EF4444' },
        { value: 'bedroom', label: 'Bedroom', icon: '🛏️', color: '#6366F1' },
        { value: 'kitchen', label: 'Kitchen', icon: '🍳', color: '#F59E0B' }
      ];
      setProductCategoryOptions(defaultCategories);
    } finally {
      setLoading(prev => ({ ...prev, options: false }));
    }
  };

  // Fetch only active categories for homepage
  const fetchHomeCategories = useCallback(async () => {
    return fetchCategories({ is_active: true });
  }, [fetchCategories]);

  // Group categories for sidebar display
  const groupCategoriesForSidebar = (categoriesList: Category[]): GroupedCategories => {
    const grouped: GroupedCategories = {
      customized: { indoor: [], outdoor: [], both: [] },
      ready_made: { indoor: [], outdoor: [], both: [] }
    };

    categoriesList.forEach(category => {
      if (!category.is_active) return;
      
      if (category.category_type === 'customized') {
        if (category.usage_type === 'indoor') {
          grouped.customized.indoor.push(category);
        } else if (category.usage_type === 'outdoor') {
          grouped.customized.outdoor.push(category);
        } else {
          grouped.customized.both.push(category);
        }
      } else if (category.category_type === 'ready_made') {
        if (category.usage_type === 'indoor') {
          grouped.ready_made.indoor.push(category);
        } else if (category.usage_type === 'outdoor') {
          grouped.ready_made.outdoor.push(category);
        } else {
          grouped.ready_made.both.push(category);
        }
      }
    });

    // Sort each group by display_order
    Object.keys(grouped).forEach(typeKey => {
      const type = typeKey as keyof GroupedCategories;
      Object.keys(grouped[type]).forEach(usageKey => {
        const usage = usageKey as keyof typeof grouped.customized;
        grouped[type][usage].sort((a, b) => a.display_order - b.display_order);
      });
    });

    return grouped;
  };

  // Calculate category statistics
  const calculateStats = (categoriesList: Category[]) => {
    const byProductType: Record<string, number> = {};
    
    categoriesList.forEach(cat => {
      if (cat.product_type) {
        byProductType[cat.product_type] = (byProductType[cat.product_type] || 0) + 1;
      }
    });
    
    const stats: CategoryStats = {
      total: categoriesList.length,
      active: categoriesList.filter(c => c.is_active).length,
      featured: categoriesList.filter(c => c.is_featured).length,
      by_type: {
        customized: categoriesList.filter(c => c.category_type === 'customized').length,
        ready_made: categoriesList.filter(c => c.category_type === 'ready_made').length
      },
      by_usage: {
        indoor: categoriesList.filter(c => c.usage_type === 'indoor').length,
        outdoor: categoriesList.filter(c => c.usage_type === 'outdoor').length,
        both: categoriesList.filter(c => c.usage_type === 'both').length
      },
      by_product_type: byProductType
    };
    
    setCategoryStats(stats);
  };

  // Create new category
  const createCategory = useCallback(async (categoryData: Partial<Category>) => {
    setError(null);
    
    try {
      // Build hierarchy path
      const hierarchyPath = [
        categoryData.category_type === 'customized' ? 'Customized' : 'Ready Made',
        categoryData.usage_type === 'indoor' ? 'Indoor' : 
          categoryData.usage_type === 'outdoor' ? 'Outdoor' : 'Both',
        categoryData.product_type || '',
        ...(categoryData.product_categories || [])
      ].filter(Boolean).join(' → ');

      // Build filter tags
      const filterTags = [
        categoryData.category_type,
        categoryData.usage_type,
        categoryData.product_type,
        ...(categoryData.product_categories || [])
      ].filter(Boolean);

      const categoryToCreate = {
        name: categoryData.name || '',
        display_name: categoryData.display_name || categoryData.name || '',
        slug: categoryData.slug || (categoryData.name ? categoryData.name.toLowerCase().replace(/\s+/g, '-') : ''),
        description: categoryData.description || null,
        parent_id: categoryData.parent_id || null,
        category_type: categoryData.category_type || 'customized',
        usage_type: categoryData.usage_type || 'indoor',
        product_type: categoryData.product_type || null,
        product_categories: categoryData.product_categories || [],
        level: categoryData.level || 1,
        display_order: categoryData.display_order || 0,
        icon: categoryData.icon || '📦',
        color: categoryData.color || '#3B82F6',
        image_url: categoryData.image_url || null,
        is_featured: categoryData.is_featured || false,
        is_active: categoryData.is_active ?? true,
        filter_tags: filterTags,
        hierarchy_path: hierarchyPath,
        metadata: categoryData.metadata || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('categories')
        .insert([categoryToCreate])
        .select()
        .single();

      if (error) throw error;

      // Refresh categories
      await fetchCategories();
      toast.success('Category created successfully!');
      
      return data as Category;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to create category';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('❌ Error creating category:', err);
      throw err;
    }
  }, [fetchCategories]);

  // Update category
  const updateCategory = useCallback(async (id: string, updates: Partial<Category>) => {
    setError(null);
    
    try {
      // Rebuild hierarchy path if relevant fields are updated
      if (updates.category_type || updates.usage_type || updates.product_type || updates.product_categories) {
        const category = categories.find(c => c.id === id);
        if (category) {
          const newCategoryType = updates.category_type || category.category_type;
          const newUsageType = updates.usage_type || category.usage_type;
          const newProductType = updates.product_type || category.product_type;
          const newProductCategories = updates.product_categories || category.product_categories;
          
          const hierarchyPath = [
            newCategoryType === 'customized' ? 'Customized' : 'Ready Made',
            newUsageType === 'indoor' ? 'Indoor' : 
              newUsageType === 'outdoor' ? 'Outdoor' : 'Both',
            newProductType || '',
            ...(newProductCategories || [])
          ].filter(Boolean).join(' → ');

          updates.hierarchy_path = hierarchyPath;
          
          // Rebuild filter tags
          const filterTags = [
            newCategoryType,
            newUsageType,
            newProductType,
            ...(newProductCategories || [])
          ].filter(Boolean);
          updates.filter_tags = filterTags;
        }
      }

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

      // Refresh categories
      await fetchCategories();
      toast.success('Category updated successfully!');
      
      return data as Category;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to update category';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('❌ Error updating category:', err);
      throw err;
    }
  }, [categories, fetchCategories]);

  // Delete category
  const deleteCategory = useCallback(async (id: string) => {
    setError(null);
    
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Refresh categories
      await fetchCategories();
      toast.success('Category deleted successfully!');
      
      return { success: true };
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to delete category';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('❌ Error deleting category:', err);
      throw err;
    }
  }, [fetchCategories]);

  // Get category by ID
  const getCategoryById = useCallback(async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      return data as Category;
    } catch (err: any) {
      console.error('❌ Error fetching category by ID:', err);
      throw err;
    }
  }, []);

  // Get categories by product type
  const getCategoriesByProductType = useCallback(async (productType: string) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('product_type', productType)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      
      return (data || []) as Category[];
    } catch (err: any) {
      console.error('❌ Error fetching categories by product type:', err);
      return [];
    }
  }, []);

  // Get all unique product categories from all categories
  const getAllProductCategories = useCallback(() => {
    const allProductCategories = categories.flatMap(cat => cat.product_categories || []);
    const grouped: Record<string, number> = {};
    
    allProductCategories.forEach(cat => {
      if (cat) {
        grouped[cat] = (grouped[cat] || 0) + 1;
      }
    });
    
    return Object.entries(grouped).map(([value, count]) => {
      const label = value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      return { value, label, count };
    }).sort((a, b) => b.count - a.count);
  }, [categories]);

  // Filter categories based on criteria
  const filterCategories = useCallback((filters: CategoryFilters) => {
    let filtered = [...categories];
    
    if (filters.category_type && filters.category_type !== 'all') {
      filtered = filtered.filter(cat => cat.category_type === filters.category_type);
    }
    
    if (filters.usage_type && filters.usage_type !== 'all') {
      filtered = filtered.filter(cat => cat.usage_type === filters.usage_type);
    }
    
    if (filters.product_type && filters.product_type !== 'all') {
      filtered = filtered.filter(cat => cat.product_type === filters.product_type);
    }
    
    if (filters.is_featured !== undefined && filters.is_featured !== 'all') {
      filtered = filtered.filter(cat => cat.is_featured === filters.is_featured);
    }
    
    if (filters.is_active !== undefined && filters.is_active !== 'all') {
      filtered = filtered.filter(cat => cat.is_active === filters.is_active);
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(cat => 
        cat.name.toLowerCase().includes(searchLower) ||
        cat.display_name.toLowerCase().includes(searchLower) ||
        (cat.description && cat.description.toLowerCase().includes(searchLower)) ||
        (cat.product_type && cat.product_type.toLowerCase().includes(searchLower)) ||
        (cat.hierarchy_path && cat.hierarchy_path.toLowerCase().includes(searchLower))
      );
    }
    
    return filtered;
  }, [categories]);

  // Get categorized items for sidebar (used in HomePage)
  const getCategorizedSidebarItems = useCallback(() => {
    return groupedCategories;
  }, [groupedCategories]);

  // Get featured categories for homepage
  const getFeaturedCategories = useCallback(() => {
    return featuredCategories.sort((a, b) => a.display_order - b.display_order);
  }, [featuredCategories]);

  // Get categories by usage type
  const getCategoriesByUsage = useCallback((usage: 'indoor' | 'outdoor' | 'both') => {
    return activeCategories.filter(cat => 
      cat.usage_type === usage || cat.usage_type === 'both'
    );
  }, [activeCategories]);

  // Get categories by product type (sync version)
  const getCategoriesByProductTypeSync = useCallback((productType: string) => {
    return activeCategories.filter(cat => cat.product_type === productType);
  }, [activeCategories]);

  // Get product categories list
  const getProductCategories = useCallback((productType?: string) => {
    let filtered = activeCategories;
    
    if (productType) {
      filtered = filtered.filter(cat => cat.product_type === productType);
    }
    
    const allCategories = filtered.flatMap(cat => cat.product_categories || []);
    return [...new Set(allCategories)].filter(Boolean);
  }, [activeCategories]);

  // Get all categories as options for dropdown - FIXED VERSION
  const getCategoryOptions = useCallback(() => {
    return activeCategories.map(cat => {
      // Create a descriptive label for the dropdown
      let label = cat.display_name || cat.name;
      
      // Add type information if available
      if (cat.product_type) {
        const formattedProductType = cat.product_type.charAt(0).toUpperCase() + cat.product_type.slice(1);
        label += ` - ${formattedProductType} (${cat.category_type} ${cat.usage_type})`;
      } else {
        label += ` (${cat.category_type} ${cat.usage_type})`;
      }
      
      return {
        value: cat.id,
        label: label,
        category_type: cat.category_type,
        usage_type: cat.usage_type,
        product_type: cat.product_type,
        product_categories: cat.product_categories || []
      };
    });
  }, [activeCategories]);

  // Get categories grouped by type for product form
  const getCategoriesForProductForm = useCallback(() => {
    const grouped: Record<string, Array<{value: string, label: string}>> = {};
    
    activeCategories.forEach(cat => {
      const key = `${cat.category_type} - ${cat.usage_type}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      const productType = cat.product_type ? ` - ${cat.product_type}` : '';
      grouped[key].push({
        value: cat.id,
        label: `${cat.display_name}${productType}`
      });
    });
    
    return grouped;
  }, [activeCategories]);

  // Initialize data on mount
  useEffect(() => {
    const init = async () => {
      await initializeDatabase();
      await fetchHomeCategories();
    };
    init();
  }, [fetchHomeCategories]);

  // Set up real-time subscription for categories
  useEffect(() => {
    const subscription = supabase
      .channel('categories-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories'
        },
        async () => {
          console.log('🔄 Categories updated, refreshing...');
          await fetchCategories();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchCategories]);

  return {
    // State
    categories,
    activeCategories,
    featuredCategories,
    categoryOptions,
    productTypeOptions,
    productCategoryOptions,
    groupedCategories,
    categoryStats,
    loading,
    error,
    
    // Actions
    fetchCategories,
    fetchHomeCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    getCategoriesByProductType,
    filterCategories,
    fetchProductTypeOptions,
    fetchProductCategoryOptions,
    
    // Getters
    getAllProductCategories,
    getCategorizedSidebarItems,
    getFeaturedCategories,
    getCategoriesByUsage,
    getCategoriesByProductType: getCategoriesByProductTypeSync,
    getProductCategories,
    getCategoryOptions, // This is now fixed
    getCategoriesForProductForm,
    
    // Initialization
    initializeDatabase
  };
};