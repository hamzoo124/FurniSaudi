import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, Heart, Star, MapPin, Truck, Eye } from 'lucide-react';
import { supabase, Product } from '../lib/supabase';

interface QuickViewModalProps {
  productId: string | null;
  onClose: () => void;
  onNavigate: (page: string) => void;
  onAddToCart: (productId: string) => void;
  onToggleWishlist: (productId: string) => void;
  wishlistItems: string[];
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({
  productId,
  onClose,
  onNavigate,
  onAddToCart,
  onToggleWishlist,
  wishlistItems
}) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    if (!productId) return;

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .maybeSingle();

    if (!error && data) {
      setProduct(data as Product);
    }
    setLoading(false);
  };

  if (!productId) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
          </div>
        ) : product ? (
          <div className="relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
              {/* Image Section */}
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden bg-gray-100">
                  <img
                    src={product.images?.[selectedImage] || 'https://images.pexels.com/photos/1866149/pexels-photo-1866149.jpeg?auto=compress&cs=tinysrgb&w=600'}
                    alt={product.title}
                    className="w-full h-80 object-cover"
                  />
                  <div className="absolute top-3 right-3 bg-amber-500 text-white px-3 py-1 rounded-full font-bold shadow-lg">
                    {product.price} SR
                  </div>
                </div>
                {product.images && product.images.length > 1 && (
                  <div className="flex space-x-2 overflow-x-auto">
                    {product.images.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                          selectedImage === index ? 'border-amber-500 ring-2 ring-amber-200' : 'border-gray-200'
                        }`}
                      >
                        <img
                          src={img}
                          alt={`${product.title} ${index + 1}`}
                          className="w-16 h-16 object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Info Section */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-amber-500 fill-amber-500" />
                    ))}
                    <span className="ml-2 text-sm text-gray-600">(5.0)</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">{product.title}</h2>
                  <p className="text-gray-600 text-sm line-clamp-3 mb-3">{product.description}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-700">
                    <MapPin className="w-4 h-4 text-amber-500" />
                    <span>{product.city}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-700">
                    <Truck className="w-4 h-4 text-amber-500" />
                    <span>
                      {product.delivery_option === 'free' ? 'Free Delivery' : `Delivery: ${product.delivery_price} SR`}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <label className="font-medium text-gray-700">Quantity:</label>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-8 h-8 border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-bold"
                      >
                        -
                      </button>
                      <span className="w-10 text-center font-semibold">{quantity}</span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-8 h-8 border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        for (let i = 0; i < quantity; i++) {
                          onAddToCart(product.id);
                        }
                        onClose();
                      }}
                      className="w-full bg-amber-500 text-white py-3 rounded-lg font-semibold hover:bg-amber-600 transition-colors flex items-center justify-center space-x-2"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      <span>Add to Cart</span>
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => onToggleWishlist(product.id)}
                        className={`py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 ${
                          wishlistItems.includes(product.id)
                            ? 'bg-red-50 text-red-600 border-2 border-red-500'
                            : 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Heart
                          className={`w-5 h-5 ${wishlistItems.includes(product.id) ? 'fill-red-500' : ''}`}
                        />
                        <span>Wishlist</span>
                      </button>

                      <button
                        onClick={() => {
                          onClose();
                          onNavigate(`product-${product.id}`);
                        }}
                        className="border-2 border-amber-500 text-amber-500 py-3 rounded-lg font-semibold hover:bg-amber-50 transition-colors flex items-center justify-center space-x-2"
                      >
                        <Eye className="w-5 h-5" />
                        <span>Full Details</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500">
            Product not found
          </div>
        )}
      </div>
    </div>
  );
};
