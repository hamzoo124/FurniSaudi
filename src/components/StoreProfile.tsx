import React, { useState, useEffect, useRef } from 'react';
import {
  Store,
  Upload,
  Camera,
  Palette,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  Shield,
  CheckCircle,
  AlertCircle,
  XCircle,
  FileText,
  Package,
  Truck,
  CreditCard,
  Save,
  RefreshCw,
  Eye,
  Edit,
  X,
  Plus,
  Trash2,
  Check,
  ChevronDown,
  Hash,
  Building,
  Navigation,
  Award,
  Star,
  Users,
  Calendar,
  Lock,
  Unlock,
  ExternalLink,
  Image as ImageIcon,
  Settings
} from 'lucide-react';

// TypeScript Interfaces
interface StoreProfile {
  id: string;
  sellerId: string;
  name: string;
  slug: string;
  shortDescription: string;
  about: string;
  logoUrl: string;
  bannerUrl: string;
  themeColor: string;
  categories: string[];
  contactEmail: string;
  businessEmail: string;
  phoneNumbers: string[];
  address: string;
  city: string;
  region: string;
  country: string;
  location: {
    lat: number;
    lng: number;
  } | null;
  operatingHours: {
    [key: string]: {
      open: string;
      close: string;
      closed: boolean;
    };
  };
  policies: {
    returnPolicy: string;
    shippingPolicy: string;
    paymentMethods: string[];
    termsAndConditions: string;
    warrantyPolicy?: string;
    customOrderPolicy?: string;
  };
  socialLinks: {
    website?: string;
    instagram?: string;
    twitter?: string;
    facebook?: string;
  };
  verification: {
    status: 'verified' | 'pending' | 'rejected' | 'unverified';
    verifiedAt?: string;
    verificationDocuments: string[];
    rejectionReason?: string;
  };
  statistics: {
    totalProducts: number;
    totalOrders: number;
    totalCustomers: number;
    averageRating: number;
    joinedDate: string;
  };
  isActive: boolean;
  settings: {
    allowCustomOrders: boolean;
    requireDeposit: boolean;
    depositPercentage: number;
    leadTimeDays: number;
    minimumOrderValue: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface FormState {
  name: string;
  slug: string;
  shortDescription: string;
  about: string;
  themeColor: string;
  categories: string[];
  contactEmail: string;
  businessEmail: string;
  phoneNumbers: string[];
  address: string;
  city: string;
  region: string;
  country: string;
  operatingHours: {
    [key: string]: {
      open: string;
      close: string;
      closed: boolean;
    };
  };
  policies: {
    returnPolicy: string;
    shippingPolicy: string;
    paymentMethods: string[];
    termsAndConditions: string;
    warrantyPolicy: string;
    customOrderPolicy: string;
  };
  socialLinks: {
    website: string;
    instagram: string;
    twitter: string;
    facebook: string;
  };
  settings: {
    allowCustomOrders: boolean;
    requireDeposit: boolean;
    depositPercentage: number;
    leadTimeDays: number;
    minimumOrderValue: number;
  };
}

// Mock Store Profile Data
const mockStoreProfile: StoreProfile = {
  id: 'store-001',
  sellerId: 'seller-001',
  name: 'Premium Furniture Store',
  slug: 'premium-furniture-store',
  shortDescription: 'Luxury furniture & custom woodwork for modern living spaces',
  about: `We are a premium furniture store specializing in high-quality, handcrafted furniture pieces. With over 15 years of experience in furniture design and manufacturing, we bring elegance and functionality to every home.

Our artisans combine traditional woodworking techniques with modern design principles to create pieces that stand the test of time. We source only the finest materials, including solid oak, walnut, and teak, ensuring durability and beauty in every creation.

Whether you're looking for ready-made pieces or custom furniture tailored to your exact specifications, our team is dedicated to delivering excellence in craftsmanship and customer service.`,
  logoUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=200&h=200&fit=crop',
  bannerUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&h=400&fit=crop',
  themeColor: '#3B82F6',
  categories: ['Living Room', 'Bedroom', 'Office', 'Dining', 'Custom Furniture'],
  contactEmail: 'contact@premiumfurniture.com',
  businessEmail: 'business@premiumfurniture.com',
  phoneNumbers: ['+966 55 123 4567', '+966 11 234 5678'],
  address: 'Al Olaya District, King Fahd Road',
  city: 'Riyadh',
  region: 'Riyadh Province',
  country: 'Saudi Arabia',
  location: { lat: 24.7136, lng: 46.6753 },
  operatingHours: {
    sunday: { open: '09:00', close: '22:00', closed: false },
    monday: { open: '09:00', close: '22:00', closed: false },
    tuesday: { open: '09:00', close: '22:00', closed: false },
    wednesday: { open: '09:00', close: '22:00', closed: false },
    thursday: { open: '09:00', close: '22:00', closed: false },
    friday: { open: '14:00', close: '22:00', closed: false },
    saturday: { open: '09:00', close: '22:00', closed: false }
  },
  policies: {
    returnPolicy: `We accept returns within 14 days of delivery. Items must be in original condition with all packaging intact. Custom furniture cannot be returned unless defective. Refunds are processed within 5-7 business days.`,
    shippingPolicy: `Free delivery within Riyadh city for orders above SAR 2,000. Delivery to other Saudi cities within 3-7 business days. Assembly services available for an additional fee. Custom furniture delivery times vary based on production schedule.`,
    paymentMethods: ['Credit Card', 'Apple Pay', 'Bank Transfer', 'Cash on Delivery', 'Tamara', 'Tabby'],
    termsAndConditions: `All sales are final for custom orders. A 50% deposit is required for custom furniture production. Prices are subject to change without notice. Installation services are available upon request.`,
    warrantyPolicy: `All furniture comes with a 2-year warranty against manufacturing defects. The warranty covers structural issues but does not cover normal wear and tear or damage from improper use.`,
    customOrderPolicy: `Custom orders require a 50% deposit to begin production. Production time varies from 3-6 weeks depending on complexity. Design changes during production may incur additional fees.`
  },
  socialLinks: {
    website: 'https://premiumfurniture.com',
    instagram: 'https://instagram.com/premiumfurniture',
    twitter: 'https://twitter.com/premiumfurniture',
    facebook: 'https://facebook.com/premiumfurniture'
  },
  verification: {
    status: 'verified',
    verifiedAt: '2024-01-15',
    verificationDocuments: [
      'https://example.com/commercial-registration.pdf',
      'https://example.com/vat-certificate.pdf'
    ],
    rejectionReason: ''
  },
  statistics: {
    totalProducts: 48,
    totalOrders: 156,
    totalCustomers: 42,
    averageRating: 4.8,
    joinedDate: '2023-06-15'
  },
  isActive: true,
  settings: {
    allowCustomOrders: true,
    requireDeposit: true,
    depositPercentage: 50,
    leadTimeDays: 30,
    minimumOrderValue: 500
  },
  createdAt: '2023-06-15T10:30:00Z',
  updatedAt: '2024-01-20T14:45:00Z'
};

// Available Categories
const availableCategories = [
  'Living Room', 'Bedroom', 'Office', 'Dining', 'Kitchen', 'Outdoor',
  'Kids Furniture', 'Storage', 'Lighting', 'Decor', 'Custom Furniture',
  'Office Furniture', 'Garden Furniture', 'Luxury Furniture'
];

// Available Payment Methods
const availablePaymentMethods = [
  'Credit Card', 'Debit Card', 'Apple Pay', 'Google Pay', 'Bank Transfer',
  'Cash on Delivery', 'Tamara', 'Tabby', 'STC Pay', 'Mada', 'VISA', 'MasterCard'
];

// Days of Week
const daysOfWeek = [
  { key: 'sunday', label: 'Sunday' },
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' }
];

// Image Upload Component
const ImageUpload: React.FC<{
  label: string;
  currentImage: string;
  onImageChange: (url: string) => void;
  aspectRatio?: string;
}> = ({ label, currentImage, onImageChange, aspectRatio = '1/1' }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        onImageChange(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        onImageChange(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-900">{label}</label>
      <div
        className={`relative border-2 border-dashed rounded-xl transition ${
          isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        style={{ aspectRatio }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
        
        {currentImage ? (
          <div className="relative w-full h-full group">
            <img
              src={currentImage}
              alt={label}
              className="w-full h-full object-cover rounded-xl"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
              <div className="text-center p-4">
                <Camera className="w-8 h-8 text-white mx-auto mb-2" />
                <span className="text-white text-sm">Click to change</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 text-center">
              Drag & drop or click to upload
            </p>
            <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Color Picker Component
const ColorPicker: React.FC<{
  label: string;
  value: string;
  onChange: (color: string) => void;
}> = ({ label, value, onChange }) => {
  const presetColors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#1E3A8A', // Navy
    '#0F766E', // Teal
    '#B45309', // Brown
    '#64748B', // Gray
  ];

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-900">{label}</label>
      <div className="flex items-center gap-3">
        <div className="relative">
          <div 
            className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
            style={{ backgroundColor: value }}
            onClick={() => document.getElementById('colorInput')?.click()}
          />
          <input
            id="colorInput"
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        <div className="flex-1">
          <div className="grid grid-cols-5 gap-2">
            {presetColors.map((color) => (
              <button
                key={color}
                type="button"
                className="w-8 h-8 rounded border border-gray-300 hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                onClick={() => onChange(color)}
                title={color}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-600">{value}</span>
        <button
          type="button"
          onClick={() => onChange('#3B82F6')}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          Reset to default
        </button>
      </div>
    </div>
  );
};

// Phone Number Input Component
const PhoneNumberInput: React.FC<{
  label: string;
  phoneNumbers: string[];
  onChange: (numbers: string[]) => void;
}> = ({ label, phoneNumbers, onChange }) => {
  const [newNumber, setNewNumber] = useState('');

  const handleAddNumber = () => {
    if (newNumber.trim() && !phoneNumbers.includes(newNumber.trim())) {
      onChange([...phoneNumbers, newNumber.trim()]);
      setNewNumber('');
    }
  };

  const handleRemoveNumber = (index: number) => {
    onChange(phoneNumbers.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-900">{label}</label>
      <div className="space-y-2">
        {phoneNumbers.map((number, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-gray-500" />
              <span className="font-medium">{number}</span>
            </div>
            <button
              type="button"
              onClick={() => handleRemoveNumber(index)}
              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <div className="flex gap-2">
          <input
            type="tel"
            value={newNumber}
            onChange={(e) => setNewNumber(e.target.value)}
            placeholder="+966 55 123 4567"
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddNumber())}
          />
          <button
            type="button"
            onClick={handleAddNumber}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Operating Hours Component
const OperatingHours: React.FC<{
  hours: FormState['operatingHours'];
  onChange: (hours: FormState['operatingHours']) => void;
}> = ({ hours, onChange }) => {
  const handleChange = (day: string, field: 'open' | 'close' | 'closed', value: string | boolean) => {
    onChange({
      ...hours,
      [day]: {
        ...hours[day],
        [field]: value
      }
    });
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-900">Operating Hours</label>
      <div className="space-y-3">
        {daysOfWeek.map((day) => (
          <div key={day.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={!hours[day.key].closed}
                onChange={(e) => handleChange(day.key, 'closed', !e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="font-medium min-w-[100px]">{day.label}</span>
            </div>
            
            {!hours[day.key].closed ? (
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={hours[day.key].open}
                  onChange={(e) => handleChange(day.key, 'open', e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="time"
                  value={hours[day.key].close}
                  onChange={(e) => handleChange(day.key, 'close', e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            ) : (
              <span className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm">
                Closed
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

interface StoreProfileProps {
  onNavigateToAccountSettings?: () => void;
}

// Main Component
const StoreProfile: React.FC<StoreProfileProps> = ({ onNavigateToAccountSettings }) => {
  const [storeProfile, setStoreProfile] = useState<StoreProfile>(mockStoreProfile);
  const [formData, setFormData] = useState<FormState>({
    name: '',
    slug: '',
    shortDescription: '',
    about: '',
    themeColor: '',
    categories: [],
    contactEmail: '',
    businessEmail: '',
    phoneNumbers: [],
    address: '',
    city: '',
    region: '',
    country: '',
    operatingHours: {},
    policies: {
      returnPolicy: '',
      shippingPolicy: '',
      paymentMethods: [],
      termsAndConditions: '',
      warrantyPolicy: '',
      customOrderPolicy: ''
    },
    socialLinks: {
      website: '',
      instagram: '',
      twitter: '',
      facebook: ''
    },
    settings: {
      allowCustomOrders: false,
      requireDeposit: false,
      depositPercentage: 50,
      leadTimeDays: 30,
      minimumOrderValue: 500
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeSection, setActiveSection] = useState('branding');

  useEffect(() => {
    loadStoreProfile();
  }, []);

  useEffect(() => {
    // Check for changes
    const hasFormChanges = 
      formData.name !== storeProfile.name ||
      formData.slug !== storeProfile.slug ||
      formData.shortDescription !== storeProfile.shortDescription ||
      formData.about !== storeProfile.about ||
      formData.themeColor !== storeProfile.themeColor ||
      JSON.stringify(formData.categories) !== JSON.stringify(storeProfile.categories) ||
      formData.contactEmail !== storeProfile.contactEmail ||
      formData.businessEmail !== storeProfile.businessEmail ||
      JSON.stringify(formData.phoneNumbers) !== JSON.stringify(storeProfile.phoneNumbers) ||
      formData.address !== storeProfile.address ||
      formData.city !== storeProfile.city ||
      formData.region !== storeProfile.region ||
      formData.country !== storeProfile.country ||
      JSON.stringify(formData.operatingHours) !== JSON.stringify(storeProfile.operatingHours) ||
      formData.policies.returnPolicy !== storeProfile.policies.returnPolicy ||
      formData.policies.shippingPolicy !== storeProfile.policies.shippingPolicy ||
      JSON.stringify(formData.policies.paymentMethods) !== JSON.stringify(storeProfile.policies.paymentMethods) ||
      formData.policies.termsAndConditions !== storeProfile.policies.termsAndConditions ||
      formData.policies.warrantyPolicy !== storeProfile.policies.warrantyPolicy ||
      formData.policies.customOrderPolicy !== storeProfile.policies.customOrderPolicy ||
      JSON.stringify(formData.socialLinks) !== JSON.stringify(storeProfile.socialLinks) ||
      JSON.stringify(formData.settings) !== JSON.stringify(storeProfile.settings);
    
    setHasChanges(hasFormChanges);
  }, [formData, storeProfile]);

  const loadStoreProfile = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setStoreProfile(mockStoreProfile);
    setFormData({
      name: mockStoreProfile.name,
      slug: mockStoreProfile.slug,
      shortDescription: mockStoreProfile.shortDescription,
      about: mockStoreProfile.about,
      themeColor: mockStoreProfile.themeColor,
      categories: mockStoreProfile.categories,
      contactEmail: mockStoreProfile.contactEmail,
      businessEmail: mockStoreProfile.businessEmail,
      phoneNumbers: mockStoreProfile.phoneNumbers,
      address: mockStoreProfile.address,
      city: mockStoreProfile.city,
      region: mockStoreProfile.region,
      country: mockStoreProfile.country,
      operatingHours: mockStoreProfile.operatingHours,
      policies: {
        returnPolicy: mockStoreProfile.policies.returnPolicy,
        shippingPolicy: mockStoreProfile.policies.shippingPolicy,
        paymentMethods: mockStoreProfile.policies.paymentMethods,
        termsAndConditions: mockStoreProfile.policies.termsAndConditions,
        warrantyPolicy: mockStoreProfile.policies.warrantyPolicy || '',
        customOrderPolicy: mockStoreProfile.policies.customOrderPolicy || ''
      },
      socialLinks: {
        website: mockStoreProfile.socialLinks.website || '',
        instagram: mockStoreProfile.socialLinks.instagram || '',
        twitter: mockStoreProfile.socialLinks.twitter || '',
        facebook: mockStoreProfile.socialLinks.facebook || ''
      },
      settings: {
        allowCustomOrders: mockStoreProfile.settings.allowCustomOrders,
        requireDeposit: mockStoreProfile.settings.requireDeposit,
        depositPercentage: mockStoreProfile.settings.depositPercentage,
        leadTimeDays: mockStoreProfile.settings.leadTimeDays,
        minimumOrderValue: mockStoreProfile.settings.minimumOrderValue
      }
    });
    setLoading(false);
  };

  const handleSave = async () => {
    if (!hasChanges) return;
    
    setSaving(true);
    try {
      // In production: await supabase.from('store_profiles').update(formData).eq('id', storeProfile.id)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update local state
      setStoreProfile({
        ...storeProfile,
        ...formData,
        updatedAt: new Date().toISOString()
      });
      
      console.log('Store profile saved:', formData);
      
      // Show success message (in production, use toast)
      alert('Store profile saved successfully!');
      
    } catch (error) {
      console.error('Error saving store profile:', error);
      alert('Failed to save store profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoChange = (url: string) => {
    setFormData({ ...formData });
    // In production, upload to Supabase Storage first
    console.log('Logo changed to:', url);
  };

  const handleBannerChange = (url: string) => {
    setFormData({ ...formData });
    // In production, upload to Supabase Storage first
    console.log('Banner changed to:', url);
  };

  const handleCategoryToggle = (category: string) => {
    const newCategories = formData.categories.includes(category)
      ? formData.categories.filter(c => c !== category)
      : [...formData.categories, category];
    
    setFormData({ ...formData, categories: newCategories });
  };

  const handlePaymentMethodToggle = (method: string) => {
    const newMethods = formData.policies.paymentMethods.includes(method)
      ? formData.policies.paymentMethods.filter(m => m !== method)
      : [...formData.policies.paymentMethods, method];
    
    setFormData({
      ...formData,
      policies: { ...formData.policies, paymentMethods: newMethods }
    });
  };

  const getVerificationBadge = () => {
    const config = {
      verified: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Verified' },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending Review' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejected' },
      unverified: { color: 'bg-gray-100 text-gray-800', icon: AlertCircle, label: 'Not Verified' }
    };
    
    const { color, icon: Icon, label } = config[storeProfile.verification.status];
    return (
      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium ${color}`}>
        <Icon className="w-4 h-4" />
        {label}
        {storeProfile.verification.verifiedAt && (
          <span className="text-xs ml-2">Verified on {storeProfile.verification.verifiedAt}</span>
        )}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading store profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Store Profile</h1>
            <p className="text-gray-600 mt-1">Manage your store information and branding</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={loadStoreProfile}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            {onNavigateToAccountSettings && (
              <button
                onClick={onNavigateToAccountSettings}
                className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
              >
                <Settings className="w-4 h-4" />
                <span>Account Settings</span>
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {hasChanges && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-yellow-700">
                You have unsaved changes. Don't forget to save your changes.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2 border-b border-gray-200">
          {[
            { id: 'branding', label: 'Branding', icon: Palette },
            { id: 'information', label: 'Information', icon: Store },
            { id: 'contact', label: 'Contact & Location', icon: MapPin },
            { id: 'policies', label: 'Policies', icon: FileText },
            { id: 'settings', label: 'Settings', icon: Settings },
            { id: 'verification', label: 'Verification', icon: Shield }
          ].map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 px-4 py-3 font-medium text-sm rounded-t-lg border-b-2 transition ${
                activeSection === section.id
                  ? 'text-blue-600 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <section.icon className="w-4 h-4" />
              {section.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Store Preview & Stats */}
        <div className="lg:col-span-1">
          {/* Store Preview Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
            {/* Banner */}
            <div 
              className="h-32 w-full relative"
              style={{ backgroundColor: formData.themeColor }}
            >
              {storeProfile.bannerUrl && (
                <img
                  src={storeProfile.bannerUrl}
                  alt="Store Banner"
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
                <div className="flex items-end gap-3">
                  <div className="w-20 h-20 bg-white rounded-xl border-4 border-white shadow-lg overflow-hidden">
                    <img
                      src={storeProfile.logoUrl}
                      alt="Store Logo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-white">
                    <h3 className="text-xl font-bold">{formData.name}</h3>
                    <p className="text-sm opacity-90">{formData.shortDescription}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Store Info */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                {getVerificationBadge()}
                <div className="flex items-center gap-2">
                  {storeProfile.isActive ? (
                    <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      <Check className="w-3 h-3" />
                      Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                      <X className="w-3 h-3" />
                      Inactive
                    </span>
                  )}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{storeProfile.statistics.totalProducts}</div>
                  <div className="text-sm text-gray-600">Products</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{storeProfile.statistics.totalOrders}</div>
                  <div className="text-sm text-gray-600">Orders</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{storeProfile.statistics.totalCustomers}</div>
                  <div className="text-sm text-gray-600">Customers</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{storeProfile.statistics.averageRating.toFixed(1)}</div>
                  <div className="text-sm text-gray-600">Rating</div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="space-y-2">
                <button className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition">
                  <span className="font-medium text-gray-900">View Store Page</span>
                  <ExternalLink className="w-4 h-4 text-gray-500" />
                </button>
                <button className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition">
                  <span className="font-medium text-gray-900">Edit Store SEO</span>
                  <Edit className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
          </div>

          {/* Social Links Preview */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Social Links</h3>
            <div className="space-y-3">
              {Object.entries(storeProfile.socialLinks)
                .filter(([_, url]) => url)
                .map(([platform, url]) => (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
                  >
                    <div className="flex items-center gap-3">
                      <Globe className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-900 capitalize">{platform}</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-500" />
                  </a>
                ))}
            </div>
          </div>
        </div>

        {/* Right Column: Forms */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            {/* Form Content */}
            <div className="p-6">
              {/* Branding Section */}
              {activeSection === 'branding' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Store Branding</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <ImageUpload
                        label="Store Logo"
                        currentImage={storeProfile.logoUrl}
                        onImageChange={handleLogoChange}
                        aspectRatio="1/1"
                      />
                      
                      <ImageUpload
                        label="Store Banner"
                        currentImage={storeProfile.bannerUrl}
                        onImageChange={handleBannerChange}
                        aspectRatio="3/1"
                      />
                    </div>
                    
                    <div className="mt-8">
                      <ColorPicker
                        label="Theme Color"
                        value={formData.themeColor}
                        onChange={(color) => setFormData({ ...formData, themeColor: color })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Information Section */}
              {activeSection === 'information' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Store Information</h3>
                    
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-2">
                            Store Name *
                          </label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter store name"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-2">
                            Store URL Slug *
                          </label>
                          <div className="flex items-center">
                            <span className="px-4 py-2.5 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 text-gray-500">
                              marketplace.com/store/
                            </span>
                            <input
                              type="text"
                              value={formData.slug}
                              onChange={(e) => setFormData({ ...formData, slug: e.target.value.replace(/\s+/g, '-').toLowerCase() })}
                              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="store-slug"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          Short Description *
                        </label>
                        <input
                          type="text"
                          value={formData.shortDescription}
                          onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Brief description for your store"
                          maxLength={160}
                        />
                        <div className="text-right text-xs text-gray-500 mt-1">
                          {formData.shortDescription.length}/160 characters
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          About Store
                        </label>
                        <textarea
                          value={formData.about}
                          onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                          rows={6}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                          placeholder="Tell customers about your store, your story, and what makes you special..."
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-3">
                          Store Categories *
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {availableCategories.map((category) => (
                            <button
                              key={category}
                              type="button"
                              onClick={() => handleCategoryToggle(category)}
                              className={`px-4 py-2 rounded-lg border transition ${
                                formData.categories.includes(category)
                                  ? 'bg-blue-50 border-blue-500 text-blue-600'
                                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {category}
                              {formData.categories.includes(category) && (
                                <Check className="w-4 h-4 inline ml-2" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <OperatingHours
                        hours={formData.operatingHours}
                        onChange={(hours) => setFormData({ ...formData, operatingHours: hours })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Contact & Location Section */}
              {activeSection === 'contact' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Contact & Location</h3>
                    
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-2">
                            Contact Email *
                          </label>
                          <div className="flex items-center gap-2">
                            <Mail className="w-5 h-5 text-gray-400" />
                            <input
                              type="email"
                              value={formData.contactEmail}
                              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="contact@example.com"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-2">
                            Business Email
                          </label>
                          <div className="flex items-center gap-2">
                            <Mail className="w-5 h-5 text-gray-400" />
                            <input
                              type="email"
                              value={formData.businessEmail}
                              onChange={(e) => setFormData({ ...formData, businessEmail: e.target.value })}
                              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="business@example.com"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <PhoneNumberInput
                        label="Phone Numbers *"
                        phoneNumbers={formData.phoneNumbers}
                        onChange={(numbers) => setFormData({ ...formData, phoneNumbers: numbers })}
                      />
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-2">
                            Address *
                          </label>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-gray-400" />
                            <input
                              type="text"
                              value={formData.address}
                              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Full street address"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                              City *
                            </label>
                            <input
                              type="text"
                              value={formData.city}
                              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="City"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                              Region *
                            </label>
                            <input
                              type="text"
                              value={formData.region}
                              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Region/Province"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                              Country *
                            </label>
                            <input
                              type="text"
                              value={formData.country}
                              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Country"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-lg font-bold text-gray-900 mb-4">Social Media Links</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                              Website
                            </label>
                            <input
                              type="url"
                              value={formData.socialLinks.website}
                              onChange={(e) => setFormData({
                                ...formData,
                                socialLinks: { ...formData.socialLinks, website: e.target.value }
                              })}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="https://example.com"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                              Instagram
                            </label>
                            <input
                              type="url"
                              value={formData.socialLinks.instagram}
                              onChange={(e) => setFormData({
                                ...formData,
                                socialLinks: { ...formData.socialLinks, instagram: e.target.value }
                              })}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="https://instagram.com/username"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                              Twitter
                            </label>
                            <input
                              type="url"
                              value={formData.socialLinks.twitter}
                              onChange={(e) => setFormData({
                                ...formData,
                                socialLinks: { ...formData.socialLinks, twitter: e.target.value }
                              })}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="https://twitter.com/username"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">
                              Facebook
                            </label>
                            <input
                              type="url"
                              value={formData.socialLinks.facebook}
                              onChange={(e) => setFormData({
                                ...formData,
                                socialLinks: { ...formData.socialLinks, facebook: e.target.value }
                              })}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="https://facebook.com/username"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Policies Section */}
              {activeSection === 'policies' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Store Policies</h3>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          Return Policy *
                        </label>
                        <textarea
                          value={formData.policies.returnPolicy}
                          onChange={(e) => setFormData({
                            ...formData,
                            policies: { ...formData.policies, returnPolicy: e.target.value }
                          })}
                          rows={4}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                          placeholder="Describe your return policy..."
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          Shipping Policy *
                        </label>
                        <textarea
                          value={formData.policies.shippingPolicy}
                          onChange={(e) => setFormData({
                            ...formData,
                            policies: { ...formData.policies, shippingPolicy: e.target.value }
                          })}
                          rows={4}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                          placeholder="Describe your shipping policy..."
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          Warranty Policy
                        </label>
                        <textarea
                          value={formData.policies.warrantyPolicy}
                          onChange={(e) => setFormData({
                            ...formData,
                            policies: { ...formData.policies, warrantyPolicy: e.target.value }
                          })}
                          rows={3}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                          placeholder="Describe your warranty policy..."
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          Custom Order Policy
                        </label>
                        <textarea
                          value={formData.policies.customOrderPolicy}
                          onChange={(e) => setFormData({
                            ...formData,
                            policies: { ...formData.policies, customOrderPolicy: e.target.value }
                          })}
                          rows={3}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                          placeholder="Describe your custom order policy..."
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                          Terms & Conditions *
                        </label>
                        <textarea
                          value={formData.policies.termsAndConditions}
                          onChange={(e) => setFormData({
                            ...formData,
                            policies: { ...formData.policies, termsAndConditions: e.target.value }
                          })}
                          rows={4}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                          placeholder="Describe your terms and conditions..."
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-3">
                          Accepted Payment Methods *
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {availablePaymentMethods.map((method) => (
                            <button
                              key={method}
                              type="button"
                              onClick={() => handlePaymentMethodToggle(method)}
                              className={`px-4 py-2 rounded-lg border transition ${
                                formData.policies.paymentMethods.includes(method)
                                  ? 'bg-green-50 border-green-500 text-green-600'
                                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {method}
                              {formData.policies.paymentMethods.includes(method) && (
                                <Check className="w-4 h-4 inline ml-2" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Settings Section */}
              {activeSection === 'settings' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Store Settings</h3>
                    
                    <div className="space-y-6">
                      <div className="p-6 bg-gray-50 rounded-xl">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-bold text-gray-900">Store Status</h4>
                            <p className="text-sm text-gray-600">Control whether your store is active or inactive</p>
                          </div>
                          <button
                            onClick={() => {
                              // In production: Update via API
                              console.log('Toggle store status');
                            }}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                              storeProfile.isActive ? 'bg-green-500' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                                storeProfile.isActive ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <h4 className="font-bold text-gray-900">Allow Custom Orders</h4>
                            <p className="text-sm text-gray-600">Accept custom furniture requests from customers</p>
                          </div>
                          <button
                            onClick={() => setFormData({
                              ...formData,
                              settings: { ...formData.settings, allowCustomOrders: !formData.settings.allowCustomOrders }
                            })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                              formData.settings.allowCustomOrders ? 'bg-blue-500' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                                formData.settings.allowCustomOrders ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                        
                        {formData.settings.allowCustomOrders && (
                          <div className="ml-8 space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="font-medium text-gray-900">Require Deposit</h5>
                                <p className="text-sm text-gray-600">Collect deposit before starting custom orders</p>
                              </div>
                              <button
                                onClick={() => setFormData({
                                  ...formData,
                                  settings: { ...formData.settings, requireDeposit: !formData.settings.requireDeposit }
                                })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                                  formData.settings.requireDeposit ? 'bg-blue-500' : 'bg-gray-300'
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                                    formData.settings.requireDeposit ? 'translate-x-6' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            </div>
                            
                            {formData.settings.requireDeposit && (
                              <div>
                                <label className="block text-sm font-medium text-gray-900 mb-2">
                                  Deposit Percentage
                                </label>
                                <div className="flex items-center gap-3">
                                  <input
                                    type="range"
                                    min="10"
                                    max="100"
                                    step="5"
                                    value={formData.settings.depositPercentage}
                                    onChange={(e) => setFormData({
                                      ...formData,
                                      settings: { ...formData.settings, depositPercentage: parseInt(e.target.value) }
                                    })}
                                    className="flex-1"
                                  />
                                  <span className="w-16 text-center font-bold text-blue-600">
                                    {formData.settings.depositPercentage}%
                                  </span>
                                </div>
                              </div>
                            )}
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-900 mb-2">
                                Lead Time (Days)
                              </label>
                              <input
                                type="number"
                                min="1"
                                max="365"
                                value={formData.settings.leadTimeDays}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  settings: { ...formData.settings, leadTimeDays: parseInt(e.target.value) }
                                })}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                          </div>
                        )}
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-2">
                            Minimum Order Value (SAR)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="50"
                            value={formData.settings.minimumOrderValue}
                            onChange={(e) => setFormData({
                              ...formData,
                              settings: { ...formData.settings, minimumOrderValue: parseInt(e.target.value) }
                            })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Verification Section */}
              {activeSection === 'verification' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Verification Status</h3>
                    
                    <div className="space-y-6">
                      <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-white rounded-lg">
                            <Shield className="w-8 h-8 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="text-lg font-bold text-gray-900 mb-2">Store Verification</h4>
                            <p className="text-gray-700 mb-3">
                              Verified stores receive a verification badge and gain customer trust. 
                              Upload required documents to complete verification.
                            </p>
                            {getVerificationBadge()}
                          </div>
                        </div>
                      </div>
                      
                      {storeProfile.verification.status === 'rejected' && storeProfile.verification.rejectionReason && (
                        <div className="p-6 bg-red-50 border border-red-200 rounded-xl">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                            <div>
                              <h4 className="font-bold text-red-900 mb-1">Verification Rejected</h4>
                              <p className="text-red-700">{storeProfile.verification.rejectionReason}</p>
                              <button className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">
                                Resubmit Documents
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <h4 className="text-lg font-bold text-gray-900 mb-4">Required Documents</h4>
                        <div className="space-y-4">
                          <div className="p-4 border border-gray-300 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-gray-500" />
                                <div>
                                  <h5 className="font-bold text-gray-900">Commercial Registration</h5>
                                  <p className="text-sm text-gray-600">PDF, JPG or PNG up to 5MB</p>
                                </div>
                              </div>
                              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                                Upload
                              </button>
                            </div>
                          </div>
                          
                          <div className="p-4 border border-gray-300 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-gray-500" />
                                <div>
                                  <h5 className="font-bold text-gray-900">VAT Certificate</h5>
                                  <p className="text-sm text-gray-600">PDF, JPG or PNG up to 5MB</p>
                                </div>
                              </div>
                              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                                Upload
                              </button>
                            </div>
                          </div>
                          
                          <div className="p-4 border border-gray-300 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-gray-500" />
                                <div>
                                  <h5 className="font-bold text-gray-900">Bank Account Letter</h5>
                                  <p className="text-sm text-gray-600">PDF, JPG or PNG up to 5MB</p>
                                </div>
                              </div>
                              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                                Upload
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {storeProfile.verification.verificationDocuments.length > 0 && (
                        <div>
                          <h4 className="text-lg font-bold text-gray-900 mb-4">Uploaded Documents</h4>
                          <div className="space-y-3">
                            {storeProfile.verification.verificationDocuments.map((doc, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <FileText className="w-5 h-5 text-gray-500" />
                                  <div>
                                    <h5 className="font-bold text-gray-900">Document {index + 1}</h5>
                                    <p className="text-sm text-gray-600">Uploaded on {storeProfile.verification.verifiedAt}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg">
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreProfile;