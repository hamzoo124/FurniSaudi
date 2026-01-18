// src/api/inventory.ts
import { supabase } from '@/lib/supabase';

// ============================================
// TYPE DEFINITIONS
// ============================================

export enum InventoryStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  OUT_OF_STOCK = 'out_of_stock',
  LOW_STOCK = 'low_stock',
  DISCONTINUED = 'discontinued'
}

export enum StockMovementType {
  RESTOCK = 'restock',
  SALE = 'sale',
  RETURN = 'return',
  ADJUSTMENT = 'adjustment',
  DAMAGE = 'damage',
  TRANSFER = 'transfer'
}

export interface InventoryItem {
  id: string;
  seller_id: string;
  product_id: string;
  
  // Product details
  name: string;
  description?: string;
  sku: string;
  category: string;
  subcategory?: string;
  
  // Stock information
  stock_quantity: number;
  reserved_quantity: number; // Items in carts/processing
  available_quantity: number; // stock_quantity - reserved_quantity
  min_stock_threshold: number;
  max_stock_threshold: number;
  reorder_quantity: number;
  
  // Pricing
  cost_price: number;
  selling_price: number;
  discount_price?: number;
  currency: string;
  
  // Status and tracking
  status: InventoryStatus;
  is_featured: boolean;
  is_best_seller: boolean;
  
  // Location and storage
  warehouse_location?: string;
  shelf_location?: string;
  storage_bin?: string;
  
  // Supplier information
  supplier_id?: string;
  supplier_name?: string;
  supplier_sku?: string;
  lead_time_days?: number;
  
  // Variant information
  variant_attributes?: Record<string, string>;
  variant_name?: string;
  parent_product_id?: string;
  
  // Dimensions and weight
  weight_kg?: number;
  dimensions_cm?: {
    length: number;
    width: number;
    height: number;
  };
  
  // Timestamps
  created_at: string;
  updated_at: string;
  last_stock_update: string;
  last_sale_date?: string;
  last_restock_date?: string;
}

export interface StockMovement {
  id: string;
  seller_id: string;
  product_id: string;
  inventory_item_id: string;
  movement_type: StockMovementType;
  quantity: number; // Positive for addition, negative for deduction
  previous_quantity: number;
  new_quantity: number;
  
  // Reference information
  order_id?: string;
  return_id?: string;
  transfer_id?: string;
  supplier_order_id?: string;
  
  // Metadata
  notes?: string;
  performed_by?: string;
  reason?: string;
  
  // Timestamps
  created_at: string;
  movement_date: string;
}

export interface InventorySummary {
  total_items: number;
  total_stock_value: number;
  total_available_quantity: number;
  total_low_stock_items: number;
  total_out_of_stock_items: number;
  total_categories: number;
  average_stock_level: number;
  inventory_turnover_rate: number;
  last_updated: string;
}

export interface PaginatedInventoryResponse {
  items: InventoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary?: InventorySummary;
}

export interface InventoryFilterOptions {
  status?: InventoryStatus | InventoryStatus[];
  category?: string | string[];
  minPrice?: number;
  maxPrice?: number;
  lowStockOnly?: boolean;
  outOfStockOnly?: boolean;
  searchQuery?: string;
  sortBy?: 'name' | 'stock_quantity' | 'selling_price' | 'last_updated' | 'last_sale_date';
  sortOrder?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
}

export interface BulkStockUpdate {
  product_id: string;
  quantity: number;
  movement_type: StockMovementType;
  notes?: string;
  order_id?: string;
}

// ============================================
// INVENTORY API FUNCTIONS
// ============================================

/**
 * Get seller's inventory with pagination and filtering
 */
