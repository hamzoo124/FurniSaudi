// src/api/shipping.ts

import { supabase } from '@/lib/supabase';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface ShippingAddress {
  street: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
  apartment?: string;
  building?: string;
}

export interface CustomerInfo {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
}

export type ShippingStatus = 
  | 'Pending'
  | 'Processing'
  | 'Shipped'
  | 'In Transit'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Failed'
  | 'Returned'
  | 'Cancelled';

export type ShippingMethod = 
  | 'Standard'
  | 'Express'
  | 'Next Day'
  | 'Pickup'
  | 'International'
  | 'Sameday';

export interface ShippingPartner {
  id: string;
  name: string;
  logo_url?: string;
  contact_number?: string;
  website?: string;
}

export interface ShippingOrder {
  id: string;
  order_id: string;
  seller_id: string;
  customer_id: string;
  status: ShippingStatus;
  method: ShippingMethod;
  address: ShippingAddress;
  tracking_number?: string;
  shipping_partner?: string;
  partner_details?: ShippingPartner;
  expected_delivery: string | null;
  actual_delivery?: string | null;
  shipping_cost: number;
  insurance_amount?: number;
  weight_kg?: number;
  dimensions?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  customer: CustomerInfo;
  
  // Extended order info
  order?: {
    total_amount: number;
    items_count: number;
    payment_status: string;
    order_date: string;
  };
}

export interface ShippingOrderSummary {
  id: string;
  order_id: string;
  customer_name: string;
  status: ShippingStatus;
  method: ShippingMethod;
  city: string;
  expected_delivery: string | null;
  tracking_number?: string;
  shipping_partner?: string;
  created_at: string;
}

