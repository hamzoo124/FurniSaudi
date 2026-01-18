// src/hooks/useSupport.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

// ==================== TYPE DEFINITIONS ====================

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum TicketStatus {
  OPEN = 'open',
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

export enum TicketCategory {
  ORDER_ISSUE = 'order_issue',
  PRODUCT_QUESTION = 'product_question',
  PAYMENT_PROBLEM = 'payment_problem',
  SHIPPING_DELAY = 'shipping_delay',
  RETURN_REFUND = 'return_refund',
  TECHNICAL_ISSUE = 'technical_issue',
  ACCOUNT_PROBLEM = 'account_problem',
  GENERAL_INQUIRY = 'general_inquiry',
  OTHER = 'other'
}

export interface SupportTicket {
  id: string;
  ticket_number: string;
  seller_id: string;
  customer_id: string;
  customer?: CustomerInfo;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  order_id?: string;
  product_id?: string;
  sla_due_at?: string;
  assigned_to?: string;
  assigned_agent?: string;
  first_response_at?: string;
  resolved_at?: string;
  closed_at?: string;
  satisfaction_rating?: number;
  feedback?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  last_message_at?: string;
  unread_messages: number;
  message_count: number;
  estimated_resolution_time?: string;
}

export interface CustomerInfo {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  order_count?: number;
  last_order_at?: string;
}

export interface SupportTicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_type: 'seller' | 'customer' | 'support_agent';
  sender_name: string;
  sender_avatar?: string;
  message: string;
  attachments: TicketAttachment[];
  internal_note: boolean;
  read_by_seller: boolean;
  read_by_customer: boolean;
  created_at: string;
  updated_at: string;
}

export interface TicketAttachment {
  id: string;
  message_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_url: string;
  thumbnail_url?: string;
  uploaded_at: string;
}

export interface CreateTicketData {
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  description: string;
  order_id?: string;
  product_id?: string;
  attachments?: File[];
  customer_id?: string;
  tags?: string[];
}

export interface TicketResponseData {
  message: string;
  attachments?: File[];
  internal_note?: boolean;
}

export interface TicketFilter {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  customer_id?: string;
  order_id?: string;
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

export interface TicketsResponse {
  tickets: SupportTicket[];
  pagination: PaginationMeta;
}

// ==================== UTILITY FUNCTIONS ====================

const generateTicketNumber = (): string => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `TICKET-${year}${month}${day}-${random}`;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const validateTicketData = (data: CreateTicketData): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.subject || data.subject.trim().length < 5) {
    errors.push('Subject must be at least 5 characters long');
  }

  if (!data.description || data.description.trim().length < 20) {
    errors.push('Description must be at least 20 characters long');
  }

  if (!data.category) {
    errors.push('Category is required');
  }

  if (!data.priority) {
    errors.push('Priority is required');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

const uploadAttachment = async (
  file: File,
  bucket: string = 'ticket-attachments'
): Promise<{ file_url: string; thumbnail_url?: string; file_name: string; file_size: number; file_type: string }> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `tickets/${fileName}`;

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

    // Generate thumbnail for images
    if (file.type.startsWith('image/')) {
      const thumbnailPath = `thumbnails/${fileName}`;
      
      // In production, you would generate a thumbnail here
      // For now, we'll use the same URL
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
    console.error('Error uploading attachment:', error);
    throw new Error('Failed to upload attachment');
  }
};

// ==================== MAIN SUPPORT HOOK ====================