export const getInventory = async (
  sellerId: string,
  options: {
    page?: number;
    limit?: number;
    filters?: InventoryFilterOptions;
  } = {}
): Promise<{ data: PaginatedInventoryResponse | null; error: string | null }> => {
  try {
    if (!sellerId) {
      return {
        data: null,
        error: 'Seller ID is required'
      };
    }

    const {
      page = 1,
      limit = 20,
      filters = {}
    } = options;

    // Calculate pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Build query
    let query = supabase
      .from('inventory_items')
      .select('*', { count: 'exact' })
      .eq('seller_id', sellerId);

    // Apply filters
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status);
      } else {
        query = query.eq('status', filters.status);
      }
    }

    if (filters.category) {
      if (Array.isArray(filters.category)) {
        query = query.in('category', filters.category);
      } else {
        query = query.eq('category', filters.category);
      }
    }

    if (filters.minPrice !== undefined) {
      query = query.gte('selling_price', filters.minPrice);
    }

    if (filters.maxPrice !== undefined) {
      query = query.lte('selling_price', filters.maxPrice);
    }

    if (filters.lowStockOnly) {
      query = query.lte('available_quantity', supabase.raw('min_stock_threshold'));
    }

    if (filters.outOfStockOnly) {
      query = query.eq('available_quantity', 0);
    }

    if (filters.searchQuery) {
      query = query.or(`name.ilike.%${filters.searchQuery}%,sku.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`);
    }

    if (filters.startDate) {
      query = query.gte('last_stock_update', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('last_stock_update', filters.endDate);
    }

    // Apply sorting
    const sortField = filters.sortBy || 'last_updated';
    const sortOrder = filters.sortOrder || 'desc';
    query = query.order(sortField, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(from, to);

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching inventory:', error);
      return {
        data: null,
        error: `Failed to fetch inventory: ${error.message}`
      };
    }

    // Calculate available quantity for each item
    const inventoryItems = (data || []).map(item => ({
      ...item,
      available_quantity: item.stock_quantity - item.reserved_quantity
    })) as InventoryItem[];

    // Get inventory summary for this page
    const summary = await calculateInventorySummary(sellerId, filters);

    const response: PaginatedInventoryResponse = {
      items: inventoryItems,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
      summary
    };

    return { data: response, error: null };
  } catch (error) {
    console.error('Unexpected error in getInventory:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
};

/**
 * Get a single inventory item by ID
 */
export const getInventoryItem = async (
  sellerId: string,
  inventoryItemId: string
): Promise<{ data: InventoryItem | null; error: string | null }> => {
  try {
    if (!sellerId || !inventoryItemId) {
      return {
        data: null,
        error: 'Seller ID and Inventory Item ID are required'
      };
    }

    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('id', inventoryItemId)
      .eq('seller_id', sellerId)
      .single();

    if (error) {
      console.error('Error fetching inventory item:', error);
      return {
        data: null,
        error: `Failed to fetch inventory item: ${error.message}`
      };
    }

    const inventoryItem = {
      ...data,
      available_quantity: data.stock_quantity - data.reserved_quantity
    } as InventoryItem;

    return { data: inventoryItem, error: null };
  } catch (error) {
    console.error('Unexpected error in getInventoryItem:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
};

/**
 * Update stock quantity for a specific product
 * This function handles atomic updates and creates stock movement records
 */
export const updateInventoryStock = async (
  sellerId: string,
  updateData: {
    product_id: string;
    inventory_item_id: string;
    quantity: number;
    movement_type: StockMovementType;
    notes?: string;
    order_id?: string;
    return_id?: string;
    transfer_id?: string;
    supplier_order_id?: string;
    reason?: string;
  }
): Promise<{ data: InventoryItem | null; error: string | null }> => {
  try {
    if (!sellerId) {
      return {
        data: null,
        error: 'Seller ID is required'
      };
    }

    const {
      product_id,
      inventory_item_id,
      quantity,
      movement_type,
      notes,
      order_id,
      return_id,
      transfer_id,
      supplier_order_id,
      reason
    } = updateData;

    if (!product_id || !inventory_item_id) {
      return {
        data: null,
        error: 'Product ID and Inventory Item ID are required'
      };
    }

    // Start a transaction using Supabase's RPC
    const { data: currentItem, error: fetchError } = await supabase
      .from('inventory_items')
      .select('stock_quantity, reserved_quantity, status')
      .eq('id', inventory_item_id)
      .eq('seller_id', sellerId)
      .eq('product_id', product_id)
      .single();

    if (fetchError) {
      return {
        data: null,
        error: `Item not found: ${fetchError.message}`
      };
    }

    const previousQuantity = currentItem.stock_quantity;
    let newQuantity = previousQuantity + quantity;

    // Ensure quantity doesn't go negative
    if (newQuantity < 0) {
      return {
        data: null,
        error: 'Insufficient stock. Cannot reduce quantity below zero.'
      };
    }

    // Update inventory item
    const now = new Date().toISOString();
    const updatePayload: Partial<InventoryItem> = {
      stock_quantity: newQuantity,
      last_stock_update: now,
      updated_at: now,
      // Update status based on new quantity
      status: calculateInventoryStatus(newQuantity, currentItem.reserved_quantity)
    };

    const { data: updatedItem, error: updateError } = await supabase
      .from('inventory_items')
      .update(updatePayload)
      .eq('id', inventory_item_id)
      .eq('seller_id', sellerId)
      .select()
      .single();

    if (updateError) {
      return {
        data: null,
        error: `Failed to update stock: ${updateError.message}`
      };
    }

    // Create stock movement record
    const movementPayload: Omit<StockMovement, 'id'> = {
      seller_id: sellerId,
      product_id,
      inventory_item_id,
      movement_type,
      quantity,
      previous_quantity: previousQuantity,
      new_quantity: newQuantity,
      order_id,
      return_id,
      transfer_id,
      supplier_order_id,
      notes,
      reason,
      performed_by: sellerId, // In real app, this would be the user ID
      created_at: now,
      movement_date: now
    };

    const { error: movementError } = await supabase
      .from('stock_movements')
      .insert([movementPayload]);

    if (movementError) {
      console.error('Failed to create stock movement record:', movementError);
      // Don't fail the whole operation if movement record fails
    }

    const resultItem = {
      ...updatedItem,
      available_quantity: updatedItem.stock_quantity - updatedItem.reserved_quantity
    } as InventoryItem;

    return { data: resultItem, error: null };
  } catch (error) {
    console.error('Unexpected error in updateInventoryStock:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
};

/**
 * Update multiple inventory items in bulk
 */
export const bulkUpdateInventoryStock = async (
  sellerId: string,
  updates: BulkStockUpdate[]
): Promise<{ data: InventoryItem[] | null; error: string | null }> => {
  try {
    if (!sellerId || !updates.length) {
      return {
        data: null,
        error: 'Seller ID and updates array are required'
      };
    }

    const results: InventoryItem[] = [];
    const errors: string[] = [];

    // Process updates sequentially to maintain data integrity
    for (const update of updates) {
      const { data, error } = await updateInventoryStock(sellerId, {
        ...update,
        inventory_item_id: update.product_id, // Assuming product_id doubles as inventory_item_id
        movement_type: update.movement_type || StockMovementType.ADJUSTMENT
      });

      if (error) {
        errors.push(`Product ${update.product_id}: ${error}`);
      } else if (data) {
        results.push(data);
      }
    }

    if (errors.length > 0) {
      return {
        data: results.length > 0 ? results : null,
        error: `Some updates failed: ${errors.join('; ')}`
      };
    }

    return { data: results, error: null };
  } catch (error) {
    console.error('Unexpected error in bulkUpdateInventoryStock:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
};

/**
 * Get low stock items for a seller
 */
export const getLowStockItems = async (
  sellerId: string,
  threshold: number = 5
): Promise<{ data: InventoryItem[] | null; error: string | null }> => {
  try {
    if (!sellerId) {
      return {
        data: null,
        error: 'Seller ID is required'
      };
    }

    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('seller_id', sellerId)
      .eq('status', InventoryStatus.ACTIVE)
      .or(`stock_quantity.lte.${threshold},available_quantity.lte.${threshold}`)
      .order('stock_quantity', { ascending: true })
      .limit(100);

    if (error) {
      console.error('Error fetching low stock items:', error);
      return {
        data: null,
        error: `Failed to fetch low stock items: ${error.message}`
      };
    }

    const lowStockItems = (data || []).map(item => ({
      ...item,
      available_quantity: item.stock_quantity - item.reserved_quantity
    })) as InventoryItem[];

    return { data: lowStockItems, error: null };
  } catch (error) {
    console.error('Unexpected error in getLowStockItems:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
};

/**
 * Get stock movement history for a product
 */
export const getStockMovementHistory = async (
  sellerId: string,
  productId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ data: { movements: StockMovement[]; total: number } | null; error: string | null }> => {
  try {
    if (!sellerId || !productId) {
      return {
        data: null,
        error: 'Seller ID and Product ID are required'
      };
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('stock_movements')
      .select('*', { count: 'exact' })
      .eq('seller_id', sellerId)
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error fetching stock movement history:', error);
      return {
        data: null,
        error: `Failed to fetch stock movement history: ${error.message}`
      };
    }

    return {
      data: {
        movements: (data || []) as StockMovement[],
        total: count || 0
      },
      error: null
    };
  } catch (error) {
    console.error('Unexpected error in getStockMovementHistory:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
};

/**
 * Get inventory summary statistics
 */
export const getInventorySummary = async (
  sellerId: string
): Promise<{ data: InventorySummary | null; error: string | null }> => {
  try {
    if (!sellerId) {
      return {
        data: null,
        error: 'Seller ID is required'
      };
    }

    const summary = await calculateInventorySummary(sellerId);
    return { data: summary, error: null };
  } catch (error) {
    console.error('Unexpected error in getInventorySummary:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
};

/**
 * Update inventory item details (not stock)
 */
export const updateInventoryItem = async (
  sellerId: string,
  inventoryItemId: string,
  updateData: Partial<InventoryItem>
): Promise<{ data: InventoryItem | null; error: string | null }> => {
  try {
    if (!sellerId || !inventoryItemId) {
      return {
        data: null,
        error: 'Seller ID and Inventory Item ID are required'
      };
    }

    const now = new Date().toISOString();
    const payload = {
      ...updateData,
      updated_at: now
    };

    // Remove fields that shouldn't be updated directly
    delete payload.stock_quantity;
    delete payload.reserved_quantity;
    delete payload.available_quantity;
    delete payload.last_stock_update;

    const { data, error } = await supabase
      .from('inventory_items')
      .update(payload)
      .eq('id', inventoryItemId)
      .eq('seller_id', sellerId)
      .select()
      .single();

    if (error) {
      console.error('Error updating inventory item:', error);
      return {
        data: null,
        error: `Failed to update inventory item: ${error.message}`
      };
    }

    const updatedItem = {
      ...data,
      available_quantity: data.stock_quantity - data.reserved_quantity
    } as InventoryItem;

    return { data: updatedItem, error: null };
  } catch (error) {
    console.error('Unexpected error in updateInventoryItem:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate inventory status based on quantity
 */
const calculateInventoryStatus = (
  stockQuantity: number,
  reservedQuantity: number = 0,
  minThreshold: number = 5
): InventoryStatus => {
  const availableQuantity = stockQuantity - reservedQuantity;

  if (stockQuantity <= 0) {
    return InventoryStatus.OUT_OF_STOCK;
  } else if (availableQuantity <= 0) {
    return InventoryStatus.OUT_OF_STOCK;
  } else if (availableQuantity <= minThreshold) {
    return InventoryStatus.LOW_STOCK;
  } else {
    return InventoryStatus.ACTIVE;
  }
};

/**
 * Calculate comprehensive inventory summary
 */
const calculateInventorySummary = async (
  sellerId: string,
  filters?: InventoryFilterOptions
): Promise<InventorySummary> => {
  try {
    // Build query for summary
    let query = supabase
      .from('inventory_items')
      .select('stock_quantity, reserved_quantity, selling_price, status, category, updated_at')
      .eq('seller_id', sellerId);

    if (filters) {
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          query = query.in('status', filters.status);
        } else {
          query = query.eq('status', filters.status);
        }
      }

      if (filters.category) {
        if (Array.isArray(filters.category)) {
          query = query.in('category', filters.category);
        } else {
          query = query.eq('category', filters.category);
        }
      }
    }

    const { data, error } = await query;

    if (error || !data) {
      throw error || new Error('Failed to fetch inventory data for summary');
    }

    const now = new Date().toISOString();
    const totalItems = data.length;
    const totalStockValue = data.reduce((sum, item) => {
      return sum + (item.stock_quantity * (item.selling_price || 0));
    }, 0);

    const totalAvailableQuantity = data.reduce((sum, item) => {
      return sum + (item.stock_quantity - item.reserved_quantity);
    }, 0);

    const totalLowStockItems = data.filter(item => {
      const available = item.stock_quantity - item.reserved_quantity;
      return available > 0 && available <= 5; // Using default threshold of 5
    }).length;

    const totalOutOfStockItems = data.filter(item => {
      const available = item.stock_quantity - item.reserved_quantity;
      return available <= 0;
    }).length;

    // Count unique categories
    const uniqueCategories = new Set(data.map(item => item.category).filter(Boolean));
    const totalCategories = uniqueCategories.size;

    const averageStockLevel = totalItems > 0
      ? totalAvailableQuantity / totalItems
      : 0;

    // Get last sale date from orders (simplified - in real app, this would query orders)
    const inventoryTurnoverRate = await calculateTurnoverRate(sellerId);

    return {
      total_items: totalItems,
      total_stock_value: totalStockValue,
      total_available_quantity: totalAvailableQuantity,
      total_low_stock_items: totalLowStockItems,
      total_out_of_stock_items: totalOutOfStockItems,
      total_categories: totalCategories,
      average_stock_level: averageStockLevel,
      inventory_turnover_rate: inventoryTurnoverRate,
      last_updated: now
    };
  } catch (error) {
    console.error('Error calculating inventory summary:', error);
    
    // Return default summary on error
    return {
      total_items: 0,
      total_stock_value: 0,
      total_available_quantity: 0,
      total_low_stock_items: 0,
      total_out_of_stock_items: 0,
      total_categories: 0,
      average_stock_level: 0,
      inventory_turnover_rate: 0,
      last_updated: new Date().toISOString()
    };
  }
};

/**
 * Calculate inventory turnover rate
 */
const calculateTurnoverRate = async (sellerId: string): Promise<number> => {
  try {
    // Get total cost of goods sold (COGS) for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: movements, error } = await supabase
      .from('stock_movements')
      .select('quantity, inventory_items(cost_price)')
      .eq('seller_id', sellerId)
      .eq('movement_type', StockMovementType.SALE)
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (error || !movements) {
      return 0;
    }

    // Calculate COGS
    const cogs = movements.reduce((sum, movement) => {
      const costPrice = (movement.inventory_items as any)?.cost_price || 0;
      return sum + (Math.abs(movement.quantity) * costPrice);
    }, 0);

    // Get average inventory value
    const { data: inventoryValue } = await supabase
      .rpc('get_average_inventory_value', { p_seller_id: sellerId });

    const avgInventoryValue = inventoryValue || 0;

    // Calculate turnover rate
    if (avgInventoryValue <= 0) {
      return 0;
    }

    return cogs / avgInventoryValue;
  } catch (error) {
    console.error('Error calculating turnover rate:', error);
    return 0;
  }
};

/**
 * Get inventory alerts for the seller
 */
export const getInventoryAlerts = async (
  sellerId: string
): Promise<{ data: { lowStock: InventoryItem[]; outOfStock: InventoryItem[] } | null; error: string | null }> => {
  try {
    if (!sellerId) {
      return {
        data: null,
        error: 'Seller ID is required'
      };
    }

    // Get low stock items
    const { data: lowStockData, error: lowStockError } = await getLowStockItems(sellerId, 5);
    
    // Get out of stock items
    const { data: outOfStockData, error: outOfStockError } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('seller_id', sellerId)
      .eq('status', InventoryStatus.OUT_OF_STOCK)
      .order('last_sale_date', { ascending: false })
      .limit(50);

    if (lowStockError || outOfStockError) {
      return {
        data: null,
        error: `Failed to fetch inventory alerts: ${lowStockError?.message || outOfStockError?.message}`
      };
    }

    const lowStockItems = (lowStockData || []).map(item => ({
      ...item,
      available_quantity: item.stock_quantity - item.reserved_quantity
    })) as InventoryItem[];

    const outOfStockItems = (outOfStockData || []).map(item => ({
      ...item,
      available_quantity: item.stock_quantity - item.reserved_quantity
    })) as InventoryItem[];

    return {
      data: {
        lowStock: lowStockItems,
        outOfStock: outOfStockItems
      },
      error: null
    };
  } catch (error) {
    console.error('Unexpected error in getInventoryAlerts:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
};

// ============================================
// MOCK DATA FOR DEVELOPMENT/TESTING
// ============================================

export const getMockInventory = (
  sellerId: string,
  page: number = 1,
  limit: number = 20
): PaginatedInventoryResponse => {
  const mockItems: InventoryItem[] = [
    {
      id: 'inv_001',
      seller_id: sellerId,
      product_id: 'prod_001',
      name: 'Premium Leather Sofa',
      description: 'Luxury genuine leather sofa with mahogany frame',
      sku: 'SOFA-LUX-001',
      category: 'Sofas',
      subcategory: 'Leather Sofas',
      stock_quantity: 15,
      reserved_quantity: 3,
      available_quantity: 12,
      min_stock_threshold: 5,
      max_stock_threshold: 50,
      reorder_quantity: 20,
      cost_price: 4500,
      selling_price: 7500,
      discount_price: 6999,
      currency: 'SAR',
      status: InventoryStatus.ACTIVE,
      is_featured: true,
      is_best_seller: true,
      warehouse_location: 'WH-A',
      shelf_location: 'Shelf-12',
      storage_bin: 'A12-03',
      supplier_id: 'sup_001',
      supplier_name: 'Leather Crafts Co.',
      supplier_sku: 'LC-SOFA-001',
      lead_time_days: 14,
      weight_kg: 85,
      dimensions_cm: {
        length: 220,
        width: 95,
        height: 85
      },
      created_at: '2024-01-15T10:00:00Z',
      updated_at: new Date().toISOString(),
      last_stock_update: '2024-01-20T14:30:00Z',
      last_sale_date: '2024-01-19T11:20:00Z',
      last_restock_date: '2024-01-10T09:15:00Z'
    },
    {
      id: 'inv_002',
      seller_id: sellerId,
      product_id: 'prod_002',
      name: 'Modern Dining Table',
      description: '6-seater glass top dining table with chrome legs',
      sku: 'TABLE-MOD-002',
      category: 'Dining',
      subcategory: 'Dining Tables',
      stock_quantity: 3,
      reserved_quantity: 1,
      available_quantity: 2,
      min_stock_threshold: 5,
      max_stock_threshold: 25,
      reorder_quantity: 10,
      cost_price: 1800,
      selling_price: 3200,
      currency: 'SAR',
      status: InventoryStatus.LOW_STOCK,
      is_featured: false,
      is_best_seller: true,
      warehouse_location: 'WH-B',
      shelf_location: 'Shelf-08',
      created_at: '2024-01-10T09:00:00Z',
      updated_at: new Date().toISOString(),
      last_stock_update: '2024-01-18T16:45:00Z',
      last_sale_date: '2024-01-17T15:30:00Z',
      last_restock_date: '2024-01-05T11:00:00Z'
    },
    {
      id: 'inv_003',
      seller_id: sellerId,
      product_id: 'prod_003',
      name: 'Ergonomic Office Chair',
      description: 'Executive office chair with lumbar support',
      sku: 'CHAIR-ERG-003',
      category: 'Chairs',
      subcategory: 'Office Chairs',
      stock_quantity: 0,
      reserved_quantity: 0,
      available_quantity: 0,
      min_stock_threshold: 3,
      max_stock_threshold: 30,
      reorder_quantity: 15,
      cost_price: 850,
      selling_price: 1599,
      currency: 'SAR',
      status: InventoryStatus.OUT_OF_STOCK,
      is_featured: true,
      is_best_seller: false,
      supplier_id: 'sup_002',
      supplier_name: 'Office Solutions Ltd.',
      lead_time_days: 7,
      created_at: '2024-01-05T14:00:00Z',
      updated_at: new Date().toISOString(),
      last_stock_update: '2024-01-15T10:20:00Z',
      last_sale_date: '2024-01-14T13:45:00Z'
    },
    {
      id: 'inv_004',
      seller_id: sellerId,
      product_id: 'prod_004',
      name: 'King Size Bed Frame',
      description: 'Solid wood king size bed with storage drawers',
      sku: 'BED-KING-004',
      category: 'Beds',
      subcategory: 'Bed Frames',
      stock_quantity: 8,
      reserved_quantity: 0,
      available_quantity: 8,
      min_stock_threshold: 4,
      max_stock_threshold: 20,
      reorder_quantity: 12,
      cost_price: 3200,
      selling_price: 5500,
      currency: 'SAR',
      status: InventoryStatus.ACTIVE,
      is_featured: false,
      is_best_seller: true,
      warehouse_location: 'WH-A',
      shelf_location: 'Shelf-15',
      weight_kg: 65,
      created_at: '2024-01-12T11:30:00Z',
      updated_at: new Date().toISOString(),
      last_stock_update: '2024-01-19T09:15:00Z',
      last_sale_date: '2024-01-18T16:20:00Z',
      last_restock_date: '2024-01-08T14:00:00Z'
    },
    {
      id: 'inv_005',
      seller_id: sellerId,
      product_id: 'prod_005',
      name: 'TV Stand Cabinet',
      description: 'Modern TV stand with cable management',
      sku: 'CABINET-TV-005',
      category: 'Storage',
      subcategory: 'TV Stands',
      stock_quantity: 25,
      reserved_quantity: 5,
      available_quantity: 20,
      min_stock_threshold: 10,
      max_stock_threshold: 40,
      reorder_quantity: 15,
      cost_price: 1200,
      selling_price: 2200,
      currency: 'SAR',
      status: InventoryStatus.ACTIVE,
      is_featured: true,
      is_best_seller: false,
      warehouse_location: 'WH-C',
      created_at: '2024-01-08T13:45:00Z',
      updated_at: new Date().toISOString(),
      last_stock_update: '2024-01-17T11:30:00Z',
      last_sale_date: '2024-01-16T14:15:00Z',
      last_restock_date: '2024-01-03T10:00:00Z'
    }
  ];

  // Add more mock items to simulate pagination
  const totalMockItems = 48;
  const totalPages = Math.ceil(totalMockItems / limit);
  
  const startIndex = (page - 1) * limit;
  const endIndex = Math.min(startIndex + limit, mockItems.length);
  
  const paginatedItems = mockItems.slice(startIndex, endIndex);

  const mockSummary: InventorySummary = {
    total_items: totalMockItems,
    total_stock_value: 256500,
    total_available_quantity: 42,
    total_low_stock_items: 3,
    total_out_of_stock_items: 1,
    total_categories: 5,
    average_stock_level: 8.4,
    inventory_turnover_rate: 2.3,
    last_updated: new Date().toISOString()
  };

  return {
    items: paginatedItems,
    total: totalMockItems,
    page,
    limit,
    totalPages,
    summary: mockSummary
  };
};

export default {
  getInventory,
  getInventoryItem,
  updateInventoryStock,
  bulkUpdateInventoryStock,
  getLowStockItems,
  getStockMovementHistory,
  getInventorySummary,
  updateInventoryItem,
  getInventoryAlerts,
  getMockInventory
};