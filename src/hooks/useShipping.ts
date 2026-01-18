// src/hooks/useShipping.ts
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface CustomerAddress {
  id: string;
  name: string;
  phone: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  landmark?: string;
  delivery_instructions?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrderSummary {
  id: string;
  total_items: number;
  total_amount: number;
  items_count: number;
  currency: string;
  payment_status: 'pending' | 'paid' | 'refunded' | 'failed';
  payment_method: string;
}

export interface ShippingPartner {
  id: string;
  name: string;
  code: string;
  tracking_url_template: string;
  contact_number: string;
  service_levels: string[];
  delivery_coverage: string[];
  is_active: boolean;
}

export interface ShippingOrder {
  id: string;
  order_id: string;
  seller_id: string;
  customer_id: string;
  
  // Shipping status lifecycle
  shipping_status: ShippingStatus;
  shipping_notes?: string;
  
  // Logistics partner
  shipping_partner_id?: string;
  shipping_partner_name?: string;
  tracking_number?: string;
  carrier_service?: string;
  
  // Financials
  shipping_cost: number;
  insurance_cost: number;
  total_shipping_cost: number;
  shipping_charged_to_customer: number;
  
  // Dimensions & weight
  package_weight_kg: number;
  package_dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'in';
  };
  
  // Delivery information
  estimated_delivery: string;
  shipped_at?: string;
  delivered_at?: string;
  delivery_proof_url?: string;
  
  // Pickup information
  pickup_scheduled_at?: string;
  pickup_completed_at?: string;
  
  // Return information
  return_reason?: string;
  return_initiated_at?: string;
  return_completed_at?: string;
  return_shipping_cost?: number;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Relations (joined from queries)
  customer?: CustomerAddress;
  order_summary?: OrderSummary;
  shipping_partner?: ShippingPartner;
}

export type ShippingStatus = 
  | 'pending'
  | 'packed'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'returned'
  | 'cancelled'
  | 'delayed'
  | 'failed';

export interface ShippingOrderFilters {
  status?: ShippingStatus;
  date_from?: string;
  date_to?: string;
  shipping_partner?: string;
  search?: string;
}

export interface ShippingUpdate {
  status: ShippingStatus;
  notes?: string;
  tracking_number?: string;
  shipped_at?: string;
  delivered_at?: string;
  delivery_proof_url?: string;
}

export interface AssignShippingPartnerParams {
  orderId: string;
  shippingPartnerId: string;
  trackingNumber: string;
  carrierService?: string;
  estimatedDelivery: string;
}

export interface PaginatedShippingOrders {
  data: ShippingOrder[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// ============================================
// CONSTANTS & UTILITIES
// ============================================

const SHIPPING_STATUS_FLOW: Record<ShippingStatus, ShippingStatus[]> = {
  pending: ['packed', 'cancelled'],
  packed: ['shipped', 'cancelled'],
  shipped: ['out_for_delivery', 'delivered', 'delayed'],
  out_for_delivery: ['delivered', 'failed'],
  delivered: ['returned'],
  returned: [],
  cancelled: [],
  delayed: ['out_for_delivery', 'delivered'],
  failed: [],
};

export const SHIPPING_PARTNERS: ShippingPartner[] = [
  {
    id: 'aramex-sa',
    name: 'Aramex Saudi Arabia',
    code: 'ARAMEX',
    tracking_url_template: 'https://www.aramex.com/track/results?track=${tracking_number}',
    contact_number: '+966 9200 11111',
    service_levels: ['Express', 'Standard', 'Economy'],
    delivery_coverage: ['All Saudi Arabia', 'GCC Countries'],
    is_active: true,
  },
  {
    id: 'smsa-sa',
    name: 'SMSA Express',
    code: 'SMSA',
    tracking_url_template: 'https://smsaexpress.com/tracking-details?trackingNo=${tracking_number}',
    contact_number: '+966 9200 05566',
    service_levels: ['Premium', 'Standard', 'Freight'],
    delivery_coverage: ['Major Cities', 'Regional'],
    is_active: true,
  },
  {
    id: 'naqel',
    name: 'Naqel Express',
    code: 'NAQEL',
    tracking_url_template: 'https://www.naqel.sa/naqel-public-tracking?trackingNo=${tracking_number}',
    contact_number: '+966 9200 14444',
    service_levels: ['Next Day', '2-3 Days', 'Economy'],
    delivery_coverage: ['All Saudi Arabia'],
    is_active: true,
  },
  {
    id: 'dhl-sa',
    name: 'DHL Saudi Arabia',
    code: 'DHL',
    tracking_url_template: 'https://www.dhl.com/sa-en/home/tracking/tracking-parcel?submit=1&tracking-id=${tracking_number}',
    contact_number: '+966 9200 94567',
    service_levels: ['Express Worldwide', 'Express 12:00', 'Economy Select'],
    delivery_coverage: ['International', 'Domestic'],
    is_active: true,
  },
  {
    id: 'self-delivery',
    name: 'Self Delivery',
    code: 'SELF',
    tracking_url_template: '',
    contact_number: '',
    service_levels: ['Standard'],
    delivery_coverage: ['Local Area'],
    is_active: true,
  },
];

// ============================================
// HOOK 1: Fetch Shipping Orders with Pagination
// ============================================

interface UseShippingOrdersParams {
  sellerId: string;
  page?: number;
  limit?: number;
  filters?: ShippingOrderFilters;
}

export const useShippingOrders = ({
  sellerId,
  page = 1,
  limit = 10,
  filters = {},
}: UseShippingOrdersParams) => {
  const queryKey = ['shipping-orders', sellerId, page, limit, filters];

  const fetchShippingOrders = async (): Promise<PaginatedShippingOrders> => {
    if (!sellerId) {
      throw new Error('Seller ID is required');
    }

    const start = (page - 1) * limit;
    const end = start + limit - 1;

    // Build query
    let query = supabase
      .from('shipping')
      .select(`
        *,
        customer:customers(*),
        order_summary:orders(
          id,
          total_amount,
          items_count,
          currency,
          payment_status,
          payment_method
        )
      `, { count: 'exact' })
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false })
      .range(start, end);

    // Apply filters
    if (filters.status) {
      query = query.eq('shipping_status', filters.status);
    }
    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }
    if (filters.shipping_partner) {
      query = query.eq('shipping_partner_name', filters.shipping_partner);
    }
    if (filters.search) {
      query = query.or(`tracking_number.ilike.%${filters.search}%,order_id.ilike.%${filters.search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch shipping orders: ${error.message}`);
    }

