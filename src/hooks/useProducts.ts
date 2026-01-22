import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase'
// import { useAuth } from './useAuth';
import { useAuth } from '../contexts/AuthContext';

export interface Product {
  id: string;
  seller_id: string;
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  sku: string;
  category_id: string;
  product_type: 'ready-made' | 'custom';
  status: 'active' | 'draft' | 'pending' | 'archived' | 'rejected';
  is_featured: boolean;
  is_best_seller: boolean;
  images: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateProductData {
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  sku: string;
  category_id: string;
  product_type: 'ready-made' | 'custom';
  status: 'active' | 'draft';
  is_featured: boolean;
  is_best_seller: boolean;
}

// SIMPLIFIED HOOK - FIXED VERSION
export const useProducts = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is authenticated
      if (!user?.id) {
        setError("Please login to view products");
        setProducts([]);
        return;
      }

      // Check demo mode
      const isDemoMode = localStorage.getItem('demoMode') === 'seller';
      
      if (isDemoMode) {
        // Demo data
        await new Promise(resolve => setTimeout(resolve, 800));
        const demoProducts: Product[] = [
          {
            id: '1',
            seller_id: user.id,
            name: 'Modern Executive Office Chair',
            description: 'Ergonomic office chair with lumbar support',
            price: 2999,
            stock_quantity: 42,
            sku: 'FUR-001',
            category_id: 'cat-001',
            product_type: 'ready-made',
            status: 'active',
            is_featured: true,
            is_best_seller: true,
            images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop'],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '2',
            seller_id: user.id,
            name: 'Leather Reclining Sofa',
            description: 'Premium leather sofa with recliner function',
            price: 8999,
            stock_quantity: 8,
            sku: 'FUR-002',
            category_id: 'cat-002',
            product_type: 'ready-made',
            status: 'active',
            is_featured: true,
            is_best_seller: false,
            images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=600&fit=crop'],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        setProducts(demoProducts);
        return;
      }

      // REAL DATA: Fetch from Supabase with seller_id filter
      console.log('Fetching products for seller ID:', user.id);
      
      const { data, error: supabaseError } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', user.id) // CRITICAL: Filter by seller
        .order('created_at', { ascending: false });

      if (supabaseError) {
        console.error('Supabase error:', supabaseError);
        throw new Error(supabaseError.message);
      }

      console.log('Products fetched:', data?.length || 0);
      setProducts(data || []);
      
    } catch (err) {
      console.error('Error in fetchProducts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // CRUD Operations
  const createProduct = useCallback(async (productData: CreateProductData) => {
    if (!user?.id) {
      throw new Error("User not authenticated");
    }

    const isDemoMode = localStorage.getItem('demoMode') === 'seller';
    
    if (isDemoMode) {
      const newProduct: Product = {
        id: `prod-${Date.now()}`,
        seller_id: user.id,
        ...productData,
        images: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setProducts(prev => [newProduct, ...prev]);
      return newProduct;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .insert([{
          ...productData,
          seller_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      
      setProducts(prev => [data, ...prev]);
      return data;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to create product');
    }
  }, [user?.id]);

  const updateProduct = useCallback(async (productId: string, updates: Partial<Product>) => {
    const isDemoMode = localStorage.getItem('demoMode') === 'seller';
    
    if (isDemoMode) {
      setProducts(prev => prev.map(p => 
        p.id === productId 
          ? { ...p, ...updates, updated_at: new Date().toISOString() }
          : p
      ));
      return;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)
        .select()
        .single();

      if (error) throw error;
      
      setProducts(prev => prev.map(p => 
        p.id === productId ? data : p
      ));
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to update product');
    }
  }, []);

  const deleteProduct = useCallback(async (productId: string) => {
    const isDemoMode = localStorage.getItem('demoMode') === 'seller';
    
    if (isDemoMode) {
      setProducts(prev => prev.filter(p => p.id !== productId));
      return;
    }

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to delete product');
    }
  }, []);

  // Other methods
  const updateStock = useCallback(async (productId: string, quantity: number) => {
    return updateProduct(productId, { stock_quantity: quantity });
  }, [updateProduct]);

  const toggleFeatured = useCallback(async (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      return updateProduct(productId, { is_featured: !product.is_featured });
    }
  }, [products, updateProduct]);

  const reload = useCallback(async () => {
    await fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user?.id, fetchProducts]);

  // --------------------
// Derived values
// --------------------
const pendingProducts = products.filter(
  product => product.status === "pending"
);

const productStats = {
  total: products.length,
  active: products.filter(p => p.status === "active").length,
  pending: pendingProducts.length,
  draft: products.filter(p => p.status === "draft").length,
  archived: products.filter(p => p.status === "archived").length,
};

 return {
  products,
  pendingProducts,
  productStats,
  loading,
  error,
  fetchProducts, // 👈 expose it
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  toggleFeatured,
  reload,
  categories: []
};

};