import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare,
  HelpCircle,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Eye,
  MessageCircle,
  X,
  Send,
  Paperclip,
  Download,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  ShoppingBag,
  Truck,
  DollarSign,
  Settings,
  User,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  Star,
  Upload,
  Trash2,
  Bell,
  Phone,
  Mail,
  Hash,
  Award,
  Zap
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

// ============================
// TYPES
// ============================

type TicketType = 'order-issue' | 'custom-order' | 'shipping-delivery' | 'payment-finance' | 'technical' | 'general';
type TicketStatus = 'open' | 'pending' | 'resolved' | 'closed';
type SenderType = 'seller' | 'admin' | 'system';

interface TicketMessage {
  id: string;
  sender: SenderType;
  message: string;
  attachments?: string[];
  timestamp: string;
  read: boolean;
}

interface SupportTicket {
  id: string;
  ticket_id: string;
  type: TicketType;
  subject: string;
  description: string;
  related_order_id?: string;
  related_product_id?: string;
  status: TicketStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  last_response_at: string;
  assigned_admin?: string;
  messages: TicketMessage[];
}

interface FilterState {
  type: TicketType | 'all';
  status: TicketStatus | 'all';
  priority: 'all' | 'low' | 'medium' | 'high' | 'urgent';
  dateRange: 'all' | 'today' | 'week' | 'month';
  searchQuery: string;
}

interface NewTicketData {
  type: TicketType;
  subject: string;
  description: string;
  related_order_id?: string;
  related_product_id?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  attachments: File[];
}

// ============================
// MOCK DATA
// ============================