    const orders = (data || []) as ShippingOrder[];
    const total = count || 0;

    return {
      data: orders,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    };
  };

  const {
    data: result,
    isLoading,
    error,
    refetch,
  } = useQuery<PaginatedShippingOrders, Error>({
    queryKey,
    queryFn: fetchShippingOrders,
    enabled: !!sellerId,
    staleTime: 30000, // 30 seconds
  });

  // Helper function to get next status options
  const getNextStatusOptions = (currentStatus: ShippingStatus): ShippingStatus[] => {
    return SHIPPING_STATUS_FLOW[currentStatus] || [];
  };

  // Search orders by tracking or order ID
  const searchOrders = useCallback(async (searchTerm: string) => {
    if (!sellerId || !searchTerm.trim()) return [];

    const { data, error } = await supabase
      .from('shipping')
      .select(`
        *,
        customer:customers(*),
        order_summary:orders(
          id,
          total_amount,
          items_count,
          currency,
          payment_status,
          payment_method
        )
      `)
      .eq('seller_id', sellerId)
      .or(`tracking_number.ilike.%${searchTerm}%,order_id.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw new Error(`Search failed: ${error.message}`);
    return (data || []) as ShippingOrder[];
  }, [sellerId]);

  return {
    data: result?.data || [],
    total: result?.total || 0,
    page: result?.page || page,
    limit: result?.limit || limit,
    totalPages: result?.total_pages || 0,
    loading: isLoading,
    error: error as Error | null,
    refetch,
    getNextStatusOptions,
    searchOrders,
  };
};

// ============================================
// HOOK 2: Fetch Single Shipping Order Details
// ============================================

export const useShippingDetails = (orderId: string | undefined) => {
  const queryKey = ['shipping-details', orderId];

  const fetchShippingDetails = async (): Promise<ShippingOrder | null> => {
    if (!orderId) {
      return null;
    }

    const { data, error } = await supabase
      .from('shipping')
      .select(`
        *,
        customer:customers(*),
        order_summary:orders(
          id,
          total_amount,
          items_count,
          currency,
          payment_status,
          payment_method,
          items:order_items(
            product_id,
            quantity,
            unit_price,
            product:products(name, sku, image_url)
          )
        ),
        shipping_partner:shipping_partners(*)
      `)
      .eq('order_id', orderId)
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw new Error(`Failed to fetch shipping details: ${error.message}`);
    }

    return data as ShippingOrder;
  };

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<ShippingOrder | null, Error>({
    queryKey,
    queryFn: fetchShippingDetails,
    enabled: !!orderId,
    staleTime: 30000,
  });

  // Get tracking URL if available
  const getTrackingUrl = useCallback((): string | null => {
    if (!data?.tracking_number || !data?.shipping_partner?.tracking_url_template) {
      return null;
    }

    const partner = SHIPPING_PARTNERS.find(p => p.code === data.shipping_partner_name);
    if (!partner?.tracking_url_template) return null;

    return partner.tracking_url_template.replace('${tracking_number}', data.tracking_number);
  }, [data]);

  return {
    data,
    loading: isLoading,
    error: error as Error | null,
    refetch,
    getTrackingUrl,
  };
};

// ============================================
// HOOK 3: Update Shipping Status
// ============================================

export const useUpdateShippingStatus = (sellerId: string) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      orderId,
      status,
      notes,
      trackingNumber,
      shippedAt,
      deliveredAt,
      deliveryProofUrl,
    }: {
      orderId: string;
    } & ShippingUpdate) => {
      const updateData: any = {
        shipping_status: status,
        updated_at: new Date().toISOString(),
      };

      if (notes) updateData.shipping_notes = notes;
      if (trackingNumber) updateData.tracking_number = trackingNumber;
      if (status === 'shipped') {
        updateData.shipped_at = shippedAt || new Date().toISOString();
      }
      if (status === 'delivered') {
        updateData.delivered_at = deliveredAt || new Date().toISOString();
        updateData.delivery_proof_url = deliveryProofUrl;
      }
      if (status === 'returned') {
        updateData.returned_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('shipping')
        .update(updateData)
        .eq('order_id', orderId)
        .eq('seller_id', sellerId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update shipping status: ${error.message}`);
      }

      // Update order status as well
      if (['delivered', 'returned', 'cancelled'].includes(status)) {
        const orderStatus = status === 'delivered' ? 'completed' : status;
        await supabase
          .from('orders')
          .update({ 
            status: orderStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId);
      }

      return data as ShippingOrder;
    },

    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['shipping-orders', sellerId] });
      await queryClient.cancelQueries({ queryKey: ['shipping-details', variables.orderId] });

      // Snapshot the previous value
      const previousOrders = queryClient.getQueryData<PaginatedShippingOrders>(['shipping-orders', sellerId]);
      const previousDetails = queryClient.getQueryData<ShippingOrder>(['shipping-details', variables.orderId]);

      // Optimistically update to the new value
      if (previousOrders) {
        queryClient.setQueryData<PaginatedShippingOrders>(['shipping-orders', sellerId], (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map(order => 
              order.order_id === variables.orderId 
                ? { ...order, shipping_status: variables.status }
                : order
            ),
          };
        });
      }

      if (previousDetails) {
        queryClient.setQueryData<ShippingOrder>(['shipping-details', variables.orderId], (old) => {
          if (!old) return old;
          return {
            ...old,
            shipping_status: variables.status,
            ...(variables.trackingNumber && { tracking_number: variables.trackingNumber }),
            ...(variables.status === 'shipped' && { shipped_at: variables.shippedAt || new Date().toISOString() }),
            ...(variables.status === 'delivered' && { delivered_at: variables.deliveredAt || new Date().toISOString() }),
            updated_at: new Date().toISOString(),
          };
        });
      }

      return { previousOrders, previousDetails };
    },

    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousOrders) {
        queryClient.setQueryData(['shipping-orders', sellerId], context.previousOrders);
      }
      if (context?.previousDetails) {
        queryClient.setQueryData(['shipping-details', variables.orderId], context.previousDetails);
      }
    },

    onSettled: (data, error, variables) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['shipping-orders', sellerId] });
      queryClient.invalidateQueries({ queryKey: ['shipping-details', variables.orderId] });
    },
  });

  return {
    updateStatus: mutation.mutate,
    updateStatusAsync: mutation.mutateAsync,
    loading: mutation.isPending,
    error: mutation.error as Error | null,
    isSuccess: mutation.isSuccess,
  };
};

