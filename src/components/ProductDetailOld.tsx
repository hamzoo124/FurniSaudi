import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Product } from '../lib/supabase';
import { ArrowLeft, ShoppingCart, Star, MapPin, Truck, Shield, Package } from 'lucide-react';

interface ProductDetailProps {
  productId: string;
  onNavigate: (page: string) => void;
  onAddToCart: (productId: string) => void;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({ productId, onNavigate, onAddToCart }) => {
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    const { data: productData, error } = await supabase
      .from('products')
      .select(`
        *,
        sellers (
          id,
          business_name,
          logo,
          city,
          contact_number,
          contact_email,
          users (
            name
          )
        )
      `)
      .eq('id', productId)
      .maybeSingle();

    if (!error && productData) {
      setProduct(productData as Product);
      setSeller(productData.sellers);
    }
    setLoading(false);
  };

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      onAddToCart(productId);
    }
    alert(`Added ${quantity} item(s) to cart!`);
  };

  const handleBuyNow = async () => {
    if (!user) {
      onNavigate('auth-buyer');
      return;
    }

    if (user.role !== 'buyer') {
      alert('Only buyers can purchase products');
      return;
    }

    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          buyer_id: user.id,
          seller_id: product?.seller_id,
          product_id: product?.id,
          quantity: quantity,
          total_amount: product ? product.price * quantity : 0,
          order_status: 'pending',
          payment_status: 'pending',
        },
      ])
      .select()
      .single();

    if (!error) {
      await supabase.from('notifications').insert([
        {
          user_id: user.id,
          message: `Your order for ${product?.title} has been placed successfully`,
          type: 'order_placed',
          related_id: data.id,
        },
      ]);

      alert('Order placed successfully!');
      onNavigate('buyer-dashboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Product not found</h2>
          <button
            onClick={() => onNavigate('home')}
            className="bg-amber-500 text-white px-6 py-2 rounded-lg hover:bg-amber-600 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center space-x-2 text-gray-600 hover:text-amber-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Products</span>
          </button>
        </div>
      </header>

      {/* Product Details */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <img
                src={product.images?.[selectedImage] || 'https://images.pexels.com/photos/1866149/pexels-photo-1866149.jpeg?auto=compress&cs=tinysrgb&w=800'}
                alt={product.title}
                className="w-full h-96 object-cover"
              />
            </div>
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`bg-white rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === index ? 'border-amber-500' : 'border-gray-200 hover:border-amber-300'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.title} ${index + 1}`}
                      className="w-full h-20 object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-amber-500 fill-amber-500" />
                ))}
                <span className="ml-2 text-sm text-gray-600">(5.0)</span>
              </div>

              <h1 className="text-3xl font-bold text-gray-800 mb-4">{product.title}</h1>

              <div className="flex items-baseline space-x-4 mb-6">
                <span className="text-4xl font-bold text-amber-600">{product.price} SR</span>
                {product.type === 'customized' && (
                  <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                    Customizable
                  </span>
                )}
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-2 text-gray-700">
                  <MapPin className="w-5 h-5 text-amber-500" />
                  <span>Available in {product.city}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-700">
                  <Package className="w-5 h-5 text-amber-500" />
                  <span>Category: {product.category}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-700">
                  <Truck className="w-5 h-5 text-amber-500" />
                  <span>
                    {product.delivery_option === 'free' ? 'Free Delivery' : `Delivery: ${product.delivery_price} SR`}
                  </span>
                </div>
                {product.stock_quantity > 0 && (
                  <div className="flex items-center space-x-2 text-green-600">
                    <Shield className="w-5 h-5" />
                    <span>{product.stock_quantity} in stock</span>
                  </div>
                )}
              </div>

              <div className="border-t pt-6 mb-6">
                <h3 className="font-semibold text-lg mb-2">Description</h3>
                <p className="text-gray-700 leading-relaxed">{product.description}</p>
              </div>

              {product.material && (
                <div className="border-t pt-6 mb-6">
                  <h3 className="font-semibold text-lg mb-2">Material</h3>
                  <p className="text-gray-700">{product.material}</p>
                </div>
              )}

              <div className="flex items-center space-x-4 mb-6">
                <label className="font-semibold">Quantity:</label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-semibold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleBuyNow}
                  className="w-full bg-amber-500 text-white py-3 rounded-lg font-semibold hover:bg-amber-600 transition-colors"
                >
                  Buy Now
                </button>
                <button
                  onClick={handleAddToCart}
                  className="w-full border-2 border-amber-500 text-amber-500 py-3 rounded-lg font-semibold hover:bg-amber-50 transition-colors flex items-center justify-center space-x-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>Add to Cart</span>
                </button>
              </div>
            </div>

            {/* Seller Info */}
            {seller && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="font-bold text-lg mb-4">Seller Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold text-gray-800">{seller.business_name}</p>
                    <p className="text-sm text-gray-600">{seller.city}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-amber-500 fill-amber-500" />
                    ))}
                    <span className="text-sm text-gray-600">(5.0 rating)</span>
                  </div>
                  <button
                    onClick={() => {
                      if (user) {
                        alert('Chat feature coming soon!');
                      } else {
                        onNavigate('auth-buyer');
                      }
                    }}
                    className="w-full bg-gray-800 text-white py-2 rounded-lg hover:bg-gray-900 transition-colors"
                  >
                    Contact Seller
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
