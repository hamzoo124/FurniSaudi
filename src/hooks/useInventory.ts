import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

// ==================== TYPE DEFINITIONS ====================

export interface InventoryProduct {
  id: string;
  name: string;
  sku: string;
  price: number;
  discount_price?: number;
  images: string[];
  category_name?: string;
  product_type: 'ready-made' | 'custom';
  status: 'active' | 'draft' | 'archived';
  is_featured: boolean;
  is_best_seller: boolean;
  units_sold?: number;
  revenue?: number;
  rating?: number;
  review_count?: number;
}

export interface InventoryItem {
  id: string;
  product_id: string;
  seller_id: string;
  stock_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  low_stock_threshold: number;
  min_stock_level: number;
  reorder_quantity: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued';
  last_stock_in_date?: string;
  last_stock_out_date?: string;
  last_updated: string;
  notes?: string;
  warehouse_location?: string;
  bin_number?: string;
  product: InventoryProduct;
}

export interface PaginatedInventory {
  items: InventoryItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface UpdateStockPayload {
  productId: string;
  quantity: number;
  action: 'add' | 'subtract' | 'set';
  notes?: string;
  location?: string;
  reason?: 'restock' | 'sale' | 'return' | 'damage' | 'adjustment' | 'transfer';
}

export interface StockHistory {
  id: string;
  inventory_id: string;
  product_id: string;
  seller_id: string;
  previous_quantity: number;
  new_quantity: number;
  change_amount: number;
  action: 'add' | 'subtract' | 'set';
  reason: string;
  notes?: string;
  performed_by: string;
  created_at: string;
}

// ==================== MOCK DATA FOR TESTING ====================

const mockInventoryItems: InventoryItem[] = [
  {
    id: 'inv-001',
    product_id: 'prod-001',
    seller_id: 'seller-001',
    stock_quantity: 42,
    reserved_quantity: 3,
    available_quantity: 39,
    low_stock_threshold: 10,
    min_stock_level: 5,
    reorder_quantity: 20,
    status: 'in_stock',
    last_stock_in_date: '2024-01-15T08:30:00Z',
    last_stock_out_date: '2024-01-16T14:20:00Z',
    last_updated: '2024-01-16T14:20:00Z',
    warehouse_location: 'A-12',
    bin_number: 'B45',
    notes: 'Fast-moving item. Restock when below 15 units.',
    product: {
      id: 'prod-001',
      name: 'Modern Executive Office Chair',
      sku: 'FUR-001',
      price: 2999,
      discount_price: 2499,
      images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop'],
      category_name: 'Office Chairs',
      product_type: 'ready-made',
      status: 'active',
      is_featured: true,
      is_best_seller: true,
      units_sold: 156,
      revenue: 389844,
      rating: 4.8,
      review_count: 42
    }
  },
  {
    id: 'inv-002',
    product_id: 'prod-002',
    seller_id: 'seller-001',
    stock_quantity: 8,
    reserved_quantity: 1,
    available_quantity: 7,
    low_stock_threshold: 5,
    min_stock_level: 3,
    reorder_quantity: 10,
    status: 'low_stock',
    last_stock_in_date: '2024-01-10T11:15:00Z',
    last_stock_out_date: '2024-01-16T10:45:00Z',
    last_updated: '2024-01-16T10:45:00Z',
    warehouse_location: 'B-08',
    bin_number: 'C22',
    notes: 'Popular item. Consider increasing reorder quantity.',
    product: {
      id: 'prod-002',
      name: 'Leather Reclining Sofa',
      sku: 'FUR-002',
      price: 8999,
      images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=600&fit=crop'],
      category_name: 'Sofas',
      product_type: 'ready-made',
      status: 'active',
      is_featured: true,
      is_best_seller: false,
      units_sold: 28,
      revenue: 251972,
      rating: 4.6,
      review_count: 18
    }
  },
  {
    id: 'inv-003',
    product_id: 'prod-003',
    seller_id: 'seller-001',
    stock_quantity: 3,
    reserved_quantity: 0,
    available_quantity: 3,
    low_stock_threshold: 5,
    min_stock_level: 2,
    reorder_quantity: 15,
    status: 'low_stock',
    last_stock_in_date: '2024-01-08T09:30:00Z',
    last_stock_out_date: '2024-01-15T16:10:00Z',
    last_updated: '2024-01-15T16:10:00Z',
    warehouse_location: 'A-05',
    bin_number: 'A31',
    notes: 'Critical low stock. Urgent restock needed.',
    product: {
      id: 'prod-003',
      name: 'Minimalist Coffee Table',
      sku: 'FUR-003',
      price: 2499,
      discount_price: 1999,
      images: ['https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=800&h=600&fit=crop'],
      category_name: 'Coffee Tables',
      product_type: 'ready-made',
      status: 'active',
      is_featured: false,
      is_best_seller: false,
      units_sold: 67,
      revenue: 167833,
      rating: 4.4,
      review_count: 31
    }
  },
  {
    id: 'inv-004',
    product_id: 'prod-004',
    seller_id: 'seller-001',
    stock_quantity: 0,
    reserved_quantity: 0,
    available_quantity: 0,
    low_stock_threshold: 3,
    min_stock_level: 1,
    reorder_quantity: 8,
    status: 'out_of_stock',
    last_stock_in_date: '2024-01-12T10:00:00Z',
    last_stock_out_date: '2024-01-16T09:15:00Z',
    last_updated: '2024-01-16T09:15:00Z',
    warehouse_location: 'C-03',
    bin_number: 'D12',
    notes: 'Out of stock. Supplier delivery expected on 2024-01-20.',
    product: {
      id: 'prod-004',
      name: 'Outdoor Patio Set',
      sku: 'FUR-004',
      price: 12999,
      discount_price: 10999,
      images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop'],
      category_name: 'Outdoor Furniture',
      product_type: 'ready-made',
      status: 'active',
      is_featured: true,
      is_best_seller: false,
      units_sold: 12,
      revenue: 131988,
      rating: 4.3,
      review_count: 8
    }
  },
  {
    id: 'inv-005',
    product_id: 'prod-005',
    seller_id: 'seller-001',
    stock_quantity: 15,
    reserved_quantity: 2,
    available_quantity: 13,
    low_stock_threshold: 8,
    min_stock_level: 4,
    reorder_quantity: 15,
    status: 'in_stock',
    last_stock_in_date: '2024-01-14T13:45:00Z',
    last_stock_out_date: '2024-01-15T11:30:00Z',
    last_updated: '2024-01-15T11:30:00Z',
    warehouse_location: 'B-15',
    bin_number: 'E08',
    notes: 'Steady sales. Monitor stock weekly.',
    product: {
      id: 'prod-005',
      name: 'Ergonomic Study Desk',
      sku: 'FUR-005',
      price: 3499,
      images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop'],
      category_name: 'Desks',
      product_type: 'ready-made',
      status: 'active',
      is_featured: false,
      is_best_seller: false,
      units_sold: 31,
      revenue: 108469,
      rating: 4.5,
      review_count: 19
    }
  }
];

// ==================== UTILITY FUNCTIONS ====================

const calculateInventoryStatus = (
  stockQuantity: number,
  lowStockThreshold: number,
  minStockLevel: number
): InventoryItem['status'] => {
  if (stockQuantity === 0) return 'out_of_stock';
  if (stockQuantity <= minStockLevel) return 'low_stock';
  if (stockQuantity <= lowStockThreshold) return 'low_stock';
  return 'in_stock';
};

const validateStockUpdate = (
  currentQuantity: number,
  changeAmount: number,
  action: UpdateStockPayload['action']
): { isValid: boolean; newQuantity: number; error?: string } => {
  let newQuantity = currentQuantity;

  switch (action) {
    case 'add':
      newQuantity = currentQuantity + changeAmount;
      break;
    case 'subtract':
      newQuantity = currentQuantity - changeAmount;
      if (newQuantity < 0) {
        return {
          isValid: false,
          newQuantity: 0,
          error: `Cannot subtract ${changeAmount} from ${currentQuantity}. Would result in negative stock.`
        };
      }
      break;
    case 'set':
      newQuantity = changeAmount;
      if (newQuantity < 0) {
        return {
          isValid: false,
          newQuantity: 0,
          error: 'Cannot set stock to negative value.'
        };
      }
      break;
  }

  return { isValid: true, newQuantity };
};

// ==================== MAIN INVENTORY HOOK ====================

export const useInventory = (
  sellerId: string,
  options: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: InventoryItem['status'] | 'all';
    category?: string;
    sortBy?: 'last_updated' | 'stock_quantity' | 'product_name' | 'sku';
    sortOrder?: 'asc' | 'desc';
  } = {}
) => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    totalCount: 0,
    totalPages: 0,
    currentPage: options.page || 1,
    pageSize: options.pageSize || 10
  });

  // Cache for optimistic updates
  const previousInventoryRef = useRef<InventoryItem[]>([]);

  const fetchInventory = useCallback(async () => {
    if (!sellerId) {
      setError('Seller ID is required');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const {
        page = 1,
        pageSize = 10,
        search,
        status = 'all',
        category,
        sortBy = 'last_updated',
        sortOrder = 'desc'
      } = options;

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // Check demo mode
      const demoMode = localStorage.getItem('demoMode') === 'true';
      
      if (demoMode) {
        await new Promise(resolve => setTimeout(resolve, 800));
        
        let filteredItems = mockInventoryItems.filter(item => item.seller_id === sellerId);
        
        // Apply filters
        if (status !== 'all') {
          filteredItems = filteredItems.filter(item => item.status === status);
        }
        
        if (search) {
          const searchLower = search.toLowerCase();
          filteredItems = filteredItems.filter(item =>
            item.product.name.toLowerCase().includes(searchLower) ||
            item.product.sku.toLowerCase().includes(searchLower) ||
            item.warehouse_location?.toLowerCase().includes(searchLower)
          );
        }
        
        if (category) {
          filteredItems = filteredItems.filter(item => 
            item.product.category_name === category
          );
        }
        
        // Apply sorting
        filteredItems.sort((a, b) => {
          let aValue: any, bValue: any;
          
          switch (sortBy) {
            case 'product_name':
              aValue = a.product.name;
              bValue = b.product.name;
              break;
            case 'sku':
              aValue = a.product.sku;
              bValue = b.product.sku;
              break;
            case 'stock_quantity':
              aValue = a.stock_quantity;
              bValue = b.stock_quantity;
              break;
            case 'last_updated':
            default:
              aValue = new Date(a.last_updated).getTime();
              bValue = new Date(b.last_updated).getTime();
              break;
          }
          
          if (sortOrder === 'asc') {
            return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
          } else {
            return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
          }
        });
        
        const paginatedItems = filteredItems.slice(from, to + 1);
        
        setInventory(paginatedItems);
        setPagination({
          totalCount: filteredItems.length,
          totalPages: Math.ceil(filteredItems.length / pageSize),
          currentPage: page,
          pageSize
        });
        previousInventoryRef.current = paginatedItems;
        setLoading(false);
        return;
      }

      // Real Supabase query
      let query = supabase
        .from('inventory')
        .select(`
          *,
          product:products (
            id,
            name,
            sku,
            price,
            discount_price,
            images,
            category_id,
            product_type,
            status,
            is_featured,
            is_best_seller,
            units_sold,
            revenue,
            rating,
            review_count,
            categories:category_id (
              name
            )
          )
        `, { count: 'exact' })
        .eq('seller_id', sellerId);

      // Apply filters
      if (status !== 'all') {
        query = query.eq('status', status);
      }

      if (search) {
        query = query.or(`product.name.ilike.%${search}%,product.sku.ilike.%${search}%,warehouse_location.ilike.%${search}%`);
      }

      // Apply sorting
      switch (sortBy) {
        case 'product_name':
          query = query.order('product.name', { ascending: sortOrder === 'asc' });
          break;
        case 'sku':
          query = query.order('product.sku', { ascending: sortOrder === 'asc' });
          break;
        case 'stock_quantity':
          query = query.order('stock_quantity', { ascending: sortOrder === 'asc' });
          break;
        case 'last_updated':
        default:
          query = query.order('last_updated', { ascending: sortOrder === 'asc' });
          break;
      }

      // Apply pagination
      query = query.range(from, to);

      const { data, error: supabaseError, count } = await query;

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      // Transform the data
      const transformedItems: InventoryItem[] = (data || []).map((item: any) => {
        const availableQuantity = item.stock_quantity - item.reserved_quantity;
        
        return {
          ...item,
          available_quantity: Math.max(0, availableQuantity),
          product: {
            ...item.product,
            category_name: item.product.categories?.name,
            images: item.product.images || []
          }
        };
      });

      setInventory(transformedItems);
      setPagination({
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
        currentPage: page,
        pageSize
      });
      previousInventoryRef.current = transformedItems;
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch inventory');
      // Restore previous state on error
      setInventory(previousInventoryRef.current);
    } finally {
      setLoading(false);
    }
  }, [sellerId, options.page, options.pageSize, options.search, options.status, options.category, options.sortBy, options.sortOrder]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const refetch = useCallback(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Optimistic update for inventory items
  const optimisticUpdate = useCallback((productId: string, updates: Partial<InventoryItem>) => {
    setInventory(prev => prev.map(item => {
      if (item.product_id === productId) {
        const updatedItem = {
          ...item,
          ...updates,
          last_updated: new Date().toISOString()
        };
        
        // Recalculate available quantity if stock or reserved changed
        if (updates.stock_quantity !== undefined || updates.reserved_quantity !== undefined) {
          updatedItem.available_quantity = Math.max(
            0,
            (updates.stock_quantity ?? item.stock_quantity) - (updates.reserved_quantity ?? item.reserved_quantity)
          );
          
          // Recalculate status
          updatedItem.status = calculateInventoryStatus(
            updatedItem.stock_quantity,
            updatedItem.low_stock_threshold,
            updatedItem.min_stock_level
          );
        }
        
        return updatedItem;
      }
      return item;
    }));
  }, []);

  return {
    inventory,
    loading,
    error,
    pagination,
    refetch,
    optimisticUpdate
  };
};

// ==================== UPDATE INVENTORY HOOK ====================

export const useUpdateInventory = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateStock = useCallback(async (
    payload: UpdateStockPayload,
    userId: string
  ): Promise<{
    success: boolean;
    updatedItem?: InventoryItem;
    error?: string;
  }> => {
    if (!payload.productId || !userId) {
      return {
        success: false,
        error: 'Product ID and User ID are required'
      };
    }

    setLoading(true);
    setError(null);

    try {
      const demoMode = localStorage.getItem('demoMode') === 'true';
      
      if (demoMode) {
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const inventoryItem = mockInventoryItems.find(item => 
          item.product_id === payload.productId && item.seller_id === 'seller-001'
        );
        
        if (!inventoryItem) {
          return {
            success: false,
            error: 'Inventory item not found'
          };
        }
        
        const validation = validateStockUpdate(
          inventoryItem.stock_quantity,
          payload.quantity,
          payload.action
        );
        
        if (!validation.isValid) {
          return {
            success: false,
            error: validation.error
          };
        }
        
        const updatedItem = {
          ...inventoryItem,
          stock_quantity: validation.newQuantity,
          available_quantity: validation.newQuantity - inventoryItem.reserved_quantity,
          status: calculateInventoryStatus(
            validation.newQuantity,
            inventoryItem.low_stock_threshold,
            inventoryItem.min_stock_level
          ),
          last_updated: new Date().toISOString(),
          last_stock_in_date: payload.action === 'add' ? new Date().toISOString() : inventoryItem.last_stock_in_date,
          last_stock_out_date: payload.action === 'subtract' ? new Date().toISOString() : inventoryItem.last_stock_out_date
        };
        
        console.log('Demo mode: Stock would be updated:', {
          payload,
          before: inventoryItem.stock_quantity,
          after: updatedItem.stock_quantity
        });
        
        return {
          success: true,
          updatedItem
        };
      }

      // Real Supabase implementation
      // First, get current inventory state
      const { data: currentData, error: fetchError } = await supabase
        .from('inventory')
        .select('*')
        .eq('product_id', payload.productId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch current inventory: ${fetchError.message}`);
      }

      if (!currentData) {
        throw new Error('Inventory item not found');
      }

      // Validate the update
      const validation = validateStockUpdate(
        currentData.stock_quantity,
        payload.quantity,
        payload.action
      );

      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Calculate new status
      const newStatus = calculateInventoryStatus(
        validation.newQuantity,
        currentData.low_stock_threshold,
        currentData.min_stock_level
      );

      // Update inventory using atomic operation
      const { data: updatedData, error: updateError } = await supabase
        .from('inventory')
        .update({
          stock_quantity: validation.newQuantity,
          status: newStatus,
          last_updated: new Date().toISOString(),
          last_stock_in_date: payload.action === 'add' ? new Date().toISOString() : currentData.last_stock_in_date,
          last_stock_out_date: payload.action === 'subtract' ? new Date().toISOString() : currentData.last_stock_out_date
        })
        .eq('product_id', payload.productId)
        .select(`
          *,
          product:products (
            id,
            name,
            sku,
            price,
            discount_price,
            images,
            category_id,
            product_type,
            status,
            is_featured,
            is_best_seller,
            units_sold,
            revenue,
            rating,
            review_count,
            categories:category_id (
              name
            )
          )
        `)
        .single();

      if (updateError) {
        throw new Error(`Failed to update inventory: ${updateError.message}`);
      }

      // Create stock history record
      const { error: historyError } = await supabase
        .from('stock_history')
        .insert({
          inventory_id: updatedData.id,
          product_id: payload.productId,
          seller_id: currentData.seller_id,
          previous_quantity: currentData.stock_quantity,
          new_quantity: validation.newQuantity,
          change_amount: payload.action === 'set' 
            ? validation.newQuantity - currentData.stock_quantity 
            : payload.quantity * (payload.action === 'add' ? 1 : -1),
          action: payload.action,
          reason: payload.reason || 'manual_adjustment',
          notes: payload.notes,
          performed_by: userId,
          created_at: new Date().toISOString()
        });

      if (historyError) {
        console.warn('Failed to create stock history:', historyError);
        // Don't fail the whole operation if history creation fails
      }

      // Transform the response
      const updatedItem: InventoryItem = {
        ...updatedData,
        available_quantity: updatedData.stock_quantity - updatedData.reserved_quantity,
        product: {
          ...updatedData.product,
          category_name: updatedData.product.categories?.name,
          images: updatedData.product.images || []
        }
      };

      return {
        success: true,
        updatedItem
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update inventory';
      console.error('Error updating inventory:', err);
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkUpdateStock = useCallback(async (
    updates: UpdateStockPayload[],
    userId: string
  ): Promise<{
    success: boolean;
    results: Array<{ productId: string; success: boolean; error?: string }>;
  }> => {
    if (!updates.length || !userId) {
      return {
        success: false,
        results: []
      };
    }

    setLoading(true);
    setError(null);

    try {
      const demoMode = localStorage.getItem('demoMode') === 'true';
      
      if (demoMode) {
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        const results = updates.map(update => {
          const inventoryItem = mockInventoryItems.find(item => 
            item.product_id === update.productId
          );
          
          if (!inventoryItem) {
            return {
              productId: update.productId,
              success: false,
              error: 'Inventory item not found'
            };
          }
          
          const validation = validateStockUpdate(
            inventoryItem.stock_quantity,
            update.quantity,
            update.action
          );
          
          if (!validation.isValid) {
            return {
              productId: update.productId,
              success: false,
              error: validation.error
            };
          }
          
          return {
            productId: update.productId,
            success: true,
            newQuantity: validation.newQuantity
          };
        });
        
        console.log('Demo mode: Bulk stock update would be performed:', results);
        
        return {
          success: results.every(r => r.success),
          results
        };
      }

      // Real Supabase bulk update
      const results = [];
      
      for (const update of updates) {
        try {
          const result = await updateStock(update, userId);
          results.push({
            productId: update.productId,
            success: result.success,
            error: result.error
          });
        } catch (err) {
          results.push({
            productId: update.productId,
            success: false,
            error: err instanceof Error ? err.message : 'Update failed'
          });
        }
      }

      const allSuccessful = results.every(r => r.success);
      
      return {
        success: allSuccessful,
        results
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to perform bulk update';
      console.error('Error in bulk update:', err);
      setError(errorMessage);
      return {
        success: false,
        results: updates.map(update => ({
          productId: update.productId,
          success: false,
          error: errorMessage
        }))
      };
    } finally {
      setLoading(false);
    }
  }, [updateStock]);

  const updateInventorySettings = useCallback(async (
    productId: string,
    settings: {
      low_stock_threshold?: number;
      min_stock_level?: number;
      reorder_quantity?: number;
      warehouse_location?: string;
      bin_number?: string;
      notes?: string;
    }
  ): Promise<{
    success: boolean;
    updatedItem?: InventoryItem;
    error?: string;
  }> => {
    if (!productId) {
      return {
        success: false,
        error: 'Product ID is required'
      };
    }

    setLoading(true);
    setError(null);

    try {
      const demoMode = localStorage.getItem('demoMode') === 'true';
      
      if (demoMode) {
        await new Promise(resolve => setTimeout(resolve, 600));
        
        console.log('Demo mode: Inventory settings would be updated:', {
          productId,
          settings
        });
        
        return {
          success: true,
          updatedItem: mockInventoryItems[0] // Mock response
        };
      }

      // Update settings in Supabase
      const { data: updatedData, error: updateError } = await supabase
        .from('inventory')
        .update({
          ...settings,
          last_updated: new Date().toISOString()
        })
        .eq('product_id', productId)
        .select(`
          *,
          product:products (
            id,
            name,
            sku,
            price,
            discount_price,
            images,
            category_id,
            product_type,
            status,
            is_featured,
            is_best_seller,
            units_sold,
            revenue,
            rating,
            review_count,
            categories:category_id (
              name
            )
          )
        `)
        .single();

      if (updateError) {
        throw new Error(`Failed to update inventory settings: ${updateError.message}`);
      }

      // Recalculate status if thresholds changed
      if (settings.low_stock_threshold !== undefined || settings.min_stock_level !== undefined) {
        const newStatus = calculateInventoryStatus(
          updatedData.stock_quantity,
          settings.low_stock_threshold ?? updatedData.low_stock_threshold,
          settings.min_stock_level ?? updatedData.min_stock_level
        );

        if (newStatus !== updatedData.status) {
          const { error: statusError } = await supabase
            .from('inventory')
            .update({ status: newStatus })
            .eq('product_id', productId);

          if (statusError) {
            console.warn('Failed to update status after threshold change:', statusError);
          } else {
            updatedData.status = newStatus;
          }
        }
      }

      // Transform the response
      const updatedItem: InventoryItem = {
        ...updatedData,
        available_quantity: updatedData.stock_quantity - updatedData.reserved_quantity,
        product: {
          ...updatedData.product,
          category_name: updatedData.product.categories?.name,
          images: updatedData.product.images || []
        }
      };

      return {
        success: true,
        updatedItem
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update inventory settings';
      console.error('Error updating inventory settings:', err);
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    updateStock,
    bulkUpdateStock,
    updateInventorySettings,
    loading,
    error
  };
};

// ==================== LOW STOCK INVENTORY HOOK ====================

export const useLowStockInventory = (
  sellerId: string,
  threshold?: number
) => {
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [criticalItems, setCriticalItems] = useState<InventoryItem[]>([]);

  const fetchLowStockInventory = useCallback(async () => {
    if (!sellerId) {
      setError('Seller ID is required');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const lowStockThreshold = threshold || 5;
      const criticalThreshold = threshold ? Math.floor(threshold * 0.5) : 2;

      // Check demo mode
      const demoMode = localStorage.getItem('demoMode') === 'true';
      
      if (demoMode) {
        await new Promise(resolve => setTimeout(resolve, 600));
        
        const allItems = mockInventoryItems.filter(item => item.seller_id === sellerId);
        
        const lowStock = allItems.filter(item => 
          item.status === 'low_stock' || item.status === 'out_of_stock'
        );
        
        const critical = lowStock.filter(item => 
          item.stock_quantity <= criticalThreshold || item.status === 'out_of_stock'
        );
        
        setLowStockItems(lowStock);
        setCriticalItems(critical);
        setLoading(false);
        return;
      }

      // Real Supabase query for low stock items
      const { data, error: supabaseError } = await supabase
        .from('inventory')
        .select(`
          *,
          product:products (
            id,
            name,
            sku,
            price,
            discount_price,
            images,
            category_id,
            product_type,
            status,
            is_featured,
            is_best_seller,
            units_sold,
            revenue,
            rating,
            review_count,
            categories:category_id (
              name
            )
          )
        `)
        .eq('seller_id', sellerId)
        .or(`status.eq.low_stock,status.eq.out_of_stock,stock_quantity.lte.${lowStockThreshold}`)
        .order('stock_quantity', { ascending: true })
        .limit(50);

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      // Transform the data
      const transformedItems: InventoryItem[] = (data || []).map((item: any) => ({
        ...item,
        available_quantity: item.stock_quantity - item.reserved_quantity,
        product: {
          ...item.product,
          category_name: item.product.categories?.name,
          images: item.product.images || []
        }
      }));

      const critical = transformedItems.filter(item => 
        item.stock_quantity <= criticalThreshold || item.status === 'out_of_stock'
      );

      setLowStockItems(transformedItems);
      setCriticalItems(critical);
    } catch (err) {
      console.error('Error fetching low stock inventory:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch low stock inventory');
    } finally {
      setLoading(false);
    }
  }, [sellerId, threshold]);

  useEffect(() => {
    fetchLowStockInventory();
  }, [fetchLowStockInventory]);

  const refetch = useCallback(() => {
    fetchLowStockInventory();
  }, [fetchLowStockInventory]);

  const lowStockCount = lowStockItems.length;
  const criticalCount = criticalItems.length;
  const outOfStockCount = lowStockItems.filter(item => item.status === 'out_of_stock').length;

  return {
    lowStockItems,
    criticalItems,
    loading,
    error,
    lowStockCount,
    criticalCount,
    outOfStockCount,
    refetch
  };
};

// ==================== INVENTORY STATISTICS HOOK ====================

export const useInventoryStatistics = (sellerId: string) => {
  const [statistics, setStatistics] = useState({
    totalItems: 0,
    inStockItems: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    totalStockValue: 0,
    averageStockLevel: 0,
    itemsNeedAttention: 0,
    reorderSuggestions: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = useCallback(async () => {
    if (!sellerId) {
      setError('Seller ID is required');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const demoMode = localStorage.getItem('demoMode') === 'true';
      
      if (demoMode) {
        await new Promise(resolve => setTimeout(resolve, 600));
        
        const sellerItems = mockInventoryItems.filter(item => item.seller_id === sellerId);
        
        const totalStockValue = sellerItems.reduce((sum, item) => 
          sum + (item.stock_quantity * item.product.price), 0
        );
        
        const avgStock = sellerItems.length > 0 
          ? sellerItems.reduce((sum, item) => sum + item.stock_quantity, 0) / sellerItems.length 
          : 0;
        
        const itemsNeedAttention = sellerItems.filter(item => 
          item.status === 'low_stock' || item.status === 'out_of_stock'
        ).length;
        
        const reorderSuggestions = sellerItems.filter(item => 
          item.stock_quantity <= item.low_stock_threshold
        ).length;
        
        setStatistics({
          totalItems: sellerItems.length,
          inStockItems: sellerItems.filter(item => item.status === 'in_stock').length,
          lowStockItems: sellerItems.filter(item => item.status === 'low_stock').length,
          outOfStockItems: sellerItems.filter(item => item.status === 'out_of_stock').length,
          totalStockValue,
          averageStockLevel: Math.round(avgStock),
          itemsNeedAttention,
          reorderSuggestions
        });
        setLoading(false);
        return;
      }

      // Real Supabase queries for statistics
      const [
        { count: totalCount, error: totalError },
        { count: inStockCount, error: inStockError },
        { count: lowStockCount, error: lowStockError },
        { count: outOfStockCount, error: outOfStockError },
        { data: stockValueData, error: stockValueError }
      ] = await Promise.all([
        supabase
          .from('inventory')
          .select('*', { count: 'exact', head: true })
          .eq('seller_id', sellerId),
        supabase
          .from('inventory')
          .select('*', { count: 'exact', head: true })
          .eq('seller_id', sellerId)
          .eq('status', 'in_stock'),
        supabase
          .from('inventory')
          .select('*', { count: 'exact', head: true })
          .eq('seller_id', sellerId)
          .eq('status', 'low_stock'),
        supabase
          .from('inventory')
          .select('*', { count: 'exact', head: true })
          .eq('seller_id', sellerId)
          .eq('status', 'out_of_stock'),
        supabase
          .from('inventory')
          .select('stock_quantity, product:products(price)')
          .eq('seller_id', sellerId)
      ]);

      const errors = [totalError, inStockError, lowStockError, outOfStockError, stockValueError].filter(Boolean);
      
      if (errors.length > 0) {
        throw new Error(errors[0]?.message || 'Failed to fetch inventory statistics');
      }

      // Calculate total stock value
      const totalStockValue = (stockValueData || []).reduce((sum: number, item: any) => {
        const itemValue = item.stock_quantity * (item.product?.price || 0);
        return sum + itemValue;
      }, 0);

      // Calculate average stock level
      const avgStock = totalCount ? 
        (stockValueData || []).reduce((sum: number, item: any) => sum + item.stock_quantity, 0) / totalCount : 0;

      // Get items that need attention
      const { count: attentionCount } = await supabase
        .from('inventory')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', sellerId)
        .or('status.eq.low_stock,status.eq.out_of_stock');

      // Get reorder suggestions
      const { count: reorderCount } = await supabase
        .from('inventory')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', sellerId)
        .lte('stock_quantity', supabase.raw('low_stock_threshold'));

      setStatistics({
        totalItems: totalCount || 0,
        inStockItems: inStockCount || 0,
        lowStockItems: lowStockCount || 0,
        outOfStockItems: outOfStockCount || 0,
        totalStockValue,
        averageStockLevel: Math.round(avgStock),
        itemsNeedAttention: attentionCount || 0,
        reorderSuggestions: reorderCount || 0
      });
    } catch (err) {
      console.error('Error fetching inventory statistics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch inventory statistics');
    } finally {
      setLoading(false);
    }
  }, [sellerId]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  const refetch = useCallback(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  return {
    statistics,
    loading,
    error,
    refetch
  };
};

// ==================== EXPORT ALL HOOKS ====================

export default {
  useInventory,
  useUpdateInventory,
  useLowStockInventory,
  useInventoryStatistics
};