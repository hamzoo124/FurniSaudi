import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Package, 
  Clock, 
  MapPin, 
  Settings, 
  RefreshCw, 
  Save,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  User,
  Phone,
  Home,
  DollarSign,
  Wrench,
  Shield,
  Building,
  Globe,
  Send,
  PhoneCall,
  MessageSquare,
  Download,
  Filter,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  X,
  Plus,
  Trash2,
  History,
  Award,
  TrendingUp,
  AlertTriangle,
  Bell
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

// ============================
// TYPES
// ============================

interface DeliverySettings {
  self_delivery: boolean;
  platform_delivery: boolean;
  third_party_delivery: boolean;
  installation_service: boolean;
  assembly_required: boolean;
  installation_fee: number;
  installation_time: number;
  free_delivery_threshold: number;
  next_day_delivery: boolean;
  weekend_delivery: boolean;
  delivery_insurance: boolean;
}

interface DeliveryRegion {
  id: string;
  region: string;
  fee: number;
  estimated_days: number;
  min_order_amount: number;
  active: boolean;
  cities: string[];
}

interface DeliveryOrder {
  id: string;
  order_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  delivery_address: string;
  delivery_method: 'self' | 'platform' | 'third-party';
  region: string;
  city: string;
  scheduled_date: string;
  actual_delivery_date?: string;
  status: 'scheduled' | 'confirmed' | 'in-transit' | 'out-for-delivery' | 'delivered' | 'failed' | 'rescheduled';
  installation_required: boolean;
  installation_status: 'pending' | 'scheduled' | 'completed' | 'cancelled';
  delivery_fee: number;
  installation_fee: number;
  total_amount: number;
  delivery_notes?: string;
  driver_name?: string;
  driver_phone?: string;
  tracking_number?: string;
  signature_required: boolean;
  created_at: string;
  updated_at: string;
}

interface DeliveryPerformance {
  total_deliveries: number;
  on_time_deliveries: number;
  average_delivery_time: number;
  customer_rating: number;
  failed_deliveries: number;
  installation_rate: number;
}

// ============================
// MOCK DATA
// ============================

const initialSettings: DeliverySettings = {
  self_delivery: true,
  platform_delivery: true,
  third_party_delivery: false,
  installation_service: true,
  assembly_required: true,
  installation_fee: 200,
  installation_time: 2,
  free_delivery_threshold: 5000,
  next_day_delivery: true,
  weekend_delivery: false,
  delivery_insurance: true
};

const initialRegions: DeliveryRegion[] = [
  {
    id: '1',
    region: 'Riyadh',
    fee: 150,
    estimated_days: 2,
    min_order_amount: 0,
    active: true,
    cities: ['Riyadh', 'Diriyah', 'Al Kharj']
  },
  {
    id: '2',
    region: 'Jeddah',
    fee: 250,
    estimated_days: 3,
    min_order_amount: 1000,
    active: true,
    cities: ['Jeddah', 'Makkah', 'Taif']
  },
  {
    id: '3',
    region: 'Dammam (Eastern)',
    fee: 300,
    estimated_days: 4,
    min_order_amount: 1500,
    active: true,
    cities: ['Dammam', 'Khobar', 'Dhahran', 'Qatif']
  },
  {
    id: '4',
    region: 'Madinah',
    fee: 350,
    estimated_days: 5,
    min_order_amount: 2000,
    active: true,
    cities: ['Madinah', 'Yanbu']
  },
  {
    id: '5',
    region: 'Other Cities',
    fee: 500,
    estimated_days: 7,
    min_order_amount: 5000,
    active: true,
    cities: ['Abha', 'Jazan', 'Tabuk', 'Hail']
  }
];

