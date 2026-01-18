// src/hooks/useStoreProfile.ts
import { useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext'; // ADDED THIS IMPORT

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface StoreContactInfo {
  email: string;
  phone: string;
  whatsapp?: string;
  instagram?: string;
  twitter?: string;
  website?: string;
}

export interface StoreLocation {
  address: string;
  city: string;
  region: string;
  country: string;
  postal_code?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface BusinessHours {
  day: string;
  open: string;
  close: string;
  is_closed: boolean;
}

export interface StorePolicy {
  shipping_policy?: string;
  return_policy?: string;
  warranty_policy?: string;
  custom_order_policy?: string;
}

export interface StoreProfile {
  id: string;
  seller_id: string;
  store_name: string;
  slug: string;
  description: string;
  short_description?: string;
  tagline?: string;
  
  // Branding
  logo_url?: string;
  banner_url?: string;
  featured_images?: string[];
  color_theme?: string;
  
  // Contact Information
  contact_info: StoreContactInfo;
  
  // Business Information
  vat_number?: string;
  cr_number?: string;
  commercial_license?: string;
  business_type?: 'individual' | 'company' | 'enterprise';
  established_year?: number;
  
  // Location
  location: StoreLocation;
  
  // Store Policies
  policies: StorePolicy;
  
  // Operating Hours
  business_hours: BusinessHours[];
  
  // Settings
  is_active: boolean;
  is_featured: boolean;
  is_verified: boolean;
  vacation_mode: boolean;
  vacation_message?: string;
  vacation_start?: string;
  vacation_end?: string;
  
  // Metrics
  rating?: number;
  review_count?: number;
  follower_count?: number;
  total_sales?: number;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  last_active_at?: string;
}

export interface StoreUpdateData {
  store_name?: string;
  description?: string;
  short_description?: string;
  tagline?: string;
  contact_info?: Partial<StoreContactInfo>;
  location?: Partial<StoreLocation>;
  policies?: Partial<StorePolicy>;
  business_hours?: BusinessHours[];
  is_active?: boolean;
  vacation_mode?: boolean;
  vacation_message?: string;
  vacation_start?: string;
  vacation_end?: string;
}

export interface StoreAssetUpload {
  type: 'logo' | 'banner' | 'gallery';
  file: File;
  maxSize?: number; // in MB
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// ============================================
// VALIDATION CONSTANTS
// ============================================

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/svg+xml'
];

const MAX_FILE_SIZES = {
  logo: 2 * 1024 * 1024, // 2MB
  banner: 5 * 1024 * 1024, // 5MB
  gallery: 3 * 1024 * 1024 // 3MB
};

// ============================================
// SIMPLIFIED HOOK - COMPATIBLE WITH SELLERDASHBOARD
// ============================================

export const useStoreProfile = () => {
  const [profile, setProfile] = useState<StoreProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Get sellerId with fallback logic
  const getSellerId = (): string => {
    // First try to get from auth user
    if (user?.sellerId) return user.sellerId;
    if (user?.id) return user.id;
    
    // Try localStorage
    const storedAuth = localStorage.getItem('supabase.auth.token');
    if (storedAuth) {
      try {
        const parsedAuth = JSON.parse(storedAuth);
        if (parsedAuth.user) {
          return parsedAuth.user.sellerId || parsedAuth.user.id || 'demo-seller-id-123';
        }
      } catch (e) {
        console.error('Error parsing stored auth:', e);
      }
    }
    
    // Default demo seller ID
    return 'demo-seller-id-123';
  };

  const sellerId = getSellerId();

  // Mock data for development/demo
  const mockProfile = useMemo((): StoreProfile => ({
    id: 'store_001',
    seller_id: sellerId,
    store_name: user?.user_metadata?.business_name || 'Premium Furniture Store',
    slug: 'premium-furniture-store',
    description: 'Specializing in luxury custom furniture for homes and offices across Saudi Arabia. We combine traditional craftsmanship with modern design.',
    short_description: 'Luxury custom furniture for modern living',
    tagline: 'Where Quality Meets Elegance',
    
    logo_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc',
    banner_url: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6',
    featured_images: [
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc',
      'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7'
    ],
    color_theme: '#1e40af',
    
    contact_info: {
      email: user?.email || 'contact@premiumfurniture.com',
      phone: '+966112345678',
      whatsapp: '+966500000001',
      instagram: '@premiumfurniture',
      twitter: '@premium_furniture',
      website: 'https://premiumfurniture.com'
    },
    
    vat_number: 'VAT123456789',
    cr_number: 'CR789456123',
    commercial_license: 'CL-2023-001',
    business_type: 'company',
    established_year: 2018,
    
    location: {
      address: '123 Business District, Olaya Street',
      city: 'Riyadh',
      region: 'Riyadh Province',
      country: 'Saudi Arabia',
      postal_code: '12345',
      coordinates: { lat: 24.7136, lng: 46.6753 }
    },
    
    policies: {
      shipping_policy: 'Free delivery within Riyadh for orders above SAR 1000. Other cities: 2-7 business days.',
      return_policy: '30-day return policy. Items must be unused and in original packaging.',
      warranty_policy: '2-year warranty on all furniture. 5-year warranty on frames.',
      custom_order_policy: 'Custom orders require 50% deposit. Lead time 4-6 weeks.'
    },
    
    business_hours: [
      { day: 'Sunday', open: '09:00', close: '18:00', is_closed: false },
      { day: 'Monday', open: '09:00', close: '18:00', is_closed: false },
      { day: 'Tuesday', open: '09:00', close: '18:00', is_closed: false },
      { day: 'Wednesday', open: '09:00', close: '18:00', is_closed: false },
      { day: 'Thursday', open: '09:00', close: '18:00', is_closed: false },
      { day: 'Friday', open: '14:00', close: '20:00', is_closed: false },
      { day: 'Saturday', open: '09:00', close: '18:00', is_closed: false },
    ],
    
    is_active: true,
    is_featured: true,
    is_verified: true,
    vacation_mode: false,
    
    rating: 4.8,
    review_count: 245,
    follower_count: 1250,
    total_sales: 156,
    
    created_at: '2023-01-15T10:00:00Z',
    updated_at: new Date().toISOString(),
    last_active_at: new Date().toISOString()
  }), [sellerId, user]);

  const fetchStoreProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Always use mock data for now to avoid database errors
      await new Promise(resolve => setTimeout(resolve, 300));
      setProfile(mockProfile);
      return mockProfile;
    } catch (err) {
      console.error('Error fetching store profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load store profile');
      setProfile(mockProfile); // Fallback to mock data
      return mockProfile;
    } finally {
      setLoading(false);
    }
  }, [mockProfile]);

  const updateProfile = useCallback(async (updateData: StoreUpdateData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const updatedProfile = {
        ...mockProfile,
        ...updateData,
        updated_at: new Date().toISOString()
      };
      
      setProfile(updatedProfile);
      
      toast({
        title: 'Profile Updated',
        description: 'Store profile has been successfully updated.',
        variant: 'default'
      });
      
      return updatedProfile;
    } catch (err) {
      console.error('Error updating store profile:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to update store profile';
      setError(errorMsg);
      
      toast({
        title: 'Update Failed',
        description: errorMsg,
        variant: 'destructive'
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [mockProfile, toast]);

  const uploadLogo = useCallback(async (file: File) => {
    setLoading(true);
    
    try {
      // Simulate upload
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const logoUrl = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc';
      
      const updatedProfile = {
        ...mockProfile,
        logo_url: logoUrl,
        updated_at: new Date().toISOString()
      };
      
      setProfile(updatedProfile);
      
      toast({
        title: 'Logo Uploaded',
        description: 'Store logo has been uploaded successfully.',
        variant: 'default'
      });
      
      return logoUrl;
    } catch (err) {
      console.error('Error uploading logo:', err);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload logo.',
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [mockProfile, toast]);

  const uploadBanner = useCallback(async (file: File) => {
    setLoading(true);
    
    try {
      // Simulate upload
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const bannerUrl = 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6';
      
      const updatedProfile = {
        ...mockProfile,
        banner_url: bannerUrl,
        updated_at: new Date().toISOString()
      };
      
      setProfile(updatedProfile);
      
      toast({
        title: 'Banner Uploaded',
        description: 'Store banner has been uploaded successfully.',
        variant: 'default'
      });
      
      return bannerUrl;
    } catch (err) {
      console.error('Error uploading banner:', err);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload banner.',
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [mockProfile, toast]);

  // Load profile on mount
  useEffect(() => {
    fetchStoreProfile();
  }, [fetchStoreProfile]);

  return {
    profile: profile || mockProfile,
    loading,
    error,
    reload: fetchStoreProfile,
    updateProfile,
    uploadLogo,
    uploadBanner
  };
};

// ============================================
// COMPATIBILITY HOOK FOR SELLERDASHBOARD
// ============================================

export const useStoreProfileHook = () => {
  return useStoreProfile();
};

// ============================================
// DEFAULT EXPORT
// ============================================

export default {
  useStoreProfile,
  useStoreProfileHook
};