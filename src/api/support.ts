// src/api/support.ts
import { supabase } from '@/lib/supabase';
import { PostgrestResponse } from '@supabase/supabase-js';

// ============================================================================
// INTERFACES
// ============================================================================

export interface SupportTicket {
  id: string;
  ticket_number: string;
  seller_id: string;
  title: string;
  category: TicketCategory;
  subcategory: TicketSubcategory;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  department: TicketDepartment;
  tags: string[];
  metadata: Record<string, any>;
  assigned_agent: TicketAgent | null;
  assigned_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  last_message_at: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  unread_count: number;
  seller: {
    business_name: string;
    contact_email: string;
    contact_phone: string;
  };
}

export interface SupportTicketWithMessages extends SupportTicket {
  messages: SupportMessage[];
  attachments: TicketAttachment[];
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_type: 'seller' | 'support_agent' | 'system';
  sender_id: string | null;
  message: string;
  is_internal_note: boolean;
  attachments: string[];
  read_by_seller: boolean;
  read_by_agent: boolean;
  created_at: string;
  updated_at: string;
  sender_details: {
    name: string;
    email: string;
    avatar_url?: string;
    role?: string;
  } | null;
}

export interface TicketAttachment {
  id: string;
  ticket_id: string;
  message_id: string | null;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  uploaded_by: string;
  uploaded_at: string;
}

export interface TicketAgent {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  department: string;
  is_available: boolean;
}

export interface CreateTicketInput {
  title: string;
  description: string;
  category: TicketCategory;
  subcategory: TicketSubcategory;
  priority: TicketPriority;
  attachments?: File[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export type TicketStatus = 'open' | 'pending' | 'in_progress' | 'resolved' | 'closed' | 'reopened';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketCategory = 'technical' | 'billing' | 'account' | 'product' | 'shipping' | 'refund' | 'general';
export type TicketDepartment = 'technical_support' | 'billing_support' | 'seller_support' | 'general_support';

export const TICKET_SUBCATEGORIES: Record<TicketCategory, string[]> = {
  technical: ['website', 'dashboard', 'api', 'integration', 'bug', 'performance'],
  billing: ['invoice', 'payment', 'payout', 'vat', 'refund', 'commission'],
  account: ['verification', 'suspension', 'profile', 'security', 'access'],
  product: ['listing', 'category', 'pricing', 'inventory', 'approval'],
  shipping: ['delivery', 'tracking', 'carrier', 'lost_package', 'damage'],
  refund: ['request', 'dispute', 'chargeback', 'return'],
  general: ['question', 'feedback', 'suggestion', 'complaint'],
};

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'Open',
  pending: 'Pending',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
  reopened: 'Reopened',
};

export const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export const TICKET_CATEGORY_LABELS: Record<TicketCategory, string> = {
  technical: 'Technical',
  billing: 'Billing',
  account: 'Account',
  product: 'Product',
  shipping: 'Shipping',
  refund: 'Refund',
  general: 'General',
};

const STORAGE_BUCKET = 'support-attachments';
const DEFAULT_PAGE_SIZE = 15;
const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf', 
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'application/zip',
  'application/x-rar-compressed',
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const handleSupabaseError = (error: any): Error => {
  console.error('Supabase support error:', error);
  return new Error(error.message || 'Support ticket operation failed');
};

const validateSellerId = (sellerId: string): void => {
  if (!sellerId || typeof sellerId !== 'string') {
    throw new Error('Invalid seller ID');
  }
};

const validateTicketId = (ticketId: string): void => {
  if (!ticketId || typeof ticketId !== 'string') {
    throw new Error('Invalid ticket ID');
  }
};

const generateTicketNumber = (): string => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `TICKET-${timestamp}-${random}`;
};

const validateFile = (file: File): void => {
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    throw new Error(`Invalid file type. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`);
  }

  if (file.size > MAX_ATTACHMENT_SIZE) {
    throw new Error(`File too large. Max size: ${MAX_ATTACHMENT_SIZE / 1024 / 1024}MB`);
  }
};