// ============================================
// HOOK 4: Assign Shipping Partner
// ============================================

export const useAssignShippingPartner = (sellerId: string) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (params: AssignShippingPartnerParams) => {
      const { orderId, shippingPartnerId, trackingNumber, carrierService, estimatedDelivery } = params;

      const shippingPartner = SHIPPING_PARTNERS.find(p => p.id === shippingPartnerId);
      if (!shippingPartner) {
        throw new Error('Invalid shipping partner');
      }

      const updateData = {
        shipping_partner_id: shippingPartnerId,
        shipping_partner_name: shippingPartner.name,
        tracking_number: trackingNumber,
        carrier_service: carrierService || shippingPartner.service_levels[0],
        estimated_delivery: estimatedDelivery,
        shipping_status: 'packed' as ShippingStatus,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('shipping')
        .update(updateData)
        .eq('order_id', orderId)
        .eq('seller_id', sellerId)
        .select(`
          *,
          customer:customers(*),
          order_summary:orders(
            id,
            total_amount,
            items_count,
            currency,
            payment_status,
            payment_method
          )
        `)
        .single();

      if (error) {
        throw new Error(`Failed to assign shipping partner: ${error.message}`);
      }

      return data as ShippingOrder;
    },

    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['shipping-orders', sellerId] });
      await queryClient.cancelQueries({ queryKey: ['shipping-details', variables.orderId] });

      const previousOrders = queryClient.getQueryData<PaginatedShippingOrders>(['shipping-orders', sellerId]);
      const previousDetails = queryClient.getQueryData<ShippingOrder>(['shipping-details', variables.orderId]);

      const shippingPartner = SHIPPING_PARTNERS.find(p => p.id === variables.shippingPartnerId);

      if (previousOrders) {
        queryClient.setQueryData<PaginatedShippingOrders>(['shipping-orders', sellerId], (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map(order => 
              order.order_id === variables.orderId 
                ? { 
                    ...order, 
                    shipping_partner_id: variables.shippingPartnerId,
                    shipping_partner_name: shippingPartner?.name,
                    tracking_number: variables.trackingNumber,
                    carrier_service: variables.carrierService,
                    estimated_delivery: variables.estimatedDelivery,
                    shipping_status: 'packed',
                    updated_at: new Date().toISOString(),
                  }
                : order
            ),
          };
        });
      }

      if (previousDetails) {
        queryClient.setQueryData<ShippingOrder>(['shipping-details', variables.orderId], (old) => {
          if (!old) return old;
          return {
            ...old,
            shipping_partner_id: variables.shippingPartnerId,
            shipping_partner_name: shippingPartner?.name,
            tracking_number: variables.trackingNumber,
            carrier_service: variables.carrierService,
            estimated_delivery: variables.estimatedDelivery,
            shipping_status: 'packed',
            updated_at: new Date().toISOString(),
          };
        });
      }

      return { previousOrders, previousDetails };
    },

    onError: (err, variables, context) => {
      if (context?.previousOrders) {
        queryClient.setQueryData(['shipping-orders', sellerId], context.previousOrders);
      }
      if (context?.previousDetails) {
        queryClient.setQueryData(['shipping-details', variables.orderId], context.previousDetails);
      }
    },

    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shipping-orders', sellerId] });
      queryClient.invalidateQueries({ queryKey: ['shipping-details', variables.orderId] });
    },
  });

  return {
    assignPartner: mutation.mutate,
    assignPartnerAsync: mutation.mutateAsync,
    loading: mutation.isPending,
    error: mutation.error as Error | null,
    isSuccess: mutation.isSuccess,
  };
};