const mockDeliveries: DeliveryOrder[] = [
  {
    id: 'DLV-001',
    order_id: 'ORD-7894',
    customer_name: 'Ahmed Al-Mansoor',
    customer_phone: '+966 55 123 4567',
    customer_email: 'ahmed@example.com',
    delivery_address: 'King Abdullah Road, Riyadh 12345',
    delivery_method: 'self',
    region: 'Riyadh',
    city: 'Riyadh',
    scheduled_date: '2024-01-18T10:00:00Z',
    status: 'confirmed',
    installation_required: true,
    installation_status: 'scheduled',
    delivery_fee: 150,
    installation_fee: 200,
    total_amount: 2450,
    delivery_notes: 'Large sofa - ground floor only',
    driver_name: 'Mohammed Ali',
    driver_phone: '+966 55 987 6543',
    signature_required: true,
    created_at: '2024-01-15T14:30:00Z',
    updated_at: '2024-01-16T09:15:00Z'
  },
  {
    id: 'DLV-002',
    order_id: 'ORD-7893',
    customer_name: 'Sarah Johnson',
    customer_phone: '+966 50 234 5678',
    customer_email: 'sarah@example.com',
    delivery_address: 'Al Hamra District, Jeddah 23456',
    delivery_method: 'platform',
    region: 'Jeddah',
    city: 'Jeddah',
    scheduled_date: '2024-01-19T14:00:00Z',
    status: 'in-transit',
    installation_required: false,
    installation_status: 'pending',
    delivery_fee: 250,
    installation_fee: 0,
    total_amount: 1890,
    tracking_number: 'TRK-7893-001',
    signature_required: true,
    created_at: '2024-01-14T11:20:00Z',
    updated_at: '2024-01-17T15:30:00Z'
  },
  {
    id: 'DLV-003',
    order_id: 'ORD-7892',
    customer_name: 'Mohammed Khan',
    customer_phone: '+966 56 345 6789',
    customer_email: 'mohammed@example.com',
    delivery_address: 'Al Khobar Corniche, Dammam 34567',
    delivery_method: 'third-party',
    region: 'Dammam (Eastern)',
    city: 'Khobar',
    scheduled_date: '2024-01-17T09:00:00Z',
    actual_delivery_date: '2024-01-17T09:30:00Z',
    status: 'delivered',
    installation_required: true,
    installation_status: 'completed',
    delivery_fee: 300,
    installation_fee: 200,
    total_amount: 3250,
    delivery_notes: 'Elevator available - 12th floor',
    driver_name: 'Aramex Delivery',
    signature_required: true,
    created_at: '2024-01-12T16:45:00Z',
    updated_at: '2024-01-17T10:00:00Z'
  },
  {
    id: 'DLV-004',
    order_id: 'ORD-7891',
    customer_name: 'Fatima Al-Sayed',
    customer_phone: '+966 54 456 7890',
    customer_email: 'fatima@example.com',
    delivery_address: 'Prince Sultan Street, Riyadh 12345',
    delivery_method: 'self',
    region: 'Riyadh',
    city: 'Riyadh',
    scheduled_date: '2024-01-20T11:00:00Z',
    status: 'scheduled',
    installation_required: false,
    installation_status: 'pending',
    delivery_fee: 150,
    installation_fee: 0,
    total_amount: 1560,
    signature_required: true,
    created_at: '2024-01-16T09:10:00Z',
    updated_at: '2024-01-16T09:10:00Z'
  },
  {
    id: 'DLV-005',
    order_id: 'ORD-7890',
    customer_name: 'Robert Chen',
    customer_phone: '+966 53 567 8901',
    customer_email: 'robert@example.com',
    delivery_address: 'Al Rawdah District, Jeddah 23456',
    delivery_method: 'platform',
    region: 'Jeddah',
    city: 'Jeddah',
    scheduled_date: '2024-01-16T13:00:00Z',
    status: 'out-for-delivery',
    installation_required: true,
    installation_status: 'scheduled',
    delivery_fee: 250,
    installation_fee: 200,
    total_amount: 2890,
    tracking_number: 'TRK-7890-001',
    driver_name: 'Platform Driver',
    driver_phone: '+966 55 111 2222',
    signature_required: true,
    created_at: '2024-01-11T10:45:00Z',
    updated_at: '2024-01-16T08:00:00Z'
  },
  {
    id: 'DLV-006',
    order_id: 'ORD-7889',
    customer_name: 'Ali Hassan',
    customer_phone: '+966 52 678 9012',
    customer_email: 'ali@example.com',
    delivery_address: 'Al Aziziyah, Dammam 34567',
    delivery_method: 'self',
    region: 'Dammam (Eastern)',
    city: 'Dammam',
    scheduled_date: '2024-01-15T15:00:00Z',
    status: 'failed',
    installation_required: false,
    installation_status: 'cancelled',
    delivery_fee: 300,
    installation_fee: 0,
    total_amount: 2100,
    delivery_notes: 'Customer not available - reschedule required',
    signature_required: true,
    created_at: '2024-01-10T14:20:00Z',
    updated_at: '2024-01-15T16:30:00Z'
  },
  {
    id: 'DLV-007',
    order_id: 'ORD-7888',
    customer_name: 'Layla Ahmed',
    customer_phone: '+966 51 789 0123',
    customer_email: 'layla@example.com',
    delivery_address: 'King Fahd Road, Riyadh 12345',
    delivery_method: 'self',
    region: 'Riyadh',
    city: 'Riyadh',
    scheduled_date: '2024-01-21T10:00:00Z',
    status: 'rescheduled',
    installation_required: true,
    installation_status: 'scheduled',
    delivery_fee: 150,
    installation_fee: 200,
    total_amount: 3200,
    signature_required: true,
    created_at: '2024-01-14T16:10:00Z',
    updated_at: '2024-01-17T11:45:00Z'
  },
  {
    id: 'DLV-008',
    order_id: 'ORD-7887',
    customer_name: 'Khalid Omar',
    customer_phone: '+966 50 890 1234',
    customer_email: 'khalid@example.com',
    delivery_address: 'Al Faisaliyah, Jeddah 23456',
    delivery_method: 'platform',
    region: 'Jeddah',
    city: 'Jeddah',
    scheduled_date: '2024-01-18T16:00:00Z',
    status: 'confirmed',
    installation_required: false,
    installation_status: 'pending',
    delivery_fee: 250,
    installation_fee: 0,
    total_amount: 1750,
    tracking_number: 'TRK-7887-001',
    signature_required: true,
    created_at: '2024-01-13T12:30:00Z',
    updated_at: '2024-01-17T14:20:00Z'
  }
];

