// src/components/admin/advertising/Advertising.tsx
import React, { useState, useEffect } from 'react';
import {
  Megaphone, TrendingUp, Target, DollarSign,
  Calendar, BarChart, Users, Globe,
  Facebook, Instagram, Twitter, Youtube,
  Smartphone, Monitor, CheckCircle, Clock,
  Plus, Edit, Trash2, Eye, Download,
  RefreshCw, Filter, Search, Upload,
  Bell, CreditCard, TrendingDown, Zap
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/lib/toast';

interface Campaign {
  id: string;
  name: string;
  type: 'social_media' | 'platform' | 'email' | 'search';
  platform: string;
  budget: number;
  spent: number;
  status: 'active' | 'paused' | 'completed' | 'draft';
  start_date: string;
  end_date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  target_audience: string[];
  ctr: number;
  roas: number;
}

interface QuickAdOption {
  id: string;
  name: string;
  description: string;
  icon: any;
  budget: number;
  duration: number;
  platforms: string[];
  recommended: boolean;
}

const Advertising: React.FC = () => {
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'quick_ads' | 'analytics'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Campaign states
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  
  // New campaign form
  const [showNewCampaignModal, setShowNewCampaignModal] = useState(false);
  const [showQuickAdModal, setShowQuickAdModal] = useState(false);
  const [selectedQuickAd, setSelectedQuickAd] = useState<QuickAdOption | null>(null);
  
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    type: 'social_media' as 'social_media' | 'platform' | 'email' | 'search',
    platform: 'facebook',
    budget: 1000,
    duration: 7,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    target_audience: ['all_users'] as string[],
    ad_copy: '',
    image_url: '',
    call_to_action: 'shop_now',
    bid_strategy: 'lowest_cost'
  });
  
  // Quick advertising options
  const quickAdOptions: QuickAdOption[] = [
    {
      id: '1',
      name: 'Weekend Flash Sale',
      description: 'Promote weekend specials across all platforms',
      icon: Zap,
      budget: 500,
      duration: 3,
      platforms: ['facebook', 'instagram', 'platform'],
      recommended: true
    },
    {
      id: '2',
      name: 'New Collection Launch',
      description: 'Announce new product collection',
      icon: Bell,
      budget: 1000,
      duration: 7,
      platforms: ['instagram', 'youtube', 'email'],
      recommended: true
    },
    {
      id: '3',
      name: 'Cart Abandonment',
      description: 'Target users who abandoned carts',
      icon: ShoppingCart,
      budget: 300,
      duration: 5,
      platforms: ['facebook', 'email'],
      recommended: false
    },
    {
      id: '4',
      name: 'Mobile App Promotion',
      description: 'Drive mobile app installations',
      icon: Smartphone,
      budget: 800,
      duration: 14,
      platforms: ['facebook', 'instagram', 'google_ads'],
      recommended: false
    },
    {
      id: '5',
      name: 'Brand Awareness',
      description: 'Increase brand visibility',
      icon: TrendingUp,
      budget: 1500,
      duration: 30,
      platforms: ['facebook', 'instagram', 'youtube'],
      recommended: true
    },
    {
      id: '6',
      name: 'Seasonal Campaign',
      description: 'Holiday or seasonal promotion',
      icon: Calendar,
      budget: 2000,
      duration: 30,
      platforms: ['all'],
      recommended: false
    }
  ];
  
  // Platform options
  const platformOptions = [
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'text-blue-600' },
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'text-pink-600' },
    { id: 'twitter', name: 'Twitter', icon: Twitter, color: 'text-blue-400' },
    { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'text-red-600' },
    { id: 'google_ads', name: 'Google Ads', icon: Globe, color: 'text-green-600' },
    { id: 'platform', name: 'Our Platform', icon: Monitor, color: 'text-gray-700' },
    { id: 'email', name: 'Email', icon: Mail, color: 'text-purple-600' }
  ];
  
  // Audience options
  const audienceOptions = [
    { id: 'all_users', name: 'All Users', count: '10K+' },
    { id: 'active_buyers', name: 'Active Buyers', count: '2.5K' },
    { id: 'cart_abandoners', name: 'Cart Abandoners', count: '1.2K' },
    { id: 'repeat_customers', name: 'Repeat Customers', count: '3.1K' },
    { id: 'new_users', name: 'New Users (30 days)', count: '4.8K' },
    { id: 'high_spenders', name: 'High Spenders', count: '850' },
    { id: 'mobile_users', name: 'Mobile App Users', count: '6.2K' }
  ];
  
  // CTAs
  const ctaOptions = [
    { id: 'shop_now', name: 'Shop Now', color: 'bg-blue-600 text-white' },
    { id: 'learn_more', name: 'Learn More', color: 'bg-gray-700 text-white' },
    { id: 'sign_up', name: 'Sign Up', color: 'bg-green-600 text-white' },
    { id: 'download', name: 'Download', color: 'bg-purple-600 text-white' },
    { id: 'book_now', name: 'Book Now', color: 'bg-red-600 text-white' },
    { id: 'contact_us', name: 'Contact Us', color: 'bg-yellow-600 text-white' }
  ];
  
  // Stats
  const [stats, setStats] = useState({
    totalSpent: 12500,
    activeCampaigns: 8,
    roas: 3.2,
    totalImpressions: 2450000,
    totalClicks: 125000,
    totalConversions: 8500
  });
  
  // Fetch campaigns from database
  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('advertising_campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setCampaigns(data || []);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      // For demo, use sample data
      setCampaigns([
        {
          id: '1',
          name: 'Summer Collection 2024',
          type: 'social_media',
          platform: 'instagram',
          budget: 2500,
          spent: 1800,
          status: 'active',
          start_date: '2024-06-01',
          end_date: '2024-08-31',
          impressions: 1250000,
          clicks: 45000,
          conversions: 3200,
          target_audience: ['all_users', 'active_buyers'],
          ctr: 3.6,
          roas: 2.8
        },
        {
          id: '2',
          name: 'Mobile App Launch',
          type: 'platform',
          platform: 'platform',
          budget: 5000,
          spent: 3200,
          status: 'active',
          start_date: '2024-07-15',
          end_date: '2024-09-15',
          impressions: 850000,
          clicks: 68000,
          conversions: 4100,
          target_audience: ['mobile_users', 'new_users'],
          ctr: 8.0,
          roas: 4.1
        },
        {
          id: '3',
          name: 'Back to School Sale',
          type: 'social_media',
          platform: 'facebook',
          budget: 1800,
          spent: 1250,
          status: 'completed',
          start_date: '2024-08-01',
          end_date: '2024-08-31',
          impressions: 350000,
          clicks: 12000,
          conversions: 1200,
          target_audience: ['all_users'],
          ctr: 3.4,
          roas: 2.2
        }
      ]);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchCampaigns();
  }, []);
  
  // Handle new campaign submission
  const handleCreateCampaign = async () => {
    if (!newCampaign.name.trim()) {
      error('Error', 'Campaign name is required');
      return;
    }
    
    setLoading(true);
    try {
      const campaignData = {
        ...newCampaign,
        status: 'active',
        spent: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        ctr: 0,
        roas: 0,
        created_at: new Date().toISOString()
      };
      
      const { error: insertError } = await supabase
        .from('advertising_campaigns')
        .insert([campaignData]);
      
      if (insertError) throw insertError;
      
      success('Campaign Created', 'New advertising campaign has been created successfully');
      setShowNewCampaignModal(false);
      resetNewCampaignForm();
      fetchCampaigns();
    } catch (err) {
      error('Error', 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle quick ad selection
  const handleQuickAdSelect = (option: QuickAdOption) => {
    setSelectedQuickAd(option);
    setNewCampaign(prev => ({
      ...prev,
      name: option.name,
      budget: option.budget,
      duration: option.duration,
      platform: option.platforms[0],
      type: option.platforms.includes('platform') ? 'platform' : 'social_media'
    }));
    setShowQuickAdModal(true);
  };
  
  // Launch quick ad campaign
  const handleLaunchQuickAd = async () => {
    if (!selectedQuickAd) return;
    
    setLoading(true);
    try {
      const campaignData = {
        name: selectedQuickAd.name,
        type: selectedQuickAd.platforms.includes('platform') ? 'platform' : 'social_media',
        platform: selectedQuickAd.platforms.join(','),
        budget: selectedQuickAd.budget,
        duration: selectedQuickAd.duration,
        status: 'active',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + selectedQuickAd.duration * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        target_audience: ['all_users'],
        created_at: new Date().toISOString()
      };
      
      const { error: insertError } = await supabase
        .from('advertising_campaigns')
        .insert([campaignData]);
      
      if (insertError) throw insertError;
      
      success('Quick Ad Launched', `${selectedQuickAd.name} campaign has been launched`);
      setShowQuickAdModal(false);
      setSelectedQuickAd(null);
      fetchCampaigns();
    } catch (err) {
      error('Error', 'Failed to launch quick ad');
    } finally {
      setLoading(false);
    }
  };
  
  // Reset new campaign form
  const resetNewCampaignForm = () => {
    setNewCampaign({
      name: '',
      type: 'social_media',
      platform: 'facebook',
      budget: 1000,
      duration: 7,
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      target_audience: ['all_users'],
      ad_copy: '',
      image_url: '',
      call_to_action: 'shop_now',
      bid_strategy: 'lowest_cost'
    });
  };
  
  // Toggle campaign status
  const toggleCampaignStatus = async (campaignId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      
      const { error } = await supabase
        .from('advertising_campaigns')
        .update({ status: newStatus })
        .eq('id', campaignId);
      
      if (error) throw error;
      
      success('Status Updated', `Campaign ${newStatus === 'active' ? 'activated' : 'paused'}`);
      fetchCampaigns();
    } catch (err) {
      error('Error', 'Failed to update campaign status');
    }
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Format number with commas
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };
  
  // Filtered campaigns
  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         campaign.platform.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  
  // Render overview section
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalSpent)}</p>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 font-medium">+12.5%</span>
            <span className="text-gray-500 ml-2">from last month</span>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeCampaigns}</p>
            </div>
            <div className="p-2 bg-green-50 rounded-lg">
              <Megaphone className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 font-medium">+3</span>
            <span className="text-gray-500 ml-2">running now</span>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-gray-600">Return on Ad Spend</p>
              <p className="text-2xl font-bold text-gray-900">{stats.roas.toFixed(1)}x</p>
            </div>
            <div className="p-2 bg-purple-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 font-medium">+0.4x</span>
            <span className="text-gray-500 ml-2">improvement</span>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Quick Advertising</h3>
            <p className="text-sm text-gray-600">Launch campaigns in minutes</p>
          </div>
          <button
            onClick={() => setShowNewCampaignModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Create Custom Campaign
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickAdOptions.map((option) => (
            <div
              key={option.id}
              className={`border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
                option.recommended 
                  ? 'border-blue-300 bg-blue-50' 
                  : 'border-gray-200 bg-white'
              }`}
              onClick={() => handleQuickAdSelect(option)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${
                  option.recommended ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <option.icon className={`w-5 h-5 ${
                    option.recommended ? 'text-blue-600' : 'text-gray-700'
                  }`} />
                </div>
                {option.recommended && (
                  <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                    Recommended
                  </span>
                )}
              </div>
              
              <h4 className="font-semibold text-gray-900 mb-1">{option.name}</h4>
              <p className="text-sm text-gray-600 mb-3">{option.description}</p>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="text-gray-700 font-medium">{formatCurrency(option.budget)}</span>
                  <span className="text-gray-500">{option.duration} days</span>
                </div>
                <button className="text-blue-600 hover:text-blue-800 font-medium">
                  Launch →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Recent Campaigns */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Recent Campaigns</h3>
            <p className="text-sm text-gray-600">Active and recent advertising campaigns</p>
          </div>
          <button
            onClick={fetchCampaigns}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Campaign</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Platform</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Budget</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Spent</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Performance</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {campaigns.slice(0, 5).map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{campaign.name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(campaign.start_date).toLocaleDateString()} - {new Date(campaign.end_date).toLocaleDateString()}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {platformOptions.find(p => p.id === campaign.platform)?.icon && 
                        React.createElement(platformOptions.find(p => p.id === campaign.platform)!.icon, {
                          className: `w-4 h-4 ${platformOptions.find(p => p.id === campaign.platform)?.color}`
                        })
                      }
                      <span className="text-sm text-gray-700">
                        {platformOptions.find(p => p.id === campaign.platform)?.name || campaign.platform}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {formatCurrency(campaign.budget)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {formatCurrency(campaign.spent)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                      campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                      campaign.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">ROAS:</span>
                        <span className={`font-medium ${campaign.roas >= 2 ? 'text-green-600' : 'text-red-600'}`}>
                          {campaign.roas.toFixed(1)}x
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">CTR:</span>
                        <span className="font-medium text-gray-700">{campaign.ctr.toFixed(1)}%</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleCampaignStatus(campaign.id, campaign.status)}
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          campaign.status === 'active' 
                            ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {campaign.status === 'active' ? 'Pause' : 'Activate'}
                      </button>
                      <button className="p-1 text-gray-500 hover:text-gray-700">
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 text-center">
          <button
            onClick={() => setActiveTab('campaigns')}
            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            View All Campaigns →
          </button>
        </div>
      </div>
    </div>
  );
  
  // Render campaigns section
  const renderCampaigns = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Advertising Campaigns</h2>
          <p className="text-sm text-gray-600">Manage all your advertising campaigns</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowQuickAdModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
          >
            <Zap className="w-4 h-4" />
            Quick Ads
          </button>
          <button
            onClick={() => setShowNewCampaignModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            New Campaign
          </button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="draft">Draft</option>
            </select>
            
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
              <Filter className="w-4 h-4" />
              More Filters
            </button>
          </div>
        </div>
      </div>
      
      {/* Campaigns Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="py-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-gray-600">Loading campaigns...</p>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="py-12 text-center">
            <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No campaigns found</p>
            <p className="text-sm text-gray-500 mt-1">Create your first campaign to get started</p>
            <button
              onClick={() => setShowNewCampaignModal(true)}
              className="mt-4 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 text-sm font-medium"
            >
              Create Campaign
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Campaign</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Platforms</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Budget</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Performance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Audience</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCampaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{campaign.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">{campaign.type.replace('_', ' ')}</span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">
                            {new Date(campaign.start_date).toLocaleDateString()} - {new Date(campaign.end_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {campaign.platform.split(',').map((platform, idx) => {
                          const platformInfo = platformOptions.find(p => p.id === platform);
                          return platformInfo ? (
                            <div
                              key={idx}
                              className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs"
                            >
                              {React.createElement(platformInfo.icon, { className: `w-3 h-3 ${platformInfo.color}` })}
                              <span>{platformInfo.name}</span>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{formatCurrency(campaign.budget)}</p>
                        <p className="text-xs text-gray-500">
                          Spent: {formatCurrency(campaign.spent)} ({((campaign.spent / campaign.budget) * 100).toFixed(0)}%)
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Impressions:</span>
                          <span className="font-medium">{formatNumber(campaign.impressions)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Clicks:</span>
                          <span className="font-medium">{formatNumber(campaign.clicks)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">CTR:</span>
                          <span className={`font-medium ${campaign.ctr > 3 ? 'text-green-600' : 'text-red-600'}`}>
                            {campaign.ctr.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {campaign.target_audience.slice(0, 2).map((audience, idx) => (
                          <span
                            key={idx}
                            className="inline-block px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                          >
                            {audienceOptions.find(a => a.id === audience)?.name || audience}
                          </span>
                        ))}
                        {campaign.target_audience.length > 2 && (
                          <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            +{campaign.target_audience.length - 2} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                          campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                          campaign.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          {Math.ceil((new Date(campaign.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleCampaignStatus(campaign.id, campaign.status)}
                          className={`p-2 rounded-lg ${
                            campaign.status === 'active'
                              ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                              : 'bg-green-100 text-green-600 hover:bg-green-200'
                          }`}
                          title={campaign.status === 'active' ? 'Pause Campaign' : 'Activate Campaign'}
                        >
                          {campaign.status === 'active' ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </button>
                        <button className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-500 hover:text-red-600 rounded-lg hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
  
  // Render quick ads section
  const renderQuickAds = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Quick Advertising</h2>
          <p className="text-sm text-gray-600">Launch pre-configured campaigns in minutes</p>
        </div>
        <div className="text-sm text-gray-500">
          <span className="text-green-600 font-medium">✓</span> Best performing templates
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quickAdOptions.map((option) => (
          <div
            key={option.id}
            className={`border rounded-lg p-5 hover:shadow-lg transition-all duration-200 cursor-pointer ${
              option.recommended 
                ? 'border-blue-300 bg-gradient-to-br from-blue-50 to-white' 
                : 'border-gray-200 bg-white'
            }`}
            onClick={() => handleQuickAdSelect(option)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${
                option.recommended ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                <option.icon className={`w-6 h-6 ${
                  option.recommended ? 'text-blue-600' : 'text-gray-700'
                }`} />
              </div>
              
              <div className="text-right">
                {option.recommended && (
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium mb-2">
                    Recommended
                  </span>
                )}
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(option.budget)}</div>
              </div>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{option.name}</h3>
            <p className="text-gray-600 mb-4">{option.description}</p>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Duration</span>
                <span className="font-medium text-gray-700">{option.duration} days</span>
              </div>
              
              <div>
                <span className="text-sm text-gray-500 mb-2 block">Platforms</span>
                <div className="flex flex-wrap gap-2">
                  {option.platforms.map((platform, idx) => {
                    const platformInfo = platformOptions.find(p => p.id === platform);
                    return platformInfo ? (
                      <div
                        key={idx}
                        className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs"
                      >
                        {React.createElement(platformInfo.icon, { className: `w-3 h-3 ${platformInfo.color}` })}
                        <span>{platformInfo.name}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
              
              <button className="w-full mt-4 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-900 font-medium transition-colors">
                Launch Campaign →
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-50 rounded-lg">
            <CheckCircle className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Why Use Quick Ads?</h3>
            <p className="text-sm text-gray-600">Save time with pre-optimized campaigns</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="text-blue-600 font-bold text-lg mb-1">80% Faster</div>
            <p className="text-sm text-gray-600">Launch campaigns in minutes instead of hours</p>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="text-green-600 font-bold text-lg mb-1">+35% ROAS</div>
            <p className="text-sm text-gray-600">Higher return on ad spend with optimized templates</p>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="text-purple-600 font-bold text-lg mb-1">Expert Setup</div>
            <p className="text-sm text-gray-600">Based on best practices and performance data</p>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Render analytics section
  const renderAnalytics = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Advertising Analytics</h2>
          <p className="text-sm text-gray-600">Track performance and optimize campaigns</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last quarter</option>
            <option>Last year</option>
          </select>
          <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900">Performance Overview</h3>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
              <span className="text-sm text-gray-600">Current Period</span>
              <span className="w-3 h-3 bg-gray-300 rounded-full"></span>
              <span className="text-sm text-gray-600">Previous Period</span>
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-700">Click-Through Rate (CTR)</span>
                <span className="text-lg font-bold text-green-600">+1.2%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '68%' }}></div>
              </div>
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>Current: 4.2%</span>
                <span>Previous: 3.0%</span>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-700">Return on Ad Spend (ROAS)</span>
                <span className="text-lg font-bold text-green-600">+0.8x</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: '82%' }}></div>
              </div>
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>Current: 3.4x</span>
                <span>Previous: 2.6x</span>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-700">Cost Per Click (CPC)</span>
                <span className="text-lg font-bold text-red-600">-$0.15</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full" style={{ width: '45%' }}></div>
              </div>
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>Current: $1.25</span>
                <span>Previous: $1.40</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-6">Platform Performance</h3>
          
          <div className="space-y-4">
            {platformOptions.map((platform) => {
              const platformCampaigns = campaigns.filter(c => c.platform.includes(platform.id));
              const totalSpent = platformCampaigns.reduce((sum, c) => sum + c.spent, 0);
              const totalConversions = platformCampaigns.reduce((sum, c) => sum + c.conversions, 0);
              const roas = totalSpent > 0 ? (totalConversions * 100) / totalSpent : 0;
              
              return (
                <div key={platform.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${platform.color.replace('text', 'bg').replace('600', '100')}`}>
                      <platform.icon className={`w-5 h-5 ${platform.color}`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{platform.name}</p>
                      <p className="text-sm text-gray-500">{platformCampaigns.length} campaigns</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatCurrency(totalSpent)}</p>
                    <p className={`text-sm font-medium ${roas > 2 ? 'text-green-600' : 'text-red-600'}`}>
                      ROAS: {roas.toFixed(1)}x
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-6">Top Performing Campaigns</h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Campaign</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Platform</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Spend</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Conversions</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">ROAS</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">CTR</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {campaigns
                .filter(c => c.roas >= 2)
                .sort((a, b) => b.roas - a.roas)
                .slice(0, 5)
                .map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{campaign.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {platformOptions.find(p => p.id === campaign.platform)?.icon && 
                          React.createElement(platformOptions.find(p => p.id === campaign.platform)!.icon, {
                            className: `w-4 h-4 ${platformOptions.find(p => p.id === campaign.platform)?.color}`
                          })
                        }
                        <span className="text-sm text-gray-700">
                          {platformOptions.find(p => p.id === campaign.platform)?.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {formatCurrency(campaign.spent)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatNumber(campaign.conversions)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                        campaign.roas >= 3 ? 'bg-green-100 text-green-800' :
                        campaign.roas >= 2 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {campaign.roas.toFixed(1)}x
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {campaign.ctr.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
  
  // Main render
  return (
    <div className="min-h-screen bg-whitesmoke p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Megaphone className="w-6 h-6 text-blue-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Advertising Management</h1>
              </div>
              <p className="text-gray-600">Manage social media ads, platform promotions, and track performance</p>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-sm text-gray-600">Advertising Budget</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(15000)}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === 'overview'
                  ? 'bg-white border border-b-0 border-gray-200 text-gray-900'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Overview
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('campaigns')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === 'campaigns'
                  ? 'bg-white border border-b-0 border-gray-200 text-gray-900'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4" />
                Campaigns ({campaigns.length})
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('quick_ads')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === 'quick_ads'
                  ? 'bg-white border border-b-0 border-gray-200 text-gray-900'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Quick Ads
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === 'analytics'
                  ? 'bg-white border border-b-0 border-gray-200 text-gray-900'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart className="w-4 h-4" />
                Analytics
              </div>
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 md:p-6">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'campaigns' && renderCampaigns()}
          {activeTab === 'quick_ads' && renderQuickAds()}
          {activeTab === 'analytics' && renderAnalytics()}
        </div>
      </div>
      
      {/* New Campaign Modal */}
      {showNewCampaignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg border border-gray-200 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Create New Campaign</h3>
                <button
                  onClick={() => setShowNewCampaignModal(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Campaign Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campaign Name *
                  </label>
                  <input
                    type="text"
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Summer Sale 2024"
                  />
                </div>
                
                {/* Type and Platform */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Campaign Type *
                    </label>
                    <select
                      value={newCampaign.type}
                      onChange={(e) => setNewCampaign(prev => ({ ...prev, type: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="social_media">Social Media</option>
                      <option value="platform">Our Platform</option>
                      <option value="email">Email Marketing</option>
                      <option value="search">Search Ads</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Platform *
                    </label>
                    <select
                      value={newCampaign.platform}
                      onChange={(e) => setNewCampaign(prev => ({ ...prev, platform: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {platformOptions.map((platform) => (
                        <option key={platform.id} value={platform.id}>
                          {platform.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Budget and Duration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Budget *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        value={newCampaign.budget}
                        onChange={(e) => setNewCampaign(prev => ({ ...prev, budget: parseInt(e.target.value) || 0 }))}
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="100"
                        step="100"
                      />
                    </div>
                    <div className="mt-2 flex gap-2">
                      {[500, 1000, 2000, 5000].map((amount) => (
                        <button
                          key={amount}
                          type="button"
                          onClick={() => setNewCampaign(prev => ({ ...prev, budget: amount }))}
                          className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                        >
                          ${amount}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration (days) *
                    </label>
                    <input
                      type="number"
                      value={newCampaign.duration}
                      onChange={(e) => setNewCampaign(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="1"
                      max="365"
                    />
                    <div className="mt-2 flex gap-2">
                      {[3, 7, 14, 30].map((days) => (
                        <button
                          key={days}
                          type="button"
                          onClick={() => setNewCampaign(prev => ({ ...prev, duration: days }))}
                          className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                        >
                          {days} days
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Target Audience */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Audience *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {audienceOptions.map((audience) => (
                      <label
                        key={audience.id}
                        className={`flex items-center p-3 border rounded-lg cursor-pointer ${
                          newCampaign.target_audience.includes(audience.id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={newCampaign.target_audience.includes(audience.id)}
                          onChange={(e) => {
                            const newAudience = e.target.checked
                              ? [...newCampaign.target_audience, audience.id]
                              : newCampaign.target_audience.filter(id => id !== audience.id);
                            setNewCampaign(prev => ({ ...prev, target_audience: newAudience }));
                          }}
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{audience.name}</p>
                          <p className="text-xs text-gray-500">{audience.count} users</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Call to Action */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Call to Action
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ctaOptions.map((cta) => (
                      <button
                        key={cta.id}
                        type="button"
                        onClick={() => setNewCampaign(prev => ({ ...prev, call_to_action: cta.id }))}
                        className={`px-3 py-2 rounded-lg font-medium ${
                          newCampaign.call_to_action === cta.id
                            ? cta.color
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {cta.name}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Submit Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowNewCampaignModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateCampaign}
                    disabled={loading || !newCampaign.name.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Creating...' : 'Create Campaign'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Quick Ad Modal */}
      {showQuickAdModal && selectedQuickAd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg border border-gray-200 shadow-xl max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Launch Quick Ad</h3>
                  <p className="text-sm text-gray-600">Review and customize your campaign</p>
                </div>
                <button
                  onClick={() => {
                    setShowQuickAdModal(false);
                    setSelectedQuickAd(null);
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-white rounded-lg">
                      <selectedQuickAd.icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{selectedQuickAd.name}</h4>
                      <p className="text-sm text-gray-600">{selectedQuickAd.description}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded">
                      <p className="text-xs text-gray-500">Budget</p>
                      <p className="font-bold text-gray-900">{formatCurrency(selectedQuickAd.budget)}</p>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <p className="text-xs text-gray-500">Duration</p>
                      <p className="font-bold text-gray-900">{selectedQuickAd.duration} days</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campaign Name
                  </label>
                  <input
                    type="text"
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customize Budget
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={newCampaign.budget}
                      onChange={(e) => setNewCampaign(prev => ({ ...prev, budget: parseInt(e.target.value) || 0 }))}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg"
                      min="100"
                    />
                  </div>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Bell className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Campaign will start immediately</p>
                      <p className="text-xs text-yellow-700 mt-1">
                        Your campaign will be active as soon as you launch it and run for {selectedQuickAd.duration} days.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowQuickAdModal(false);
                      setSelectedQuickAd(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLaunchQuickAd}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    {loading ? 'Launching...' : 'Launch Campaign'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Advertising;