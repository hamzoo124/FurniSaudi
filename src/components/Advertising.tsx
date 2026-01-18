import React, { useState, useEffect } from 'react';
import {
  AiOutlineArrowLeft,
  AiOutlineDollar,
  AiOutlineCalendar,
  AiOutlinePicture,
  AiOutlineShopping,
  AiOutlineRocket,
  AiOutlineFacebook,
  AiOutlineInstagram,
  AiOutlineTwitter,
  AiOutlineGoogle,
  AiOutlineCheckCircle,
  AiOutlineUpload,
  AiOutlineEye,
  AiOutlinePlus,
  AiOutlineDelete,
  AiOutlineBarChart,
  AiOutlineSetting,
  AiOutlineEnvironment,
  AiOutlineFilter,
  AiOutlineSearch,
  AiOutlineDownload,
  AiOutlineCloudUpload,
  AiOutlineFund,
  AiOutlineRise,
  AiOutlineAppstore,
  AiOutlineTeam,
  AiOutlineUser,
  AiOutlineClock,
  AiOutlineProduct,
  AiOutlineThunderbolt,
  AiOutlineCreditCard,
  AiOutlineLock,
  AiOutlineCheck
} from 'react-icons/ai';

interface AdvertisingPageProps {
  onNavigate?: (page: string) => void;
  onBack?: () => void;
}

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  type: string;
  category: string;
  seller_id?: string;
  is_advertised?: boolean;
}

interface AdCampaign {
  id: string;
  name: string;
  platform: 'own-platform' | 'facebook' | 'instagram' | 'google' | 'twitter';
  placement_type: 'slider' | 'sidebar' | 'top_brand' | 'premium_partner';
  budget: number;
  duration: number;
  dailyBudget: number;
  totalSpent: number;
  startDate: string;
  endDate: string;
  targetAudience: string[];
  furnitureType: 'customized' | 'ready-made' | 'both';
  adSource: 'existing-listing' | 'new-listing';
  images: string[];
  status: 'draft' | 'active' | 'paused' | 'completed';
  demographics: {
    ageRange: [number, number];
    gender: string[];
    interests: string[];
    locations: string[];
  };
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  conversionRate: number;
  dailyStats: Array<{
    date: string;
    impressions: number;
    clicks: number;
    spent: number;
    conversions: number;
  }>;
  createdAt: string;
  updatedAt: string;
  product_id?: string;
  product_name?: string;
  product_image?: string;
  product_price?: number;
}

