import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft, Upload, Image as ImageIcon, Video, Trash2, Save,
  Plus, X, Check, DollarSign, Hash, Package, Truck,
  Shield, Ruler, Palette, Tag, FileText, Info, Box,
  Clock, MapPin, Layers, Repeat, Barcode, Settings,
  Warehouse, Building, Truck as TruckIcon, Home
} from 'lucide-react';

// Category interface matching the categories table
interface Category {
  id: string;
  name: string;
  display_name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  category_type: 'customized' | 'ready_made';
  usage_type: 'indoor' | 'outdoor' | 'both';
  product_type: string | null;
  product_categories: string[];
  level: number;
  display_order: number;
  icon: string;
  color: string;
  image_url: string | null;
  is_featured: boolean;
  is_active: boolean;
  filter_tags: string[];
  hierarchy_path: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface Variant {
  id: string;
  type: string;
  option: string;
  color?: string;
  size?: string;
  material?: string;
  price: string;
  stock: number;
  sku: string;
  barcode?: string;
  image?: string;
}

interface CityDelivery {
  city: string;
  available: boolean;
  freeDelivery: boolean;
  deliveryCost: string;
  deliveryTime: string;
  shippingCompany?: string;
}

interface ReturnPolicy {
  allowed: boolean;
  period: string;
  fee: string;
  conditions: string[];
}

interface ProductFormData {
  id: string;
  category_type: 'customized' | 'ready_made';
  usage_type: 'indoor' | 'outdoor' | 'both';
  product_type: string;
  product_categories: string[];
  name: string;
  description: string;
  shortDescription: string;
  displaySection: string;
  images: string[];
  mainImage: string;
  videoUrl: string;
  dimensions: {
    length: string;
    width: string;
    height: string;
    unit: string;
  };
  weight: string;
  primaryColor: string;
  availableColors: string[];
  finishType: string;
  warrantyType: string;
  warrantyDuration: string;
  material: string;
  hasVariants: boolean;
  variants: Variant[];
  sellingPrice: string;
  discountedPrice: string;
  stockQuantity: number;
  skuCode: string;
  barcode: string;
  availableCities: CityDelivery[];
  shippingOptions: {
    withinCity: {
      available: boolean;
      cost: string;
      time: string;
    };
    outsideCity: {
      available: boolean;
      cost: string;
      time: string;
    };
  };
  installationAvailable: boolean;
  installationFee: string;
  returnPolicy: ReturnPolicy;
  customizationTime: string;
  materialsUsed: string[];
  sellerId: string;
  sellerName: string;
  status: 'draft' | 'active' | 'inactive';
  category_id?: string;
  category_name?: string;
  category_display_name?: string;
  filter_tags?: string[];
  hierarchy_path?: string;
}

interface TempImageStorage {
  [key: string]: string;
}

const AddProduct: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  
  const [tempImages, setTempImages] = useState<TempImageStorage>({});
  const [tempVideo, setTempVideo] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategories, setActiveCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [categoryOptions, setCategoryOptions] = useState<Array<{value: string, label: string}>>([]);

  const [formData, setFormData] = useState<ProductFormData>({
    id: `prod_${Date.now()}`,
    category_type: 'ready_made',
    usage_type: 'indoor',
    product_type: '',
    product_categories: [],
    name: '',
    description: '',
    shortDescription: '',
    displaySection: '',
    images: [],
    mainImage: '',
    videoUrl: '',
    dimensions: {
      length: '',
      width: '',
      height: '',
      unit: 'cm'
    },
    weight: '',
    primaryColor: '#FFFFFF',
    availableColors: ['#FFFFFF', '#F5F5F5'],
    finishType: 'Glossy',
    warrantyType: 'Manufacturer',
    warrantyDuration: '1 year',
    material: 'Wood',
    hasVariants: false,
    variants: [],
    sellingPrice: '',
    discountedPrice: '',
    stockQuantity: 10,
    skuCode: `SKU${Date.now().toString().slice(-6)}`,
    barcode: '',
    availableCities: [
      {
        city: 'Riyadh',
        available: true,
        freeDelivery: true,
        deliveryCost: '0',
        deliveryTime: '3-5 days',
        shippingCompany: 'Aramex'
      }
    ],
    shippingOptions: {
      withinCity: {
        available: true,
        cost: '0',
        time: '1-2 days'
      },
      outsideCity: {
        available: true,
        cost: '50',
        time: '3-5 days'
      }
    },
    installationAvailable: false,
    installationFee: '0',
    returnPolicy: {
      allowed: true,
      period: '30 days',
      fee: '0',
      conditions: [
        'Product must be in original condition',
        'Original packaging required',
        'Proof of purchase needed'
      ]
    },
    customizationTime: '2-3 weeks',
    materialsUsed: ['Wood', 'Metal'],
    sellerId: user?.id || 'seller_001',
    sellerName: user?.name || user?.email || 'Sample Seller',
    status: 'draft'
  });

  const finishTypes = [
    'Glossy', 'Matte', 'Natural', 'Satin', 'Textured',
    'Polished', 'Distressed', 'Painted', 'Stained'
  ];

  const warrantyTypes = [
    'Manufacturer', 'Seller', 'No Warranty',
    'Extended Warranty', 'Lifetime'
  ];

  const warrantyDurations = [
    '30 days', '3 months', '6 months', '1 year',
    '2 years', '3 years', '5 years', 'Lifetime'
  ];

  const materials = [
    'Wood', 'Metal', 'Glass', 'Plastic', 'Fabric',
    'Leather', 'Marble', 'Granite', 'Bamboo', 'Rattan',
    'Wicker', 'MDF', 'Plywood', 'Particle Board'
  ];

  const saudiCities = [
    'Riyadh', 'Jeddah', 'Dammam', 'Mecca', 'Medina',
    'Khobar', 'Dhahran', 'Abha', 'Tabuk', 'Taif',
    'Buraidah', 'Khamis Mushait', 'Al Hofuf', 'Najran'
  ];

  const shippingCompanies = [
    'Aramex', 'SMSA', 'Naqel', 'DHL', 'FedEx',
    'UPS', 'Zajil', 'Self Delivery', 'Other'
  ];

  const colorOptions = [
    { name: 'White', value: '#FFFFFF' },
    { name: 'White Smoke', value: '#F5F5F5' },
    { name: 'Snow', value: '#FFFAFA' },
    { name: 'Ghost White', value: '#F8F8FF' },
    { name: 'Ivory', value: '#FFFFF0' }
  ];

