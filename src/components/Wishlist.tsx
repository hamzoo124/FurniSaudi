import React, { useState, useEffect } from 'react';
import { ArrowLeft, Heart, ShoppingCart, Trash2, Grid, List, TrendingUp, Bell, Share2, CheckCircle } from 'lucide-react';
import { supabase, Product } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface WishlistProps {
  onNavigate: (page: string) => void;
  wishlistItems: string[];
  onUpdateWishlist: (items: string[]) => void;
  onAddToCart: (productId: string) => void;
}

export const Wishlist: React.FC<WishlistProps> = ({
  onNavigate,
  wishlistItems,
  onUpdateWishlist,
  onAddToCart
}) => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [priceAlerts, setPriceAlerts] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  useEffect(() => {
    fetchWishlistProducts();
  }, [wishlistItems]);

  const fetchWishlistProducts = async () => {
    if (wishlistItems.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .in('id', wishlistItems);

    if (!error && data) {
      setProducts(data as Product[]);
    }
    setLoading(false);
  };

  const removeFromWishlist = (productId: string) => {
    const newWishlist = wishlistItems.filter(id => id !== productId);
    onUpdateWishlist(newWishlist);
  };

  const moveToCart = (productId: string) => {
    onAddToCart(productId);
    removeFromWishlist(productId);
  };

  const moveAllToCart = () => {
    selectedItems.forEach(id => onAddToCart(id));
    const newWishlist = wishlistItems.filter(id => !selectedItems.includes(id));
    onUpdateWishlist(newWishlist);
    setSelectedItems([]);
  };

  const togglePriceAlert = (productId: string) => {
    if (priceAlerts.includes(productId)) {
      setPriceAlerts(priceAlerts.filter(id => id !== productId));
    } else {
      setPriceAlerts([...priceAlerts, productId]);
      alert('Price alert activated! We\'ll notify you when price drops.');
    }
  };

  const toggleSelectItem = (productId: string) => {
    if (selectedItems.includes(productId)) {
      setSelectedItems(selectedItems.filter(id => id !== productId));
    } else {
      setSelectedItems([...selectedItems, productId]);
    }
  };

  const shareWishlist = () => {
    const text = `Check out my wishlist on FurniSouq: ${products.length} amazing furniture items!`;
    if (navigator.share) {
      navigator.share({ title: 'My Wishlist', text });
    } else {
      alert('Wishlist sharing is ready!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center space-x-2 text-gray-600 hover:text-amber-500 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Shopping</span>
            </button>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'grid' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'list' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center space-x-3">
              <Heart className="w-8 h-8 text-red-500 fill-red-500" />
              <span>My Wishlist</span>
            </h1>
            <p className="text-gray-600 mt-2">{products.length} items saved</p>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Heart className="w-24 h-24 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-600 mb-2">Your wishlist is empty</h2>
            <p className="text-gray-500 mb-6">Save your favorite products to view them later</p>
            <button
              onClick={() => onNavigate('home')}
              className="bg-amber-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-amber-600 transition-colors"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'
              : 'space-y-4'
          }>
            {products.map((product) => (
              viewMode === 'grid' ? (
                <div
                  key={product.id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all group"
                >
                  <div className="relative">
                    <img
                      src={product.images?.[0] || 'https://images.pexels.com/photos/1866149/pexels-photo-1866149.jpeg?auto=compress&cs=tinysrgb&w=400'}
                      alt={product.title}
                      onClick={() => onNavigate(`product-${product.id}`)}
                      className="w-full h-56 object-cover cursor-pointer group-hover:scale-105 transition-transform duration-300"
                    />
                    <button
                      onClick={() => removeFromWishlist(product.id)}
                      className="absolute top-3 right-3 bg-white p-2 rounded-full shadow-lg hover:bg-red-50 transition-colors"
                    >
                      <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                    </button>
                    <div className="absolute bottom-3 left-3 bg-amber-500 text-white px-3 py-1 rounded-full font-bold">
                      {product.price} SR
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3
                        onClick={() => onNavigate(`product-${product.id}`)}
                        className="font-semibold text-lg line-clamp-1 cursor-pointer hover:text-amber-600 transition-colors flex-1"
                      >
                        {product.title}
                      </h3>
                      {priceAlerts.includes(product.id) && (
                        <span className="flex items-center space-x-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full ml-2">
                          <CheckCircle className="w-3 h-3" />
                          <span>Alert</span>
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{product.city}</p>
                    {product.stock_quantity && product.stock_quantity <= 5 && (
                      <p className="text-xs text-orange-600 font-medium mb-2">Only {product.stock_quantity} left!</p>
                    )}
                    <div className="space-y-2">
                      <button
                        onClick={() => moveToCart(product.id)}
                        className="w-full bg-amber-500 text-white py-2 rounded-lg font-semibold hover:bg-amber-600 transition-colors flex items-center justify-center space-x-2"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>Move to Cart</span>
                      </button>
                      <button
                        onClick={() => onNavigate(`product-${product.id}`)}
                        className="w-full border-2 border-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  key={product.id}
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-start space-x-4">
                    <img
                      src={product.images?.[0] || 'https://images.pexels.com/photos/1866149/pexels-photo-1866149.jpeg?auto=compress&cs=tinysrgb&w=200'}
                      alt={product.title}
                      onClick={() => onNavigate(`product-${product.id}`)}
                      className="w-32 h-32 object-cover rounded-lg cursor-pointer hover:opacity-75 transition-opacity"
                    />
                    <div className="flex-1">
                      <h3
                        onClick={() => onNavigate(`product-${product.id}`)}
                        className="font-semibold text-xl mb-2 cursor-pointer hover:text-amber-600 transition-colors"
                      >
                        {product.title}
                      </h3>
                      <p className="text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                      <p className="text-sm text-gray-500 mb-4">{product.city}</p>
                      <div className="flex items-center space-x-4">
                        <span className="text-2xl font-bold text-amber-600">{product.price} SR</span>
                        <button
                          onClick={() => moveToCart(product.id)}
                          className="bg-amber-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-amber-600 transition-colors flex items-center space-x-2"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          <span>Add to Cart</span>
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromWishlist(product.id)}
                      className="text-red-500 hover:text-red-600 transition-colors p-2"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
