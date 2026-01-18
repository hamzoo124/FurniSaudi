// src/api/customOrders.ts
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { format, subDays } from 'date-fns';

// ==================== TYPE DEFINITIONS ====================

export enum CustomOrderStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ARCHIVED = 'archived'
}

export enum CustomOrderPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum CustomOrderCategory {
  FURNITURE = 'furniture',
  HOME_DECOR = 'home_decor',
  OFFICE_EQUIPMENT = 'office_equipment',
  OUTDOOR = 'outdoor',
  CUSTOM_DESIGN = 'custom_design',
  REPAIR = 'repair',
  MODIFICATION = 'modification',
  OTHER = 'other'
}

export interface CustomOrder {
  id: string;
  order_number: string;
  seller_id: string;
  customer_id: string;
  customer?: CustomerInfo;
  title: string;
  description: string;
  detailed_requirements?: string;
  status: CustomOrderStatus;
  category: CustomOrderCategory;
  priority: CustomOrderPriority;
  budget_range?: {
    min: number;
    max: number;
    currency: string;
  };
  deadline?: string;
  estimated_completion_date?: string;
  actual_completion_date?: string;
  reference_product_id?: string;
  reference_images?: string[];
  material_preferences?: string[];
  color_preferences?: string[];
  dimensions?: {
    width: number;
    height: number;
    depth: number;
    unit: 'cm' | 'inch';
  };
  quantity: number;
  unit_price?: number;
  total_price?: number;
  deposit_paid?: number;
  deposit_paid_at?: string;
  full_payment_paid?: number;
  full_payment_paid_at?: string;
  shipping_address?: any;
  installation_required: boolean;
  special_instructions?: string;
  tags: string[];
  attachments: CustomOrderAttachment[];
  assigned_to?: string;
  assigned_agent?: string;
  created_at: string;
  updated_at: string;
  last_message_at?: string;
  message_count: number;
  unread_messages: number;
  estimated_delivery_days?: number;
  sla_due_at?: string;
}

export interface CustomerInfo {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  company_name?: string;
  address?: string;
  total_orders?: number;
  total_spent?: number;
  customer_since?: string;
}

export interface CustomOrderMessage {
  id: string;
  custom_order_id: string;
  sender_id: string;
  sender_type: 'seller' | 'customer' | 'support';
  sender_name: string;
  sender_avatar?: string;
  message: string;
  attachments: MessageAttachment[];
  internal_note: boolean;
  read_by_seller: boolean;
  read_by_customer: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomOrderAttachment {
  id: string;
  custom_order_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_url: string;
  thumbnail_url?: string;
  uploaded_by: string;
  uploaded_at: string;
}

export interface MessageAttachment {
  id: string;
  message_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_url: string;
  thumbnail_url?: string;
  uploaded_at: string;
}

export interface CreateCustomOrderData {
  seller_id: string;
  customer_id: string;
  title: string;
  description: string;
  category: CustomOrderCategory;
  priority: CustomOrderPriority;
  budget_min?: number;
  budget_max?: number;
  deadline?: string;
  reference_product_id?: string;
  reference_images?: File[];
  material_preferences?: string[];
  color_preferences?: string[];
  dimensions?: {
    width: number;
    height: number;
    depth: number;
    unit: 'cm' | 'inch';
  };
  quantity: number;
  shipping_address?: any;
  installation_required?: boolean;
  special_instructions?: string;
  tags?: string[];
}

export interface UpdateCustomOrderData {
  status?: CustomOrderStatus;
  priority?: CustomOrderPriority;
  title?: string;
  description?: string;
  detailed_requirements?: string;
  budget_min?: number;
  budget_max?: number;
  deadline?: string;
  estimated_completion_date?: string;
  unit_price?: number;
  total_price?: number;
  assigned_to?: string;
  estimated_delivery_days?: number;
  tags?: string[];
}

export interface SendMessageData {
  custom_order_id: string;
  sender_id: string;
  sender_type: 'seller' | 'customer';
  message: string;
  attachments?: File[];
  internal_note?: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface FilterParams {
  status?: CustomOrderStatus | CustomOrderStatus[];
  priority?: CustomOrderPriority | CustomOrderPriority[];
  category?: CustomOrderCategory | CustomOrderCategory[];
  customer_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  assigned_to?: string;
  tags?: string[];
}

export interface PaginationMeta {
  current_page: number;
  total_pages: number;
  total_items: number;
  items_per_page: number;
  has_next_page: boolean;
  has_previous_page: boolean;
}

export interface CustomOrdersResponse {
  orders: CustomOrder[];
  pagination: PaginationMeta;
  stats?: CustomOrderStats;
}

export interface CustomOrderStats {
  total_orders: number;
  pending_orders: number;
  in_progress_orders: number;
  completed_orders: number;
  revenue_potential: number;
  average_completion_time_days: number;
}

// ==================== UTILITY FUNCTIONS ====================

const generateOrderNumber = (): string => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `CUSTOM-${year}${month}${day}-${random}`;
};

const uploadFile = async (
  file: File,
  bucket: string = 'custom-order-attachments',
  folder: string = 'orders'
): Promise<{ file_url: string; thumbnail_url?: string; file_name: string; file_size: number; file_type: string }> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    let thumbnailUrl: string | undefined;

