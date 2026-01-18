import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

// ==================== TYPE DEFINITIONS ====================

export type CustomOrderStatus = 
  | 'requested'    // Customer submitted request
  | 'quoted'       // Seller sent quotation
  | 'negotiating'  // Price/specs negotiation
  | 'approved'     // Customer approved quote
  | 'deposit_paid' // Customer paid deposit
  | 'in_production' // Item in production
  | 'ready'        // Item ready for delivery
  | 'shipped'      // Item shipped
  | 'delivered'    // Item delivered
  | 'completed'    // Order completed
  | 'cancelled'    // Order cancelled
  | 'rejected';    // Seller rejected request

export interface CustomOrderAttachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  uploaded_by: 'seller' | 'customer';
  uploaded_at: string;
}

export interface CustomOrderMessage {
  id: string;
  custom_order_id: string;
  sender_id: string;
  sender_type: 'seller' | 'customer';
  message: string;
  attachments: CustomOrderAttachment[];
  read_at: string | null;
  created_at: string;
  updated_at: string;
  sender_name?: string;
}

export interface CustomerInfo {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  avatar_url: string | null;
  company_name: string | null;
}

export interface CustomOrderDesignSpecs {
  length?: number;   // in cm
  width?: number;    // in cm
  height?: number;   // in cm
  material: string;
  color: string;
  finish: string;
  style: string;
  special_features: string[];
  drawings?: string[]; // URLs to design drawings
}

export interface CustomOrderPricing {
  material_cost: number;
  labor_cost: number;
  shipping_cost: number;
  vat_amount: number;
  discount_amount: number;
  deposit_amount: number;
  total_amount: number;
}

export interface CustomOrder {
  id: string;
  custom_order_id: string; // Display ID like "CO-2024-001"
  seller_id: string;
  customer_id: string;
  
  // Product Details
  product_category: string;
  product_name: string;
  design_specs: CustomOrderDesignSpecs;
  quantity: number;
  special_instructions: string;
  
  // Pricing
  pricing: CustomOrderPricing;
  quoted_price: number;
  final_price: number | null;
  
  // Status & Dates
  status: CustomOrderStatus;
  requested_at: string;
  quoted_at: string | null;
  approved_at: string | null;
  estimated_completion_date: string | null;
  completed_at: string | null;
  
  // Attachments
  customer_attachments: CustomOrderAttachment[];
  seller_attachments: CustomOrderAttachment[];
  
  // Metadata
  created_at: string;
  updated_at: string;
  
