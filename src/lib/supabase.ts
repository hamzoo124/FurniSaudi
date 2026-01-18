// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
// import type { Database } from '@/types/supabase';
// import type { Database } from "../types/
import { Database } from '.';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Validate environment variables
if (!supabaseUrl) {
  console.error('❌ Missing VITE_SUPABASE_URL');
  throw new Error('Missing Supabase URL');
}

if (!supabaseAnonKey) {
  console.error('❌ Missing VITE_SUPABASE_ANON_KEY');
  throw new Error('Missing Supabase Anon Key');
}

console.log('✅ Supabase URL:', supabaseUrl);
console.log('✅ Anon Key exists:', !!supabaseAnonKey);
console.log('✅ Service Key exists:', !!supabaseServiceKey);

// ==================== REGULAR CLIENT (Frontend) ====================
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'sb-auth-token',
  },
  global: {
    headers: {
      'x-application-name': 'furniture-marketplace',
      'x-application-version': '1.0.0',
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// ==================== ADMIN CLIENT (Server-side / Admin Operations) ====================
export const supabaseAdmin = supabaseServiceKey 
  ? createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          'x-application-name': 'furniture-marketplace-admin',
          'x-application-version': '1.0.0',
          'x-admin-access': 'true',
        },
      },
    })
  : supabase; // Fallback to regular client if no service key

// ==================== DATABASE INITIALIZATION ====================

/**
 * Initialize database schema and tables
 */
export const initializeDatabase = async () => {
  try {
    console.log('🔧 Initializing database schema...');
    
    // Create categories table if not exists
    const { error: categoriesError } = await supabaseAdmin.rpc('create_categories_table');
    
    if (categoriesError && !categoriesError.message.includes('already exists')) {
      console.warn('⚠️ Could not create categories table via RPC, trying SQL...');
      
      // Try to create tables directly with SQL
      const createTablesSQL = `
        -- Create categories table
        CREATE TABLE IF NOT EXISTS public.categories (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name TEXT NOT NULL,
          display_name TEXT NOT NULL,
          slug TEXT UNIQUE NOT NULL,
          description TEXT,
          parent_id UUID REFERENCES public.categories(id),
          category_type TEXT NOT NULL CHECK (category_type IN ('customized', 'ready_made')),
          usage_type TEXT NOT NULL CHECK (usage_type IN ('indoor', 'outdoor', 'both')),
          product_type TEXT,
          product_categories TEXT[] DEFAULT '{}',
          level INTEGER DEFAULT 1,
          display_order INTEGER DEFAULT 0,
          icon TEXT DEFAULT '📦',
          color TEXT DEFAULT '#3B82F6',
          image_url TEXT,
          is_featured BOOLEAN DEFAULT false,
          is_active BOOLEAN DEFAULT true,
          filter_tags TEXT[] DEFAULT '{}',
          hierarchy_path TEXT,
          metadata JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Create product_types table
        CREATE TABLE IF NOT EXISTS public.product_types (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name TEXT NOT NULL,
          value TEXT UNIQUE NOT NULL,
          icon TEXT DEFAULT '📦',
          color TEXT DEFAULT '#6B7280',
          status TEXT DEFAULT 'active',
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Create product_categories table
        CREATE TABLE IF NOT EXISTS public.product_categories (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name TEXT NOT NULL,
          value TEXT UNIQUE NOT NULL,
          icon TEXT DEFAULT '🏷️',
          color TEXT DEFAULT '#6B7280',
          status TEXT DEFAULT 'active',
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Add category_id to products table if not exists
        DO $$ 
        BEGIN 
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'products' AND column_name = 'category_id') THEN
            ALTER TABLE public.products ADD COLUMN category_id UUID REFERENCES public.categories(id);
          END IF;
        END $$;

        -- Add category_type to products table if not exists
        DO $$ 
        BEGIN 
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'products' AND column_name = 'category_type') THEN
            ALTER TABLE public.products ADD COLUMN category_type TEXT;
          END IF;
        END $$;

        -- Add usage_type to products table if not exists
        DO $$ 
        BEGIN 
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'products' AND column_name = 'usage_type') THEN
            ALTER TABLE public.products ADD COLUMN usage_type TEXT;
          END IF;
        END $$;

        -- Add product_categories to products table if not exists
        DO $$ 
        BEGIN 
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'products' AND column_name = 'product_categories') THEN
            ALTER TABLE public.products ADD COLUMN product_categories TEXT[] DEFAULT '{}';
          END IF;
        END $$;

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_categories_active ON public.categories(is_active);
        CREATE INDEX IF NOT EXISTS idx_categories_featured ON public.categories(is_featured);
        CREATE INDEX IF NOT EXISTS idx_categories_type ON public.categories(category_type);
        CREATE INDEX IF NOT EXISTS idx_categories_usage ON public.categories(usage_type);
        CREATE INDEX IF NOT EXISTS idx_categories_product_type ON public.categories(product_type);
        CREATE INDEX IF NOT EXISTS idx_categories_display_order ON public.categories(display_order);
        
        CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
        CREATE INDEX IF NOT EXISTS idx_products_category_type ON public.products(category_type);
        CREATE INDEX IF NOT EXISTS idx_products_usage_type ON public.products(usage_type);

        -- Enable Row Level Security
        ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.product_types ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

        -- Create policies for categories
        DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;
        CREATE POLICY "Categories are viewable by everyone" 
          ON public.categories FOR SELECT USING (true);

        DROP POLICY IF EXISTS "Categories are manageable by admin" ON public.categories;
        CREATE POLICY "Categories are manageable by admin" 
          ON public.categories FOR ALL 
          USING (auth.jwt() ->> 'user_type' = 'admin');

        -- Create policies for product_types
        DROP POLICY IF EXISTS "Product types are viewable by everyone" ON public.product_types;
        CREATE POLICY "Product types are viewable by everyone" 
          ON public.product_types FOR SELECT USING (true);

        -- Create policies for product_categories
        DROP POLICY IF EXISTS "Product categories are viewable by everyone" ON public.product_categories;
        CREATE POLICY "Product categories are viewable by everyone" 
          ON public.product_categories FOR SELECT USING (true);
      `;
      
      const { error: sqlError } = await supabaseAdmin.rpc('exec_sql', { sql: createTablesSQL });
      
      if (sqlError) {
        console.error('❌ SQL execution error:', sqlError);
      }
    }

    console.log('✅ Database initialization completed');
    return { success: true };
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    return { success: false, error };
  }
};

