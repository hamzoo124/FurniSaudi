// components/ShoppingCart.tsx (Fixed)
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, Plus, Minus, ShoppingBag, CreditCard, Check, Tag, Truck, Shield } from 'lucide-react';
// import { supabase } from '../lib/supabase.client';
import { supabase } from '../lib/supabase';

import { useAuth } from '../contexts/AuthContext';

interface CartItem {
  product: any;
  quantity: number;
}

interface ShoppingCartProps {
  onNavigate: (page: string) => void;
  cartItems: string[];
  onUpdateCart: (items: string[]) => void;
}

export const ShoppingCart: React.FC<ShoppingCartProps> = ({ onNavigate, cartItems, onUpdateCart }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    fetchCartProducts();
  }, [cartItems]);

  const fetchCartProducts = async () => {
    if (cartItems.length === 0) {
      setCart([]);
      setLoading(false);
      return;
    }

    try {
      // First try to get from localStorage
      const savedProducts = localStorage.getItem('furnitureProducts');
      if (savedProducts) {
        const products = JSON.parse(savedProducts);
        const cartMap = new Map<string, number>();
        
        cartItems.forEach(id => {
          cartMap.set(id, (cartMap.get(id) || 0) + 1);
        });

        const cartData: CartItem[] = [];
        cartMap.forEach((quantity, productId) => {
          const product = products.find((p: any) => p.id === productId);
          if (product) {
            cartData.push({
              product: {
                id: product.id,
                title: product.name,
                price: typeof product.price === 'string' ? 
                  parseInt(product.price.replace('$', '')) || 0 : 
                  product.price || 0,
                images: product.images || [],
                city: product.city || 'Riyadh',
                delivery_option: 'free',
                delivery_price: 0,
                stock_quantity: product.stock || 10
              },
              quantity
            });
          }
        });

        setCart(cartData);
      }
    } catch (error) {
      console.error('Error loading cart products:', error);
    }
    setLoading(false);
  };

  const updateQuantity = (productId: string, change: number) => {
    const newCart = cart.map(item => {
      if (item.product.id === productId) {
        const newQuantity = Math.max(1, item.quantity + change);
        return { ...item, quantity: newQuantity };
      }
      return item;
    });
    setCart(newCart);
    updateCartItems(newCart);
  };

  const removeItem = (productId: string) => {
    const newCart = cart.filter(item => item.product.id !== productId);
    setCart(newCart);
    updateCartItems(newCart);
  };

  const updateCartItems = (cartData: CartItem[]) => {
    const newCartItems: string[] = [];
    cartData.forEach(item => {
      for (let i = 0; i < item.quantity; i++) {
        newCartItems.push(item.product.id);
      }
    });
    onUpdateCart(newCartItems);
  };

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    return subtotal - discount;
  };

  const applyPromoCode = () => {
    if (promoCode.toUpperCase() === 'SAVE10') {
      setDiscount(calculateSubtotal() * 0.1);
      alert('Promo code applied: 10% discount!');
    } else if (promoCode.toUpperCase() === 'SAVE500') {
      setDiscount(500);
      alert('Promo code applied: 500 SR discount!');
    } else {
      alert('Invalid promo code');
    }
  };

  const handleCheckout = () => {
    if (!user) {
      onNavigate('auth-buyer');
      return;
    }
    onNavigate('checkout');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  const subtotal = calculateSubtotal();
  const total = calculateTotal();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center space-x-2 text-gray-600 hover:text-amber-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Continue Shopping</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Shopping Cart</h1>

        {cart.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-600 mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-6">Add some products to get started</p>
            <button
              onClick={() => onNavigate('home')}
              className="bg-amber-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-amber-600 transition-colors"
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => (
                <div key={item.product.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-start space-x-4">
                    <img
                      src={item.product.images?.[0] || 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=200&h=200&fit=crop'}
                      alt={item.product.title}
                      className="w-24 h-24 object-cover rounded-lg cursor-pointer hover:opacity-75 transition-opacity"
                      onClick={() => onNavigate(`product-${item.product.id}`)}
                    />
                    <div className="flex-1">
                      <h3
                        className="font-semibold text-lg mb-1 cursor-pointer hover:text-amber-600 transition-colors"
                        onClick={() => onNavigate(`product-${item.product.id}`)}
                      >
                        {item.product.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">{item.product.city}</p>
                      <div className="flex items-center space-x-4">
                        <span className="text-2xl font-bold text-amber-600">{item.product.price} SR</span>
                        {item.product.delivery_option === 'paid' && (
                          <span className="text-sm text-gray-500">+ {item.product.delivery_price} SR delivery</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-4">
                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="text-red-500 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <div className="flex items-center space-x-2 bg-gray-100 rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="p-2 hover:bg-gray-200 rounded-l-lg transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="px-4 font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="p-2 hover:bg-gray-200 rounded-r-lg transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="font-semibold text-lg">
                        {(item.product.price * item.quantity).toFixed(2)} SR
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1 space-y-4">
              {/* Promo Code */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl shadow-lg p-4 border-2 border-amber-200">
                <div className="flex items-center space-x-2 mb-3">
                  <Tag className="w-5 h-5 text-amber-600" />
                  <h3 className="font-bold text-gray-800">Promo Code</h3>
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Enter code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    onClick={applyPromoCode}
                    className="bg-amber-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-amber-600 transition-colors"
                  >
                    Apply
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-2">Try: SAVE10 or SAVE500</p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4">
                <h2 className="text-xl font-bold mb-4">Order Summary</h2>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({cart.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                    <span className="font-semibold">{subtotal.toFixed(2)} SR</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span className="flex items-center space-x-1">
                      <Truck className="w-4 h-4" />
                      <span>Delivery</span>
                    </span>
                    <span className="font-semibold text-green-600">Free</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span className="flex items-center space-x-1">
                        <Tag className="w-4 h-4" />
                        <span>Discount</span>
                      </span>
                      <span className="font-semibold">-{discount.toFixed(2)} SR</span>
                    </div>
                  )}
                  <div className="border-t pt-3 flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-amber-600">{total.toFixed(2)} SR</span>
                  </div>
                </div>

                {/* Benefits */}
                <div className="space-y-2 mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2 text-sm text-gray-700">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span>Secure Payment</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-700">
                    <Truck className="w-4 h-4 text-blue-600" />
                    <span>Fast Delivery</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-amber-600" />
                    <span>Quality Guaranteed</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full bg-amber-500 text-white py-3 rounded-lg font-semibold hover:bg-amber-600 transition-colors flex items-center justify-center space-x-2 mb-3"
                >
                  <CreditCard className="w-5 h-5" />
                  <span>Proceed to Checkout</span>
                </button>

                <button
                  onClick={() => onNavigate('home')}
                  className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};