  // Joined Data
  customer?: CustomerInfo;
  messages?: CustomOrderMessage[];
  message_count?: number;
  unread_messages?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UseCustomOrdersReturn {
  orders: CustomOrder[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  totalPages: number;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
  filterByStatus: (status: CustomOrderStatus | 'all') => void;
  sortBy: (field: 'created_at' | 'updated_at' | 'quoted_price', direction: 'asc' | 'desc') => void;
}

export interface UseCustomOrderDetailsReturn {
  order: CustomOrder | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateStatus: (status: CustomOrderStatus, notes?: string) => Promise<boolean>;
  sendMessage: (message: string, attachments?: File[]) => Promise<boolean>;
  uploadAttachment: (file: File, type: 'design' | 'invoice' | 'photo') => Promise<string | null>;
}

export interface UseUpdateCustomOrderStatusReturn {
  updating: boolean;
  error: string | null;
  updateStatus: (
    orderId: string, 
    status: CustomOrderStatus, 
    notes?: string,
    metadata?: Record<string, any>
  ) => Promise<boolean>;
}

export interface UseSendCustomOrderMessageReturn {
  sending: boolean;
  error: string | null;
  sendMessage: (
    orderId: string,
    message: string,
    attachments?: File[]
  ) => Promise<boolean>;
}

// ==================== MAIN HOOK ====================

export const useCustomOrders = (
  sellerId: string, 
  page: number = 1, 
  limit: number = 20,
  statusFilter?: CustomOrderStatus | 'all'
): UseCustomOrdersReturn => {
  const [orders, setOrders] = useState<CustomOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(page);
  const [currentStatusFilter, setCurrentStatusFilter] = useState<CustomOrderStatus | 'all'>(statusFilter || 'all');
  const [sortField, setSortField] = useState<'created_at' | 'updated_at' | 'quoted_price'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const fetchOrders = useCallback(async () => {
    if (!sellerId) {
      setError('Seller ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Build query with filters
      let query = supabase
        .from('custom_orders')
        .select(`
          *,
          customer:customers (
            id,
            full_name,
            email,
            phone,
            avatar_url,
            company_name
          )
        `, { count: 'exact' })
        .eq('seller_id', sellerId)
        .order(sortField, { ascending: sortDirection === 'asc' })
        .range((currentPage - 1) * limit, currentPage * limit - 1);

      // Apply status filter
      if (currentStatusFilter !== 'all') {
        query = query.eq('status', currentStatusFilter);
      }

      const { data, error: queryError, count } = await query;

      if (queryError) throw queryError;

      // Transform and enrich data
      const enrichedOrders = (data || []).map(order => ({
        ...order,
        custom_order_id: order.custom_order_id || `CO-${new Date(order.created_at).getFullYear()}-${String(order.id).padStart(4, '0')}`,
        pricing: order.pricing || {
          material_cost: 0,
          labor_cost: 0,
          shipping_cost: 0,
          vat_amount: 0,
          discount_amount: 0,
          deposit_amount: 0,
          total_amount: order.quoted_price || 0
        },
        design_specs: order.design_specs || {
          material: '',
          color: '',
          finish: '',
          style: '',
          special_features: []
        }
      }));

      // If it's the first page, replace orders, otherwise append
      if (currentPage === 1) {
        setOrders(enrichedOrders);
      } else {
        setOrders(prev => [...prev, ...enrichedOrders]);
      }

      setTotal(count || 0);
    } catch (err) {
      console.error('Error fetching custom orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch custom orders');
      
      // Fallback to mock data for demo
      if (localStorage.getItem('demoMode') === 'true') {
        const mockOrders = await generateMockCustomOrders(sellerId);
        setOrders(mockOrders);
        setTotal(mockOrders.length);
      }
    } finally {
      setLoading(false);
    }
  }, [sellerId, currentPage, limit, currentStatusFilter, sortField, sortDirection]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const refresh = async () => {
    setCurrentPage(1);
    await fetchOrders();
  };

  const loadMore = async () => {
    if (!hasMore || loading) return;
    setCurrentPage(prev => prev + 1);
  };

  const filterByStatus = (status: CustomOrderStatus | 'all') => {
    setCurrentStatusFilter(status);
    setCurrentPage(1);
    setOrders([]);
  };

  const sortBy = (field: 'created_at' | 'updated_at' | 'quoted_price', direction: 'asc' | 'desc') => {
    setSortField(field);
    setSortDirection(direction);
    setCurrentPage(1);
    setOrders([]);
  };

  const hasMore = orders.length < total;

  return {
    orders,
    loading,
    error,
    total,
    page: currentPage,
    totalPages: Math.ceil(total / limit),
    refresh,
    loadMore,
    hasMore,
    filterByStatus,
    sortBy
  };
};

// ==================== ORDER DETAILS HOOK ====================

export const useCustomOrderDetails = (customOrderId: string): UseCustomOrderDetailsReturn => {
  const [order, setOrder] = useState<CustomOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrderDetails = useCallback(async () => {
    if (!customOrderId) {
      setError('Custom Order ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch order with customer details
      const { data: orderData, error: orderError } = await supabase
        .from('custom_orders')
        .select(`
          *,
          customer:customers (
            id,
            full_name,
            email,
            phone,
            avatar_url,
            company_name
          )
        `)
        .eq('id', customOrderId)
        .single();

      if (orderError) throw orderError;

      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('custom_order_messages')
        .select(`
          *,
          sender:profiles(full_name)
        `)
        .eq('custom_order_id', customOrderId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      // Combine data
      const enrichedOrder = {
        ...orderData,
        custom_order_id: orderData.custom_order_id || `CO-${new Date(orderData.created_at).getFullYear()}-${String(orderData.id).padStart(4, '0')}`,
        pricing: orderData.pricing || {
          material_cost: 0,
          labor_cost: 0,
          shipping_cost: 0,
          vat_amount: 0,
          discount_amount: 0,
          deposit_amount: 0,
          total_amount: orderData.quoted_price || 0
        },
        design_specs: orderData.design_specs || {
          material: '',
          color: '',
          finish: '',
          style: '',
          special_features: []
        },
        messages: messagesData || []
      };

      setOrder(enrichedOrder);
    } catch (err) {
      console.error('Error fetching custom order details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch order details');
      
      // Fallback to mock data for demo
      if (localStorage.getItem('demoMode') === 'true') {
        const mockOrder = await generateMockCustomOrderDetails(customOrderId);
        setOrder(mockOrder);
      }
    } finally {
      setLoading(false);
    }
  }, [customOrderId]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  const updateStatus = async (status: CustomOrderStatus, notes?: string): Promise<boolean> => {
    if (!order) return false;

    try {
      // Optimistic update
      const previousOrder = { ...order };
      setOrder(prev => prev ? { ...prev, status } : null);

      const { error } = await supabase
        .from('custom_orders')
        .update({
          status,
          updated_at: new Date().toISOString(),
          ...(status === 'quoted' && { quoted_at: new Date().toISOString() }),
          ...(status === 'approved' && { approved_at: new Date().toISOString() }),
          ...(status === 'completed' && { completed_at: new Date().toISOString() })
        })
        .eq('id', order.id);

      if (error) {
        // Revert on error
        setOrder(previousOrder);
        toast.error('Failed to update order status');
        return false;
      }

      // Add status change as a system message
      if (notes) {
        await supabase.from('custom_order_messages').insert({
          custom_order_id: order.id,
          sender_id: order.seller_id,
          sender_type: 'seller',
          message: `Status changed to ${status}: ${notes}`,
          is_system_message: true
        });
      }

      toast.success(`Order status updated to ${status}`);
      return true;
    } catch (err) {
      console.error('Error updating order status:', err);
      toast.error('Failed to update order status');
      return false;
    }
  };

  const sendMessage = async (message: string, attachments: File[] = []): Promise<boolean> => {
    if (!order || !message.trim()) return false;

    try {
      // Upload attachments first
      const uploadedAttachments: CustomOrderAttachment[] = [];
      
      for (const file of attachments) {
        const filePath = `custom_orders/${order.id}/messages/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('custom-order-attachments')
          .upload(filePath, file);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('custom-order-attachments')
            .getPublicUrl(filePath);

          uploadedAttachments.push({
            id: `${Date.now()}_${file.name}`,
            file_name: file.name,
            file_url: publicUrl,
            file_type: file.type,
            file_size: file.size,
            uploaded_by: 'seller',
            uploaded_at: new Date().toISOString()
          });
        }
      }

      // Insert message
      const { error } = await supabase.from('custom_order_messages').insert({
        custom_order_id: order.id,
        sender_id: order.seller_id,
        sender_type: 'seller',
        message,
        attachments: uploadedAttachments,
        read_at: null
      });

      if (error) throw error;

      // Refresh messages
      await fetchOrderDetails();
      
      toast.success('Message sent successfully');
      return true;
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Failed to send message');
      return false;
    }
  };

  const uploadAttachment = async (
    file: File, 
    type: 'design' | 'invoice' | 'photo'
  ): Promise<string | null> => {
    if (!order) return null;

    try {
      const filePath = `custom_orders/${order.id}/${type}/${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('custom-order-attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('custom-order-attachments')
        .getPublicUrl(filePath);

      // Update order with new attachment
      const attachmentField = type === 'design' ? 'seller_attachments' : 
                            type === 'invoice' ? 'seller_attachments' : 'seller_attachments';
      
      const currentAttachments = order[attachmentField] || [];
      const newAttachment: CustomOrderAttachment = {
        id: `${Date.now()}_${file.name}`,
        file_name: file.name,
        file_url: publicUrl,
        file_type: file.type,
        file_size: file.size,
        uploaded_by: 'seller',
        uploaded_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('custom_orders')
        .update({
          [attachmentField]: [...currentAttachments, newAttachment],
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (updateError) throw updateError;

      // Update local state
      setOrder(prev => prev ? {
        ...prev,
        [attachmentField]: [...currentAttachments, newAttachment]
      } : null);

      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully`);
      return publicUrl;
    } catch (err) {
      console.error('Error uploading attachment:', err);
      toast.error('Failed to upload file');
      return null;
    }
  };

  return {
    order,
    loading,
    error,
    refresh: fetchOrderDetails,
    updateStatus,
    sendMessage,
    uploadAttachment
  };
};

// ==================== STATUS UPDATE HOOK ====================

export const useUpdateCustomOrderStatus = (): UseUpdateCustomOrderStatusReturn => {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateStatus = async (
    orderId: string, 
    status: CustomOrderStatus, 
    notes?: string,
    metadata?: Record<string, any>
  ): Promise<boolean> => {
    try {
      setUpdating(true);
      setError(null);

      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      // Set timestamps based on status
      switch (status) {
        case 'quoted':
          updateData.quoted_at = new Date().toISOString();
          break;
        case 'approved':
          updateData.approved_at = new Date().toISOString();
          break;
        case 'deposit_paid':
          updateData.deposit_paid_at = new Date().toISOString();
          break;
        case 'completed':
          updateData.completed_at = new Date().toISOString();
          break;
        case 'cancelled':
        case 'rejected':
          updateData.cancelled_at = new Date().toISOString();
          break;
      }

      // Add metadata if provided
      if (metadata) {
        Object.assign(updateData, metadata);
      }

      const { error: updateError } = await supabase
        .from('custom_orders')
        .update(updateData)
        .eq('id', orderId);

      if (updateError) throw updateError;

      // Add status change message if notes provided
      if (notes) {
        // Get seller info for message
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          await supabase.from('custom_order_messages').insert({
            custom_order_id: orderId,
            sender_id: user.id,
            sender_type: 'seller',
            message: `Order status updated to ${status}: ${notes}`,
            is_system_message: true
          });
        }
      }

      toast.success(`Order status updated to ${status}`);
      return true;
    } catch (err) {
      console.error('Error updating custom order status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update status');
      toast.error('Failed to update order status');
      return false;
    } finally {
      setUpdating(false);
    }
  };

  return {
    updating,
    error,
    updateStatus
  };
};

// ==================== MESSAGING HOOK ====================

export const useSendCustomOrderMessage = (): UseSendCustomOrderMessageReturn => {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (
    orderId: string,
    message: string,
    attachments: File[] = []
  ): Promise<boolean> => {
    if (!message.trim()) {
      setError('Message cannot be empty');
      return false;
    }

    try {
      setSending(true);
      setError(null);

      // Get current user (seller)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('User not authenticated');
        return false;
      }

      // Upload attachments
      const uploadedAttachments: any[] = [];
      
      for (const file of attachments) {
        const filePath = `custom_orders/${orderId}/messages/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('custom-order-attachments')
          .upload(filePath, file);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('custom-order-attachments')
            .getPublicUrl(filePath);

          uploadedAttachments.push({
            file_name: file.name,
            file_url: publicUrl,
            file_type: file.type,
            file_size: file.size,
            uploaded_at: new Date().toISOString()
          });
        }
      }

      // Insert message
      const { error: insertError } = await supabase
        .from('custom_order_messages')
        .insert({
          custom_order_id: orderId,
          sender_id: user.id,
          sender_type: 'seller',
          message,
          attachments: uploadedAttachments,
          read_at: null
        });

      if (insertError) throw insertError;

      // Update order's updated_at timestamp
      await supabase
        .from('custom_orders')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', orderId);

      toast.success('Message sent successfully');
      return true;
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
      toast.error('Failed to send message');
      return false;
    } finally {
      setSending(false);
    }
  };

  return {
    sending,
    error,
    sendMessage
  };
};

// ==================== MOCK DATA GENERATORS (For Demo Mode) ====================

const generateMockCustomOrders = async (sellerId: string): Promise<CustomOrder[]> => {
  const statuses: CustomOrderStatus[] = [
    'requested', 'quoted', 'approved', 'in_production', 'ready', 'delivered', 'cancelled'
  ];

  const materials = ['Solid Wood', 'Engineered Wood', 'Metal', 'Glass', 'Leather', 'Fabric'];
  const colors = ['Walnut', 'White', 'Black', 'Gray', 'Natural', 'Espresso'];
  const categories = ['Sofa', 'Dining Table', 'Bed', 'Wardrobe', 'Coffee Table', 'Bookshelf'];

  return Array.from({ length: 15 }, (_, i) => {
    const status = statuses[i % statuses.length];
    const quotedPrice = Math.floor(Math.random() * 10000) + 5000;
    
    return {
      id: `mock-order-${i + 1}`,
      custom_order_id: `CO-2024-${String(i + 1).padStart(3, '0')}`,
      seller_id: sellerId,
      customer_id: `customer-${i + 1}`,
      product_category: categories[i % categories.length],
      product_name: `Custom ${categories[i % categories.length]}`,
      design_specs: {
        length: 150 + Math.random() * 100,
        width: 80 + Math.random() * 60,
        height: 90 + Math.random() * 40,
        material: materials[i % materials.length],
        color: colors[i % colors.length],
        finish: 'Matte',
        style: 'Modern',
        special_features: ['Storage', 'Adjustable', 'Modular'],
        drawings: []
      },
      quantity: 1,
      special_instructions: 'Please ensure smooth edges and child-safe corners.',
      pricing: {
        material_cost: quotedPrice * 0.4,
        labor_cost: quotedPrice * 0.3,
        shipping_cost: 500,
        vat_amount: quotedPrice * 0.15,
        discount_amount: 0,
        deposit_amount: quotedPrice * 0.3,
        total_amount: quotedPrice
      },
      quoted_price: quotedPrice,
      final_price: status === 'completed' ? quotedPrice : null,
      status,
      requested_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      quoted_at: status !== 'requested' ? new Date(Date.now() - Math.random() * 25 * 24 * 60 * 60 * 1000).toISOString() : null,
      approved_at: ['approved', 'in_production', 'ready', 'delivered', 'completed'].includes(status) 
        ? new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000).toISOString() 
        : null,
      estimated_completion_date: status !== 'completed' && status !== 'cancelled' 
        ? new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() 
        : null,
      completed_at: status === 'completed' ? new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString() : null,
      customer_attachments: [],
      seller_attachments: [],
      created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      customer: {
        id: `customer-${i + 1}`,
        full_name: `Customer ${i + 1}`,
        email: `customer${i + 1}@example.com`,
        phone: `+966 5${Math.floor(Math.random() * 9000000) + 1000000}`,
        avatar_url: null,
        company_name: i % 3 === 0 ? `Company ${i + 1}` : null
      },
      message_count: Math.floor(Math.random() * 10),
      unread_messages: Math.floor(Math.random() * 3)
    };
  });
};

const generateMockCustomOrderDetails = async (customOrderId: string): Promise<CustomOrder> => {
  const mockOrder = {
    id: customOrderId,
    custom_order_id: 'CO-2024-001',
    seller_id: 'seller-1',
    customer_id: 'customer-1',
    product_category: 'Sofa',
    product_name: 'Custom L-Shaped Sofa',
    design_specs: {
      length: 250,
      width: 180,
      height: 85,
      material: 'Premium Leather',
      color: 'Chestnut Brown',
      finish: 'Semi-Gloss',
      style: 'Modern Contemporary',
      special_features: ['Storage Compartment', 'USB Charging Ports', 'Adjustable Headrest'],
      drawings: []
    },
    quantity: 1,
    special_instructions: 'Need extra firm cushioning. Must be pet-friendly material.',
    pricing: {
      material_cost: 8500,
      labor_cost: 4500,
      shipping_cost: 800,
      vat_amount: 2070,
      discount_amount: 500,
      deposit_amount: 5000,
      total_amount: 15370
    },
    quoted_price: 15370,
    final_price: 15370,
    status: 'in_production' as CustomOrderStatus,
    requested_at: '2024-01-15T10:30:00Z',
    quoted_at: '2024-01-18T14:20:00Z',
    approved_at: '2024-01-20T09:15:00Z',
    estimated_completion_date: '2024-03-10T00:00:00Z',
    completed_at: null,
    customer_attachments: [
      {
        id: 'cust-attach-1',
        file_name: 'room-dimensions.pdf',
        file_url: 'https://example.com/room-dimensions.pdf',
        file_type: 'application/pdf',
        file_size: 2048000,
        uploaded_by: 'customer',
        uploaded_at: '2024-01-15T10:35:00Z'
      }
    ],
    seller_attachments: [
      {
        id: 'seller-attach-1',
        file_name: 'design-render.png',
        file_url: 'https://example.com/design-render.png',
        file_type: 'image/png',
        file_size: 5120000,
        uploaded_by: 'seller',
        uploaded_at: '2024-01-18T14:25:00Z'
      }
    ],
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-25T16:45:00Z',
    customer: {
      id: 'customer-1',
      full_name: 'Ahmed Al-Mansoor',
      email: 'ahmed@example.com',
      phone: '+966 55 123 4567',
      avatar_url: null,
      company_name: 'Al-Mansoor Trading'
    },
    messages: [
      {
        id: 'msg-1',
        custom_order_id: customOrderId,
        sender_id: 'customer-1',
        sender_type: 'customer',
        message: 'Hello, I\'m interested in a custom sofa for my living room. Attached are the room dimensions.',
        attachments: [],
        read_at: '2024-01-15T11:00:00Z',
        created_at: '2024-01-15T10:32:00Z',
        updated_at: '2024-01-15T10:32:00Z',
        sender_name: 'Ahmed Al-Mansoor'
      },
      {
        id: 'msg-2',
        custom_order_id: customOrderId,
        sender_id: 'seller-1',
        sender_type: 'seller',
        message: 'Thank you for your inquiry. I\'ve reviewed the dimensions and attached a design render. The estimated cost is SAR 15,370 including VAT.',
        attachments: [
          {
            id: 'attach-1',
            file_name: 'design-render.png',
            file_url: 'https://example.com/design-render.png',
            file_type: 'image/png',
            file_size: 5120000,
            uploaded_by: 'seller',
            uploaded_at: '2024-01-18T14:25:00Z'
          }
        ],
        read_at: null,
        created_at: '2024-01-18T14:20:00Z',
        updated_at: '2024-01-18T14:20:00Z',
        sender_name: 'Premium Furniture Store'
      },
      {
        id: 'msg-3',
        custom_order_id: customOrderId,
        sender_id: 'customer-1',
        sender_type: 'customer',
        message: 'The design looks perfect! I approve the quote. Please proceed with production.',
        attachments: [],
        read_at: '2024-01-20T09:20:00Z',
        created_at: '2024-01-20T09:15:00Z',
        updated_at: '2024-01-20T09:15:00Z',
        sender_name: 'Ahmed Al-Mansoor'
      }
    ]
  };

  return mockOrder;
};

// ==================== EXPORT HOOKS COLLECTION ====================

export const useCustomOrdersCollection = {
  useCustomOrders,
  useCustomOrderDetails,
  useUpdateCustomOrderStatus,
  useSendCustomOrderMessage
};