// ==================== CATEGORY FUNCTIONS ====================

/**
 * Get all categories with optional filters
 */
export const getCategories = async (filters?: {
  is_active?: boolean;
  is_featured?: boolean;
  category_type?: 'customized' | 'ready_made';
  usage_type?: 'indoor' | 'outdoor' | 'both';
  product_type?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) => {
  try {
    let query = supabase
      .from('categories')
      .select('*', { count: 'exact' })
      .order('display_order', { ascending: true });

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    if (filters?.is_featured !== undefined) {
      query = query.eq('is_featured', filters.is_featured);
    }

    if (filters?.category_type) {
      query = query.eq('category_type', filters.category_type);
    }

    if (filters?.usage_type) {
      query = query.eq('usage_type', filters.usage_type);
    }

    if (filters?.product_type) {
      query = query.eq('product_type', filters.product_type);
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return { data, count };
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    throw new Error(error.message || 'Failed to fetch categories');
  }
};

/**
 * Get category by ID
 */
export const getCategoryById = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return data;
  } catch (error: any) {
    console.error('Error fetching category:', error);
    throw new Error(error.message || 'Failed to fetch category');
  }
};

/**
 * Create a new category
 */
export const createCategory = async (categoryData: any) => {
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
  } catch (error: any) {
    console.error('Error creating category:', error);
    throw new Error(error.message || 'Failed to create category');
  }
};

/**
 * Update a category
 */
export const updateCategory = async (id: string, updates: any) => {
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
  } catch (error: any) {
    console.error('Error updating category:', error);
    throw new Error(error.message || 'Failed to update category');
  }
};

/**
 * Delete a category
 */
export const deleteCategory = async (id: string) => {
  try {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting category:', error);
    throw new Error(error.message || 'Failed to delete category');
  }
};

// ==================== PRODUCT-CATEGORY RELATIONSHIP FUNCTIONS ====================

/**
 * Get products by category
 */
export const getProductsByCategory = async (categoryId: string, filters?: {
  limit?: number;
  offset?: number;
  status?: string;
}) => {
  try {
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('category_id', categoryId)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return { data, count };
  } catch (error: any) {
    console.error('Error fetching products by category:', error);
    throw new Error(error.message || 'Failed to fetch products');
  }
};

/**
 * Update product category relationship
 */