const AdvertisingPage: React.FC<AdvertisingPageProps> = ({ onNavigate, onBack }) => {
  const updateCampaignStats = (campaign: AdCampaign): AdCampaign => {
    if (campaign.status !== 'active') return campaign;

    const now = new Date();
    const start = new Date(campaign.startDate);
    const end = new Date(campaign.endDate);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const daysPassed = Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    const progress = Math.min((daysPassed / totalDays) * 100, 100);
    const totalSpent = Math.min(campaign.dailyBudget * daysPassed, campaign.budget);
    
    const baseImpressions = campaign.budget * 20;
    const platformMultiplier = {
      'own-platform': 1.2,
      'facebook': 3.5,
      'instagram': 2.8,
      'google': 2.2,
      'twitter': 1.8
    };
    
    const impressions = Math.floor(baseImpressions * platformMultiplier[campaign.platform] * (progress / 100));
    const clicks = Math.floor(impressions * 0.05);
    const conversions = Math.floor(clicks * 0.08);
    
    const dailyStats = [];
    for (let i = 0; i <= daysPassed; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      
      dailyStats.push({
        date: date.toISOString().split('T')[0],
        impressions: Math.floor((impressions / (daysPassed + 1)) * (0.8 + Math.random() * 0.4)),
        clicks: Math.floor((clicks / (daysPassed + 1)) * (0.8 + Math.random() * 0.4)),
        spent: campaign.dailyBudget,
        conversions: Math.floor((conversions / (daysPassed + 1)) * (0.8 + Math.random() * 0.4))
      });
    }

    return {
      ...campaign,
      totalSpent,
      impressions,
      clicks,
      conversions,
      ctr: clicks / impressions,
      conversionRate: conversions / clicks,
      dailyStats
    };
  };

  const [activeTab, setActiveTab] = useState<'quick' | 'create' | 'active' | 'history' | 'analytics'>('create');
  const [selectedPlatform, setSelectedPlatform] = useState<'own-platform' | 'facebook' | 'instagram' | 'google' | 'twitter'>('own-platform');
  const [selectedPlacement, setSelectedPlacement] = useState<'slider' | 'sidebar' | 'top_brand' | 'premium_partner'>('sidebar');
  const [budget, setBudget] = useState<number>(500);
  const [duration, setDuration] = useState<number>(14);
  const [furnitureType, setFurnitureType] = useState<'customized' | 'ready-made' | 'both'>('both');
  const [adSource, setAdSource] = useState<'existing-listing' | 'new-listing'>('existing-listing');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [campaignName, setCampaignName] = useState<string>('');
  const [targetAudience, setTargetAudience] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductSelector, setShowProductSelector] = useState<boolean>(false);
  
  // Quick Ad States
  const [quickAdProduct, setQuickAdProduct] = useState<Product | null>(null);
  const [quickDuration, setQuickDuration] = useState<number>(7);
  const [quickBudget, setQuickBudget] = useState<number>(100);
  const [quickPaymentMethod, setQuickPaymentMethod] = useState<string>('credit_card');
  const [isQuickProcessing, setIsQuickProcessing] = useState<boolean>(false);
  const [quickAdStep, setQuickAdStep] = useState<'product' | 'settings' | 'payment'>('product');
  
  const [demographics, setDemographics] = useState({
    ageRange: [25, 55] as [number, number],
    gender: ['male', 'female'],
    interests: [] as string[],
    locations: ['Riyadh', 'Jeddah']
  });

  const [activeCampaigns, setActiveCampaigns] = useState<AdCampaign[]>(() => {
    const saved = localStorage.getItem('adCampaigns');
    if (saved) {
      const campaigns = JSON.parse(saved);
      return campaigns.map((campaign: AdCampaign) => updateCampaignStats(campaign));
    }
    return [];
  });

  const [sellerProducts, setSellerProducts] = useState<Product[]>(() => {
    const savedProducts = localStorage.getItem('sellerProducts');
    if (savedProducts) {
      return JSON.parse(savedProducts);
    }
    return [
      { 
        id: '1', 
        name: 'Modern Leather Sofa', 
        price: 1200, 
        image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=200&fit=crop',
        type: 'ready-made',
        category: 'Living Room'
      },
      { 
        id: '2', 
        name: 'Wooden Dining Table', 
        price: 800, 
        image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&h=200&fit=crop',
        type: 'ready-made',
        category: 'Dining Room'
      },
      { 
        id: '3', 
        name: 'Office Ergonomic Chair', 
        price: 450, 
        image: 'https://images.unsplash.com/photo-1503602642458-232111445657?w=300&h=200&fit=crop',
        type: 'customized',
        category: 'Office'
      },
    ];
  });

  useEffect(() => {
    const selectedProductData = localStorage.getItem('selectedProductForAd');
    if (selectedProductData) {
      const product = JSON.parse(selectedProductData);
      setSelectedProduct(product);
      setAdSource('existing-listing');
      setSelectedImages([product.image]);
      setCampaignName(`Promote: ${product.name}`);
      localStorage.removeItem('selectedProductForAd');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('adCampaigns', JSON.stringify(activeCampaigns));
    const activeAds = activeCampaigns.filter(camp => camp.status === 'active');
    localStorage.setItem('activeAdCampaigns', JSON.stringify(activeAds));
    window.dispatchEvent(new Event('storage'));
  }, [activeCampaigns]);

  const platforms = [
    {
      id: 'own-platform',
      name: 'Our Platform',
      description: 'Advertise directly on our marketplace',
      icon: <AiOutlineShopping className="text-xs" />,
      color: 'border-gray-300'
    },
    {
      id: 'facebook',
      name: 'Facebook',
      description: 'Target based on user interests',
      icon: <AiOutlineFacebook className="text-xs" />,
      color: 'border-gray-300'
    },
    {
      id: 'instagram',
      name: 'Instagram',
      description: 'Visual advertising platform',
      icon: <AiOutlineInstagram className="text-xs" />,
      color: 'border-gray-300'
    },
    {
      id: 'google',
      name: 'Google Ads',
      description: 'Search and display network',
      icon: <AiOutlineGoogle className="text-xs" />,
      color: 'border-gray-300'
    },
    {
      id: 'twitter',
      name: 'Twitter',
      description: 'Real-time engagement',
      icon: <AiOutlineTwitter className="text-xs" />,
      color: 'border-gray-300'
    }
  ];

  const placementTypes = [
    {
      id: 'slider',
      name: 'Homepage Slider',
      description: 'Main slider on homepage (high visibility)',
      icon: '🖼️',
      minBudget: 500,
      color: 'border-blue-300'
    },
    {
      id: 'top_brand',
      name: 'Top Brands Section',
      description: 'Featured in Top Brands section',
      icon: '🏆',
      minBudget: 300,
      color: 'border-yellow-300'
    },
    {
      id: 'premium_partner',
      name: 'Premium Partners',
      description: 'Featured in Premium Partners section',
      icon: '💎',
      minBudget: 400,
      color: 'border-purple-300'
    },
    {
      id: 'sidebar',
      name: 'Sidebar Ads',
      description: 'Right sidebar advertisements',
      icon: '📌',
      minBudget: 100,
      color: 'border-green-300'
    }
  ];

  const filteredCampaigns = activeCampaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || campaign.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Calculate price based on duration and budget
  const calculateQuickPrice = () => {
    return quickBudget;
  };

  // Quick Ad Handler
  const handleQuickAdvertise = async () => {
    if (!quickAdProduct) return;
    
    setIsQuickProcessing(true);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + quickDuration);
    
    const dailyBudget = quickBudget / quickDuration;

    const campaignData: any = {
      id: `quick_ad_${Date.now()}`,
      name: `Quick Ad: ${quickAdProduct.name}`,
      platform: 'own-platform',
      placement_type: 'premium_partner',
      budget: quickBudget,
      duration: quickDuration,
      dailyBudget,
      totalSpent: 0,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      targetAudience: ['home-owners', 'furniture-enthusiasts'],
      furnitureType: 'both',
      adSource: 'existing-listing',
      images: [quickAdProduct.image],
      status: 'active',
      demographics: {
        ageRange: [25, 55],
        gender: ['male', 'female'],
        interests: [],
        locations: ['Riyadh', 'Jeddah']
      },
      impressions: 0,
      clicks: 0,
      conversions: 0,
      ctr: 0,
      conversionRate: 0,
      dailyStats: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      product_id: quickAdProduct.id,
      product_name: quickAdProduct.name,
      product_image: quickAdProduct.image,
      product_price: quickAdProduct.price
    };

    const campaignWithStats = updateCampaignStats(campaignData);
    
    setActiveCampaigns(prev => [...prev, campaignWithStats]);
    
    // Update product status
    const updatedProducts = sellerProducts.map(product => 
      product.id === quickAdProduct.id 
        ? { ...product, is_advertised: true }
        : product
    );
    setSellerProducts(updatedProducts);
    localStorage.setItem('sellerProducts', JSON.stringify(updatedProducts));
    
    setIsQuickProcessing(false);
    setQuickAdProduct(null);
    setQuickDuration(7);
    setQuickBudget(100);
    setQuickAdStep('product');
    setActiveTab('active');
  };

  const handleCreateCampaign = async () => {
    setIsCreating(true);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + duration);
    
    const dailyBudget = budget / duration;

    const campaignData: any = {
      id: `ad_${Date.now()}`,
      name: campaignName || `${furnitureType} Furniture Campaign - ${new Date().toLocaleDateString()}`,
      platform: selectedPlatform,
      placement_type: selectedPlacement,
      budget,
      duration,
      dailyBudget,
      totalSpent: 0,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      targetAudience,
      furnitureType,
      adSource,
      images: selectedImages.length > 0 ? selectedImages : [selectedProduct?.image || sellerProducts[0].image],
      status: 'active',
      demographics,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      ctr: 0,
      conversionRate: 0,
      dailyStats: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (selectedProduct) {
      campaignData.product_id = selectedProduct.id;
      campaignData.product_name = selectedProduct.name;
      campaignData.product_image = selectedProduct.image;
      campaignData.product_price = selectedProduct.price;
      
      const updatedProducts = sellerProducts.map(product => 
        product.id === selectedProduct.id 
          ? { ...product, is_advertised: true, ad_budget: budget, ad_duration: duration }
          : product
      );
      setSellerProducts(updatedProducts);
      localStorage.setItem('sellerProducts', JSON.stringify(updatedProducts));
    }

    const campaignWithStats = updateCampaignStats(campaignData);
    
    setActiveCampaigns(prev => [...prev, campaignWithStats]);
    setActiveTab('active');
    
    setSelectedPlatform('own-platform');
    setSelectedPlacement('sidebar');
    setBudget(500);
    setDuration(14);
    setFurnitureType('both');
    setAdSource('existing-listing');
    setSelectedImages([]);
    setCampaignName('');
    setTargetAudience([]);
    setSelectedProduct(null);
    setDemographics({
      ageRange: [25, 55],
      gender: ['male', 'female'],
      interests: [],
      locations: ['Riyadh', 'Jeddah']
    });
    setIsCreating(false);
  };

  const calculateEstimatedReach = () => {
    const baseReach = budget * 20;
    const platformMultiplier = {
      'own-platform': 1.2,
      'facebook': 3.5,
      'instagram': 2.8,
      'google': 2.2,
      'twitter': 1.8
    };
    
    return Math.floor(baseReach * platformMultiplier[selectedPlatform]);
  };

  const toggleCampaignStatus = (campaignId: string) => {
    setActiveCampaigns(prev => prev.map(campaign => 
      campaign.id === campaignId 
        ? { 
            ...campaign, 
            status: campaign.status === 'active' ? 'paused' : 'active',
            updatedAt: new Date().toISOString()
          }
        : campaign
    ));
  };

  const deleteCampaign = (campaignId: string) => {
    setActiveCampaigns(prev => prev.filter(campaign => campaign.id !== campaignId));
  };

  const getCampaignStats = (campaign: AdCampaign) => {
    const now = new Date();
    const start = new Date(campaign.startDate);
    const end = new Date(campaign.endDate);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const daysPassed = Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    const progress = Math.min((daysPassed / totalDays) * 100, 100);
    const budgetSpent = Math.min(campaign.dailyBudget * daysPassed, campaign.budget);
    const remainingBudget = campaign.budget - budgetSpent;
    const daysRemaining = Math.max(0, totalDays - daysPassed);

    return {
      daysRunning: daysPassed,
      daysRemaining,
      budgetSpent: Math.min(budgetSpent, campaign.budget),
      remainingBudget,
      progress,
      totalDays
    };
  };

  // SIMPLE QUICK ADVERTISE FORM
  const renderQuickAdvertise = () => (
    <div className="max-w-2xl mx-auto">
      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-4">
          {[
            { step: 'product', label: 'Product' },
            { step: 'settings', label: 'Duration & Price' },
            { step: 'payment', label: 'Payment' }
          ].map((step, index) => (
            <React.Fragment key={step.step}>
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold mb-1 ${
                  quickAdStep === step.step
                    ? 'bg-blue-600 text-white'
                    : quickAdStepIndex(quickAdStep) > index
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {quickAdStepIndex(quickAdStep) > index ? (
                    <AiOutlineCheck className="text-xs" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className={`text-xs font-medium ${
                  quickAdStep === step.step ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {step.label}
                </span>
              </div>
              {index < 2 && (
                <div className={`w-16 h-0.5 ${
                  quickAdStepIndex(quickAdStep) > index ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        {quickAdStep === 'product' && (
          <div>
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
                <AiOutlineProduct className="text-blue-600 text-lg" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Select Product</h2>
              <p className="text-xs text-gray-500">Choose a product to advertise</p>
            </div>

            <div className="space-y-3">
              {sellerProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => {
                    setQuickAdProduct(product);
                    setQuickAdStep('settings');
                  }}
                  className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-sm ${
                    quickAdProduct?.id === product.id
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-gray-900 mb-1">{product.name}</h4>
                      <p className="text-xs text-gray-600 mb-1">{product.category}</p>
                      <p className="text-xs font-semibold text-gray-900">SAR {product.price.toLocaleString()}</p>
                    </div>
                    {quickAdProduct?.id === product.id && (
                      <AiOutlineCheckCircle className="text-blue-600 text-lg" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => setActiveTab('create')}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Want more options? Use Advanced Campaign
              </button>
            </div>
          </div>
        )}

        {quickAdStep === 'settings' && quickAdProduct && (
          <div>
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
                <AiOutlineCalendar className="text-blue-600 text-lg" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Duration & Price</h2>
              <p className="text-xs text-gray-500">Set how long to advertise and budget</p>
            </div>

            {/* Selected Product Preview */}
            <div className="border border-blue-200 rounded-lg p-4 bg-blue-50 mb-6">
              <div className="flex items-center space-x-4">
                <img
                  src={quickAdProduct.image}
                  alt={quickAdProduct.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div>
                  <h4 className="font-medium text-sm text-gray-900">{quickAdProduct.name}</h4>
                  <p className="text-xs text-gray-600">{quickAdProduct.category}</p>
                </div>
                <button
                  onClick={() => setQuickAdStep('product')}
                  className="ml-auto text-xs text-blue-600 hover:text-blue-700"
                >
                  Change
                </button>
              </div>
            </div>

            {/* Duration Slider */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Duration: <span className="text-blue-600 font-semibold">{quickDuration} days</span>
              </label>
              
              <div className="space-y-2">
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={quickDuration}
                  onChange={(e) => {
                    const days = Number(e.target.value);
                    setQuickDuration(days);
                    setQuickBudget(days * 15); // 15 SAR per day
                  }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-slider"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>1 day</span>
                  <span>15 days</span>
                  <span>30 days</span>
                </div>
              </div>
            </div>

            {/* Budget Slider */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Budget: <span className="text-blue-600 font-semibold">SAR {quickBudget}</span>
              </label>
              
              <div className="space-y-2">
                <input
                  type="range"
                  min="15"
                  max="1500"
                  step="15"
                  value={quickBudget}
                  onChange={(e) => setQuickBudget(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-slider"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>SAR 15</span>
                  <span>SAR 750</span>
                  <span>SAR 1500</span>
                </div>
              </div>
            </div>

            {/* Price Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">Total Price</div>
                <div className="text-2xl font-bold text-blue-600 mb-1">SAR {calculateQuickPrice()}</div>
                <div className="text-xs text-gray-500">
                  {quickDuration} days × SAR {quickBudget / quickDuration} per day
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => setQuickAdStep('product')}
                className="flex-1 px-4 py-2 bg-white text-gray-700 font-medium rounded-lg hover:bg-gray-50 border border-gray-300 shadow-sm transition-all duration-200"
              >
                Back
              </button>
              <button
                onClick={() => setQuickAdStep('payment')}
                className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all duration-200"
              >
                Continue to Payment
              </button>
            </div>
          </div>
        )}

        {quickAdStep === 'payment' && quickAdProduct && (
          <div>
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
                <AiOutlineCreditCard className="text-blue-600 text-lg" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Payment</h2>
              <p className="text-xs text-gray-500">Complete your payment to start advertising</p>
            </div>

            {/* Order Summary */}
            <div className="border border-gray-200 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-sm text-gray-900 mb-3">Order Summary</h4>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Product:</span>
                  <span className="font-medium text-gray-900">{quickAdProduct.name}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium text-gray-900">{quickDuration} days</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Daily Budget:</span>
                  <span className="font-medium text-gray-900">SAR {quickBudget / quickDuration}</span>
                </div>
                <div className="flex items-center justify-between text-sm font-semibold pt-2 border-t border-gray-200">
                  <span className="text-gray-900">Total Amount:</span>
                  <span className="text-blue-600">SAR {calculateQuickPrice()}</span>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="mb-6">
              <h4 className="font-medium text-sm text-gray-900 mb-3">Payment Method</h4>
              
              <div className="space-y-2">
                {[
                  { id: 'credit_card', name: 'Credit/Debit Card', icon: '💳', description: 'Pay with Visa, Mastercard, etc.' },
                  { id: 'mada', name: 'Mada', icon: '🇸🇦', description: 'Saudi Arabia payment network' },
                  { id: 'apple_pay', name: 'Apple Pay', icon: '🍎', description: 'Pay with Apple Pay' },
                  { id: 'stc_pay', name: 'STC Pay', icon: '📱', description: 'Pay with STC Pay wallet' }
                ].map((method) => (
                  <label
                    key={method.id}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                      quickPaymentMethod === method.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.id}
                      checked={quickPaymentMethod === method.id}
                      onChange={(e) => setQuickPaymentMethod(e.target.value)}
                      className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <div className="flex items-center flex-1">
                      <span className="text-xl mr-3">{method.icon}</span>
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900">{method.name}</div>
                        <div className="text-xs text-gray-500">{method.description}</div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Security Note */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
              <div className="flex items-start">
                <AiOutlineLock className="text-yellow-500 mr-2 mt-0.5" />
                <p className="text-xs text-yellow-800">
                  Your payment is secure and encrypted. Your ad will start immediately after successful payment.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => setQuickAdStep('settings')}
                className="flex-1 px-4 py-2 bg-white text-gray-700 font-medium rounded-lg hover:bg-gray-50 border border-gray-300 shadow-sm transition-all duration-200"
              >
                Back
              </button>
              <button
                onClick={handleQuickAdvertise}
                disabled={isQuickProcessing}
                className="flex-1 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isQuickProcessing ? (
                  <>
                    <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <AiOutlineLock className="mr-2" />
                    Pay SAR {calculateQuickPrice()}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Helper function to get step index
  const quickAdStepIndex = (step: string) => {
    const steps = ['product', 'settings', 'payment'];
    return steps.indexOf(step);
  };

  const renderActiveCampaigns = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Active Campaigns</h3>
          <p className="text-xs text-gray-500 mt-1">Manage and monitor your advertising campaigns</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('quick')}
            className="flex items-center px-3 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 text-xs"
          >
            <AiOutlineThunderbolt className="mr-1.5 text-xs" />
            Quick Advertise
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className="flex items-center px-3 py-2 bg-white text-gray-700 font-medium rounded-lg hover:bg-gray-50 border border-gray-300 shadow-sm transition-all duration-200 text-xs"
          >
            <AiOutlinePlus className="mr-1.5 text-xs" />
            Create Campaign
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <AiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search campaigns by name or product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm text-gray-900 placeholder-gray-400"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm">
            <AiOutlineFilter className="text-gray-400 mr-2 text-xs" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent focus:outline-none text-gray-900 font-medium text-xs"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          <button className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors text-xs">
            <AiOutlineDownload className="mr-1.5 text-xs" />
            Export
          </button>
        </div>
      </div>

      {filteredCampaigns.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg bg-white">
          <div className="w-12 h-12 bg-whitesmoke rounded-full flex items-center justify-center mx-auto mb-4">
            <AiOutlineRocket className="text-gray-600 text-lg" />
          </div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">No Campaigns Found</h4>
          <p className="text-xs text-gray-500 mb-6 max-w-md mx-auto">Create your first advertising campaign to reach more customers</p>
          <button
            onClick={() => setActiveTab('create')}
            className="px-4 py-2 bg-white text-gray-700 font-medium rounded-lg hover:bg-gray-50 border border-gray-300 shadow-sm transition-all duration-200 text-xs"
          >
            Create Your First Campaign
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCampaigns.map((campaign) => {
            const stats = getCampaignStats(campaign);
            const platform = platforms.find(p => p.id === campaign.platform);
            const placement = placementTypes.find(p => p.id === campaign.placement_type);
            
            return (
              <div key={campaign.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
                <div className="p-4">
                  {/* Campaign Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <div className={`text-gray-700 p-1.5 rounded-lg border ${platform?.color}`}>
                          {platform?.icon}
                        </div>
                        <div>
                          <h4 className="font-medium text-sm text-gray-900 line-clamp-1">{campaign.name}</h4>
                          <div className="flex items-center space-x-2 text-xs text-gray-500 mt-0.5">
                            <span className="flex items-center">
                              <AiOutlineCalendar className="mr-0.5 text-xs" />
                              {campaign.duration}d
                            </span>
                            <span>•</span>
                            <span className="flex items-center">
                              <AiOutlineDollar className="mr-0.5 text-xs" />
                              {campaign.budget.toLocaleString()} SAR
                            </span>
                          </div>
                        </div>
                      </div>
                      {campaign.product_name && (
                        <div className="flex items-center space-x-1 mt-1">
                          <AiOutlineProduct className="text-gray-400 text-xs" />
                          <span className="text-xs text-gray-600">Product: {campaign.product_name}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium mb-1 ${
                        campaign.status === 'active' ? 'bg-green-50 text-green-700 border border-green-200' :
                        campaign.status === 'paused' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                        campaign.status === 'completed' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        'bg-gray-50 text-gray-700 border border-gray-200'
                      }`}>
                        {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                      </span>
                      {placement && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${placement.color.replace('border', 'bg').replace('300', '100')} ${placement.color.replace('border', 'text').replace('300', '700')} border ${placement.color}`}>
                          {placement.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Progress</span>
                      <span className="font-medium text-gray-900">{Math.round(stats.progress)}% • {stats.daysRemaining} days left</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          campaign.status === 'active' ? 'bg-gray-700' :
                          campaign.status === 'paused' ? 'bg-yellow-500' :
                          'bg-gray-500'
                        }`}
                        style={{ width: `${stats.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-whitesmoke p-2 rounded border border-gray-200">
                      <div className="text-sm font-semibold text-gray-900">{campaign.impressions?.toLocaleString()}</div>
                      <div className="text-xs text-gray-600">Impressions</div>
                    </div>
                    <div className="bg-whitesmoke p-2 rounded border border-gray-200">
                      <div className="text-sm font-semibold text-gray-900">{campaign.clicks?.toLocaleString()}</div>
                      <div className="text-xs text-gray-600">Clicks</div>
                    </div>
                    <div className="bg-whitesmoke p-2 rounded border border-gray-200">
                      <div className="text-sm font-semibold text-gray-900">{campaign.conversions?.toLocaleString()}</div>
                      <div className="text-xs text-gray-600">Sales</div>
                    </div>
                    <div className="bg-whitesmoke p-2 rounded border border-gray-200">
                      <div className="text-sm font-semibold text-gray-900">SAR {Math.floor(stats.budgetSpent)}</div>
                      <div className="text-xs text-gray-600">Spent</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-1.5">
                    <button 
                      onClick={() => toggleCampaignStatus(campaign.id)}
                      className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-all duration-200 ${
                        campaign.status === 'active' 
                          ? 'bg-whitesmoke text-gray-700 hover:bg-gray-100 border border-gray-300' 
                          : 'bg-whitesmoke text-gray-700 hover:bg-gray-100 border border-gray-300'
                      }`}
                    >
                      {campaign.status === 'active' ? 'Pause' : 'Resume'}
                    </button>
                    <button className="flex-1 bg-whitesmoke text-gray-700 px-2 py-1.5 rounded text-xs font-medium hover:bg-gray-100 border border-gray-300 transition-all duration-200">
                      View Details
                    </button>
                    <button 
                      onClick={() => deleteCampaign(campaign.id)}
                      className="px-2 py-1.5 bg-whitesmoke text-gray-700 rounded text-xs font-medium hover:bg-gray-100 border border-gray-300 transition-all duration-200"
                    >
                      <AiOutlineDelete className="text-sm" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Campaign Analytics</h3>
        <p className="text-xs text-gray-500 mt-1">Track performance and optimize your strategy</p>
      </div>

      {activeCampaigns.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg bg-white">
          <div className="w-12 h-12 bg-whitesmoke rounded-full flex items-center justify-center mx-auto mb-4">
            <AiOutlineBarChart className="text-gray-600 text-lg" />
          </div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">No Analytics Data</h4>
          <p className="text-xs text-gray-500 mb-6 max-w-md mx-auto">Create advertising campaigns to see performance metrics</p>
          <button
            onClick={() => setActiveTab('create')}
            className="px-4 py-2 bg-white text-gray-700 font-medium rounded-lg hover:bg-gray-50 border border-gray-300 shadow-sm transition-all duration-200 text-xs"
          >
            Create Campaign
          </button>
        </div>
      ) : (
        <>
          {/* Overall Performance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white text-gray-900 p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <AiOutlineEye className="text-sm text-gray-600" />
                <span className="text-xs font-medium bg-whitesmoke px-2 py-0.5 rounded">Total</span>
              </div>
              <div className="text-base font-semibold mb-1">
                {activeCampaigns.reduce((sum, camp) => sum + (camp.impressions || 0), 0).toLocaleString()}
              </div>
              <div className="text-xs text-gray-600 font-medium">Impressions</div>
            </div>
            
            <div className="bg-white text-gray-900 p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <AiOutlineRise className="text-sm text-gray-600" />
                <span className="text-xs font-medium bg-whitesmoke px-2 py-0.5 rounded">Total</span>
              </div>
              <div className="text-base font-semibold mb-1">
                {activeCampaigns.reduce((sum, camp) => sum + (camp.clicks || 0), 0).toLocaleString()}
              </div>
              <div className="text-xs text-gray-600 font-medium">Clicks</div>
            </div>
            
            <div className="bg-white text-gray-900 p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <AiOutlineFund className="text-sm text-gray-600" />
                <span className="text-xs font-medium bg-whitesmoke px-2 py-0.5 rounded">Total</span>
              </div>
              <div className="text-base font-semibold mb-1">
                {activeCampaigns.reduce((sum, camp) => sum + (camp.conversions || 0), 0).toLocaleString()}
              </div>
              <div className="text-xs text-gray-600 font-medium">Sales</div>
            </div>
            
            <div className="bg-white text-gray-900 p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <AiOutlineDollar className="text-sm text-gray-600" />
                <span className="text-xs font-medium bg-whitesmoke px-2 py-0.5 rounded">Total</span>
              </div>
              <div className="text-base font-semibold mb-1">
                SAR {activeCampaigns.reduce((sum, camp) => sum + getCampaignStats(camp).budgetSpent, 0).toLocaleString()}
              </div>
              <div className="text-xs text-gray-600 font-medium">Total Spent</div>
            </div>
          </div>

          {/* Placement Performance */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <h4 className="font-medium text-sm text-gray-900 mb-4 flex items-center">
              <AiOutlineAppstore className="mr-2 text-gray-600 text-xs" />
              Placement Performance
            </h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {placementTypes.map(placement => {
                const placementCampaigns = activeCampaigns.filter(camp => camp.placement_type === placement.id);
                if (placementCampaigns.length === 0) return null;
                
                const totalImpressions = placementCampaigns.reduce((sum, camp) => sum + (camp.impressions || 0), 0);
                const totalClicks = placementCampaigns.reduce((sum, camp) => sum + (camp.clicks || 0), 0);
                const totalSpent = placementCampaigns.reduce((sum, camp) => sum + getCampaignStats(camp).budgetSpent, 0);
                
                return (
                  <div key={placement.id} className={`border ${placement.color} rounded-lg p-3 hover:shadow-sm transition-shadow duration-200`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className={`text-gray-700 p-1.5 rounded-lg border ${placement.color}`}>
                          <span className="text-sm">{placement.icon}</span>
                        </div>
                        <div>
                          <div className="font-medium text-sm text-gray-900">{placement.name}</div>
                          <div className="text-xs text-gray-500">
                            {placementCampaigns.length} campaign{placementCampaigns.length > 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900">{totalImpressions.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">impressions</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-center p-1.5 bg-whitesmoke rounded border border-gray-200">
                        <div className="font-medium text-sm text-gray-900">{totalClicks.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">clicks</div>
                      </div>
                      <div className="text-center p-1.5 bg-whitesmoke rounded border border-gray-200">
                        <div className="font-medium text-sm text-gray-900">SAR {totalSpent.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">spent</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-whitesmoke">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={onBack}
                className="flex items-center text-gray-600 hover:text-gray-700 font-medium transition-colors duration-200 group text-sm"
              >
                <AiOutlineArrowLeft className="mr-1.5 group-hover:-translate-x-0.5 transition-transform duration-200 text-xs" />
                Back to Home
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Advertising Center</h1>
                <p className="text-xs text-gray-500 mt-1">Promote your furniture and reach more customers</p>
              </div>
            </div>
          </div>

          {/* Tabs - Added Quick Advertise */}
          <div className="mt-6">
            <div className="flex space-x-0.5 bg-gray-100 p-0.5 rounded-lg max-w-2xl">
              {[
                { id: 'quick', name: 'Quick Advertise', icon: <AiOutlineThunderbolt /> },
                { id: 'create', name: 'Create Campaign', icon: <AiOutlineRocket /> },
                { id: 'active', name: 'Campaigns', icon: <AiOutlineEye /> },
                { id: 'analytics', name: 'Analytics', icon: <AiOutlineBarChart /> },
                { id: 'history', name: 'History', icon: <AiOutlineCalendar /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-md text-xs font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 max-w-7xl mx-auto">
        {activeTab === 'quick' && renderQuickAdvertise()}
        
        {activeTab === 'create' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-6">
              {/* All 4 Sections in One Page */}
              <div className="space-y-8">
                
                {/* SECTION 1: Product Selection */}
                <div>
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">1. Select Product to Promote</h3>
                    <p className="text-xs text-gray-500">Choose a product from your inventory to advertise</p>
                  </div>
                  
                  {showProductSelector ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {sellerProducts.map((product) => (
                          <div
                            key={product.id}
                            onClick={() => {
                              setSelectedProduct(product);
                              setSelectedImages([product.image]);
                              setShowProductSelector(false);
                            }}
                            className={`border rounded-lg p-3 cursor-pointer transition-all duration-200 hover:shadow-md ${
                              selectedProduct?.id === product.id
                                ? 'border-blue-400 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-16 h-16 object-cover rounded"
                              />
                              <div className="flex-1">
                                <h4 className="font-medium text-xs text-gray-900 mb-1">{product.name}</h4>
                                <p className="text-xs text-gray-600 mb-1">{product.category}</p>
                                <p className="text-xs font-semibold text-gray-900">SAR {product.price.toLocaleString()}</p>
                                {product.is_advertised && (
                                  <span className="inline-block mt-1 px-1.5 py-0.5 bg-green-100 text-green-800 text-[10px] rounded">
                                    Already Advertised
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => setShowProductSelector(false)}
                        className="px-3 py-1.5 bg-white text-gray-700 font-medium rounded-lg hover:bg-gray-50 border border-gray-300 shadow-sm transition-all duration-200 text-xs"
                      >
                        Cancel Selection
                      </button>
                    </div>
                  ) : selectedProduct ? (
                    <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <img
                            src={selectedProduct.image}
                            alt={selectedProduct.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                          <div>
                            <h4 className="font-medium text-sm text-gray-900">{selectedProduct.name}</h4>
                            <p className="text-xs text-gray-600">{selectedProduct.category} • SAR {selectedProduct.price.toLocaleString()}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowProductSelector(true)}
                          className="px-2 py-1 bg-white text-gray-700 font-medium rounded hover:bg-gray-50 border border-gray-300 text-xs"
                        >
                          Change Product
                        </button>
                      </div>
                      <p className="text-xs text-gray-600">This product will be featured in your advertising campaign.</p>
                    </div>
                  ) : (
                    <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center bg-white hover:border-gray-400 transition-colors duration-200">
                      <AiOutlineProduct className="mx-auto text-gray-400 text-xl mb-2" />
                      <p className="text-xs text-gray-600 mb-2 font-medium">Select a product to promote</p>
                      <button
                        onClick={() => setShowProductSelector(true)}
                        className="inline-flex items-center px-3 py-1.5 bg-white text-gray-700 font-medium rounded-lg hover:bg-gray-50 border border-gray-300 shadow-sm transition-all duration-200 text-xs"
                      >
                        <AiOutlineProduct className="mr-1.5 text-xs" />
                        Browse Products
                      </button>
                    </div>
                  )}
                </div>

                {/* SECTION 2: Platform & Placement Selection */}
                <div>
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">2. Select Platform & Placement</h3>
                    <p className="text-xs text-gray-500">Choose where and how your ad will appear</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">Platform</label>
                      <div className="space-y-2">
                        {platforms.map((platform) => (
                          <div
                            key={platform.id}
                            onClick={() => setSelectedPlatform(platform.id)}
                            className={`relative border rounded-lg p-3 cursor-pointer transition-all duration-200 ${
                              selectedPlatform === platform.id
                                ? `${platform.color} bg-white border-gray-400`
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                          >
                            {selectedPlatform === platform.id && (
                              <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow border border-gray-300">
                                <AiOutlineCheckCircle className="text-gray-700 text-xs" />
                              </div>
                            )}
                            
                            <div className="flex items-start space-x-2">
                              <div className={`text-gray-700 p-1.5 rounded border ${platform.color}`}>
                                {platform.icon}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-0.5">
                                  <h4 className={`font-medium text-xs ${
                                    selectedPlatform === platform.id ? 'text-gray-900' : 'text-gray-900'
                                  }`}>
                                    {platform.name}
                                  </h4>
                                </div>
                                <p className="text-xs text-gray-500 leading-relaxed">{platform.description}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">Ad Placement</label>
                      <div className="space-y-2">
                        {placementTypes.map((placement) => (
                          <div
                            key={placement.id}
                            onClick={() => {
                              if (budget >= placement.minBudget) {
                                setSelectedPlacement(placement.id);
                              }
                            }}
                            className={`relative border rounded-lg p-3 cursor-pointer transition-all duration-200 ${
                              selectedPlacement === placement.id
                                ? `${placement.color} bg-white border-gray-400`
                                : budget < placement.minBudget
                                ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                          >
                            {selectedPlacement === placement.id && (
                              <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow border border-gray-300">
                                <AiOutlineCheckCircle className="text-gray-700 text-xs" />
                              </div>
                            )}
                            
                            <div className="flex items-start space-x-2">
                              <div className={`text-gray-700 p-1.5 rounded border ${placement.color}`}>
                                <span className="text-sm">{placement.icon}</span>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-0.5">
                                  <h4 className={`font-medium text-xs ${
                                    selectedPlacement === placement.id ? 'text-gray-900' : 'text-gray-900'
                                  }`}>
                                    {placement.name}
                                  </h4>
                                  <span className="text-xs font-semibold text-gray-900">Min: ${placement.minBudget}</span>
                                </div>
                                <p className="text-xs text-gray-500 leading-relaxed">{placement.description}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 3: Campaign Details */}
                <div>
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">3. Campaign Details</h3>
                    <p className="text-xs text-gray-500">Configure your campaign settings and budget</p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Campaign Name
                      </label>
                      <input
                        type="text"
                        value={campaignName}
                        onChange={(e) => setCampaignName(e.target.value)}
                        placeholder={selectedProduct ? `Promote: ${selectedProduct.name}` : "e.g., Summer Furniture Sale - Riyadh"}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm text-gray-900 placeholder-gray-400"
                      />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <label className="block text-xs font-medium text-gray-700">
                            Total Budget (SAR)
                          </label>
                          <span className="text-xs font-semibold text-gray-900">{budget.toLocaleString()} SAR</span>
                        </div>
                        <div className="space-y-1">
                          <input
                            type="range"
                            min="100"
                            max="10000"
                            step="100"
                            value={budget}
                            onChange={(e) => {
                              const newBudget = Number(e.target.value);
                              setBudget(newBudget);
                              const placement = placementTypes.find(p => p.id === selectedPlacement);
                              if (placement && newBudget < placement.minBudget) {
                                setSelectedPlacement('sidebar');
                              }
                            }}
                            className="w-full range-slider"
                          />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>100 SAR</span>
                            <span>5,000 SAR</span>
                            <span>10,000 SAR</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <label className="block text-xs font-medium text-gray-700">
                            Duration (Days)
                          </label>
                          <span className="text-xs font-semibold text-gray-900">{duration} days</span>
                        </div>
                        <div className="space-y-1">
                          <input
                            type="range"
                            min="7"
                            max="90"
                            value={duration}
                            onChange={(e) => setDuration(Number(e.target.value))}
                            className="w-full range-slider"
                          />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>7 days</span>
                            <span>30 days</span>
                            <span>90 days</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Furniture Type
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {[
                          { id: 'customized', name: 'Customized', icon: '🎨', description: 'Made-to-order' },
                          { id: 'ready-made', name: 'Ready-Made', icon: '📦', description: 'In-stock items' },
                          { id: 'both', name: 'Both', icon: '🏪', description: 'Mixed inventory' }
                        ].map((type) => (
                          <label
                            key={type.id}
                            className={`flex flex-col items-center p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                              furnitureType === type.id
                                ? 'border-gray-400 bg-white'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                          >
                            <input
                              type="radio"
                              name="furnitureType"
                              value={type.id}
                              checked={furnitureType === type.id}
                              onChange={(e) => setFurnitureType(e.target.value as any)}
                              className="sr-only"
                            />
                            <span className="text-xl mb-1">{type.icon}</span>
                            <span className="font-medium text-xs text-gray-900 mb-0.5">{type.name}</span>
                            <span className="text-xs text-gray-500 text-center">{type.description}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="bg-whitesmoke p-3 rounded-lg border border-gray-200">
                      <h4 className="font-medium text-xs text-gray-900 mb-3 flex items-center">
                        <AiOutlineFund className="mr-2 text-gray-600 text-xs" />
                        Budget Summary
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                        <div className="bg-white p-2 rounded border border-gray-200">
                          <div className="text-xs text-gray-600 mb-0.5">Daily Budget</div>
                          <div className="text-sm font-semibold text-gray-900">{Math.floor(budget / duration).toLocaleString()} SAR</div>
                        </div>
                        <div className="bg-white p-2 rounded border border-gray-200">
                          <div className="text-xs text-gray-600 mb-0.5">Estimated Reach</div>
                          <div className="text-sm font-semibold text-gray-900">{calculateEstimatedReach().toLocaleString()} people</div>
                        </div>
                        <div className="bg-white p-2 rounded border border-gray-200">
                          <div className="text-xs text-gray-600 mb-0.5">Estimated Clicks</div>
                          <div className="text-sm font-semibold text-gray-900">{Math.floor(calculateEstimatedReach() * 0.05).toLocaleString()}</div>
                        </div>
                        <div className="bg-white p-2 rounded border border-gray-200">
                          <div className="text-xs text-gray-600 mb-0.5">Daily Average</div>
                          <div className="text-sm font-semibold text-gray-900">{Math.floor((budget / duration) * 0.05).toLocaleString()} clicks/day</div>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-600">
                        Selected Placement: <span className="font-medium text-gray-900">
                          {placementTypes.find(p => p.id === selectedPlacement)?.name}
                        </span>
                        {selectedPlacement && (
                          <span className="ml-2">(Min: ${placementTypes.find(p => p.id === selectedPlacement)?.minBudget})</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 4: Target Audience */}
                <div>
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">4. Target Audience</h3>
                    <p className="text-xs text-gray-500">Define who should see your ads</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          Age Range: <span className="text-gray-900">{demographics.ageRange[0]} - {demographics.ageRange[1]} years</span>
                        </label>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>Min: {demographics.ageRange[0]} years</span>
                              <span>Max: {demographics.ageRange[1]} years</span>
                            </div>
                            <input
                              type="range"
                              min="18"
                              max="65"
                              value={demographics.ageRange[0]}
                              onChange={(e) => setDemographics(prev => ({
                                ...prev,
                                ageRange: [Number(e.target.value), prev.ageRange[1]]
                              }))}
                              className="w-full range-slider"
                            />
                            <input
                              type="range"
                              min="18"
                              max="65"
                              value={demographics.ageRange[1]}
                              onChange={(e) => setDemographics(prev => ({
                                ...prev,
                                ageRange: [prev.ageRange[0], Number(e.target.value)]
                              }))}
                              className="w-full range-slider mt-1"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          Gender
                        </label>
                        <div className="grid grid-cols-3 gap-1">
                          {['male', 'female', 'all'].map((gender) => (
                            <label
                              key={gender}
                              className={`flex flex-col items-center p-2 border rounded-lg cursor-pointer transition-all ${
                                demographics.gender.includes(gender)
                                  ? 'border-gray-400 bg-white'
                                  : 'border-gray-200 hover:border-gray-300 bg-white'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={demographics.gender.includes(gender)}
                                onChange={(e) => {
                                  if (gender === 'all') {
                                    setDemographics(prev => ({
                                      ...prev,
                                      gender: ['male', 'female', 'all']
                                    }));
                                  } else {
                                    const newGender = e.target.checked
                                      ? [...demographics.gender.filter(g => g !== 'all'), gender]
                                      : demographics.gender.filter(g => g !== gender);
                                    setDemographics(prev => ({
                                      ...prev,
                                      gender: newGender.length === 0 ? ['all'] : newGender
                                    }));
                                  }
                                }}
                                className="sr-only"
                              />
                              <span className={`text-sm mb-0.5 ${
                                demographics.gender.includes(gender) ? 'text-gray-900' : 'text-gray-400'
                              }`}>
                                {gender === 'male' ? '👨' : gender === 'female' ? '👩' : '👥'}
                              </span>
                              <span className="text-xs font-medium capitalize text-gray-900">{gender}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          Locations
                        </label>
                        <div className="grid grid-cols-2 gap-1">
                          {['Riyadh', 'Jeddah', 'Dammam', 'Mecca', 'Medina', 'Khobar', 'Tabuk', 'Abha'].map((location) => (
                            <label
                              key={location}
                              className={`flex items-center p-1.5 border rounded-lg cursor-pointer transition-all ${
                                demographics.locations.includes(location)
                                  ? 'border-gray-400 bg-white'
                                  : 'border-gray-200 hover:border-gray-300 bg-white'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={demographics.locations.includes(location)}
                                onChange={() => {
                                  setDemographics(prev => ({
                                    ...prev,
                                    locations: prev.locations.includes(location)
                                      ? prev.locations.filter(l => l !== location)
                                      : [...prev.locations, location]
                                  }));
                                }}
                                className="mr-1.5 h-3 w-3 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                              />
                              <div className="flex items-center">
                                <AiOutlineEnvironment className="mr-1 text-gray-500 text-xs" />
                                <span className="text-xs font-medium text-gray-900">{location}</span>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          Audience Segments
                        </label>
                        <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                          {[
                            { id: 'home-owners', name: 'Home Owners', icon: '🏠' },
                            { id: 'interior-designers', name: 'Interior Designers', icon: '🎨' },
                            { id: 'luxury-buyers', name: 'Luxury Buyers', icon: '💎' },
                            { id: 'first-time-buyers', name: 'First-time Buyers', icon: '✨' },
                            { id: 'office-managers', name: 'Office Managers', icon: '💼' },
                            { id: 'real-estate-agents', name: 'Real Estate Agents', icon: '🏢' },
                            { id: 'furniture-enthusiasts', name: 'Furniture Enthusiasts', icon: '🪑' },
                            { id: 'renovation-planners', name: 'Renovation Planners', icon: '🔨' }
                          ].map((audience) => (
                            <label
                              key={audience.id}
                              className={`flex items-center p-1.5 border rounded-lg cursor-pointer transition-all ${
                                targetAudience.includes(audience.id)
                                  ? 'border-gray-400 bg-white'
                                  : 'border-gray-200 hover:border-gray-300 bg-white'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={targetAudience.includes(audience.id)}
                                onChange={() => {
                                  setTargetAudience(prev =>
                                    prev.includes(audience.id)
                                      ? prev.filter(a => a !== audience.id)
                                      : [...prev, audience.id]
                                  );
                                }}
                                className="mr-1.5 h-3 w-3 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                              />
                              <div className="flex items-center">
                                <span className="mr-1.5 text-sm">{audience.icon}</span>
                                <span className="text-xs font-medium text-gray-900">{audience.name}</span>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 5: Ad Creative */}
                <div>
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">5. Ad Creative</h3>
                    <p className="text-xs text-gray-500">Upload additional images and review your campaign</p>
                  </div>

                  <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center bg-white hover:border-gray-400 transition-colors duration-200 mb-4">
                    <AiOutlineCloudUpload className="mx-auto text-gray-400 text-xl mb-2" />
                    <p className="text-xs text-gray-600 mb-2 font-medium">Drag and drop images or click to browse</p>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files) {
                          const newImages = Array.from(files).map(file => URL.createObjectURL(file));
                          setSelectedImages(prev => [...prev, ...newImages]);
                        }
                      }}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="inline-flex items-center px-3 py-1.5 bg-white text-gray-700 font-medium rounded-lg hover:bg-gray-50 border border-gray-300 shadow-sm transition-all duration-200 cursor-pointer text-xs"
                    >
                      <AiOutlineUpload className="mr-1.5 text-xs" />
                      Choose Additional Images
                    </label>
                    <p className="text-xs text-gray-500 mt-2">PNG, JPG up to 10MB • Recommended: 1200x630px</p>
                  </div>

                  {selectedImages.length > 0 && (
                    <div className="bg-white p-3 rounded-lg border border-gray-200 mb-4">
                      <h4 className="font-medium text-xs text-gray-900 mb-2 flex items-center">
                        <AiOutlinePicture className="mr-2 text-gray-600 text-xs" />
                        Selected Images ({selectedImages.length})
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {selectedImages.map((image, index) => (
                          <div key={index} className="relative group">
                            <div className="aspect-square rounded-lg overflow-hidden border border-gray-200 group-hover:border-gray-400 transition-colors">
                              <img
                                src={image}
                                alt={`Ad ${index + 1}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                            </div>
                            <button
                              onClick={() => setSelectedImages(prev => prev.filter((_, i) => i !== index))}
                              className="absolute top-1 right-1 bg-white text-gray-700 p-0.5 rounded shadow hover:bg-gray-50 hover:scale-110 transition-all duration-200 border border-gray-300"
                            >
                              <AiOutlineDelete className="text-xs" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-whitesmoke p-3 rounded-lg border border-gray-200">
                    <h4 className="font-medium text-xs text-gray-900 mb-3 flex items-center">
                      <AiOutlineCheckCircle className="mr-2 text-gray-600 text-xs" />
                      Campaign Summary
                    </h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between p-1.5 bg-white rounded border border-gray-200">
                          <span className="text-xs text-gray-700 font-medium">Campaign Name</span>
                          <span className="text-xs font-medium text-gray-900">{campaignName || 'Untitled'}</span>
                        </div>
                        <div className="flex items-center justify-between p-1.5 bg-white rounded border border-gray-200">
                          <span className="text-xs text-gray-700 font-medium">Platform</span>
                          <span className="text-xs font-medium text-gray-900 flex items-center">
                            <span className="text-gray-700 p-0.5 rounded mr-1">
                              {platforms.find(p => p.id === selectedPlatform)?.icon}
                            </span>
                            {platforms.find(p => p.id === selectedPlatform)?.name}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-1.5 bg-white rounded border border-gray-200">
                          <span className="text-xs text-gray-700 font-medium">Placement</span>
                          <span className="text-xs font-medium text-gray-900 flex items-center">
                            <span className="mr-1">{placementTypes.find(p => p.id === selectedPlacement)?.icon}</span>
                            {placementTypes.find(p => p.id === selectedPlacement)?.name}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-1.5 bg-white rounded border border-gray-200">
                          <span className="text-xs text-gray-700 font-medium">Total Budget</span>
                          <span className="text-xs font-medium text-gray-900">{budget.toLocaleString()} SAR</span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between p-1.5 bg-white rounded border border-gray-200">
                          <span className="text-xs text-gray-700 font-medium">Duration</span>
                          <span className="text-xs font-medium text-gray-900">{duration} days</span>
                        </div>
                        {selectedProduct && (
                          <div className="flex items-center justify-between p-1.5 bg-white rounded border border-gray-200">
                            <span className="text-xs text-gray-700 font-medium">Product</span>
                            <span className="text-xs font-medium text-gray-900 truncate">{selectedProduct.name}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between p-1.5 bg-white rounded border border-gray-200">
                          <span className="text-xs text-gray-700 font-medium">Target Segments</span>
                          <span className="text-xs font-medium text-gray-900">{targetAudience.length} segments</span>
                        </div>
                        <div className="flex items-center justify-between p-1.5 bg-white rounded border border-gray-200">
                          <span className="text-xs text-gray-700 font-medium">Target Locations</span>
                          <span className="text-xs font-medium text-gray-900">{demographics.locations.length} cities</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 p-1.5 bg-white rounded border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-600">
                          Estimated Daily Reach: <span className="font-medium text-gray-900">{Math.floor(calculateEstimatedReach() / duration).toLocaleString()} people/day</span>
                        </div>
                        <div className="text-xs text-gray-600">
                          Cost Per Click: <span className="font-medium text-gray-900">{Math.floor((budget / duration) / ((calculateEstimatedReach() * 0.05) / duration))} SAR</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Launch Campaign Button */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={handleCreateCampaign}
                  disabled={isCreating || !selectedProduct}
                  className="w-full px-4 py-2.5 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm"
                >
                  {isCreating ? (
                    <>
                      <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Creating Campaign...
                    </>
                  ) : (
                    <>
                      <AiOutlineRocket className="mr-2 text-sm" />
                      {selectedProduct ? 'Launch Product Campaign' : 'Select a Product First'}
                    </>
                  )}
                </button>
                {!selectedProduct && (
                  <p className="text-xs text-red-600 mt-2 text-center">Please select a product to promote</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'active' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            {renderActiveCampaigns()}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            {renderAnalytics()}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="text-center py-12 bg-white border border-dashed border-gray-300 rounded-xl">
            <div className="w-12 h-12 bg-whitesmoke rounded-full flex items-center justify-center mx-auto mb-4">
              <AiOutlineCalendar className="text-gray-600 text-lg" />
            </div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Campaign History</h4>
            <p className="text-xs text-gray-500 mb-6 max-w-md mx-auto">View your past campaigns and analyze performance trends</p>
            <button
              onClick={() => setActiveTab('create')}
              className="px-4 py-2 bg-white text-gray-700 font-medium rounded-lg hover:bg-gray-50 border border-gray-300 shadow-sm transition-all duration-200 text-xs"
            >
              Create New Campaign
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .bg-whitesmoke {
          background-color: whitesmoke;
        }
        .range-slider {
          -webkit-appearance: none;
          height: 4px;
          background: #e5e7eb;
          border-radius: 2px;
          outline: none;
        }
        .range-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #374151;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
        }
        .range-slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }
        .range-slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #374151;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
        }
        .range-slider::-moz-range-thumb:hover {
          transform: scale(1.1);
        }
        .line-clamp-1 {
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
        }
      `}</style>
    </div>
  );
};

export default AdvertisingPage;