// ============================
// MAIN COMPONENT
// ============================

const ShippingDelivery: React.FC = () => {
  // State Management
  const [settings, setSettings] = useState<DeliverySettings>(initialSettings);
  const [regions, setRegions] = useState<DeliveryRegion[]>(initialRegions);
  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>(mockDeliveries);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryOrder | null>(null);
  const [editingRegion, setEditingRegion] = useState<DeliveryRegion | null>(null);
  const [editingRegionIndex, setEditingRegionIndex] = useState<number | null>(null);
  const [showAddRegion, setShowAddRegion] = useState(false);
  const [newRegion, setNewRegion] = useState<Partial<DeliveryRegion>>({
    region: '',
    fee: 0,
    estimated_days: 3,
    min_order_amount: 0,
    active: true,
    cities: ['']
  });
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRegion, setFilterRegion] = useState<string>('all');

  // ============================
  // CALCULATIONS & HELPERS
  // ============================

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-SA', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string): { bg: string; text: string; icon: React.ReactNode } => {
    switch (status) {
      case 'scheduled':
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-800',
          icon: <Calendar className="w-3 h-3" />
        };
      case 'confirmed':
        return {
          bg: 'bg-indigo-100',
          text: 'text-indigo-800',
          icon: <CheckCircle className="w-3 h-3" />
        };
      case 'in-transit':
        return {
          bg: 'bg-purple-100',
          text: 'text-purple-800',
          icon: <Truck className="w-3 h-3" />
        };
      case 'out-for-delivery':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          icon: <Package className="w-3 h-3" />
        };
      case 'delivered':
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          icon: <Award className="w-3 h-3" />
        };
      case 'failed':
        return {
          bg: 'bg-red-100',
          text: 'text-red-800',
          icon: <XCircle className="w-3 h-3" />
        };
      case 'rescheduled':
        return {
          bg: 'bg-orange-100',
          text: 'text-orange-800',
          icon: <History className="w-3 h-3" />
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          icon: <Clock className="w-3 h-3" />
        };
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'self':
        return <Truck className="w-4 h-4 text-blue-600" />;
      case 'platform':
        return <Building className="w-4 h-4 text-green-600" />;
      case 'third-party':
        return <Globe className="w-4 h-4 text-purple-600" />;
      default:
        return <Truck className="w-4 h-4" />;
    }
  };

  const getMethodText = (method: string) => {
    switch (method) {
      case 'self':
        return 'Self Delivery';
      case 'platform':
        return 'Platform Delivery';
      case 'third-party':
        return 'Third-Party';
      default:
        return method;
    }
  };

  // Calculate performance metrics
  const performanceMetrics = React.useMemo(() => {
    const total = deliveries.length;
    const delivered = deliveries.filter(d => d.status === 'delivered').length;
    const onTime = deliveries.filter(d => {
      if (d.status === 'delivered' && d.actual_delivery_date && d.scheduled_date) {
        const actual = new Date(d.actual_delivery_date);
        const scheduled = new Date(d.scheduled_date);
        return actual <= scheduled;
      }
      return false;
    }).length;
    const failed = deliveries.filter(d => d.status === 'failed').length;
    const withInstallation = deliveries.filter(d => d.installation_required).length;

    return {
      total_deliveries: total,
      on_time_deliveries: total > 0 ? Math.round((onTime / delivered) * 100) : 0,
      average_delivery_time: 2.5, // Mock average
      customer_rating: 4.7,
      failed_deliveries: total > 0 ? Math.round((failed / total) * 100) : 0,
      installation_rate: total > 0 ? Math.round((withInstallation / total) * 100) : 0
    };
  }, [deliveries]);

  // Filter deliveries
  const filteredDeliveries = React.useMemo(() => {
    let filtered = [...deliveries];
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(d => d.status === filterStatus);
    }
    
    if (filterRegion !== 'all') {
      filtered = filtered.filter(d => d.region === filterRegion);
    }
    
    return filtered;
  }, [deliveries, filterStatus, filterRegion]);

  // ============================
  // HANDLERS
  // ============================

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // In a real app, save to Supabase
      // const { error } = await supabase
      //   .from('delivery_settings')
      //   .upsert({
      //     seller_id: user.id,
      //     ...settings
      //   });
      
      // if (error) throw error;
      
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
      toast.success('Delivery settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      // In a real app, fetch from Supabase
      /*
      const { data: deliveryData, error: deliveryError } = await supabase
        .from('delivery_orders')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });
      
      if (deliveryError) throw deliveryError;
      
      const { data: settingsData, error: settingsError } = await supabase
        .from('delivery_settings')
        .select('*')
        .eq('seller_id', user.id)
        .single();
      
      if (settingsError) throw settingsError;
      
      setDeliveries(deliveryData || mockDeliveries);
      setSettings(settingsData || initialSettings);
      */
      
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API call
      toast.success('Delivery data refreshed');
    } catch (error) {
      toast.error('Failed to refresh data');
      console.error('Refresh error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDeliveryStatus = async (deliveryId: string, newStatus: string) => {
    try {
      // In a real app, update Supabase
      /*
      const { error } = await supabase
        .from('delivery_orders')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', deliveryId);
      
      if (error) throw error;
      */
      
      setDeliveries(prev => prev.map(delivery =>
        delivery.id === deliveryId
          ? {
              ...delivery,
              status: newStatus as any,
              updated_at: new Date().toISOString(),
              ...(newStatus === 'delivered' ? { actual_delivery_date: new Date().toISOString() } : {})
            }
          : delivery
      ));
      
      toast.success(`Delivery status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update delivery status');
      console.error('Update error:', error);
    }
  };

  const handleRescheduleDelivery = (deliveryId: string) => {
    const newDate = prompt('Enter new delivery date (YYYY-MM-DD HH:MM):');
    if (newDate) {
      setDeliveries(prev => prev.map(delivery =>
        delivery.id === deliveryId
          ? {
              ...delivery,
              scheduled_date: new Date(newDate).toISOString(),
              status: 'rescheduled' as any,
              updated_at: new Date().toISOString()
            }
          : delivery
      ));
      toast.success('Delivery rescheduled successfully');
    }
  };

  const handleUpdateRegion = (index: number, field: keyof DeliveryRegion, value: any) => {
    const updatedRegions = [...regions];
    updatedRegions[index] = {
      ...updatedRegions[index],
      [field]: value
    };
    setRegions(updatedRegions);
  };

  const handleAddRegion = () => {
    if (!newRegion.region || !newRegion.fee || !newRegion.estimated_days) {
      toast.error('Please fill in all required fields');
      return;
    }

    const region: DeliveryRegion = {
      id: `region-${Date.now()}`,
      region: newRegion.region!,
      fee: newRegion.fee!,
      estimated_days: newRegion.estimated_days!,
      min_order_amount: newRegion.min_order_amount || 0,
      active: newRegion.active || true,
      cities: newRegion.cities || ['']
    };

    setRegions(prev => [...prev, region]);
    setShowAddRegion(false);
    setNewRegion({
      region: '',
      fee: 0,
      estimated_days: 3,
      min_order_amount: 0,
      active: true,
      cities: ['']
    });
    toast.success('New delivery region added');
  };

  const handleDeleteRegion = (index: number) => {
    if (window.confirm('Are you sure you want to delete this delivery region?')) {
      const updatedRegions = regions.filter((_, i) => i !== index);
      setRegions(updatedRegions);
      toast.success('Delivery region deleted');
    }
  };

  const handleExportDeliveries = () => {
    const headers = [
      'Order ID',
      'Customer Name',
      'Delivery Method',
      'Region',
      'City',
      'Scheduled Date',
      'Status',
      'Delivery Fee',
      'Installation Fee',
      'Installation Required',
      'Delivery Address',
      'Tracking Number'
    ];

    const csvContent = [
      headers.join(','),
      ...deliveries.map(delivery => [
        `"${delivery.order_id}"`,
        `"${delivery.customer_name}"`,
        delivery.delivery_method,
        delivery.region,
        delivery.city,
        new Date(delivery.scheduled_date).toISOString(),
        delivery.status,
        formatCurrency(delivery.delivery_fee).replace(/[^\d.-]/g, ''),
        formatCurrency(delivery.installation_fee).replace(/[^\d.-]/g, ''),
        delivery.installation_required ? 'Yes' : 'No',
        `"${delivery.delivery_address}"`,
        delivery.tracking_number || 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deliveries-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    toast.success('Deliveries exported successfully');
  };

  // ============================
  // RENDER FUNCTIONS
  // ============================

  const renderHeader = () => (
    <div className="   sticky top-0 z-10 ">
      <div className="px-6 ">
        <div className="flex items-center justify-between overflow-hidden red-400 " >
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Shipping & Delivery</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage delivery options, charges, and track order shipments
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-yellow-400 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="flex items-center space-x-2 px-4 py-2 bg-yellow-400 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>

            <button
              onClick={handleExportDeliveries}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Performance Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-6">
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="text-lg font-bold text-gray-900">{performanceMetrics.total_deliveries}</div>
            <div className="text-xs text-gray-600">Total Deliveries</div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="text-lg font-bold text-green-600">{performanceMetrics.on_time_deliveries}%</div>
            <div className="text-xs text-gray-600">On-Time Rate</div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="text-lg font-bold text-blue-600">{performanceMetrics.average_delivery_time} days</div>
            <div className="text-xs text-gray-600">Avg. Delivery Time</div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="text-lg font-bold text-yellow-600">{performanceMetrics.customer_rating}/5</div>
            <div className="text-xs text-gray-600">Customer Rating</div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="text-lg font-bold text-red-600">{performanceMetrics.failed_deliveries}%</div>
            <div className="text-xs text-gray-600">Failed Deliveries</div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="text-lg font-bold text-purple-600">{performanceMetrics.installation_rate}%</div>
            <div className="text-xs text-gray-600">Installation Rate</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDeliveryConfigCards = () => (
    <div className="bg-white w-full rounded-lg p-6 shadow-sm border border-gray-200 mb-6">
      <h2 className="text-lg font-semibold overflow-hidden text-gray-900 mb-4">Delivery Configuration</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Self Delivery */}
        <div className={`p-4 rounded-lg border transition-all ${settings.self_delivery ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${settings.self_delivery ? 'bg-blue-100' : 'bg-gray-100'}`}>
                <Truck className="w-5 h-5 text-gray-700" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Self Delivery</h3>
                <p className="text-xs text-gray-600">You handle delivery yourself</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.self_delivery}
                onChange={(e) => setSettings(prev => ({ ...prev, self_delivery: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          {settings.self_delivery && (
            <div className="text-xs text-gray-600 mt-2">
              <p>• Requires your own delivery vehicles</p>
              <p>• Full control over delivery process</p>
              <p>• Recommended for bulky furniture</p>
            </div>
          )}
        </div>

        {/* Platform Delivery */}
        <div className={`p-4 rounded-lg border transition-all ${settings.platform_delivery ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${settings.platform_delivery ? 'bg-green-100' : 'bg-gray-100'}`}>
                <Building className="w-5 h-5 text-gray-700" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Platform Delivery</h3>
                <p className="text-xs text-gray-600">Marketplace handles delivery</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.platform_delivery}
                onChange={(e) => setSettings(prev => ({ ...prev, platform_delivery: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>
          {settings.platform_delivery && (
            <div className="text-xs text-gray-600 mt-2">
              <p>• Professional delivery service</p>
              <p>• Real-time tracking available</p>
              <p>• Standard rates apply</p>
            </div>
          )}
        </div>

        {/* Third-Party Courier */}
        <div className={`p-4 rounded-lg border transition-all ${settings.third_party_delivery ? 'border-purple-200 bg-purple-50' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${settings.third_party_delivery ? 'bg-purple-100' : 'bg-gray-100'}`}>
                <Globe className="w-5 h-5 text-gray-700" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Third-Party Courier</h3>
                <p className="text-xs text-gray-600">External courier service</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.third_party_delivery}
                onChange={(e) => setSettings(prev => ({ ...prev, third_party_delivery: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
          {settings.third_party_delivery && (
            <div className="text-xs text-gray-600 mt-2">
              <p>• Aramex, SMSA, etc.</p>
              <p>• Nationwide coverage</p>
              <p>• Additional costs may apply</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderDeliveryRegions = () => (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Delivery Charges & Regions</h2>
        <button
          onClick={() => setShowAddRegion(true)}
          className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          <span>Add Region</span>
        </button>
      </div>

     <div className="relative w-full overflow-x-auto overscroll-x-contain">
  <div className="inline-block min-w-full align-middle">
    <table className="min-w-[900px] w-full table-fixed divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="w-48 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
            Region
          </th>
          <th className="w-40 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
            Delivery Fee (SAR)
          </th>
          <th className="w-40 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
            Estimated Days
          </th>
          <th className="w-44 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
            Min Order
          </th>
          <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
            Status
          </th>
          <th className="w-24 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
            Actions
          </th>
        </tr>
      </thead>

      <tbody className="bg-white divide-y divide-gray-200">
        {regions.map((region, index) => (
          <tr key={region.id} className="hover:bg-gray-50">
            <td className="px-4 py-3">
              <div className="font-medium text-gray-900 truncate">
                {region.region}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {region.cities.join(", ")}
              </div>
            </td>

            <td className="px-4 py-3">
              <input
                type="number"
                value={region.fee}
                onChange={(e) =>
                  handleUpdateRegion(index, "fee", Number(e.target.value) || 0)
                }
                className="w-full max-w-[96px] px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
              />
            </td>

            <td className="px-4 py-3">
              <input
                type="number"
                value={region.estimated_days}
                onChange={(e) =>
                  handleUpdateRegion(
                    index,
                    "estimated_days",
                    Number(e.target.value) || 1
                  )
                }
                min="1"
                className="w-full max-w-[96px] px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
              />
            </td>

            <td className="px-4 py-3">
              <input
                type="number"
                value={region.min_order_amount}
                onChange={(e) =>
                  handleUpdateRegion(
                    index,
                    "min_order_amount",
                    Number(e.target.value) || 0
                  )
                }
                className="w-full max-w-[120px] px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
              />
            </td>

            <td className="px-4 py-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={region.active}
                  onChange={(e) =>
                    handleUpdateRegion(index, "active", e.target.checked)
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-green-600 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:bg-white after:rounded-full after:transition-all peer-checked:after:translate-x-full" />
              </label>
            </td>

            <td className="px-4 py-3">
              <button
                onClick={() => handleDeleteRegion(index)}
                className="p-1 text-red-600 hover:bg-red-50 rounded"
                title="Delete Region"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>


      {/* Add Region Modal */}
      {showAddRegion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Add New Delivery Region</h3>
                <button
                  onClick={() => setShowAddRegion(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Region Name *
                </label>
                <input
                  type="text"
                  value={newRegion.region}
                  onChange={(e) => setNewRegion(prev => ({ ...prev, region: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Riyadh, Jeddah, etc."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Fee (SAR) *
                  </label>
                  <input
                    type="number"
                    value={newRegion.fee}
                    onChange={(e) => setNewRegion(prev => ({ ...prev, fee: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Days *
                  </label>
                  <input
                    type="number"
                    value={newRegion.estimated_days}
                    onChange={(e) => setNewRegion(prev => ({ ...prev, estimated_days: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Order Amount (SAR)
                </label>
                <input
                  type="number"
                  value={newRegion.min_order_amount}
                  onChange={(e) => setNewRegion(prev => ({ ...prev, min_order_amount: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newRegion.active}
                    onChange={(e) => setNewRegion(prev => ({ ...prev, active: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowAddRegion(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddRegion}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Add Region
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderInstallationSettings = () => (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Installation & Assembly Settings</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Installation Service */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Installation Service</h3>
              <p className="text-sm text-gray-600">Professional furniture assembly</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.installation_service}
                onChange={(e) => setSettings(prev => ({ ...prev, installation_service: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {settings.installation_service && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Installation Fee (SAR)
                </label>
                <input
                  type="number"
                  value={settings.installation_fee}
                  onChange={(e) => setSettings(prev => ({ ...prev, installation_fee: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Installation Time (Hours)
                </label>
                <input
                  type="number"
                  value={settings.installation_time}
                  onChange={(e) => setSettings(prev => ({ ...prev, installation_time: parseInt(e.target.value) || 1 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                />
              </div>
            </>
          )}
        </div>

        {/* Additional Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Assembly Required</h3>
              <p className="text-sm text-gray-600">Furniture requires assembly</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.assembly_required}
                onChange={(e) => setSettings(prev => ({ ...prev, assembly_required: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Delivery Insurance</h3>
              <p className="text-sm text-gray-600">Protect against damage/loss</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.delivery_insurance}
                onChange={(e) => setSettings(prev => ({ ...prev, delivery_insurance: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Next-Day Delivery</h3>
              <p className="text-sm text-gray-600">Express delivery option</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.next_day_delivery}
                onChange={(e) => setSettings(prev => ({ ...prev, next_day_delivery: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Free Delivery Threshold (SAR)
            </label>
            <input
              type="number"
              value={settings.free_delivery_threshold}
              onChange={(e) => setSettings(prev => ({ ...prev, free_delivery_threshold: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Note */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-yellow-800">Important Note</p>
            <p className="text-sm text-yellow-700 mt-1">
              Installation service is typically required for large furniture items (sofas, beds, dining sets).
              Make sure to inform customers about assembly requirements before delivery.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderActiveDeliveries = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Active Deliveries</h2>
            <p className="text-sm text-gray-600 mt-1">
              {filteredDeliveries.length} deliveries found
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* Filter by Status */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="in-transit">In Transit</option>
              <option value="out-for-delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="failed">Failed</option>
              <option value="rescheduled">Rescheduled</option>
            </select>

            {/* Filter by Region */}
            <select
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Regions</option>
              {[...new Set(deliveries.map(d => d.region))].map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Delivery Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Region
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scheduled Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Installation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDeliveries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-1">No deliveries found</h3>
                    <p className="text-gray-500 text-sm">Try adjusting your filters</p>
                  </td>
                </tr>
              ) : (
                filteredDeliveries.map((delivery) => {
                  const statusColors = getStatusColor(delivery.status);
                  
                  return (
                    <tr key={delivery.id} className="hover:bg-gray-50 transition-colors">
                      {/* Order ID */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{delivery.order_id}</div>
                        <div className="text-xs text-gray-500">
                          {formatDate(delivery.created_at)}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{delivery.customer_name}</div>
                        <div className="text-xs text-gray-500">{delivery.customer_phone}</div>
                      </td>

                      {/* Delivery Method */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {getMethodIcon(delivery.delivery_method)}
                          <span className="text-sm text-gray-900">
                            {getMethodText(delivery.delivery_method)}
                          </span>
                        </div>
                        {delivery.tracking_number && (
                          <div className="text-xs text-gray-500 mt-1">
                            Track: {delivery.tracking_number}
                          </div>
                        )}
                      </td>

                      {/* Region */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{delivery.region}</span>
                        </div>
                        <div className="text-xs text-gray-500">{delivery.city}</div>
                      </td>

                      {/* Scheduled Date */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(delivery.scheduled_date)}
                        </div>
                        {delivery.actual_delivery_date && (
                          <div className="text-xs text-green-600">
                            Delivered: {formatDate(delivery.actual_delivery_date)}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors.bg} ${statusColors.text}`}>
                          {statusColors.icon}
                          <span className="ml-1 capitalize">{delivery.status.replace('-', ' ')}</span>
                        </span>
                      </td>

                      {/* Installation */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {delivery.installation_required ? (
                          <div className="flex items-center space-x-2">
                            <Wrench className="w-4 h-4 text-blue-600" />
                            <div>
                              <span className="text-sm font-medium text-gray-900">Required</span>
                              <div className="text-xs text-gray-500">
                                {formatCurrency(delivery.installation_fee)}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Not required</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedDelivery(delivery);
                              setShowDetailsModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleUpdateDeliveryStatus(delivery.id, 'confirmed')}
                            className="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded"
                            title="Confirm Delivery"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleRescheduleDelivery(delivery.id)}
                            className="text-yellow-600 hover:text-yellow-900 p-1 hover:bg-yellow-50 rounded"
                            title="Reschedule"
                          >
                            <Calendar className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleUpdateDeliveryStatus(delivery.id, 'delivered')}
                            className="text-purple-600 hover:text-purple-900 p-1 hover:bg-purple-50 rounded"
                            title="Mark as Delivered"
                          >
                            <Award className="w-4 h-4" />
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
    </div>
  );

  const renderDeliveryDetailsModal = () => (
    showDetailsModal && selectedDelivery && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delivery Details</h3>
                <p className="text-sm text-gray-600 mt-1">Order: {selectedDelivery.order_id}</p>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Order Info */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    Customer Information
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Name:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedDelivery.customer_name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Phone:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedDelivery.customer_phone}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Email:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedDelivery.customer_email}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                    <Home className="w-4 h-4 mr-2" />
                    Delivery Address
                  </h4>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-900">{selectedDelivery.delivery_address}</p>
                    <div className="flex items-center mt-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-1" />
                      {selectedDelivery.city}, {selectedDelivery.region}
                    </div>
                  </div>
                </div>

                {selectedDelivery.delivery_notes && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Delivery Notes
                    </h4>
                    <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-sm text-yellow-800">{selectedDelivery.delivery_notes}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Delivery Info */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                    <Truck className="w-4 h-4 mr-2" />
                    Delivery Information
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Delivery Method:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {getMethodText(selectedDelivery.delivery_method)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedDelivery.status).bg} ${getStatusColor(selectedDelivery.status).text}`}>
                        {selectedDelivery.status.replace('-', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Scheduled Date:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(selectedDelivery.scheduled_date)}
                      </span>
                    </div>
                    {selectedDelivery.driver_name && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Driver:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {selectedDelivery.driver_name}
                          {selectedDelivery.driver_phone && ` (${selectedDelivery.driver_phone})`}
                        </span>
                      </div>
                    )}
                    {selectedDelivery.tracking_number && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Tracking Number:</span>
                        <span className="text-sm font-medium text-gray-900 font-mono">
                          {selectedDelivery.tracking_number}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Financial Details
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Delivery Fee:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(selectedDelivery.delivery_fee)}
                      </span>
                    </div>
                    {selectedDelivery.installation_required && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Installation Fee:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(selectedDelivery.installation_fee)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between border-t border-gray-200 pt-2">
                      <span className="text-sm font-semibold text-gray-900">Total Delivery Cost:</span>
                      <span className="text-sm font-bold text-gray-900">
                        {formatCurrency(selectedDelivery.delivery_fee + selectedDelivery.installation_fee)}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedDelivery.installation_required && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                      <Wrench className="w-4 h-4 mr-2" />
                      Installation Details
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Status:</span>
                        <span className={`text-sm font-medium ${
                          selectedDelivery.installation_status === 'completed' ? 'text-green-600' :
                          selectedDelivery.installation_status === 'scheduled' ? 'text-blue-600' :
                          'text-yellow-600'
                        }`}>
                          {selectedDelivery.installation_status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Signature Required:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {selectedDelivery.signature_required ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex justify-between">
              <div className="text-sm text-gray-500">
                Last updated: {formatDate(selectedDelivery.updated_at)}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedDelivery.order_id);
                    toast.success('Order ID copied to clipboard');
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Copy Order ID
                </button>
                <button
                  onClick={() => {
                    handleUpdateDeliveryStatus(selectedDelivery.id, 'delivered');
                    setShowDetailsModal(false);
                  }}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                >
                  Mark as Delivered
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  );

  // ============================
  // SUPABASE INTEGRATION (READY)
  // ============================

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Real Supabase queries:
        /*
        const { data: settingsData, error: settingsError } = await supabase
          .from('delivery_settings')
          .select('*')
          .eq('seller_id', user.id)
          .single();
        
        if (settingsError) throw settingsError;
        
        const { data: regionsData, error: regionsError } = await supabase
          .from('delivery_regions')
          .select('*')
          .eq('seller_id', user.id)
          .order('region', { ascending: true });
        
        if (regionsError) throw regionsError;
        
        const { data: deliveriesData, error: deliveriesError } = await supabase
          .from('delivery_orders')
          .select('*')
          .eq('seller_id', user.id)
          .order('scheduled_date', { ascending: false })
          .limit(20);
        
        if (deliveriesError) throw deliveriesError;
        
        setSettings(settingsData || initialSettings);
        setRegions(regionsData || initialRegions);
        setDeliveries(deliveriesData || mockDeliveries);
        */
      } catch (error) {
        console.error('Error fetching delivery data:', error);
        toast.error('Failed to load delivery data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ============================
  // MAIN RENDER
  // ============================

  return (
    <div className="min-h-screen ">
      {/* Header with Stats */}
      {renderHeader()}

      {/* Main Content */}
      <main className=" space-y-6">
        {/* Delivery Configuration Cards */}
        {renderDeliveryConfigCards()}

        {/* Delivery Regions */}
        {renderDeliveryRegions()}

        {/* Installation Settings */}
        {renderInstallationSettings()}

        {/* Active Deliveries */}
        {renderActiveDeliveries()}

        {/* Additional Info Panel - FIXED: Changed Tool to Wrench */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">Delivery Insurance</h4>
                <p className="text-xs text-gray-600 mt-1">
                  All deliveries include insurance coverage up to SAR 50,000 against damage or loss during transit.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">Delivery Hours</h4>
                <p className="text-xs text-gray-600 mt-1">
                  Standard delivery hours: 9:00 AM - 6:00 PM, Sunday - Thursday. Weekend deliveries available upon request.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Wrench className="w-5 h-5 text-purple-600 mt-0.5" /> {/* FIXED: Changed from Tool to Wrench */}
              <div>
                <h4 className="text-sm font-medium text-gray-900">Installation Service</h4>
                <p className="text-xs text-gray-600 mt-1">
                  Professional installation teams available. All tools and equipment provided. 30-day service warranty.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Delivery Details Modal */}
      {renderDeliveryDetailsModal()}
    </div>
  );
};

export default ShippingDelivery;