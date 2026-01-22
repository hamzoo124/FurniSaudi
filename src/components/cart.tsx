import React, { useState, useEffect } from "react";
import {
  AiOutlineShoppingCart,
  AiOutlineDelete,
  AiOutlinePlus,
  AiOutlineMinus,
  AiOutlineArrowLeft,
  AiOutlineHome,
  AiOutlineCheckCircle,
  AiOutlineCreditCard,
  AiOutlineLock,
  AiOutlineTag,
  AiOutlineGift,
  AiOutlineTruck,
  AiOutlineClose,
  AiOutlineArrowRight
} from "react-icons/ai";

  
interface Product {
  id: string;
  name: string;
  price: string;
  image: string;
  companyLogo: string;
  companyName: string;
  description: string;
  category_type: 'customized' | 'ready_made';
  usage_type: 'indoor' | 'outdoor' | 'both';
  product_type: string;
  product_categories: string[];
  originalPrice?: string;
  discount?: string;
  warranty?: string;
  stock?: number;
  rating?: string;
  isTopSeller?: boolean;
  is_advertised?: boolean;
}

interface CartItem {
  id: string;
  product: Product;
  quantity: number;
}

interface CartPageProps {
  onNavigate?: (page: string, data?: any) => void;
  isLoggedIn?: boolean;
  userType?: 'buyer' | 'seller' | 'admin' | null;
}

