// src/api/products.ts
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface ProductVariant {
  id: string;
  name: string;
  options: Array<{
    id: string;
    name: string;
    price_adjustment?: number;
    stock_adjustment?: number;
    sku_suffix?: string;
  }>;
}

export interface ProductImage {
  id: string;
  url: string;
  alt_text?: string;
  is_primary: boolean;
  order: number;
}

export interface ProductSpecification {
  key: string;
  value: string;
  unit?: string;
}

export interface ProductDimension {
  length: number;
  width: number;
  height: number;
  unit: 'cm' | 'in' | 'm';
  weight: number;
  weight_unit: 'kg' | 'lb';
}

export interface Product {
  id: string;
  seller_id: string;
  sku: string;
  name: string;
  slug: string;
  description: string;
  short_description?: string;
  category_id: string;
  subcategory_id?: string;
  brand?: string;
  
  // Pricing
  base_price: number;
  sale_price?: number;
  cost_price: number;
  currency: string;
  tax_rate: number; // VAT rate in Saudi Arabia (15%)
  
  // Inventory
  stock_quantity: number;
  low_stock_threshold: number;
  allow_backorders: boolean;
  max_order_quantity?: number;
  min_order_quantity?: number;
  
  // Shipping
  weight?: number;
  dimensions?: ProductDimension;
  is_shippable: boolean;
  shipping_class?: string;
  requires_shipping: boolean;
  
  // Images
  images: ProductImage[];
  primary_image_url: string;
  
  // Status & Visibility
  status: 'draft' | 'active' | 'inactive' | 'archived';
  visibility: 'public' | 'private' | 'hidden';
  is_featured: boolean;
  is_best_seller: boolean;
  is_new_arrival: boolean;
  
  // Variants
  has_variants: boolean;
  variants?: ProductVariant[];
  
  // Specifications
  specifications?: ProductSpecification[];
  materials?: string[];
  colors?: string[];
  sizes?: string[];
  style?: string;
  
  // SEO & Marketing
  meta_title?: string;
  meta_description?: string;
  search_keywords?: string[];
  tags?: string[];
  
  // Compliance
  warranty_period?: number; // in months
  warranty_terms?: string;
  country_of_origin?: string;
  hs_code?: string; // Harmonized System code for customs
  
  // Analytics
  view_count: number;
  wishlist_count: number;
  purchase_count: number;
  average_rating: number;
  review_count: number;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  published_at?: string;
  sale_start_at?: string;
  sale_end_at?: string;
}

export interface ProductInput {
  seller_id: string;
  sku?: string;
  name: string;
  description: string;
  short_description?: string;
  category_id: string;
  subcategory_id?: string;
  brand?: string;
  
  // Pricing
  base_price: number;
  sale_price?: number;
  cost_price?: number;
  currency?: string;
  tax_rate?: number;
  
  // Inventory
  stock_quantity: number;
  low_stock_threshold?: number;
  allow_backorders?: boolean;
  max_order_quantity?: number;
  min_order_quantity?: number;
  
  // Shipping
  weight?: number;
  dimensions?: ProductDimension;
  is_shippable?: boolean;
  shipping_class?: string;
  requires_shipping?: boolean;
  
  // Images
  images?: File[] | string[];
  primary_image_index?: number;
  
  // Status
  status?: 'draft' | 'active' | 'inactive' | 'archived';
  visibility?: 'public' | 'private' | 'hidden';
  is_featured?: boolean;
  is_best_seller?: boolean;
  is_new_arrival?: boolean;
  
  // Variants
  has_variants?: boolean;
  variants?: ProductVariant[];
  
  // Specifications
  specifications?: ProductSpecification[];
  materials?: string[];
  colors?: string[];
  sizes?: string[];
  style?: string;
  
  // SEO
  meta_title?: string;
  meta_description?: string;
  search_keywords?: string[];
  tags?: string[];
  