    // For images, we could generate thumbnails
    if (file.type.startsWith('image/')) {
      // In production, generate thumbnail using sharp or similar
      // For now, use the same URL
      thumbnailUrl = publicUrl;
    }

    return {
      file_url: publicUrl,
      thumbnail_url: thumbnailUrl,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload file');
  }
};

const formatDateForQuery = (date: Date): string => {
  return date.toISOString();
};

// ==================== MAIN API FUNCTIONS ====================

/**
 * Fetch custom orders for a seller with filtering and pagination
 */
export const getCustomOrders = async (
  sellerId: string,
  filters?: FilterParams,
  pagination?: PaginationParams
): Promise<{ data: CustomOrdersResponse | null; error: string | null }> => {
  try {
    if (!sellerId) {
      throw new Error('Seller ID is required');
    }

    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Build query
    let query = supabase
      .from('custom_orders')
      .select(`
        *,
        customer:customers(
          id,
          name,
          email,
          phone,
          avatar_url,
          company_name,
          created_at
        ),
        reference_product:products(
          id,
          name,
          sku,
          images
        ),
        assigned_agent:profiles(
          id,
          full_name,
          avatar_url
        )
      `, { count: 'exact' })
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status);
      } else {
        query = query.eq('status', filters.status);
      }
    }

    if (filters?.priority) {
      if (Array.isArray(filters.priority)) {
        query = query.in('priority', filters.priority);
      } else {
        query = query.eq('priority', filters.priority);
      }
    }

    if (filters?.category) {
      if (Array.isArray(filters.category)) {
        query = query.in('category', filters.category);
      } else {
        query = query.eq('category', filters.category);
      }
    }

    if (filters?.customer_id) {
      query = query.eq('customer_id', filters.customer_id);
    }

    if (filters?.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to);
    }

    if (filters?.date_from) {
      query = query.gte('created_at', filters.date_from);
    }

    if (filters?.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,order_number.ilike.%${filters.search}%`);
    }

    if (filters?.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags);
    }

    // Apply pagination
    query = query.range(from, to);

    const { data: orders, error, count } = await query;

    if (error) throw error;

    // Get message counts and unread status for each order
    const ordersWithStats = await Promise.all(
      (orders || []).map(async (order: any) => {
        // Get message count
        const { count: messageCount } = await supabase
          .from('custom_order_messages')
          .select('*', { count: 'exact', head: true })
          .eq('custom_order_id', order.id);

        // Get unread messages count for seller
        const { count: unreadCount } = await supabase
          .from('custom_order_messages')
          .select('*', { count: 'exact', head: true })
          .eq('custom_order_id', order.id)
          .eq('read_by_seller', false)
          .eq('sender_type', 'customer');

        // Get last message timestamp
        const { data: lastMessage } = await supabase
          .from('custom_order_messages')
          .select('created_at')
          .eq('custom_order_id', order.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        return {
          ...order,
          customer: order.customer || null,
          reference_product: order.reference_product || null,
          assigned_agent: order.assigned_agent || null,
          message_count: messageCount || 0,
          unread_messages: unreadCount || 0,
          last_message_at: lastMessage?.created_at || order.updated_at
        };
      })
    );

    // Get statistics
    const stats = await getCustomOrderStats(sellerId, filters);

    const totalPages = Math.ceil((count || 0) / limit);

    const response: CustomOrdersResponse = {
      orders: ordersWithStats,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_items: count || 0,
        items_per_page: limit,
        has_next_page: page < totalPages,
        has_previous_page: page > 1
      },
      stats
    };

    return { data: response, error: null };
  } catch (error) {
    console.error('Error fetching custom orders:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch custom orders'
    };
  }
};

/**
 * Get detailed statistics for custom orders
 */
export const getCustomOrderStats = async (
  sellerId: string,
  filters?: FilterParams
): Promise<CustomOrderStats> => {
  try {
    let query = supabase
      .from('custom_orders')
      .select('*')
      .eq('seller_id', sellerId);

    // Apply same filters
    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status);
      } else {
        query = query.eq('status', filters.status);
      }
    }

    if (filters?.date_from) {
      query = query.gte('created_at', filters.date_from);
    }

    if (filters?.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    const { data: orders, error } = await query;

    if (error) throw error;

    const totalOrders = orders?.length || 0;
    const pendingOrders = orders?.filter(o => o.status === CustomOrderStatus.PENDING).length || 0;
    const inProgressOrders = orders?.filter(o => o.status === CustomOrderStatus.IN_PROGRESS).length || 0;
    const completedOrders = orders?.filter(o => o.status === CustomOrderStatus.COMPLETED).length || 0;

    // Calculate revenue potential (sum of total_price for pending and in_progress orders)
    const revenuePotential = orders
      ?.filter(o => [CustomOrderStatus.PENDING, CustomOrderStatus.IN_PROGRESS, CustomOrderStatus.APPROVED].includes(o.status))
      .reduce((sum, order) => sum + (order.total_price || 0), 0) || 0;

    // Calculate average completion time for completed orders
    const completedOrdersWithDates = orders
      ?.filter(o => o.status === CustomOrderStatus.COMPLETED && o.created_at && o.actual_completion_date)
      .map(o => ({
        created: new Date(o.created_at),
        completed: new Date(o.actual_completion_date)
      })) || [];

    const totalCompletionDays = completedOrdersWithDates.reduce((sum, order) => {
      const diffTime = Math.abs(order.completed.getTime() - order.created.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return sum + diffDays;
    }, 0);

    const averageCompletionTimeDays = completedOrdersWithDates.length > 0
      ? totalCompletionDays / completedOrdersWithDates.length
      : 0;

    return {
      total_orders: totalOrders,
      pending_orders: pendingOrders,
      in_progress_orders: inProgressOrders,
      completed_orders: completedOrders,
      revenue_potential: revenuePotential,
      average_completion_time_days: Math.round(averageCompletionTimeDays * 100) / 100
    };
  } catch (error) {
    console.error('Error fetching custom order stats:', error);
    return {
      total_orders: 0,
      pending_orders: 0,
      in_progress_orders: 0,
      completed_orders: 0,
      revenue_potential: 0,
      average_completion_time_days: 0
    };
  }
};

/**
 * Fetch full details of a single custom order
 */
export const getCustomOrderDetails = async (
  customOrderId: string
): Promise<{ data: CustomOrder | null; error: string | null }> => {
  try {
    if (!customOrderId) {
      throw new Error('Custom Order ID is required');
    }

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from('custom_orders')
      .select(`
        *,
        customer:customers(
          id,
          name,
          email,
          phone,
          avatar_url,
          company_name,
          address,
          created_at
        ),
        reference_product:products(
          id,
          name,
          sku,
          price,
          images,
          description
        ),
        assigned_agent:profiles(
          id,
          full_name,
          email,
          avatar_url
        ),
        shipping_address:addresses(*)
      `)
      .eq('id', customOrderId)
      .single();

    if (orderError) throw orderError;

    // Fetch messages
    const { data: messages, error: messagesError } = await supabase
      .from('custom_order_messages')
      .select(`
        *,
        attachments:message_attachments(
          id,
          file_name,
          file_size,
          file_type,
          file_url,
          thumbnail_url
        )
      `)
      .eq('custom_order_id', customOrderId)
      .order('created_at', { ascending: true });

    if (messagesError) throw messagesError;

    // Fetch attachments
    const { data: attachments, error: attachmentsError } = await supabase
      .from('custom_order_attachments')
      .select('*')
      .eq('custom_order_id', customOrderId);

    if (attachmentsError) throw attachmentsError;

    // Mark seller messages as read
    await supabase
      .from('custom_order_messages')
      .update({ read_by_seller: true })
      .eq('custom_order_id', customOrderId)
      .eq('sender_type', 'customer')
      .eq('read_by_seller', false);

    const orderData: CustomOrder = {
      ...order,
      customer: order.customer || undefined,
      reference_product: order.reference_product || undefined,
      assigned_agent: order.assigned_agent || undefined,
      shipping_address: order.shipping_address || undefined,
      attachments: attachments || [],
      message_count: messages?.length || 0,
      unread_messages: 0 // After marking as read
    };

    return { data: orderData, error: null };
  } catch (error) {
    console.error('Error fetching custom order details:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch custom order details'
    };
  }
};

/**
 * Update the status of a custom order
 */
export const updateCustomOrderStatus = async (
  customOrderId: string,
  status: CustomOrderStatus,
  sellerId?: string,
  notes?: string
): Promise<{ data: CustomOrder | null; error: string | null }> => {
  try {
    if (!customOrderId) {
      throw new Error('Custom Order ID is required');
    }

    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    // Set completion date if status is completed
    if (status === CustomOrderStatus.COMPLETED) {
      updateData.actual_completion_date = new Date().toISOString();
    }

    // Set cancellation date if status is cancelled
    if (status === CustomOrderStatus.CANCELLED) {
      updateData.cancelled_at = new Date().toISOString();
    }

    // If sellerId is provided, ensure they own the order
    if (sellerId) {
      const { data: existingOrder, error: fetchError } = await supabase
        .from('custom_orders')
        .select('seller_id')
        .eq('id', customOrderId)
        .single();

      if (fetchError) throw fetchError;
      if (existingOrder.seller_id !== sellerId) {
        throw new Error('Unauthorized to update this order');
      }
    }

    const { data: updatedOrder, error } = await supabase
      .from('custom_orders')
      .update(updateData)
      .eq('id', customOrderId)
      .select(`
        *,
        customer:customers(
          id,
          name,
          email
        )
      `)
      .single();

    if (error) throw error;

    // Add status change note to messages if notes provided
    if (notes) {
      await sendCustomOrderMessage({
        custom_order_id: customOrderId,
        sender_id: sellerId || 'system',
        sender_type: 'seller',
        message: `Status changed to ${status}: ${notes}`,
        internal_note: true
      });
    }

    return { data: updatedOrder, error: null };
  } catch (error) {
    console.error('Error updating custom order status:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update custom order status'
    };
  }
};

/**
 * Send a message to a custom order conversation
 */
export const sendCustomOrderMessage = async (
  messageData: SendMessageData
): Promise<{ data: CustomOrderMessage | null; error: string | null }> => {
  try {
    if (!messageData.custom_order_id) {
      throw new Error('Custom Order ID is required');
    }

    if (!messageData.message?.trim()) {
      throw new Error('Message content is required');
    }

    // Upload attachments if any
    const attachments: MessageAttachment[] = [];
    if (messageData.attachments && messageData.attachments.length > 0) {
      const uploadPromises = messageData.attachments.map(file => uploadFile(file, 'custom-order-attachments', 'messages'));
      const uploadedFiles = await Promise.all(uploadPromises);
      
      attachments.push(...uploadedFiles.map(file => ({
        id: uuidv4(),
        message_id: '', // Will be set after message creation
        file_name: file.file_name,
        file_size: file.file_size,
        file_type: file.file_type,
        file_url: file.file_url,
        thumbnail_url: file.thumbnail_url,
        uploaded_at: new Date().toISOString()
      })));
    }

    // Create message in database
    const messageId = uuidv4();
    const { error: messageError } = await supabase
      .from('custom_order_messages')
      .insert({
        id: messageId,
        custom_order_id: messageData.custom_order_id,
        sender_id: messageData.sender_id,
        sender_type: messageData.sender_type,
        sender_name: messageData.sender_type === 'seller' ? 'Seller' : 'Customer',
        message: messageData.message,
        internal_note: messageData.internal_note || false,
        read_by_seller: messageData.sender_type === 'seller' ? true : false,
        read_by_customer: messageData.sender_type === 'customer' ? true : false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (messageError) throw messageError;

    // Insert attachments if any
    if (attachments.length > 0) {
      const attachmentsToInsert = attachments.map(att => ({
        ...att,
        message_id: messageId
      }));

      const { error: attachmentsError } = await supabase
        .from('message_attachments')
        .insert(attachmentsToInsert);

      if (attachmentsError) throw attachmentsError;
    }

    // Update custom order's updated_at timestamp
    const { error: orderError } = await supabase
      .from('custom_orders')
      .update({ 
        updated_at: new Date().toISOString(),
        last_message_at: new Date().toISOString()
      })
      .eq('id', messageData.custom_order_id);

    if (orderError) throw orderError;

    // Fetch the complete message with attachments
    const { data: completeMessage, error: fetchError } = await supabase
      .from('custom_order_messages')
      .select(`
        *,
        attachments:message_attachments(
          id,
          file_name,
          file_size,
          file_type,
          file_url,
          thumbnail_url
        )
      `)
      .eq('id', messageId)
      .single();

    if (fetchError) throw fetchError;

    return { data: completeMessage, error: null };
  } catch (error) {
    console.error('Error sending custom order message:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to send message'
    };
  }
};

/**
 * Update custom order details
 */
export const updateCustomOrder = async (
  customOrderId: string,
  updateData: UpdateCustomOrderData,
  sellerId?: string
): Promise<{ data: CustomOrder | null; error: string | null }> => {
  try {
    if (!customOrderId) {
      throw new Error('Custom Order ID is required');
    }

    // Validate status transitions
    if (updateData.status) {
      const { data: currentOrder, error: fetchError } = await supabase
        .from('custom_orders')
        .select('status')
        .eq('id', customOrderId)
        .single();

      if (fetchError) throw fetchError;

      // Validate status transition
      const validTransitions: Record<CustomOrderStatus, CustomOrderStatus[]> = {
        [CustomOrderStatus.PENDING]: [CustomOrderStatus.IN_PROGRESS, CustomOrderStatus.REJECTED, CustomOrderStatus.CANCELLED],
        [CustomOrderStatus.IN_PROGRESS]: [CustomOrderStatus.REVIEW, CustomOrderStatus.COMPLETED, CustomOrderStatus.CANCELLED],
        [CustomOrderStatus.REVIEW]: [CustomOrderStatus.APPROVED, CustomOrderStatus.IN_PROGRESS, CustomOrderStatus.CANCELLED],
        [CustomOrderStatus.APPROVED]: [CustomOrderStatus.IN_PROGRESS, CustomOrderStatus.COMPLETED, CustomOrderStatus.CANCELLED],
        [CustomOrderStatus.REJECTED]: [CustomOrderStatus.PENDING, CustomOrderStatus.CANCELLED],
        [CustomOrderStatus.COMPLETED]: [],
        [CustomOrderStatus.CANCELLED]: [],
        [CustomOrderStatus.ARCHIVED]: []
      };

      if (!validTransitions[currentOrder.status]?.includes(updateData.status)) {
        throw new Error(`Invalid status transition from ${currentOrder.status} to ${updateData.status}`);
      }
    }

    const updatePayload = {
      ...updateData,
      updated_at: new Date().toISOString()
    };

    // If sellerId is provided, ensure they own the order
    if (sellerId) {
      const { data: existingOrder, error: fetchError } = await supabase
        .from('custom_orders')
        .select('seller_id')
        .eq('id', customOrderId)
        .single();

      if (fetchError) throw fetchError;
      if (existingOrder.seller_id !== sellerId) {
        throw new Error('Unauthorized to update this order');
      }
    }

    const { data: updatedOrder, error } = await supabase
      .from('custom_orders')
      .update(updatePayload)
      .eq('id', customOrderId)
      .select(`
        *,
        customer:customers(
          id,
          name,
          email
        )
      `)
      .single();

    if (error) throw error;

    return { data: updatedOrder, error: null };
  } catch (error) {
    console.error('Error updating custom order:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update custom order'
    };
  }
};

/**
 * Create a new custom order
 */
export const createCustomOrder = async (
  orderData: CreateCustomOrderData
): Promise<{ data: CustomOrder | null; error: string | null }> => {
  try {
    if (!orderData.seller_id || !orderData.customer_id || !orderData.title || !orderData.description) {
      throw new Error('Missing required fields');
    }

    // Generate order number
    const orderNumber = generateOrderNumber();

    // Calculate SLA due date based on priority
    const slaHours = {
      [CustomOrderPriority.URGENT]: 24,
      [CustomOrderPriority.HIGH]: 48,
      [CustomOrderPriority.MEDIUM]: 72,
      [CustomOrderPriority.LOW]: 120
    }[orderData.priority];

    const slaDueAt = new Date();
    slaDueAt.setHours(slaDueAt.getHours() + slaHours);

    // Upload reference images if any
    const referenceImages: string[] = [];
    if (orderData.reference_images && orderData.reference_images.length > 0) {
      const uploadPromises = orderData.reference_images.map(file => uploadFile(file, 'custom-order-attachments', 'reference-images'));
      const uploadedFiles = await Promise.all(uploadPromises);
      referenceImages.push(...uploadedFiles.map(file => file.file_url));
    }

    // Create order in database
    const orderId = uuidv4();
    const { error: orderError } = await supabase
      .from('custom_orders')
      .insert({
        id: orderId,
        order_number: orderNumber,
        seller_id: orderData.seller_id,
        customer_id: orderData.customer_id,
        title: orderData.title,
        description: orderData.description,
        category: orderData.category,
        priority: orderData.priority,
        status: CustomOrderStatus.PENDING,
        budget_range: orderData.budget_min && orderData.budget_max ? {
          min: orderData.budget_min,
          max: orderData.budget_max,
          currency: 'SAR'
        } : undefined,
        deadline: orderData.deadline,
        reference_product_id: orderData.reference_product_id,
        reference_images: referenceImages,
        material_preferences: orderData.material_preferences,
        color_preferences: orderData.color_preferences,
        dimensions: orderData.dimensions,
        quantity: orderData.quantity || 1,
        shipping_address: orderData.shipping_address,
        installation_required: orderData.installation_required || false,
        special_instructions: orderData.special_instructions,
        tags: orderData.tags || [],
        sla_due_at: slaDueAt.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (orderError) throw orderError;

    // Add initial message with order description
    await sendCustomOrderMessage({
      custom_order_id: orderId,
      sender_id: orderData.customer_id,
      sender_type: 'customer',
      message: `New custom order request: ${orderData.description}`
    });

    // Fetch and return the created order
    const { data: createdOrder, error: fetchError } = await getCustomOrderDetails(orderId);
    
    if (fetchError) throw new Error(fetchError);

    return { data: createdOrder, error: null };
  } catch (error) {
    console.error('Error creating custom order:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to create custom order'
    };
  }
};

/**
 * Delete a custom order (soft delete)
 */
export const deleteCustomOrder = async (
  customOrderId: string,
  sellerId: string
): Promise<{ success: boolean; error: string | null }> => {
  try {
    if (!customOrderId || !sellerId) {
      throw new Error('Custom Order ID and Seller ID are required');
    }

    // Verify ownership
    const { data: existingOrder, error: fetchError } = await supabase
      .from('custom_orders')
      .select('seller_id, status')
      .eq('id', customOrderId)
      .single();

    if (fetchError) throw fetchError;
    if (existingOrder.seller_id !== sellerId) {
      throw new Error('Unauthorized to delete this order');
    }

    // Only allow deletion of pending or cancelled orders
    if (![CustomOrderStatus.PENDING, CustomOrderStatus.CANCELLED].includes(existingOrder.status)) {
      throw new Error('Cannot delete orders that are not pending or cancelled');
    }

    // Update status to archived (soft delete)
    const { error } = await supabase
      .from('custom_orders')
      .update({
        status: CustomOrderStatus.ARCHIVED,
        updated_at: new Date().toISOString()
      })
      .eq('id', customOrderId)
      .eq('seller_id', sellerId);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting custom order:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete custom order'
    };
  }
};

// ==================== MOCK DATA FOR DEVELOPMENT ====================

export const getMockCustomOrders = (sellerId: string): CustomOrder[] => [
  {
    id: 'custom-order-1',
    order_number: 'CUSTOM-240115-001',
    seller_id: sellerId,
    customer_id: 'customer-1',
    customer: {
      id: 'customer-1',
      name: 'Ahmed Al-Mansoor',
      email: 'ahmed@example.com',
      phone: '+966551234567',
      company_name: 'Al-Mansoor Trading',
      total_orders: 5,
      total_spent: 25000,
      customer_since: '2023-06-15T10:30:00Z'
    },
    title: 'Custom Executive Desk with Built-in Storage',
    description: 'Need a large executive desk with built-in filing cabinets and cable management',
    detailed_requirements: 'Wood finish, dark walnut color, L-shaped design, minimum width 200cm',
    status: CustomOrderStatus.IN_PROGRESS,
    category: CustomOrderCategory.FURNITURE,
    priority: CustomOrderPriority.HIGH,
    budget_range: {
      min: 5000,
      max: 8000,
      currency: 'SAR'
    },
    deadline: '2024-02-15T00:00:00Z',
    estimated_completion_date: '2024-02-10T00:00:00Z',
    reference_product_id: 'prod-123',
    reference_images: [
      'https://example.com/desk-reference-1.jpg',
      'https://example.com/desk-reference-2.jpg'
    ],
    material_preferences: ['Solid Wood', 'Walnut Finish'],
    color_preferences: ['Dark Brown', 'Walnut'],
    dimensions: {
      width: 200,
      height: 75,
      depth: 80,
      unit: 'cm'
    },
    quantity: 1,
    unit_price: 6500,
    total_price: 6500,
    deposit_paid: 1950,
    deposit_paid_at: '2024-01-16T14:30:00Z',
    installation_required: true,
    special_instructions: 'Need delivery and installation in Riyadh city center',
    tags: ['executive', 'desk', 'custom', 'office'],
    attachments: [],
    assigned_to: sellerId,
    created_at: '2024-01-15T09:00:00Z',
    updated_at: '2024-01-20T14:30:00Z',
    last_message_at: '2024-01-20T14:30:00Z',
    message_count: 8,
    unread_messages: 2,
    estimated_delivery_days: 25,
    sla_due_at: '2024-01-17T09:00:00Z'
  },
  {
    id: 'custom-order-2',
    order_number: 'CUSTOM-240114-002',
    seller_id: sellerId,
    customer_id: 'customer-2',
    customer: {
      id: 'customer-2',
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      total_orders: 12,
      total_spent: 45000,
      customer_since: '2022-11-08T15:45:00Z'
    },
    title: 'Custom Bookshelf for Home Library',
    description: 'Floor-to-ceiling bookshelf with adjustable shelves and lighting',
    status: CustomOrderStatus.PENDING,
    category: CustomOrderCategory.FURNITURE,
    priority: CustomOrderPriority.MEDIUM,
    budget_range: {
      min: 3000,
      max: 5000,
      currency: 'SAR'
    },
    deadline: '2024-03-01T00:00:00Z',
    quantity: 1,
    installation_required: false,
    tags: ['bookshelf', 'library', 'custom'],
    attachments: [],
    created_at: '2024-01-14T14:20:00Z',
    updated_at: '2024-01-14T14:20:00Z',
    last_message_at: '2024-01-14T14:20:00Z',
    message_count: 1,
    unread_messages: 0
  },
  {
    id: 'custom-order-3',
    order_number: 'CUSTOM-240113-003',
    seller_id: sellerId,
    customer_id: 'customer-3',
    customer: {
      id: 'customer-3',
      name: 'Mohammed Khan',
      email: 'mohammed@example.com',
      phone: '+966552345678',
      company_name: 'Khan Enterprises'
    },
    title: 'Conference Table for 20 People',
    description: 'Large oval conference table with power outlets and network ports',
    status: CustomOrderStatus.REVIEW,
    category: CustomOrderCategory.OFFICE_EQUIPMENT,
    priority: CustomOrderPriority.URGENT,
    budget_range: {
      min: 15000,
      max: 25000,
      currency: 'SAR'
    },
    deadline: '2024-01-31T00:00:00Z',
    estimated_completion_date: '2024-01-30T00:00:00Z',
    quantity: 1,
    unit_price: 18000,
    total_price: 18000,
    deposit_paid: 5400,
    deposit_paid_at: '2024-01-13T16:45:00Z',
    installation_required: true,
    tags: ['conference', 'table', 'office', 'urgent'],
    attachments: [],
    created_at: '2024-01-13T11:15:00Z',
    updated_at: '2024-01-19T10:30:00Z',
    last_message_at: '2024-01-19T10:30:00Z',
    message_count: 15,
    unread_messages: 1
  },
  {
    id: 'custom-order-4',
    order_number: 'CUSTOM-240112-004',
    seller_id: sellerId,
    customer_id: 'customer-4',
    customer: {
      id: 'customer-4',
      name: 'Fatima Al-Sayed',
      email: 'fatima@example.com'
    },
    title: 'Repair of Antique Wooden Chair',
    description: 'Restoration of antique chair with carving details',
    status: CustomOrderStatus.COMPLETED,
    category: CustomOrderCategory.REPAIR,
    priority: CustomOrderPriority.LOW,
    budget_range: {
      min: 800,
      max: 1200,
      currency: 'SAR'
    },
    actual_completion_date: '2024-01-18T17:30:00Z',
    quantity: 1,
    unit_price: 950,
    total_price: 950,
    full_payment_paid: 950,
    full_payment_paid_at: '2024-01-18T17:30:00Z',
    installation_required: false,
    tags: ['repair', 'antique', 'restoration'],
    attachments: [],
    created_at: '2024-01-12T10:45:00Z',
    updated_at: '2024-01-18T17:30:00Z',
    last_message_at: '2024-01-18T17:30:00Z',
    message_count: 6,
    unread_messages: 0
  },
  {
    id: 'custom-order-5',
    order_number: 'CUSTOM-240111-005',
    seller_id: sellerId,
    customer_id: 'customer-5',
    customer: {
      id: 'customer-5',
      name: 'Robert Chen',
      email: 'robert@example.com',
      company_name: 'Chen Design Studio'
    },
    title: 'Custom Outdoor Dining Set',
    description: 'Weather-resistant dining set for 8 people with umbrella hole',
    status: CustomOrderStatus.CANCELLED,
    category: CustomOrderCategory.OUTDOOR,
    priority: CustomOrderPriority.MEDIUM,
    budget_range: {
      min: 7000,
      max: 10000,
      currency: 'SAR'
    },
    cancelled_at: '2024-01-12T11:20:00Z',
    quantity: 1,
    tags: ['outdoor', 'dining', 'cancelled'],
    attachments: [],
    created_at: '2024-01-11T09:30:00Z',
    updated_at: '2024-01-12T11:20:00Z',
    last_message_at: '2024-01-12T11:20:00Z',
    message_count: 4,
    unread_messages: 0
  }
];

export const getMockCustomOrderDetails = (orderId: string): CustomOrder => {
  const mockOrders = getMockCustomOrders('seller-123');
  return mockOrders.find(order => order.id === orderId) || mockOrders[0];
};

// ==================== DATABASE SCHEMA HELPERS ====================

/*
-- SQL for required tables (run in Supabase SQL editor)

1. custom_orders table:

CREATE TABLE IF NOT EXISTS custom_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number VARCHAR(50) NOT NULL UNIQUE,
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  detailed_requirements TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  category VARCHAR(50) NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'medium',
  budget_range JSONB,
  deadline TIMESTAMP WITH TIME ZONE,
  estimated_completion_date TIMESTAMP WITH TIME ZONE,
  actual_completion_date TIMESTAMP WITH TIME ZONE,
  reference_product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  reference_images TEXT[] DEFAULT '{}',
  material_preferences TEXT[] DEFAULT '{}',
  color_preferences TEXT[] DEFAULT '{}',
  dimensions JSONB,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2),
  total_price DECIMAL(10,2),
  deposit_paid DECIMAL(10,2) DEFAULT 0,
  deposit_paid_at TIMESTAMP WITH TIME ZONE,
  full_payment_paid DECIMAL(10,2) DEFAULT 0,
  full_payment_paid_at TIMESTAMP WITH TIME ZONE,
  shipping_address JSONB,
  installation_required BOOLEAN DEFAULT FALSE,
  special_instructions TEXT,
  tags TEXT[] DEFAULT '{}',
  assigned_to UUID,
  assigned_agent VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE,
  estimated_delivery_days INTEGER,
  sla_due_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX idx_custom_orders_seller_id ON custom_orders(seller_id);
CREATE INDEX idx_custom_orders_status ON custom_orders(status);
CREATE INDEX idx_custom_orders_priority ON custom_orders(priority);
CREATE INDEX idx_custom_orders_customer_id ON custom_orders(customer_id);
CREATE INDEX idx_custom_orders_order_number ON custom_orders(order_number);
CREATE INDEX idx_custom_orders_created_at ON custom_orders(created_at DESC);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_custom_order_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_custom_orders_updated_at 
  BEFORE UPDATE ON custom_orders 
  FOR EACH ROW 
  EXECUTE FUNCTION update_custom_order_updated_at();

2. custom_order_messages table:

CREATE TABLE IF NOT EXISTS custom_order_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  custom_order_id UUID NOT NULL REFERENCES custom_orders(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('seller', 'customer', 'support')),
  sender_name VARCHAR(255) NOT NULL,
  sender_avatar TEXT,
  message TEXT NOT NULL,
  internal_note BOOLEAN DEFAULT FALSE,
  read_by_seller BOOLEAN DEFAULT FALSE,
  read_by_customer BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_custom_order_messages_order_id ON custom_order_messages(custom_order_id);
CREATE INDEX idx_custom_order_messages_created_at ON custom_order_messages(created_at);
CREATE INDEX idx_custom_order_messages_sender_type ON custom_order_messages(sender_type);

3. custom_order_attachments table:

CREATE TABLE IF NOT EXISTS custom_order_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  custom_order_id UUID NOT NULL REFERENCES custom_orders(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  uploaded_by UUID NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_custom_order_attachments_order_id ON custom_order_attachments(custom_order_id);

4. message_attachments table:

CREATE TABLE IF NOT EXISTS message_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES custom_order_messages(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_message_attachments_message_id ON message_attachments(message_id);

5. Function to get custom order statistics:

CREATE OR REPLACE FUNCTION get_custom_order_stats(
  p_seller_id UUID,
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
  total_orders BIGINT,
  pending_orders BIGINT,
  in_progress_orders BIGINT,
  completed_orders BIGINT,
  revenue_potential DECIMAL,
  avg_completion_days DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH order_stats AS (
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
      COUNT(CASE WHEN status IN ('in_progress', 'review', 'approved') THEN 1 END) as in_progress,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
      SUM(CASE WHEN status IN ('pending', 'in_progress', 'review', 'approved') THEN total_price ELSE 0 END) as potential_revenue,
      AVG(
        EXTRACT(EPOCH FROM (actual_completion_date - created_at)) / 86400
      ) as avg_days
    FROM custom_orders
    WHERE seller_id = p_seller_id
      AND created_at BETWEEN p_start_date AND p_end_date
  )
  SELECT 
    stats.total,
    stats.pending,
    stats.in_progress,
    stats.completed,
    COALESCE(stats.potential_revenue, 0),
    COALESCE(stats.avg_days, 0)
  FROM order_stats stats;
END;
$$ LANGUAGE plpgsql;
*/

export default {
  getCustomOrders,
  getCustomOrderDetails,
  updateCustomOrderStatus,
  updateCustomOrder,
  sendCustomOrderMessage,
  createCustomOrder,
  deleteCustomOrder,
  getCustomOrderStats
};