const generateFileName = (ticketId: string, file: File): string => {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const extension = file.name.split('.').pop();
  return `${ticketId}/${timestamp}-${safeName}`;
};

const uploadAttachment = async (
  ticketId: string,
  file: File,
  messageId: string | null = null
): Promise<TicketAttachment> => {
  validateFile(file);
  
  const fileName = generateFileName(ticketId, file);
  const filePath = `tickets/${fileName}`;

  // Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filePath);

  // Create attachment record
  const attachment: Omit<TicketAttachment, 'id' | 'uploaded_at'> = {
    ticket_id: ticketId,
    message_id: messageId,
    file_name: file.name,
    file_url: publicUrlData.publicUrl,
    file_type: file.type,
    file_size: file.size,
    uploaded_by: (await supabase.auth.getUser()).data.user?.id || 'system',
  };

  const { data, error } = await supabase
    .from('support_attachments')
    .insert(attachment)
    .select()
    .single();

  if (error) {
    // Clean up uploaded file if DB insert fails
    await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([filePath]);
    throw error;
  }

  return data;
};

// ============================================================================
// MAIN API FUNCTIONS
// ============================================================================

/**
 * Fetch all support tickets for a seller with pagination and filtering
 */
export const getSupportTickets = async (
  sellerId: string,
  page: number = 1,
  limit: number = DEFAULT_PAGE_SIZE,
  statusFilter?: TicketStatus,
  priorityFilter?: TicketPriority,
  categoryFilter?: TicketCategory
): Promise<ApiResponse<PaginatedResponse<SupportTicket>>> => {
  try {
    validateSellerId(sellerId);

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('support_tickets')
      .select(`
        *,
        seller:seller_id (
          business_name,
          contact_email,
          contact_phone
        )
      `, { count: 'exact' })
      .eq('seller_id', sellerId)
      .order('last_message_at', { ascending: false });

    // Apply filters
    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    if (priorityFilter && priorityFilter !== 'all') {
      query = query.eq('priority', priorityFilter);
    }

    if (categoryFilter && categoryFilter !== 'all') {
      query = query.eq('category', categoryFilter);
    }

    // Add pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    // Transform data
    const tickets: SupportTicket[] = (data || []).map(ticket => ({
      ...ticket,
      seller: ticket.seller,
      message_count: 0, // Will be populated by separate query
      unread_count: 0, // Will be populated by separate query
    }));

    // Get message counts for each ticket
    const ticketIds = tickets.map(t => t.id);
    if (ticketIds.length > 0) {
      const { data: messageStats } = await supabase
        .from('support_messages')
        .select('ticket_id, read_by_seller')
        .in('ticket_id', ticketIds)
        .eq('sender_type', 'support_agent');

      // Update tickets with counts
      tickets.forEach(ticket => {
        const ticketMessages = messageStats?.filter(m => m.ticket_id === ticket.id) || [];
        ticket.message_count = ticketMessages.length;
        ticket.unread_count = ticketMessages.filter(m => !m.read_by_seller).length;
      });
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    const paginatedResponse: PaginatedResponse<SupportTicket> = {
      data: tickets,
      total,
      page,
      limit,
      total_pages: totalPages,
      has_next: page < totalPages,
      has_prev: page > 1,
    };

    return { data: paginatedResponse, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

/**
 * Fetch complete details of a single support ticket
 */
export const getSupportTicketDetails = async (
  ticketId: string,
  sellerId?: string
): Promise<ApiResponse<SupportTicketWithMessages>> => {
  try {
    validateTicketId(ticketId);

    // Build query with optional seller validation
    let query = supabase
      .from('support_tickets')
      .select(`
        *,
        seller:seller_id (
          business_name,
          contact_email,
          contact_phone
        ),
        assigned_agent:assigned_agent_id (
          id,
          name,
          email,
          avatar_url,
          department,
          is_available
        )
      `)
      .eq('id', ticketId);

    // Add seller validation if provided
    if (sellerId) {
      query = query.eq('seller_id', sellerId);
    }

    const { data: ticket, error: ticketError } = await query.single();

    if (ticketError) {
      throw ticketError;
    }

    // Fetch all messages for this ticket
    const { data: messages, error: messagesError } = await supabase
      .from('support_messages')
      .select(`
        *,
        sender_details:profiles!support_messages_sender_id_fkey (
          full_name,
          email,
          avatar_url,
          role
        )
      `)
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      throw messagesError;
    }

    // Fetch all attachments for this ticket
    const { data: attachments, error: attachmentsError } = await supabase
      .from('support_attachments')
      .select('*')
      .eq('ticket_id', ticketId);

    if (attachmentsError) {
      throw attachmentsError;
    }

    // Mark seller messages as read
    if (sellerId) {
      await markMessagesAsRead(ticketId, sellerId);
    }

    // Transform messages
    const transformedMessages: SupportMessage[] = (messages || []).map(msg => ({
      ...msg,
      sender_details: msg.sender_details ? {
        name: msg.sender_details.full_name || 'Unknown',
        email: msg.sender_details.email || '',
        avatar_url: msg.sender_details.avatar_url,
        role: msg.sender_details.role,
      } : null,
    }));

    const ticketWithMessages: SupportTicketWithMessages = {
      ...ticket,
      seller: ticket.seller,
      assigned_agent: ticket.assigned_agent,
      messages: transformedMessages,
      attachments: attachments || [],
      message_count: messages?.length || 0,
      unread_count: 0, // All messages marked as read
    };

    return { data: ticketWithMessages, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

/**
 * Create a new support ticket with initial message
 */
export const createSupportTicket = async (
  sellerId: string,
  ticketData: CreateTicketInput
): Promise<ApiResponse<SupportTicketWithMessages>> => {
  try {
    validateSellerId(sellerId);

    // Get seller info
    const { data: seller, error: sellerError } = await supabase
      .from('sellers')
      .select('business_name, contact_email, contact_phone')
      .eq('user_id', sellerId)
      .single();

    if (sellerError) {
      throw sellerError;
    }

    // Generate ticket number
    const ticketNumber = generateTicketNumber();

    // Create ticket
    const ticket: Omit<SupportTicket, 'id' | 'seller' | 'assigned_agent' | 'created_at' | 'updated_at' | 'message_count' | 'unread_count'> = {
      ticket_number: ticketNumber,
      seller_id: sellerId,
      title: ticketData.title,
      category: ticketData.category,
      subcategory: ticketData.subcategory,
      description: ticketData.description,
      status: 'open',
      priority: ticketData.priority,
      department: getDepartmentForCategory(ticketData.category),
      tags: [ticketData.category, ticketData.subcategory],
      metadata: {
        created_via: 'seller_dashboard',
        initial_priority: ticketData.priority,
      },
      assigned_agent: null,
      assigned_at: null,
      resolved_at: null,
      closed_at: null,
      last_message_at: new Date().toISOString(),
    };

    const { data: createdTicket, error: ticketError } = await supabase
      .from('support_tickets')
      .insert(ticket)
      .select(`
        *,
        seller:seller_id (
          business_name,
          contact_email,
          contact_phone
        )
      `)
      .single();

    if (ticketError) {
      throw ticketError;
    }

    // Create initial message
    const initialMessage: Omit<SupportMessage, 'id' | 'sender_details' | 'created_at' | 'updated_at'> = {
      ticket_id: createdTicket.id,
      sender_type: 'seller',
      sender_id: sellerId,
      message: ticketData.description,
      is_internal_note: false,
      attachments: [],
      read_by_seller: true,
      read_by_agent: false,
    };

    const { data: createdMessage, error: messageError } = await supabase
      .from('support_messages')
      .insert(initialMessage)
      .select(`
        *,
        sender_details:profiles!support_messages_sender_id_fkey (
          full_name,
          email,
          avatar_url,
          role
        )
      `)
      .single();

    if (messageError) {
      // Rollback ticket creation
      await supabase
        .from('support_tickets')
        .delete()
        .eq('id', createdTicket.id);
      throw messageError;
    }

    // Upload attachments if provided
    let attachments: TicketAttachment[] = [];
    if (ticketData.attachments && ticketData.attachments.length > 0) {
      const uploadPromises = ticketData.attachments.map(file =>
        uploadAttachment(createdTicket.id, file, createdMessage.id)
      );
      
      try {
        attachments = await Promise.all(uploadPromises);
        
        // Update message with attachment URLs
        const attachmentUrls = attachments.map(att => att.file_url);
        await supabase
          .from('support_messages')
          .update({ attachments: attachmentUrls })
          .eq('id', createdMessage.id);
      } catch (uploadError) {
        // Continue even if attachments fail
        console.error('Attachment upload failed:', uploadError);
      }
    }

    // Transform response
    const transformedMessage: SupportMessage = {
      ...createdMessage,
      sender_details: createdMessage.sender_details ? {
        name: seller.business_name,
        email: seller.contact_email,
        avatar_url: createdMessage.sender_details.avatar_url,
        role: 'seller',
      } : {
        name: seller.business_name,
        email: seller.contact_email,
        role: 'seller',
      },
    };

    const ticketWithMessages: SupportTicketWithMessages = {
      ...createdTicket,
      seller,
      assigned_agent: null,
      messages: [transformedMessage],
      attachments,
      message_count: 1,
      unread_count: 0,
    };

    return { data: ticketWithMessages, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

/**
 * Add a response to an existing support ticket
 */
export const respondToTicket = async (
  ticketId: string,
  sellerId: string,
  message: string,
  attachments?: File[],
  isInternalNote: boolean = false
): Promise<ApiResponse<SupportMessage>> => {
  try {
    validateTicketId(ticketId);
    validateSellerId(sellerId);

    // Verify ticket exists and belongs to seller
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select('status, seller_id')
      .eq('id', ticketId)
      .single();

    if (ticketError) {
      throw ticketError;
    }

    if (ticket.seller_id !== sellerId) {
      throw new Error('Unauthorized access to ticket');
    }

    if (['closed', 'resolved'].includes(ticket.status)) {
      throw new Error('Cannot respond to a closed or resolved ticket');
    }

    // Create message
    const newMessage: Omit<SupportMessage, 'id' | 'sender_details' | 'created_at' | 'updated_at'> = {
      ticket_id: ticketId,
      sender_type: 'seller',
      sender_id: sellerId,
      message,
      is_internal_note: isInternalNote,
      attachments: [],
      read_by_seller: true,
      read_by_agent: false,
    };

    const { data: createdMessage, error: messageError } = await supabase
      .from('support_messages')
      .insert(newMessage)
      .select(`
        *,
        sender_details:profiles!support_messages_sender_id_fkey (
          full_name,
          email,
          avatar_url,
          role
        )
      `)
      .single();

    if (messageError) {
      throw messageError;
    }

    // Upload attachments if provided
    if (attachments && attachments.length > 0) {
      const uploadPromises = attachments.map(file =>
        uploadAttachment(ticketId, file, createdMessage.id)
      );
      
      try {
        const uploadedAttachments = await Promise.all(uploadPromises);
        
        // Update message with attachment URLs
        const attachmentUrls = uploadedAttachments.map(att => att.file_url);
        await supabase
          .from('support_messages')
          .update({ attachments: attachmentUrls })
          .eq('id', createdMessage.id);
        
        createdMessage.attachments = attachmentUrls;
      } catch (uploadError) {
        console.error('Attachment upload failed:', uploadError);
      }
    }

    // Update ticket's last message timestamp and status
    const updateData: any = {
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // If ticket was resolved, reopen it when seller responds
    if (ticket.status === 'resolved') {
      updateData.status = 'reopened';
      updateData.resolved_at = null;
    }

    await supabase
      .from('support_tickets')
      .update(updateData)
      .eq('id', ticketId);

    // Transform response
    const transformedMessage: SupportMessage = {
      ...createdMessage,
      sender_details: createdMessage.sender_details ? {
        name: createdMessage.sender_details.full_name || 'Seller',
        email: createdMessage.sender_details.email || '',
        avatar_url: createdMessage.sender_details.avatar_url,
        role: 'seller',
      } : {
        name: 'Seller',
        email: '',
        role: 'seller',
      },
    };

    return { data: transformedMessage, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

/**
 * Close a support ticket
 */
export const closeSupportTicket = async (
  ticketId: string,
  sellerId: string
): Promise<ApiResponse<SupportTicket>> => {
  try {
    validateTicketId(ticketId);
    validateSellerId(sellerId);

    // Verify ticket exists and belongs to seller
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('id', ticketId)
      .eq('seller_id', sellerId)
      .single();

    if (ticketError) {
      throw ticketError;
    }

    if (ticket.status === 'closed') {
      return { data: ticket, error: null };
    }

    // Update ticket status
    const { data: updatedTicket, error: updateError } = await supabase
      .from('support_tickets')
      .update({
        status: 'closed',
        closed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', ticketId)
      .eq('seller_id', sellerId)
      .select(`
        *,
        seller:seller_id (
          business_name,
          contact_email,
          contact_phone
        ),
        assigned_agent:assigned_agent_id (
          id,
          name,
          email,
          avatar_url,
          department,
          is_available
        )
      `)
      .single();

    if (updateError) {
      throw updateError;
    }

    // Add system message about closure
    const systemMessage: Omit<SupportMessage, 'id' | 'sender_details' | 'created_at' | 'updated_at'> = {
      ticket_id: ticketId,
      sender_type: 'system',
      sender_id: null,
      message: 'Ticket closed by seller',
      is_internal_note: false,
      attachments: [],
      read_by_seller: true,
      read_by_agent: true,
    };

    await supabase
      .from('support_messages')
      .insert(systemMessage);

    return { data: updatedTicket, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

/**
 * Reopen a closed support ticket
 */
export const reopenSupportTicket = async (
  ticketId: string,
  sellerId: string,
  reason: string
): Promise<ApiResponse<SupportTicket>> => {
  try {
    validateTicketId(ticketId);
    validateSellerId(sellerId);

    // Verify ticket exists and belongs to seller
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('id', ticketId)
      .eq('seller_id', sellerId)
      .single();

    if (ticketError) {
      throw ticketError;
    }

    if (ticket.status !== 'closed') {
      throw new Error('Only closed tickets can be reopened');
    }

    // Update ticket status
    const { data: updatedTicket, error: updateError } = await supabase
      .from('support_tickets')
      .update({
        status: 'reopened',
        closed_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ticketId)
      .eq('seller_id', sellerId)
      .select(`
        *,
        seller:seller_id (
          business_name,
          contact_email,
          contact_phone
        ),
        assigned_agent:assigned_agent_id (
          id,
          name,
          email,
          avatar_url,
          department,
          is_available
        )
      `)
      .single();

    if (updateError) {
      throw updateError;
    }

    // Add system message about reopening
    const systemMessage: Omit<SupportMessage, 'id' | 'sender_details' | 'created_at' | 'updated_at'> = {
      ticket_id: ticketId,
      sender_type: 'system',
      sender_id: null,
      message: `Ticket reopened by seller. Reason: ${reason}`,
      is_internal_note: false,
      attachments: [],
      read_by_seller: true,
      read_by_agent: false,
    };

    await supabase
      .from('support_messages')
      .insert(systemMessage);

    return { data: updatedTicket, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Mark all agent messages as read for a ticket
 */
const markMessagesAsRead = async (ticketId: string, sellerId: string): Promise<void> => {
  try {
    await supabase
      .from('support_messages')
      .update({ read_by_seller: true })
      .eq('ticket_id', ticketId)
      .eq('sender_type', 'support_agent')
      .eq('read_by_seller', false);
  } catch (error) {
    console.error('Failed to mark messages as read:', error);
  }
};

/**
 * Get appropriate department for ticket category
 */
const getDepartmentForCategory = (category: TicketCategory): TicketDepartment => {
  const departmentMap: Record<TicketCategory, TicketDepartment> = {
    technical: 'technical_support',
    billing: 'billing_support',
    account: 'seller_support',
    product: 'seller_support',
    shipping: 'seller_support',
    refund: 'billing_support',
    general: 'general_support',
  };
  return departmentMap[category];
};

/**
 * Get ticket statistics for seller
 */
export const getTicketStatistics = async (sellerId: string): Promise<ApiResponse<{
  open: number;
  pending: number;
  in_progress: number;
  resolved: number;
  closed: number;
  total: number;
  average_response_time: number; // in hours
  satisfaction_rate: number; // percentage
}>> => {
  try {
    validateSellerId(sellerId);

    const { data: tickets, error } = await supabase
      .from('support_tickets')
      .select('status, created_at')
      .eq('seller_id', sellerId);

    if (error) {
      throw error;
    }

    const stats = {
      open: 0,
      pending: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0,
      total: tickets?.length || 0,
    };

    tickets?.forEach(ticket => {
      switch (ticket.status) {
        case 'open': stats.open++; break;
        case 'pending': stats.pending++; break;
        case 'in_progress': stats.in_progress++; break;
        case 'resolved': stats.resolved++; break;
        case 'closed': stats.closed++; break;
      }
    });

    // Calculate average response time (placeholder - would need more data)
    const average_response_time = 4.5; // hours

    // Calculate satisfaction rate from ratings (placeholder)
    const satisfaction_rate = 92; // percentage

    return {
      data: {
        ...stats,
        average_response_time,
        satisfaction_rate,
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

// ============================================================================
// UI HELPER FUNCTIONS
// ============================================================================

/**
 * Get ticket status label for display
 */
export const getTicketStatusLabel = (status: TicketStatus): string => {
  return TICKET_STATUS_LABELS[status] || status;
};

/**
 * Get ticket status color for UI
 */
export const getTicketStatusColor = (status: TicketStatus): string => {
  const colors: Record<TicketStatus, string> = {
    open: 'bg-blue-100 text-blue-800',
    pending: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-purple-100 text-purple-800',
    resolved: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800',
    reopened: 'bg-orange-100 text-orange-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

/**
 * Get ticket priority label for display
 */
export const getTicketPriorityLabel = (priority: TicketPriority): string => {
  return TICKET_PRIORITY_LABELS[priority] || priority;
};

/**
 * Get ticket priority color for UI
 */
export const getTicketPriorityColor = (priority: TicketPriority): string => {
  const colors: Record<TicketPriority, string> = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
  };
  return colors[priority] || 'bg-gray-100 text-gray-800';
};

/**
 * Get ticket category label for display
 */
export const getTicketCategoryLabel = (category: TicketCategory): string => {
  return TICKET_CATEGORY_LABELS[category] || category;
};

/**
 * Get ticket category color for UI
 */
export const getTicketCategoryColor = (category: TicketCategory): string => {
  const colors: Record<TicketCategory, string> = {
    technical: 'bg-purple-100 text-purple-800',
    billing: 'bg-green-100 text-green-800',
    account: 'bg-blue-100 text-blue-800',
    product: 'bg-yellow-100 text-yellow-800',
    shipping: 'bg-indigo-100 text-indigo-800',
    refund: 'bg-red-100 text-red-800',
    general: 'bg-gray-100 text-gray-800',
  };
  return colors[category] || 'bg-gray-100 text-gray-800';
};

/**
 * Format time since last message
 */
export const formatTimeSince = (date: string): string => {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  } else {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  }
};

// ============================================================================
// MOCK DATA FOR TESTING/DEMO
// ============================================================================

export const getMockSupportTickets = (sellerId: string = 'seller_123'): SupportTicket[] => [
  {
    id: 'ticket_1',
    ticket_number: 'TICKET-123456',
    seller_id: sellerId,
    title: 'Payment processing issue',
    category: 'billing',
    subcategory: 'payment',
    description: 'Having trouble processing payments from customers',
    status: 'open',
    priority: 'high',
    department: 'billing_support',
    tags: ['billing', 'payment', 'urgent'],
    metadata: {},
    assigned_agent: null,
    assigned_at: null,
    resolved_at: null,
    closed_at: null,
    last_message_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    message_count: 3,
    unread_count: 2,
    seller: {
      business_name: 'Premium Furniture Store',
      contact_email: 'seller@example.com',
      contact_phone: '+966 55 123 4567',
    },
  },
  {
    id: 'ticket_2',
    ticket_number: 'TICKET-123457',
    seller_id: sellerId,
    title: 'Product approval delay',
    category: 'product',
    subcategory: 'approval',
    description: 'New product listing stuck in approval for 3 days',
    status: 'in_progress',
    priority: 'medium',
    department: 'seller_support',
    tags: ['product', 'approval'],
    metadata: {},
    assigned_agent: {
      id: 'agent_1',
      name: 'Sarah Johnson',
      email: 'sarah@support.com',
      avatar_url: 'https://example.com/avatar.jpg',
      department: 'seller_support',
      is_available: true,
    },
    assigned_at: new Date(Date.now() - 172800000).toISOString(),
    resolved_at: null,
    closed_at: null,
    last_message_at: new Date(Date.now() - 3600000).toISOString(),
    created_at: new Date(Date.now() - 259200000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
    message_count: 8,
    unread_count: 0,
    seller: {
      business_name: 'Premium Furniture Store',
      contact_email: 'seller@example.com',
      contact_phone: '+966 55 123 4567',
    },
  },
  {
    id: 'ticket_3',
    ticket_number: 'TICKET-123458',
    seller_id: sellerId,
    title: 'Dashboard loading slowly',
    category: 'technical',
    subcategory: 'performance',
    description: 'Seller dashboard takes over 10 seconds to load',
    status: 'resolved',
    priority: 'medium',
    department: 'technical_support',
    tags: ['technical', 'performance', 'dashboard'],
    metadata: {},
    assigned_agent: {
      id: 'agent_2',
      name: 'Mike Chen',
      email: 'mike@support.com',
      avatar_url: 'https://example.com/avatar2.jpg',
      department: 'technical_support',
      is_available: false,
    },
    assigned_at: new Date(Date.now() - 345600000).toISOString(),
    resolved_at: new Date(Date.now() - 86400000).toISOString(),
    closed_at: null,
    last_message_at: new Date(Date.now() - 86400000).toISOString(),
    created_at: new Date(Date.now() - 432000000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    message_count: 5,
    unread_count: 0,
    seller: {
      business_name: 'Premium Furniture Store',
      contact_email: 'seller@example.com',
      contact_phone: '+966 55 123 4567',
    },
  },
  {
    id: 'ticket_4',
    ticket_number: 'TICKET-123459',
    seller_id: sellerId,
    title: 'VAT invoice generation',
    category: 'billing',
    subcategory: 'vat',
    description: 'Need help generating VAT invoices for Q4',
    status: 'closed',
    priority: 'low',
    department: 'billing_support',
    tags: ['billing', 'vat', 'invoice'],
    metadata: {},
    assigned_agent: {
      id: 'agent_3',
      name: 'Ahmed Ali',
      email: 'ahmed@support.com',
      avatar_url: 'https://example.com/avatar3.jpg',
      department: 'billing_support',
      is_available: true,
    },
    assigned_at: new Date(Date.now() - 604800000).toISOString(),
    resolved_at: new Date(Date.now() - 518400000).toISOString(),
    closed_at: new Date(Date.now() - 432000000).toISOString(),
    last_message_at: new Date(Date.now() - 432000000).toISOString(),
    created_at: new Date(Date.now() - 691200000).toISOString(),
    updated_at: new Date(Date.now() - 432000000).toISOString(),
    message_count: 12,
    unread_count: 0,
    seller: {
      business_name: 'Premium Furniture Store',
      contact_email: 'seller@example.com',
      contact_phone: '+966 55 123 4567',
    },
  },
];