const mockTickets: SupportTicket[] = [
  {
    id: '1',
    ticket_id: 'TKT-2024-001',
    type: 'order-issue',
    subject: 'Customer wants to cancel order after shipping',
    description: 'Customer placed order ORD-7894 for leather sofa but now wants to cancel even though it has already shipped. Need guidance on cancellation policy.',
    related_order_id: 'ORD-7894',
    status: 'open',
    priority: 'high',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-16T14:20:00Z',
    last_response_at: '2024-01-16T14:20:00Z',
    assigned_admin: 'Admin Sarah',
    messages: [
      {
        id: 'msg1',
        sender: 'seller',
        message: 'Customer is requesting cancellation after shipping. What should I do? Our policy says no cancellations after shipping.',
        timestamp: '2024-01-15T10:30:00Z',
        read: true
      },
      {
        id: 'msg2',
        sender: 'admin',
        message: 'According to platform policy, sellers can refuse cancellation if item has already shipped. However, you can offer a return option with return shipping paid by customer.',
        timestamp: '2024-01-15T14:15:00Z',
        read: true
      },
      {
        id: 'msg3',
        sender: 'seller',
        message: 'Customer is insisting on full refund. Should I escalate this?',
        timestamp: '2024-01-16T09:45:00Z',
        read: true
      }
    ]
  },
  {
    id: '2',
    ticket_id: 'TKT-2024-002',
    type: 'shipping-delivery',
    subject: 'Damage during delivery - need replacement process',
    description: 'Customer received damaged dining table. Need to understand replacement process and who covers shipping costs.',
    related_order_id: 'ORD-7893',
    status: 'pending',
    priority: 'urgent',
    created_at: '2024-01-14T11:20:00Z',
    updated_at: '2024-01-15T16:45:00Z',
    last_response_at: '2024-01-15T16:45:00Z',
    assigned_admin: 'Admin Ahmed',
    messages: [
      {
        id: 'msg1',
        sender: 'seller',
        message: 'Customer sent photos showing damage to dining table during delivery. Need guidance on replacement process.',
        attachments: ['damage-photo1.jpg', 'damage-photo2.jpg'],
        timestamp: '2024-01-14T11:20:00Z',
        read: true
      },
      {
        id: 'msg2',
        sender: 'admin',
        message: 'Please verify damage photos. If confirmed, you need to arrange pickup for damaged item and ship replacement. Platform insurance covers shipping costs for damaged items.',
        timestamp: '2024-01-14T15:30:00Z',
        read: true
      },
      {
        id: 'msg3',
        sender: 'seller',
        message: 'Photos confirmed. How do I initiate insurance claim?',
        timestamp: '2024-01-15T10:15:00Z',
        read: true
      },
      {
        id: 'msg4',
        sender: 'admin',
        message: 'Use the Insurance Claim form in your dashboard. I have escalated this to our insurance department.',
        timestamp: '2024-01-15T16:45:00Z',
        read: false
      }
    ]
  },
  {
    id: '3',
    ticket_id: 'TKT-2024-003',
    type: 'payment-finance',
    subject: 'Payout delay - payment not received',
    description: 'Pending payout of SAR 12,450 was scheduled for Jan 10 but still not received in bank account.',
    status: 'resolved',
    priority: 'high',
    created_at: '2024-01-12T09:15:00Z',
    updated_at: '2024-01-14T11:30:00Z',
    last_response_at: '2024-01-14T11:30:00Z',
    assigned_admin: 'Finance Team',
    messages: [
      {
        id: 'msg1',
        sender: 'seller',
        message: 'Payout from Jan 10 still not showing in my bank account. Transaction ID: TXN-789456123',
        timestamp: '2024-01-12T09:15:00Z',
        read: true
      },
      {
        id: 'msg2',
        sender: 'admin',
        message: 'Checking with finance team. Our records show payout was processed. Please confirm your bank account details.',
        timestamp: '2024-01-12T14:20:00Z',
        read: true
      },
      {
        id: 'msg3',
        sender: 'seller',
        message: 'Bank details confirmed. Account ending in 7890.',
        timestamp: '2024-01-13T10:45:00Z',
        read: true
      },
      {
        id: 'msg4',
        sender: 'admin',
        message: 'Issue identified - bank processing delay due to public holiday. Payout should reflect by EOD Jan 15.',
        timestamp: '2024-01-13T16:30:00Z',
        read: true
      },
      {
        id: 'msg5',
        sender: 'system',
        message: 'Payout processed successfully. Funds should now be available in your account.',
        timestamp: '2024-01-14T11:30:00Z',
        read: true
      }
    ]
  },
  {
    id: '4',
    ticket_id: 'TKT-2024-004',
    type: 'custom-order',
    subject: 'Custom bed frame specifications approval',
    description: 'Customer requesting modifications to custom king bed frame design. Need approval for additional costs.',
    related_order_id: 'ORD-CUST-001',
    status: 'open',
    priority: 'medium',
    created_at: '2024-01-13T14:45:00Z',
    updated_at: '2024-01-15T10:20:00Z',
    last_response_at: '2024-01-15T10:20:00Z',
    assigned_admin: 'Design Support',
    messages: [
      {
        id: 'msg1',
        sender: 'seller',
        message: 'Customer wants additional storage drawers and premium wood finish. This increases cost by 35%. Need approval to proceed.',
        attachments: ['design-modifications.pdf'],
        timestamp: '2024-01-13T14:45:00Z',
        read: true
      },
      {
        id: 'msg2',
        sender: 'admin',
        message: 'Please provide detailed cost breakdown for customer approval.',
        timestamp: '2024-01-14T09:30:00Z',
        read: true
      }
    ]
  },
  {
    id: '5',
    ticket_id: 'TKT-2024-005',
    type: 'technical',
    subject: 'Product images not uploading',
    description: 'Getting error when trying to upload product images - "File size exceeds limit" but files are under 5MB.',
    status: 'pending',
    priority: 'medium',
    created_at: '2024-01-11T16:20:00Z',
    updated_at: '2024-01-12T11:45:00Z',
    last_response_at: '2024-01-12T11:45:00Z',
    assigned_admin: 'Tech Support',
    messages: [
      {
        id: 'msg1',
        sender: 'seller',
        message: 'Unable to upload product images. Error says file size limit exceeded but files are only 3MB each.',
        timestamp: '2024-01-11T16:20:00Z',
        read: true
      },
      {
        id: 'msg2',
        sender: 'admin',
        message: 'There is a known issue with certain image formats. Can you try converting to JPEG and reducing resolution?',
        timestamp: '2024-01-12T11:45:00Z',
        read: false
      }
    ]
  },
  {
    id: '6',
    ticket_id: 'TKT-2024-006',
    type: 'general',
    subject: 'Request for store promotion',
    description: 'Interested in featuring my store in upcoming marketplace promotion.',
    status: 'closed',
    priority: 'low',
    created_at: '2024-01-10T09:30:00Z',
    updated_at: '2024-01-12T14:15:00Z',
    last_response_at: '2024-01-12T14:15:00Z',
    assigned_admin: 'Marketing Team',
    messages: [
      {
        id: 'msg1',
        sender: 'seller',
        message: 'Would like to feature my store in upcoming promotion. What are the requirements and costs?',
        timestamp: '2024-01-10T09:30:00Z',
        read: true
      },
      {
        id: 'msg2',
        sender: 'admin',
        message: 'Promotion packages start from SAR 2,000/month. Please check Marketing section in your dashboard.',
        timestamp: '2024-01-11T10:15:00Z',
        read: true
      },
      {
        id: 'msg3',
        sender: 'seller',
        message: 'Thank you, I have applied through the dashboard.',
        timestamp: '2024-01-12T14:15:00Z',
        read: true
      }
    ]
  },
  {
    id: '7',
    ticket_id: 'TKT-2024-007',
    type: 'order-issue',
    subject: 'Customer dispute - wrong item delivered',
    description: 'Customer claims received wrong color sofa. Need mediation.',
    related_order_id: 'ORD-7888',
    status: 'open',
    priority: 'high',
    created_at: '2024-01-09T13:45:00Z',
    updated_at: '2024-01-10T16:30:00Z',
    last_response_at: '2024-01-10T16:30:00Z',
    assigned_admin: 'Dispute Resolution',
    messages: [
      {
        id: 'msg1',
        sender: 'seller',
        message: 'Customer ordered gray sofa but claims received beige. Our records show correct item shipped.',
        timestamp: '2024-01-09T13:45:00Z',
        read: true
      }
    ]
  },
  {
    id: '8',
    ticket_id: 'TKT-2024-008',
    type: 'shipping-delivery',
    subject: 'Delivery to remote area - additional charges',
    description: 'Customer in remote area - need confirmation on additional delivery charges.',
    related_order_id: 'ORD-7887',
    status: 'resolved',
    priority: 'medium',
    created_at: '2024-01-08T11:20:00Z',
    updated_at: '2024-01-09T15:45:00Z',
    last_response_at: '2024-01-09T15:45:00Z',
    assigned_admin: 'Logistics Team',
    messages: [
      {
        id: 'msg1',
        sender: 'seller',
        message: 'Customer in Tabuk area. Standard delivery shows 7 days with 500 SAR charge. Can this be expedited?',
        timestamp: '2024-01-08T11:20:00Z',
        read: true
      },
      {
        id: 'msg2',
        sender: 'admin',
        message: 'Expedited delivery available at 750 SAR (5 days). Customer must approve additional charge.',
        timestamp: '2024-01-09T15:45:00Z',
        read: true
      }
    ]
  }
];

