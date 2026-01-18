import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, CreditCard, Shield, Truck, Check, Wallet, 
  MapPin, User, Phone, Home, Package, MessageSquare, Lock,
  Scissors, Settings, Package as PackageIcon
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface CheckoutProps {
  onNavigate: (page: string, data?: any) => void;
  cartItems?: any[];
  onOrderSuccess: () => void;
  directOrder?: any;
}

interface AddressFormData {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  postalCode: string;
  additionalNotes: string;
}

export const Checkout: React.FC<CheckoutProps> = ({ 
  onNavigate, 
  cartItems = [], 
  onOrderSuccess,
  directOrder 
}) => {
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [orderComplete, setOrderComplete] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadedDirectOrder, setLoadedDirectOrder] = useState<any>(null);
  const [addressForm, setAddressForm] = useState<AddressFormData>({
    fullName: user?.name || '',
    phone: '+966 ',
    address: '',
    city: 'Riyadh',
    district: '',
    postalCode: '',
    additionalNotes: ''
  });
  const [orderNumber, setOrderNumber] = useState('');
  const [orderType, setOrderType] = useState<'ready' | 'custom'>('ready');

  // Load direct order from localStorage
  useEffect(() => {
    console.log('🔍 Checkout component mounted');
    
    // Check localStorage for direct order data
    const savedDirectOrder = localStorage.getItem('directOrderData');
    if (savedDirectOrder) {
      console.log('📦 Found direct order in localStorage:', JSON.parse(savedDirectOrder));
      setLoadedDirectOrder(JSON.parse(savedDirectOrder));
      localStorage.removeItem('directOrderData');
    }
    
    // Also check for pending direct order
    const pendingDirectOrder = localStorage.getItem('pending_direct_order');
    if (pendingDirectOrder) {
      console.log('⏳ Found pending direct order:', JSON.parse(pendingDirectOrder));
      setLoadedDirectOrder(JSON.parse(pendingDirectOrder));
      localStorage.removeItem('pending_direct_order');
    }
    
    // If directOrder prop is passed, use it
    if (directOrder) {
      console.log('🎯 Direct order from props:', directOrder);
      setLoadedDirectOrder(directOrder);
    }

    // Load user data if available
    if (user?.name) {
      setAddressForm(prev => ({ ...prev, fullName: user.name }));
    }

    // Determine order type
    determineOrderType();
  }, [directOrder, user]);

  // Determine if this is a direct checkout or cart checkout
  const isDirectCheckout = !!loadedDirectOrder || !!directOrder;
  
  // Get the current order data
  const getCurrentOrder = () => {
    return loadedDirectOrder || directOrder;
  };

  // Determine order type based on products/customization
  const determineOrderType = () => {
    let type: 'ready' | 'custom' = 'ready';
    
    if (isDirectCheckout) {
      const order = getCurrentOrder();
      if (order?.product?.type === 'customized' || 
          order?.customization || 
          order?.product?.customization) {
        type = 'custom';
      }
    } else {
      const hasCustomization = cartItems.some(item => 
        item.product?.type === 'customized' || 
        item.customization || 
        item.product?.customization
      );
      if (hasCustomization) {
        type = 'custom';
      }
    }
    
    setOrderType(type);
    return type;
  };

  // Prepare order items based on checkout type
  const orderItems = isDirectCheckout 
    ? [{
        product: getCurrentOrder()?.product,
        quantity: getCurrentOrder()?.quantity || 1,
        customization: getCurrentOrder()?.product?.customization || getCurrentOrder()?.customization || null,
        sellerInfo: getCurrentOrder()?.seller || null,
        deliveryInfo: getCurrentOrder()?.deliveryInfo || null,
        unitPrice: getCurrentOrder()?.product?.finalPrice || getCurrentOrder()?.product?.price || 0
      }]
    : cartItems.map(item => ({
        product: item.product,
        quantity: item.quantity,
        customization: item.customization || item.product?.customization || null,
        sellerInfo: item.product?.seller || null,
        deliveryInfo: null,
        unitPrice: item.product.finalPrice || item.product.price
      }));

  const calculateSubtotal = () => {
    if (isDirectCheckout) {
      const order = getCurrentOrder();
      return parseFloat(order?.product?.finalPrice || order?.product?.price || 0) * (order?.quantity || 1);
    }
    return cartItems.reduce((total, item) => {
      const itemPrice = item.product.finalPrice || item.product.price;
      return total + (parseFloat(itemPrice) * item.quantity);
    }, 0);
  };

  const calculateDeliveryFee = () => {
    if (isDirectCheckout) {
      const order = getCurrentOrder();
      return parseFloat(order?.deliveryInfo?.delivery_price) || 0;
    }
    return 0;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const deliveryFee = calculateDeliveryFee();
    return subtotal + deliveryFee;
  };

  const handleAddressChange = (field: keyof AddressFormData, value: string) => {
    setAddressForm(prev => ({ ...prev, [field]: value }));
  };

  const validateAddress = () => {
    if (!addressForm.fullName.trim()) {
      alert('Please enter your full name');
      return false;
    }
    if (!addressForm.phone.trim() || addressForm.phone.length < 9) {
      alert('Please enter a valid phone number');
      return false;
    }
    if (!addressForm.address.trim()) {
      alert('Please enter your address');
      return false;
    }
    if (!addressForm.city.trim()) {
      alert('Please select your city');
      return false;
    }
    return true;
  };

  // Save order to ALL dashboards with proper categorization
  const saveOrderToAllDashboards = async (order: any) => {
    try {
      console.log(`💾 Saving ${orderType} order to all dashboards:`, order);

      // 1. Save to Supabase Database (Primary Storage)
      const supabaseOrderData = {
        id: order.id,
        order_number: order.orderNumber,
        customer_id: order.userId,
        customer_name: order.userName,
        customer_email: order.userEmail,
        customer_phone: order.userPhone,
        
        // Seller information
        seller_id: order.sellerInfo?.id || order.items[0]?.sellerInfo?.id || null,
        seller_name: order.sellerInfo?.business_name || order.items[0]?.sellerInfo?.business_name || 'Unknown Seller',
        
        // Product information
        product_id: order.items[0]?.product?.id || 'direct_product',
        product_name: order.items[0]?.product?.title || order.items[0]?.product?.name || 'Product',
        product_image: order.items[0]?.product?.images?.[0] || '',
        product_type: orderType === 'custom' ? 'customized' : 'ready',
        
        // Order details
        quantity: order.items.reduce((sum: number, item: any) => sum + item.quantity, 0),
        unit_price: parseFloat(order.items[0]?.unitPrice || 0),
        subtotal: parseFloat(order.subtotal.toFixed(2)),
        delivery_fee: parseFloat(order.deliveryFee.toFixed(2)),
        total_price: parseFloat(order.total.toFixed(2)),
        
        // ORDER TYPE CLASSIFICATION - KEY ADDITION
        order_type: orderType, // 'custom' or 'ready'
        is_custom: orderType === 'custom',
        customization_details: order.customizationDetails ? JSON.stringify(order.customizationDetails) : null,
        
        // Status
        status: order.status,
        payment_status: order.paymentStatus,
        payment_method: order.paymentMethod,
        
        // Delivery information
        delivery_address: JSON.stringify(order.deliveryAddress),
        delivery_city: order.deliveryAddress.city,
        estimated_delivery: order.deliveryInfo?.delivery_time || '3-5 business days',
        
        // Additional info
        original_order_type: order.originalOrderType,
        is_guest: order.isGuest,
        notes: order.notes,
        
        // Timestamps
        order_date: order.createdAt,
        created_at: order.createdAt,
        updated_at: order.updatedAt
      };

      console.log('📤 Saving to Supabase:', supabaseOrderData);

      const { data, error } = await supabase
        .from('orders')
        .insert([supabaseOrderData]);

      if (error) {
        console.error('❌ Supabase insert error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      console.log('✅ Order saved to Supabase:', data);

      // 2. Save to LOCALSTORAGE with TYPE-SPECIFIC STORAGE

      // A. Save by ORDER TYPE
      if (orderType === 'custom') {
        // Save to CUSTOM ORDERS storage
        const customOrders = JSON.parse(localStorage.getItem('custom_orders') || '[]');
        customOrders.push(order);
        localStorage.setItem('custom_orders', JSON.stringify(customOrders));
        
        // Seller-specific custom orders
        const sellerId = order.sellerInfo?.id || 'default_seller';
        const sellerCustomOrdersKey = `seller_${sellerId}_custom_orders`;
        const sellerCustomOrders = JSON.parse(localStorage.getItem(sellerCustomOrdersKey) || '[]');
        sellerCustomOrders.push(order);
        localStorage.setItem(sellerCustomOrdersKey, JSON.stringify(sellerCustomOrders));
        
        // User-specific custom orders (if logged in)
        if (order.userId && !order.isGuest) {
          const userCustomOrdersKey = `user_${order.userId}_custom_orders`;
          const userCustomOrders = JSON.parse(localStorage.getItem(userCustomOrdersKey) || '[]');
          userCustomOrders.push(order);
          localStorage.setItem(userCustomOrdersKey, JSON.stringify(userCustomOrders));
        }
      } else {
        // Save to READY ORDERS storage
        const readyOrders = JSON.parse(localStorage.getItem('ready_orders') || '[]');
        readyOrders.push(order);
        localStorage.setItem('ready_orders', JSON.stringify(readyOrders));
        
        // Seller-specific ready orders
        const sellerId = order.sellerInfo?.id || 'default_seller';
        const sellerReadyOrdersKey = `seller_${sellerId}_ready_orders`;
        const sellerReadyOrders = JSON.parse(localStorage.getItem(sellerReadyOrdersKey) || '[]');
        sellerReadyOrders.push(order);
        localStorage.setItem(sellerReadyOrdersKey, JSON.stringify(sellerReadyOrders));
        
        // User-specific ready orders (if logged in)
        if (order.userId && !order.isGuest) {
          const userReadyOrdersKey = `user_${order.userId}_ready_orders`;
          const userReadyOrders = JSON.parse(localStorage.getItem(userReadyOrdersKey) || '[]');
          userReadyOrders.push(order);
          localStorage.setItem(userReadyOrdersKey, JSON.stringify(userReadyOrders));
        }
      }

      // B. Save to ALL ORDERS (General)
      const allOrders = JSON.parse(localStorage.getItem('allOrders') || '[]');
      allOrders.push(order);
      localStorage.setItem('allOrders', JSON.stringify(allOrders));

      // C. Save to SELLER Dashboard (All orders combined)
      const sellerId = order.sellerInfo?.id || 'default_seller';
      const sellerOrdersKey = `seller_${sellerId}_orders`;
      const sellerOrders = JSON.parse(localStorage.getItem(sellerOrdersKey) || '[]');
      sellerOrders.push(order);
      localStorage.setItem(sellerOrdersKey, JSON.stringify(sellerOrders));

      // D. Save to BUYER Dashboard (if logged in)
      if (order.userId && !order.isGuest) {
        const buyerOrdersKey = `user_${order.userId}_orders`;
        const buyerOrders = JSON.parse(localStorage.getItem(buyerOrdersKey) || '[]');
        buyerOrders.push(order);
        localStorage.setItem(buyerOrdersKey, JSON.stringify(buyerOrders));
      }

      // E. Save to ADMIN Dashboard
      const adminOrders = JSON.parse(localStorage.getItem('admin_orders') || '[]');
      adminOrders.push(order);
      localStorage.setItem('admin_orders', JSON.stringify(adminOrders));

      // F. Save to recent orders
      const recentOrders = JSON.parse(localStorage.getItem('recent_orders') || '[]');
      recentOrders.unshift(order);
      localStorage.setItem('recent_orders', JSON.stringify(recentOrders.slice(0, 50)));

      // G. Save to order statistics
      const today = new Date().toISOString().split('T')[0];
      const orderStats = JSON.parse(localStorage.getItem('order_stats') || '{}');
      if (!orderStats[today]) {
        orderStats[today] = { 
          count: 0, 
          revenue: 0,
          ready_count: 0,
          custom_count: 0
        };
      }
      orderStats[today].count += 1;
      orderStats[today].revenue += order.total;
      if (orderType === 'custom') {
        orderStats[today].custom_count += 1;
      } else {
        orderStats[today].ready_count += 1;
      }
      localStorage.setItem('order_stats', JSON.stringify(orderStats));

      console.log(`✅ ${orderType === 'custom' ? 'Custom' : 'Ready'} order saved to ALL dashboards successfully!`);
      return true;

    } catch (error) {
      console.error('❌ Error saving order to dashboards:', error);
      throw error;
    }
  };

  const handlePlaceOrder = async () => {
    // Validate address
    if (!validateAddress()) {
      return;
    }

    setIsProcessing(true);

    try {
      // Get user info (guest or logged in)
      const userInfo = user ? {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || addressForm.phone
      } : {
        id: `guest_${crypto.randomUUID().slice(0, 8)}`,
        name: addressForm.fullName,
        email: `${addressForm.fullName.replace(/\s+/g, '.').toLowerCase()}_${Date.now()}@guest.com`,
        phone: addressForm.phone,
        isGuest: true
      };

      // Generate order details
      const orderId = crypto.randomUUID();
      const generatedOrderNumber = `ORD${Date.now().toString().slice(-8)}`;
      setOrderNumber(generatedOrderNumber);
      const subtotal = calculateSubtotal();
      const total = calculateTotal();

      // Get seller information
      const sellerInfo = isDirectCheckout 
        ? getCurrentOrder()?.seller
        : cartItems[0]?.product?.seller || {
            id: 'default_seller',
            business_name: 'Marketplace Seller',
            email: 'seller@marketplace.com'
          };

      // Collect customization details if any
      const customizationDetails = isDirectCheckout
        ? getCurrentOrder()?.customization || getCurrentOrder()?.product?.customization
        : cartItems.find(item => item.customization)?.customization || 
          cartItems.find(item => item.product?.customization)?.product?.customization;

      // Create complete order object
      const order = {
        id: orderId,
        orderNumber: generatedOrderNumber,
        userId: userInfo.id,
        userName: userInfo.name,
        userEmail: userInfo.email,
        userPhone: userInfo.phone,
        
        // Items array
        items: orderItems.map((item: any) => ({
          id: `item_${crypto.randomUUID().slice(0, 8)}`,
          product_id: item.product?.id || 'direct_product',
          product_name: item.product?.title || item.product?.name || 'Product',
          product_image: item.product?.images?.[0] || '',
          product_type: orderType,
          quantity: item.quantity,
          unit_price: parseFloat(item.unitPrice || 0),
          total_price: parseFloat((item.unitPrice * item.quantity).toFixed(2)),
          customization: item.customization || null,
          seller_id: item.sellerInfo?.id || sellerInfo.id,
          seller_name: item.sellerInfo?.business_name || sellerInfo.business_name
        })),
        
        // Financials
        subtotal: parseFloat(subtotal.toFixed(2)),
        deliveryFee: parseFloat(calculateDeliveryFee().toFixed(2)),
        total: parseFloat(total.toFixed(2)),
        
        // ORDER TYPE - KEY ADDITION
        orderType: orderType,
        
        // Payment
        paymentMethod: paymentMethod,
        paymentStatus: paymentMethod === 'cash' ? 'pending' : 'paid',
        
        // Status tracking
        status: 'pending',
        originalOrderType: isDirectCheckout ? 'direct' : 'cart',
        
        // Delivery
        deliveryAddress: addressForm,
        deliveryInfo: isDirectCheckout 
          ? getCurrentOrder()?.deliveryInfo 
          : {
              delivery_option: 'standard',
              delivery_price: 0,
              delivery_time: '3-5 business days'
            },
        
        // Seller info
        sellerInfo: sellerInfo,
        
        // User type
        isGuest: !user,
        
        // Customization details
        customizationDetails: customizationDetails,
        
        // Additional
        notes: addressForm.additionalNotes,
        
        // Timestamps
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        
        // Tracking info (will be updated by seller)
        trackingNumber: null,
        shippedAt: null,
        deliveredAt: null,
        estimatedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };

      console.log(`📦 Created ${orderType} order object:`, order);

      // Save to all dashboards with proper categorization
      await saveOrderToAllDashboards(order);

      // Clear cart only if not a direct order
      if (!isDirectCheckout && user?.id) {
        localStorage.removeItem(`user_${user.id}_cart`);
        localStorage.removeItem('cart');
      }

      // Clear pending data
      localStorage.removeItem('pending_checkout_data');
      localStorage.removeItem('pending_direct_order');
      localStorage.removeItem('directOrderData');

      // Show success and redirect
      setTimeout(() => {
        setIsProcessing(false);
        setOrderComplete(true);
        onOrderSuccess();
      }, 1500);

    } catch (error: any) {
      console.error('❌ Error placing order:', error);
      alert(`Error: ${error.message || 'Please try again.'}`);
      setIsProcessing(false);
    }
  };

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md w-full border border-gray-200">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
            orderType === 'custom' 
              ? 'bg-gradient-to-r from-purple-500 to-purple-600' 
              : 'bg-gradient-to-r from-green-500 to-emerald-600'
          }`}>
            <Check className="w-10 h-10 text-white" />
            {orderType === 'custom' && (
              <Scissors className="w-6 h-6 text-white absolute -top-1 -right-1" />
            )}
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-3">
            {orderType === 'custom' ? 'Custom Order Confirmed! 🎨' : 'Order Confirmed! 🎉'}
          </h2>
          <p className="text-gray-600 mb-6">
            {orderType === 'custom' 
              ? 'Your custom furniture order has been placed successfully! Our design team will contact you within 24 hours.'
              : 'Thank you for your purchase. Your order has been placed successfully and is being processed.'}
          </p>
          
          <div className={`border rounded-xl p-5 mb-6 ${
            orderType === 'custom' 
              ? 'bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200'
              : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
          }`}>
            <div className="flex items-center justify-center mb-3">
              {orderType === 'custom' ? (
                <Scissors className="w-6 h-6 mr-2 text-purple-600" />
              ) : (
                <PackageIcon className="w-6 h-6 mr-2 text-green-600" />
              )}
              <p className={`font-semibold text-lg ${
                orderType === 'custom' ? 'text-purple-800' : 'text-green-800'
              }`}>
                Order Details
              </p>
            </div>
            <div className="space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-gray-700">Order Type:</span>
                <span className={`font-bold ${
                  orderType === 'custom' ? 'text-purple-700' : 'text-green-700'
                }`}>
                  {orderType === 'custom' ? '🎨 Custom Furniture' : '📦 Ready-made'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Order Number:</span>
                <span className="font-bold text-gray-800">#{orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Order Total:</span>
                <span className="font-bold text-amber-600">{calculateTotal().toFixed(2)} SR</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Payment:</span>
                <span className="font-medium text-gray-800">
                  {paymentMethod === 'cash' ? '💵 Cash on Delivery' : '💳 Paid Online'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Delivery:</span>
                <span className="font-medium text-gray-800">
                  {isDirectCheckout ? '🚀 Express Delivery' : '📦 Standard Delivery'}
                </span>
              </div>
              {orderType === 'custom' && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-sm font-medium text-purple-700">
                    ⏳ Production Time: 2-4 weeks
                  </p>
                  <p className="text-sm text-purple-600 mt-1">
                    Our design team will contact you within 24 hours to discuss details.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5 mb-6">
            <div className="flex items-center justify-center mb-3">
              <MapPin className="w-6 h-6 text-amber-600 mr-2" />
              <p className="font-semibold text-amber-800">Delivery Address</p>
            </div>
            <div className="text-sm text-amber-700 text-left">
              <p className="font-medium">{addressForm.fullName}</p>
              <p>{addressForm.address}</p>
              <p>{addressForm.district && `${addressForm.district}, `}{addressForm.city}</p>
              <p>{addressForm.postalCode && `Postal: ${addressForm.postalCode}`}</p>
              <p className="mt-2">📞 {addressForm.phone}</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 mb-6">
            <div className="flex items-center justify-center mb-3">
              <Shield className="w-6 h-6 text-blue-600 mr-2" />
              <p className="font-semibold text-blue-800">Next Steps</p>
            </div>
            <div className="text-sm text-blue-700 text-left space-y-2">
              <p className="flex items-center">
                <Check className="w-4 h-4 mr-2 text-green-500" />
                {orderType === 'custom' 
                  ? 'Order visible in Custom Orders section'
                  : 'Order visible in Ready Orders section'}
              </p>
              <p className="flex items-center">
                <Check className="w-4 h-4 mr-2 text-green-500" />
                {orderType === 'custom' 
                  ? 'Design team will contact you'
                  : 'Seller notified & will confirm order'}
              </p>
              <p className="flex items-center">
                <Check className="w-4 h-4 mr-2 text-green-500" />
                Track status updates in your dashboard
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate(orderType === 'custom' ? 'buyer/custom-orders' : 'buyer/orders')}
            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl mb-3 ${
              orderType === 'custom'
                ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800'
                : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700'
            }`}
          >
            View {orderType === 'custom' ? 'Custom Orders' : 'My Orders'}
          </button>
          
          <button
            onClick={() => onNavigate('home')}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white py-3 rounded-xl font-medium hover:from-amber-600 hover:to-amber-700 transition-all"
          >
            Continue Shopping
          </button>
          
          <p className="text-sm text-gray-500 mt-4">
            {orderType === 'custom' 
              ? 'Custom order will appear in seller dashboard for production tracking.'
              : 'Order will appear in seller dashboard and admin panel for processing.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => isDirectCheckout ? onNavigate('home') : onNavigate('cart')}
              className="flex items-center space-x-2 text-gray-600 hover:text-amber-500 transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">
                {isDirectCheckout ? 'Back to Home' : 'Back to Cart'}
              </span>
            </button>
            <div className="flex items-center space-x-4">
              {orderType === 'custom' && (
                <div className="flex items-center space-x-2 bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                  <Scissors className="w-4 h-4" />
                  <span className="text-sm font-medium">Custom Order</span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Lock className="w-5 h-5 text-green-500" />
                <span className="text-sm text-gray-600">Secure Checkout • SSL Encrypted</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Checkout</h1>
            <div className="flex items-center space-x-2 mt-2">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Secure • Fast • Reliable</span>
              </div>
              {orderType === 'custom' && (
                <span className="text-sm text-purple-600 font-medium">• Custom Furniture Order</span>
              )}
            </div>
          </div>
          {orderType === 'custom' ? (
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-full shadow-lg">
              <span className="font-medium">🎨 Custom Furniture Order</span>
            </div>
          ) : isDirectCheckout ? (
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-full shadow-lg">
              <span className="font-medium">🚀 Express Checkout</span>
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Order Summary & Address */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <Package className="w-6 h-6 mr-2 text-amber-500" />
                  <h2 className="text-xl font-bold text-gray-800">Order Summary</h2>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-500">
                    {orderItems.length} {orderItems.length === 1 ? 'item' : 'items'}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    orderType === 'custom' 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {orderType === 'custom' ? 'Custom Order' : 'Ready-made'}
                  </span>
                </div>
              </div>
              
              <div className="space-y-4">
                {orderItems.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="relative">
                      <img
                        src={item.product?.images?.[0]}
                        alt={item.product?.title || item.product?.name}
                        className="w-20 h-20 object-cover rounded-lg border-2 border-white shadow"
                      />
                      {(item.customization || item.product?.customization || orderType === 'custom') && (
                        <div className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                          🎨 Custom
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{item.product?.title || item.product?.name}</h3>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
                        <span className="text-sm font-medium text-amber-600">
                          {parseFloat(item.unitPrice || 0).toFixed(2)} SR each
                        </span>
                      </div>
                      {item.sellerInfo && (
                        <p className="text-xs text-gray-500 mt-1">
                          Seller: <span className="font-medium">{item.sellerInfo.business_name}</span>
                        </p>
                      )}
                      {orderType === 'custom' && (
                        <p className="text-xs text-purple-600 mt-1">
                          ⏳ Custom production: 2-4 weeks
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-amber-600">
                        {(parseFloat(item.unitPrice || 0) * item.quantity).toFixed(2)} SR
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-gray-200 pt-6 mt-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{calculateSubtotal().toFixed(2)} SR</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Delivery</span>
                  <span className={calculateDeliveryFee() === 0 ? 'font-medium text-green-600' : 'font-medium text-gray-700'}>
                    {calculateDeliveryFee() === 0 ? 'FREE' : `${calculateDeliveryFee().toFixed(2)} SR`}
                  </span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold pt-3 border-t border-gray-300">
                  <span>Total Amount</span>
                  <span className="text-2xl text-amber-600">{calculateTotal().toFixed(2)} SR</span>
                </div>
              </div>
            </div>

            {/* Delivery Address Form */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center mb-6">
                <MapPin className="w-6 h-6 mr-2 text-blue-500" />
                <h2 className="text-xl font-bold text-gray-800">Delivery Address</h2>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="w-4 h-4 inline mr-1" />
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={addressForm.fullName}
                      onChange={(e) => handleAddressChange('fullName', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter your full name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="w-4 h-4 inline mr-1" />
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={addressForm.phone}
                      onChange={(e) => handleAddressChange('phone', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="+966 500 000 000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Home className="w-4 h-4 inline mr-1" />
                    Full Address *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={addressForm.address}
                    onChange={(e) => handleAddressChange('address', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    placeholder="Street address, building, apartment, suite, etc."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                    <select
                      value={addressForm.city}
                      onChange={(e) => handleAddressChange('city', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                    >
                      <option value="Riyadh">Riyadh</option>
                      <option value="Jeddah">Jeddah</option>
                      <option value="Dammam">Dammam</option>
                      <option value="Mecca">Mecca</option>
                      <option value="Medina">Medina</option>
                      <option value="Khobar">Khobar</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
                    <input
                      type="text"
                      value={addressForm.district}
                      onChange={(e) => handleAddressChange('district', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="District / Area"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                    <input
                      type="text"
                      value={addressForm.postalCode}
                      onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="12345"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MessageSquare className="w-4 h-4 inline mr-1" />
                    Additional Notes
                  </label>
                  <textarea
                    rows={2}
                    value={addressForm.additionalNotes}
                    onChange={(e) => handleAddressChange('additionalNotes', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    placeholder="Delivery instructions, gate code, etc."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Payment & Order Button */}
          <div className="space-y-6">
            {/* Payment Method */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center mb-6">
                <CreditCard className="w-6 h-6 mr-2 text-purple-500" />
                <h2 className="text-xl font-bold text-gray-800">Payment Method</h2>
              </div>
              
              <div className="space-y-3">
                {[
                  { value: 'card', icon: CreditCard, label: 'Credit/Debit Card', color: 'text-blue-500' },
                  { value: 'cash', icon: Wallet, label: 'Cash on Delivery', color: 'text-green-500' },
                  { value: 'mada', label: 'Mada', color: 'text-red-500' },
                  { value: 'apple-pay', label: 'Apple Pay', color: 'text-black' }
                ].map((method) => (
                  <label 
                    key={method.value}
                    className={`flex items-center space-x-4 p-4 border-2 rounded-xl cursor-pointer transition-all hover:scale-[1.02] ${
                      paymentMethod === method.value 
                        ? 'border-amber-500 bg-amber-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={method.value}
                      checked={paymentMethod === method.value}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-5 h-5 text-amber-500 focus:ring-amber-500"
                    />
                    {method.icon && <method.icon className={`w-5 h-5 ${method.color}`} />}
                    <span className="flex-1 font-medium">{method.label}</span>
                    {method.value === 'cash' && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">No fees</span>
                    )}
                  </label>
                ))}
              </div>

              {paymentMethod === 'cash' && (
                <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl">
                  <div className="flex items-center mb-2">
                    <Wallet className="w-5 h-5 text-yellow-600 mr-2" />
                    <p className="font-semibold text-yellow-800">Cash on Delivery</p>
                  </div>
                  <p className="text-sm text-yellow-700">
                    💵 Pay cash when your order arrives. Please have exact change ready. 
                    No additional payment processing fees.
                  </p>
                </div>
              )}
            </div>

            {/* Delivery Info */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center mb-4">
                <Truck className="w-6 h-6 mr-2 text-green-500" />
                <h2 className="text-xl font-bold text-gray-800">Delivery Information</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                  <span className="font-medium text-gray-700">Delivery Fee</span>
                  <span className="font-bold text-green-600 text-lg">
                    {calculateDeliveryFee() === 0 ? 'FREE' : `${calculateDeliveryFee().toFixed(2)} SR`}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                  <span className="font-medium text-gray-700">Estimated Delivery</span>
                  <span className="font-semibold text-blue-700">
                    {orderType === 'custom' 
                      ? '2-4 weeks (custom production)'
                      : isDirectCheckout 
                        ? (getCurrentOrder()?.deliveryInfo?.delivery_time || '3-5 business days')
                        : '3-5 business days'
                    }
                  </span>
                </div>
                
                {orderType === 'custom' && (
                  <div className="p-3 bg-purple-50 rounded-xl">
                    <div className="flex items-center mb-1">
                      <Scissors className="w-4 h-4 text-purple-600 mr-2" />
                      <p className="text-sm font-medium text-purple-800">Custom Order Notice</p>
                    </div>
                    <p className="text-sm text-purple-700">
                      This is a custom furniture order. Production takes 2-4 weeks. 
                      Our design team will contact you within 24 hours.
                    </p>
                  </div>
                )}
                
                {isDirectCheckout && getCurrentOrder()?.sellerInfo && (
                  <div className="p-3 bg-indigo-50 rounded-xl">
                    <p className="text-sm font-medium text-indigo-800 mb-1">Seller Information</p>
                    <p className="text-sm text-indigo-700">
                      {getCurrentOrder()?.sellerInfo?.business_name} • {getCurrentOrder()?.deliveryInfo?.delivery_option || 'Standard delivery'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Order Button & Security */}
            <div className="space-y-4">
              <button
                onClick={handlePlaceOrder}
                disabled={isProcessing}
                className={`w-full py-5 rounded-2xl font-bold text-lg transition-all shadow-lg hover:shadow-xl ${
                  isProcessing 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : orderType === 'custom'
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700'
                } text-white flex items-center justify-center space-x-3`}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    <span>Processing Your Order...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-6 h-6" />
                    <div className="text-center">
                      <div className="text-xl">
                        {orderType === 'custom' ? 'Place Custom Order' : paymentMethod === 'cash' ? 'Place Order' : 'Pay Now'} - {calculateTotal().toFixed(2)} SR
                      </div>
                      <div className="text-sm font-normal opacity-90">
                        {orderType === 'custom' ? 'Custom Production • 2-4 weeks' : !user ? 'Guest Checkout • No login required' : 'Secure Payment'}
                      </div>
                    </div>
                    <Lock className="w-5 h-5" />
                  </>
                )}
              </button>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5">
                <div className="flex items-center mb-3">
                  <Shield className="w-5 h-5 mr-2 text-blue-500" />
                  <h4 className="font-semibold text-blue-800">100% Secure Checkout</h4>
                </div>
                <div className="space-y-2 text-sm text-blue-700">
                  <p className="flex items-center">
                    <Check className="w-4 h-4 mr-2 text-green-500" />
                    Your payment information is secured with bank-level 256-bit SSL encryption
                  </p>
                  <p className="flex items-center">
                    <Check className="w-4 h-4 mr-2 text-green-500" />
                    Order will appear in <strong>{orderType === 'custom' ? 'Custom Orders' : 'Ready Orders'}</strong> section
                  </p>
                  <p className="flex items-center">
                    <Check className="w-4 h-4 mr-2 text-green-500" />
                    {orderType === 'custom' ? 'Design team notified' : 'Seller notified'} & can update order status
                  </p>
                  <p className="flex items-center">
                    <Check className="w-4 h-4 mr-2 text-green-500" />
                    Admin can monitor & resolve disputes
                  </p>
                </div>
                {orderType === 'custom' && (
                  <p className="text-xs text-purple-600 mt-3 pt-3 border-t border-blue-200">
                    🎨 <strong>Custom Order Process:</strong> After payment, our design team contacts you within 24 hours 
                    to finalize design details before production begins.
                  </p>
                )}
                {!user && (
                  <p className="text-xs text-blue-600 mt-3 pt-3 border-t border-blue-200">
                    💡 <strong>Guest Checkout:</strong> You can track your order using your phone number. 
                    Order will be saved to all dashboards for processing.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};