// ============================================
// HOOK 5: Bulk Shipping Operations
// ============================================

export const useBulkShippingOperations = (sellerId: string) => {
  const queryClient = useQueryClient();
  const { updateStatusAsync } = useUpdateShippingStatus(sellerId);

  const bulkUpdateStatus = async (
    orderIds: string[],
    status: ShippingStatus,
    notes?: string
  ) => {
    const results = [];
    const errors = [];

    for (const orderId of orderIds) {
      try {
        const result = await updateStatusAsync({
          orderId,
          status,
          notes,
        });
        results.push({ orderId, success: true, data: result });
      } catch (error) {
        errors.push({ orderId, success: false, error });
      }
    }

    // Refresh the list after bulk operation
    await queryClient.invalidateQueries({ queryKey: ['shipping-orders', sellerId] });

    return { results, errors, total: orderIds.length, successful: results.length };
  };

  const printShippingLabels = async (orderIds: string[]): Promise<string[]> => {
    // Mock implementation - in real app, this would generate PDFs
    const labelUrls = orderIds.map(orderId => 
      `https://api.marketplace.com/shipping/labels/${orderId}?seller=${sellerId}`
    );
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return labelUrls;
  };

  const generateManifest = async (orderIds: string[]): Promise<string> => {
    // Mock implementation
    const manifestId = `MANIFEST-${Date.now()}-${sellerId.slice(0, 8)}`;
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return `https://api.marketplace.com/shipping/manifests/${manifestId}`;
  };

  return {
    bulkUpdateStatus,
    printShippingLabels,
    generateManifest,
  };
};

// ============================================
// HOOK 6: Shipping Analytics
// ============================================

interface ShippingAnalyticsParams {
  sellerId: string;
  period?: 'today' | 'week' | 'month' | 'quarter' | 'year';
}