  // Compliance
  warranty_period?: number;
  warranty_terms?: string;
  country_of_origin?: string;
  hs_code?: string;
}

export interface ProductFilters {
  status?: string;
  category?: string;
  min_price?: number;
  max_price?: number;
  stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock';
  is_featured?: boolean;
  search?: string;
  sort_by?: 'created_at' | 'price' | 'name' | 'stock' | 'sales';
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedProducts {
  data: Product[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  filters?: ProductFilters;
}

export interface BulkUpdateResult {
  success: string[];
  failed: string[];
  total: number;
}

export interface ProductStats {
  total_products: number;
  active_products: number;
  low_stock_products: number;
  out_of_stock_products: number;
  total_value: number;
  average_price: number;
  categories_distribution: Record<string, number>;
  status_distribution: Record<string, number>;
}

// ============================================
// CONSTANTS & CONFIG
// ============================================

const PRODUCT_IMAGE_BUCKET = 'product-images';
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const DEFAULT_PAGE_LIMIT = 20;
const DEFAULT_CURRENCY = 'SAR';
const DEFAULT_TAX_RATE = 15; // Saudi Arabia VAT rate

// Default categories for furniture marketplace
const DEFAULT_CATEGORIES = [
  { id: 'cat-1', name: 'Sofas & Couches', slug: 'sofas-couches' },
  { id: 'cat-2', name: 'Dining Tables', slug: 'dining-tables' },
  { id: 'cat-3', name: 'Chairs', slug: 'chairs' },
  { id: 'cat-4', name: 'Beds', slug: 'beds' },
  { id: 'cat-5', name: 'Wardrobes', slug: 'wardrobes' },
  { id: 'cat-6', name: 'Coffee Tables', slug: 'coffee-tables' },
  { id: 'cat-7', name: 'Office Furniture', slug: 'office-furniture' },
  { id: 'cat-8', name: 'Outdoor Furniture', slug: 'outdoor-furniture' },
  { id: 'cat-9', name: 'Kids Furniture', slug: 'kids-furniture' },
  { id: 'cat-10', name: 'Storage & Shelving', slug: 'storage-shelving' },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

const generateSKU = (category: string, productName: string): string => {
  const categoryPrefix = category.substring(0, 3).toUpperCase();
  const namePrefix = productName.substring(0, 3).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  const timestamp = Date.now().toString().slice(-4);
  
  return `${categoryPrefix}-${namePrefix}-${random}${timestamp}`;
};

const createSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
};

const validateProductImage = (file: File): { valid: boolean; error?: string } => {
  if (file.size > MAX_IMAGE_SIZE) {
    return { valid: false, error: 'Image size must be less than 5MB' };
  }
  
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: 'Image must be JPEG, PNG, or WebP format' };
  }
  
  return { valid: true };
};

const uploadProductImage = async (
  file: File, 
  sellerId: string, 
  productId: string
): Promise<{ url: string; error?: string }> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${productId}/${uuidv4()}.${fileExt}`;
    const filePath = `${sellerId}/${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from(PRODUCT_IMAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(PRODUCT_IMAGE_BUCKET)
      .getPublicUrl(filePath);

    return { url: publicUrl };
  } catch (error) {
    return { 
      url: '', 
      error: error instanceof Error ? error.message : 'Unknown upload error' 
    };
  }
};

const processProductImages = async (
  images: File[] | string[],
  sellerId: string,
  productId: string
): Promise<ProductImage[]> => {
  const processedImages: ProductImage[] = [];
  
  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    
    if (typeof image === 'string') {
      // Already a URL
      processedImages.push({
        id: uuidv4(),
        url: image,
        is_primary: i === 0,
        order: i,
      });
    } else {
      // File that needs uploading
      const validation = validateProductImage(image);
      if (!validation.valid) {
        console.warn(`Image ${image.name} validation failed: ${validation.error}`);
        continue;
      }
      
      const uploadResult = await uploadProductImage(image, sellerId, productId);
      if (uploadResult.error) {
        console.warn(`Image upload failed: ${uploadResult.error}`);
        continue;
      }
      
      processedImages.push({
        id: uuidv4(),
        url: uploadResult.url,
        is_primary: i === 0,
        order: i,
      });
    }
  }
  
  return processedImages;
};

