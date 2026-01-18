import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import {
  AiOutlineUser,
  AiOutlineShoppingCart,
  AiOutlineSearch,
  AiFillStar,
  AiOutlineClose,
  AiOutlineArrowLeft,
  AiOutlineHeart,
  AiOutlineInstagram,
  AiOutlineTwitter,
  AiOutlineYoutube,
  AiOutlineFacebook,
  AiOutlineDown,
  AiOutlineEye,
  AiOutlineEyeInvisible,
  AiOutlineRocket,
} from "react-icons/ai";
import React, { useState, useMemo, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

interface Category {
  id: string;
  name: string;
  display_name: string;

  slug: string;
  description: string | null;
  parent_id: string | null;
  category_type: "customized" | "ready_made";
  usage_type: "indoor" | "outdoor" | "both";
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

interface Product {
  id: string;
  name: string;
  price: string;
  orders: string;
  reviews: string;
  isTopSeller: boolean;
  image: string;
  rating: string;
  companyLogo: string;
  companyName: string;
  description: string;
  category_type: "customized" | "ready_made";
  usage_type: "indoor" | "outdoor" | "both";
  product_type: string;
  product_categories: string[];
  stock?: number;
  brand?: string;
  status?: string;
  originalPrice?: string;
  discount?: string;
  warranty?: string;
  shortDescription?: string;
  placement?: "indoor" | "outdoor";
  section?: string;
  finishType?: string;
  primaryColor?: string;
  availableColors?: string[];
  dimensions?: {
    length: string;
    width: string;
    height: string;
    unit: "cm" | "inches";
  };
  weight?: string;
  variants?: any[];
  shipping?: any;
  policies?: any;
  seller_id?: string;
  is_advertised?: boolean;
  ad_budget?: number;
  ad_duration?: number;
  ad_start_date?: string;
  ad_end_date?: string;
  category_id?: string;
}

interface AdCampaign {
  id: string;
  name: string;
  description: string;
  seller_id: string | null;
  seller_name: string;
  seller_business: string;
  placement_type: "slider" | "sidebar" | "top_brand" | "premium_partner";
  platform:
    | "own-platform"
    | "facebook"
    | "instagram"
    | "google"
    | "twitter"
    | "tiktok"
    | "linkedin"
    | "youtube";
  budget_total: number;
  budget_daily: number;
  duration_days: number;
  start_date: string;
  end_date: string;
  status: "draft" | "pending" | "active" | "paused" | "completed" | "rejected";
  images: string[];
  target_url: string;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  conversion_rate: number;
  is_high_budget: boolean;
  created_at: string;
  updated_at: string;
  product_id?: string;
  product_name?: string;
  product_image?: string;
  product_price?: number;
}
 


interface HomePageProps {
  onNavigate?: (page: string, data?: any) => void;
  onAddToCart?: (
    productId: string,
    customization?: any,
    quantity?: number,
  ) => void;
  onToggleWishlist?: (productId: string) => void;
  wishlistItems?: string[];
  isLoggedIn?: boolean;
  userType?: "buyer" | "seller" | "admin" | null;
}

const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  onAddToCart,
  onToggleWishlist,
  wishlistItems = [],
  isLoggedIn,
  userType,
}) => {
  const { signIn, signUp } = useAuth();

  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authType, setAuthType] = useState<"signin" | "signup">("signin");
  const [currentUserType, setCurrentUserType] = useState<"buyer" | "seller">(
    "buyer",
  );
  const [selectedProductType, setSelectedProductType] = useState<
    "all" | "customized" | "ready_made"
  >("all");
  const [selectedUsageType, setSelectedUsageType] = useState<
    "all" | "indoor" | "outdoor" | "both"
  >("all");
  const [selectedAdminCategory, setSelectedAdminCategory] = useState<
    string | null
  >(null);
  const [selectedProductCategory, setSelectedProductCategory] = useState<
    string | null
  >(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKinds, setSelectedKinds] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [cartItems, setCartItems] = useState<
    { id: string; product: Product; quantity: number }[]
  >([]);
  const [realProducts, setRealProducts] = useState<Product[]>([]);
  const [adCampaigns, setAdCampaigns] = useState<AdCampaign[]>([]);
  const [sliderAds, setSliderAds] = useState<AdCampaign[]>([]);
  const [sidebarAds, setSidebarAds] = useState<AdCampaign[]>([]);
  const [topBrandAds, setTopBrandAds] = useState<AdCampaign[]>([]);
  const [premiumPartnerAds, setPremiumPartnerAds] = useState<AdCampaign[]>([]);
  const [authError, setAuthError] = useState<string>("");
  const [authLoading, setAuthLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [currency, setCurrency] = useState<"SAR" | "USD">("SAR");
  const [language, setLanguage] = useState<"en" | "ar">("en");
  const [loadingAds, setLoadingAds] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Categories from database
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategories, setActiveCategories] = useState<Category[]>([]);
  const [featuredCategories, setFeaturedCategories] = useState<Category[]>([]);

  const [expandedSections, setExpandedSections] = useState({
    readyMade: true,
    customized: true,
    productCategories: true,
  });

  const [authForm, setAuthForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const gigaBytesLogo =
    "https://i.pinimg.com/736x/bb/fa/77/bbfa7777e9b4091b9ba254b407914b65.jpg";

  const translations = {
    en: {
      searchPlaceholder: "Search for furniture...",
      allCategories: "All Categories",
      signIn: "Sign In",
      signUp: "Sign Up",
      welcomeBack: "Welcome back! Please sign in to your account.",
      joinToday: "Join us today! Create your account to get started.",
      buyer: "Buyer",
      seller: "Seller",
      firstName: "First Name",
      lastName: "Last Name",
      phoneNumber: "Phone Number",
      email: "Email Address",
      password: "Password",
      confirmPassword: "Confirm Password",
      rememberMe: "Remember me",
      forgotPassword: "Forgot password?",
      createAccount: "Create Account",
      continueSeller: "Continue to Seller Registration",
      dontHaveAccount: "Don't have an account?",
      alreadyHaveAccount: "Already have an account?",
      sellerRegistration:
        "Seller Registration: You'll be redirected to complete your business details after account creation.",
      blackFriday: "Black Friday",
      summerSale: "%50 Off Summer Time",
      topBrands: "Top Brands",
      premiumPartners: "Premium Partners",
      filters: "Filters",
      selectCity: "Select City",
      allProducts: "All Products",
      ready: "Ready Made",
      customized: "Customized",
      internal: "Indoor",
      external: "Outdoor",
      kind: "Kind",
      priceRange: "Price Range",
      topProviders: "Top Providers",
      clearFilters: "Clear Filters",
      showingProducts: "Showing {count} products",
      readyMade: "Ready Made",
      noProducts: "No products found",
      tryAdjusting: "Try adjusting your filters or search terms",
      clearAllFilters: "Clear All Filters",
      boostSales: "Boost Your Sales!",
      reachCustomers: "Reach thousands of customers",
      startAdvertising: "Start Advertising",
      premiumCollection: "Premium Collection",
      upToOff: "Up to 50% off",
      luxuryFurniture: "Luxury Furniture",
      limitedTime: "Limited Time Offer",
      quickLinks: "Quick Links",
      categories: "Categories",
      contact: "Contact",
      rights: "All rights reserved",
      orders: "orders",
      freeDelivery: "Free",
      order: "Order",
      sar: "SAR",
      usd: "USD",
      featuredAds: "Featured Ads",
      sponsored: "Sponsored",
      premiumAds: "Premium Ads",
      viewDetails: "View Details",
      adImpressions: "impressions",
      adClicks: "clicks",
      highBudgetAd: "Premium Ad",
      sponsoredContent: "Sponsored Content",
      promoteProduct: "Promote Product",
      advertisedProduct: "Advertised",
      adminCategories: "Admin Categories",
      productCategories: "Product Categories",
      showMore: "Show More",
      showLess: "Show Less",
      customFurniture: "Custom Furniture",
      indoorFurniture: "Indoor Furniture",
      outdoorFurniture: "Outdoor Furniture",
      bothUsage: "Both Indoor/Outdoor",
      viewCart: "View Cart",
      cart: "Cart",
      itemsInCart: "items in cart",
      removeFromCart: "Remove from Cart",
    },
    ar: {
      searchPlaceholder: "ابحث عن الأثاث...",
      allCategories: "جميع الفئات",
      signIn: "تسجيل الدخول",
      signUp: "إنشاء حساب",
      welcomeBack: "مرحباً بعودتك! يرجى تسجيل الدخول إلى حسابك.",
      joinToday: "انضم إلينا اليوم! أنشئ حسابك للبدء.",
      buyer: "مشتري",
      seller: "بائع",
      firstName: "الاسم الأول",
      lastName: "اسم العائلة",
      phoneNumber: "رقم الهاتف",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      confirmPassword: "تأكيد كلمة المرور",
      rememberMe: "تذكرني",
      forgotPassword: "نسيت كلمة المرور؟",
      createAccount: "إنشاء حساب",
      continueSeller: "المتابعة لتسجيل البائع",
      dontHaveAccount: "ليس لديك حساب؟",
      alreadyHaveAccount: "لديك حساب بالفعل؟",
      sellerRegistration:
        "تسجيل البائع: سيتم توجيهك لإكمال تفاصيل عملك بعد إنشاء الحساب.",
      blackFriday: "الجمعة السوداء",
      summerSale: "خصم 50% للصيف",
      topBrands: "أفضل الماركات",
      premiumPartners: "شركاء متميزون",
      filters: "الفلاتر",
      selectCity: "اختر المدينة",
      allProducts: "جميع المنتجات",
      ready: "جاهز",
      customized: "مخصص",
      internal: "داخلي",
      external: "خارجي",
      kind: "النوع",
      priceRange: "نطاق السعر",
      topProviders: "أفضل الموردين",
      clearFilters: "مسح الفلاتر",
      showingProducts: "عرض {count} منتج",
      readyMade: "جاهز",
      noProducts: "لم يتم العثور على منتجات",
      tryAdjusting: "حاول تعديل الفلاتر أو مصطلحات البحث",
      clearAllFilters: "مسح كل الفلاتر",
      boostSales: "عزز مبيعاتك!",
      reachCustomers: "الوصول إلى آلاف العملاء",
      startAdvertising: "ابدأ الإعلان",
      premiumCollection: "مجموعة مميزة",
      upToOff: "خصم حتى 50%",
      luxuryFurniture: "أثاث فاخر",
      limitedTime: "عرض محدود الوقت",
      quickLinks: "روابط سريعة",
      categories: "الفئات",
      contact: "اتصل بنا",
      rights: "جميع الحقوق محفوظة",
      orders: "طلب",
      freeDelivery: "مجاني",
      order: "اطلب",
      sar: "ريال",
      usd: "دولار",
      featuredAds: "إعلانات مميزة",
      sponsored: "مدعوم",
      premiumAds: "إعلانات متميزة",
      viewDetails: "عرض التفاصيل",
      adImpressions: "مشاهدة",
      adClicks: "نقرات",
      highBudgetAd: "إعلان مميز",
      sponsoredContent: "محتوى مدعوم",
      promoteProduct: "الترويج للمنتج",
      advertisedProduct: "معلن عنه",
      adminCategories: "فئات المدير",
      productCategories: "فئات المنتجات",
      showMore: "عرض المزيد",
      showLess: "عرض أقل",
      customFurniture: "أثاث مخصص",
      indoorFurniture: "أثاث داخلي",
      outdoorFurniture: "أثاث خارجي",
      bothUsage: "داخلي/خارجي",
      viewCart: "عرض السلة",
      cart: "السلة",
      itemsInCart: "منتجات في السلة",
      removeFromCart: "إزالة من السلة",
    },
  };


  console.log("Current:", realProducts);
  const t = translations[language];
  const exchangeRate = 3.75;

  const convertPrice = (price: string): string => {
    if (!price) return "0";
    const numericPrice = parseFloat(price.replace(/[^0-9.]/g, ""));
    if (isNaN(numericPrice)) return "0";
    if (currency === "USD") {
      return (numericPrice / exchangeRate).toFixed(2);
    }
    return numericPrice.toString();
  };

  // Load categories from database
  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      console.log("🔄 Loading categories from database...");

      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (categoriesError) {
        console.error("❌ Error loading categories:", categoriesError);
        loadCategoriesFromStorage();
        return;
      }

      if (categoriesData && categoriesData.length > 0) {
        setCategories(categoriesData);
        setActiveCategories(categoriesData.filter((cat) => cat.is_active));
        setFeaturedCategories(categoriesData.filter((cat) => cat.is_featured));

        console.log(
          "✅ Categories loaded from database:",
          categoriesData.length,
        );
      } else {
        console.log("📦 No categories in database, loading from storage");
        loadCategoriesFromStorage();
      }
    } catch (error) {
      console.error("❌ Error loading categories:", error);
      loadCategoriesFromStorage();
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadCategoriesFromStorage = () => {
    try {
      const savedCategories = localStorage.getItem("adminCategories");
      if (savedCategories) {
        const parsedCategories = JSON.parse(savedCategories);
        setCategories(parsedCategories);
        setActiveCategories(
          parsedCategories.filter((cat: Category) => cat.is_active),
        );
        setFeaturedCategories(
          parsedCategories.filter((cat: Category) => cat.is_featured),
        );
        console.log(
          "✅ Categories loaded from storage:",
          parsedCategories.length,
        );
      } else {
        console.log("📦 No categories in storage");
      }
    } catch (error) {
      console.error("❌ Error loading categories from storage:", error);
    }
  };

  // Get all product categories from active categories
  const getAllProductCategories = () => {
    const allCategories = activeCategories.flatMap(
      (cat) => cat.product_categories || [],
    );
    const uniqueCategories = Array.from(new Set(allCategories)).filter(Boolean);

    const categoryCounts: Record<string, number> = {};
    activeCategories.forEach((cat) => {
      (cat.product_categories || []).forEach((category) => {
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      });
    });

    return uniqueCategories
      .map((category) => ({
        value: category,
        label:
          category.charAt(0).toUpperCase() +
          category.slice(1).replace(/_/g, " "),
        count: categoryCounts[category] || 0,
      }))
      .sort((a, b) => b.count - a.count);
  };

  const loadProductsFromDatabase = async () => {
    loadProductsFromStorage();
    setLoadingProducts(true);
    try {
      console.log("🔄 Loading products from database...");
      
      let query = supabase
      .from("products")
      .select("*, category:categories(*)")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(50);
  
      
      const { data: products, error } = await query;


      if (error) {
        console.error("❌ Error loading products:", error);
        return;
      }

      if (products && products.length > 0) {
        const convertedProducts: Product[] = products.map((product: any) => ({
          id: product.id || `prod_${Date.now()}`,
          name: product.name || product.title || "Unnamed Product",
          price: String(product.price || "0"),
          orders: String(product.orders || "0"),
          reviews: String(product.reviews || "0"),
          isTopSeller: product.is_featured || false,
          image:
            product.images && product.images.length > 0
              ? product.images[0]
              : "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80",
          rating: String(product.rating || "4.5"),
          companyLogo: product.seller_logo || gigaBytesLogo,
          companyName: product.seller_name || "Giga Home",
          description: product.description || "Premium furniture product",
          category_type:
            product.category_type ||
            product.category?.category_type ||
            "ready_made",
          usage_type:
            product.usage_type || product.category?.usage_type || "indoor",
          product_type:
            product.product_type || product.category?.product_type || "",
          product_categories:
            product.product_categories ||
            product.category?.product_categories ||
            [],
          stock: product.stock_quantity,
          brand: product.brand,
          status: product.status,
          originalPrice: product.original_price
            ? String(product.original_price)
            : undefined,
          discount: product.discount ? `${product.discount}%` : undefined,
          warranty: product.warranty,
          shortDescription: product.short_description,
          placement: product.placement,
          section: product.section,
          finishType: product.finish_type,
          primaryColor: product.primary_color,
          availableColors: product.colors,
          dimensions: product.dimensions,
          weight: product.weight,
          variants: product.variants,
          shipping: product.shipping_info,
          policies: product.policies,
          seller_id: product.seller_id,
          is_advertised: product.is_advertised || false,
          ad_budget: product.ad_budget,
          ad_duration: product.ad_duration,
          ad_start_date: product.ad_start_date,
          ad_end_date: product.ad_end_date,
          category_id: product.category_id || product.category?.id,
        }));

        setRealProducts(convertedProducts);
        console.log(
          "✅ Products loaded from database:",
          convertedProducts.length,
        );
      } else {
        console.log("📦 No products in database, loading from storage");
        loadProductsFromStorage();
      }
    } catch (error) {
      console.error("❌ Error loading products:", error);
      loadProductsFromStorage();
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadProductsFromStorage = () => {
    try {
      const savedProducts = localStorage.getItem("furnitureProducts");
      console.log("📦 Loading products from storage...",savedProducts
      );
      if (savedProducts) {
        const parsedProducts = JSON.parse(savedProducts);
        const convertedProducts: Product[] = parsedProducts.map(
          (product: any) => ({
            id: product.id || `prod_${Date.now()}`,
            name: product.name || "Unnamed Product",
            price: String(product.price || "250"),
            orders: String(product.orders || "0"),
            reviews: String(product.reviews || "0"),
            isTopSeller: product.isTopSeller || product.status === "active",
            image:
              product.image ||
              (product.images && product.images.length > 0
                ? product.images[0]
                : "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80"),
            rating: String(product.rating || "4.5"),
            companyLogo: product.companyLogo || gigaBytesLogo,
            companyName: product.companyName || "Giga Home",
            description:
              product.description ||
              product.shortDescription ||
              "Premium furniture product",
            category_type: product.category_type || "ready_made",
            usage_type: product.usage_type || "indoor",
            product_type: product.product_type || "",
            product_categories: product.product_categories || [],
            stock: product.stock,
            brand: product.brand,
            status: product.status,
            originalPrice: product.originalPrice || "350",
            discount: String(product.discount || "35%"),
            warranty: String(product.warranty || "3 mon"),
            shortDescription: product.shortDescription,
            placement: product.placement,
            section: product.section,
            finishType: product.finishType,
            primaryColor: product.primaryColor,
            availableColors: product.availableColors,
            dimensions: product.dimensions,
            weight: product.weight,
            variants: product.variants,
            shipping: product.shipping,
            policies: product.policies,
            seller_id: product.seller_id,
            is_advertised: product.is_advertised || false,
            ad_budget: product.ad_budget,
            ad_duration: product.ad_duration,
            ad_start_date: product.ad_start_date,
            ad_end_date: product.ad_end_date,
            category_id: product.category_id,
          }),
        );

        setRealProducts(convertedProducts);
        console.log(
          "✅ Products loaded from storage:",
          convertedProducts.length,
        );
      } else {
        const sampleProducts: Product[] = [
          {
            id: "1",
            name: "Queen Bed",
            price: "250",
            orders: "124",
            reviews: "45",
            isTopSeller: true,
            image:
              "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=400&q=80",
            rating: "4.5",
            companyLogo: gigaBytesLogo,
            companyName: "Giga Home",
            description:
              "An L-shaped kitchen is a popular and versatile design that consists of twin bed and share bowlw dss",
            category_type: "ready_made",
            usage_type: "indoor",
            product_type: "bed",
            product_categories: ["bedroom"],
            originalPrice: "350",
            discount: "35%",
            warranty: "3 mon",
            seller_id: "seller_1",
            is_advertised: true,
            ad_budget: 500,
            ad_duration: 30,
          },
          {
            id: "2",
            name: "Modern Sofa",
            price: "450",
            orders: "89",
            reviews: "32",
            isTopSeller: true,
            image:
              "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80",
            rating: "4.8",
            companyLogo: gigaBytesLogo,
            companyName: "Giga Home",
            description:
              "Comfortable modern sofa with premium fabric and elegant design",
            category_type: "ready_made",
            usage_type: "indoor",
            product_type: "sofa",
            product_categories: ["living_room"],
            originalPrice: "600",
            discount: "25%",
            warranty: "2 mon",
            seller_id: "seller_1",
            is_advertised: true,
            ad_budget: 800,
            ad_duration: 15,
          },
          {
            id: "3",
            name: "Custom Wardrobe",
            price: "800",
            orders: "67",
            reviews: "28",
            isTopSeller: false,
            image:
              "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80",
            rating: "4.3",
            companyLogo: gigaBytesLogo,
            companyName: "Giga Home Premium",
            description: "Custom designed wardrobe with premium wood finish",
            category_type: "customized",
            usage_type: "indoor",
            product_type: "wardrobe",
            product_categories: ["bedroom"],
            originalPrice: "1000",
            discount: "20%",
            warranty: "6 mon",
            seller_id: "seller_2",
            is_advertised: false,
          },
          {
            id: "4",
            name: "Modern Sofa",
            price: "450",
            orders: "89",
            reviews: "32",
            isTopSeller: true,
            image:
              "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80",
            rating: "4.8",
            companyLogo: gigaBytesLogo,
            companyName: "Giga Home",
            description:
              "Comfortable modern sofa with premium fabric and elegant design",
            category_type: "ready_made",
            usage_type: "indoor",
            product_type: "sofa",
            product_categories: ["living_room"],
            originalPrice: "600",
            discount: "25%",
            warranty: "2 mon",
            seller_id: "seller_1",
            is_advertised: true,
            ad_budget: 800,
            ad_duration: 15,
          },
          {
            id: "5",
            name: "Modern Sofa",
            price: "450",
            orders: "89",
            reviews: "32",
            isTopSeller: true,
            image:
              "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80",
            rating: "4.8",
            companyLogo: gigaBytesLogo,
            companyName: "Giga Home",
            description:
              "Comfortable modern sofa with premium fabric and elegant design",
            category_type: "ready_made",
            usage_type: "indoor",
            product_type: "sofa",
            product_categories: ["living_room"],
            originalPrice: "600",
            discount: "25%",
            warranty: "2 mon",
            seller_id: "seller_1",
            is_advertised: true,
            ad_budget: 800,
            ad_duration: 15,
          },
          {
            id: "6",
            name: "Queen Bed",
            price: "250",
            orders: "124",
            reviews: "45",
            isTopSeller: true,
            image:
              "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=400&q=80",
            rating: "4.5",
            companyLogo: gigaBytesLogo,
            companyName: "Giga Home",
            description:
              "An L-shaped kitchen is a popular and versatile design that consists of twin bed and share bowlw dss",
            category_type: "ready_made",
            usage_type: "indoor",
            product_type: "bed",
            product_categories: ["bedroom"],
            originalPrice: "350",
            discount: "35%",
            warranty: "3 mon",
            seller_id: "seller_1",
            is_advertised: true,
            ad_budget: 500,
            ad_duration: 30,
          },
          {
            id: "7",
            name: "Modern Sofa",
            price: "450",
            orders: "89",
            reviews: "32",
            isTopSeller: true,
            image:
              "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80",
            rating: "4.8",
            companyLogo: gigaBytesLogo,
            companyName: "Giga Home",
            description:
              "Comfortable modern sofa with premium fabric and elegant design",
            category_type: "ready_made",
            usage_type: "indoor",
            product_type: "sofa",
            product_categories: ["living_room"],
            originalPrice: "600",
            discount: "25%",
            warranty: "2 mon",
            seller_id: "seller_1",
            is_advertised: true,
            ad_budget: 800,
            ad_duration: 15,
          },
          {
            id: "8",
            name: "Custom Wardrobe",
            price: "800",
            orders: "67",
            reviews: "28",
            isTopSeller: false,
            image:
              "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80",
            rating: "4.3",
            companyLogo: gigaBytesLogo,
            companyName: "Giga Home Premium",
            description: "Custom designed wardrobe with premium wood finish",
            category_type: "customized",
            usage_type: "indoor",
            product_type: "wardrobe",
            product_categories: ["bedroom"],
            originalPrice: "1000",
            discount: "20%",
            warranty: "6 mon",
            seller_id: "seller_2",
            is_advertised: false,
          },
          {
            id: "9",
            name: "Modern Sofa",
            price: "450",
            orders: "89",
            reviews: "32",
            isTopSeller: true,
            image:
              "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80",
            rating: "4.8",
            companyLogo: gigaBytesLogo,
            companyName: "Giga Home",
            description:
              "Comfortable modern sofa with premium fabric and elegant design",
            category_type: "ready_made",
            usage_type: "indoor",
            product_type: "sofa",
            product_categories: ["living_room"],
            originalPrice: "600",
            discount: "25%",
            warranty: "2 mon",
            seller_id: "seller_1",
            is_advertised: true,
            ad_budget: 800,
            ad_duration: 15,
          },
          {
            id: "10",
            name: "Modern Sofa",
            price: "450",
            orders: "89",
            reviews: "32",
            isTopSeller: true,
            image:
              "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80",
            rating: "4.8",
            companyLogo: gigaBytesLogo,
            companyName: "Giga Home",
            description:
              "Comfortable modern sofa with premium fabric and elegant design",
            category_type: "ready_made",
            usage_type: "indoor",
            product_type: "sofa",
            product_categories: ["living_room"],
            originalPrice: "600",
            discount: "25%",
            warranty: "2 mon",
            seller_id: "seller_1",
            is_advertised: true,
            ad_budget: 800,
            ad_duration: 15,
          },
        ];
        console.log("static products loaded",sampleProducts);
        setRealProducts(sampleProducts);
        console.log("📦 Using sample products");
      }
    } catch (error) {
      console.error("❌ Error loading products from storage:", error);
    }
  };

  console.log(realProducts)
  const loadAdCampaigns = async () => {
    setLoadingAds(true);
    try {
      console.log("🔄 Loading ad campaigns from database...");
      const { data: campaigns, error } = await supabase
        .from("ad_campaigns")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Error loading ad campaigns:", error);
        const savedAds = localStorage.getItem("adCampaigns");
        if (savedAds) {
          const parsedAds = JSON.parse(savedAds);
          const activeAds = parsedAds.filter(
            (ad: any) => ad.status === "active",
          );
          processAds(activeAds);
        }
        return;
      }

      if (campaigns && campaigns.length > 0) {
        processAds(campaigns);
        console.log("✅ Ads loaded from database:", campaigns.length);
      } else {
        console.log("📦 No ads in database");
        localStorage.setItem("adCampaigns", JSON.stringify([]));
      }
    } catch (error) {
      console.error("❌ Error loading ads:", error);
    } finally {
      setLoadingAds(false);
    }
  };

  const processAds = (campaigns: any[]) => {
    const validCampaigns = campaigns.filter((ad) => ad.status === "active");

    const sliderAdsList = validCampaigns.filter(
      (ad) =>
        ad.placement_type === "slider" ||
        ad.is_high_budget ||
        ad.budget_daily >= 500,
    );

    const sidebarAdsList = validCampaigns.filter(
      (ad) =>
        ad.placement_type === "sidebar" ||
        (!ad.is_high_budget && ad.budget_daily < 500),
    );

    const topBrandAdsList = validCampaigns.filter(
      (ad) => ad.placement_type === "top_brand",
    );

    const premiumPartnerAdsList = validCampaigns.filter(
      (ad) => ad.placement_type === "premium_partner",
    );

    setAdCampaigns(validCampaigns);
    setSliderAds(sliderAdsList);
    setSidebarAds(sidebarAdsList);
    setTopBrandAds(topBrandAdsList);
    setPremiumPartnerAds(premiumPartnerAdsList);

    console.log(
      `📊 Ads categorized: ${validCampaigns.length} total, ${sliderAdsList.length} slider, ${sidebarAdsList.length} sidebar, ${topBrandAdsList.length} top brands, ${premiumPartnerAdsList.length} premium partners`,
    );

    localStorage.setItem("adCampaigns", JSON.stringify(validCampaigns));
  };

  const recordAdClick = async (campaignId: string) => {
    try {
      await supabase.rpc("increment_ad_clicks", { campaign_id: campaignId });
      console.log("✅ Ad click recorded:", campaignId);
    } catch (error) {
      console.error("❌ Error recording ad click:", error);
    }
  };

  const recordAdImpression = async (campaignId: string) => {
    try {
      await supabase.rpc("increment_ad_impressions", {
        campaign_id: campaignId,
      });
    } catch (error) {
      console.error("❌ Error recording ad impression:", error);
    }
  };

  const handleAdClick = (ad: AdCampaign) => {
    console.log("📢 Ad clicked:", ad.name);

    recordAdClick(ad.id);

    if (ad.target_url) {
      if (ad.target_url.startsWith("http")) {
        window.open(ad.target_url, "_blank");
      } else {
        if (onNavigate) onNavigate(ad.target_url);
      }
    } else if (ad.seller_id) {
      if (onNavigate) onNavigate(`seller-${ad.seller_id}`);
    } else if (ad.product_id) {
      if (onNavigate) onNavigate(`product-${ad.product_id}`);
    }
  };

  const handleProductClick = (
    productId: string,
    isAd?: boolean,
    adData?: AdCampaign,
  ) => {
    console.log("🖱️ Product clicked:", productId);

    if (isAd && adData) {
      handleAdClick(adData);
    } else {
      const product = realProducts.find((p) => p.id === productId);
      if (product) {
        localStorage.setItem("currentProduct", JSON.stringify(product));
      }

      if (onNavigate) {
        console.log(
          "🔀 Navigating to product details:",
          `product-${productId}`,
        );
        onNavigate(`product-${productId}`);
      } else {
        window.location.href = `#/product/${productId}`;
      }
    }
  };

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem("gigaHomeCart");
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCartItems(parsedCart);
      } catch (error) {
        console.error("Error loading cart from localStorage:", error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (cartItems.length > 0) {
      localStorage.setItem("gigaHomeCart", JSON.stringify(cartItems));
    } else {
      localStorage.removeItem("gigaHomeCart");
    }
  }, [cartItems]);

  useEffect(() => {
    loadProductsFromDatabase();
    loadAdCampaigns();
    fetchCategories();

    const interval = setInterval(() => {
      loadAdCampaigns();
      fetchCategories();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Cart management functions
  const handleAddToCart = (
    productId: string,
    product?: Product,
    isAd?: boolean,
    adData?: AdCampaign,
  ) => {
    if (isAd && adData) {
      handleAdClick(adData);
      return;
    }

    // if (!isLoggedIn) {
    //   setShowAuthModal(true);
    //   setAuthType("signin");
    //   return;
    // }

    const productToAdd =
      product || realProducts.find((p) => p.id === productId);

    if (!productToAdd) {
      console.error("Product not found");
      return;
    }

    setCartItems((prev) => {
      const existingItem = prev.find((item) => item.id === productId);

      if (existingItem) {
        // Update quantity if already in cart
        return prev.map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      } else {
        // Add new item to cart
        const newItem = {
          id: productId,
          product: productToAdd,
          quantity: 1,
        };
        return [...prev, newItem];
      }
    });

    if (onAddToCart) {
      onAddToCart(productId);
    }

    alert(`${productToAdd.name} added to cart!`);
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) {
      handleRemoveFromCart(productId);
      return;
    }

    setCartItems((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, quantity } : item,
      ),
    );
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const getCategorizedSidebarItems = () => {
    const categorized = {
      ready_made: {
        indoor: [] as Category[],
        outdoor: [] as Category[],
        both: [] as Category[],
      },
      customized: {
        indoor: [] as Category[],
        outdoor: [] as Category[],
        both: [] as Category[],
      },
    };

    activeCategories.forEach((category) => {
      if (category.category_type === "ready_made") {
        if (category.usage_type === "indoor") {
          categorized.ready_made.indoor.push(category);
        } else if (category.usage_type === "outdoor") {
          categorized.ready_made.outdoor.push(category);
        } else if (category.usage_type === "both") {
          categorized.ready_made.both.push(category);
        }
      } else if (category.category_type === "customized") {
        if (category.usage_type === "indoor") {
          categorized.customized.indoor.push(category);
        } else if (category.usage_type === "outdoor") {
          categorized.customized.outdoor.push(category);
        } else if (category.usage_type === "both") {
          categorized.customized.both.push(category);
        }
      }
    });

    Object.keys(categorized).forEach((categoryType) => {
      Object.keys(
        categorized[categoryType as keyof typeof categorized],
      ).forEach((usageType) => {
        categorized[categoryType as keyof typeof categorized][
          usageType as keyof typeof categorized.ready_made
        ]?.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      });
    });

    return categorized;
  };

  const allProductCategories = getAllProductCategories();
  const categorizedItems = getCategorizedSidebarItems();

  const filteredProducts = useMemo(() => {
  // If there are no products yet, return realProducts as-is
  if (!realProducts || realProducts.length === 0) return realProducts;

  let filtered = [...realProducts];

  // If an admin category is selected
  if (selectedAdminCategory) {
    const selectedCat = activeCategories.find(
      (cat) => cat.id === selectedAdminCategory
    );

    if (selectedCat) {
      filtered = filtered.filter((product) => {
        if (product.category_id === selectedCat.id) return true;

        if (product.category_type !== selectedCat.category_type) return false;

        if (
          selectedCat.usage_type !== "both" &&
          product.usage_type !== "both" &&
          product.usage_type !== selectedCat.usage_type
        )
          return false;

        if (selectedCat.product_type && product.product_type !== selectedCat.product_type)
          return false;

        if (selectedCat.product_categories?.length > 0) {
          const productCategories = product.product_categories || [];
          const hasMatchingCategory = selectedCat.product_categories.some((cat) =>
            productCategories.includes(cat)
          );
          if (!hasMatchingCategory) return false;
        }

        return true;
      });

      setSelectedProductType(selectedCat.category_type as any);
      setSelectedUsageType(selectedCat.usage_type as any);
      setSelectedProductCategory(null);
    }
  } else {
    // Apply filters based on product type, usage, category
    if (selectedProductType !== "all") {
      filtered = filtered.filter(
        (product) => product.category_type === selectedProductType
      );
    }

    if (selectedUsageType !== "all") {
      filtered = filtered.filter(
        (product) =>
          product.usage_type === selectedUsageType || product.usage_type === "both"
      );
    }

    if (selectedProductCategory) {
      filtered = filtered.filter((product) =>
        (product.product_categories || []).includes(selectedProductCategory)
      );
    }
  }

  // Apply search query filter
  if (searchQuery.trim() !== "") {
    const query = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        (product.brand?.toLowerCase().includes(query)) ||
        (product.companyName?.toLowerCase().includes(query))
    );
  }

  // Filter by kinds
  if (selectedKinds.length > 0) {
    filtered = filtered.filter((product) =>
      selectedKinds.some(
        (kind) =>
          product.name.toLowerCase().includes(kind.toLowerCase()) ||
          product.product_type?.toLowerCase().includes(kind.toLowerCase())
      )
    );
  }

  // Filter by providers
  if (selectedProviders.length > 0) {
    filtered = filtered.filter((product) =>
      selectedProviders.includes(product.companyName)
    );
  }

  // Filter by cities
  if (selectedCities.length > 0) {
    filtered = filtered.filter((product) =>
      selectedCities.some(
        (city) =>
          product.description.toLowerCase().includes(city.toLowerCase()) ||
          product.companyName?.toLowerCase().includes(city.toLowerCase())
      )
    );
  }

  return filtered;
}, [
  realProducts,
  selectedProductType,
  selectedUsageType,
  selectedAdminCategory,
  selectedProductCategory,
  searchQuery,
  selectedKinds,
  selectedProviders,
  selectedCities,
  activeCategories,
]);


  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  const handleAuthInputChange = (field: string, value: string) => {
    setAuthForm((prev) => ({ ...prev, [field]: value }));
    if (authError) setAuthError("");
    if (signupSuccess) setSignupSuccess(false);
  };

  type SignInResult = {
    user?: {
      id: string;
      email: string;
      // add more fields from Supabase user if needed
    } | null;
    error?: string;
  };

const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setAuthLoading(true);
  setAuthError("");

  try {
    console.log("Before signIn", authForm);
   const { data, error } = await supabase.auth.signInWithPassword({
  email: authForm.email,
  password: authForm.password,
});


    console.log("SignIn Result:", data); // <-- fixed

    if (error) {
      setAuthError(error.message);
      return;
    }

    const user = data.user;

    if (!user) {
      setAuthError("User not found");
      return;
    }

    // Success: close modal & reset form
    setShowAuthModal(false);
    setAuthForm({
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      phone: "",
    });

    // Optional: avoid full reload if possible
    window.location.reload();
  } catch (error: any) {
    setAuthError(error.message || "Failed to sign in");
  } finally {
    setAuthLoading(false);
  }
};


  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");

    try {
      if (authForm.password !== authForm.confirmPassword) {
        setAuthError("Passwords do not match");
        return;
      }

      if (authForm.password.length < 6) {
        setAuthError("Password must be at least 6 characters long");
        return;
      }

      const companyName =
        currentUserType === "seller" ? "Giga Home" : undefined;

      const result = await signUp(
        authForm.email,
        authForm.password,
        `${authForm.firstName} ${authForm.lastName}`,
        currentUserType,
        authForm.phone,
        undefined,
        companyName,
      );

      if (result && result.error) {
        setAuthError(result.error || "Failed to create account");
        return;
      }

      if (currentUserType === "seller") {
        setShowAuthModal(false);
        setAuthForm({
          email: "",
          password: "",
          confirmPassword: "",
          firstName: "",
          lastName: "",
          phone: "",
        });
        if (onNavigate) onNavigate("seller-registration");
      } else {
        setSignupSuccess(true);
        setTimeout(() => {
          setShowAuthModal(false);
          window.location.reload();
        }, 2000);
      }
    } catch (error: any) {
      setAuthError(error.message || "Failed to create account");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleToggleWishlist = (productId: string) => {
    if (!isLoggedIn) {
      setShowAuthModal(true);
      setAuthType("signin");
      return;
    }

    if (onToggleWishlist) {
      onToggleWishlist(productId);
    }
  };

  const handlePromoteProduct = (productId: string) => {
    if (!isLoggedIn) {
      setShowAuthModal(true);
      setAuthType("signin");
      return;
    }

    if (userType === "seller") {
      const product = realProducts.find((p) => p.id === productId);
      if (product) {
        localStorage.setItem("selectedProductForAd", JSON.stringify(product));
        if (onNavigate) onNavigate("seller/advertising");
      }
    } else {
      alert("Only sellers can promote products");
    }
  };

  const handleAdminCategorySelect = (categoryId: string) => {
    console.log("Admin category selected:", categoryId);
    setSelectedAdminCategory(categoryId);
    setSelectedProductCategory(null);
  };

  const handleProductCategorySelect = (categoryValue: string) => {
    setSelectedProductCategory(categoryValue);
    setSelectedAdminCategory(null);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const topProviders = [
    { name: "Giga Home", logo: gigaBytesLogo, rating: 4.8 },
    { name: "Giga Home Premium", logo: gigaBytesLogo, rating: 4.9 },
    { name: "Giga Home Express", logo: gigaBytesLogo, rating: 4.7 },
    { name: "Modern Furniture Co", logo: gigaBytesLogo, rating: 4.6 },
    { name: "Royal Designs", logo: gigaBytesLogo, rating: 4.8 },
    { name: "Elite Home", logo: gigaBytesLogo, rating: 4.5 },
    { name: "Premium Living", logo: gigaBytesLogo, rating: 4.7 },
    { name: "Luxury Spaces", logo: gigaBytesLogo, rating: 4.9 },
  ];

  const sliderItems = getSliderImages();

  const saudiCities = [
    "Riyadh",
    "Jeddah",
    "Dammam",
    "Mecca",
    "Medina",
    "Khobar",
    "Dhahran",
    "Tabuk",
    "Abha",
    "Jazan",
  ];

  const furnitureKinds = [
    "Bed",
    "Sofa",
    "Table",
    "Chair",
    "Storage",
    "Cabinet",
    "Lighting",
    "Shelves",
    "Office",
    "Outdoor",
  ];

  const searchCategories = [
    "Living Room Furniture",
    "Bedroom Furniture",
    "Dining Room Furniture",
    "Office Furniture",
    "Outdoor Furniture",
    "Home Decor",
    "Kitchen & Dining",
    "Storage Solutions",
    "Kids Furniture",
  ];

  interface SliderItem {
    id: string;
    type: "default" | "ad";
    image: string;
    title: string;

    description: string;
    isAd: boolean;
    adData?: AdCampaign;
  }

  function getSliderImages(): SliderItem[] {
    const defaultImages = [
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=1200&q=80",
    ];

    if (sliderAds.length > 0) {
      const adSlides = sliderAds.slice(0, 4).map((ad, index) => ({
        id: `ad_${ad.id}`,
        type: "ad" as const,
        adData: ad,
        image:
          ad.images && ad.images.length > 0
            ? ad.images[0]
            : defaultImages[index % defaultImages.length],
        title: ad.name,
        description: ad.description,
        isAd: true,
      }));

      const remainingSlots = 4 - adSlides.length;
      const defaultSlides = defaultImages
        .slice(0, remainingSlots)
        .map((img, index) => ({
          id: `default_${index}`,
          type: "default" as const,
          image: img,
          title: "Premium Furniture",
          description: "Discover perfect pieces for your home",
          isAd: false,
        }));

      return [...adSlides, ...defaultSlides].slice(0, 4);
    }

    return defaultImages.map((img, index) => ({
      id: `default_${index}`,
      type: "default" as const,
      image: img,
      title: "Premium Furniture",
      description: "Discover perfect pieces for your home",
      isAd: false,
    }));
  }

  const CategorySection = ({
    title,
    categories: sectionCategories,
    expanded,
    onToggle,
    type,
  }: {
    title: string;
    categories: Category[];
    expanded: boolean;
    onToggle: () => void;
    type: "ready_made" | "customized";
  }) => {
    if (sectionCategories.length === 0) return null;

    const indoorCategories = sectionCategories.filter(
      (cat) => cat.usage_type === "indoor",
    );
    const outdoorCategories = sectionCategories.filter(
      (cat) => cat.usage_type === "outdoor",
    );
    const bothCategories = sectionCategories.filter(
      (cat) => cat.usage_type === "both",
    );

    return (
      <div className="mb-3">
        <button
          onClick={onToggle}
          className="flex items-center justify-between w-full text-left mb-1"
        >
          <h4 className="font-semibold text-xs text-gray-800">{title}</h4>
          <AiOutlineDown
            className={`w-3 h-3 text-gray-500 transition-transform ${expanded ? "transform rotate-180" : ""}`}
          />
        </button>

        {expanded && (
          <div className="space-y-2 pl-1">
            {indoorCategories.length > 0 && (
              <div className="mb-2">
                <div className="flex items-center justify-between mb-1">
                  <h5 className="text-[11px] font-medium text-gray-700">
                    Indoor
                  </h5>
                  <span className="text-[10px] text-gray-500">
                    {indoorCategories.length}
                  </span>
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {indoorCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleAdminCategorySelect(cat.id)}
                      className={`w-full text-left p-1.5 text-xs rounded hover:bg-gray-100 flex items-center justify-between ${
                        selectedAdminCategory === cat.id
                          ? "bg-blue-50 text-blue-700 font-medium border border-blue-200"
                          : "text-gray-700"
                      }`}
                      title={cat.hierarchy_path || cat.display_name || cat.name}
                    >
                      <span className="truncate flex-1 text-left">
                        {cat.display_name || cat.name}
                      </span>
                      <div className="flex items-center space-x-1 flex-shrink-0">
                        {cat.is_featured && (
                          <span className="bg-yellow-100 text-yellow-800 text-[8px] px-1 rounded">
                            Featured
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {outdoorCategories.length > 0 && (
              <div className="mb-2">
                <div className="flex items-center justify-between mb-1">
                  <h5 className="text-[11px] font-medium text-gray-700">
                    Outdoor
                  </h5>
                  <span className="text-[10px] text-gray-500">
                    {outdoorCategories.length}
                  </span>
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {outdoorCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleAdminCategorySelect(cat.id)}
                      className={`w-full text-left p-1.5 text-xs rounded hover:bg-gray-100 flex items-center justify-between ${
                        selectedAdminCategory === cat.id
                          ? "bg-blue-50 text-blue-700 font-medium border border-blue-200"
                          : "text-gray-700"
                      }`}
                      title={cat.hierarchy_path || cat.display_name || cat.name}
                    >
                      <span className="truncate flex-1 text-left">
                        {cat.display_name || cat.name}
                      </span>
                      <div className="flex items-center space-x-1 flex-shrink-0">
                        {cat.is_featured && (
                          <span className="bg-yellow-100 text-yellow-800 text-[8px] px-1 rounded">
                            Featured
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {bothCategories.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h5 className="text-[11px] font-medium text-gray-700">
                    Both Indoor/Outdoor
                  </h5>
                  <span className="text-[10px] text-gray-500">
                    {bothCategories.length}
                  </span>
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {bothCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleAdminCategorySelect(cat.id)}
                      className={`w-full text-left p-1.5 text-xs rounded hover:bg-gray-100 flex items-center justify-between ${
                        selectedAdminCategory === cat.id
                          ? "bg-blue-50 text-blue-700 font-medium border border-blue-200"
                          : "text-gray-700"
                      }`}
                      title={cat.hierarchy_path || cat.display_name || cat.name}
                    >
                      <span className="truncate flex-1 text-left">
                        {cat.display_name || cat.name}
                      </span>
                      <div className="flex items-center space-x-1 flex-shrink-0">
                        {cat.is_featured && (
                          <span className="bg-yellow-100 text-yellow-800 text-[8px] px-1 rounded">
                            Featured
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const AdProductCard = ({
    ad,
    isSidebar = false,
  }: {
    ad: AdCampaign;
    isSidebar?: boolean;
  }) => {
    const isHighBudget = ad.is_high_budget || ad.budget_daily >= 500;

    return (
      <div
        className={`max-w-sm ${isSidebar ? "bg-white" : "bg-[#F8F8F6]"} rounded-2xl shadow-md p-3 cursor-pointer transform hover:scale-[1.02] active:scale-[0.99] transition border ${isHighBudget ? "border-yellow-300" : "border-gray-200"}`}
        onClick={(e) => {
          e.stopPropagation();
          handleProductClick(ad.product_id || ad.id, true, ad);
        }}
      >
        <div className="relative rounded-xl overflow-hidden mb-2">
          <img
            src={
              ad.images && ad.images.length > 0
                ? ad.images[0]
                : ad.product_image ||
                  "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80"
            }
            alt={ad.name}
            className="w-full h-[160px] object-cover rounded-xl"
          />
          <div className="absolute left-2 top-2 bg-blue-500/90 text-white font-bold text-[9px] w-8 h-8 rounded-full flex items-center justify-center">
            AD
          </div>
          {isHighBudget && (
            <div className="absolute right-2 top-2 bg-yellow-500/90 text-white font-bold text-[9px] px-2 py-1 rounded-full">
              {t.highBudgetAd}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-xs font-bold">$</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {ad.seller_business || ad.seller_name}
              </span>
            </div>
            {isHighBudget && (
              <span className="bg-yellow-100 text-yellow-800 text-[8px] px-1.5 py-0.5 rounded font-semibold">
                PREMIUM
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-black leading-tight line-clamp-1 flex-1 pr-2">
              {ad.product_name || ad.name}
            </h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleWishlist(ad.product_id || ad.id);
              }}
              className={`p-1 rounded-full border transition flex-shrink-0 border-blue-200 bg-blue-50 text-blue-600 hover:border-blue-300`}
            >
              <AiOutlineRocket className="w-3 h-3" />
            </button>
          </div>

          <p className="text-xs text-gray-500 leading-tight line-clamp-2 min-h-[2rem]">
            {ad.description || t.sponsoredContent}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold text-blue-600">
                Budget: ${ad.budget_daily}/day
              </span>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-xs text-blue-600 font-medium">
                {t.sponsored}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-600">
                {t.adImpressions}: {ad.impressions?.toLocaleString() || "0"}
              </span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-600">
                {t.adClicks}: {ad.clicks || "0"}
              </span>
            </div>

            <button
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-3 py-1 rounded-full text-[11px] transition"
              onClick={(e) => {
                e.stopPropagation();
                handleAddToCart(ad.product_id || ad.id, undefined, true, ad);
              }}
            >
              {t.viewDetails}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ProductCard = ({ product }: { product: Product }) => {
    const safeWarranty = String(product.warranty || "3 mon");
    const safeDiscount = String(product.discount || "35%");
    const safeOrders = String(product.orders || "0");
    const safeReviews = String(product.reviews || "0");
    const safeRating = String(product.rating || "4.5");
    const safeCompanyName = String(product.companyName || "Giga Home");
    const safeName = String(product.name || "Product");
    const safeDescription = String(
      product.description ||
        product.shortDescription ||
        "No description available",
    );
    const safePrice = convertPrice(product.price || "0");
    const safeOriginalPrice = product.originalPrice
      ? convertPrice(product.originalPrice)
      : "";

    return (
      <div
        className="max-w-sm bg-[#F8F8F6] rounded-2xl shadow-md p-3 cursor-pointer transform hover:scale-[1.02] active:scale-[0.99] transition"
        onClick={(e) => {
          e.stopPropagation();
          handleProductClick(product.id);
        }}
      >
        <div className="relative rounded-xl overflow-hidden mb-2">
          <img
            src={product.image}
            alt={safeName}
            className="w-full h-[160px] object-cover rounded-xl"
          />
          {product.is_advertised && (
            <div className="absolute left-2 top-2 bg-blue-500/90 text-white font-bold text-[9px] px-2 py-1 rounded-full">
              {t.advertisedProduct}
            </div>
          )}
          {safeDiscount && safeDiscount !== "0%" && !product.is_advertised && (
            <div className="absolute left-2 top-2 bg-orange-500/90 text-white font-bold text-[9px] w-8 h-8 rounded-full flex items-center justify-center">
              {safeDiscount}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img
                src={product.companyLogo}
                alt={safeCompanyName}
                className="w-5 h-5 rounded-full object-cover"
              />
              <span className="text-xs font-medium text-gray-900">
                {safeCompanyName}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {product.isTopSeller && (
                <span className="bg-green-100 text-green-800 text-[8px] px-1.5 py-0.5 rounded font-semibold">
                  Top
                </span>
              )}
              {product.is_advertised && (
                <span className="bg-blue-100 text-blue-800 text-[8px] px-1.5 py-0.5 rounded font-semibold">
                  AD
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-black leading-tight line-clamp-1 flex-1 pr-2">
              {safeName}
            </h3>
            <div className="flex space-x-1">
              {userType === "seller" && product.seller_id && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePromoteProduct(product.id);
                  }}
                  className={`p-1 rounded-full border transition flex-shrink-0 border-blue-200 bg-blue-50 text-blue-600 hover:border-blue-300`}
                  title="Promote this product"
                >
                  <AiOutlineRocket className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleWishlist(product.id);
                }}
                className={`p-1 rounded-full border transition flex-shrink-0 ${
                  wishlistItems.includes(product.id)
                    ? "border-red-200 bg-red-50 text-red-500"
                    : "border-gray-200 bg-white text-gray-600 hover:border-red-200 hover:text-red-500"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3"
                  fill={
                    wishlistItems.includes(product.id) ? "currentColor" : "none"
                  }
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 21.364 4.318 12.682a4.5 4.5 0 010-6.364z"
                  />
                </svg>
              </button>
            </div>
          </div>

          <p className="text-xs text-gray-500 leading-tight line-clamp-2 min-h-[2rem]">
            {safeDescription}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold text-green-600">
                <span className="text-[10px]">
                  {currency === "SAR" ? t.sar : t.usd}
                </span>{" "}
                {safePrice}
              </span>

              {safeOriginalPrice && safeOriginalPrice !== safePrice && (
                <span className="text-[10px] text-gray-400 line-through">
                  {currency === "SAR" ? t.sar : t.usd} {safeOriginalPrice}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7h13l4 4v6a1 1 0 01-1 1h-1m-14 0a1 1 0 001-1v-6a1 1 0 011-1h9"
                />
                <circle cx="7.5" cy="18.5" r="1.5" />
                <circle cx="18.5" cy="18.5" r="1.5" />
              </svg>
              <span className="text-xs text-green-600 font-medium">
                {t.freeDelivery}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.974a1 1 0 00.95.69h4.178c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.974c.3.921-.755 1.688-1.54 1.118L10 13.347l-3.397 2.72c-.785.57-1.84-.197-1.54-1.118l1.287-3.974a1 1 0 00-.364-1.118L2.608 9.4c-.783-.57-.38-1.81.588-1.81h4.178a1 1 0 00.95-.69l1.286-3.974z" />
              </svg>
              <span className="font-semibold text-xs">{safeRating}</span>
            </div>

            <button
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-3 py-1 rounded-full text-[11px] transition"
              onClick={(e) => {
                e.stopPropagation();
                handleAddToCart(product.id, product);
              }}
            >
              {t.order}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Right sidebar advertising images (2 images with increased height)
  const rightSidebarAdImages = [
    {
      id: "ad1",
      image:
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&h=300&q=80",
      title: "Premium Furniture Sale",
      description: "Up to 50% off on luxury items",
      isAd: true,
      link: "#",
      tag: "SPONSORED",
    },
    {
      id: "ad2",
      image:
        "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&h=300&q=80",
      title: "Summer Collection 2024",
      description: "New arrivals with exclusive offers",
      isAd: true,
      link: "#",
      tag: "FEATURED",
    },
  ];

  // console.log("cRart itmessss",cartItems)
  return (
    <div
      className=" min-h-screen font-sans"
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      {/* UPDATED: Light gray top bar */}
      <header className="container rounded-md m-auto bg-gray-300 h-16 w-100 mb-1 mt-3 flex justify-between px-4 py-3 shadow-sm border-b border-gray-200">
        <div className="text-2xl font-bold text-yellow-600 flex items-center space-x-1 h-full">
          <span>🏠</span>
          {/* <span >Giga Home</span> */}
        </div>
        <div className="flex items-center space-x-6 text-gray-600 text-2xl h-9">
          <AiOutlineUser
            className="cursor-pointer hover:text-yellow-600 transition h-6 w-6"
            onClick={() => {
              setShowAuthModal(true);
              setAuthType("signin");
              setSignupSuccess(false);
            }}
          />
          <div className="relative h-6">
            <button
              onClick={() => {
                if (cartItems.length > 0) {
                  if (onNavigate) onNavigate("cart");
                } else {
                  alert("Your cart is empty");
                }
              }}
              className="relative h-6"
            >
              <AiOutlineShoppingCart className="cursor-pointer hover:text-yellow-600 transition h-6 w-6" />
              {cartItems.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                  {cartItems.reduce((total, item) => total + item.quantity, 0)}
                </span>
              )}
            </button>
          </div>
          {isLoggedIn && userType === "seller" && (
            <button
              onClick={() => onNavigate?.("seller/dashboard")}
              className="bg-yellow-500 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-yellow-600 transition h-9"
            >
              {t.seller} Dashboard
            </button>
          )}
          {isLoggedIn && (
            <button
              onClick={() => onNavigate?.("seller/advertising")}
              className="bg-blue-500 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-600 transition flex items-center space-x-2 h-9"
            >
              <AiOutlineRocket className="text-sm" />
              <span className="text-xs">{t.startAdvertising}</span>
            </button>
          )}
        </div>
      </header>
      <header className="container rounded-md  m-auto bg-gray-300 shadow-sm border-b border-gray-200 flex items-center justify-center px-4 py-3 h-16">
        {/* Logo Section */}
        {/* <div className="text-2xl font-bold text-yellow-600 flex items-center space-x-1 h-full">
          <span>🏠</span>
          <span >Giga Home</span>
        </div> */}

        {/* Language & Currency Selectors */}
        {/* <div className="flex items-center space-x-2 mr-4 h-full">
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value as 'en' | 'ar')}
            className="text-sm border border-gray-300 rounded px-2 py-1.5 h-9 bg-white"
          >
            <option value="en">English</option>
            <option value="ar">العربية</option>
          </select>
          <select 
            value={currency}
            onChange={(e) => setCurrency(e.target.value as 'SAR' | 'USD')}
            className="text-sm border border-gray-300 rounded px-2 py-1.5 h-9 bg-white"
          >
            <option value="SAR">SAR</option>
            <option value="USD">USD</option>
          </select>
        </div> */}

        {/* Search Bar */}
        <div className="flex items-center w-1/2 relative h-9">
          <form
            onSubmit={handleSearch}
            className="flex items-center bg-white px-3 py-1.5 rounded-l-full w-full border border-gray-300 shadow-sm h-9"
          >
            <AiOutlineSearch className="text-gray-400 text-lg" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              className="bg-transparent w-full outline-none px-2 text-sm text-gray-800 h-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          <div className="relative h-9">
            <button
              type="button"
              className="bg-yellow-500 text-white px-4 py-1.5 rounded-r-full text-xs font-medium hover:bg-yellow-600 transition h-full border border-yellow-500 flex items-center justify-center"
              onClick={() => setShowSearchModal(!showSearchModal)}
            >
              {t.allCategories} <AiOutlineDown className="ml-1" size={12} />
            </button>

            {showSearchModal && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                <div className="p-3">
                  <h3 className="font-semibold text-gray-800 mb-2 text-sm">
                    {t.allCategories}
                  </h3>
                  <div className="space-y-1 max-h-80 overflow-y-auto">
                    {searchCategories.map((category, index) => (
                      <div
                        key={index}
                        className="p-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer"
                        onClick={() => {
                          setSearchQuery(category);
                          setShowSearchModal(false);
                        }}
                      >
                        {category}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User Actions */}
      </header>

      <div className="container  m-auto bg-gray-100">
        <div className=" relative py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between px-4">
            <div className="bg-black text-white px-4 py-1 rounded-md font-semibold transform -rotate-2 shadow-md text-sm">
              {t.blackFriday}
            </div>
            <h2 className="text-2xl italic font-serif tracking-wider text-gray-700 absolute left-1/2 transform -translate-x-1/2">
              {t.summerSale}
            </h2>
          </div>
        </div>

        <div className="max-w-6xl mx-auto rounded-2xl overflow-hidden shadow-lg mb-6">
          <Swiper
            modules={[Autoplay, Pagination, Navigation]}
            spaceBetween={30}
            centeredSlides
            autoplay={{ delay: 4000, disableOnInteraction: false }}
            pagination={{ clickable: true }}
            navigation
            className="h-[280px]"
          >
            {sliderItems.map((item) => (
              <SwiperSlide key={item.id}>
                <div
                  className="relative w-full h-full cursor-pointer"
                  onClick={() => {
                    if (item.isAd && item.type === "ad") {
                      handleAdClick(item.adData!);
                    }
                  }}
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="absolute bottom-6 left-6 text-white">
                    {item.isAd && (
                      <div className="mb-2">
                        <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold mr-2">
                          {t.sponsored}
                        </span>
                        <span className="bg-yellow-600 text-white px-2 py-1 rounded text-xs font-bold">
                          {t.highBudgetAd}
                        </span>
                      </div>
                    )}
                    <h2 className="text-2xl font-bold mb-1">{item.title}</h2>
                    <p className="text-sm">{item.description}</p>
                    {item.isAd && item.type === "ad" && (
                      <div className="flex items-center space-x-4 mt-2 text-xs text-white/80">
                        <span>{item.adData!.seller_business}</span>
                        <span>•</span>
                        <span>Budget: ${item.adData!.budget_daily}/day</span>
                        <span>•</span>
                        <span>{item.adData!.product_name || "Product Ad"}</span>
                      </div>
                    )}
                  </div>
                  {item.isAd && (
                    <div className="absolute top-4 right-4">
                      <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                        AD
                      </div>
                    </div>
                  )}
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
        <section className="max-w-6xl mx-auto mb-8">
          <div className="flex justify-between items-center mb-4 px-4">
            <h3 className="text-lg font-bold text-gray-800">{t.topBrands}</h3>
            <span className="text-sm text-gray-500">{t.premiumPartners}</span>
          </div>

          <div className="flex justify-center gap-3 px-4 overflow-x-auto">
            {topBrandAds.slice(0, 4).map((ad) => (
              <div
                key={`top_brand_ad_${ad.id}`}
                className="flex-shrink-0 relative group cursor-pointer"
                onClick={() => handleAdClick(ad)}
              >
                <div className="rounded-lg shadow-sm border border-blue-300 overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-105 bg-blue-50">
                  <img
                    src={
                      ad.product_image ||
                      (ad.images && ad.images.length > 0
                        ? ad.images[0]
                        : gigaBytesLogo)
                    }
                    alt={ad.product_name || ad.name}
                    className="h-[80px] w-[120px] object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-blue-600/80 text-white px-2 py-1 rounded text-[10px] font-semibold">
                    AD
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-2">
                    <div className="text-white text-[10px] font-semibold line-clamp-1">
                      {ad.product_name || ad.name}
                    </div>
                    <div className="text-white/80 text-[8px]">
                      ${ad.budget_daily}/day
                    </div>
                  </div>
                </div>

                <div className="absolute -top-1 -right-1 bg-yellow-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold">
                  Top Brand
                </div>
              </div>
            ))}

            {premiumPartnerAds.slice(0, 3).map((ad) => (
              <div
                key={`premium_partner_ad_${ad.id}`}
                className="flex-shrink-0 relative group cursor-pointer"
                onClick={() => handleAdClick(ad)}
              >
                <div className="rounded-lg shadow-sm border border-yellow-300 overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-105 bg-yellow-50">
                  <img
                    src={
                      ad.product_image ||
                      (ad.images && ad.images.length > 0
                        ? ad.images[0]
                        : gigaBytesLogo)
                    }
                    alt={ad.product_name || ad.name}
                    className="h-[80px] w-[120px] object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-yellow-600/80 text-white px-2 py-1 rounded text-[10px] font-semibold">
                    AD
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-2">
                    <div className="text-white text-[10px] font-semibold line-clamp-1">
                      {ad.product_name || ad.name}
                    </div>
                    <div className="text-white/80 text-[8px]">
                      Premium Partner
                    </div>
                  </div>
                </div>

                <div className="absolute -top-1 -right-1 bg-purple-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold">
                  Premium
                </div>
              </div>
            ))}

            {Array(
              9 -
                topBrandAds.slice(0, 4).length -
                premiumPartnerAds.slice(0, 3).length,
            )
              .fill(0)
              .map((_, idx) => (
                <div key={`brand_${idx}`} className="flex-shrink-0">
                  <div className="rounded-lg shadow-sm border border-gray-200 overflow-hidden bg-white">
                    <img
                      src={gigaBytesLogo}
                      alt="Premium Brand"
                      className="h-[80px] w-[120px] object-cover"
                    />
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-[10px] font-semibold">
                      Premium
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </section>
      </div>

      <div className="container grid grid-cols-12 gap-3 m-auto min-h-screen">
        <aside className="col-span-2 bg-gray-100 p-3 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-semibold mb-3 text-gray-800 border-b pb-2 text-xs">
            {t.filters}
          </h3>

          <div className="mb-3">
            <div className="relative">
              <button
                onClick={() => setShowCityDropdown(!showCityDropdown)}
                className="w-full bg-gray-100 text-gray-700 px-2 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-200 transition flex items-center justify-between h-9"
              >
                <span className="text-xs">{t.selectCity}</span>
                <AiOutlineDown size={10} />
              </button>
              {showCityDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-10 max-h-60 overflow-y-auto">
                  {saudiCities.map((city, index) => (
                    <div
                      key={index}
                      className="p-1.5 text-xs text-gray-700 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        if (selectedCities.includes(city)) {
                          setSelectedCities(
                            selectedCities.filter((c) => c !== city),
                          );
                        } else {
                          setSelectedCities([...selectedCities, city]);
                        }
                        setShowCityDropdown(false);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs">{city}</span>
                        {selectedCities.includes(city) && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3 w-3 text-green-500"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selectedCities.length > 0 && (
              <div className="mt-1 text-xs text-gray-600">
                Selected: {selectedCities.join(", ")}
              </div>
            )}
          </div>

          <div className="mb-2">
            <button
              onClick={() => {
                setSelectedProductType("all");
                setSelectedUsageType("all");
                setSelectedAdminCategory(null);
                setSelectedProductCategory(null);
              }}
              className={`w-full py-1.5 rounded text-xs font-semibold transition h-9 ${
                selectedProductType === "all" &&
                selectedUsageType === "all" &&
                !selectedAdminCategory
                  ? "bg-yellow-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              <span className="text-xs">{t.allProducts}</span>
            </button>
          </div>

          <div className="mb-3">
            <div className="flex space-x-1">
              <button
                onClick={() => {
                  setSelectedProductType("ready_made");
                  setSelectedUsageType("all");
                  setSelectedAdminCategory(null);
                  setSelectedProductCategory(null);
                }}
                className={`flex-1 py-1.5 rounded text-xs font-semibold transition h-9 ${
                  selectedProductType === "ready_made"
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                <span className="text-xs">{t.ready}</span>
              </button>
              <button
                onClick={() => {
                  setSelectedProductType("customized");
                  setSelectedUsageType("all");
                  setSelectedAdminCategory(null);
                  setSelectedProductCategory(null);
                }}
                className={`flex-1 py-1.5 rounded text-xs font-semibold transition h-9 ${
                  selectedProductType === "customized"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                <span className="text-xs">{t.customized}</span>
              </button>
            </div>
          </div>

          <div className="mb-3">
            <div className="flex space-x-1">
              <button
                onClick={() => {
                  setSelectedUsageType("indoor");
                  setSelectedProductType("all");
                  setSelectedAdminCategory(null);
                  setSelectedProductCategory(null);
                }}
                className={`flex-1 py-1.5 rounded text-xs font-semibold transition h-9 ${
                  selectedUsageType === "indoor"
                    ? "bg-yellow-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                <span className="text-xs">{t.internal}</span>
              </button>
              <button
                onClick={() => {
                  setSelectedUsageType("outdoor");
                  setSelectedProductType("all");
                  setSelectedAdminCategory(null);
                  setSelectedProductCategory(null);
                }}
                className={`flex-1 py-1.5 rounded text-xs font-semibold transition h-9 ${
                  selectedUsageType === "outdoor"
                    ? "bg-yellow-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                <span className="text-xs">{t.external}</span>
              </button>
            </div>
          </div>

          <div className="mb-3">
            <h4 className="font-semibold text-xs mb-2 text-gray-800 border-b pb-1">
              {t.adminCategories}
            </h4>

            {loadingCategories ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-500 mx-auto"></div>
                <p className="text-xs text-gray-500 mt-2">
                  Loading categories...
                </p>
              </div>
            ) : (
              <>
                <CategorySection
                  title={`${t.readyMade}`}
                  categories={categorizedItems.ready_made.indoor.concat(
                    categorizedItems.ready_made.outdoor,
                    categorizedItems.ready_made.both,
                  )}
                  expanded={expandedSections.readyMade}
                  onToggle={() => toggleSection("readyMade")}
                  type="ready_made"
                />

                <CategorySection
                  title={`${t.customized}`}
                  categories={categorizedItems.customized.indoor.concat(
                    categorizedItems.customized.outdoor,
                    categorizedItems.customized.both,
                  )}
                  expanded={expandedSections.customized}
                  onToggle={() => toggleSection("customized")}
                  type="customized"
                />

                {categories.length === 0 && !loadingCategories && (
                  <div className="text-center py-2 border border-dashed border-gray-300 rounded p-3">
                    <p className="text-xs text-gray-500 mb-2">
                      No admin categories yet
                    </p>
                    <button
                      onClick={() => onNavigate?.("admin/categories")}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Create categories →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-semibold text-xs text-gray-800">
                {t.productCategories}
              </h4>
              <button
                onClick={() => toggleSection("productCategories")}
                className="text-[10px] text-blue-600 hover:text-blue-800"
              >
                {expandedSections.productCategories ? t.showLess : t.showMore}
              </button>
            </div>

            {expandedSections.productCategories && (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {allProductCategories.map((cat, index) => (
                  <button
                    key={index}
                    onClick={() => handleProductCategorySelect(cat.value)}
                    className={`w-full text-left p-1 text-xs rounded hover:bg-gray-100 flex items-center justify-between ${
                      selectedProductCategory === cat.value
                        ? "bg-green-50 text-green-700 font-medium border border-green-200"
                        : "text-gray-700"
                    }`}
                  >
                    <span className="truncate text-xs">{cat.label}</span>
                    <span className="text-[10px] text-gray-500 bg-gray-100 px-1 rounded">
                      {cat.count}
                    </span>
                  </button>
                ))}

                {allProductCategories.length === 0 && !loadingCategories && (
                  <p className="text-xs text-gray-500 text-center py-2">
                    No product categories
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="mb-3">
            <h4 className="font-semibold text-xs mb-1 text-gray-800">
              {t.priceRange}
            </h4>
            <input type="range" min="50" max="5000" className="w-full mb-1" />
            <div className="flex justify-between text-[10px] text-gray-500">
              <span>{currency === "SAR" ? t.sar : t.usd} 50</span>
              <span>{currency === "SAR" ? t.sar : t.usd} 5000</span>
            </div>
          </div>

          <div className="mb-3 ">
            <h4 className="font-semibold text-xs mb-1 text-gray-800">
              {t.topProviders}
            </h4>
            <div className="space-y-1  max-h-40 overflow-y-auto">
              {topProviders.map((provider, index) => (
                <label
                  key={index}
                  className="flex items-center space-x-1 cursor-pointer p-1 hover:bg-gray-50 rounded"
                >
                  <input
                    type="checkbox"
                    checked={selectedProviders.includes(provider.name)}
                    onChange={() => {
                      if (selectedProviders.includes(provider.name)) {
                        setSelectedProviders(
                          selectedProviders.filter((p) => p !== provider.name),
                        );
                      } else {
                        setSelectedProviders([
                          ...selectedProviders,
                          provider.name,
                        ]);
                      }
                    }}
                    className="rounded text-yellow-500 focus:ring-yellow-500 h-3 w-3"
                  />
                  <img
                    src={provider.logo}
                    alt={provider.name}
                    className="w-4 h-4 rounded-full object-cover"
                  />
                  <span className="text-xs text-gray-700">{provider.name}</span>
                  <span className="text-xs text-yellow-500 ml-auto">
                    ★ {provider.rating}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              setSelectedProductType("all");
              setSelectedUsageType("all");
              setSelectedAdminCategory(null);
              setSelectedProductCategory(null);
              setSelectedKinds([]);
              setSelectedProviders([]);
              setSelectedCities([]);
              setSearchQuery("");
            }}
            className="w-full mt-3 bg-gray-200 text-gray-700 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-300 transition h-9"
          >
            <span className="text-xs">{t.clearFilters}</span>
          </button>
        </aside>

        <main className="col-span-8 bg-white p-4 rounded-x border-gray-100">
          <div className="p-0 flex items-center justify-between">
            <div className="text-sm text-gray-600 hidden">
              {/* {t.showingProducts.replace(
                "{count}",
                filteredProducts.length.toString(),
              )} */}

               {selectedAdminCategory && (
                <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                  {activeCategories.find((c) => c.id === selectedAdminCategory)
                    ?.display_name || "Selected Category"}
                </span>
              )} 

              {selectedProductType !== "all" && !selectedAdminCategory && (
                <span className="ml-2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                  {selectedProductType === "ready_made"
                    ? t.readyMade
                    : t.customized}
                </span>
              )}

              {selectedUsageType !== "all" && !selectedAdminCategory && (
                <span className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                  {selectedUsageType === "indoor"
                    ? "Indoor"
                    : selectedUsageType === "outdoor"
                      ? "Outdoor"
                      : "Both"}
                </span>
              )}

              {selectedProductCategory && (
                <span className="ml-2 bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                  {selectedProductCategory.replace(/_/g, " ")}
                </span>
              )}

              {selectedKinds.length > 0 && (
                <span className="ml-2 bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                  {selectedKinds.length} kinds
                </span>
              )}

              {selectedProviders.length > 0 && (
                <span className="ml-2 bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                  {selectedProviders.length} providers
                </span>
              )}

              {selectedCities.length > 0 && (
                <span className="ml-2 bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                  {selectedCities.length} cities
                </span>
              )}

              {searchQuery && (
                <span className="ml-2 bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                  Search: "{searchQuery}"
                </span>
              )}
            </div>
            {/* <div className="flex gap-2">
              <button
                onClick={() => {
                  loadProductsFromDatabase();
                  fetchCategories();
                }}
                className="bg-blue-500 text-white px-3 py-1.5 rounded text-xs hover:bg-blue-600 transition h-9"
              >
                <span className="text-xs">Refresh</span>
              </button>
              {selectedAdminCategory && (
                <button
                  onClick={() => setSelectedAdminCategory(null)}
                  className="bg-red-100 text-red-700 px-3 py-1.5 rounded text-xs hover:bg-red-200 transition h-9"
                >
                  <span className="text-xs">Clear Category</span>
                </button>
              )}
            </div> */}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {/* {loadingProducts ? (
              Array(10)
                .fill(0)
                .map((_, idx) => (
                  <div
                    key={idx}
                    className="bg-[#F8F8F6] rounded-2xl shadow-md p-3 animate-pulse"
                  >
                    <div className="h-[160px] bg-gray-200 rounded-xl mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded"></div>
                  </div>
                ))
            ) : filteredProducts?.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  {t.noProducts}
                </h3>
                <p className="text-gray-500 mb-4">{t.tryAdjusting}</p>
                <button
                  onClick={() => {
                    setSelectedProductType("all");
                    setSelectedUsageType("all");
                    setSelectedAdminCategory(null);
                    setSelectedProductCategory(null);
                    setSelectedKinds([]);
                    setSelectedProviders([]);
                    setSelectedCities([]);
                    setSearchQuery("");
                  }}
                  className="bg-yellow-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-yellow-600 transition h-9"
                >
                  <span className="text-sm">{t.clearAllFilters}</span>
                </button>
              </div>
            ) : (
              filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            )} */}
            {
filteredProducts.length === 0 ? (
<div className="col-span-full text-center py-12">
  No products found.
</div>) : (
             filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            )
            }
          </div>
        </main>
        {/* right */}
        <aside className="col-span-2">
          <div className="sticky top-4 space-y-4 h-full">
            {/* 2 Advertising Images in Right Sidebar with Increased Height */}
            {/* <div className="space-y-4 h-[700px] mb-4">
              {rightSidebarAdImages.map((ad) => (
                <div
                  key={ad.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden group cursor-pointer relative"
                  onClick={() => {
                    // console.log("Ad clicked:", ad.title);
                    // Handle ad click
                  }}
                >
                  <div className="relative">
                    <img
                      src={ad.image}
                      alt={ad.title}
                      className="w-full h-64 object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute top-2 right-2">
                      <div className="bg-blue-600 text-white px-2 py-1 rounded-full text-[10px] font-bold">
                        {ad.tag}
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                      <h4 className="text-white font-semibold text-sm mb-1">
                        {ad.title}
                      </h4>
                      <p className="text-white/90 text-xs mb-2">
                        {ad.description}
                      </p>
                      <button className="bg-yellow-500 text-black px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-yellow-600 transition">
                        Shop Now
                      </button>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-500">
                        Sponsored Content
                      </span>
                      <span className="text-[10px] text-blue-600 font-medium">
                        AD
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div> */}
            <div className=" overflow-y-auto space-y-4 mb-4 ">
              {rightSidebarAdImages.map((ad) => (
                <div
                  key={ad.id}
                  className="overflow-hidden rounded-xl h-96  w-full cursor-pointer "
                  onClick={() => {
                    // Handle ad click here
                  }}
                >
                  <img
                    src={ad.image}
                    alt="Ad"
                    className="w-full h-full object-cover rounded-xl transition-transform duration-300 hover:scale-105"
                  />
                </div>
              ))}
            </div>

            {isLoggedIn && (
              <div className="bg-blue-500 rounded-lg p-3 text-white shadow-sm">
                <AiOutlineRocket className="text-sm mb-1" />
                <h4 className="font-bold text-xs mb-1">{t.boostSales}</h4>
                <p className="text-blue-100 text-[10px] mb-2">
                  {t.reachCustomers}
                </p>
                <button
                  onClick={() => onNavigate?.("seller/advertising")}
                  className="w-full bg-white text-blue-600 py-1.5 rounded text-xs font-bold hover:bg-gray-100 transition h-9"
                >
                  <span className="text-xs">{t.startAdvertising}</span>
                </button>
              </div>
            )}
               {/* premium ads  */} 

            {/* <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-sm text-gray-900">
                  {t.premiumAds}
                </h4>
                <span className="text-xs text-blue-600 font-semibold">
                  {sidebarAds.length} {t.sponsored}
                </span>
              </div>

              {loadingAds ? (
                Array(3)
                  .fill(0)
                  .map((_, idx) => (
                    <div key={idx} className="mb-3">
                      <div className="h-32 bg-gray-200 rounded-lg animate-pulse mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))
              ) : sidebarAds.length === 0 ? (
                <div className="text-center py-4">
                  <div className="text-gray-400 text-4xl mb-2">📢</div>
                  <p className="text-gray-600 text-xs">{t.noProducts}</p>
                  <p className="text-gray-500 text-[10px] mt-1">
                    No active ads
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sidebarAds.slice(0, 3).map((ad) => (
                    <AdProductCard key={ad.id} ad={ad} isSidebar={true} />
                  ))}
                </div>
              )}

              {sidebarAds.length > 3 && (
                <button
                  onClick={() => onNavigate?.("seller/advertising")}
                  className="w-full mt-3 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition h-9"
                >
                  <span className="text-xs">View All Ads →</span>
                </button>
              )}
            </div> */}

            {/* <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden group cursor-pointer h-48 relative">
              <img
                src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=300&q=80"
                alt="Special Offer 1"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                <h4 className="text-white font-semibold text-sm">
                  {t.premiumCollection}
                </h4>
                <p className="text-white/80 text-xs">{t.upToOff}</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden group cursor-pointer h-48 relative">
              <img
                src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=300&q=80"
                alt="Special Offer 2"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                <h4 className="text-white font-semibold text-sm">
                  {t.luxuryFurniture}
                </h4>
                <p className="text-white/80 text-xs">{t.limitedTime}</p>
              </div>
            </div> */}
          </div>
        </aside>
      </div>

      {/* <footer className="bg-gray-900 text-white mt-12 ">
        <div className="max-w-[1400px] mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold text-yellow-500 mb-4 flex items-center">
                <span className="mr-2">🏠</span>
                <span>Giga Home</span>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Your premier destination for premium furniture and home decor
                solutions in Saudi Arabia. Bringing quality and style to every
                home.
              </p>
              <div className="flex space-x-3">
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition"
                >
                  <AiOutlineFacebook size={20} />
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition"
                >
                  <AiOutlineTwitter size={20} />
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition"
                >
                  <AiOutlineInstagram size={20} />
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition"
                >
                  <AiOutlineYoutube size={20} />
                </a>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">{t.quickLinks}</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-yellow-500 transition text-sm"
                  >
                    Home
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-yellow-500 transition text-sm"
                  >
                    Shop
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-yellow-500 transition text-sm"
                  >
                    About Us
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-yellow-500 transition text-sm"
                  >
                    Contact
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-yellow-500 transition text-sm"
                  >
                    Careers
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-yellow-500 transition text-sm"
                  >
                    Become a Seller
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">{t.categories}</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-yellow-500 transition text-sm"
                  >
                    Living Room Furniture
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-yellow-500 transition text-sm"
                  >
                    Bedroom Sets
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-yellow-500 transition text-sm"
                  >
                    Kitchen & Dining
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-yellow-500 transition text-sm"
                  >
                    Office Furniture
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-yellow-500 transition text-sm"
                  >
                    Outdoor Furniture
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-yellow-500 transition text-sm"
                  >
                    Home Decor
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">{t.contact}</h3>
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="mt-1 mr-3 text-yellow-500">📍</div>
                  <div>
                    <p className="text-gray-400 text-sm">
                      Riyadh, Saudi Arabia
                    </p>
                    <p className="text-gray-400 text-sm">
                      King Fahd Road, Al Olaya District
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="mr-3 text-yellow-500">📞</div>
                  <p className="text-gray-400 text-sm">+966 11 123 4567</p>
                </div>
                <div className="flex items-center">
                  <div className="mr-3 text-yellow-500">✉️</div>
                  <p className="text-gray-400 text-sm">info@gigahome.com</p>
                </div>
                <div className="flex items-center">
                  <div className="mr-3 text-yellow-500">⏰</div>
                  <p className="text-gray-400 text-sm">Sun-Thu: 9AM - 10PM</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-gray-400 text-sm mb-4 md:mb-0">
                © 2024 Giga Home. {t.rights}
              </div>
              <div className="flex flex-wrap gap-4">
                <a
                  href="#"
                  className="text-gray-400 hover:text-white text-sm transition"
                >
                  Privacy Policy
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white text-sm transition"
                >
                  Terms of Service
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white text-sm transition"
                >
                  Cookie Policy
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white text-sm transition"
                >
                  Return Policy
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white text-sm transition"
                >
                  Shipping Policy
                </a>
              </div>
            </div>
            <div className="text-center text-gray-500 text-xs mt-4">
              Giga Home is registered with the Ministry of Commerce, Saudi
              Arabia. CR No: 1010123456
            </div>
          </div>
        </div>
      </footer> */}
<footer className="bg-gray-900 text-white mt-12">
  <div className="justify-between mx-auto px-6 ">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
      
      {/* Brand */}
      <div>
        <div className="flex items-center mb-4">
          <span className="text-3xl mr-2">🏠</span>
          <span className="text-2xl font-bold text-yellow-500">Giga Home</span>
        </div>
        <p className="text-gray-400 text-sm leading-relaxed mb-4">
          Your premier destination for premium furniture and home decor solutions in Saudi Arabia. Bringing quality and style to every home.
        </p>
        <div className="flex space-x-4">
          <a href="#" className="text-gray-400 hover:text-white transition">
            <AiOutlineFacebook size={22} />
          </a>
          <a href="#" className="text-gray-400 hover:text-white transition">
            <AiOutlineTwitter size={22} />
          </a>
          <a href="#" className="text-gray-400 hover:text-white transition">
            <AiOutlineInstagram size={22} />
          </a>
          <a href="#" className="text-gray-400 hover:text-white transition">
            <AiOutlineYoutube size={22} />
          </a>
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <h3 className="font-semibold text-lg ">{t.quickLinks}</h3>
        <ul className="space-y-2">
          {["Home", "Shop", "About Us", "Contact", "Careers", "Become a Seller"].map((link) => (
            <li key={link}>
              <a
                href="#"
                className="text-gray-400 hover:text-yellow-500 transition text-sm"
              >
                {link}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Categories */}
      <div>
        <h3 className="font-semibold text-lg ">{t.categories}</h3>
        <ul className="space-y-2">
          {[
            "Living Room Furniture",
            "Bedroom Sets",
            "Kitchen & Dining",
            "Office Furniture",
            "Outdoor Furniture",
            "Home Decor",
          ].map((cat) => (
            <li key={cat}>
              <a
                href="#"
                className="text-gray-400 hover:text-yellow-500 transition text-sm"
              >
                {cat}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Contact */}
      <div>
        <h3 className="font-semibold text-lg ">{t.contact}</h3>
        <div className="space-y-3 text-sm text-gray-400">
          <div className="flex items-start">
            <span className="mr-3 text-yellow-500 mt-1">📍</span>
            <div>
              <p>Riyadh, Saudi Arabia</p>
              <p>King Fahd Road, Al Olaya District</p>
            </div>
          </div>
          <div className="flex items-center">
            <span className="mr-3 text-yellow-500">📞</span>
            <p>+966 11 123 4567</p>
          </div>
          <div className="flex items-center">
            <span className="mr-3 text-yellow-500">✉️</span>
            <p>info@gigahome.com</p>
          </div>
          <div className="flex items-center">
            <span className="mr-3 text-yellow-500">⏰</span>
            <p>Sun-Thu: 9AM - 10PM</p>
          </div>
        </div>
      </div>
    </div>

    {/* Bottom Section */}
    <div className="border-t border-gray-800 mt-8 pt-6 pb-4">
  <div className="flex flex-col md:flex-row justify-between items-center gap-4">
    {/* Left side: copyright */}
    <div className="text-gray-400 text-sm text-center md:text-left">
      © 2024 Giga Home. {t.rights}
    </div>

    {/* Right side: policies */}
    <div className="flex flex-wrap justify-center md:justify-end gap-4">
      {[
        "Privacy Policy",
        "Terms of Service",
        "Cookie Policy",
        "Return Policy",
        "Shipping Policy",
      ].map((policy) => (
        <a
          key={policy}
          href="#"
          className="text-gray-400 hover:text-white text-sm transition"
        >
          {policy}
        </a>
      ))}
    </div>
  </div>

  {/* Bottom line */}
  <div className="text-center text-gray-500 text-xs mt-4">
    Giga Home is registered with the Ministry of Commerce, Saudi Arabia. CR No: 1010123456
  </div>
</div>

  </div>
</footer>

      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 relative">
            <button
              onClick={() => {
                setShowAuthModal(false);
                setAuthError("");
                setSignupSuccess(false);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
            >
              <AiOutlineClose size={20} />
            </button>

            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {authType === "signin" ? t.signIn : t.signUp}
              </h2>
              <p className="text-gray-600 mt-2 text-sm">
                {authType === "signin" ? t.welcomeBack : t.joinToday}
              </p>
            </div>

            {signupSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-600 text-sm text-center">
                  {currentUserType === "seller"
                    ? t.sellerRegistration
                    : "Buyer account created successfully! Redirecting..."}
                </p>
              </div>
            )}

            {authError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm text-center">{authError}</p>
              </div>
            )}

            <div className="flex space-x-4 mb-6">
              <button
                onClick={() => setCurrentUserType("buyer")}
                className={`flex-1 py-3 rounded-lg border-2 text-sm font-semibold transition ${
                  currentUserType === "buyer"
                    ? "border-yellow-500 bg-yellow-50 text-yellow-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                👤 <span className="text-sm">{t.buyer}</span>
              </button>
              <button
                onClick={() => setCurrentUserType("seller")}
                className={`flex-1 py-3 rounded-lg border-2 text-sm font-semibold transition ${
                  currentUserType === "seller"
                    ? "border-yellow-500 bg-yellow-50 text-yellow-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                🏪 <span className="text-sm">{t.seller}</span>
              </button>
            </div>

            <form
              onSubmit={authType === "signin" ? handleSignIn : handleSignUp}
            >
              <div className="space-y-4">
                {authType === "signup" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t.firstName}
                        </label>
                        <input
                          type="text"
                          required
                          value={authForm.firstName}
                          onChange={(e) =>
                            handleAuthInputChange("firstName", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-sm"
                          placeholder="John"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t.lastName}
                        </label>
                        <input
                          type="text"
                          required
                          value={authForm.lastName}
                          onChange={(e) =>
                            handleAuthInputChange("lastName", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-sm"
                          placeholder="Doe"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t.phoneNumber}
                      </label>
                      <input
                        type="tel"
                        required
                        value={authForm.phone}
                        onChange={(e) =>
                          handleAuthInputChange("phone", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-sm"
                        placeholder="+966 5X XXX XXXX"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.email}
                  </label>
                  <input
                    type="email"
                    required
                    value={authForm.email}
                    onChange={(e) =>
                      handleAuthInputChange("email", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-sm"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.password}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={authForm.password}
                      onChange={(e) =>
                        handleAuthInputChange("password", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 pr-10 text-sm"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <AiOutlineEyeInvisible size={18} />
                      ) : (
                        <AiOutlineEye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                {authType === "signup" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.confirmPassword}
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={authForm.confirmPassword}
                      onChange={(e) =>
                        handleAuthInputChange("confirmPassword", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-sm"
                      placeholder="••••••••"
                    />
                  </div>
                )}

                {authType === "signin" && (
                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded text-yellow-500 focus:ring-yellow-500"
                      />
                      <span className="ml-2 text-sm text-gray-600">
                        {t.rememberMe}
                      </span>
                    </label>
                    <button
                      type="button"
                      className="text-sm text-yellow-600 hover:text-yellow-700 font-medium"
                    >
                      {t.forgotPassword}
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className={`w-full bg-yellow-500 text-white py-3 rounded-lg font-semibold hover:bg-yellow-600 transition mt-6 ${
                  authLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <span className="text-sm">
                  {authLoading
                    ? "Please wait..."
                    : authType === "signin"
                      ? t.signIn
                      : currentUserType === "seller"
                        ? t.continueSeller
                        : t.createAccount}
                </span>
              </button>
            </form>

            <div className="text-center mt-4">
              <p className="text-gray-600 text-sm">
                {authType === "signin"
                  ? t.dontHaveAccount
                  : t.alreadyHaveAccount}
                <button
                  type="button"
                  onClick={() => {
                    setAuthType(authType === "signin" ? "signup" : "signin");
                    setAuthError("");
                    setSignupSuccess(false);
                  }}
                  className="text-yellow-600 hover:text-yellow-700 font-medium ml-1 text-sm"
                >
                  {authType === "signin" ? t.signUp : t.signIn}
                </button>
              </p>
            </div>

            {authType === "signup" && currentUserType === "seller" && (
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800 text-center">
                  {t.sellerRegistration}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