// ============================
// MAIN COMPONENT
// ============================

interface SupportPageProps {
  onNavigate: (page: string) => void;
  onBack: () => void | Promise<void>;
}

const SupportPage: React.FC<SupportPageProps> = ({ onNavigate, onBack }) => {
  // State Management
  const [tickets, setTickets] = useState<SupportTicket[]>(mockTickets);
  const [loading, setLoading] = useState(false);
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [newTicketData, setNewTicketData] = useState<NewTicketData>({
    type: 'general',
    subject: '',
    description: '',
    priority: 'medium',
    attachments: []
  });
  const [responseAttachments, setResponseAttachments] = useState<File[]>([]);
  const [filterState, setFilterState] = useState<FilterState>({
    type: 'all',
    status: 'all',
    priority: 'all',
    dateRange: 'all',
    searchQuery: ''
  });

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ============================
  // CALCULATIONS & HELPERS
  // ============================

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-SA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeConfig = (type: TicketType) => {
    const configs = {
      'order-issue': { label: 'Order Issue', icon: ShoppingBag, color: 'text-red-600', bgColor: 'bg-red-50' },
      'custom-order': { label: 'Custom Order', icon: Settings, color: 'text-purple-600', bgColor: 'bg-purple-50' },
      'shipping-delivery': { label: 'Shipping', icon: Truck, color: 'text-blue-600', bgColor: 'bg-blue-50' },
      'payment-finance': { label: 'Payment', icon: DollarSign, color: 'text-green-600', bgColor: 'bg-green-50' },
      'technical': { label: 'Technical', icon: Zap, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
      'general': { label: 'General', icon: HelpCircle, color: 'text-gray-600', bgColor: 'bg-gray-50' }
    };
    return configs[type];
  };

  const getStatusConfig = (status: TicketStatus) => {
    const configs = {
      'open': { label: 'Open', color: 'text-blue-600', bgColor: 'bg-blue-50' },
      'pending': { label: 'Pending', color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
      'resolved': { label: 'Resolved', color: 'text-green-600', bgColor: 'bg-green-50' },
      'closed': { label: 'Closed', color: 'text-gray-600', bgColor: 'bg-gray-50' }
    };
    return configs[status];
  };

  const getPriorityConfig = (priority: string) => {
    const configs = {
      'urgent': { label: 'Urgent', color: 'text-red-600', bgColor: 'bg-red-50' },
      'high': { label: 'High', color: 'text-orange-600', bgColor: 'bg-orange-50' },
      'medium': { label: 'Medium', color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
      'low': { label: 'Low', color: 'text-green-600', bgColor: 'bg-green-50' }
    };
    return configs[priority as keyof typeof configs] || { label: 'Medium', color: 'text-gray-600', bgColor: 'bg-gray-50' };
  };

  const getUnreadCount = (ticket: SupportTicket) => {
    return ticket.messages.filter(msg => !msg.read && msg.sender !== 'seller').length;
  };

  // Calculate statistics
  const stats = React.useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter(t => t.status === 'open').length;
    const pending = tickets.filter(t => t.status === 'pending').length;
    const resolved = tickets.filter(t => t.status === 'resolved').length;
    const closed = tickets.filter(t => t.status === 'closed').length;
    const urgent = tickets.filter(t => t.priority === 'urgent').length;
    
    return {
      total,
      open,
      pending,
      resolved,
      closed,
      urgent,
      responseRate: total > 0 ? Math.round(((total - tickets.filter(t => 
        t.messages.length === 1 && t.messages[0].sender === 'seller'
      ).length) / total) * 100) : 0
    };
  }, [tickets]);

  // Filter tickets
  const filteredTickets = React.useMemo(() => {
    let filtered = [...tickets];

    // Apply search filter
    if (filterState.searchQuery) {
      const query = filterState.searchQuery.toLowerCase();
      filtered = filtered.filter(ticket =>
        ticket.ticket_id.toLowerCase().includes(query) ||
        ticket.subject.toLowerCase().includes(query) ||
        ticket.description.toLowerCase().includes(query) ||
        ticket.messages.some(msg => msg.message.toLowerCase().includes(query))
      );
    }

    // Apply type filter
    if (filterState.type !== 'all') {
      filtered = filtered.filter(ticket => ticket.type === filterState.type);
    }

    // Apply status filter
    if (filterState.status !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === filterState.status);
    }

    // Apply priority filter
    if (filterState.priority !== 'all') {
      filtered = filtered.filter(ticket => ticket.priority === filterState.priority);
    }

    // Apply date range filter
    const now = new Date();
    if (filterState.dateRange !== 'all') {
      filtered = filtered.filter(ticket => {
        const ticketDate = new Date(ticket.created_at);
        const diffDays = Math.floor((now.getTime() - ticketDate.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (filterState.dateRange) {
          case 'today':
            return diffDays === 0;
          case 'week':
            return diffDays <= 7;
          case 'month':
            return diffDays <= 30;
          default:
            return true;
        }
      });
    }

    // Sort by last response (most recent first)
    return filtered.sort((a, b) => 
      new Date(b.last_response_at).getTime() - new Date(a.last_response_at).getTime()
    );
  }, [tickets, filterState]);

  // ============================
  // HANDLERS
  // ============================

  const handleRefresh = async () => {
    setLoading(true);
    try {
      // Real Supabase query:
      /*
      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          messages (
            id,
            sender,
            message,
            attachments,
            timestamp,
            read
          )
        `)
        .eq('seller_id', user.id)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      setTickets(data || mockTickets);
      */
      
      await new Promise(resolve => setTimeout(resolve, 800));
      toast.success('Support tickets refreshed');
    } catch (error) {
      toast.error('Failed to refresh tickets');
      console.error('Refresh error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    // Validate
    if (!newTicketData.subject.trim() || !newTicketData.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (newTicketData.description.length > 1000) {
      toast.error('Description too long (max 1000 characters)');
      return;
    }

    try {
      // Real Supabase query:
      /*
      const ticketId = `TKT-${new Date().getFullYear()}-${String(tickets.length + 1).padStart(3, '0')}`;
      
      const { data, error } = await supabase
        .from('support_tickets')
        .insert({
          seller_id: user.id,
          ticket_id: ticketId,
          type: newTicketData.type,
          subject: newTicketData.subject,
          description: newTicketData.description,
          related_order_id: newTicketData.related_order_id,
          related_product_id: newTicketData.related_product_id,
          status: 'open',
          priority: newTicketData.priority,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_response_at: new Date().toISOString(),
          messages: [{
            id: `msg-${Date.now()}`,
            sender: 'seller',
            message: newTicketData.description,
            timestamp: new Date().toISOString(),
            read: true
          }]
        })
        .select();
      
      if (error) throw error;
      */

      const newTicket: SupportTicket = {
        id: `ticket-${Date.now()}`,
        ticket_id: `TKT-${new Date().getFullYear()}-${String(tickets.length + 1).padStart(3, '0')}`,
        type: newTicketData.type,
        subject: newTicketData.subject,
        description: newTicketData.description,
        related_order_id: newTicketData.related_order_id,
        related_product_id: newTicketData.related_product_id,
        status: 'open',
        priority: newTicketData.priority,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_response_at: new Date().toISOString(),
        messages: [{
          id: `msg-${Date.now()}`,
          sender: 'seller',
          message: newTicketData.description,
          timestamp: new Date().toISOString(),
          read: true
        }]
      };

      setTickets(prev => [newTicket, ...prev]);
      setShowNewTicket(false);
      setNewTicketData({
        type: 'general',
        subject: '',
        description: '',
        priority: 'medium',
        attachments: []
      });
      toast.success('Support ticket created successfully');
    } catch (error) {
      toast.error('Failed to create ticket');
      console.error('Create ticket error:', error);
    }
  };

  const handleSendResponse = async () => {
    if (!responseText.trim() || !activeTicket) return;

    try {
      const newMessage: TicketMessage = {
        id: `msg-${Date.now()}`,
        sender: 'seller',
        message: responseText,
        timestamp: new Date().toISOString(),
        read: true
      };

      // Real Supabase query:
      /*
      const { error } = await supabase
        .from('support_tickets')
        .update({
          messages: [...activeTicket.messages, newMessage],
          updated_at: new Date().toISOString(),
          last_response_at: new Date().toISOString(),
          status: activeTicket.status === 'resolved' ? 'open' : activeTicket.status
        })
        .eq('id', activeTicket.id);
      
      if (error) throw error;
      */

      const updatedTicket = {
        ...activeTicket,
        messages: [...activeTicket.messages, newMessage],
        updated_at: new Date().toISOString(),
        last_response_at: new Date().toISOString(),
        status: activeTicket.status === 'resolved' ? 'open' : activeTicket.status
      };

      setTickets(prev => prev.map(t => 
        t.id === activeTicket.id ? updatedTicket : t
      ));
      setActiveTicket(updatedTicket);
      setResponseText('');
      setResponseAttachments([]);
      
      toast.success('Response sent successfully');
    } catch (error) {
      toast.error('Failed to send response');
      console.error('Send response error:', error);
    }
  };

  const handleCloseTicket = async (ticketId: string) => {
    if (!window.confirm('Are you sure you want to close this ticket? This action cannot be undone.')) {
      return;
    }

    try {
      // Real Supabase query:
      /*
      const { error } = await supabase
        .from('support_tickets')
        .update({
          status: 'closed',
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);
      
      if (error) throw error;
      */

      setTickets(prev => prev.map(ticket =>
        ticket.id === ticketId
          ? { ...ticket, status: 'closed', updated_at: new Date().toISOString() }
          : ticket
      ));

      if (activeTicket?.id === ticketId) {
        setActiveTicket(prev => prev ? { ...prev, status: 'closed' } : null);
      }

      toast.success('Ticket closed successfully');
    } catch (error) {
      toast.error('Failed to close ticket');
      console.error('Close ticket error:', error);
    }
  };

  const handleMarkAsResolved = async (ticketId: string) => {
    try {
      // Real Supabase query:
      /*
      const { error } = await supabase
        .from('support_tickets')
        .update({
          status: 'resolved',
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);
      
      if (error) throw error;
      */

      setTickets(prev => prev.map(ticket =>
        ticket.id === ticketId
          ? { ...ticket, status: 'resolved', updated_at: new Date().toISOString() }
          : ticket
      ));

      if (activeTicket?.id === ticketId) {
        setActiveTicket(prev => prev ? { ...prev, status: 'resolved' } : null);
      }

      toast.success('Ticket marked as resolved');
    } catch (error) {
      toast.error('Failed to update ticket');
      console.error('Update ticket error:', error);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const validFiles = Array.from(files).filter(file => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast.error(`File ${file.name} is too large (max 10MB)`);
        return false;
      }
      return true;
    });

    setResponseAttachments(prev => [...prev, ...validFiles]);
  };

  const handleRemoveAttachment = (index: number) => {
    setResponseAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTicket?.messages]);

  // Mark admin messages as read when viewing
  useEffect(() => {
    if (activeTicket) {
      const unreadMessages = activeTicket.messages.filter(msg => !msg.read && msg.sender !== 'seller');
      if (unreadMessages.length > 0) {
        // Real Supabase query would update read status here
        const updatedTicket = {
          ...activeTicket,
          messages: activeTicket.messages.map(msg => 
            !msg.read && msg.sender !== 'seller' ? { ...msg, read: true } : msg
          )
        };
        setActiveTicket(updatedTicket);
        
        // Update in tickets list
        setTickets(prev => prev.map(t => 
          t.id === activeTicket.id ? updatedTicket : t
        ));
      }
    }
  }, [activeTicket]);

  // ============================
  // RENDER FUNCTIONS
  // ============================

  const renderHeader = () => (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Support Center</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage support tickets and communicate with the admin team
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => setShowNewTicket(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="w-4 h-4" />
              <span>New Ticket</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-6">
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="text-lg font-bold text-gray-900">{stats.total}</div>
            <div className="text-xs text-gray-600">Total Tickets</div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="text-lg font-bold text-blue-600">{stats.open}</div>
            <div className="text-xs text-gray-600">Open</div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="text-lg font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-xs text-gray-600">Pending</div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="text-lg font-bold text-green-600">{stats.resolved}</div>
            <div className="text-xs text-gray-600">Resolved</div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="text-lg font-bold text-red-600">{stats.urgent}</div>
            <div className="text-xs text-gray-600">Urgent</div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="text-lg font-bold text-purple-600">{stats.responseRate}%</div>
            <div className="text-xs text-gray-600">Response Rate</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFilters = () => (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tickets by ID, subject, or message..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filterState.searchQuery}
              onChange={(e) => setFilterState(prev => ({ ...prev, searchQuery: e.target.value }))}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {/* Type Filter */}
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={filterState.type}
            onChange={(e) => setFilterState(prev => ({ ...prev, type: e.target.value as any }))}
          >
            <option value="all">All Types</option>
            <option value="order-issue">Order Issue</option>
            <option value="custom-order">Custom Order</option>
            <option value="shipping-delivery">Shipping</option>
            <option value="payment-finance">Payment</option>
            <option value="technical">Technical</option>
            <option value="general">General</option>
          </select>

          {/* Status Filter */}
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={filterState.status}
            onChange={(e) => setFilterState(prev => ({ ...prev, status: e.target.value as any }))}
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          {/* Priority Filter */}
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={filterState.priority}
            onChange={(e) => setFilterState(prev => ({ ...prev, priority: e.target.value as any }))}
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Date Range Filter */}
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={filterState.dateRange}
            onChange={(e) => setFilterState(prev => ({ ...prev, dateRange: e.target.value as any }))}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>

          {/* Reset Filters */}
          <button
            onClick={() => setFilterState({
              type: 'all',
              status: 'all',
              priority: 'all',
              dateRange: 'all',
              searchQuery: ''
            })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );

  const renderTicketsTable = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ticket ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type & Subject
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Updated
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTickets.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-1">No support tickets found</h3>
                  <p className="text-gray-500 text-sm">Try adjusting your filters or create a new ticket</p>
                </td>
              </tr>
            ) : (
              filteredTickets.map((ticket) => {
                const typeConfig = getTypeConfig(ticket.type);
                const statusConfig = getStatusConfig(ticket.status);
                const priorityConfig = getPriorityConfig(ticket.priority);
                const unreadCount = getUnreadCount(ticket);
                const TypeIcon = typeConfig.icon;

                return (
                  <tr 
                    key={ticket.id} 
                    className={`hover:bg-gray-50 transition-colors ${
                      unreadCount > 0 ? 'bg-blue-50' : ''
                    }`}
                  >
                    {/* Ticket ID */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-lg ${typeConfig.bgColor}`}>
                          <TypeIcon className={`w-4 h-4 ${typeConfig.color}`} />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-mono font-bold text-gray-900">
                            {ticket.ticket_id}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDate(ticket.created_at)}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Type & Subject */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-900 line-clamp-1">
                          {ticket.subject}
                        </div>
                        <div className="text-xs text-gray-600 line-clamp-2">
                          {ticket.description}
                        </div>
                        {ticket.related_order_id && (
                          <div className="text-xs text-gray-500">
                            Order: {ticket.related_order_id}
                          </div>
                        )}
                        {unreadCount > 0 && (
                          <div className="flex items-center mt-1">
                            <Bell className="w-3 h-3 text-blue-500 mr-1" />
                            <span className="text-xs font-medium text-blue-600">
                              {unreadCount} unread {unreadCount === 1 ? 'message' : 'messages'}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityConfig.bgColor} ${priorityConfig.color}`}>
                        {priorityConfig.label}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </td>

                    {/* Last Updated */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(ticket.updated_at)}
                      {ticket.assigned_admin && (
                        <div className="text-xs text-gray-400 mt-1">
                          Assigned to: {ticket.assigned_admin}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setActiveTicket(ticket);
                            setShowDetailsModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            setActiveTicket(ticket);
                            setShowDetailsModal(true);
                          }}
                          className="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded"
                          title="Respond"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>

                        {ticket.status === 'open' && (
                          <button
                            onClick={() => handleMarkAsResolved(ticket.id)}
                            className="text-purple-600 hover:text-purple-900 p-1 hover:bg-purple-50 rounded"
                            title="Mark as Resolved"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => handleCloseTicket(ticket.id)}
                          className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
                          title="Close Ticket"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTicketDetailsModal = () => (
    showDetailsModal && activeTicket && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {activeTicket.subject}
                </h3>
                <div className="flex items-center space-x-3 mt-1">
                  <span className="text-sm font-mono text-gray-600">
                    {activeTicket.ticket_id}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusConfig(activeTicket.status).bgColor} ${getStatusConfig(activeTicket.status).color}`}>
                    {getStatusConfig(activeTicket.status).label}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityConfig(activeTicket.priority).bgColor} ${getPriorityConfig(activeTicket.priority).color}`}>
                    {getPriorityConfig(activeTicket.priority).label}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Content */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full flex">
              {/* Ticket Info Sidebar */}
              <div className="w-64 border-r border-gray-200 bg-gray-50 p-4 overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Ticket Details</h4>
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs text-gray-600">Type:</span>
                        <div className="text-sm font-medium text-gray-900">
                          {getTypeConfig(activeTicket.type).label}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-600">Created:</span>
                        <div className="text-sm font-medium text-gray-900">
                          {formatDate(activeTicket.created_at)}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-600">Last Updated:</span>
                        <div className="text-sm font-medium text-gray-900">
                          {formatDate(activeTicket.updated_at)}
                        </div>
                      </div>
                      {activeTicket.related_order_id && (
                        <div>
                          <span className="text-xs text-gray-600">Related Order:</span>
                          <div className="text-sm font-medium text-gray-900">
                            {activeTicket.related_order_id}
                          </div>
                        </div>
                      )}
                      {activeTicket.assigned_admin && (
                        <div>
                          <span className="text-xs text-gray-600">Assigned To:</span>
                          <div className="text-sm font-medium text-gray-900">
                            {activeTicket.assigned_admin}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Quick Actions</h4>
                    <div className="space-y-2">
                      {activeTicket.status !== 'resolved' && activeTicket.status !== 'closed' && (
                        <button
                          onClick={() => handleMarkAsResolved(activeTicket.id)}
                          className="w-full px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                        >
                          Mark as Resolved
                        </button>
                      )}
                      {activeTicket.status !== 'closed' && (
                        <button
                          onClick={() => handleCloseTicket(activeTicket.id)}
                          className="w-full px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
                        >
                          Close Ticket
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Conversation Thread */}
              <div className="flex-1 flex flex-col">
                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-6">
                    {activeTicket.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender === 'seller' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-2xl rounded-lg p-4 ${
                            message.sender === 'seller'
                              ? 'bg-blue-50 border border-blue-100'
                              : message.sender === 'admin'
                              ? 'bg-gray-50 border border-gray-100'
                              : 'bg-yellow-50 border border-yellow-100'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div className={`p-1 rounded ${
                                message.sender === 'seller'
                                  ? 'bg-blue-100'
                                  : message.sender === 'admin'
                                  ? 'bg-gray-100'
                                  : 'bg-yellow-100'
                              }`}>
                                {message.sender === 'seller' ? (
                                  <User className="w-3 h-3 text-blue-600" />
                                ) : message.sender === 'admin' ? (
                                  <Award className="w-3 h-3 text-gray-600" />
                                ) : (
                                  <AlertCircle className="w-3 h-3 text-yellow-600" />
                                )}
                              </div>
                              <span className="text-xs font-medium text-gray-700">
                                {message.sender === 'seller' ? 'You' : 
                                 message.sender === 'admin' ? 'Support Admin' : 'System'}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {formatDate(message.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-900 whitespace-pre-wrap">
                            {message.message}
                          </p>
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-3">
                              <div className="text-xs text-gray-600 mb-1">Attachments:</div>
                              <div className="flex flex-wrap gap-2">
                                {message.attachments.map((attachment, idx) => (
                                 <a
  key={idx}
  href="#"
  onClick={(e) => {
    e.preventDefault();
    // Use toast() with an info icon instead of toast.info
    toast(`Downloading ${attachment}`, {
      icon: "ℹ️", // info icon
      duration: 3000, // optional: set duration
    });
    // TODO: actual download logic here
  }}
  className="inline-flex items-center space-x-1 px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-700 hover:bg-gray-50"
></a>
                                ))}
                              </div>
                            </div>
                          )}
                          {!message.read && message.sender !== 'seller' && (
                            <div className="flex items-center mt-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                              <span className="text-xs text-blue-600">Unread</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Response Input */}
                {activeTicket.status !== 'closed' && activeTicket.status !== 'resolved' ? (
                  <div className="border-t border-gray-200 p-4">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Your Response
                        </label>
                        <textarea
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Type your response here..."
                          maxLength={1000}
                        />
                        <div className="text-xs text-gray-500 mt-1 text-right">
                          {responseText.length}/1000 characters
                        </div>
                      </div>

                      {/* Attachments */}
                      {responseAttachments.length > 0 && (
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Attachments:</div>
                          <div className="flex flex-wrap gap-2">
                            {responseAttachments.map((file, index) => (
                              <div
                                key={index}
                                className="inline-flex items-center space-x-1 px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs text-gray-700"
                              >
                                <Paperclip className="w-3 h-3" />
                                <span className="max-w-[100px] truncate">{file.name}</span>
                                <button
                                  onClick={() => handleRemoveAttachment(index)}
                                  className="text-gray-400 hover:text-red-500"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div>
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            multiple
                            className="hidden"
                          />
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Paperclip className="w-4 h-4" />
                            <span>Add Attachment</span>
                          </button>
                          <p className="text-xs text-gray-500 mt-1">
                            Max file size: 10MB each
                          </p>
                        </div>

                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => {
                              setResponseText('');
                              setResponseAttachments([]);
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                          >
                            Clear
                          </button>
                          <button
                            onClick={handleSendResponse}
                            disabled={!responseText.trim()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <div className="flex items-center space-x-2">
                              <Send className="w-4 h-4" />
                              <span>Send Response</span>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                    <div className="text-center py-4">
                      <CheckCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        This ticket is {activeTicket.status}. {activeTicket.status === 'resolved' 
                          ? 'You can reopen it by sending a new response.' 
                          : 'No further responses can be sent.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  );

  const renderNewTicketModal = () => (
    showNewTicket && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Create New Support Ticket</h3>
              <button
                onClick={() => setShowNewTicket(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Submit a new support request to the admin team
            </p>
          </div>

          <div className="px-6 py-4 space-y-4">
            {/* Ticket Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ticket Type *
              </label>
              <select
                value={newTicketData.type}
                onChange={(e) => setNewTicketData(prev => ({ ...prev, type: e.target.value as TicketType }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="order-issue">Order Issue</option>
                <option value="custom-order">Custom Order</option>
                <option value="shipping-delivery">Shipping & Delivery</option>
                <option value="payment-finance">Payment & Finance</option>
                <option value="technical">Technical Support</option>
                <option value="general">General Inquiry</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority *
              </label>
              <select
                value={newTicketData.priority}
                onChange={(e) => setNewTicketData(prev => ({ ...prev, priority: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject *
              </label>
              <input
                type="text"
                value={newTicketData.subject}
                onChange={(e) => setNewTicketData(prev => ({ ...prev, subject: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Brief description of your issue"
                maxLength={200}
              />
            </div>

            {/* Related Order (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Related Order ID (Optional)
              </label>
              <input
                type="text"
                value={newTicketData.related_order_id || ''}
                onChange={(e) => setNewTicketData(prev => ({ ...prev, related_order_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., ORD-7894"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={newTicketData.description}
                onChange={(e) => setNewTicketData(prev => ({ ...prev, description: e.target.value }))}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Please provide detailed information about your issue..."
                maxLength={1000}
              />
              <div className="text-xs text-gray-500 mt-1 text-right">
                {newTicketData.description.length}/1000 characters
              </div>
            </div>

            {/* Note */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Tips for faster resolution</p>
                  <ul className="text-xs text-blue-700 mt-1 space-y-1">
                    <li>• Include order ID if related to specific order</li>
                    <li>• Provide screenshots for technical issues</li>
                    <li>• Be specific about what you need help with</li>
                    <li>• Urgent issues will get priority response</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              onClick={() => setShowNewTicket(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateTicket}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Submit Ticket
            </button>
          </div>
        </div>
      </div>
    )
  );

  // ============================
  // SUPABASE INTEGRATION (READY)
  // ============================

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true);
        // Real Supabase query structure:
        /*
        const { data, error } = await supabase
          .from('support_tickets')
          .select(`
            *,
            messages (
              id,
              sender,
              message,
              attachments,
              timestamp,
              read
            )
          `)
          .eq('seller_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setTickets(data || mockTickets);
        */
      } catch (error) {
        console.error('Error fetching support tickets:', error);
        toast.error('Failed to load support tickets');
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  // ============================
  // MAIN RENDER
  // ============================

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      {renderHeader()}

      {/* Main Content */}
      <main className="p-6 space-y-6">
        {/* Filters */}
        {renderFilters()}

        {/* Tickets Table */}
        {renderTicketsTable()}

        {/* Support Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-start space-x-3">
              <Phone className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">Phone Support</h4>
                <p className="text-xs text-gray-600 mt-1">
                  Call us at: <span className="font-semibold">+966 800 123 4567</span>
                </p>
                <p className="text-xs text-gray-500">Sunday - Thursday, 9 AM - 6 PM</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-start space-x-3">
              <Mail className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">Email Support</h4>
                <p className="text-xs text-gray-600 mt-1">
                  Email: <span className="font-semibold">sellersupport@marketplace.com</span>
                </p>
                <p className="text-xs text-gray-500">Response within 24 hours</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-start space-x-3">
              <Clock className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">Response Times</h4>
                <p className="text-xs text-gray-600 mt-1">
                  Urgent: 2 hours<br />
                  High: 4 hours<br />
                  Medium: 8 hours<br />
                  Low: 24 hours
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Empty State for No Tickets */}
        {tickets.length === 0 && !loading && (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Support Tickets Yet</h3>
            <p className="text-gray-500 text-sm mb-6">
              When you need help with orders, payments, or any marketplace issue, create a support ticket.
            </p>
            <button
              onClick={() => setShowNewTicket(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              <span>Create Your First Ticket</span>
            </button>
          </div>
        )}
      </main>

      {/* Modals */}
      {renderTicketDetailsModal()}
      {renderNewTicketModal()}
    </div>
  );
};

export default SupportPage;