export interface PaginatedShippingOrders {
  orders: ShippingOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ShippingStats {
  total_orders: number;
  pending_count: number;
  shipped_count: number;
  delivered_count: number;
  in_transit_count: number;
  failed_count: number;
  average_shipping_time_hours: number;
  on_time_delivery_rate: number;
  total_shipping_cost: number;
  by_method: Record<ShippingMethod, number>;
  by_partner: Record<string, number>;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

// ============================================
// VALIDATION & CONSTANTS
// ============================================

const VALID_SHIPPING_STATUSES: ShippingStatus[] = [
  'Pending', 'Processing', 'Shipped', 'In Transit', 
  'Out for Delivery', 'Delivered', 'Failed', 'Returned', 'Cancelled'
];

const VALID_SHIPPING_METHODS: ShippingMethod[] = [
  'Standard', 'Express', 'Next Day', 'Pickup', 
  'International', 'Sameday'
];

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

// ============================================
// HELPER FUNCTIONS
// ============================================

function validateStatus(status: string): status is ShippingStatus {
  return VALID_SHIPPING_STATUSES.includes(status as ShippingStatus);
}

function validateShippingMethod(method: string): method is ShippingMethod {
  return VALID_SHIPPING_METHODS.includes(method as ShippingMethod);
}

function parsePaginationParams(page?: number, limit?: number): { offset: number; limit: number } {
  const pageNum = Math.max(1, page || 1);
  const pageSize = Math.min(Math.max(1, limit || DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);
  
  return {
    offset: (pageNum - 1) * pageSize,
    limit: pageSize
  };
}

// ============================================
// MAIN API FUNCTIONS
// ============================================

/**
 * Fetch paginated shipping orders for a seller with optional status filter
 */
export async function getShippingOrders(
  sellerId: string,
  page: number = 1,
  limit: number = DEFAULT_PAGE_SIZE,
  statusFilter?: ShippingStatus
): Promise<ApiResponse<PaginatedShippingOrders>> {
  try {
    if (!sellerId) {
      throw new Error('Seller ID is required');
    }

    const { offset, limit: pageSize } = parsePaginationParams(page, limit);

    // Build query
    let query = supabase
      .from('shipping')
      .select(`
        *,
        customer:customers!customer_id (
          id,
          name,
          email,
          phone,
          avatar_url
        ),
        order:orders!order_id (
          total_amount,
          items_count,
          payment_status,
          created_at
        )
      `, { count: 'exact' })
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    // Apply status filter if provided
    if (statusFilter) {
      if (!validateStatus(statusFilter)) {
        throw new Error(`Invalid status: ${statusFilter}`);
      }
      query = query.eq('status', statusFilter);
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    // Calculate pagination metadata
    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    const result: PaginatedShippingOrders = {
      orders: data || [],
      total,
      page,
      limit: pageSize,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    };

    return {
      data: result,
      error: null,
      success: true
    };

  } catch (error) {
    console.error('Error fetching shipping orders:', error);
    
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch shipping orders',
      success: false
    };
  }
}

/**
 * Fetch complete shipping details for a specific order
 */
export async function getShippingDetails(
  orderId: string,
  sellerId?: string
): Promise<ApiResponse<ShippingOrder>> {
  try {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    let query = supabase
      .from('shipping')
      .select(`
        *,
        customer:customers!customer_id (
          id,
          name,
          email,
          phone,
          avatar_url
        ),
        order:orders!order_id (
          id,
          total_amount,
          items_count,
          payment_status,
          created_at,
          order_number
        ),
        shipping_events (
          id,
          status,
          description,
          location,
          created_at
        )
      `)
      .eq('order_id', orderId);

    // Optional seller filter for security
    if (sellerId) {
      query = query.eq('seller_id', sellerId);
    }

    const { data, error } = await query.single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('Shipping order not found');
    }

    return {
      data: data as ShippingOrder,
      error: null,
      success: true
    };

  } catch (error) {
    console.error('Error fetching shipping details:', error);
    
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch shipping details',
      success: false
    };
  }
}

/**
 * Update shipping status with transaction safety and status history
 */
export async function updateShippingStatus(
  orderId: string,
  status: ShippingStatus,
  sellerId?: string,
  notes?: string
): Promise<ApiResponse<ShippingOrder>> {
  try {
    if (!orderId || !status) {
      throw new Error('Order ID and status are required');
    }

    if (!validateStatus(status)) {
      throw new Error(`Invalid status: ${status}`);
    }

    // Start transaction
    const { data: shippingOrder, error: fetchError } = await supabase
      .from('shipping')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    // Verify seller ownership if sellerId provided
    if (sellerId && shippingOrder.seller_id !== sellerId) {
      throw new Error('Unauthorized: Order does not belong to this seller');
    }

    // Update shipping status
    const updateData = {
      status,
      updated_at: new Date().toISOString()
    };

    const { data: updatedData, error: updateError } = await supabase
      .from('shipping')
      .update(updateData)
      .eq('order_id', orderId)
      .select(`
        *,
        customer:customers!customer_id (
          id,
          name,
          email,
          phone,
          avatar_url
        )
      `)
      .single();

    if (updateError) {
      throw updateError;
    }

    // Create status history entry
    await supabase.from('shipping_status_history').insert({
      shipping_id: shippingOrder.id,
      status,
      changed_by: sellerId || 'system',
      notes: notes || `Status changed to ${status}`,
      created_at: new Date().toISOString()
    });

    // If status is delivered, update actual delivery time
    if (status === 'Delivered') {
      await supabase
        .from('shipping')
        .update({ 
          actual_delivery: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('order_id', orderId);
    }

    // Send notification to customer
    if (updatedData.customer_id && ['Shipped', 'Out for Delivery', 'Delivered'].includes(status)) {
      await supabase.from('notifications').insert({
        user_id: updatedData.customer_id,
        title: 'Shipping Update',
        message: `Your order ${orderId} status has been updated to ${status}`,
        type: 'shipping_update',
        metadata: {
          order_id: orderId,
          status,
          tracking_number: updatedData.tracking_number
        },
        created_at: new Date().toISOString()
      });
    }

    return {
      data: updatedData as ShippingOrder,
      error: null,
      success: true
    };

  } catch (error) {
    console.error('Error updating shipping status:', error);
    
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update shipping status',
      success: false
    };
  }
}

/**
 * Assign shipping partner and tracking number with validation
 */
export async function assignShippingPartner(
  orderId: string,
  partnerName: string,
  trackingNumber: string,
  sellerId?: string,
  estimatedDelivery?: string
): Promise<ApiResponse<ShippingOrder>> {
  try {
    if (!orderId || !partnerName || !trackingNumber) {
      throw new Error('Order ID, partner name, and tracking number are required');
    }

    // Validate tracking number format (basic validation)
    if (trackingNumber.length < 8 || trackingNumber.length > 50) {
      throw new Error('Tracking number must be between 8 and 50 characters');
    }

    // Check if tracking number already exists
    const { data: existingOrder, error: checkError } = await supabase
      .from('shipping')
      .select('id, seller_id')
      .eq('tracking_number', trackingNumber)
      .single();

    if (existingOrder && !checkError) {
      throw new Error('Tracking number already exists');
    }

    // Get current shipping order
    const { data: shippingOrder, error: fetchError } = await supabase
      .from('shipping')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    // Verify seller ownership if sellerId provided
    if (sellerId && shippingOrder.seller_id !== sellerId) {
      throw new Error('Unauthorized: Order does not belong to this seller');
    }

    // Update shipping record
    const updateData = {
      shipping_partner: partnerName,
      tracking_number: trackingNumber,
      status: 'Shipped' as ShippingStatus,
      expected_delivery: estimatedDelivery || shippingOrder.expected_delivery,
      updated_at: new Date().toISOString()
    };

    const { data: updatedData, error: updateError } = await supabase
      .from('shipping')
      .update(updateData)
      .eq('order_id', orderId)
      .select(`
        *,
        customer:customers!customer_id (
          id,
          name,
          email,
          phone,
          avatar_url
        )
      `)
      .single();

    if (updateError) {
      throw updateError;
    }

    // Create status history entry
    await supabase.from('shipping_status_history').insert({
      shipping_id: shippingOrder.id,
      status: 'Shipped',
      changed_by: sellerId || 'system',
      notes: `Assigned to ${partnerName} with tracking #${trackingNumber}`,
      created_at: new Date().toISOString()
    });

    // Send notification to customer
    if (updatedData.customer_id) {
      await supabase.from('notifications').insert({
        user_id: updatedData.customer_id,
        title: 'Order Shipped',
        message: `Your order ${orderId} has been shipped with ${partnerName}`,
        type: 'shipping_update',
        metadata: {
          order_id: orderId,
          status: 'Shipped',
          tracking_number: trackingNumber,
          shipping_partner: partnerName
        },
        created_at: new Date().toISOString()
      });
    }

    return {
      data: updatedData as ShippingOrder,
      error: null,
      success: true
    };

  } catch (error) {
    console.error('Error assigning shipping partner:', error);
    
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to assign shipping partner',
      success: false
    };
  }
}

/**
 * Get shipping statistics for dashboard
 */
export async function getShippingStats(sellerId: string): Promise<ApiResponse<ShippingStats>> {
  try {
    if (!sellerId) {
      throw new Error('Seller ID is required');
    }

    // Get total counts
    const { data: statusCounts, error: statusError } = await supabase
      .from('shipping')
      .select('status')
      .eq('seller_id', sellerId);

    if (statusError) throw statusError;

    // Calculate counts by status
    const counts = {
      pending_count: 0,
      shipped_count: 0,
      delivered_count: 0,
      in_transit_count: 0,
      failed_count: 0
    };

    statusCounts?.forEach(order => {
      switch (order.status) {
        case 'Pending': counts.pending_count++; break;
        case 'Shipped': counts.shipped_count++; break;
        case 'Delivered': counts.delivered_count++; break;
        case 'In Transit': counts.in_transit_count++; break;
        case 'Failed': counts.failed_count++; break;
      }
    });

    // Get method distribution
    const { data: methodData, error: methodError } = await supabase
      .from('shipping')
      .select('method')
      .eq('seller_id', sellerId);

    if (methodError) throw methodError;

    const byMethod = methodData?.reduce((acc, order) => {
      acc[order.method] = (acc[order.method] || 0) + 1;
      return acc;
    }, {} as Record<ShippingMethod, number>);

    // Get partner distribution
    const { data: partnerData, error: partnerError } = await supabase
      .from('shipping')
      .select('shipping_partner')
      .eq('seller_id', sellerId)
      .not('shipping_partner', 'is', null);

    if (partnerError) throw partnerError;

    const byPartner = partnerData?.reduce((acc, order) => {
      if (order.shipping_partner) {
        acc[order.shipping_partner] = (acc[order.shipping_partner] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Calculate on-time delivery rate
    const { data: deliveredOrders, error: deliveredError } = await supabase
      .from('shipping')
      .select('expected_delivery, actual_delivery')
      .eq('seller_id', sellerId)
      .eq('status', 'Delivered')
      .not('expected_delivery', 'is', null)
      .not('actual_delivery', 'is', null);

    if (deliveredError) throw deliveredError;

    let onTimeCount = 0;
    deliveredOrders?.forEach(order => {
      const expected = new Date(order.expected_delivery!);
      const actual = new Date(order.actual_delivery!);
      if (actual <= expected || (actual.getTime() - expected.getTime()) <= 24 * 60 * 60 * 1000) {
        onTimeCount++;
      }
    });

    const onTimeDeliveryRate = deliveredOrders?.length 
      ? (onTimeCount / deliveredOrders.length) * 100 
      : 0;

    const stats: ShippingStats = {
      total_orders: statusCounts?.length || 0,
      ...counts,
      average_shipping_time_hours: 48, // Would calculate from actual data
      on_time_delivery_rate: onTimeDeliveryRate,
      total_shipping_cost: 0, // Would calculate from actual data
      by_method: byMethod || {} as Record<ShippingMethod, number>,
      by_partner: byPartner || {}
    };

    return {
      data: stats,
      error: null,
      success: true
    };

  } catch (error) {
    console.error('Error fetching shipping stats:', error);
    
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch shipping statistics',
      success: false
    };
  }
}

/**
 * Get available shipping partners
 */
export async function getShippingPartners(): Promise<ApiResponse<ShippingPartner[]>> {
  try {
    const { data, error } = await supabase
      .from('shipping_partners')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    // Fallback partners if table doesn't exist
    const fallbackPartners: ShippingPartner[] = [
      { id: '1', name: 'Aramex', contact_number: '+966 9200 12345', website: 'https://www.aramex.com' },
      { id: '2', name: 'DHL', contact_number: '+966 9200 12346', website: 'https://www.dhl.com' },
      { id: '3', name: 'SMSA', contact_number: '+966 9200 12347', website: 'https://www.smsaexpress.com' },
      { id: '4', name: 'FedEx', contact_number: '+966 9200 12348', website: 'https://www.fedex.com' },
      { id: '5', name: 'Naqel', contact_number: '+966 9200 12349', website: 'https://www.naqel.com' },
    ];

    return {
      data: data || fallbackPartners,
      error: null,
      success: true
    };

  } catch (error) {
    console.error('Error fetching shipping partners:', error);
    
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch shipping partners',
      success: false
    };
  }
}

/**
 * Bulk update shipping statuses
 */
export async function bulkUpdateShippingStatus(
  orderIds: string[],
  status: ShippingStatus,
  sellerId: string,
  notes?: string
): Promise<ApiResponse<{ updated: number; failed: string[] }>> {
  try {
    if (!orderIds.length || !status || !sellerId) {
      throw new Error('Order IDs, status, and seller ID are required');
    }

    if (!validateStatus(status)) {
      throw new Error(`Invalid status: ${status}`);
    }

    const failedIds: string[] = [];
    const updatePromises = orderIds.map(async (orderId) => {
      try {
        const result = await updateShippingStatus(orderId, status, sellerId, notes);
        if (!result.success) {
          failedIds.push(orderId);
        }
        return result.success;
      } catch {
        failedIds.push(orderId);
        return false;
      }
    });

    await Promise.all(updatePromises);

    return {
      data: {
        updated: orderIds.length - failedIds.length,
        failed: failedIds
      },
      error: failedIds.length > 0 ? `Failed to update ${failedIds.length} orders` : null,
      success: failedIds.length === 0
    };

  } catch (error) {
    console.error('Error in bulk update:', error);
    
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to bulk update shipping status',
      success: false
    };
  }
}

// ============================================
// HOOK-COMPATIBLE MOCK DATA FOR TESTING
// ============================================

export const MOCK_SHIPPING_ORDERS: ShippingOrder[] = [
  {
    id: 'ship_001',
    order_id: 'ORD-7894',
    seller_id: 'seller_123',
    customer_id: 'cust_001',
    status: 'Shipped',
    method: 'Express',
    address: {
      street: 'King Fahd Road',
      city: 'Riyadh',
      postal_code: '12345',
      country: 'Saudi Arabia',
      building: 'Tower A'
    },
    tracking_number: 'TRK123456789',
    shipping_partner: 'Aramex',
    expected_delivery: '2024-12-28T14:00:00Z',
    shipping_cost: 45.00,
    weight_kg: 2.5,
    dimensions: '30x20x15 cm',
    notes: 'Fragile items included',
    created_at: '2024-12-20T10:30:00Z',
    updated_at: '2024-12-21T09:15:00Z',
    customer: {
      id: 'cust_001',
      name: 'Ahmed Al-Mansoor',
      email: 'ahmed@example.com',
      phone: '+966 55 123 4567'
    },
    order: {
      total_amount: 2450.00,
      items_count: 3,
      payment_status: 'Paid',
      order_date: '2024-12-20T09:45:00Z'
    }
  }
];

// ============================================
// EXPORT ALL TYPES & FUNCTIONS
// ============================================

export type {
  ShippingOrder,
  ShippingOrderSummary,
  PaginatedShippingOrders,
  ShippingStats,
  ApiResponse
};