  // Simplified categories fetch function
  const fetchCategories = async () => {
    setLoadingCategories(true);
    setCategoryError(null);
    
    try {
      console.log('📋 Fetching categories...');
      
      // First try to fetch from categories table
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (categoriesError) {
        console.warn('Categories table error:', categoriesError);
        
        // If table doesn't exist or no data, check localStorage
        const storedCategories = localStorage.getItem('adminCategories');
        if (storedCategories) {
          const parsed = JSON.parse(storedCategories);
          console.log('📦 Using categories from localStorage:', parsed.length);
          setCategories(parsed);
          setActiveCategories(parsed.filter((cat: Category) => cat.is_active));
        } else {
          // Create sample categories if none exist
          console.log('📝 Creating sample categories...');
          const sampleCategories: Category[] = [
            {
              id: 'cat_1',
              name: 'Custom Sofa Indoor',
              display_name: 'Custom Sofa Indoor',
              slug: 'custom-sofa-indoor',
              description: 'Custom made sofas for indoor spaces',
              category_type: 'customized',
              usage_type: 'indoor',
              product_type: 'sofa',
              product_categories: ['living_room', 'office'],
              level: 3,
              display_order: 1,
              icon: '🛋️',
              color: '#EF4444',
              image_url: null,
              is_featured: true,
              is_active: true,
              filter_tags: ['customized', 'indoor', 'sofa', 'living_room', 'office'],
              hierarchy_path: 'Customized → Indoor → Sofa → Living Room, Office',
              metadata: {},
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              parent_id: null
            },
            {
              id: 'cat_2',
              name: 'Ready Bed Bedroom',
              display_name: 'Ready Made Bed Bedroom',
              slug: 'ready-bed-bedroom',
              description: 'Ready made beds for bedrooms',
              category_type: 'ready_made',
              usage_type: 'indoor',
              product_type: 'bed',
              product_categories: ['bedroom'],
              level: 3,
              display_order: 2,
              icon: '🛏️',
              color: '#6366F1',
              image_url: null,
              is_featured: true,
              is_active: true,
              filter_tags: ['ready_made', 'indoor', 'bed', 'bedroom'],
              hierarchy_path: 'Ready Made → Indoor → Bed → Bedroom',
              metadata: {},
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              parent_id: null
            },
            {
              id: 'cat_3',
              name: 'Custom Table Outdoor',
              display_name: 'Custom Table Outdoor',
              slug: 'custom-table-outdoor',
              description: 'Custom tables for outdoor spaces',
              category_type: 'customized',
              usage_type: 'outdoor',
              product_type: 'table',
              product_categories: ['garden', 'dining'],
              level: 3,
              display_order: 3,
              icon: '🪑',
              color: '#F59E0B',
              image_url: null,
              is_featured: false,
              is_active: true,
              filter_tags: ['customized', 'outdoor', 'table', 'garden', 'dining'],
              hierarchy_path: 'Customized → Outdoor → Table → Garden, Dining',
              metadata: {},
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              parent_id: null
            }
          ];
          
          setCategories(sampleCategories);
          setActiveCategories(sampleCategories);
          localStorage.setItem('adminCategories', JSON.stringify(sampleCategories));
        }
      } else {
        console.log('✅ Categories fetched from database:', categoriesData?.length);
        setCategories(categoriesData || []);
        setActiveCategories(categoriesData?.filter(cat => cat.is_active) || []);
      }
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
      setCategoryError('Failed to load categories');
    } finally {
      setLoadingCategories(false);
    }
  };