// ============================================
// PRODUCT CRUD FUNCTIONS
// ============================================

/**
 * Fetch paginated products for a seller with optional filters
 */
export const getProducts = async (
  sellerId: string,
  page: number = 1,
  limit: number = DEFAULT_PAGE_LIMIT,
  filters: ProductFilters = {}
): Promise<{ data: PaginatedProducts | null; error: string | null }> => {
  try {
    if (!sellerId) {
      return { data: null, error: 'Seller ID is required' };
    }

    const start = (page - 1) * limit;
    const end = start + limit - 1;

    // Build query
    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        subcategory:categories!products_subcategory_id_fkey(*)
      `, { count: 'exact' })
      .eq('seller_id', sellerId)
      .order(filters.sort_by || 'created_at', { 
        ascending: filters.sort_order === 'asc' 
      })
      .range(start, end);

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters.category) {
      query = query.eq('category_id', filters.category);
    }
    
    if (filters.min_price !== undefined) {
      query = query.gte('base_price', filters.min_price);
    }
    
    if (filters.max_price !== undefined) {
      query = query.lte('base_price', filters.max_price);
    }
    
  if (filters.stock_status) {
  switch (filters.stock_status) {
    case 'in_stock':
      query = query.gt('stock_quantity', 0);
      break;

    case 'low_stock':
      // ❗ Column-to-column comparison NOT supported in Supabase JS
      // We handle this after fetching data
      break;

    case 'out_of_stock':
      query = query.eq('stock_quantity', 0);
      break;
  }
}

    
    if (filters.is_featured !== undefined) {
      query = query.eq('is_featured', filters.is_featured);
    }
    
    if (filters.search) {
      query = query.or(`
        name.ilike.%${filters.search}%,
        description.ilike.%${filters.search}%,
        sku.ilike.%${filters.search}%
      `);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    const products = (data || []) as Product[];
    const total = count || 0;

    const result: PaginatedProducts = {
      data: products,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
      filters,
    };

    return { data: result, error: null };
  } catch (error) {
    console.error('Error fetching products:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error fetching products' 
    };
  }
};

/**
 * Get a single product by ID with complete details
 */
export const getProductById = async (
  productId: string,
  sellerId?: string
): Promise<{ data: Product | null; error: string | null }> => {
  try {
    if (!productId) {
      return { data: null, error: 'Product ID is required' };
    }

    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        subcategory:categories!products_subcategory_id_fkey(*),
        images:product_images(*)
      `)
      .eq('id', productId);

    if (sellerId) {
      query = query.eq('seller_id', sellerId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    if (!data) {
      return { data: null, error: 'Product not found' };
    }

    return { data: data as Product, error: null };
  } catch (error) {
    console.error('Error fetching product:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error fetching product' 
    };
  }
};

/**
 * Create a new product
 */
export const addProduct = async (
  productData: ProductInput
): Promise<{ data: Product | null; error: string | null }> => {
  try {
    // Validate required fields
    const requiredFields = ['seller_id', 'name', 'category_id', 'base_price', 'stock_quantity'];
    const missingFields = requiredFields.filter(field => !productData[field as keyof ProductInput]);
    
    if (missingFields.length > 0) {
      return { 
        data: null, 
        error: `Missing required fields: ${missingFields.join(', ')}` 
      };
    }

    if (productData.base_price <= 0) {
      return { data: null, error: 'Price must be greater than 0' };
    }

    if (productData.stock_quantity < 0) {
      return { data: null, error: 'Stock quantity cannot be negative' };
    }

    const productId = uuidv4();
    const now = new Date().toISOString();
    
    // Generate SKU if not provided
    const sku = productData.sku || generateSKU(productData.category_id, productData.name);
    
    // Create slug
    const slug = createSlug(productData.name);
    
    // Process images if provided
    let images: ProductImage[] = [];
    let primaryImageUrl = '';
    
    if (productData.images && productData.images.length > 0) {
      images = await processProductImages(
        productData.images, 
        productData.seller_id, 
        productId
      );
      
      primaryImageUrl = images.find(img => img.is_primary)?.url || images[0]?.url || '';
    }

    // Prepare product data for insertion
    const productToInsert = {
      id: productId,
      seller_id: productData.seller_id,
      sku,
      name: productData.name,
      slug,
      description: productData.description,
      short_description: productData.short_description,
      category_id: productData.category_id,
      subcategory_id: productData.subcategory_id,
      brand: productData.brand,
      
      // Pricing
      base_price: productData.base_price,
      sale_price: productData.sale_price,
      cost_price: productData.cost_price || productData.base_price * 0.6, // Default 40% margin
      currency: productData.currency || DEFAULT_CURRENCY,
      tax_rate: productData.tax_rate || DEFAULT_TAX_RATE,
      
      // Inventory
      stock_quantity: productData.stock_quantity,
      low_stock_threshold: productData.low_stock_threshold || 5,
      allow_backorders: productData.allow_backorders || false,
      max_order_quantity: productData.max_order_quantity || 10,
      min_order_quantity: productData.min_order_quantity || 1,
      
      // Shipping
      weight: productData.weight,
      dimensions: productData.dimensions,
      is_shippable: productData.is_shippable ?? true,
      shipping_class: productData.shipping_class,
      requires_shipping: productData.requires_shipping ?? true,
      
      // Images
      primary_image_url: primaryImageUrl,
      
      // Status
      status: productData.status || 'draft',
      visibility: productData.visibility || 'public',
      is_featured: productData.is_featured || false,
      is_best_seller: productData.is_best_seller || false,
      is_new_arrival: productData.is_new_arrival || false,
      
      // Variants
      has_variants: productData.has_variants || false,
      
      // Specifications
      specifications: productData.specifications,
      materials: productData.materials,
      colors: productData.colors,
      sizes: productData.sizes,
      style: productData.style,
      
      // SEO
      meta_title: productData.meta_title || productData.name,
      meta_description: productData.meta_description || productData.short_description,
      search_keywords: productData.search_keywords,
      tags: productData.tags,
      
      // Compliance
      warranty_period: productData.warranty_period,
      warranty_terms: productData.warranty_terms,
      country_of_origin: productData.country_of_origin || 'SA',
      hs_code: productData.hs_code,
      
      // Analytics (defaults)
      view_count: 0,
      wishlist_count: 0,
      purchase_count: 0,
      average_rating: 0,
      review_count: 0,
      
      // Timestamps
      created_at: now,
      updated_at: now,
      published_at: productData.status === 'active' ? now : null,
    };

    // Insert product
    const { data: insertedProduct, error: insertError } = await supabase
      .from('products')
      .insert(productToInsert)
      .select(`
        *,
        category:categories(*),
        subcategory:categories!products_subcategory_id_fkey(*)
      `)
      .single();

    if (insertError) {
      throw new Error(`Failed to create product: ${insertError.message}`);
    }

    // Insert product images if any
    if (images.length > 0) {
      const imageInserts = images.map(img => ({
        id: img.id,
        product_id: productId,
        url: img.url,
        alt_text: img.alt_text,
        is_primary: img.is_primary,
        order: img.order,
        created_at: now,
        updated_at: now,
      }));

      const { error: imagesError } = await supabase
        .from('product_images')
        .insert(imageInserts);

      if (imagesError) {
        console.warn('Failed to save product images:', imagesError);
        // Continue even if images fail - product was created successfully
      }
    }

    // If product has variants, insert them
    if (productData.has_variants && productData.variants && productData.variants.length > 0) {
      const variantInserts = productData.variants.map(variant => ({
        ...variant,
        product_id: productId,
        created_at: now,
        updated_at: now,
      }));

      const { error: variantsError } = await supabase
        .from('product_variants')
        .insert(variantInserts);

      if (variantsError) {
        console.warn('Failed to save product variants:', variantsError);
      }
    }

    return { data: insertedProduct as Product, error: null };
  } catch (error) {
    console.error('Error creating product:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error creating product' 
    };
  }
};

/**
 * Update an existing product
 */
export const updateProduct = async (
  productId: string,
  sellerId: string,
  updatedData: Partial<ProductInput>
): Promise<{ data: Product | null; error: string | null }> => {
  try {
    if (!productId || !sellerId) {
      return { data: null, error: 'Product ID and Seller ID are required' };
    }

    // Verify product exists and belongs to seller
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('seller_id', sellerId)
      .single();

    if (fetchError || !existingProduct) {
      return { data: null, error: 'Product not found or unauthorized' };
    }

    const now = new Date().toISOString();
    const updateData: any = {
      updated_at: now,
    };

    // Update basic fields if provided
    if (updatedData.name !== undefined) {
      updateData.name = updatedData.name;
      updateData.slug = createSlug(updatedData.name);
    }
    
    if (updatedData.description !== undefined) updateData.description = updatedData.description;
    if (updatedData.short_description !== undefined) updateData.short_description = updatedData.short_description;
    if (updatedData.category_id !== undefined) updateData.category_id = updatedData.category_id;
    if (updatedData.subcategory_id !== undefined) updateData.subcategory_id = updatedData.subcategory_id;
    if (updatedData.brand !== undefined) updateData.brand = updatedData.brand;
    
    // Pricing
    if (updatedData.base_price !== undefined) {
      if (updatedData.base_price <= 0) {
        return { data: null, error: 'Price must be greater than 0' };
      }
      updateData.base_price = updatedData.base_price;
    }
    
    if (updatedData.sale_price !== undefined) updateData.sale_price = updatedData.sale_price;
    if (updatedData.cost_price !== undefined) updateData.cost_price = updatedData.cost_price;
    if (updatedData.currency !== undefined) updateData.currency = updatedData.currency;
    if (updatedData.tax_rate !== undefined) updateData.tax_rate = updatedData.tax_rate;
    
    // Inventory
    if (updatedData.stock_quantity !== undefined) {
      if (updatedData.stock_quantity < 0) {
        return { data: null, error: 'Stock quantity cannot be negative' };
      }
      updateData.stock_quantity = updatedData.stock_quantity;
    }
    
    if (updatedData.low_stock_threshold !== undefined) updateData.low_stock_threshold = updatedData.low_stock_threshold;
    if (updatedData.allow_backorders !== undefined) updateData.allow_backorders = updatedData.allow_backorders;
    if (updatedData.max_order_quantity !== undefined) updateData.max_order_quantity = updatedData.max_order_quantity;
    if (updatedData.min_order_quantity !== undefined) updateData.min_order_quantity = updatedData.min_order_quantity;
    
    // Shipping
    if (updatedData.weight !== undefined) updateData.weight = updatedData.weight;
    if (updatedData.dimensions !== undefined) updateData.dimensions = updatedData.dimensions;
    if (updatedData.is_shippable !== undefined) updateData.is_shippable = updatedData.is_shippable;
    if (updatedData.shipping_class !== undefined) updateData.shipping_class = updatedData.shipping_class;
    if (updatedData.requires_shipping !== undefined) updateData.requires_shipping = updatedData.requires_shipping;
    
    // Status
    if (updatedData.status !== undefined) {
      updateData.status = updatedData.status;
      if (updatedData.status === 'active' && existingProduct.status !== 'active') {
        updateData.published_at = now;
      }
    }
    
    if (updatedData.visibility !== undefined) updateData.visibility = updatedData.visibility;
    if (updatedData.is_featured !== undefined) updateData.is_featured = updatedData.is_featured;
    if (updatedData.is_best_seller !== undefined) updateData.is_best_seller = updatedData.is_best_seller;
    if (updatedData.is_new_arrival !== undefined) updateData.is_new_arrival = updatedData.is_new_arrival;
    
    // Specifications & SEO
    if (updatedData.specifications !== undefined) updateData.specifications = updatedData.specifications;
    if (updatedData.materials !== undefined) updateData.materials = updatedData.materials;
    if (updatedData.colors !== undefined) updateData.colors = updatedData.colors;
    if (updatedData.sizes !== undefined) updateData.sizes = updatedData.sizes;
    if (updatedData.style !== undefined) updateData.style = updatedData.style;
    if (updatedData.meta_title !== undefined) updateData.meta_title = updatedData.meta_title;
    if (updatedData.meta_description !== undefined) updateData.meta_description = updatedData.meta_description;
    if (updatedData.search_keywords !== undefined) updateData.search_keywords = updatedData.search_keywords;
    if (updatedData.tags !== undefined) updateData.tags = updatedData.tags;
    
    // Compliance
    if (updatedData.warranty_period !== undefined) updateData.warranty_period = updatedData.warranty_period;
    if (updatedData.warranty_terms !== undefined) updateData.warranty_terms = updatedData.warranty_terms;
    if (updatedData.country_of_origin !== undefined) updateData.country_of_origin = updatedData.country_of_origin;
    if (updatedData.hs_code !== undefined) updateData.hs_code = updatedData.hs_code;
    
    // Handle images if provided
    if (updatedData.images && updatedData.images.length > 0) {
      const images = await processProductImages(
        updatedData.images,
        sellerId,
        productId
      );
      
      if (images.length > 0) {
        // Delete existing images
        await supabase
          .from('product_images')
          .delete()
          .eq('product_id', productId);
        
        // Insert new images
        const imageInserts = images.map(img => ({
          ...img,
          product_id: productId,
          created_at: now,
          updated_at: now,
        }));
        
        await supabase
          .from('product_images')
          .insert(imageInserts);
        
        // Update primary image URL
        const primaryImage = images.find(img => img.is_primary) || images[0];
        if (primaryImage) {
          updateData.primary_image_url = primaryImage.url;
        }
      }
    }

    // Update product
    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', productId)
      .eq('seller_id', sellerId)
      .select(`
        *,
        category:categories(*),
        subcategory:categories!products_subcategory_id_fkey(*),
        images:product_images(*)
      `)
      .single();

    if (updateError) {
      throw new Error(`Failed to update product: ${updateError.message}`);
    }

    return { data: updatedProduct as Product, error: null };
  } catch (error) {
    console.error('Error updating product:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error updating product' 
    };
  }
};

/**
 * Delete a product
 */
export const deleteProduct = async (
  productId: string,
  sellerId: string
): Promise<{ success: boolean; error: string | null }> => {
  try {
    if (!productId || !sellerId) {
      return { success: false, error: 'Product ID and Seller ID are required' };
    }

    // Verify product exists and belongs to seller
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select('id, images:product_images(url)')
      .eq('id', productId)
      .eq('seller_id', sellerId)
      .single();

    if (fetchError || !existingProduct) {
      return { success: false, error: 'Product not found or unauthorized' };
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('seller_id', sellerId);

    if (deleteError) {
      throw new Error(`Failed to delete product: ${deleteError.message}`);
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting product:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error deleting product' 
    };
  }
};

/**
 * Get product statistics for a seller
 */
export const getProductStats = async (
  sellerId: string
): Promise<{ data: ProductStats | null; error: string | null }> => {
  try {
    if (!sellerId) {
      return { data: null, error: 'Seller ID is required' };
    }

    // Fetch all products for the seller
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', sellerId);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    const productList = products || [];
    
    // Calculate statistics
    const stats: ProductStats = {
      total_products: productList.length,
      active_products: productList.filter(p => p.status === 'active').length,
      low_stock_products: productList.filter(p => 
        p.stock_quantity > 0 && p.stock_quantity <= (p.low_stock_threshold || 5)
      ).length,
      out_of_stock_products: productList.filter(p => p.stock_quantity === 0).length,
      total_value: productList.reduce((sum, p) => sum + (p.base_price * p.stock_quantity), 0),
      average_price: productList.length > 0 
        ? productList.reduce((sum, p) => sum + p.base_price, 0) / productList.length 
        : 0,
      categories_distribution: {},
      status_distribution: {},
    };

    // Calculate distributions
    productList.forEach(product => {
      // Category distribution
      if (product.category_id) {
        stats.categories_distribution[product.category_id] = 
          (stats.categories_distribution[product.category_id] || 0) + 1;
      }
      
      // Status distribution
      stats.status_distribution[product.status] = 
        (stats.status_distribution[product.status] || 0) + 1;
    });

    return { data: stats, error: null };
  } catch (error) {
    console.error('Error fetching product stats:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error fetching stats' 
    };
  }
};

/**
 * Bulk update product status
 */
export const bulkUpdateProducts = async (
  productIds: string[],
  sellerId: string,
  updates: Partial<ProductInput>
): Promise<{ data: BulkUpdateResult | null; error: string | null }> => {
  try {
    if (!productIds.length || !sellerId) {
      return { data: null, error: 'Product IDs and Seller ID are required' };
    }

    const now = new Date().toISOString();
    const updateData: any = {
      updated_at: now,
    };

    // Add provided updates
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.is_featured !== undefined) updateData.is_featured = updates.is_featured;
    if (updates.visibility !== undefined) updateData.visibility = updates.visibility;

    const result: BulkUpdateResult = {
      success: [],
      failed: [],
      total: productIds.length,
    };

    // Update each product
    for (const productId of productIds) {
      try {
        const { error } = await supabase
          .from('products')
          .update(updateData)
          .eq('id', productId)
          .eq('seller_id', sellerId);

        if (error) {
          result.failed.push(productId);
        } else {
          result.success.push(productId);
        }
      } catch {
        result.failed.push(productId);
      }
    }

    return { data: result, error: null };
  } catch (error) {
    console.error('Error in bulk update:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error in bulk update' 
    };
  }
};

/**
 * Search products with full-text search
 */
export const searchProducts = async (
  sellerId: string,
  query: string,
  limit: number = 10
): Promise<{ data: Product[] | null; error: string | null }> => {
  try {
    if (!sellerId || !query.trim()) {
      return { data: [], error: null };
    }

    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        sku,
        base_price,
        stock_quantity,
        primary_image_url,
        status
      `)
      .eq('seller_id', sellerId)
      .or(`name.ilike.%${query}%,sku.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(limit);

    if (error) {
      throw new Error(`Search error: ${error.message}`);
    }

    return { data: data as Product[], error: null };
  } catch (error) {
    console.error('Error searching products:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown search error' 
    };
  }
};

/**
 * Get low stock products
 */
export const getLowStockProducts = async (
  sellerId: string,
  limit: number = 10
): Promise<{ data: Product[] | null; error: string | null }> => {
  try {
    // c
    const { data, error } = await supabase
  .from('products')
  .select('*')
  .eq('seller_id', sellerId)
  .gt('stock_quantity', 0)
  .order('stock_quantity', { ascending: true })
  .limit(limit);


    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return { data: data as Product[], error: null };
  } catch (error) {
    console.error('Error fetching low stock products:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

// ============================================
// DEFAULT EXPORT
// ============================================

export default {
  getProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct,
  getProductStats,
  bulkUpdateProducts,
  searchProducts,
  getLowStockProducts,
  DEFAULT_CATEGORIES,
  DEFAULT_CURRENCY,
  DEFAULT_TAX_RATE,
};