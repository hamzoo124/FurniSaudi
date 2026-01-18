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
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface HomePageProps {
  onAuthSuccess?: (userType: 'buyer' | 'seller' | 'admin') => void;
  isLoggedIn?: boolean;
  userType?: 'buyer' | 'seller' | 'admin' | null;
  onNavigate?: (page: string) => void;
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
  type: 'ready' | 'customized';
  stock?: number;
  brand?: string;
  status?: string;
  originalPrice?: string;
  discount?: string;
  warranty?: string;
  shortDescription?: string;
  category?: string;
  placement?: 'indoor' | 'outdoor';
  section?: string;
  finishType?: string;
  primaryColor?: string;
  availableColors?: string[];
  dimensions?: {
    length: string;
    width: string;
    height: string;
    unit: 'cm' | 'inches';
  };
  weight?: string;
  variants?: any[];
  shipping?: any;
  policies?: any;
}

interface AdCampaign {
  id: string;
  name: string;
  platform: 'own-platform' | 'facebook' | 'instagram' | 'google' | 'twitter';
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
}

interface AuthResult {
  error?: string;
  user?: any;
  data?: any;
}

const HomePage: React.FC<HomePageProps> = ({ 
  onAuthSuccess, 
  isLoggedIn, 
  userType,
  onNavigate 
}) => {
  const { signIn, signUp } = useAuth();
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authType, setAuthType] = useState<"signin" | "signup">("signin");
  const [currentUserType, setCurrentUserType] = useState<"buyer" | "seller">("buyer");
  const [selectedProductType, setSelectedProductType] = useState<"all" | "ready" | "customized">("all");
  const [selectedCategoryType, setSelectedCategoryType] = useState("internal");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKinds, setSelectedKinds] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [wishlistItems, setWishlistItems] = useState<string[]>([]);
  const [cartItems, setCartItems] = useState<string[]>([]);
  const [realProducts, setRealProducts] = useState<Product[]>([]);
  const [adCampaigns, setAdCampaigns] = useState<AdCampaign[]>([]);
  const [authError, setAuthError] = useState<string>("");
  const [authLoading, setAuthLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [currency, setCurrency] = useState<'SAR' | 'USD'>('SAR');
  const [language, setLanguage] = useState<'en' | 'ar'>('en');
  
  const [authForm, setAuthForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const gigaBytesLogo = "https://i.pinimg.com/736x/bb/fa/77/bbfa7777e9b4091b9ba254b407914b65.jpg";

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
      sellerRegistration: "Seller Registration: You'll be redirected to complete your business details after account creation.",
      blackFriday: "Black Friday",
      summerSale: "50% Off Summer Time",
      topBrands: "Top Brands",
      premiumPartners: "Premium Partners",
      filters: "Filters",
      selectCity: "Select City",
      allProducts: "All Products",
      ready: "Ready",
      customized: "Customized",
      internal: "Internal",
      external: "External",
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
      usd: "USD"
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
      sellerRegistration: "تسجيل البائع: سيتم توجيهك لإكمال تفاصيل عملك بعد إنشاء الحساب.",
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
      usd: "دولار"
    }
  };

  const t = translations[language];
  const exchangeRate = 3.75;

  const convertPrice = (price: string): string => {
    if (!price) return '0';
    const numericPrice = parseFloat(price.replace(/[^0-9.]/g, ''));
    if (isNaN(numericPrice)) return '0';
    if (currency === 'USD') {
      return (numericPrice / exchangeRate).toFixed(2);
    }
    return numericPrice.toString();
  };

  // Load products from localStorage
  const loadProductsFromStorage = () => {
    try {
      const savedProducts = localStorage.getItem('furnitureProducts');
      if (savedProducts) {
        const parsedProducts = JSON.parse(savedProducts);
        const convertedProducts: Product[] = parsedProducts.map((product: any) => ({
          id: product.id || `prod_${Date.now()}`,
          name: product.name || 'Unnamed Product',
          price: String(product.price || '250'),
          orders: String(product.orders || '0'),
          reviews: String(product.reviews || '0'),
          isTopSeller: product.isTopSeller || product.status === 'active',
          image: product.image || (product.images && product.images.length > 0 
            ? product.images[0] 
            : "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80"),
          rating: String(product.rating || '4.5'),
          companyLogo: product.companyLogo || gigaBytesLogo,
          companyName: product.companyName || "Giga Home",
          description: product.description || product.shortDescription || 'Premium furniture product',
          type: product.type || 'ready',
          stock: product.stock,
          brand: product.brand,
          status: product.status,
          originalPrice: product.originalPrice || '350',
          discount: String(product.discount || '35%'),
          warranty: String(product.warranty || '3 mon'),
          shortDescription: product.shortDescription,
          category: product.category,
          placement: product.placement,
          section: product.section,
          finishType: product.finishType,
          primaryColor: product.primaryColor,
          availableColors: product.availableColors,
          dimensions: product.dimensions,
          weight: product.weight,
          variants: product.variants,
          shipping: product.shipping,
          policies: product.policies
        }));
        
        setRealProducts(convertedProducts);
      } else {
        const sampleProducts: Product[] = [
          {
            id: '1',
            name: 'Queen Bed',
            price: '250',
            orders: '124',
            reviews: '45',
            isTopSeller: true,
            image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=400&q=80',
            rating: '4.5',
            companyLogo: gigaBytesLogo,
            companyName: 'Giga Home',
            description: 'An L-shaped kitchen is a popular and versatile design that consists of twin bed and share bowlw dss',
            type: 'ready',
            originalPrice: '350',
            discount: '35%',
            warranty: '3 mon'
          },
          {
            id: '2',
            name: 'Modern Sofa',
            price: '450',
            orders: '89',
            reviews: '32',
            isTopSeller: true,
            image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80',
            rating: '4.8',
            companyLogo: gigaBytesLogo,
            companyName: 'Giga Home',
            description: 'Comfortable modern sofa with premium fabric and elegant design',
            type: 'ready',
            originalPrice: '600',
            discount: '25%',
            warranty: '2 mon'
          },
          {
            id: '3',
            name: 'Custom Wardrobe',
            price: '800',
            orders: '67',
            reviews: '28',
            isTopSeller: false,
            image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80',
            rating: '4.3',
            companyLogo: gigaBytesLogo,
            companyName: 'Giga Bytes Premium',
            description: 'Custom designed wardrobe with premium wood finish',
            type: 'customized',
            originalPrice: '1000',
            discount: '20%',
            warranty: '6 mon'
          }
        ];
        setRealProducts(sampleProducts);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      const sampleProducts: Product[] = [
        {
          id: '1',
          name: 'Queen Bed',
          price: '250',
          orders: '124',
          reviews: '45',
          isTopSeller: true,
          image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=400&q=80',
          rating: '4.5',
          companyLogo: gigaBytesLogo,
          companyName: 'Giga Home',
          description: 'An L-shaped kitchen is a popular and versatile design that consists of twin bed and share bowlw dss',
          type: 'ready',
          originalPrice: '350',
          discount: '35%',
          warranty: '3 mon'
        }
      ];
      setRealProducts(sampleProducts);
    }
  };

  // Load ad campaigns from localStorage
  const loadAdCampaigns = () => {
    try {
      const savedAds = localStorage.getItem('adCampaigns');
      if (savedAds) {
        const campaigns = JSON.parse(savedAds);
        const activeCampaigns = campaigns.filter((ad: AdCampaign) => ad.status === 'active');
        setAdCampaigns(activeCampaigns);
      }
    } catch (error) {
      console.error('Error loading ads:', error);
      setAdCampaigns([]);
    }
  };

  useEffect(() => {
    loadProductsFromStorage();
    loadAdCampaigns();

    const handleStorageChange = () => {
      loadProductsFromStorage();
      loadAdCampaigns();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleStorageChange);
    };
  }, []);

  // Get active ads
  const activeAds = useMemo(() => {
    return adCampaigns.filter(ad => ad.status === 'active');
  }, [adCampaigns]);

  // Create combined sponsored brands + ads array for the Top Brands section
  const sponsoredBrandsWithAds = useMemo(() => {
    // Default sponsored brands (9 images)
    const defaultSponsoredImages = Array(9).fill(gigaBytesLogo);
    
    // If there are active ads, replace some default images with ads
    if (activeAds.length > 0) {
      const result = [...defaultSponsoredImages];
      
      // Replace positions 2, 5, 8 (every 3rd starting from index 2) with ads
      // This ensures ads are spread out in the grid
      const adPositions = [1, 4, 7]; // Positions to show ads (0-indexed)
      
      activeAds.slice(0, 3).forEach((ad, index) => {
        if (index < adPositions.length) {
          result[adPositions[index]] = {
            isAd: true,
            adData: ad,
            image: ad.images && ad.images.length > 0 
              ? ad.images[0] 
              : "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop",
            name: ad.name,
            companyName: "Sponsored Ad"
          };
        }
      });
      
      return result;
    }
    
    // If no ads, return all default images
    return defaultSponsoredImages;
  }, [activeAds]);

  // Filter products based on search and filters
  const filteredProducts = useMemo(() => {
    let filtered = [...realProducts];

    // Product type filter
    if (selectedProductType !== "all") {
      filtered = filtered.filter(product => product.type === selectedProductType);
    }

    // Search query filter - FIXED: Now actually searches
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        (product.brand && product.brand.toLowerCase().includes(query)) ||
        (product.category && product.category.toLowerCase().includes(query)) ||
        (product.companyName && product.companyName.toLowerCase().includes(query))
      );
    }

    // Kinds filter
    if (selectedKinds.length > 0) {
      filtered = filtered.filter(product => 
        selectedKinds.some(kind => 
          product.name.toLowerCase().includes(kind.toLowerCase()) ||
          (product.category && product.category.toLowerCase().includes(kind.toLowerCase()))
        )
      );
    }

    // Providers filter
    if (selectedProviders.length > 0) {
      filtered = filtered.filter(product => 
        selectedProviders.includes(product.companyName)
      );
    }

    // Category type filter
    if (selectedCategoryType === "internal") {
      filtered = filtered.filter(product => product.placement !== 'outdoor');
    } else if (selectedCategoryType === "external") {
      filtered = filtered.filter(product => product.placement === 'outdoor');
    }

    // Cities filter
    if (selectedCities.length > 0) {
      filtered = filtered.filter(product => 
        selectedCities.some(city => 
          product.description.toLowerCase().includes(city.toLowerCase()) ||
          (product.companyName && product.companyName.toLowerCase().includes(city.toLowerCase()))
        )
      );
    }

    return filtered;
  }, [realProducts, selectedProductType, searchQuery, selectedKinds, selectedProviders, selectedCategoryType, selectedCities]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Search is handled by filteredProducts
  };

  const handleAuthInputChange = (field: string, value: string) => {
    setAuthForm(prev => ({ ...prev, [field]: value }));
    if (authError) setAuthError("");
    if (signupSuccess) setSignupSuccess(false);
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");

    try {
      const result: AuthResult = await signIn(authForm.email, authForm.password);
      
      if (result.error) {
        setAuthError(result.error || "Failed to sign in");
        return;
      }

      const user = result.user || result.data?.user;
      
      if (user) {
        const userType = user.user_metadata?.user_type || 'buyer';
        
        if (onAuthSuccess) {
          onAuthSuccess(userType as 'buyer' | 'seller' | 'admin');
        }
        
        setShowAuthModal(false);
        setAuthForm({
          email: "", password: "", confirmPassword: "",
          firstName: "", lastName: "", phone: "",
        });
      } else {
        setAuthError("Sign in successful but no user data received");
      }
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

      const companyName = currentUserType === 'seller' ? 'Giga Bytes' : undefined;
      
      const result: AuthResult = await signUp(
        authForm.email, 
        authForm.password, 
        `${authForm.firstName} ${authForm.lastName}`,
        currentUserType,
        authForm.phone,
        undefined,
        companyName
      );

      if (result.error) {
        setAuthError(result.error || "Failed to create account");
        return;
      }

      const user = result.user || result.data?.user;
      
      if (user) {
        if (currentUserType === 'seller') {
          setShowAuthModal(false);
          setAuthForm({ email: "", password: "", confirmPassword: "", firstName: "", lastName: "", phone: "" });
          if (onNavigate) onNavigate('seller-registration');
        } else {
          setSignupSuccess(true);
          setTimeout(() => {
            setShowAuthModal(false);
            if (onAuthSuccess) onAuthSuccess('buyer');
          }, 2000);
        }
      } else {
        setSignupSuccess(true);
        if (currentUserType === 'buyer') {
          setTimeout(() => {
            setShowAuthModal(false);
            if (onAuthSuccess) onAuthSuccess('buyer');
          }, 2000);
        }
      }
      
    } catch (error: any) {
      setAuthError(error.message || "Failed to create account");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleProductClick = (productId: string, isAd?: boolean) => {
    if (isAd) {
      if (onNavigate) onNavigate('advertising');
    } else {
      if (onNavigate) onNavigate(`product-detail-${productId}`);
    }
  };

  const handleAddToCart = (e: React.MouseEvent, productId: string, isAd?: boolean) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (isAd) {
      if (onNavigate) onNavigate('advertising');
      return;
    }
    
    if (!isLoggedIn) {
      setShowAuthModal(true);
      setAuthType('signin');
      return;
    }
    
    setCartItems(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
    
    alert(`Product added to cart!`);
  };

  const handleToggleWishlist = (e: React.MouseEvent, productId: string, isAd?: boolean) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (isAd) {
      if (onNavigate) onNavigate('advertising');
      return;
    }
    
    if (!isLoggedIn) {
      setShowAuthModal(true);
      setAuthType('signin');
      return;
    }
    
    setWishlistItems(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const topProviders = [
    { name: "Giga Bytes", logo: gigaBytesLogo, rating: 4.8 },
    { name: "Giga Bytes Premium", logo: gigaBytesLogo, rating: 4.9 },
    { name: "Giga Bytes Express", logo: gigaBytesLogo, rating: 4.7 },
    { name: "Modern Furniture Co", logo: gigaBytesLogo, rating: 4.6 },
    { name: "Royal Designs", logo: gigaBytesLogo, rating: 4.8 },
    { name: "Elite Home", logo: gigaBytesLogo, rating: 4.5 },
    { name: "Premium Living", logo: gigaBytesLogo, rating: 4.7 },
    { name: "Luxury Spaces", logo: gigaBytesLogo, rating: 4.9 }
  ];

  const sliderImages = [
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=1200&q=80"
  ];

  const saudiCities = [
    "Riyadh", "Jeddah", "Dammam", "Mecca", "Medina", 
    "Khobar", "Dhahran", "Tabuk", "Abha", "Jazan"
  ];

  const furnitureKinds = [
    "Bed", "Sofa", "Table", "Chair", "Storage", "Cabinet", 
    "Lighting", "Shelves", "Office", "Outdoor"
  ];

  const searchCategories = [
    "Living Room Furniture", "Bedroom Furniture", "Dining Room Furniture",
    "Office Furniture", "Outdoor Furniture", "Home Decor",
    "Kitchen & Dining", "Storage Solutions", "Kids Furniture"
  ];

  const ProductCard = ({ product, isAd = false }: { product: Product & { isAd?: boolean; adData?: any }; isAd?: boolean }) => {
    const safeWarranty = String(product.warranty || '3 mon');
    const safeDiscount = String(product.discount || '35%');
    const safeOrders = String(product.orders || '0');
    const safeReviews = String(product.reviews || '0');
    const safeRating = String(product.rating || '4.5');
    const safeCompanyName = String(product.companyName || 'Giga Home');
    const safeName = String(product.name || 'Product');
    const safeDescription = String(product.description || product.shortDescription || 'No description available');
    const safePrice = convertPrice(product.price || '0');
    const safeOriginalPrice = product.originalPrice ? convertPrice(product.originalPrice) : '';
    console.log("protcccccccccc",product);
    return (
      <div 
        className="max-w-sm bg-[#F8F8F6] rounded-2xl shadow-md p-3 cursor-pointer transform hover:scale-[1.02] active:scale-[0.99] transition"
        onClick={() => handleProductClick(product.id, isAd)}
      >
        <div className="relative rounded-xl overflow-hidden mb-2">
          <img
            src={product.image}
            alt={safeName}
            className="w-full h-[160px] object-cover rounded-xl"
          />
          {!isAd && safeDiscount && safeDiscount !== '0%' && (
            <div className="absolute left-2 top-2 bg-orange-500/90 text-white font-bold text-[9px] w-8 h-8 rounded-full flex items-center justify-center">
              {safeDiscount}
            </div>
          )}
          {isAd && (
            <div className="absolute left-2 top-2 bg-blue-500/90 text-white font-bold text-[9px] px-2 py-1 rounded-full">
              AD
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <img 
              src={product.companyLogo} 
              alt={safeCompanyName}
              className="w-5 h-5 rounded-full object-cover"
            />
            <div className="flex items-center gap-1">
              {product.isTopSeller && (
                <span className="bg-green-100 text-green-800 text-[8px] px-1.5 py-0.5 rounded font-semibold">
                  Top
                </span>
              )}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-black leading-tight line-clamp-1 flex-1 pr-2">
              {safeName}
            </h3>
            <button 
              onClick={(e) => handleToggleWishlist(e, product.id, isAd)}
              className={`p-1 rounded-full border transition flex-shrink-0 ${
                wishlistItems.includes(product.id) 
                  ? 'border-red-200 bg-red-50 text-red-500' 
                  : 'border-gray-200 bg-white text-gray-600 hover:border-red-200 hover:text-red-500'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill={wishlistItems.includes(product.id) ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 21.364 4.318 12.682a4.5 4.5 0 010-6.364z" />
              </svg>
            </button>
          </div>

          <p className="text-xs text-gray-500 leading-tight line-clamp-2 min-h-[2rem]">
            {safeDescription}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold text-green-600">
                <span className="text-[10px]">{currency === 'SAR' ? t.sar : t.usd}</span> {safePrice}
              </span>
              
              {!isAd && safeOriginalPrice && safeOriginalPrice !== safePrice && (
                <span className="text-[10px] text-gray-400 line-through">
                  {currency === 'SAR' ? t.sar : t.usd} {safeOriginalPrice}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h13l4 4v6a1 1 0 01-1 1h-1m-14 0a1 1 0 001-1v-6a1 1 0 011-1h9" />
                <circle cx="7.5" cy="18.5" r="1.5" />
                <circle cx="18.5" cy="18.5" r="1.5" />
              </svg>
              <span className="text-xs text-green-600 font-medium">{t.freeDelivery}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.974a1 1 0 00.95.69h4.178c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.974c.3.921-.755 1.688-1.54 1.118L10 13.347l-3.397 2.72c-.785.57-1.84-.197-1.54-1.118l1.287-3.974a1 1 0 00-.364-1.118L2.608 9.4c-.783-.57-.38-1.81.588-1.81h4.178a1 1 0 00.95-.69l1.286-3.974z" />
              </svg>
              <span className="font-semibold text-xs">{safeRating}</span>
            </div>
            
            <button 
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-3 py-1 rounded-full text-[11px] transition"
              onClick={(e) => handleAddToCart(e, product.id, isAd)}
            >
              {t.order}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#fafafa] min-h-screen font-sans" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <header className="w-full bg-gray-100 shadow-sm border-b border-gray-200 flex items-center justify-between px-4 py-3">
        <div className="text-2xl font-bold text-yellow-600 flex items-center space-x-1">
          <span>🏠</span>
          <span>HomeDecor</span>
        </div>

        <div className="flex items-center space-x-2 mr-4">
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value as 'en' | 'ar')}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="en">English</option>
            <option value="ar">العربية</option>
          </select>
          <select 
            value={currency}
            onChange={(e) => setCurrency(e.target.value as 'SAR' | 'USD')}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="SAR">SAR</option>
            <option value="USD">USD</option>
          </select>
        </div>

        <div className="flex items-center w-1/2 relative">
          <form onSubmit={handleSearch} className="flex items-center bg-white px-4 py-2 rounded-l-full w-full border border-gray-300 shadow-sm">
            <AiOutlineSearch className="text-gray-400 text-lg" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              className="bg-transparent w-full outline-none px-2 text-sm text-gray-800"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
          
          <div className="relative">
            <button 
              type="button"
              className="bg-yellow-500 text-white px-4 py-2 rounded-r-full text-sm font-medium hover:bg-yellow-600 transition h-full border border-yellow-500 flex items-center"
              onClick={() => setShowSearchModal(!showSearchModal)}
            >
              {t.allCategories} <AiOutlineDown className="ml-1" size={12} />
            </button>
            
            {showSearchModal && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                <div className="p-3">
                  <h3 className="font-semibold text-gray-800 mb-2">{t.allCategories}</h3>
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

        <div className="flex items-center space-x-6 text-gray-600 text-2xl">
          <AiOutlineUser 
            className="cursor-pointer hover:text-yellow-600 transition" 
            onClick={() => {
              setShowAuthModal(true);
              setAuthType('signin');
              setSignupSuccess(false);
            }}
          />
          <div className="relative">
            <AiOutlineShoppingCart className="cursor-pointer hover:text-yellow-600 transition" />
            {cartItems.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                {cartItems.length}
              </span>
            )}
          </div>
          {isLoggedIn && userType === 'seller' && (
            <button 
              onClick={() => onNavigate?.('seller-dashboard')}
              className="bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-600 transition"
            >
              {t.seller} Dashboard
            </button>
          )}
          {isLoggedIn && (
            <button 
              onClick={() => onNavigate?.('advertising')}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition flex items-center space-x-2"
            >
              <AiOutlineRocket className="text-sm" />
              <span>{t.startAdvertising}</span>
            </button>
          )}
        </div>
      </header>

      <div className="w-full bg-gray-100 h-2 border-b border-gray-200"></div>

      <section className="relative py-4 bg-white">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4">
          <div className="bg-black text-white px-4 py-1 rounded-md font-semibold transform -rotate-2 shadow-md">
            {t.blackFriday}
          </div>
          <h2 className="text-2xl italic font-serif tracking-wider text-gray-700 absolute left-1/2 transform -translate-x-1/2">
            {t.summerSale}
          </h2>
        </div>
      </section>

      <div className="max-w-6xl mx-auto rounded-2xl overflow-hidden shadow-lg mb-6">
        <Swiper
          modules={[Autoplay, Pagination, Navigation]}
          spaceBetween={30}
          centeredSlides
          autoplay={{ delay: 3000, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          navigation
          className="h-[220px]"
        >
          {sliderImages.map((img, idx) => (
            <SwiperSlide key={idx}>
              <div className="relative w-full h-full">
                <img
                  src={img}
                  alt={`Slide ${idx}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="absolute bottom-6 left-6 text-white">
                  <h2 className="text-2xl font-bold mb-1">Premium Furniture</h2>
                  <p className="text-sm">Discover perfect pieces for your home</p>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Sponsored Brands Section - NOW WITH ADS MIXED IN */}
      <section className="max-w-6xl mx-auto mb-8">
        <div className="flex justify-between items-center mb-4 px-4">
          <h3 className="text-lg font-bold text-gray-800">{t.topBrands}</h3>
          <span className="text-sm text-gray-500">{t.premiumPartners}</span>
        </div>
        
        <div className="flex justify-center gap-3 px-4 overflow-x-auto">
          {sponsoredBrandsWithAds.map((item, idx) => {
            // Check if this is an ad object or just a string/image URL
            const isAd = typeof item === 'object' && item.isAd === true;
            const adData = isAd ? (item as any).adData : null;
            const imageUrl = isAd ? (item as any).image : item;
            const name = isAd ? (item as any).name : "Premium Brand";
            
            return (
              <div 
                key={idx} 
                className="flex-shrink-0 relative group cursor-pointer"
                onClick={() => {
                  if (isAd && onNavigate) {
                    onNavigate('advertising');
                  }
                }}
              >
                <div className={`rounded-lg shadow-sm border overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-105 ${
                  isAd ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'
                }`}>
                  <img
                    src={imageUrl}
                    alt={name}
                    className="h-[80px] w-[120px] object-cover"
                  />
                  <div className={`absolute bottom-2 left-2 ${
                    isAd ? 'bg-blue-600/80' : 'bg-black/70'
                  } text-white px-2 py-1 rounded text-[10px] font-semibold`}>
                    {isAd ? "AD" : "Premium"}
                  </div>
                  
                  {/* Ad info overlay */}
                  {isAd && adData && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-2">
                      <div className="text-white text-[10px] font-semibold line-clamp-1">{adData.name}</div>
                      <div className="text-white/80 text-[8px]">Click to view campaign</div>
                    </div>
                  )}
                </div>
                
                {/* Ad stats badge */}
                {isAd && adData && (
                  <div className="absolute -top-1 -right-1 bg-green-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold">
                    {adData.impressions?.toLocaleString() || '0'} views
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-12 gap-3 px-4 max-w-[1400px] mx-auto min-h-screen">
        <aside className="col-span-2 bg-white p-3 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-semibold mb-3 text-gray-800 border-b pb-2 text-xs">{t.filters}</h3>

          <div className="mb-3">
            <div className="relative">
              <button
                onClick={() => setShowCityDropdown(!showCityDropdown)}
                className="w-full bg-gray-100 text-gray-700 px-2 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-200 transition flex items-center justify-between"
              >
                <span>{t.selectCity}</span>
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
                          setSelectedCities(selectedCities.filter(c => c !== city));
                        } else {
                          setSelectedCities([...selectedCities, city]);
                        }
                        setShowCityDropdown(false);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span>{city}</span>
                        {selectedCities.includes(city) && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
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
                Selected: {selectedCities.join(', ')}
              </div>
            )}
          </div>

          <div className="mb-2">
            <button
              onClick={() => setSelectedProductType('all')}
              className={`w-full py-1.5 rounded text-xs font-semibold transition ${
                selectedProductType === 'all'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {t.allProducts}
            </button>
          </div>

          <div className="mb-3">
            <div className="flex space-x-1">
              <button
                onClick={() => setSelectedProductType('ready')}
                className={`flex-1 py-1.5 rounded text-xs font-semibold transition ${
                  selectedProductType === 'ready'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {t.ready}
              </button>
              <button
                onClick={() => setSelectedProductType('customized')}
                className={`flex-1 py-1.5 rounded text-xs font-semibold transition ${
                  selectedProductType === 'customized'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {t.customized}
              </button>
            </div>
          </div>

          <div className="mb-3">
            <div className="flex space-x-1">
              <button
                onClick={() => setSelectedCategoryType('internal')}
                className={`flex-1 py-1.5 rounded text-xs font-semibold transition ${
                  selectedCategoryType === 'internal'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {t.internal}
              </button>
              <button
                onClick={() => setSelectedCategoryType('external')}
                className={`flex-1 py-1.5 rounded text-xs font-semibold transition ${
                  selectedCategoryType === 'external'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {t.external}
              </button>
            </div>
          </div>

          <div className="mb-3">
            <h4 className="font-semibold text-xs mb-1 text-gray-800">{t.kind}</h4>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {furnitureKinds.map((kind, index) => (
                <label key={index} className="flex items-center space-x-1 cursor-pointer py-0.5">
                  <input
                    type="checkbox"
                    checked={selectedKinds.includes(kind)}
                    onChange={() => {
                      if (selectedKinds.includes(kind)) {
                        setSelectedKinds(selectedKinds.filter(k => k !== kind));
                      } else {
                        setSelectedKinds([...selectedKinds, kind]);
                      }
                    }}
                    className="rounded text-yellow-500 focus:ring-yellow-500 h-3 w-3"
                  />
                  <span className="text-xs text-gray-700">{kind}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <h4 className="font-semibold text-xs mb-1 text-gray-800">{t.priceRange}</h4>
            <input type="range" min="50" max="5000" className="w-full mb-1" />
            <div className="flex justify-between text-[10px] text-gray-500">
              <span>{currency === 'SAR' ? t.sar : t.usd} 50</span>
              <span>{currency === 'SAR' ? t.sar : t.usd} 5000</span>
            </div>
          </div>

          <div className="mb-3">
            <h4 className="font-semibold text-xs mb-1 text-gray-800">{t.topProviders}</h4>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {topProviders.map((provider, index) => (
                <label key={index} className="flex items-center space-x-1 cursor-pointer p-1 hover:bg-gray-50 rounded">
                  <input
                    type="checkbox"
                    checked={selectedProviders.includes(provider.name)}
                    onChange={() => {
                      if (selectedProviders.includes(provider.name)) {
                        setSelectedProviders(selectedProviders.filter(p => p !== provider.name));
                      } else {
                        setSelectedProviders([...selectedProviders, provider.name]);
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
                  <span className="text-xs text-yellow-500 ml-auto">★ {provider.rating}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              setSelectedProductType('all');
              setSelectedCategoryType('internal');
              setSelectedKinds([]);
              setSelectedProviders([]);
              setSelectedCities([]);
              setSearchQuery('');
            }}
            className="w-full mt-3 bg-gray-200 text-gray-700 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-300 transition"
          >
            {t.clearFilters}
          </button>
        </aside>

        <main className="col-span-8">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {t.showingProducts.replace('{count}', filteredProducts.length.toString())}
              {selectedProductType !== 'all' && (
                <span className="ml-2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                  {selectedProductType === 'ready' ? t.readyMade : t.customized}
                </span>
              )}
              {selectedCategoryType && (
                <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                  {selectedCategoryType === 'internal' ? 'Indoor' : 'Outdoor'}
                </span>
              )}
              {selectedKinds.length > 0 && (
                <span className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
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
            <button
              onClick={loadProductsFromStorage}
              className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 transition"
            >
              Refresh Products
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map((product) => {
              return (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                />
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">{t.noProducts}</h3>
              <p className="text-gray-500 mb-4">{t.tryAdjusting}</p>
              <button
                onClick={() => {
                  setSelectedProductType('all');
                  setSelectedCategoryType('internal');
                  setSelectedKinds([]);
                  setSelectedProviders([]);
                  setSelectedCities([]);
                  setSearchQuery('');
                }}
                className="bg-yellow-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-yellow-600 transition"
              >
                {t.clearAllFilters}
              </button>
            </div>
          )}
        </main>

        <aside className="col-span-2">
          <div className="sticky top-4 space-y-4 h-full">
            {isLoggedIn && (
              <div className="bg-blue-500 rounded-lg p-3 text-white shadow-sm">
                <AiOutlineRocket className="text-sm mb-1" />
                <h4 className="font-bold text-xs mb-1">{t.boostSales}</h4>
                <p className="text-blue-100 text-[10px] mb-2">{t.reachCustomers}</p>
                <button 
                  onClick={() => onNavigate?.('advertising')}
                  className="w-full bg-white text-blue-600 py-1 rounded text-xs font-bold hover:bg-gray-100 transition"
                >
                  {t.startAdvertising}
                </button>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden group cursor-pointer h-48 relative">
              <img
                src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=300&q=80"
                alt="Special Offer 1"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                <h4 className="text-white font-semibold text-sm">{t.premiumCollection}</h4>
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
                <h4 className="text-white font-semibold text-sm">{t.luxuryFurniture}</h4>
                <p className="text-white/80 text-xs">{t.limitedTime}</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden group cursor-pointer h-48 relative">
              <img
                src="https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=300&q=80"
                alt="Special Offer 3"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                <h4 className="text-white font-semibold text-sm">Modern Design</h4>
                <p className="text-white/80 text-xs">New Arrivals</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden group cursor-pointer h-48 relative">
              <img
                src="https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=300&q=80"
                alt="Special Offer 4"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                <h4 className="text-white font-semibold text-sm">Office Collection</h4>
                <p className="text-white/80 text-xs">Professional Setup</p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <footer className="bg-gray-900 text-white mt-12">
        <div className="max-w-[1400px] mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="text-xl font-bold text-yellow-500 mb-3">HomeDecor</div>
              <p className="text-gray-400 text-sm">
                Your trusted partner for premium furniture and home decor.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-3">{t.quickLinks}</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                {["Home", "Shop", "About", "Contact", "Advertising"].map((item) => (
                  <li key={item}><a href="#" className="hover:text-yellow-500 transition">{item}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">{t.categories}</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                {["Living Room", "Bedroom", "Kitchen", "Office"].map((item) => (
                  <li key={item}><a href="#" className="hover:text-yellow-500 transition">{item}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">{t.contact}</h3>
              <div className="text-sm text-gray-400 space-y-1">
                <p>📞 +966 123 456 789</p>
                <p>✉️ support@homedecor.com</p>
                <p>📍 Riyadh, Saudi Arabia</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-6 pt-4 text-center text-sm text-gray-400">
            © 2024 HomeDecor. {t.rights}
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
                {authType === 'signin' ? t.signIn : t.signUp}
              </h2>
              <p className="text-gray-600 mt-2">
                {authType === 'signin' ? t.welcomeBack : t.joinToday}
              </p>
            </div>

            {signupSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-600 text-sm text-center">
                  {currentUserType === 'seller' 
                    ? t.sellerRegistration
                    : "Buyer account created successfully! Redirecting..."
                  }
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
                onClick={() => setCurrentUserType('buyer')}
                className={`flex-1 py-3 rounded-lg border-2 text-sm font-semibold transition ${
                  currentUserType === 'buyer'
                    ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                👤 {t.buyer}
              </button>
              <button
                onClick={() => setCurrentUserType('seller')}
                className={`flex-1 py-3 rounded-lg border-2 text-sm font-semibold transition ${
                  currentUserType === 'seller'
                    ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                🏪 {t.seller}
              </button>
            </div>

            <form onSubmit={authType === 'signin' ? handleSignIn : handleSignUp}>
              <div className="space-y-4">
                {authType === 'signup' && (
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
                          onChange={(e) => handleAuthInputChange('firstName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
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
                          onChange={(e) => handleAuthInputChange('lastName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
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
                        onChange={(e) => handleAuthInputChange('phone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
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
                    onChange={(e) => handleAuthInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
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
                      onChange={(e) => handleAuthInputChange('password', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 pr-10"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <AiOutlineEyeInvisible size={18} /> : <AiOutlineEye size={18} />}
                    </button>
                  </div>
                </div>

                {authType === 'signup' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.confirmPassword}
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={authForm.confirmPassword}
                      onChange={(e) => handleAuthInputChange('confirmPassword', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      placeholder="••••••••"
                    />
                  </div>
                )}

                {authType === 'signin' && (
                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded text-yellow-500 focus:ring-yellow-500" />
                      <span className="ml-2 text-sm text-gray-600">{t.rememberMe}</span>
                    </label>
                    <button type="button" className="text-sm text-yellow-600 hover:text-yellow-700 font-medium">
                      {t.forgotPassword}
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className={`w-full bg-yellow-500 text-white py-3 rounded-lg font-semibold hover:bg-yellow-600 transition mt-6 ${
                  authLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {authLoading ? 'Please wait...' : 
                  authType === 'signin' ? t.signIn : 
                  currentUserType === 'seller' ? t.continueSeller : t.createAccount
                }
              </button>
            </form>

            <div className="text-center mt-4">
              <p className="text-gray-600 text-sm">
                {authType === 'signin' ? t.dontHaveAccount : t.alreadyHaveAccount}
                <button
                  type="button"
                  onClick={() => {
                    setAuthType(authType === 'signin' ? 'signup' : 'signin');
                    setAuthError("");
                    setSignupSuccess(false);
                  }}
                  className="text-yellow-600 hover:text-yellow-700 font-medium ml-1"
                >
                  {authType === 'signin' ? t.signUp : t.signIn}
                </button>
              </p>
            </div>

            {authType === 'signup' && currentUserType === 'seller' && (
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