  // Load categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Update category options when categories are loaded
  useEffect(() => {
    if (activeCategories.length > 0) {
      const options = activeCategories.map(cat => {
        let label = cat.display_name || cat.name;
        
        // Add additional info for better identification
        if (cat.product_type) {
          const formattedProductType = cat.product_type.charAt(0).toUpperCase() + cat.product_type.slice(1);
          label += ` - ${formattedProductType} (${cat.category_type} ${cat.usage_type})`;
        } else {
          label += ` (${cat.category_type} ${cat.usage_type})`;
        }
        
        return {
          value: cat.id,
          label: label,
          category_type: cat.category_type,
          usage_type: cat.usage_type,
          product_type: cat.product_type,
          product_categories: cat.product_categories || []
        };
      });
      
      setCategoryOptions(options);
      console.log('🎯 Category options updated:', options.length);
    }
  }, [activeCategories]);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        sellerId: user.id || 'seller_001',
        sellerName: user.name || user.email || 'Sample Seller'
      }));
    }
  }, [user]);

  // Get product types based on selected category type and usage type
  const getFilteredProductTypes = () => {
    const filteredCategories = activeCategories.filter(cat => 
      cat.category_type === formData.category_type && 
      (cat.usage_type === formData.usage_type || cat.usage_type === 'both')
    );
    
    const productTypes = filteredCategories
      .map(cat => cat.product_type)
      .filter((type, index, self) => type && self.indexOf(type) === index);
    
    console.log('🔍 Filtered product types:', productTypes);
    return productTypes;
  };

  // Get product categories based on selected category type, usage type, and product type
  const getFilteredProductCategories = () => {
    if (!formData.product_type) return [];
    
    const filteredCategories = activeCategories.filter(cat => 
      cat.category_type === formData.category_type && 
      (cat.usage_type === formData.usage_type || cat.usage_type === 'both') &&
      cat.product_type === formData.product_type
    );
    
    const productCategories = filteredCategories
      .flatMap(cat => cat.product_categories || [])
      .filter((cat, index, self) => cat && self.indexOf(cat) === index);
    
    console.log('🔍 Filtered product categories:', productCategories);
    return productCategories;
  };

  // Handle category selection from dropdown
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    
    const selectedCategory = categories.find(cat => cat.id === categoryId);
    
    if (selectedCategory) {
      console.log('🎯 Selected category:', selectedCategory);
      setFormData(prev => ({
        ...prev,
        category_type: selectedCategory.category_type,
        usage_type: selectedCategory.usage_type,
        product_type: selectedCategory.product_type || '',
        product_categories: selectedCategory.product_categories || [],
        category_id: selectedCategory.id,
        category_name: selectedCategory.name,
        category_display_name: selectedCategory.display_name,
        filter_tags: selectedCategory.filter_tags,
        hierarchy_path: selectedCategory.hierarchy_path
      }));
    }
  };

  // Handle manual category type change
  const handleCategoryTypeChange = (type: 'customized' | 'ready_made') => {
    setFormData(prev => ({
      ...prev,
      category_type: type,
      usage_type: 'indoor',
      product_type: '',
      product_categories: [],
      category_id: '',
      category_name: '',
      category_display_name: ''
    }));
    setSelectedCategoryId('');
  };

  // Handle manual usage type change
  const handleUsageTypeChange = (type: 'indoor' | 'outdoor' | 'both') => {
    setFormData(prev => ({
      ...prev,
      usage_type: type,
      product_type: '',
      product_categories: [],
      category_id: '',
      category_name: '',
      category_display_name: ''
    }));
    setSelectedCategoryId('');
  };

  // Handle manual product type change
  const handleProductTypeChange = (type: string) => {
    setFormData(prev => ({
      ...prev,
      product_type: type,
      product_categories: [],
      category_id: '',
      category_name: '',
      category_display_name: ''
    }));
    setSelectedCategoryId('');
  };

  // Handle product category selection
  const handleProductCategoryChange = (category: string) => {
    setFormData(prev => {
      const currentCategories = prev.product_categories || [];
      const newCategories = currentCategories.includes(category)
        ? currentCategories.filter(cat => cat !== category)
        : [...currentCategories, category];
      
      return { ...prev, product_categories: newCategories };
    });
  };

  // Update product categories when product type changes
  useEffect(() => {
    if (formData.product_type) {
      const availableCategories = getFilteredProductCategories();
      setFormData(prev => ({
        ...prev,
        product_categories: prev.product_categories.filter(cat => 
          availableCategories.includes(cat)
        )
      }));
    }
  }, [formData.category_type, formData.usage_type, formData.product_type]);

  const compressImage = (file: File, maxSizeMB = 0.3): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const maxDimension = 800;
          if (width > height && width > maxDimension) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          } else if (height > maxDimension) {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
          resolve(compressedDataUrl);
        };
        img.onerror = reject;
        img.src = event.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setErrors(prev => ({ ...prev, [name]: '' }));
    
    if (name === 'sellingPrice' || name === 'discountedPrice' || name === 'weight') {
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    } else if (name === 'stockQuantity') {
      const intValue = parseInt(value);
      if (!isNaN(intValue) && intValue >= 0) {
        setFormData(prev => ({ ...prev, [name]: intValue }));
      } else if (value === '') {
        setFormData(prev => ({ ...prev, [name]: 0 }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const maxImages = formData.category_type === 'customized' ? 5 : 10;
    if (formData.images.length + files.length > maxImages) {
      setErrors(prev => ({ ...prev, images: `Maximum ${maxImages} images allowed` }));
      return;
    }
    
    for (const file of Array.from(files)) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert(`Invalid file type: ${file.name}. Please upload JPEG, PNG, or WebP images.`);
        continue;
      }
      
      try {
        const compressedDataUrl = await compressImage(file, 0.3);
        const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        setTempImages(prev => ({ ...prev, [imageId]: compressedDataUrl }));
        setFormData(prev => {
          const updatedImages = [...prev.images, imageId];
          if (prev.mainImage === '') {
            return { ...prev, images: updatedImages, mainImage: imageId };
          }
          return { ...prev, images: updatedImages };
        });
      } catch (error) {
        console.error('Error processing image:', error);
        alert(`Failed to process image: ${file.name}`);
      }
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const validTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload MP4, WebM, or OGG video files.');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      alert('Video file exceeds 5MB limit. Please upload a smaller video.');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setTempVideo(dataUrl);
        setFormData(prev => ({ ...prev, videoUrl: `video_${formData.id}` }));
      }
    };
    reader.readAsDataURL(file);
    
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
  };

  const removeImage = (imageId: string) => {
    setFormData(prev => {
      const updatedImages = prev.images.filter(id => id !== imageId);
      let newMainImage = prev.mainImage;
      
      if (imageId === prev.mainImage) {
        newMainImage = updatedImages[0] || '';
      }
      
      return { ...prev, images: updatedImages, mainImage: newMainImage };
    });
    
    setTempImages(prev => {
      const newTemp = { ...prev };
      delete newTemp[imageId];
      return newTemp;
    });
  };

  const setAsMainImage = (imageId: string) => {
    setFormData(prev => ({ ...prev, mainImage: imageId }));
  };

  const addVariant = () => {
    const newVariant: Variant = {
      id: `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: '',
      option: '',
      price: formData.sellingPrice || '0',
      stock: formData.stockQuantity || 0,
      sku: `SKU${Date.now().toString().slice(-6)}_${Math.random().toString(36).substr(2, 3)}`,
      barcode: ''
    };
    
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, newVariant]
    }));
  };

  const updateVariant = (id: string, field: keyof Variant, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map(variant =>
        variant.id === id ? { ...variant, [field]: value } : variant
      )
    }));
  };

  const removeVariant = (id: string) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter(variant => variant.id !== id)
    }));
  };

  const toggleCityDelivery = (city: string) => {
    setFormData(prev => {
      const existingCity = prev.availableCities.find(c => c.city === city);
      if (existingCity) {
        return {
          ...prev,
          availableCities: prev.availableCities.filter(c => c.city !== city)
        };
      } else {
        const newCity: CityDelivery = {
          city,
          available: true,
          freeDelivery: true,
          deliveryCost: '0',
          deliveryTime: '3-5 days',
          shippingCompany: 'Aramex'
        };
        return {
          ...prev,
          availableCities: [...prev.availableCities, newCity]
        };
      }
    });
  };

  const updateCityDelivery = (city: string, field: keyof CityDelivery, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      availableCities: prev.availableCities.map(c =>
        c.city === city ? { ...c, [field]: value } : c
      )
    }));
  };

  const getImageUrl = (imageId: string) => {
    return tempImages[imageId] || '';
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.category_type) newErrors.category_type = 'Category type is required';
    if (!formData.usage_type) newErrors.usage_type = 'Usage type is required';
    if (!formData.product_type) newErrors.product_type = 'Product type is required';
    if (formData.product_categories.length === 0) newErrors.product_categories = 'Select at least one product category';
    if (formData.images.length < 3) newErrors.images = 'At least 3 images are required';
    if (!formData.mainImage) newErrors.mainImage = 'Please select a main image';
    if (!formData.sellingPrice) newErrors.sellingPrice = 'Selling price is required';
    if (parseFloat(formData.sellingPrice) <= 0) newErrors.sellingPrice = 'Price must be > 0';
    
    return newErrors;
  };

  const saveAsDraft = () => {
    const draftData = {
      ...formData,
      imageCount: formData.images.length,
      hasMainImage: !!formData.mainImage,
      hasVideo: !!tempVideo,
      status: 'draft',
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    try {
      const existingDrafts = JSON.parse(localStorage.getItem('productDrafts') || '[]');
      localStorage.setItem('productDrafts', JSON.stringify([...existingDrafts, draftData]));
      
      try {
        const existingTempImages = JSON.parse(localStorage.getItem('tempImages') || '{}');
        const updatedTempImages = { ...existingTempImages, ...tempImages };
        if (tempVideo) {
          updatedTempImages[`video_${formData.id}`] = tempVideo;
        }
        localStorage.setItem('tempImages', JSON.stringify(updatedTempImages));
      } catch (imageError) {
        console.warn('Could not save images to draft:', imageError);
      }
      
      alert('Product saved as draft!');
      navigate('/seller/dashboard');
    } catch (error) {
      alert('Failed to save draft. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      alert('Please fix the errors in the form');
      return;
    }
    
    setLoading(true);

    try {
      const selectedCategory = selectedCategoryId 
        ? categories.find(cat => cat.id === selectedCategoryId)
        : null;

      const productData = {
        ...formData,
        ...(selectedCategory && {
          category_id: selectedCategory.id,
          category_name: selectedCategory.name,
          category_display_name: selectedCategory.display_name,
          filter_tags: selectedCategory.filter_tags,
          hierarchy_path: selectedCategory.hierarchy_path
        }),
        sellingPrice: parseFloat(formData.sellingPrice).toString(),
        discountedPrice: formData.discountedPrice ? parseFloat(formData.discountedPrice).toString() : '',
        stockQuantity: formData.stockQuantity || 0,
        imageCount: formData.images.length,
        hasMainImage: !!formData.mainImage,
        hasVideo: !!tempVideo,
        sellerId: user?.id || 'seller_001',
        sellerName: user?.name || user?.email || 'Sample Seller',
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        status: 'active',
        rating: 0,
        orders: 0,
        reviews: [],
        isTopSeller: false
      };

      try {
        const existingProducts = JSON.parse(localStorage.getItem('furnitureProducts') || '[]');
        const updatedProducts = [...existingProducts, productData];
        localStorage.setItem('furnitureProducts', JSON.stringify(updatedProducts));

        try {
          const existingMedia = JSON.parse(localStorage.getItem('productMedia') || '{}');
          const imagesToSave: TempImageStorage = {};
          
          formData.images.slice(0, 3).forEach(imageId => {
            if (tempImages[imageId]) {
              imagesToSave[imageId] = tempImages[imageId];
            }
          });
          
          if (formData.mainImage && tempImages[formData.mainImage]) {
            imagesToSave[formData.mainImage] = tempImages[formData.mainImage];
          }
          
          if (tempVideo) {
            imagesToSave[`video_${formData.id}`] = tempVideo;
          }
          
          const updatedMedia = {
            ...existingMedia,
            [formData.id]: imagesToSave
          };
          
          localStorage.setItem('productMedia', JSON.stringify(updatedMedia));
        } catch (mediaError) {
          console.warn('Could not save media files:', mediaError);
        }

        const existingDrafts = JSON.parse(localStorage.getItem('productDrafts') || '[]');
        const remainingDrafts = existingDrafts.filter((draft: any) => draft.id !== formData.id);
        localStorage.setItem('productDrafts', JSON.stringify(remainingDrafts));

        alert(`Product "${formData.name}" added successfully!`);
        navigate('/seller/dashboard');

      } catch (storageError: any) {
        if (storageError.name === 'QuotaExceededError') {
          const cleanFormDataNoImages = {
            ...productData,
            images: [],
            mainImage: '',
            videoUrl: ''
          };
          
          const existingProducts = JSON.parse(localStorage.getItem('furnitureProducts') || '[]');
          localStorage.setItem('furnitureProducts', JSON.stringify([...existingProducts, cleanFormDataNoImages]));
          
          alert(`Product "${formData.name}" added without images due to storage limits.`);
          navigate('/seller/dashboard');
        } else {
          throw new Error('Failed to save product. Please try again.');
        }
      }

    } catch (error: any) {
      console.error('Submit error:', error);
      alert(error.message || 'Failed to add product. Please check all required fields.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate('/seller/dashboard')}
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
            <div className="text-xs text-gray-500">
              Seller: <span className="font-medium">{formData.sellerName}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-800">Add New Product</h1>
          <p className="text-gray-600 mt-1 text-sm">
            Complete all sections below to add your product. All fields are required unless marked optional.
          </p>
        </div>

        {/* Progress Summary */}
        <div className="mb-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500">Status</div>
                <div className="text-sm font-bold text-gray-800">Draft</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <ImageIcon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500">Images</div>
                <div className="text-sm font-bold text-gray-800">{formData.images.length} uploaded</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500">Price</div>
                <div className="text-sm font-bold text-gray-800">{formData.sellingPrice || '0'} SAR</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="bg-orange-100 p-2 rounded-lg">
                <MapPin className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500">Cities</div>
                <div className="text-sm font-bold text-gray-800">{formData.availableCities.length} selected</div>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="border-b p-4 bg-gray-50">
              <div className="flex items-center space-x-2">
                <Info className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-800">Basic Information</h2>
              </div>
              <p className="text-xs text-gray-500 mt-1">Enter basic product details</p>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className={`w-full px-4 py-3 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter product name"
                  />
                  {errors.name && <p className="mt-2 text-sm text-red-500">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quick Category Selection (Optional)
                  </label>
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => handleCategorySelect(e.target.value)}
                    className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg"
                    disabled={loadingCategories}
                  >
                    <option value="">Select a category to auto-fill fields</option>
                    {loadingCategories ? (
                      <option value="">Loading categories...</option>
                    ) : categoryError ? (
                      <option value="">Error loading categories</option>
                    ) : categoryOptions.length > 0 ? (
                      categoryOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))
                    ) : (
                      <option value="">No categories available</option>
                    )}
                  </select>
                  {loadingCategories && (
                    <p className="text-xs text-gray-500 mt-2">Loading categories...</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Category Type *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => handleCategoryTypeChange('ready_made')}
                    className={`px-6 py-4 text-sm border-2 rounded-lg transition-all duration-200 flex flex-col items-center justify-center ${
                      formData.category_type === 'ready_made'
                        ? 'bg-green-50 border-green-500 text-green-700 shadow-md'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400 hover:shadow-sm'
                    }`}
                  >
                    <span className="text-2xl mb-2">📦</span>
                    <span className="font-medium">Ready Made</span>
                    <span className="text-xs mt-1">Pre-made products</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleCategoryTypeChange('customized')}
                    className={`px-6 py-4 text-sm border-2 rounded-lg transition-all duration-200 flex flex-col items-center justify-center ${
                      formData.category_type === 'customized'
                        ? 'bg-purple-50 border-purple-500 text-purple-700 shadow-md'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400 hover:shadow-sm'
                    }`}
                  >
                    <span className="text-2xl mb-2">✏️</span>
                    <span className="font-medium">Customized</span>
                    <span className="text-xs mt-1">Made-to-order products</span>
                  </button>
                </div>
                {errors.category_type && <p className="mt-2 text-sm text-red-500">{errors.category_type}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Usage Type *
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    type="button"
                    onClick={() => handleUsageTypeChange('indoor')}
                    className={`px-4 py-4 text-sm border-2 rounded-lg transition-all duration-200 flex flex-col items-center justify-center ${
                      formData.usage_type === 'indoor'
                        ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-md'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400 hover:shadow-sm'
                    }`}
                  >
                    <span className="text-2xl mb-2">🏠</span>
                    <span className="font-medium">Indoor</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleUsageTypeChange('outdoor')}
                    className={`px-4 py-4 text-sm border-2 rounded-lg transition-all duration-200 flex flex-col items-center justify-center ${
                      formData.usage_type === 'outdoor'
                        ? 'bg-orange-50 border-orange-500 text-orange-700 shadow-md'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400 hover:shadow-sm'
                    }`}
                  >
                    <span className="text-2xl mb-2">☀️</span>
                    <span className="font-medium">Outdoor</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleUsageTypeChange('both')}
                    className={`px-4 py-4 text-sm border-2 rounded-lg transition-all duration-200 flex flex-col items-center justify-center ${
                      formData.usage_type === 'both'
                        ? 'bg-purple-50 border-purple-500 text-purple-700 shadow-md'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400 hover:shadow-sm'
                    }`}
                  >
                    <span className="text-2xl mb-2">🔄</span>
                    <span className="font-medium">Both</span>
                  </button>
                </div>
                {errors.usage_type && <p className="mt-2 text-sm text-red-500">{errors.usage_type}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Type *
                </label>
                <select
                  name="product_type"
                  required
                  className={`w-full px-4 py-3 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.product_type ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={formData.product_type}
                  onChange={(e) => handleProductTypeChange(e.target.value)}
                  disabled={loadingCategories}
                >
                  <option value="">Select Product Type</option>
                  {loadingCategories ? (
                    <option value="">Loading...</option>
                  ) : getFilteredProductTypes().length > 0 ? (
                    getFilteredProductTypes().map(type => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ')}
                      </option>
                    ))
                  ) : (
                    <option value="">No types available for selected category</option>
                  )}
                </select>
                {errors.product_type && <p className="mt-2 text-sm text-red-500">{errors.product_type}</p>}
              </div>

              {formData.product_type && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Categories *
                  </label>
                  <div className={`border ${errors.product_categories ? 'border-red-500' : 'border-gray-300'} rounded-lg p-4`}>
                    {loadingCategories ? (
                      <div className="text-center py-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="text-xs text-gray-500 mt-1">Loading...</p>
                      </div>
                    ) : getFilteredProductCategories().length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {getFilteredProductCategories().map(category => (
                          <label key={category} className="flex items-center space-x-3 cursor-pointer p-3 hover:bg-gray-50 rounded-lg border border-gray-200">
                            <input
                              type="checkbox"
                              checked={formData.product_categories.includes(category)}
                              onChange={() => handleProductCategoryChange(category)}
                              className="rounded text-blue-500 focus:ring-blue-500 h-5 w-5"
                            />
                            <span className="text-sm text-gray-700">{category.replace('_', ' ')}</span>
                          </label>
                        ))}
                      </div>
                    ) : formData.product_type ? (
                      <p className="text-xs text-gray-500 text-center py-2">
                        No categories available for selected product type
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500 text-center py-2">
                        Select a product type first
                      </p>
                    )}
                  </div>
                  {errors.product_categories && <p className="mt-2 text-sm text-red-500">{errors.product_categories}</p>}
                  {formData.product_categories.length > 0 && (
                    <p className="text-sm text-gray-600 mt-3">
                      <span className="font-medium">Selected:</span>{' '}
                      {formData.product_categories.map(cat => cat.replace('_', ' ')).join(', ')}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Short Description *
                </label>
                <textarea
                  name="shortDescription"
                  required
                  rows={3}
                  className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.shortDescription}
                  onChange={handleInputChange}
                  placeholder="Brief description for product listings"
                  maxLength={150}
                />
                <div className="text-xs text-gray-500 mt-2">
                  {formData.shortDescription.length}/150 characters
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Description *
                </label>
                <textarea
                  name="description"
                  required
                  rows={5}
                  className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Detailed product description, features, benefits"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Section *
                </label>
                <select
                  name="displaySection"
                  required
                  className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.displaySection}
                  onChange={handleInputChange}
                >
                  <option value="">Select Display Section</option>
                  <option value="Featured">Featured Products</option>
                  <option value="New Arrivals">New Arrivals</option>
                  <option value="Best Sellers">Best Sellers</option>
                  <option value="Clearance">Clearance Sale</option>
                  <option value="Recommended">Recommended For You</option>
                </select>
              </div>

              {formData.category_type === 'customized' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Customization Time
                    </label>
                    <select
                      name="customizationTime"
                      className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg"
                      value={formData.customizationTime}
                      onChange={handleInputChange}
                    >
                      <option value="1-2 weeks">1-2 weeks</option>
                      <option value="2-3 weeks">2-3 weeks</option>
                      <option value="3-4 weeks">3-4 weeks</option>
                      <option value="1-2 months">1-2 months</option>
                      <option value="2-3 months">2-3 months</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Materials Used
                    </label>
                    <select
                      multiple
                      className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg"
                      value={formData.materialsUsed}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, option => option.value);
                        setFormData(prev => ({ ...prev, materialsUsed: selected }));
                      }}
                      size={4}
                    >
                      {materials.map(mat => (
                        <option key={mat} value={mat}>{mat}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-2">Hold Ctrl/Cmd to select multiple materials</p>
                  </div>
                </div>
              )}

              {selectedCategoryId && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-blue-700">Selected Category Info</h4>
                      <p className="text-sm text-blue-600 mt-1">
                        {categories.find(c => c.id === selectedCategoryId)?.display_name}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategoryId('');
                        setFormData(prev => ({
                          ...prev,
                          category_id: '',
                          category_name: '',
                          category_display_name: ''
                        }));
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Media */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="border-b p-4 bg-gray-50">
              <div className="flex items-center space-x-2">
                <ImageIcon className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-800">Media</h2>
              </div>
              <p className="text-xs text-gray-500 mt-1">Upload product images and videos</p>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Upload Images *
                  </label>
                  <span className="text-sm text-gray-500">
                    {formData.images.length}/{formData.category_type === 'customized' ? 5 : 10} images
                  </span>
                </div>
                
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors bg-gray-50"
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    Click to upload images
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    JPEG, PNG, or WebP (max 5MB each)
                  </p>
                  <p className="text-xs text-gray-400">
                    Minimum 3 images required. Main image will be used as product thumbnail.
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
                {errors.images && (
                  <p className="mt-2 text-sm text-red-500">{errors.images}</p>
                )}
              </div>

              {formData.images.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Main Image *
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                    {formData.images.map((imageId, index) => {
                      const imageUrl = getImageUrl(imageId);
                      return (
                        <div key={imageId} className="relative group">
                          <div
                            className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 ${
                              formData.mainImage === imageId ? 'border-blue-500 ring-4 ring-blue-100' : 'border-gray-200'
                            }`}
                            onClick={() => setAsMainImage(imageId)}
                          >
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={`Product ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                <ImageIcon className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                            {formData.mainImage === imageId && (
                              <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                                <Check className="w-6 h-6 text-white" />
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeImage(imageId)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          {formData.mainImage === imageId && (
                            <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                              Main
                            </div>
                          )}
                          <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                            {index + 1}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {errors.mainImage && (
                    <p className="mt-2 text-sm text-red-500">{errors.mainImage}</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Product Video (Optional)
                </label>
                
                {tempVideo ? (
                  <div className="relative rounded-lg overflow-hidden border border-gray-200">
                    <video
                      src={tempVideo}
                      controls
                      className="w-full"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setTempVideo('');
                        setFormData(prev => ({ ...prev, videoUrl: '' }));
                      }}
                      className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => videoInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors bg-gray-50"
                  >
                    <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-700 mb-2">
                      Click to upload video
                    </p>
                    <p className="text-sm text-gray-500">
                      MP4, WebM, or OGG (max 5MB)
                    </p>
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      className="hidden"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Specifications */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="border-b p-4 bg-gray-50">
              <div className="flex items-center space-x-2">
                <Ruler className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-800">Specifications</h2>
              </div>
              <p className="text-xs text-gray-500 mt-1">Set product dimensions, weight, and material details</p>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Dimensions
                </label>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <input
                      type="text"
                      className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg"
                      value={formData.dimensions.length}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        dimensions: { ...prev.dimensions, length: e.target.value }
                      }))}
                      placeholder="Length"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg"
                      value={formData.dimensions.width}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        dimensions: { ...prev.dimensions, width: e.target.value }
                      }))}
                      placeholder="Width"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg"
                      value={formData.dimensions.height}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        dimensions: { ...prev.dimensions, height: e.target.value }
                      }))}
                      placeholder="Height"
                    />
                  </div>
                  <div>
                    <select
                      className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg"
                      value={formData.dimensions.unit}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        dimensions: { ...prev.dimensions, unit: e.target.value }
                      }))}
                    >
                      <option value="cm">Centimeters (cm)</option>
                      <option value="m">Meters (m)</option>
                      <option value="inch">Inches</option>
                      <option value="ft">Feet (ft)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weight (kg)
                  </label>
                  <input
                    type="text"
                    name="weight"
                    className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg"
                    value={formData.weight}
                    onChange={handleInputChange}
                    placeholder="0.0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Material
                  </label>
                  <select
                    name="material"
                    className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg"
                    value={formData.material}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Material</option>
                    {materials.map(mat => (
                      <option key={mat} value={mat}>{mat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Finish Type
                  </label>
                  <select
                    name="finishType"
                    className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg"
                    value={formData.finishType}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Finish Type</option>
                    {finishTypes.map(finish => (
                      <option key={finish} value={finish}>{finish}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Color
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="color"
                      className="w-12 h-12 cursor-pointer rounded-lg border border-gray-300"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">{formData.primaryColor}</span>
                      <p className="text-xs text-gray-500 mt-1">Click to select color</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Warranty Type
                  </label>
                  <select
                    name="warrantyType"
                    className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg"
                    value={formData.warrantyType}
                    onChange={handleInputChange}
                  >
                    {warrantyTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Warranty Duration
                  </label>
                  <select
                    name="warrantyDuration"
                    className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg"
                    value={formData.warrantyDuration}
                    onChange={handleInputChange}
                  >
                    {warrantyDurations.map(duration => (
                      <option key={duration} value={duration}>{duration}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Variants */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="border-b p-4 bg-gray-50">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-800">Variants</h2>
              </div>
              <p className="text-xs text-gray-500 mt-1">Configure product variants like size, color, material</p>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.hasVariants}
                    onChange={(e) => setFormData(prev => ({ ...prev, hasVariants: e.target.checked }))}
                    className="h-5 w-5 text-blue-500 rounded"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">This product has variants</span>
                    <p className="text-xs text-gray-500 mt-1">Enable to add different sizes, colors, or materials</p>
                  </div>
                </div>
                
                {formData.hasVariants && (
                  <button
                    type="button"
                    onClick={addVariant}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Variant</span>
                  </button>
                )}
              </div>

              {formData.hasVariants && formData.variants.length > 0 && (
                <div className="space-y-4">
                  {formData.variants.map((variant, index) => (
                    <div key={variant.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-medium">
                            Variant #{index + 1}
                          </div>
                          <span className="text-sm text-gray-500">ID: {variant.sku}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeVariant(variant.id)}
                          className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-2">Type</label>
                          <select
                            value={variant.type}
                            onChange={(e) => updateVariant(variant.id, 'type', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                          >
                            <option value="">Select Type</option>
                            <option value="Color">Color</option>
                            <option value="Size">Size</option>
                            <option value="Material">Material</option>
                            <option value="Style">Style</option>
                            <option value="Pattern">Pattern</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-2">Option</label>
                          <input
                            type="text"
                            value={variant.option}
                            onChange={(e) => updateVariant(variant.id, 'option', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                            placeholder="e.g., Red, Large, Leather"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-2">Price (SAR)</label>
                          <input
                            type="text"
                            value={variant.price}
                            onChange={(e) => updateVariant(variant.id, 'price', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                            placeholder="0.00"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-2">Stock</label>
                          <input
                            type="number"
                            value={variant.stock}
                            onChange={(e) => updateVariant(variant.id, 'stock', parseInt(e.target.value))}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                            min="0"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-2">SKU</label>
                          <input
                            type="text"
                            value={variant.sku}
                            onChange={(e) => updateVariant(variant.id, 'sku', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                            placeholder="Variant SKU"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-2">Barcode</label>
                          <input
                            type="text"
                            value={variant.barcode || ''}
                            onChange={(e) => updateVariant(variant.id, 'barcode', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                            placeholder="Optional barcode"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {formData.hasVariants && formData.variants.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-700 mb-2">No variants added</p>
                  <p className="text-sm text-gray-500 mb-4">Add different product variations like sizes, colors, or materials</p>
                  <button
                    type="button"
                    onClick={addVariant}
                    className="px-6 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    <Plus className="w-4 h-4 inline mr-2" />
                    Add Your First Variant
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Pricing & Inventory */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="border-b p-4 bg-gray-50">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-800">Pricing & Inventory</h2>
              </div>
              <p className="text-xs text-gray-500 mt-1">Set pricing, stock, and product identification</p>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selling Price (SAR) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">SAR</span>
                    <input
                      type="text"
                      name="sellingPrice"
                      required
                      className={`w-full pl-12 pr-4 py-3 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.sellingPrice ? 'border-red-500' : 'border-gray-300'
                      }`}
                      value={formData.sellingPrice}
                      onChange={handleInputChange}
                      placeholder="0.00"
                    />
                  </div>
                  {errors.sellingPrice && <p className="mt-2 text-sm text-red-500">{errors.sellingPrice}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discounted Price (SAR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">SAR</span>
                    <input
                      type="text"
                      name="discountedPrice"
                      className="w-full pl-12 pr-4 py-3 text-sm border border-gray-300 rounded-lg"
                      value={formData.discountedPrice}
                      onChange={handleInputChange}
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Leave empty if no discount</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    name="stockQuantity"
                    required
                    min="0"
                    className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg"
                    value={formData.stockQuantity}
                    onChange={handleInputChange}
                  />
                  <p className="text-xs text-gray-500 mt-2">Total available units</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SKU Code *
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="text"
                      name="skuCode"
                      required
                      className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg"
                      value={formData.skuCode}
                      onChange={handleInputChange}
                      placeholder="e.g., PROD-001"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        skuCode: `SKU${Date.now().toString().slice(-6)}`
                      }))}
                      className="px-4 py-3 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium whitespace-nowrap"
                    >
                      Generate SKU
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Unique product identifier</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Barcode (Optional)
                </label>
                <input
                  type="text"
                  name="barcode"
                  className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg"
                  value={formData.barcode}
                  onChange={handleInputChange}
                  placeholder="Enter barcode number"
                />
                <p className="text-xs text-gray-500 mt-2">Used for inventory management</p>
              </div>

              {formData.discountedPrice && parseFloat(formData.discountedPrice) < parseFloat(formData.sellingPrice) && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Price Summary</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <div>
                          <span className="text-xs text-gray-500">Original Price:</span>
                          <p className="text-sm text-gray-500 line-through">{formData.sellingPrice} SAR</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Discounted Price:</span>
                          <p className="text-lg font-bold text-green-600">{formData.discountedPrice} SAR</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm font-bold">
                      {Math.round((1 - parseFloat(formData.discountedPrice) / parseFloat(formData.sellingPrice)) * 100)}% OFF
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Delivery & Shipping */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="border-b p-4 bg-gray-50">
              <div className="flex items-center space-x-2">
                <Truck className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-800">Delivery & Shipping</h2>
              </div>
              <p className="text-xs text-gray-500 mt-1">Configure delivery options and shipping details</p>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Available Cities in Saudi Arabia
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {saudiCities.map(city => {
                    const isSelected = formData.availableCities.some(c => c.city === city);
                    return (
                      <button
                        key={city}
                        type="button"
                        onClick={() => toggleCityDelivery(city)}
                        className={`px-4 py-3 text-sm rounded-lg border-2 transition-all duration-200 ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {city}
                        {isSelected && (
                          <Check className="w-4 h-4 inline ml-2" />
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-3">Select cities where this product is available for delivery</p>
              </div>

              {formData.availableCities.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-700">City Delivery Details</h4>
                  {formData.availableCities.map((city) => (
                    <div key={city.city} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-medium">
                            {city.city}
                          </div>
                          <div className="flex items-center space-x-4">
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={city.available}
                                onChange={(e) => updateCityDelivery(city.city, 'available', e.target.checked)}
                                className="h-4 w-4 text-blue-500 rounded"
                              />
                              <span className="text-sm text-gray-600">Available</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={city.freeDelivery}
                                onChange={(e) => updateCityDelivery(city.city, 'freeDelivery', e.target.checked)}
                                className="h-4 w-4 text-blue-500 rounded"
                              />
                              <span className="text-sm text-gray-600">Free Delivery</span>
                            </label>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-2">Cost (SAR)</label>
                          <input
                            type="text"
                            value={city.deliveryCost}
                            onChange={(e) => updateCityDelivery(city.city, 'deliveryCost', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                            disabled={city.freeDelivery}
                            placeholder="0.00"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-2">Delivery Time</label>
                          <input
                            type="text"
                            value={city.deliveryTime}
                            onChange={(e) => updateCityDelivery(city.city, 'deliveryTime', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                            placeholder="e.g., 3-5 days"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-2">Shipping Company</label>
                          <select
                            value={city.shippingCompany || ''}
                            onChange={(e) => updateCityDelivery(city.city, 'shippingCompany', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                          >
                            <option value="">Select Company</option>
                            {shippingCompanies.map(company => (
                              <option key={company} value={company}>{company}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Home className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">Within City Delivery</span>
                    </div>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.shippingOptions.withinCity.available}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          shippingOptions: {
                            ...prev.shippingOptions,
                            withinCity: {
                              ...prev.shippingOptions.withinCity,
                              available: e.target.checked
                            }
                          }
                        }))}
                        className="h-4 w-4 text-blue-500 rounded"
                      />
                      <span className="text-sm text-gray-600">Available</span>
                    </label>
                  </div>
                  {formData.shippingOptions.withinCity.available && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-2">Cost (SAR)</label>
                        <input
                          type="text"
                          value={formData.shippingOptions.withinCity.cost}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            shippingOptions: {
                              ...prev.shippingOptions,
                              withinCity: {
                                ...prev.shippingOptions.withinCity,
                                cost: e.target.value
                              }
                            }
                          }))}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-2">Delivery Time</label>
                        <input
                          type="text"
                          value={formData.shippingOptions.withinCity.time}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            shippingOptions: {
                              ...prev.shippingOptions,
                              withinCity: {
                                ...prev.shippingOptions.withinCity,
                                time: e.target.value
                              }
                            }
                          }))}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                          placeholder="e.g., 1-2 days"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <TruckIcon className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">Outside City Delivery</span>
                    </div>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.shippingOptions.outsideCity.available}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          shippingOptions: {
                            ...prev.shippingOptions,
                            outsideCity: {
                              ...prev.shippingOptions.outsideCity,
                              available: e.target.checked
                            }
                          }
                        }))}
                        className="h-4 w-4 text-blue-500 rounded"
                      />
                      <span className="text-sm text-gray-600">Available</span>
                    </label>
                  </div>
                  {formData.shippingOptions.outsideCity.available && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-2">Cost (SAR)</label>
                        <input
                          type="text"
                          value={formData.shippingOptions.outsideCity.cost}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            shippingOptions: {
                              ...prev.shippingOptions,
                              outsideCity: {
                                ...prev.shippingOptions.outsideCity,
                                cost: e.target.value
                              }
                            }
                          }))}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-2">Delivery Time</label>
                        <input
                          type="text"
                          value={formData.shippingOptions.outsideCity.time}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            shippingOptions: {
                              ...prev.shippingOptions,
                              outsideCity: {
                                ...prev.shippingOptions.outsideCity,
                                time: e.target.value
                              }
                            }
                          }))}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                          placeholder="e.g., 3-5 days"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Settings className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Installation Service</span>
                  </div>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.installationAvailable}
                      onChange={(e) => setFormData(prev => ({ ...prev, installationAvailable: e.target.checked }))}
                      className="h-4 w-4 text-blue-500 rounded"
                    />
                    <span className="text-sm text-gray-600">Available</span>
                  </label>
                </div>
                {formData.installationAvailable && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Installation Fee (SAR)</label>
                    <input
                      type="text"
                      value={formData.installationFee}
                      onChange={(e) => setFormData(prev => ({ ...prev, installationFee: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                      placeholder="0.00"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Policies & Warranty */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="border-b p-4 bg-gray-50">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-800">Policies & Warranty</h2>
              </div>
              <p className="text-xs text-gray-500 mt-1">Set return policies and warranty details</p>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Return Policy</p>
                    <p className="text-xs text-gray-500 mt-1">Configure return and refund policies</p>
                  </div>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.returnPolicy.allowed}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        returnPolicy: {
                          ...prev.returnPolicy,
                          allowed: e.target.checked
                        }
                      }))}
                      className="h-5 w-5 text-blue-500 rounded"
                    />
                    <span className="text-sm font-medium text-gray-600">Returns Allowed</span>
                  </label>
                </div>

                {formData.returnPolicy.allowed && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 border border-gray-200 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Return Period</label>
                      <select
                        value={formData.returnPolicy.period}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          returnPolicy: {
                            ...prev.returnPolicy,
                            period: e.target.value
                          }
                        }))}
                        className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg"
                      >
                        <option value="7 days">7 days</option>
                        <option value="14 days">14 days</option>
                        <option value="30 days">30 days</option>
                        <option value="60 days">60 days</option>
                        <option value="90 days">90 days</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Return Fee (SAR)</label>
                      <input
                        type="text"
                        value={formData.returnPolicy.fee}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          returnPolicy: {
                            ...prev.returnPolicy,
                            fee: e.target.value
                          }
                        }))}
                        className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg"
                        placeholder="0.00"
                      />
                      <p className="text-xs text-gray-500 mt-2">Fee charged for returns</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Return Conditions</label>
                      <div className="space-y-2">
                        {formData.returnPolicy.conditions.map((condition, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                            <span className="text-sm truncate">{condition}</span>
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({
                                ...prev,
                                returnPolicy: {
                                  ...prev.returnPolicy,
                                  conditions: prev.returnPolicy.conditions.filter((_, i) => i !== index)
                                }
                              }))}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const newCondition = prompt('Enter a new return condition:');
                            if (newCondition && newCondition.trim()) {
                              setFormData(prev => ({
                                ...prev,
                                returnPolicy: {
                                  ...prev.returnPolicy,
                                  conditions: [...prev.returnPolicy.conditions, newCondition.trim()]
                                }
                              }));
                            }
                          }}
                          className="w-full py-3 text-sm border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 text-gray-500 hover:text-blue-500 font-medium"
                        >
                          <Plus className="w-4 h-4 inline mr-2" />
                          Add Condition
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Shield className="w-6 h-6 text-blue-600" />
                  <span className="text-lg font-semibold text-blue-700">Warranty Details</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg p-4 border border-blue-100">
                    <p className="text-sm font-medium text-gray-600 mb-2">Warranty Type</p>
                    <p className="text-lg font-bold text-blue-600">{formData.warrantyType}</p>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-blue-100">
                    <p className="text-sm font-medium text-gray-600 mb-2">Warranty Duration</p>
                    <p className="text-lg font-bold text-blue-600">{formData.warrantyDuration}</p>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                  <p className="text-sm text-blue-700">
                    Warranty coverage ensures customer satisfaction and builds trust in your products.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
                <div className="text-center md:text-left">
                  <p className="text-sm font-medium text-gray-700">Ready to submit your product?</p>
                  <p className="text-xs text-gray-500 mt-1">Review all information before submitting</p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3">
                  <button
                    type="button"
                    onClick={saveAsDraft}
                    className="px-6 py-3 text-sm border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium w-full sm:w-auto"
                  >
                    Save as Draft
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 text-sm bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 font-medium shadow-lg w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Add Product to Marketplace</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;