export const useSupportTickets = (
  sellerId: string,
  filters?: TicketFilter,
  page: number = 1,
  limit: number = 20
) => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    items_per_page: limit,
    has_next_page: false,
    has_previous_page: false
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchTickets = useCallback(async () => {
    if (!sellerId) return;

    const isLoading = !refreshing;
    if (isLoading) setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('support_tickets')
        .select(`
          *,
          customer:customers(
            id,
            name,
            email,
            phone,
            avatar_url
          ),
          order:orders(
            id,
            order_number,
            total_amount
          ),
          product:products(
            id,
            name,
            sku
          )
        `, { count: 'exact' })
        .eq('seller_id', sellerId)
        .order('updated_at', { ascending: false });

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.customer_id) {
        query = query.eq('customer_id', filters.customer_id);
      }

      if (filters?.order_id) {
        query = query.eq('order_id', filters.order_id);
      }

      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }

      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      if (filters?.search) {
        query = query.or(`subject.ilike.%${filters.search}%,ticket_number.ilike.%${filters.search}%`);
      }

      if (filters?.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error: queryError, count } = await query;

      if (queryError) throw queryError;

      // Get message counts and unread status
      const ticketsWithStats = await Promise.all(
        (data || []).map(async (ticket: any) => {
          // Get message count
          const { count: messageCount } = await supabase
            .from('support_ticket_messages')
            .select('*', { count: 'exact', head: true })
            .eq('ticket_id', ticket.id);

          // Get unread messages count
          const { count: unreadCount } = await supabase
            .from('support_ticket_messages')
            .select('*', { count: 'exact', head: true })
            .eq('ticket_id', ticket.id)
            .eq('read_by_seller', false)
            .eq('sender_type', 'customer');

          return {
            ...ticket,
            customer: ticket.customer || null,
            order: ticket.order || null,
            product: ticket.product || null,
            message_count: messageCount || 0,
            unread_messages: unreadCount || 0,
            last_message_at: ticket.updated_at
          };
        })
      );

      const totalPages = Math.ceil((count || 0) / limit);

      setTickets(ticketsWithStats);
      setPagination({
        current_page: page,
        total_pages: totalPages,
        total_items: count || 0,
        items_per_page: limit,
        has_next_page: page < totalPages,
        has_previous_page: page > 1
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load support tickets');
      console.error('Error fetching tickets:', err);
    } finally {
      if (isLoading) setLoading(false);
      setRefreshing(false);
    }
  }, [sellerId, filters, page, limit, refreshing]);

  // Refresh tickets
  const refreshTickets = () => {
    setRefreshing(true);
    fetchTickets();
  };

  // Mark ticket as read
  const markAsRead = async (ticketId: string) => {
    try {
      // Mark all customer messages as read
      const { error } = await supabase
        .from('support_ticket_messages')
        .update({ read_by_seller: true })
        .eq('ticket_id', ticketId)
        .eq('sender_type', 'customer')
        .eq('read_by_seller', false);

      if (error) throw error;

      // Update local state
      setTickets(prev => prev.map(ticket =>
        ticket.id === ticketId
          ? { ...ticket, unread_messages: 0 }
          : ticket
      ));
    } catch (err) {
      console.error('Error marking ticket as read:', err);
    }
  };

  // Update ticket status
  const updateTicketStatus = async (ticketId: string, status: TicketStatus) => {
    try {
      const updateData: any = { status };
      
      if (status === TicketStatus.CLOSED || status === TicketStatus.RESOLVED) {
        updateData.closed_at = new Date().toISOString();
      }

      if (status === TicketStatus.IN_PROGRESS && !ticketId.includes('mock')) {
        // Assign to current seller
        updateData.assigned_to = sellerId;
      }

      const { error } = await supabase
        .from('support_tickets')
        .update(updateData)
        .eq('id', ticketId)
        .eq('seller_id', sellerId);

      if (error) throw error;

      // Optimistic update
      setTickets(prev => prev.map(ticket =>
        ticket.id === ticketId
          ? { 
              ...ticket, 
              status,
              assigned_to: status === TicketStatus.IN_PROGRESS ? sellerId : ticket.assigned_to,
              closed_at: updateData.closed_at || ticket.closed_at,
              updated_at: new Date().toISOString()
            }
          : ticket
      ));

      return { success: true };
    } catch (err) {
      console.error('Error updating ticket status:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to update ticket status' 
      };
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return {
    // Data
    tickets,
    pagination,
    
    // State
    loading,
    error,
    refreshing,
    
    // Actions
    fetchTickets,
    refreshTickets,
    markAsRead,
    updateTicketStatus,
    
    // Navigation
    goToPage: (pageNumber: number) => {
      if (pageNumber >= 1 && pageNumber <= pagination.total_pages) {
        fetchTickets();
      }
    }
  };
};

// ==================== TICKET DETAILS HOOK ====================

export const useSupportTicketDetails = (ticketId: string, sellerId?: string) => {
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportTicketMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [messageLoading, setMessageLoading] = useState<boolean>(false);

  const fetchTicketDetails = useCallback(async () => {
    if (!ticketId) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch ticket details
      const { data: ticketData, error: ticketError } = await supabase
        .from('support_tickets')
        .select(`
          *,
          customer:customers(
            id,
            name,
            email,
            phone,
            avatar_url,
            created_at
          ),
          order:orders(
            id,
            order_number,
            total_amount,
            status
          ),
          product:products(
            id,
            name,
            sku,
            price,
            images
          ),
          assigned_agent:profiles(
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('id', ticketId)
        .single();

      if (ticketError) throw ticketError;

      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('support_ticket_messages')
        .select(`
          *,
          attachments:ticket_attachments(
            id,
            file_name,
            file_size,
            file_type,
            file_url,
            thumbnail_url
          )
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      // Mark messages as read for seller
      if (sellerId) {
        await supabase
          .from('support_ticket_messages')
          .update({ read_by_seller: true })
          .eq('ticket_id', ticketId)
          .eq('sender_type', 'customer')
          .eq('read_by_seller', false);
      }

      setTicket(ticketData as SupportTicket);
      setMessages(messagesData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ticket details');
      console.error('Error fetching ticket details:', err);
    } finally {
      setLoading(false);
    }
  }, [ticketId, sellerId]);

  // Add message to ticket
  const addMessage = async (messageData: TicketResponseData) => {
    setMessageLoading(true);

    try {
      if (!ticket) {
        throw new Error('No ticket loaded');
      }

      // Upload attachments if any
      const attachments: TicketAttachment[] = [];
      if (messageData.attachments && messageData.attachments.length > 0) {
        const uploadPromises = messageData.attachments.map(file => uploadAttachment(file));
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
      const newMessageId = uuidv4();
      const { error: messageError } = await supabase
        .from('support_ticket_messages')
        .insert({
          id: newMessageId,
          ticket_id: ticketId,
          sender_id: sellerId || 'system',
          sender_type: 'seller',
          sender_name: 'Seller Support',
          message: messageData.message,
          internal_note: messageData.internal_note || false,
          read_by_seller: true,
          read_by_customer: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (messageError) throw messageError;

      // Insert attachments if any
      if (attachments.length > 0) {
        const attachmentsToInsert = attachments.map(att => ({
          ...att,
          message_id: newMessageId
        }));

        const { error: attachmentsError } = await supabase
          .from('ticket_attachments')
          .insert(attachmentsToInsert);

        if (attachmentsError) throw attachmentsError;
      }

      // Update ticket's updated_at timestamp
      const { error: ticketError } = await supabase
        .from('support_tickets')
        .update({ 
          updated_at: new Date().toISOString(),
          status: TicketStatus.IN_PROGRESS 
        })
        .eq('id', ticketId);

      if (ticketError) throw ticketError;

      // Create new message object for optimistic update
      const newMessage: SupportTicketMessage = {
        id: newMessageId,
        ticket_id: ticketId,
        sender_id: sellerId || 'system',
        sender_type: 'seller',
        sender_name: 'Seller Support',
        message: messageData.message,
        attachments: attachments,
        internal_note: messageData.internal_note || false,
        read_by_seller: true,
        read_by_customer: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Optimistic update
      setMessages(prev => [...prev, newMessage]);
      setTicket(prev => prev ? {
        ...prev,
        updated_at: new Date().toISOString(),
        status: TicketStatus.IN_PROGRESS,
        message_count: prev.message_count + 1
      } : prev);

      return { success: true, message: newMessage };
    } catch (err) {
      console.error('Error adding message:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to send message' 
      };
    } finally {
      setMessageLoading(false);
    }
  };

  // Add internal note
  const addInternalNote = async (note: string) => {
    return addMessage({
      message: note,
      internal_note: true
    });
  };

  // Initialize
  useEffect(() => {
    fetchTicketDetails();
  }, [fetchTicketDetails]);

  return {
    // Data
    ticket,
    messages,
    
    // State
    loading,
    error,
    messageLoading,
    
    // Actions
    fetchTicketDetails,
    addMessage,
    addInternalNote
  };
};

// ==================== CREATE TICKET HOOK ====================

export const useCreateTicket = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const createTicket = async (sellerId: string, ticketData: CreateTicketData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Validate ticket data
      const validation = validateTicketData(ticketData);
      if (!validation.valid) {
        throw new Error(validation.errors[0]);
      }

      // Generate ticket number
      const ticketNumber = generateTicketNumber();

      // Upload attachments if any
      const attachments: TicketAttachment[] = [];
      if (ticketData.attachments && ticketData.attachments.length > 0) {
        const uploadPromises = ticketData.attachments.map(file => uploadAttachment(file));
        const uploadedFiles = await Promise.all(uploadPromises);
        
        attachments.push(...uploadedFiles.map(file => ({
          id: uuidv4(),
          message_id: '', // Will be set after ticket creation
          file_name: file.file_name,
          file_size: file.file_size,
          file_type: file.file_type,
          file_url: file.file_url,
          thumbnail_url: file.thumbnail_url,
          uploaded_at: new Date().toISOString()
        })));
      }

      // Calculate SLA due date (24 hours for high priority, 48 hours for medium, 72 hours for low)
      const slaHours = {
        [TicketPriority.URGENT]: 12,
        [TicketPriority.HIGH]: 24,
        [TicketPriority.MEDIUM]: 48,
        [TicketPriority.LOW]: 72
      }[ticketData.priority];

      const slaDueAt = new Date();
      slaDueAt.setHours(slaDueAt.getHours() + slaHours);

      // Create ticket in database
      const ticketId = uuidv4();
      const { error: ticketError } = await supabase
        .from('support_tickets')
        .insert({
          id: ticketId,
          ticket_number: ticketNumber,
          seller_id: sellerId,
          customer_id: ticketData.customer_id || null,
          subject: ticketData.subject,
          category: ticketData.category,
          priority: ticketData.priority,
          status: TicketStatus.OPEN,
          order_id: ticketData.order_id || null,
          product_id: ticketData.product_id || null,
          tags: ticketData.tags || [],
          sla_due_at: slaDueAt.toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (ticketError) throw ticketError;

      // Create initial message
      const messageId = uuidv4();
      const { error: messageError } = await supabase
        .from('support_ticket_messages')
        .insert({
          id: messageId,
          ticket_id: ticketId,
          sender_id: sellerId,
          sender_type: 'seller',
          sender_name: 'Seller',
          message: ticketData.description,
          internal_note: false,
          read_by_seller: true,
          read_by_customer: false,
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
          .from('ticket_attachments')
          .insert(attachmentsToInsert);

        if (attachmentsError) throw attachmentsError;
      }

      setSuccess(true);
      return { 
        success: true, 
        ticketId, 
        ticketNumber 
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create ticket');
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Creation failed' 
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    success,
    createTicket,
    reset: () => {
      setError(null);
      setSuccess(false);
    }
  };
};

// ==================== TICKET ACTIONS HOOK ====================

export const useTicketActions = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Close ticket
  const closeTicket = async (ticketId: string, sellerId: string, resolution?: string) => {
    setLoading(true);
    setError(null);

    try {
      // Update ticket status
      const { error: ticketError } = await supabase
        .from('support_tickets')
        .update({
          status: TicketStatus.CLOSED,
          closed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId)
        .eq('seller_id', sellerId);

      if (ticketError) throw ticketError;

      // Add resolution note if provided
      if (resolution) {
        const { error: messageError } = await supabase
          .from('support_ticket_messages')
          .insert({
            id: uuidv4(),
            ticket_id: ticketId,
            sender_id: sellerId,
            sender_type: 'seller',
            sender_name: 'Seller',
            message: resolution,
            internal_note: true,
            read_by_seller: true,
            read_by_customer: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (messageError) throw messageError;
      }

      return { success: true };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to close ticket');
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Close failed' 
      };
    } finally {
      setLoading(false);
    }
  };

  // Assign ticket
  const assignTicket = async (ticketId: string, sellerId: string, agentId?: string) => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({
          assigned_to: agentId || sellerId,
          status: TicketStatus.IN_PROGRESS,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId)
        .eq('seller_id', sellerId);

      if (error) throw error;

      return { success: true };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign ticket');
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Assignment failed' 
      };
    } finally {
      setLoading(false);
    }
  };

  // Update ticket priority
  const updateTicketPriority = async (ticketId: string, sellerId: string, priority: TicketPriority) => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({
          priority,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId)
        .eq('seller_id', sellerId);

      if (error) throw error;

      return { success: true };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update priority');
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Update failed' 
      };
    } finally {
      setLoading(false);
    }
  };

  // Add tags to ticket
  const addTagsToTicket = async (ticketId: string, sellerId: string, tags: string[]) => {
    setLoading(true);
    setError(null);

    try {
      // Get current tags
      const { data: ticketData, error: fetchError } = await supabase
        .from('support_tickets')
        .select('tags')
        .eq('id', ticketId)
        .eq('seller_id', sellerId)
        .single();

      if (fetchError) throw fetchError;

      const currentTags = ticketData?.tags || [];
      const newTags = Array.from(new Set([...currentTags, ...tags]));

      const { error } = await supabase
        .from('support_tickets')
        .update({
          tags: newTags,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId)
        .eq('seller_id', sellerId);

      if (error) throw error;

      return { success: true, tags: newTags };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add tags');
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Tag addition failed' 
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    closeTicket,
    assignTicket,
    updateTicketPriority,
    addTagsToTicket
  };
};

// ==================== MOCK DATA FOR DEVELOPMENT ====================

export const getMockSupportTickets = (sellerId: string): SupportTicket[] => [
  {
    id: 'ticket-1',
    ticket_number: 'TICKET-240115-001',
    seller_id: sellerId,
    customer_id: 'customer-1',
    customer: {
      id: 'customer-1',
      name: 'Ahmed Al-Mansoor',
      email: 'ahmed@example.com',
      phone: '+966551234567',
      order_count: 5,
      last_order_at: '2024-01-14T10:30:00Z'
    },
    subject: 'Order #ORD-7894 delivery delayed',
    category: TicketCategory.SHIPPING_DELAY,
    priority: TicketPriority.HIGH,
    status: TicketStatus.IN_PROGRESS,
    order_id: 'order-7894',
    tags: ['delivery', 'urgent'],
    unread_messages: 2,
    message_count: 5,
    sla_due_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    created_at: '2024-01-15T09:00:00Z',
    updated_at: '2024-01-15T14:30:00Z',
    last_message_at: '2024-01-15T14:30:00Z'
  },
  {
    id: 'ticket-2',
    ticket_number: 'TICKET-240114-002',
    seller_id: sellerId,
    customer_id: 'customer-2',
    customer: {
      id: 'customer-2',
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      order_count: 12,
      last_order_at: '2024-01-12T15:45:00Z'
    },
    subject: 'Question about product warranty',
    category: TicketCategory.PRODUCT_QUESTION,
    priority: TicketPriority.MEDIUM,
    status: TicketStatus.PENDING,
    product_id: 'product-123',
    tags: ['warranty', 'information'],
    unread_messages: 0,
    message_count: 3,
    created_at: '2024-01-14T14:20:00Z',
    updated_at: '2024-01-14T16:10:00Z',
    last_message_at: '2024-01-14T16:10:00Z'
  },
  {
    id: 'ticket-3',
    ticket_number: 'TICKET-240113-003',
    seller_id: sellerId,
    customer_id: 'customer-3',
    customer: {
      id: 'customer-3',
      name: 'Mohammed Khan',
      email: 'mohammed@example.com',
      phone: '+966552345678'
    },
    subject: 'Payment failed for order #ORD-7893',
    category: TicketCategory.PAYMENT_PROBLEM,
    priority: TicketPriority.URGENT,
    status: TicketStatus.OPEN,
    order_id: 'order-7893',
    tags: ['payment', 'failed'],
    unread_messages: 1,
    message_count: 2,
    sla_due_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    created_at: '2024-01-13T11:15:00Z',
    updated_at: '2024-01-13T11:15:00Z',
    last_message_at: '2024-01-13T11:15:00Z'
  },
  {
    id: 'ticket-4',
    ticket_number: 'TICKET-240112-004',
    seller_id: sellerId,
    customer_id: 'customer-4',
    customer: {
      id: 'customer-4',
      name: 'Fatima Al-Sayed',
      email: 'fatima@example.com'
    },
    subject: 'Return request for damaged item',
    category: TicketCategory.RETURN_REFUND,
    priority: TicketPriority.HIGH,
    status: TicketStatus.RESOLVED,
    order_id: 'order-7892',
    tags: ['return', 'damaged'],
    unread_messages: 0,
    message_count: 8,
    resolved_at: '2024-01-12T17:30:00Z',
    created_at: '2024-01-11T10:45:00Z',
    updated_at: '2024-01-12T17:30:00Z',
    last_message_at: '2024-01-12T17:30:00Z'
  },
  {
    id: 'ticket-5',
    ticket_number: 'TICKET-240111-005',
    seller_id: sellerId,
    customer_id: 'customer-5',
    customer: {
      id: 'customer-5',
      name: 'Robert Chen',
      email: 'robert@example.com'
    },
    subject: 'General inquiry about bulk orders',
    category: TicketCategory.GENERAL_INQUIRY,
    priority: TicketPriority.LOW,
    status: TicketStatus.CLOSED,
    tags: ['bulk-order', 'inquiry'],
    unread_messages: 0,
    message_count: 4,
    closed_at: '2024-01-11T16:20:00Z',
    created_at: '2024-01-10T09:30:00Z',
    updated_at: '2024-01-11T16:20:00Z',
    last_message_at: '2024-01-11T16:20:00Z'
  }
];

export const getMockTicketDetails = (ticketId: string): SupportTicket => ({
  id: ticketId,
  ticket_number: 'TICKET-240115-001',
  seller_id: 'seller-123',
  customer_id: 'customer-1',
  customer: {
    id: 'customer-1',
    name: 'Ahmed Al-Mansoor',
    email: 'ahmed@example.com',
    phone: '+966551234567',
    order_count: 5,
    last_order_at: '2024-01-14T10:30:00Z'
  },
  subject: 'Order #ORD-7894 delivery delayed',
  category: TicketCategory.SHIPPING_DELAY,
  priority: TicketPriority.HIGH,
  status: TicketStatus.IN_PROGRESS,
  order_id: 'order-7894',
  assigned_to: 'seller-123',
  assigned_agent: 'Seller Support',
  tags: ['delivery', 'urgent'],
  unread_messages: 2,
  message_count: 5,
  sla_due_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  first_response_at: '2024-01-15T09:30:00Z',
  created_at: '2024-01-15T09:00:00Z',
  updated_at: '2024-01-15T14:30:00Z',
  last_message_at: '2024-01-15T14:30:00Z'
});

export const getMockTicketMessages = (ticketId: string): SupportTicketMessage[] => [
  {
    id: 'msg-1',
    ticket_id: ticketId,
    sender_id: 'customer-1',
    sender_type: 'customer',
    sender_name: 'Ahmed Al-Mansoor',
    message: 'Hello, my order #ORD-7894 was supposed to be delivered yesterday but it hasn\'t arrived yet. Can you please check the status?',
    attachments: [],
    internal_note: false,
    read_by_seller: true,
    read_by_customer: true,
    created_at: '2024-01-15T09:00:00Z',
    updated_at: '2024-01-15T09:00:00Z'
  },
  {
    id: 'msg-2',
    ticket_id: ticketId,
    sender_id: 'seller-123',
    sender_type: 'seller',
    sender_name: 'Seller Support',
    message: 'Hi Ahmed, I\'ve checked your order and it shows that it was shipped on January 14th. The tracking number is TRK-789456. There might be a delay due to weather conditions in your area.',
    attachments: [],
    internal_note: false,
    read_by_seller: true,
    read_by_customer: true,
    created_at: '2024-01-15T09:30:00Z',
    updated_at: '2024-01-15T09:30:00Z'
  },
  {
    id: 'msg-3',
    ticket_id: ticketId,
    sender_id: 'customer-1',
    sender_type: 'customer',
    sender_name: 'Ahmed Al-Mansoor',
    message: 'Thank you for the update. I checked the tracking and it shows "Delivery delayed". Do you have an estimated delivery date?',
    attachments: [],
    internal_note: false,
    read_by_seller: true,
    read_by_customer: true,
    created_at: '2024-01-15T10:15:00Z',
    updated_at: '2024-01-15T10:15:00Z'
  },
  {
    id: 'msg-4',
    ticket_id: ticketId,
    sender_id: 'seller-123',
    sender_type: 'seller',
    sender_name: 'Seller Support',
    message: 'According to the shipping company, the estimated delivery is now tomorrow, January 16th, by 5 PM. I\'ve requested priority handling for your shipment.',
    attachments: [
      {
        id: 'att-1',
        message_id: 'msg-4',
        file_name: 'shipping_update.pdf',
        file_size: 204800,
        file_type: 'application/pdf',
        file_url: 'https://example.com/shipping_update.pdf',
        uploaded_at: '2024-01-15T14:30:00Z'
      }
    ],
    internal_note: false,
    read_by_seller: true,
    read_by_customer: false,
    created_at: '2024-01-15T14:30:00Z',
    updated_at: '2024-01-15T14:30:00Z'
  },
  {
    id: 'msg-5',
    ticket_id: ticketId,
    sender_id: 'seller-123',
    sender_type: 'seller',
    sender_name: 'Internal Note',
    message: 'Customer contacted about delivery delay. Shipping company reports weather-related delay in Riyadh area. Follow up tomorrow if not delivered.',
    attachments: [],
    internal_note: true,
    read_by_seller: true,
    read_by_customer: false,
    created_at: '2024-01-15T14:35:00Z',
    updated_at: '2024-01-15T14:35:00Z'
  }
];

// ==================== DATABASE SCHEMA HELPERS ====================

/*
-- SQL for required tables (run in Supabase SQL editor)

1. support_tickets table:

CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_number VARCHAR(50) NOT NULL UNIQUE,
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  subject VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'medium',
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  sla_due_at TIMESTAMP WITH TIME ZONE,
  assigned_to UUID,
  assigned_agent VARCHAR(255),
  first_response_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  feedback TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_support_tickets_seller_id ON support_tickets(seller_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX idx_support_tickets_updated_at ON support_tickets(updated_at DESC);
CREATE INDEX idx_support_tickets_customer_id ON support_tickets(customer_id);
CREATE INDEX idx_support_tickets_ticket_number ON support_tickets(ticket_number);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_support_ticket_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_support_tickets_updated_at 
  BEFORE UPDATE ON support_tickets 
  FOR EACH ROW 
  EXECUTE FUNCTION update_support_ticket_updated_at();

2. support_ticket_messages table:

CREATE TABLE IF NOT EXISTS support_ticket_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('seller', 'customer', 'support_agent')),
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
CREATE INDEX idx_support_messages_ticket_id ON support_ticket_messages(ticket_id);
CREATE INDEX idx_support_messages_created_at ON support_ticket_messages(created_at);
CREATE INDEX idx_support_messages_sender_type ON support_ticket_messages(sender_type);

3. ticket_attachments table:

CREATE TABLE IF NOT EXISTS ticket_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES support_ticket_messages(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_ticket_attachments_message_id ON ticket_attachments(message_id);

4. Function to get ticket statistics:

CREATE OR REPLACE FUNCTION get_seller_ticket_stats(
  p_seller_id UUID,
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
  total_tickets BIGINT,
  open_tickets BIGINT,
  high_priority_tickets BIGINT,
  avg_response_time_hours DECIMAL,
  resolution_rate DECIMAL,
  avg_satisfaction_rating DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH ticket_stats AS (
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN status IN ('open', 'pending', 'in_progress') THEN 1 END) as open,
      COUNT(CASE WHEN priority = 'high' OR priority = 'urgent' THEN 1 END) as high_priority,
      AVG(
        EXTRACT(EPOCH FROM (first_response_at - created_at)) / 3600
      ) as avg_response_time,
      COUNT(CASE WHEN status IN ('resolved', 'closed') THEN 1 END)::DECIMAL / NULLIF(COUNT(*), 0) * 100 as resolution_rate,
      AVG(satisfaction_rating) as avg_rating
    FROM support_tickets
    WHERE seller_id = p_seller_id
      AND created_at BETWEEN p_start_date AND p_end_date
  )
  SELECT 
    stats.total,
    stats.open,
    stats.high_priority,
    COALESCE(stats.avg_response_time, 0),
    COALESCE(stats.resolution_rate, 0),
    COALESCE(stats.avg_rating, 0)
  FROM ticket_stats stats;
END;
$$ LANGUAGE plpgsql;

5. Function to auto-close old tickets:

CREATE OR REPLACE FUNCTION auto_close_old_tickets()
RETURNS VOID AS $$
BEGIN
  UPDATE support_tickets
  SET 
    status = 'closed',
    closed_at = NOW(),
    updated_at = NOW()
  WHERE status IN ('resolved', 'in_progress')
    AND updated_at < NOW() - INTERVAL '7 days'
    AND closed_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Schedule this function to run daily
-- In Supabase, you can set up a cron job for this
*/

export default useSupportTickets;