export const useShippingAnalytics = ({ sellerId, period = 'month' }: ShippingAnalyticsParams) => {
  const queryKey = ['shipping-analytics', sellerId, period];

  const fetchAnalytics = async () => {
    if (!sellerId) {
      throw new Error('Seller ID is required');
    }

    // Calculate date range based on period
    const now = new Date();
    let dateFrom = new Date();

    switch (period) {
      case 'today':
        dateFrom.setHours(0, 0, 0, 0);
        break;
      case 'week':
        dateFrom.setDate(now.getDate() - 7);
        break;
      case 'month':
        dateFrom.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        dateFrom.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        dateFrom.setFullYear(now.getFullYear() - 1);
        break;
    }

    // Fetch shipping statistics
    const { data: statusData, error: statusError } = await supabase
      .from('shipping')
      .select('shipping_status')
      .eq('seller_id', sellerId)
      .gte('created_at', dateFrom.toISOString());

    if (statusError) throw new Error(`Failed to fetch status analytics: ${statusError.message}`);

    // Count by status
    const statusCounts = (statusData || []).reduce((acc, item) => {
      acc[item.shipping_status] = (acc[item.shipping_status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Fetch delivery performance
    const { data: deliveryData, error: deliveryError } = await supabase
      .from('shipping')
      .select('shipped_at, delivered_at, estimated_delivery')
      .eq('seller_id', sellerId)
      .eq('shipping_status', 'delivered')
      .gte('created_at', dateFrom.toISOString())
      .not('shipped_at', 'is', null)
      .not('delivered_at', 'is', null);

    if (deliveryError) throw new Error(`Failed to fetch delivery analytics: ${deliveryError.message}`);

    // Calculate on-time delivery rate
    const deliveredOrders = (deliveryData || []);
    const onTimeDeliveries = deliveredOrders.filter(order => {
      if (!order.delivered_at || !order.estimated_delivery) return false;
      const deliveredDate = new Date(order.delivered_at);
      const estimatedDate = new Date(order.estimated_delivery);
      return deliveredDate <= estimatedDate;
    });

    const onTimeRate = deliveredOrders.length > 0 
      ? (onTimeDeliveries.length / deliveredOrders.length) * 100 
      : 0;

    // Calculate average shipping time
    const totalShippingTime = deliveredOrders.reduce((total, order) => {
      if (!order.shipped_at || !order.delivered_at) return total;
      const shippedDate = new Date(order.shipped_at);
      const deliveredDate = new Date(order.delivered_at);
      return total + (deliveredDate.getTime() - shippedDate.getTime());
    }, 0);

    const avgShippingDays = deliveredOrders.length > 0
      ? (totalShippingTime / (deliveredOrders.length * 1000 * 60 * 60 * 24))
      : 0;

    return {
      statusCounts,
      totalOrders: statusData?.length || 0,
      deliveredOrders: deliveredOrders.length,
      onTimeDeliveryRate: Math.round(onTimeRate),
      avgShippingDays: Math.round(avgShippingDays * 10) / 10,
      period,
    };
  };

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: fetchAnalytics,
    enabled: !!sellerId,
    staleTime: 60000, // 1 minute
  });

  return {
    analytics: data,
    loading: isLoading,
    error: error as Error | null,
    refetch,
  };
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

export const getStatusColor = (status: ShippingStatus): string => {
  const colors: Record<ShippingStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    packed: 'bg-blue-100 text-blue-800',
    shipped: 'bg-indigo-100 text-indigo-800',
    out_for_delivery: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    returned: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
    delayed: 'bg-orange-100 text-orange-800',
    failed: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const getStatusIcon = (status: ShippingStatus) => {
  // This would return appropriate Lucide icons based on status
  // Implementation depends on your icon library
  return null;
};

export const calculateEstimatedDelivery = (
  shippingPartner: string,
  serviceLevel: string,
  fromDate: Date = new Date()
): string => {
  const deliveryDays: Record<string, number> = {
    'Express': 1,
    'Next Day': 1,
    'Standard': 3,
    'Economy': 7,
    'Premium': 2,
    'Freight': 14,
  };

  const days = deliveryDays[serviceLevel] || 3;
  const deliveryDate = new Date(fromDate);
  deliveryDate.setDate(deliveryDate.getDate() + days);
  
  return deliveryDate.toISOString();
};

export default {
  useShippingOrders,
  useShippingDetails,
  useUpdateShippingStatus,
  useAssignShippingPartner,
  useBulkShippingOperations,
  useShippingAnalytics,
  getStatusColor,
  getStatusIcon,
  calculateEstimatedDelivery,
  SHIPPING_PARTNERS,
};