export const updateProductCategory = async (productId: string, categoryData: {
  category_id?: string;
  category_type?: 'customized' | 'ready_made';
  usage_type?: 'indoor' | 'outdoor' | 'both';
  product_categories?: string[];
}) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .update({
        ...categoryData,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error: any) {
    console.error('Error updating product category:', error);
    throw new Error(error.message || 'Failed to update product category');
  }
};

/**
 * Get category statistics
 */
export const getCategoryStats = async () => {
  try {
    // Get total categories
    const { count: total } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true });

    // Get active categories
    const { count: active } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Get featured categories
    const { count: featured } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true })
      .eq('is_featured', true)
      .eq('is_active', true);

    // Get categories by type
    const { count: customized } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true })
      .eq('category_type', 'customized')
      .eq('is_active', true);

    const { count: readyMade } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true })
      .eq('category_type', 'ready_made')
      .eq('is_active', true);

    // Get categories with products count
    const { data: categoriesWithProducts } = await supabase
      .from('categories')
      .select(`
        *,
        products:products(count)
      `)
      .eq('is_active', true);

    return {
      total: total || 0,
      active: active || 0,
      featured: featured || 0,
      by_type: {
        customized: customized || 0,
        ready_made: readyMade || 0
      },
      categories_with_products: categoriesWithProducts?.map(cat => ({
        id: cat.id,
        name: cat.name,
        product_count: (cat as any).products?.[0]?.count || 0
      })) || []
    };
  } catch (error: any) {
    console.error('Error fetching category stats:', error);
    throw new Error(error.message || 'Failed to fetch category statistics');
  }
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Check if current user is admin
 */
export const isAdmin = async (): Promise<boolean> => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('No authenticated user:', authError);
      return false;
    }
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();
    
    if (profileError || !profile) {
      console.error('Error fetching profile:', profileError);
      return false;
    }
    
    return profile.user_type === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

/**
 * Get current user's profile with admin check
 */
export const getAdminProfile = async () => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('No authenticated user:', authError);
      return null;
    }
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError || !profile) {
      console.error('Error fetching profile:', profileError);
      return null;
    }
    
    if (profile.user_type !== 'admin') {
      console.error('User is not admin');
      return null;
    }
    
    return { user, profile };
  } catch (error) {
    console.error('Error getting admin profile:', error);
    return null;
  }
};

/**
 * Subscribe to real-time changes in a table
 */
export const subscribeToTable = (
  table: keyof Database['public']['Tables'],
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
  callback: (payload: any) => void
) => {
  return supabase
    .channel(`realtime:${table}`)
    .on(
      'postgres_changes',
      {
        event,
        schema: 'public',
        table: table as string,
      },
      (payload) => {
        console.log(`📡 Real-time update for ${table}:`, payload);
        callback(payload);
      }
    )
    .subscribe((status) => {
      console.log(`📡 Subscription status for ${table}:`, status);
    });
};

/**
 * Subscribe to categories changes (real-time)
 */
export const subscribeToCategories = (callback: (payload: any) => void) => {
  return subscribeToTable('categories', '*', callback);
};

/**
 * Log admin activity
 */
export const logAdminActivity = async (
  action: string,
  targetType: string,
  targetId?: string,
  details?: any
) => {
  try {
    const adminUser = await getAdminProfile();
    
    if (!adminUser) {
      console.warn('Cannot log activity: No admin user found');
      return;
    }
    
    const { data, error } = await supabaseAdmin
      .from('activity_logs')
      .insert({
        user_id: adminUser.user.id,
        user_type: 'admin',
        action,
        target_type: targetType,
        target_id: targetId,
        details: details || {},
        ip_address: typeof window !== 'undefined' ? 'client' : 'server',
        user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error logging activity:', error);
    } else {
      console.log(`📝 Activity logged: ${action} on ${targetType}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error in logAdminActivity:', error);
  }
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Format currency
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format date
 */
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Get status color
 */
export const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'active':
    case 'approved':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'pending':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'rejected':
    case 'suspended':
    case 'inactive':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'under_review':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'more_info_needed':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

// ==================== TYPE EXPORTS ====================
export type Category = Database['public']['Tables']['categories']['Row'];
export type Product = Database['public']['Tables']['products']['Row'] & {
  category?: Category;
};
export type ProductType = Database['public']['Tables']['product_types']['Row'];
export type ProductCategory = Database['public']['Tables']['product_categories']['Row'];

// Export database types
export type { Database };