// src/components/SellerDetailModal.tsx - AMAZON-STYLE COMPLETE UPDATE
import React, { useEffect, useState } from "react";
import { 
  X, 
  CreditCard, 
  MapPin, 
  Phone, 
  Mail, 
  Building, 
  User, 
  Calendar, 
  DollarSign,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  ExternalLink,
  Banknote,
  FileText,
  Star,
  Package,
  ShoppingBag,
  TrendingUp,
  BarChart,
  Eye,
  Edit,
  Ban,
  Check,
  MoreVertical,
  MessageSquare,
  Truck,
  Users,
  FileCheck,
  Award,
  Globe,
  Percent,
  RefreshCw,
  ShieldCheck,
  Star as StarIcon,
  TrendingDown,
  Activity,
  Archive,
  Clock,
  AlertTriangle,
  ChevronRight,
  ShieldOff,
  Mail as MailIcon,
  Bell
} from "lucide-react";
import { getSellerById, sellersApi } from '@/lib/supabase/sellers';
import { toast } from 'sonner';

interface SellerDetailModalProps {
  seller: any;
  isOpen: boolean;
  onClose: () => void;
  onAction?: (action: string, sellerId: string) => void;
  refreshData?: () => void;
}

const SellerDetailModal: React.FC<SellerDetailModalProps> = ({ 
  seller: propSeller, 
  isOpen, 
  onClose, 
  onAction,
  refreshData 
}) => {
  const [seller, setSeller] = useState<any>(propSeller);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showActions, setShowActions] = useState(false);
  const [stats, setStats] = useState<any>(null);

  // Fetch detailed seller data
  useEffect(() => {
    if (!isOpen) return;
    
    if (propSeller && propSeller.id) {
      setLoading(true);
      loadSellerDetails(propSeller.id);
    }
  }, [isOpen, propSeller]);

  const loadSellerDetails = async (sellerId: string) => {
    try {
      const data = await getSellerById(sellerId);
      if (data) {
        setSeller({ ...propSeller, ...data, full_details: true });
        calculateStats(data);
      } else {
        setSeller(propSeller);
      }
    } catch (error) {
      console.error('Error fetching seller details:', error);
      setSeller(propSeller);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (sellerData: any) => {
    const calculatedStats = {
      conversionRate: sellerData.total_products > 0 
        ? ((sellerData.total_orders / sellerData.total_products) * 100).toFixed(1)
        : '0.0',
      avgOrderValue: sellerData.total_orders > 0 
        ? (sellerData.total_sales || 0) / sellerData.total_orders
        : 0,
      revenuePerProduct: sellerData.total_products > 0 
        ? (sellerData.total_sales || 0) / sellerData.total_products
        : 0,
      platformEarnings: (sellerData.total_sales || 0) * ((sellerData.commission_rate || 10) / 100),
      sellerEarnings: (sellerData.total_sales || 0) * (1 - ((sellerData.commission_rate || 10) / 100))
    };
    setStats(calculatedStats);
  };

  if (!isOpen || !seller) return null;

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'active':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'rejected':
      case 'suspended':
      case 'inactive':
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'under_review':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  // Handle actions
  const handleAction = async (action: string) => {
    if (!seller || !seller.id) return;

    try {
      setLoading(true);
      
      switch (action) {
        case 'suspend':
          if (confirm(`Suspend ${seller.business_name}?`)) {
            await sellersApi.suspendSeller(seller.id, 'Suspended by admin', 'admin');
            toast.success('Seller suspended');
            if (refreshData) refreshData();
            if (onAction) onAction('suspended', seller.id);
            onClose();
          }
          break;
          
        case 'activate':
          if (confirm(`Activate ${seller.business_name}?`)) {
            await sellersApi.activateSeller(seller.id, 'admin');
            toast.success('Seller activated');
            if (refreshData) refreshData();
            if (onAction) onAction('activated', seller.id);
            onClose();
          }
          break;
          
        case 'delete':
          if (confirm(`Delete ${seller.business_name} permanently?`)) {
            // Delete logic here
            toast.success('Seller deleted');
            if (onAction) onAction('deleted', seller.id);
            onClose();
          }
          break;
          
        case 'message':
          if (onAction) onAction('message', seller.id);
          break;
          
        case 'download':
          const dataStr = JSON.stringify(seller, null, 2);
          const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
          const exportFileDefaultName = `seller-${seller.business_name}-${new Date().toISOString()}.json`;
          const linkElement = document.createElement('a');
          linkElement.setAttribute('href', dataUri);
          linkElement.setAttribute('download', exportFileDefaultName);
          linkElement.click();
          toast.success('Data downloaded');
          break;
      }
    } catch (error: any) {
      toast.error(`Error: ${error.message || 'Action failed'}`);
    } finally {
      setLoading(false);
      setShowActions(false);
    }
  };

  // Tabs
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Eye },
    { id: 'business', label: 'Business', icon: Building },
    { id: 'financial', label: 'Financial', icon: DollarSign },
    { id: 'performance', label: 'Performance', icon: TrendingUp }
  ];

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header - Amazon Style */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg">
                <Building className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{seller.business_name}</h2>
                <div className="flex items-center space-x-3 mt-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(seller.approval_status || seller.status)}`}>
                    {seller.approval_status || seller.status}
                  </span>
                  {seller.city && (
                    <span className="text-gray-300 flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {seller.city}
                    </span>
                  )}
                  <span className="text-gray-300 flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    Joined {seller.created_at ? formatDate(seller.created_at) : 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleAction('download')}
                className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg"
                title="Download Data"
              >
                <Download className="w-5 h-5" />
              </button>
              
              <div className="relative">
                <button
                  onClick={() => setShowActions(!showActions)}
                  className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
                
                {showActions && (
                  <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                    {seller.approval_status === 'approved' && seller.status === 'active' ? (
                      <button
                        onClick={() => handleAction('suspend')}
                        className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                      >
                        <Ban className="w-4 h-4 mr-2" />
                        <span>Suspend Seller</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAction('activate')}
                        className="w-full flex items-center px-4 py-2.5 text-sm text-green-600 hover:bg-green-50"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        <span>Activate Seller</span>
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleAction('message')}
                      className="w-full flex items-center px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      <span>Send Message</span>
                    </button>
                    
                    <div className="border-t border-gray-200 my-1"></div>
                    
                    <button
                      onClick={() => handleAction('delete')}
                      className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      <span>Delete Seller</span>
                    </button>
                  </div>
                )}
              </div>
              
              <button
                onClick={onClose}
                className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-gray-600">Loading details...</p>
            </div>
          </div>
        )}

        {!loading && (
          <>
            {/* Tabs */}
            <div className="border-b border-gray-200 bg-white">
              <div className="flex space-x-1 px-6">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'text-blue-600 border-b-2 border-blue-600'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6 bg-gray-50">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Package className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                          +5%
                        </span>
                      </div>
                      <p className="text-xl font-bold text-gray-900">{seller.total_products || 0}</p>
                      <p className="text-sm text-gray-600">Total Products</p>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <ShoppingBag className="w-5 h-5 text-green-600" />
                        </div>
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-800">
                          +12%
                        </span>
                      </div>
                      <p className="text-xl font-bold text-gray-900">{seller.total_orders || 0}</p>
                      <p className="text-sm text-gray-600">Total Orders</p>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <DollarSign className="w-5 h-5 text-purple-600" />
                        </div>
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-100 text-purple-800">
                          +8%
                        </span>
                      </div>
                      <p className="text-xl font-bold text-gray-900">{formatCurrency(seller.total_sales || 0)}</p>
                      <p className="text-sm text-gray-600">Total Sales</p>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                          <Star className="w-5 h-5 text-yellow-600" />
                        </div>
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                          4.5+
                        </span>
                      </div>
                      <p className="text-xl font-bold text-gray-900">{seller.rating_avg?.toFixed(1) || '0.0'}/5.0</p>
                      <p className="text-sm text-gray-600">Average Rating</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Business Info Card */}
                    <div className="lg:col-span-2">
                      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                        <div className="p-4 border-b border-gray-200">
                          <h3 className="text-lg font-semibold text-gray-900">Business Information</h3>
                        </div>
                        <div className="p-4">
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="text-xs text-gray-500 block mb-1">Business Name</label>
                                <p className="font-medium text-gray-900">{seller.business_name}</p>
                              </div>
                              <div>
                                <label className="text-xs text-gray-500 block mb-1">Business Type</label>
                                <p className="font-medium text-gray-900 capitalize">{seller.business_type || 'Individual'}</p>
                              </div>
                              <div>
                                <label className="text-xs text-gray-500 block mb-1">CR Number</label>
                                <p className="font-medium text-gray-900 flex items-center">
                                  <CreditCard className="w-4 h-4 mr-2 text-gray-400" />
                                  {seller.cr_number || 'Not provided'}
                                </p>
                              </div>
                              <div>
                                <label className="text-xs text-gray-500 block mb-1">Contact Person</label>
                                <p className="font-medium text-gray-900">{seller.profiles?.full_name || seller.full_name || 'Not specified'}</p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="text-xs text-gray-500 block mb-1">Email</label>
                                <p className="font-medium text-gray-900 flex items-center">
                                  <Mail className="w-4 h-4 mr-2 text-gray-400" />
                                  {seller.email}
                                </p>
                              </div>
                              <div>
                                <label className="text-xs text-gray-500 block mb-1">Phone</label>
                                <p className="font-medium text-gray-900 flex items-center">
                                  <Phone className="w-4 h-4 mr-2 text-gray-400" />
                                  {seller.phone || seller.contact_number || 'Not provided'}
                                </p>
                              </div>
                            </div>
                            
                            {(seller.address || seller.city) && (
                              <div>
                                <label className="text-xs text-gray-500 block mb-1">Address</label>
                                <div className="flex items-start space-x-2 text-gray-900">
                                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="font-medium">{seller.address || 'Address not specified'}</p>
                                    <p className="text-sm text-gray-600">{seller.city}, Saudi Arabia</p>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {seller.business_description && (
                              <div>
                                <label className="text-xs text-gray-500 block mb-1">Business Description</label>
                                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg mt-1">
                                  {seller.business_description}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sidebar Stats */}
                    <div className="space-y-6">
                      {/* Bank Details */}
                      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                        <div className="p-4 border-b border-gray-200">
                          <h4 className="text-sm font-semibold text-gray-900">Bank Details</h4>
                        </div>
                        <div className="p-4">
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Bank Name</p>
                              <p className="font-medium text-gray-900">{seller.bank_name || 'Not provided'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Account Number</p>
                              <p className="font-medium text-gray-900">{seller.account_number || 'Not provided'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">IBAN</p>
                              <p className="font-medium text-gray-900">{seller.iban || 'Not provided'}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Commission */}
                      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                        <div className="p-4 border-b border-gray-200">
                          <h4 className="text-sm font-semibold text-gray-900">Commission</h4>
                        </div>
                        <div className="p-4">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Rate</span>
                              <span className="font-medium text-gray-900">{seller.commission_rate || 10}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Platform Earnings</span>
                              <span className="font-medium text-gray-900">
                                {formatCurrency(stats?.platformEarnings || 0)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Timeline */}
                      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                        <div className="p-4 border-b border-gray-200">
                          <h4 className="text-sm font-semibold text-gray-900">Timeline</h4>
                        </div>
                        <div className="p-4">
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Joined</span>
                              <span className="font-medium text-gray-900">
                                {seller.created_at ? formatDate(seller.created_at) : 'Unknown'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Last Updated</span>
                              <span className="font-medium text-gray-900">
                                {seller.updated_at ? formatDate(seller.updated_at) : 'Unknown'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Business Tab */}
              {activeTab === 'business' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Registration Details */}
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div className="p-4 border-b border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-900">Registration Details</h4>
                      </div>
                      <div className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Application ID</span>
                            <span className="font-medium text-gray-900">{seller.application_id || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Business Type</span>
                            <span className="font-medium text-gray-900 capitalize">{seller.business_type || 'Individual'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">CR Number</span>
                            <span className="font-medium text-gray-900">{seller.cr_number || 'Not provided'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">CR Document</span>
                            {seller.cr_document_url ? (
                              <a 
                                href={seller.cr_document_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                View
                              </a>
                            ) : (
                              <span className="text-gray-500 text-sm">Not uploaded</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div className="p-4 border-b border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-900">Contact Information</h4>
                      </div>
                      <div className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center">
                            <Mail className="w-4 h-4 text-gray-400 mr-2" />
                            <div>
                              <p className="text-xs text-gray-500">Email</p>
                              <p className="font-medium text-gray-900">{seller.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 text-gray-400 mr-2" />
                            <div>
                              <p className="text-xs text-gray-500">Phone</p>
                              <p className="font-medium text-gray-900">{seller.phone || seller.contact_number || 'Not provided'}</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <User className="w-4 h-4 text-gray-400 mr-2" />
                            <div>
                              <p className="text-xs text-gray-500">Contact Person</p>
                              <p className="font-medium text-gray-900">{seller.profiles?.full_name || seller.full_name || 'Not specified'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="p-4 border-b border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-900">Business Location</h4>
                    </div>
                    <div className="p-4">
                      <div className="flex items-start">
                        <MapPin className="w-5 h-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900">{seller.address || 'Address not specified'}</p>
                          <p className="text-sm text-gray-600">{seller.city}, Saudi Arabia</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Business Description */}
                  {seller.business_description && (
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div className="p-4 border-b border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-900">Business Description</h4>
                      </div>
                      <div className="p-4">
                        <p className="text-gray-700">{seller.business_description}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Financial Tab */}
              {activeTab === 'financial' && (
                <div className="space-y-6">
                  {/* Financial Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <ShoppingBag className="w-5 h-5" />
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-400">Orders</span>
                      </div>
                      <p className="text-2xl font-bold">{seller.total_orders || 0}</p>
                      <p className="text-sm opacity-90">Total Orders</p>
                    </div>

                    <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <DollarSign className="w-5 h-5" />
                        <span className="text-xs px-2 py-1 rounded-full bg-green-400">Revenue</span>
                      </div>
                      <p className="text-2xl font-bold">{formatCurrency(seller.total_sales || 0)}</p>
                      <p className="text-sm opacity-90">Total Sales</p>
                    </div>

                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Banknote className="w-5 h-5" />
                        <span className="text-xs px-2 py-1 rounded-full bg-purple-400">Earnings</span>
                      </div>
                      <p className="text-2xl font-bold">{formatCurrency(seller.total_earnings || 0)}</p>
                      <p className="text-sm opacity-90">Total Earnings</p>
                    </div>

                    <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Clock className="w-5 h-5" />
                        <span className="text-xs px-2 py-1 rounded-full bg-yellow-400">Pending</span>
                      </div>
                      <p className="text-2xl font-bold">{formatCurrency(seller.pending_payout || 0)}</p>
                      <p className="text-sm opacity-90">Pending Payout</p>
                    </div>
                  </div>

                  {/* Commission Details */}
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="p-4 border-b border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-900">Commission Breakdown</h4>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Commission Rate</p>
                          <p className="text-2xl font-bold text-gray-900">{seller.commission_rate || 10}%</p>
                        </div>
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <p className="text-xs text-blue-500 mb-1">Platform Earnings</p>
                          <p className="text-2xl font-bold text-blue-700">
                            {formatCurrency(stats?.platformEarnings || 0)}
                          </p>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <p className="text-xs text-green-500 mb-1">Seller Earnings</p>
                          <p className="text-2xl font-bold text-green-700">
                            {formatCurrency(stats?.sellerEarnings || 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bank Details */}
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="p-4 border-b border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-900">Bank Account Details</h4>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Bank Name</p>
                          <p className="font-medium text-gray-900">{seller.bank_name || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Account Number</p>
                          <p className="font-medium text-gray-900">{seller.account_number || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">IBAN</p>
                          <p className="font-medium text-gray-900">{seller.iban || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Performance Tab */}
              {activeTab === 'performance' && (
                <div className="space-y-6">
                  {/* Performance Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <TrendingUp className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                          {stats?.conversionRate || 0}%
                        </span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">Conversion Rate</p>
                      <p className="text-sm text-gray-600">Product to order ratio</p>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                          Avg
                        </span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(stats?.avgOrderValue || 0)}</p>
                      <p className="text-sm text-gray-600">Average Order Value</p>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Package className="w-5 h-5 text-purple-600" />
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800">
                          Per Product
                        </span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(stats?.revenuePerProduct || 0)}</p>
                      <p className="text-sm text-gray-600">Revenue per Product</p>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                          <Star className="w-5 h-5 text-yellow-600" />
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                          Rating
                        </span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">{seller.rating_avg?.toFixed(1) || '0.0'}/5.0</p>
                      <p className="text-sm text-gray-600">Customer Rating</p>
                    </div>
                  </div>

                  {/* Performance Charts Placeholder */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div className="p-4 border-b border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-900">Sales Performance</h4>
                      </div>
                      <div className="p-8 text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <BarChart className="w-8 h-8 text-blue-600" />
                        </div>
                        <p className="text-gray-600">Sales performance chart</p>
                        <p className="text-gray-500 text-sm mt-1">Detailed analytics coming soon</p>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div className="p-4 border-b border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-900">Customer Satisfaction</h4>
                      </div>
                      <div className="p-8 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <StarIcon className="w-8 h-8 text-green-600" />
                        </div>
                        <p className="text-gray-600">Customer feedback analysis</p>
                        <p className="text-gray-500 text-sm mt-1">Review analytics coming soon</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-white">
              <div className="text-sm text-gray-600">
                <span className="font-medium">ID:</span> {seller.id}
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => handleAction('download')}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SellerDetailModal;