const CartPage: React.FC<CartPageProps> = ({ onNavigate, isLoggedIn }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState<'SAR' | 'USD'>('SAR');
  const [language, setLanguage] = useState<'en' | 'ar'>('en');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [shippingCost] = useState(50); // Fixed shipping cost
  const [isGift, setIsGift] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');

  console.log("console cart items",cartItems);

  const exchangeRate = 3.75;

  const translations = {
    en: {
      cart: "Shopping Cart",
      yourCart: "Your Shopping Cart",
      itemsInCart: "items in your cart",
      emptyCart: "Your cart is empty",
      emptyCartDesc: "Looks like you haven't added any products to your cart yet.",
      continueShopping: "Continue Shopping",
      product: "Product",
      price: "Price",
      quantity: "Quantity",
      total: "Total",
      remove: "Remove",
      orderSummary: "Order Summary",
      subtotal: "Subtotal",
      shipping: "Shipping",
      discount: "Discount",
      tax: "Tax (15% VAT)",
      grandTotal: "Grand Total",
      checkout: "Proceed to Checkout",
      secureCheckout: "Secure Checkout",
      applyCoupon: "Apply Coupon",
      couponCode: "Coupon Code",
      apply: "Apply",
      removeCoupon: "Remove",
      free: "Free",
      sar: "SAR",
      usd: "USD",
      backToShop: "Back to Shop",
      clearCart: "Clear Cart",
      confirmClearCart: "Are you sure you want to clear your entire cart?",
      yesClear: "Yes, Clear Cart",
      cancel: "Cancel",
      itemRemoved: "Item removed from cart",
      cartCleared: "Cart cleared successfully",
      couponApplied: "Coupon applied successfully",
      invalidCoupon: "Invalid coupon code",
      maxQuantity: "Maximum quantity reached",
      outOfStock: "Out of stock",
      loginToCheckout: "Please login to proceed to checkout",
      estimatedTotal: "Estimated Total",
      giftOptions: "Gift Options",
      thisIsAGift: "This order contains a gift",
      addGiftMessage: "Add a gift message...",
      returnPolicy: "return policy",
      securePayment: "Secure payment processing",
      expressDelivery: "Express delivery available"
    },
    ar: {
      cart: "عربة التسوق",
      yourCart: "عربة التسوق الخاصة بك",
      itemsInCart: "منتجات في عربة التسوق",
      emptyCart: "عربة التسوق فارغة",
      emptyCartDesc: "يبدو أنك لم تضيف أي منتجات إلى عربة التسوق بعد.",
      continueShopping: "مواصلة التسوق",
      product: "المنتج",
      price: "السعر",
      quantity: "الكمية",
      total: "الإجمالي",
      remove: "إزالة",
      orderSummary: "ملخص الطلب",
      subtotal: "المجموع الفرعي",
      shipping: "الشحن",
      discount: "الخصم",
      tax: "الضريبة (15% قيمة مضافة)",
      grandTotal: "المجموع الكلي",
      checkout: "المتابعة إلى الدفع",
      secureCheckout: "دفع آمن",
      applyCoupon: "تطبيق كوبون",
      couponCode: "رمز الكوبون",
      apply: "تطبيق",
      removeCoupon: "إزالة",
      free: "مجاني",
      sar: "ريال",
      usd: "دولار",
      backToShop: "العودة للتسوق",
      clearCart: "تفريغ العربة",
      confirmClearCart: "هل أنت متأكد من أنك تريد تفريغ العربة بالكامل؟",
      yesClear: "نعم، تفريغ العربة",
      cancel: "إلغاء",
      itemRemoved: "تمت إزالة المنتج من العربة",
      cartCleared: "تم تفريغ العربة بنجاح",
      couponApplied: "تم تطبيق الكوبون بنجاح",
      invalidCoupon: "رمز الكوبون غير صالح",
      maxQuantity: "تم الوصول إلى الحد الأقصى للكمية",
      outOfStock: "نفذ من المخزون",
      loginToCheckout: "الرجاء تسجيل الدخول للمتابعة إلى الدفع",
      estimatedTotal: "المجموع التقديري",
      giftOptions: "خيارات الهدايا",
      thisIsAGift: "هذا الطلب يحتوي على هدية",
      addGiftMessage: "أضف رسالة هدايا...",
      returnPolicy: "سياسة الإرجاع",
      securePayment: "معالجة دفع آمنة",
      expressDelivery: "توصيل سريع متاح"
    }
  };

  const t = translations[language];

  useEffect(() => {
    loadCartItems();
    console.log("card ....")
    
    // Listen for cart updates from other components
    const handleCartUpdate = () => {
      loadCartItems();
    };
    
    window.addEventListener('cartUpdated', handleCartUpdate);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  const loadCartItems = () => {
    setLoading(true);
    try {
      const savedCart = localStorage.getItem('gigaHomeCart');
      console.log(savedCart)
      console.log('Loading cart from localStorage:', savedCart);
      
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        // Validate cart items structure
        const validCartItems = parsedCart.filter((item: any) => 
          item && 
          item.id && 
          item.product && 
          item.product.id && 
          item.quantity > 0
        );
        
        setCartItems(validCartItems);
        console.log('Loaded cart items:', validCartItems.length);
        
        if (validCartItems.length !== parsedCart.length) {
          // Save filtered cart if some items were invalid
          saveCartToStorage(validCartItems);
        }
      } else {
        console.log('No cart found in localStorage');
        setCartItems([]);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      setCartItems([]);
      localStorage.removeItem('gigaHomeCart');
    } finally {
      setLoading(false);
    }
  };

  const saveCartToStorage = (items: CartItem[]) => {
    try {
      localStorage.setItem('gigaHomeCart', JSON.stringify(items));
      // Dispatch event to notify other components
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.error('Error saving cart to storage:', error);
    }
  };

  const convertPrice = (price: string): number => {
    if (!price) return 0;
    
    // Handle both string and number prices
    let numericPrice: number;
    if (typeof price === 'string') {
      numericPrice = parseFloat(price.replace(/[^0-9.]/g, ''));
    } else {
      numericPrice = Number(price);
    }
    
    if (isNaN(numericPrice)) {
      console.warn('Invalid price:', price);
      return 0;
    }
    
    if (currency === 'USD') {
      return numericPrice / exchangeRate;
    }
    return numericPrice;
  };

  const formatPrice = (price: number): string => {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemoveItem(productId);
      return;
    }

    // Check stock limit
    const item = cartItems.find(item => item.id === productId);
    if (item && item.product.stock !== undefined && newQuantity > item.product.stock) {
      alert(t.maxQuantity);
      return;
    }

    const updatedItems = cartItems.map(item => 
      item.id === productId 
        ? { ...item, quantity: Math.max(1, newQuantity) }
        : item
    );
    
    setCartItems(updatedItems);
    saveCartToStorage(updatedItems);
  };

  const handleRemoveItem = (productId: string) => {
    const updatedItems = cartItems.filter(item => item.id !== productId);
    setCartItems(updatedItems);
    saveCartToStorage(updatedItems);
    
    // Show notification instead of alert for better UX
    const event = new CustomEvent('showNotification', {
      detail: {
        message: t.itemRemoved,
        type: 'success'
      }
    });
    window.dispatchEvent(event);
  };

  const handleClearCart = () => {
    if (window.confirm(t.confirmClearCart)) {
      setCartItems([]);
      localStorage.removeItem('gigaHomeCart');
      
      const event = new CustomEvent('showNotification', {
        detail: {
          message: t.cartCleared,
          type: 'success'
        }
      });
      window.dispatchEvent(event);
    }
  };

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      alert('Please enter a coupon code');
      return;
    }

    // Simple coupon validation
    const validCoupons = [
      { code: 'GIGA10', discount: 10 },
      { code: 'HOME15', discount: 15 },
      { code: 'WELCOME20', discount: 20 }
    ];
    
    const coupon = validCoupons.find(c => 
      c.code.toLowerCase() === couponCode.trim().toLowerCase()
    );
    
    if (coupon) {
      setAppliedCoupon(coupon.code);
      setCouponDiscount(coupon.discount);
      
      const event = new CustomEvent('showNotification', {
        detail: {
          message: `${t.couponApplied}: ${coupon.discount}% off`,
          type: 'success'
        }
      });
      window.dispatchEvent(event);
    } else {
      alert(t.invalidCoupon);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCode('');
  };

  const handleCheckout = () => {
    if (!isLoggedIn) {
      alert(t.loginToCheckout);
      if (onNavigate) {
        onNavigate('auth', { returnTo: 'checkout' });
      }
      return;
    }

    if (cartItems.length === 0) {
      alert(t.emptyCart);
      return;
    }

    // Prepare checkout data
    const checkoutData = {
      cartItems,
      subtotal: calculateSubtotal(),
      shipping: calculateShipping(),
      tax: calculateTax(),
      discount: calculateCouponDiscount(),
      total: calculateGrandTotal(),
      isGift,
      giftMessage,
      coupon: appliedCoupon
    };

    // Save checkout data to localStorage for checkout page
    localStorage.setItem('checkoutData', JSON.stringify(checkoutData));

    if (onNavigate) {
      onNavigate('checkout', checkoutData);
    }
  };

  const calculateSubtotal = (): number => {
    return cartItems.reduce((total, item) => {
      const price = convertPrice(item.product.price);
      return total + (price * item.quantity);
    }, 0);
  };

  const calculateTax = (): number => {
    const subtotal = calculateSubtotal();
    return subtotal * 0.15; // 15% VAT for Saudi Arabia
  };

  const calculateShipping = (): number => {
    const subtotal = calculateSubtotal();
    if (subtotal > 500) return 0; // Free shipping for orders over 500 SAR
    return shippingCost;
  };

  const calculateCouponDiscount = (): number => {
    if (!appliedCoupon || couponDiscount === 0) return 0;
    const subtotal = calculateSubtotal();
    return subtotal * (couponDiscount / 100);
  };

  const calculateGrandTotal = (): number => {
    const subtotal = calculateSubtotal();
    const tax = calculateTax();
    const shipping = calculateShipping();
    const discount = calculateCouponDiscount();
    
    return Math.max(0, subtotal + tax + shipping - discount);
  };

  const handleProductClick = (productId: string) => {
    if (onNavigate) {
      // Find the product to pass its data
      const item = cartItems.find(item => item.id === productId);
      if (item) {
        onNavigate(`product-${productId}`, { product: item.product });
      } else {
        onNavigate(`product-${productId}`);
      }
    }
  };

  const handleContinueShopping = () => {
    if (onNavigate) {
      onNavigate('home');
    } else {
      // Fallback navigation
      window.location.href = '/';
    }
  };

  const handleBackToShop = () => {
    handleContinueShopping();
  };

  // Calculate total items count
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {language === 'en' ? 'Loading your cart...' : 'جاري تحميل عربة التسوق...'}
          </p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={handleContinueShopping}
              className="flex items-center text-gray-600 hover:text-yellow-600 transition bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200"
            >
              <AiOutlineArrowLeft className="mr-2" />
              {t.backToShop}
            </button>
            
            <div className="flex items-center space-x-4">
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'en' | 'ar')}
                className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
              >
                <option value="en">English</option>
                <option value="ar">العربية</option>
              </select>
              <select 
                value={currency}
                onChange={(e) => setCurrency(e.target.value as 'SAR' | 'USD')}
                className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
              >
                <option value="SAR">SAR</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-12 text-center max-w-2xl mx-auto">
            <div className="text-gray-400 text-6xl mb-6">
              <AiOutlineShoppingCart className="mx-auto" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">{t.emptyCart}</h2>
            <p className="text-gray-600 mb-8">{t.emptyCartDesc}</p>
            <button
              onClick={handleContinueShopping}
              className="bg-yellow-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-yellow-600 transition inline-flex items-center shadow-md"
            >
              <AiOutlineHome className="mr-2" />
              {t.continueShopping}
              <AiOutlineArrowRight className="ml-2" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button
              onClick={handleBackToShop}
              className="flex items-center text-gray-600 hover:text-yellow-600 transition bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200"
            >
              <AiOutlineArrowLeft className="mr-2" />
              {t.backToShop}
            </button>
            <div className="ml-6">
              <h1 className="text-2xl font-bold text-gray-900">{t.cart}</h1>
              <p className="text-gray-600 text-sm">
                {totalItems} {t.itemsInCart} • {cartItems.length} {language === 'en' ? 'products' : 'منتجات'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'en' | 'ar')}
              className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
            >
              <option value="en">English</option>
              <option value="ar">العربية</option>
            </select>
            <select 
              value={currency}
              onChange={(e) => setCurrency(e.target.value as 'SAR' | 'USD')}
              className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
            >
              <option value="SAR">SAR</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  {t.yourCart} ({cartItems.length} {language === 'en' ? 'products' : 'منتجات'})
                </h2>
                <button
                  onClick={handleClearCart}
                  className="text-sm text-red-600 hover:text-red-800 flex items-center bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition"
                >
                  <AiOutlineDelete className="mr-1" />
                  {t.clearCart}
                </button>
              </div>

              <div className="space-y-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row border-b border-gray-200 pb-6">
                    {/* Product Image */}
                    <div 
                      className="flex-shrink-0 mb-4 sm:mb-0 sm:mr-6 cursor-pointer group"
                      onClick={() => handleProductClick(item.product.id)}
                    >
                      <div className="relative">
                        <img
                          src={item.product.image || "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80"}
                          alt={item.product.name}
                          className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg group-hover:opacity-90 transition"
                        />
                        {item.product.discount && (
                          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                            {item.product.discount}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Product Details */}
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <div className="flex-1">
                          <h3 
                            className="font-medium text-gray-900 cursor-pointer hover:text-yellow-600 text-lg"
                            onClick={() => handleProductClick(item.product.id)}
                          >
                            {item.product.name}
                          </h3>
                          <div className="flex items-center mt-1">
                            <img 
                              src={item.product.companyLogo} 
                              alt={item.product.companyName}
                              className="w-4 h-4 rounded-full mr-2"
                            />
                            <p className="text-sm text-gray-500">{item.product.companyName}</p>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2 mt-2">
                            {item.product.description}
                          </p>
                          
                          {/* Product Tags */}
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                              {item.product.category_type}
                            </span>
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                              {item.product.usage_type}
                            </span>
                            {item.product.isTopSeller && (
                              <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                                Top Seller
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Remove Button */}
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-gray-400 hover:text-red-600 self-start ml-4"
                          title={t.remove}
                        >
                          <AiOutlineDelete size={20} />
                        </button>
                      </div>
                      
                      {/* Price and Quantity Controls */}
                      <div className="flex justify-between items-center mt-6">
                        <div className="flex items-center space-x-4">
                          <div className="text-lg font-bold text-gray-900">
                            {currency === 'SAR' ? t.sar : t.usd} {formatPrice(convertPrice(item.product.price) * item.quantity)}
                          </div>
                          {item.product.originalPrice && (
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-400 line-through">
                                {currency === 'SAR' ? t.sar : t.usd} {formatPrice(convertPrice(item.product.originalPrice) * item.quantity)}
                              </span>
                              {item.product.discount && (
                                <span className="text-xs text-green-600 font-semibold">
                                  Save {item.product.discount}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Quantity Controls */}
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={item.quantity <= 1}
                            title={language === 'en' ? 'Decrease quantity' : 'تقليل الكمية'}
                          >
                            <AiOutlineMinus size={16} />
                          </button>
                          
                          <div className="w-16 text-center">
                            <span className="font-semibold text-lg">{item.quantity}</span>
                            <div className="text-xs text-gray-500">Qty</div>
                          </div>
                          
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={item.product.stock !== undefined && item.quantity >= item.product.stock}
                            title={language === 'en' ? 'Increase quantity' : 'زيادة الكمية'}
                          >
                            <AiOutlinePlus size={16} />
                          </button>
                        </div>
                      </div>
                      
                      {/* Stock Warning */}
                      {item.product.stock !== undefined && item.quantity >= item.product.stock && (
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            ⚠️ {t.maxQuantity}. Only {item.product.stock} in stock.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Coupon Section */}
            <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <AiOutlineTag className="mr-2 text-yellow-600 text-xl" />
                {t.applyCoupon}
              </h3>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder={t.couponCode}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 disabled:opacity-50"
                    disabled={!!appliedCoupon}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {language === 'en' ? 'Try: GIGA10, HOME15, WELCOME20' : 'جرب: GIGA10, HOME15, WELCOME20'}
                  </p>
                </div>
                
                {appliedCoupon ? (
                  <button
                    onClick={handleRemoveCoupon}
                    className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition flex items-center justify-center font-medium"
                  >
                    <AiOutlineClose className="mr-2" />
                    {t.removeCoupon}
                  </button>
                ) : (
                  <button
                    onClick={handleApplyCoupon}
                    className="bg-yellow-500 text-white px-6 py-3 rounded-lg hover:bg-yellow-600 transition font-medium"
                  >
                    {t.apply}
                  </button>
                )}
              </div>
              
              {appliedCoupon && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-700 font-medium">
                        {t.couponApplied}: <span className="font-bold">{appliedCoupon}</span>
                      </p>
                      <p className="text-green-600 text-sm">
                        {couponDiscount}% {language === 'en' ? 'discount applied' : 'خصم مطبق'}
                      </p>
                    </div>
                    <span className="text-lg font-bold text-green-700">
                      -{currency === 'SAR' ? t.sar : t.usd} {formatPrice(calculateCouponDiscount())}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary Section */}
          <div className="lg:col-span-1">
            {/* Order Summary Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-8 border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-6 text-lg border-b pb-3">{t.orderSummary}</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t.subtotal}</span>
                  <span className="font-medium">
                    {currency === 'SAR' ? t.sar : t.usd} {formatPrice(calculateSubtotal())}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">{t.shipping}</span>
                  <span className="font-medium">
                    {calculateShipping() === 0 ? (
                      <span className="text-green-600 font-semibold">{t.free}</span>
                    ) : (
                      `${currency === 'SAR' ? t.sar : t.usd} ${formatPrice(calculateShipping())}`
                    )}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">{t.tax}</span>
                  <span className="font-medium">
                    {currency === 'SAR' ? t.sar : t.usd} {formatPrice(calculateTax())}
                  </span>
                </div>
                
                {appliedCoupon && (
                  <div className="flex justify-between text-green-600 border-t pt-3">
                    <span>{t.discount} ({appliedCoupon})</span>
                    <span className="font-bold">
                      -{currency === 'SAR' ? t.sar : t.usd} {formatPrice(calculateCouponDiscount())}
                    </span>
                  </div>
                )}
                
                <div className="border-t pt-4 mt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>{t.grandTotal}</span>
                    <span className="text-yellow-600">
                      {currency === 'SAR' ? t.sar : t.usd} {formatPrice(calculateGrandTotal())}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{t.estimatedTotal}</p>
                </div>
              </div>
              
              <button
                onClick={handleCheckout}
                className="w-full bg-yellow-500 text-white py-4 rounded-lg font-semibold hover:bg-yellow-600 transition mt-8 flex items-center justify-center shadow-md"
              >
                <AiOutlineCreditCard className="mr-2 text-lg" />
                {t.checkout}
              </button>
              
              <div className="mt-6 space-y-4">
                <div className="flex items-center text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
                  <AiOutlineLock className="mr-3 text-green-500 flex-shrink-0" />
                  <span>{t.secureCheckout} • {t.securePayment}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
                  <AiOutlineTruck className="mr-3 text-blue-500 flex-shrink-0" />
                  <span>{t.free} {t.shipping} {calculateSubtotal() > 500 && `(${language === 'en' ? 'Order over 500 SAR' : 'للطلبات فوق 500 ريال'})`}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
                  <AiOutlineCheckCircle className="mr-3 text-green-500 flex-shrink-0" />
                  <span>30-day {t.returnPolicy}</span>
                </div>
              </div>
            </div>
            
            {/* Gift Options Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 mt-6 border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <AiOutlineGift className="mr-2 text-pink-500 text-xl" />
                {t.giftOptions}
              </h3>
              
              <div className="space-y-4">
                <label className="flex items-start cursor-pointer p-3 hover:bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    checked={isGift}
                    onChange={(e) => setIsGift(e.target.checked)}
                    className="mt-1 rounded text-yellow-500 focus:ring-yellow-500"
                  />
                  <div className="ml-3">
                    <span className="text-sm text-gray-700 font-medium">{t.thisIsAGift}</span>
                    <p className="text-xs text-gray-500 mt-1">
                      {language === 'en' ? 'Add gift wrap and message' : 'إضافة تغليف هدايا ورسالة'}
                    </p>
                  </div>
                </label>
                
                {isGift && (
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">
                      {language === 'en' ? 'Gift Message (Optional)' : 'رسالة الهدية (اختياري)'}
                    </label>
                    <textarea
                      value={giftMessage}
                      onChange={(e) => setGiftMessage(e.target.value)}
                      placeholder={t.addGiftMessage}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-sm"
                      rows={3}
                      maxLength={200}
                    />
                    <p className="text-xs text-gray-500 mt-1 text-right">
                      {giftMessage.length}/200 {language === 'en' ? 'characters' : 'حرف'}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Continue Shopping Button */}
            <button
              onClick={handleContinueShopping}
              className="w-full mt-6 bg-white text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition border-2 border-gray-200 flex items-center justify-center"
            >
              <AiOutlineArrowLeft className="mr-2" />
              {t.continueShopping}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;