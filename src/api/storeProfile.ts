// src/api/storeProfile.ts
import { supabase } from '@/lib/supabase';
import { PostgrestResponse } from '@supabase/supabase-js';

// ============================================================================
// INTERFACES
// ============================================================================

export interface StoreProfile {
  id: string;
  seller_id: string;
  name: string;
  description: string;
  tagline: string;
  category: string;
  subcategory: string;
  logo_url: string | null;
  banner_url: string | null;
  contact_email: string;
  contact_phone: string;
  website: string | null;
  location: {
    city: string;
    country: string;
    address: string | null;
  };
  business_hours: BusinessHours[];
  social_links: SocialLinks;
  store_policies: StorePolicies;
  features: StoreFeatures;
  status: 'active' | 'inactive' | 'pending_verification' | 'suspended';
  verification_status: 'verified' | 'pending' | 'unverified';
  rating: number;
  total_orders: number;
  total_reviews: number;
  established_date: string | null;
  vat_number: string | null;
  commercial_registration: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface BusinessHours {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  open: string; // HH:MM format
  close: string; // HH:MM format
  is_closed: boolean;
}

export interface SocialLinks {
  facebook: string | null;
  instagram: string | null;
  twitter: string | null;
  linkedin: string | null;
  youtube: string | null;
  tiktok: string | null;
  pinterest: string | null;
}

export interface StorePolicies {
  shipping_policy: string;
  return_policy: string;
  refund_policy: string;
  privacy_policy: string;
  terms_of_service: string;
}

export interface StoreFeatures {
  accepts_custom_orders: boolean;
  offers_wholesale: boolean;
  provides_installation: boolean;
  offers_warranty: boolean;
  has_physical_store: boolean;
  delivery_enabled: boolean;
  pickup_enabled: boolean;
  international_shipping: boolean;
  same_day_delivery: boolean;
}

export interface StoreProfileInput {
  name?: string;
  description?: string;
  tagline?: string;
  category?: string;
  subcategory?: string;
  contact_email?: string;
  contact_phone?: string;
  website?: string | null;
  location?: {
    city?: string;
    country?: string;
    address?: string | null;
  };
  business_hours?: BusinessHours[];
  social_links?: Partial<SocialLinks>;
  store_policies?: Partial<StorePolicies>;
  features?: Partial<StoreFeatures>;
  vat_number?: string | null;
  commercial_registration?: string | null;
  established_date?: string | null;
}

export interface UploadAssetResponse {
  url: string;
  path: string;
  size: number;
  mimetype: string;
}

export interface StoreStats {
  total_products: number;
  active_products: number;
  total_orders: number;
  total_revenue: number;
  average_rating: number;
  response_rate: number;
  fulfillment_rate: number;
  customer_count: number;
  repeat_customer_rate: number;
}

export interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_BUCKET = 'store-assets';
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const MAX_LOGO_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_BANNER_SIZE = 10 * 1024 * 1024; // 10MB

const DEFAULT_STORE_POLICIES: StorePolicies = {
  shipping_policy: 'Standard shipping within 3-5 business days. Express shipping available.',
  return_policy: '30-day return policy for unused items in original packaging.',
  refund_policy: 'Full refund for defective items. Restocking fee may apply for returns.',
  privacy_policy: 'We respect your privacy and protect your personal information.',
  terms_of_service: 'By purchasing from our store, you agree to our terms and conditions.',
};

const DEFAULT_BUSINESS_HOURS: BusinessHours[] = [
  { day: 'sunday', open: '09:00', close: '18:00', is_closed: false },
  { day: 'monday', open: '09:00', close: '18:00', is_closed: false },
  { day: 'tuesday', open: '09:00', close: '18:00', is_closed: false },
  { day: 'wednesday', open: '09:00', close: '18:00', is_closed: false },
  { day: 'thursday', open: '09:00', close: '18:00', is_closed: false },
  { day: 'friday', open: '09:00', close: '18:00', is_closed: true },
  { day: 'saturday', open: '10:00', close: '16:00', is_closed: false },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const handleSupabaseError = (error: any): Error => {
  console.error('Supabase store profile error:', error);
  return new Error(error.message || 'Store profile operation failed');
};

const validateSellerId = (sellerId: string): void => {
  if (!sellerId || typeof sellerId !== 'string') {
    throw new Error('Invalid seller ID');
  }
};

const validateFile = (file: File, type: 'logo' | 'banner'): void => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(`Invalid file type. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`);
  }

  const maxSize = type === 'logo' ? MAX_LOGO_SIZE : MAX_BANNER_SIZE;
  if (file.size > maxSize) {
    throw new Error(`File too large. Max size: ${maxSize / 1024 / 1024}MB`);
  }
};

const generateFileName = (sellerId: string, type: 'logo' | 'banner', file: File): string => {
  const timestamp = Date.now();
  const extension = file.name.split('.').pop();
  return `${sellerId}/${type}-${timestamp}.${extension}`;
};

// ============================================================================
// MAIN API FUNCTIONS
// ============================================================================

/**
 * Fetch the seller's complete store profile with all details
 */
export const getStoreProfile = async (sellerId: string): Promise<ApiResponse<StoreProfile>> => {
  try {
    validateSellerId(sellerId);

    const { data, error } = await supabase
      .from('store_profiles')
      .select(`
        *,
        sellers!inner (
          business_name,
          vat_number,
          commercial_registration,
          established_date
        )
      `)
      .eq('seller_id', sellerId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Profile doesn't exist, create default
        return await createDefaultProfile(sellerId);
      }
      throw error;
    }

    // Transform data to match our interface
    const profile: StoreProfile = {
      id: data.id,
      seller_id: data.seller_id,
      name: data.name || data.sellers?.business_name || '',
      description: data.description || '',
      tagline: data.tagline || '',
      category: data.category || 'furniture',
      subcategory: data.subcategory || '',
      logo_url: data.logo_url,
      banner_url: data.banner_url,
      contact_email: data.contact_email || '',
      contact_phone: data.contact_phone || '',
      website: data.website,
      location: data.location || { city: '', country: 'Saudi Arabia', address: null },
      business_hours: data.business_hours || DEFAULT_BUSINESS_HOURS,
      social_links: data.social_links || {},
      store_policies: { ...DEFAULT_STORE_POLICIES, ...data.store_policies },
      features: data.features || {
        accepts_custom_orders: true,
        offers_wholesale: false,
        provides_installation: true,
        offers_warranty: true,
        has_physical_store: false,
        delivery_enabled: true,
        pickup_enabled: false,
        international_shipping: false,
        same_day_delivery: false,
      },
      status: data.status || 'pending_verification',
      verification_status: data.verification_status || 'unverified',
      rating: data.rating || 0,
      total_orders: data.total_orders || 0,
      total_reviews: data.total_reviews || 0,
      established_date: data.sellers?.established_date || null,
      vat_number: data.sellers?.vat_number || null,
      commercial_registration: data.sellers?.commercial_registration || null,
      metadata: data.metadata || {},
      created_at: data.created_at,
      updated_at: data.updated_at,
    };

    return { data: profile, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

/**
 * Create default store profile for new sellers
 */
const createDefaultProfile = async (sellerId: string): Promise<ApiResponse<StoreProfile>> => {
  try {
    // Get seller basic info
    const { data: seller, error: sellerError } = await supabase
      .from('sellers')
      .select('business_name, vat_number, commercial_registration, established_date')
      .eq('user_id', sellerId)
      .single();

    if (sellerError) {
      throw sellerError;
    }

    const defaultProfile = {
      seller_id: sellerId,
      name: seller.business_name || 'My Store',
      description: 'Welcome to our store! We offer quality products with excellent service.',
      tagline: 'Quality furniture for your home',
      category: 'furniture',
      subcategory: 'home-furniture',
      contact_email: '',
      contact_phone: '',
      location: { city: 'Riyadh', country: 'Saudi Arabia', address: null },
      business_hours: DEFAULT_BUSINESS_HOURS,
      social_links: {},
      store_policies: DEFAULT_STORE_POLICIES,
      features: {
        accepts_custom_orders: true,
        offers_wholesale: false,
        provides_installation: true,
        offers_warranty: true,
        has_physical_store: false,
        delivery_enabled: true,
        pickup_enabled: false,
        international_shipping: false,
        same_day_delivery: false,
      },
      status: 'pending_verification',
      verification_status: 'unverified',
      rating: 0,
      total_orders: 0,
      total_reviews: 0,
      metadata: {},
    };

    const { data, error } = await supabase
      .from('store_profiles')
      .insert(defaultProfile)
      .select()
      .single();

    if (error) {
      throw error;
    }

    const profile: StoreProfile = {
      ...data,
      seller_id: sellerId,
      name: data.name,
      description: data.description,
      tagline: data.tagline,
      category: data.category,
      subcategory: data.subcategory,
      logo_url: data.logo_url,
      banner_url: data.banner_url,
      contact_email: data.contact_email,
      contact_phone: data.contact_phone,
      website: data.website,
      location: data.location,
      business_hours: data.business_hours,
      social_links: data.social_links,
      store_policies: data.store_policies,
      features: data.features,
      status: data.status,
      verification_status: data.verification_status,
      rating: data.rating,
      total_orders: data.total_orders,
      total_reviews: data.total_reviews,
      established_date: seller.established_date,
      vat_number: seller.vat_number,
      commercial_registration: seller.commercial_registration,
      metadata: data.metadata,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };

    return { data: profile, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

/**
 * Update store profile details
 */
export const updateStoreProfile = async (
  sellerId: string,
  profileData: StoreProfileInput
): Promise<ApiResponse<StoreProfile>> => {
  try {
    validateSellerId(sellerId);

    // Prepare update data
    const updateData: any = {
      ...profileData,
      updated_at: new Date().toISOString(),
    };

    // Handle nested updates separately
    if (profileData.location) {
      updateData.location = profileData.location;
    }
    if (profileData.business_hours) {
      updateData.business_hours = profileData.business_hours;
    }
    if (profileData.social_links) {
      updateData.social_links = profileData.social_links;
    }
    if (profileData.store_policies) {
      updateData.store_policies = profileData.store_policies;
    }
    if (profileData.features) {
      updateData.features = profileData.features;
    }

    // Update store profile
    const { data, error } = await supabase
      .from('store_profiles')
      .update(updateData)
      .eq('seller_id', sellerId)
      .select(`
        *,
        sellers!inner (
          business_name,
          vat_number,
          commercial_registration,
          established_date
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    // Transform response
    const profile: StoreProfile = {
      id: data.id,
      seller_id: data.seller_id,
      name: data.name || data.sellers?.business_name || '',
      description: data.description || '',
      tagline: data.tagline || '',
      category: data.category || 'furniture',
      subcategory: data.subcategory || '',
      logo_url: data.logo_url,
      banner_url: data.banner_url,
      contact_email: data.contact_email || '',
      contact_phone: data.contact_phone || '',
      website: data.website,
      location: data.location || { city: '', country: 'Saudi Arabia', address: null },
      business_hours: data.business_hours || DEFAULT_BUSINESS_HOURS,
      social_links: data.social_links || {},
      store_policies: { ...DEFAULT_STORE_POLICIES, ...data.store_policies },
      features: data.features || {
        accepts_custom_orders: true,
        offers_wholesale: false,
        provides_installation: true,
        offers_warranty: true,
        has_physical_store: false,
        delivery_enabled: true,
        pickup_enabled: false,
        international_shipping: false,
        same_day_delivery: false,
      },
      status: data.status || 'pending_verification',
      verification_status: data.verification_status || 'unverified',
      rating: data.rating || 0,
      total_orders: data.total_orders || 0,
      total_reviews: data.total_reviews || 0,
      established_date: data.sellers?.established_date || null,
      vat_number: data.sellers?.vat_number || null,
      commercial_registration: data.sellers?.commercial_registration || null,
      metadata: data.metadata || {},
      created_at: data.created_at,
      updated_at: data.updated_at,
    };

    return { data: profile, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

/**
 * Upload store logo or banner to Supabase Storage
 */
export const uploadStoreAsset = async (
  sellerId: string,
  file: File,
  type: 'logo' | 'banner'
): Promise<ApiResponse<UploadAssetResponse>> => {
  try {
    validateSellerId(sellerId);
    validateFile(file, type);

    const fileName = generateFileName(sellerId, type, file);
    const filePath = `${type}s/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    const url = publicUrlData.publicUrl;

    // Update profile with new asset URL
    const updateField = type === 'logo' ? 'logo_url' : 'banner_url';
    await supabase
      .from('store_profiles')
      .update({
        [updateField]: url,
        updated_at: new Date().toISOString(),
      })
      .eq('seller_id', sellerId);

    return {
      data: {
        url,
        path: filePath,
        size: file.size,
        mimetype: file.type,
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

/**
 * Toggle store status (active/inactive)
 */
export const toggleStoreStatus = async (
  sellerId: string,
  isActive: boolean
): Promise<ApiResponse<{ status: StoreProfile['status']; is_active: boolean }>> => {
  try {
    validateSellerId(sellerId);

    const status = isActive ? 'active' : 'inactive';

    const { data, error } = await supabase
      .from('store_profiles')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('seller_id', sellerId)
      .select('status')
      .single();

    if (error) {
      throw error;
    }

    return {
      data: {
        status: data.status,
        is_active: data.status === 'active',
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

/**
 * Get store statistics and performance metrics
 */
export const getStoreStats = async (sellerId: string): Promise<ApiResponse<StoreStats>> => {
  try {
    validateSellerId(sellerId);

    // Get product counts
    const { count: totalProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', sellerId);

    const { count: activeProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', sellerId)
      .eq('status', 'active');

    // Get order stats
    const { data: orders } = await supabase
      .from('orders')
      .select('total_amount, status')
      .eq('seller_id', sellerId);

    const totalOrders = orders?.length || 0;
    const totalRevenue = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

    // Get rating stats
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('seller_id', sellerId);

    const averageRating = reviews?.length
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

    // Get customer stats
    const { data: customers } = await supabase
      .from('orders')
      .select('buyer_id')
      .eq('seller_id', sellerId);

    const uniqueCustomers = new Set(customers?.map(c => c.buyer_id).filter(Boolean)).size;

    const stats: StoreStats = {
      total_products: totalProducts || 0,
      active_products: activeProducts || 0,
      total_orders,
      total_revenue,
      average_rating: parseFloat(averageRating.toFixed(1)),
      response_rate: 92, // Placeholder - would need message data
      fulfillment_rate: 95, // Placeholder - would need detailed order tracking
      customer_count: uniqueCustomers,
      repeat_customer_rate: uniqueCustomers > 0
        ? Math.round((totalOrders / uniqueCustomers) * 10) / 10
        : 0,
    };

    return { data: stats, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

/**
 * Update store verification documents
 */
export const updateVerificationDocuments = async (
  sellerId: string,
  documents: {
    vat_number?: string | null;
    commercial_registration?: string | null;
    id_document_url?: string | null;
    trade_license_url?: string | null;
  }
): Promise<ApiResponse<{ verification_status: StoreProfile['verification_status'] }>> => {
  try {
    validateSellerId(sellerId);

    // Update seller table with business documents
    const { error: sellerError } = await supabase
      .from('sellers')
      .update({
        vat_number: documents.vat_number,
        commercial_registration: documents.commercial_registration,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', sellerId);

    if (sellerError) {
      throw sellerError;
    }

    // Update store profile verification status
    const { data, error } = await supabase
      .from('store_profiles')
      .update({
        verification_status: 'pending',
        metadata: {
          ...documents,
          verification_requested_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('seller_id', sellerId)
      .select('verification_status')
      .single();

    if (error) {
      throw error;
    }

    return {
      data: {
        verification_status: data.verification_status,
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error) };
  }
};

// ============================================================================
// HELPER FUNCTIONS FOR UI INTEGRATION
// ============================================================================

/**
 * Format business hours for display
 */
export const formatBusinessHours = (hours: BusinessHours[]): string => {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const todayHours = hours.find(h => h.day === today);
  
  if (!todayHours || todayHours.is_closed) {
    return 'Closed today';
  }
  
  return `Open today: ${todayHours.open} - ${todayHours.close}`;
};

/**
 * Get store status label for display
 */
export const getStoreStatusLabel = (status: StoreProfile['status']): string => {
  const labels: Record<StoreProfile['status'], string> = {
    active: 'Active',
    inactive: 'Inactive',
    pending_verification: 'Pending Verification',
    suspended: 'Suspended',
  };
  return labels[status] || status;
};

/**
 * Get store status color for UI
 */
export const getStoreStatusColor = (status: StoreProfile['status']): string => {
  const colors: Record<StoreProfile['status'], string> = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    pending_verification: 'bg-yellow-100 text-yellow-800',
    suspended: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

/**
 * Get verification status label for display
 */
export const getVerificationStatusLabel = (status: StoreProfile['verification_status']): string => {
  const labels: Record<StoreProfile['verification_status'], string> = {
    verified: 'Verified ✓',
    pending: 'Pending Review',
    unverified: 'Not Verified',
  };
  return labels[status] || status;
};

/**
 * Get verification status color for UI
 */
export const getVerificationStatusColor = (status: StoreProfile['verification_status']): string => {
  const colors: Record<StoreProfile['verification_status'], string> = {
    verified: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    unverified: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

// ============================================================================
// MOCK DATA FOR TESTING/DEMO
// ============================================================================

export const getMockStoreProfile = (sellerId: string = 'seller_123'): StoreProfile => ({
  id: 'profile_123',
  seller_id: sellerId,
  name: 'Premium Furniture Store',
  description: 'Welcome to Premium Furniture Store! We specialize in high-quality, handcrafted furniture for modern homes and offices. Our products are made with sustainable materials and designed for comfort and durability.',
  tagline: 'Quality Furniture for Modern Living',
  category: 'furniture',
  subcategory: 'home-office',
  logo_url: 'https://example.com/logo.jpg',
  banner_url: 'https://example.com/banner.jpg',
  contact_email: 'contact@premiumfurniture.com',
  contact_phone: '+966 55 123 4567',
  website: 'https://premiumfurniture.com',
  location: {
    city: 'Riyadh',
    country: 'Saudi Arabia',
    address: 'King Fahd Road, Al Olaya District',
  },
  business_hours: DEFAULT_BUSINESS_HOURS,
  social_links: {
    facebook: 'https://facebook.com/premiumfurniture',
    instagram: 'https://instagram.com/premiumfurniture',
    twitter: 'https://twitter.com/premiumfurniture',
    linkedin: null,
    youtube: null,
    tiktok: null,
    pinterest: null,
  },
  store_policies: DEFAULT_STORE_POLICIES,
  features: {
    accepts_custom_orders: true,
    offers_wholesale: true,
    provides_installation: true,
    offers_warranty: true,
    has_physical_store: true,
    delivery_enabled: true,
    pickup_enabled: true,
    international_shipping: false,
    same_day_delivery: true,
  },
  status: 'active',
  verification_status: 'verified',
  rating: 4.8,
  total_orders: 156,
  total_reviews: 42,
  established_date: '2020-01-15',
  vat_number: 'VAT123456789',
  commercial_registration: 'CR123456789',
  metadata: {
    featured: true,
    premium_seller: true,
    fast_shipper: true,
  },
  created_at: '2020-01-15T10:30:00Z',
  updated_at: '2024-01-15T14:45:00Z',
});

export const getMockStoreStats = (): StoreStats => ({
  total_products: 48,
  active_products: 45,
  total_orders: 156,
  total_revenue: 15500,
  average_rating: 4.8,
  response_rate: 92,
  fulfillment_rate: 95,
  customer_count: 42,
  repeat_customer_rate: 3.7,
});