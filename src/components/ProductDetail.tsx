import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.client';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowLeft, ShoppingCart, Star, MapPin, Truck, Shield, Package,
  Heart, Share2, MessageCircle, X, ChevronLeft, ChevronRight,
  Send, Check, Calendar, Clock, User, ThumbsUp, Factory,
  Ruler, Palette, Weight, Box, BadgeCheck, Settings, Edit3,
  Plus, Minus, Tag, FileText, Phone, Mail, MessageSquare,
  Info, Scissors, Wrench, Palette as PaletteIcon, Ruler as RulerIcon,
  FileSignature, ClipboardCheck, Maximize2, FileCheck
} from 'lucide-react';
import Customization, { useCustomization } from "./Customization";

interface ProductDetailProps {
  productId: string;
  onNavigate: (page: string, data?: any) => void;
  onAddToCart: (productId: string, customization?: any, quantity?: number) => void;
  onToggleWishlist: (productId: string) => void;
  wishlistItems: string[];
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  buyer_name: string;
  created_at: string;
  helpful_count: number;
  is_verified: boolean;
}

interface CustomizationRequestData {
  id: string;
  requirements: string;
  budget: string;
  timeline: string;
  contactPreference: string;
  specialRequests: string;
  productName: string;
  productId: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: 'pending' | 'in-progress' | 'completed' | 'rejected';
  createdAt: string;
  updatedAt?: string;
}

interface MeasurementRequestData {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  buyerAddress: string;
  sellerId: string;
  sellerName: string;
  preferredDate: string;
  preferredTime: string;
  measurementNotes: string;
  specialRequirements: string;
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled';
  estimatedBudget?: number;
  contractGenerated: boolean;
  contractId?: string;
  createdAt: string;
  updatedAt?: string;
}

const mockSellers = {
  "1": {
    id: "1",
    business_name: "Giga Home",
    logo: "https://i.pinimg.com/736x/bb/fa/77/bbfa7777e9b4091b9ba254b407914b65.jpg",
    city: "Riyadh",
    address: "Industrial Zone, District 3, Riyadh 13521",
    contact_number: "+966 123 456 789",
    contact_email: "sales@gigahome.com",
    user_id: "1",
    users: { name: "Giga Home Team" },
    rating: 4.8,
    joined_date: "2022-01-15",
    total_products: 45,
    response_rate: "98%",
    factory_info: {
      working_hours: "Sunday - Thursday: 8:00 AM - 6:00 PM",
      tour_duration: "1-2 hours",
      max_visitors: 10,
      facilities: ["Showroom", "Production Area", "Quality Control", "Design Studio"]
    }
  }
};

const getProductsFromStorage = () => {
  try {
    const savedProducts = localStorage.getItem('furnitureProducts');
    if (savedProducts) {
      const parsedProducts = JSON.parse(savedProducts);
      console.log('📦 Parsed products from storage:', parsedProducts.length);
      return parsedProducts.map((product: any, index: number) => ({
        id: product.id || `prod_${index}`,
        title: product.name || product.title || 'Unnamed Product',
        price: product.price || '0',
        description: product.description || 'No description available',
        shortDescription: product.shortDescription || product.description?.substring(0, 100) + '...',
        category: product.category || 'Living Room',
        subcategory: product.subcategory || '',
        section: product.section || '',
        type: product.type || 'ready',
        placement: product.placement || 'indoor',
        city: product.city || 'Riyadh',
        availableCities: product.availableCities || ['Riyadh'],
        delivery_option: product.delivery_option || 'free',
        delivery_price: product.delivery_price || '0',
        delivery_time: product.delivery_time || '3-5 days',
        shipping: product.shipping || { withinCity: { free: true, cost: 0, deliveryTime: '3-5 days' } },
        stock_quantity: product.stock || product.stock_quantity || 10,
        orders: product.orders || '0',
        reviews: product.reviews || '0',
        material: product.material || 'Wood',
        finishType: product.finishType || 'Matte',
        primaryColor: product.primaryColor || 'Brown',
        availableColors: product.availableColors || ['Brown', 'Black', 'White'],
        dimensions: product.dimensions || { length: '200', width: '100', height: '80', unit: 'cm' },
        weight: product.weight || '50 kg',
        brand: product.brand || 'Giga Home',
        seller_id: product.seller_id || '1',
        isTopSeller: product.isTopSeller || false,
        rating: product.rating || '4.5',
        status: product.status || 'active',
        originalPrice: product.originalPrice || (product.price ? (parseFloat(product.price) * 1.4).toString() : '0'),
        discount: product.discount || '35%',
        warranty: product.warranty || '3 mon',
        images: product.images || (product.image ? [product.image] : ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80']),
        variants: product.variants || [],
        features: product.features || ['High Quality', 'Durable', 'Easy Assembly'],
        policies: product.policies || { returnPolicy: '30 days', warranty: '3 months' }
      }));
    }
  } catch (error) {
    console.error('❌ Error loading products:', error);
  }
  return [];
};

const MeasurementRequestModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MeasurementRequestData) => void;
  product: any;
  seller: any;
}> = ({ isOpen, onClose, onSubmit, product, seller }) => {
  const { user } = useAuth();
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [measurementNotes, setMeasurementNotes] = useState('');
  const [specialRequirements, setSpecialRequirements] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('+966 ');
  const [estimatedBudget, setEstimatedBudget] = useState('');

  useEffect(() => {
    if (user) {
      const savedAddress = localStorage.getItem('user_address');
      const savedPhone = localStorage.getItem('user_phone');
      
      if (savedAddress) setBuyerAddress(savedAddress);
      if (savedPhone) setBuyerPhone(savedPhone);
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert('Please sign in to request measurement');
      onNavigate('home', { showAuthModal: true, authType: 'signin' });
      return;
    }

    if (!preferredDate || !preferredTime) {
      alert('Please select date and time for measurement');
      return;
    }

    if (!buyerAddress.trim()) {
      alert('Please provide your address for measurement');
      return;
    }

    if (!buyerPhone.trim() || buyerPhone.length < 9) {
      alert('Please provide a valid phone number');
      return;
    }

    const measurementData: MeasurementRequestData = {
      id: `measure_${Date.now()}`,
      productId: product.id,
      productName: product.title,
      productImage: product.images?.[0] || '',
      buyerId: user.id,
      buyerName: user.name || 'Buyer',
      buyerEmail: user.email,
      buyerPhone: buyerPhone,
      buyerAddress: buyerAddress,
      sellerId: seller.id,
      sellerName: seller.business_name,
      preferredDate,
      preferredTime,
      measurementNotes,
      specialRequirements,
      status: 'pending',
      estimatedBudget: estimatedBudget ? parseFloat(estimatedBudget) : undefined,
      contractGenerated: false,
      createdAt: new Date().toISOString()
    };

    localStorage.setItem('user_address', buyerAddress);
    localStorage.setItem('user_phone', buyerPhone);

    onSubmit(measurementData);
  };

  if (!isOpen) return null;

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Request On-site Measurement</h3>
            <p className="text-gray-600 text-sm mt-1">Schedule a professional measurement for your custom furniture</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <img 
                src={product.images?.[0]} 
                alt={product.title}
                className="w-16 h-16 object-cover rounded-lg border-2 border-white"
              />
              <div>
                <h4 className="font-semibold text-gray-900">{product.title}</h4>
                <p className="text-sm text-gray-600">Seller: {seller.business_name}</p>
                <p className="text-xs text-gray-500">Custom furniture requires precise measurements</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Address for Measurement *
            </label>
            <textarea
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Enter complete address where measurement should be done"
              value={buyerAddress}
              onChange={(e) => setBuyerAddress(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Phone Number *
            </label>
            <input
              type="tel"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+966 500 000 000"
              value={buyerPhone}
              onChange={(e) => setBuyerPhone(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Date *
              </label>
              <input
                type="date"
                required
                min={today}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Time *
              </label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
              >
                <option value="">Select Time</option>
                <option value="08:00-10:00">8:00 AM - 10:00 AM</option>
                <option value="10:00-12:00">10:00 AM - 12:00 PM</option>
                <option value="12:00-14:00">12:00 PM - 2:00 PM</option>
                <option value="14:00-16:00">2:00 PM - 4:00 PM</option>
                <option value="16:00-18:00">4:00 PM - 6:00 PM</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Budget (SAR)
            </label>
            <input
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your budget range if known"
              value={estimatedBudget}
              onChange={(e) => setEstimatedBudget(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Measurement Notes
            </label>
            <textarea
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Any specific areas, rooms, or requirements for measurement..."
              value={measurementNotes}
              onChange={(e) => setMeasurementNotes(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Special Requirements
            </label>
            <textarea
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Access restrictions, parking instructions, special needs..."
              value={specialRequirements}
              onChange={(e) => setSpecialRequirements(e.target.value)}
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
              <Info className="w-5 h-5 mr-2" />
              What happens next?
            </h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li className="flex items-center">
                <Check className="w-4 h-4 mr-2 text-green-500" />
                Seller confirms measurement appointment within 24 hours
              </li>
              <li className="flex items-center">
                <Check className="w-4 h-4 mr-2 text-green-500" />
                Professional measurement at your location
              </li>
              <li className="flex items-center">
                <Check className="w-4 h-4 mr-2 text-green-500" />
                Receive detailed quote and contract
              </li>
              <li className="flex items-center">
                <Check className="w-4 h-4 mr-2 text-green-500" />
                Approve final design before production
              </li>
            </ul>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-colors font-medium flex items-center justify-center space-x-2"
            >
              <Maximize2 className="w-5 h-5" />
              <span>Request Measurement</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EnhancedCustomizationRequestModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  product: any;
  customization?: any;
}> = ({ isOpen, onClose, onSubmit, product, customization }) => {
  const { user } = useAuth();
  const [requirements, setRequirements] = useState('');
  const [budget, setBudget] = useState('');
  const [timeline, setTimeline] = useState('');
  const [contactPreference, setContactPreference] = useState('whatsapp');
  const [specialRequests, setSpecialRequests] = useState('');
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    if (customization) {
      setRequirements(generateCustomizationSummary(customization));
      setBudget(`${customization.totalPrice} SR`);
    }
  }, [customization]);

  const generateCustomizationSummary = (customization: any) => {
    const summary = [];
    
    summary.push(`Material: ${customization.selectedMaterial}`);
    summary.push(`Finish: ${customization.selectedFinish}`);
    summary.push(`Color: ${customization.selectedColor}`);
    
    if (customization.customDimensions && 
        (customization.customDimensions.length || 
         customization.customDimensions.width || 
         customization.customDimensions.height)) {
      summary.push(`Dimensions: ${customization.customDimensions.length || 'Original'} x ${customization.customDimensions.width || 'Original'} x ${customization.customDimensions.height || 'Original'} ${customization.customDimensions.unit}`);
    }
    
    if (customization.selectedFeatures && customization.selectedFeatures.length > 0) {
      summary.push(`Features: ${customization.selectedFeatures.join(', ')}`);
    }
    
    return summary.join('\n');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Please sign in to request customization');
      return;
    }

    if (!requirements.trim()) {
      alert('Please describe your customization requirements');
      return;
    }

    const requestData: CustomizationRequestData = {
      id: `custom_req_${Date.now()}`,
      requirements,
      budget,
      timeline,
      contactPreference,
      specialRequests,
      productName: product.title,
      productId: product.id,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    onSubmit(requestData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Request Custom Design Consultation</h3>
            <p className="text-gray-600 text-sm mt-1">Step {currentStep} of 2: Tell us about your custom requirements</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <div className={`flex items-center ${currentStep === 1 ? 'text-purple-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 1 ? 'bg-purple-100' : 'bg-gray-100'}`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium">Requirements</span>
            </div>
            <div className="flex-1 h-1 mx-4 bg-gray-200"></div>
            <div className={`flex items-center ${currentStep === 2 ? 'text-purple-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 2 ? 'bg-purple-100' : 'bg-gray-100'}`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">Contact & Submit</span>
            </div>
          </div>

          {currentStep === 1 ? (
            <>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <img 
                    src={product.images?.[0]} 
                    alt={product.title}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900">{product.title}</h4>
                    <p className="text-sm text-gray-600">Base Price: {product.price} SR</p>
                    <p className="text-sm text-gray-600">Type: {product.type === 'customized' ? 'Customizable Product' : 'Ready-made Product'}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customization Requirements *
                </label>
                <textarea
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  placeholder="Describe exactly what you want to customize... (materials, dimensions, colors, features, etc.)"
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tip: Be specific about materials, dimensions, colors, and any special features you need.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget Range (SR) *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., 1000-1500 SR"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Desired Timeline *
                  </label>
                  <select
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                  >
                    <option value="">Select Timeline</option>
                    <option value="1-2 weeks">1-2 weeks</option>
                    <option value="2-3 weeks">2-3 weeks</option>
                    <option value="3-4 weeks">3-4 weeks</option>
                    <option value="1-2 months">1-2 months</option>
                    <option value="Flexible">Flexible</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
              >
                Next: Contact Details
              </button>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Contact Method *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <label className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="contact"
                      value="whatsapp"
                      checked={contactPreference === 'whatsapp'}
                      onChange={(e) => setContactPreference(e.target.value)}
                      className="w-4 h-4 text-purple-500"
                    />
                    <MessageSquare className="w-5 h-5 text-green-500" />
                    <span className="text-sm text-gray-700">WhatsApp</span>
                  </label>
                  <label className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="contact"
                      value="phone"
                      checked={contactPreference === 'phone'}
                      onChange={(e) => setContactPreference(e.target.value)}
                      className="w-4 h-4 text-purple-500"
                    />
                    <Phone className="w-5 h-5 text-blue-500" />
                    <span className="text-sm text-gray-700">Phone</span>
                  </label>
                  <label className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="contact"
                      value="email"
                      checked={contactPreference === 'email'}
                      onChange={(e) => setContactPreference(e.target.value)}
                      className="w-4 h-4 text-purple-500"
                    />
                    <Mail className="w-5 h-5 text-red-500" />
                    <span className="text-sm text-gray-700">Email</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes & Special Requests
                </label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  placeholder="Any special requirements, reference images you have, or specific design preferences..."
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                />
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold text-purple-800 mb-2 flex items-center">
                  <Info className="w-5 h-5 mr-2" />
                  What happens next?
                </h4>
                <ul className="text-sm text-purple-700 space-y-1">
                  <li className="flex items-center">
                    <Check className="w-4 h-4 mr-2 text-green-500" />
                    Designer contacts you within 24 hours
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 mr-2 text-green-500" />
                    Discuss your requirements in detail
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 mr-2 text-green-500" />
                    Receive custom design proposal
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 mr-2 text-green-500" />
                    Approve final design before production
                  </li>
                </ul>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center space-x-2"
                >
                  <Send className="w-5 h-5" />
                  <span>Submit Request</span>
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

const FactoryVisitModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  sellerId: string;
  sellerName: string;
}> = ({ isOpen, onClose, sellerId, sellerName }) => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [visitors, setVisitors] = useState(1);
  const [purpose, setPurpose] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert('Please sign in to schedule a factory visit');
      return;
    }

    if (!selectedDate || !selectedTime) {
      alert('Please select date and time for the visit');
      return;
    }

    const visitData = {
      id: `visit_${Date.now()}`,
      sellerId,
      sellerName,
      buyerId: user.id,
      buyerName: user.name,
      buyerEmail: user.email,
      date: selectedDate,
      time: selectedTime,
      visitors,
      purpose,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    const existingVisits = JSON.parse(localStorage.getItem('factoryVisits') || '[]');
    localStorage.setItem('factoryVisits', JSON.stringify([...existingVisits, visitData]));

    alert('Factory visit request submitted successfully! The seller will contact you to confirm.');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Schedule Factory Visit</h3>
            <p className="text-gray-600 text-sm mt-1">{sellerName}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Date *</label>
            <input
              type="date"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Time *</label>
            <select
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
            >
              <option value="">Select Time</option>
              <option value="09:00">9:00 AM</option>
              <option value="10:00">10:00 AM</option>
              <option value="11:00">11:00 AM</option>
              <option value="12:00">12:00 PM</option>
              <option value="14:00">2:00 PM</option>
              <option value="15:00">3:00 PM</option>
              <option value="16:00">4:00 PM</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Number of Visitors *</label>
            <input
              type="number"
              required
              min="1"
              max="10"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={visitors}
              onChange={(e) => setVisitors(parseInt(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Purpose of Visit</label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              placeholder="Briefly describe why you want to visit the factory..."
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
              <Info className="w-5 h-5 mr-2" />
              Important Information
            </h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Factory visits are by appointment only</li>
              <li>• Maximum 10 visitors per appointment</li>
              <li>• Wear closed-toe shoes for safety</li>
              <li>• Photography may be restricted in certain areas</li>
            </ul>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Schedule Visit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const ProductDetail: React.FC<ProductDetailProps> = ({
  productId,
  onNavigate,
  onAddToCart,
  onToggleWishlist,
  wishlistItems
}) => {
  const { user } = useAuth();
  const [product, setProduct] = useState<any>(null);
  const [seller, setSeller] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('description');
  
  const [showCustomization, setShowCustomization] = useState(false);
  const [showEnhancedCustomizationRequest, setShowEnhancedCustomizationRequest] = useState(false);
  const [showMeasurementRequest, setShowMeasurementRequest] = useState(false);
  const { customization, updateCustomization, clearCustomization } = useCustomization();

  const handleMeasurementRequest = async (measurementData: MeasurementRequestData) => {
    try {
      const existingRequests = JSON.parse(localStorage.getItem('measurementRequests') || '[]');
      localStorage.setItem('measurementRequests', JSON.stringify([...existingRequests, measurementData]));

      const sellerRequestsKey = `seller_${measurementData.sellerId}_measurement_requests`;
      const sellerRequests = JSON.parse(localStorage.getItem(sellerRequestsKey) || '[]');
      localStorage.setItem(sellerRequestsKey, JSON.stringify([...sellerRequests, measurementData]));

      if (measurementData.buyerId) {
        const buyerRequestsKey = `buyer_${measurementData.buyerId}_measurement_requests`;
        const buyerRequests = JSON.parse(localStorage.getItem(buyerRequestsKey) || '[]');
        localStorage.setItem(buyerRequestsKey, JSON.stringify([...buyerRequests, measurementData]));
      }

      const contractData = generateContractFromMeasurement(measurementData, product, seller);
      
      const existingContracts = JSON.parse(localStorage.getItem('contracts') || '[]');
      localStorage.setItem('contracts', JSON.stringify([...existingContracts, contractData]));

      measurementData.contractId = contractData.id;
      measurementData.contractGenerated = true;

      const updatedRequests = [...existingRequests];
      const requestIndex = updatedRequests.findIndex((r: any) => r.id === measurementData.id);
      if (requestIndex !== -1) {
        updatedRequests[requestIndex] = measurementData;
        localStorage.setItem('measurementRequests', JSON.stringify(updatedRequests));
      }

      alert(`✅ Measurement request sent successfully!\n\n📋 Next steps:
      1. Seller will confirm appointment within 24 hours
      2. Professional measurement at your location
      3. Contract draft has been generated
      4. You can view and sign the contract after measurement`);

      onNavigate(`contracts/${contractData.id}`);
      
      setShowMeasurementRequest(false);
    } catch (error) {
      console.error('Error processing measurement request:', error);
      alert('Error processing measurement request. Please try again.');
    }
  };

  const generateContractFromMeasurement = (measurementData: MeasurementRequestData, product: any, seller: any) => {
    const contractId = `CT-${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];
    
    return {
      id: contractId,
      contractNumber: contractId,
      status: 'draft',
      createdAt: today,
      lastUpdated: today,
      contractType: 'b2c',
      
      seller: {
        type: 'b2b',
        name: seller.business_name,
        email: seller.contact_email || seller.email,
        phone: seller.contact_number || seller.phone,
        address: seller.address,
        companyName: seller.business_name,
        crNumber: seller.crNumber || 'Pending',
        taxNumber: seller.taxNumber || 'Pending',
        representative: seller.users?.name || 'Sales Representative',
        position: 'Sales Manager'
      },
      
      buyer: {
        type: 'b2c',
        name: measurementData.buyerName,
        email: measurementData.buyerEmail,
        phone: measurementData.buyerPhone,
        address: measurementData.buyerAddress,
        companyName: '',
        crNumber: '',
        taxNumber: '',
        representative: measurementData.buyerName,
        position: 'Customer'
      },
      
      products: [{
        id: product.id,
        name: product.title,
        image: product.images?.[0] || '',
        description: product.description,
        materials: [product.material || 'Wood'],
        quantity: 1,
        unitPrice: parseFloat(product.price) || 0,
        totalPrice: parseFloat(product.price) || 0,
        specifications: {
          dimensions: product.dimensions ? 
            `${product.dimensions.length} × ${product.dimensions.width} × ${product.dimensions.height} ${product.dimensions.unit}` 
            : 'To be determined after measurement',
          weight: product.weight || 'To be determined',
          color: product.primaryColor || 'To be selected',
          material: product.material || 'Wood'
        }
      }],
      
      equipment: [],
      
      paymentTerms: {
        totalAmount: measurementData.estimatedBudget || parseFloat(product.price) || 0,
        vat: 15,
        vatAmount: (measurementData.estimatedBudget || parseFloat(product.price) || 0) * 0.15,
        currency: 'SAR',
        deposit: (measurementData.estimatedBudget || parseFloat(product.price) || 0) * 0.5,
        depositDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        finalPaymentDue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        paymentMethod: 'Bank Transfer',
        installmentPlan: []
      },
      
      delivery: {
        address: measurementData.buyerAddress,
        estimatedDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        installationIncluded: true,
        shippingCost: 0,
        notes: measurementData.measurementNotes || 'Delivery details to be confirmed after measurement'
      },
      
      warranty: {
        duration: '24 months',
        coverage: [
          'Manufacturing defects',
          'Structural integrity',
          'Material quality',
          'Hardware functionality'
        ],
        limitations: [
          'Normal wear and tear',
          'Damage from improper use',
          'Modifications by third parties',
          'Commercial misuse'
        ]
      },
      
      terms: {
        cancellationPolicy: 'Orders can be cancelled within 7 days with full refund. After 7 days, 50% cancellation fee applies.',
        returnPolicy: 'Products can be returned within 14 days if unused and in original packaging. Return shipping costs borne by buyer.',
        liability: 'Seller liability limited to product replacement or repair. Not liable for consequential damages.',
        governingLaw: 'Laws of the Kingdom of Saudi Arabia',
        forceMajeure: 'Neither party liable for delays due to circumstances beyond reasonable control.'
      },
      
      signatures: {
        sellerSigned: false,
        buyerSigned: false,
        sellerSignature: '',
        buyerSignature: '',
        signedDate: ''
      },
      
      measurementRequestId: measurementData.id,
      measurementNotes: measurementData.measurementNotes,
      specialRequirements: measurementData.specialRequirements,
      measurementScheduledDate: measurementData.preferredDate,
      measurementScheduledTime: measurementData.preferredTime
    };
  };

  const fetchProduct = async () => {
    console.log('🔍 Fetching product for ID:', productId);
    setLoading(true);
    
    const actualProductId = productId?.replace('product-', '') || productId;
    console.log('🔍 Actual product ID to search:', actualProductId);
    
    const currentProductJson = localStorage.getItem('currentProduct');
    if (currentProductJson) {
      try {
        const currentProduct = JSON.parse(currentProductJson);
        console.log('📦 Found product in currentProduct localStorage:', currentProduct);
        
        if (currentProduct.id === actualProductId) {
          console.log('✅ Product loaded from currentProduct localStorage');
          const formattedProduct = formatProductData(currentProduct);
          setProduct(formattedProduct);
          setSeller(mockSellers["1"]);
          
          const storageProducts = getProductsFromStorage();
          fetchRelatedProducts(formattedProduct.category, formattedProduct.id, storageProducts);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('❌ Error parsing currentProduct from localStorage:', error);
      }
    }
    
    const storageProducts = getProductsFromStorage();
    console.log('📊 Total products in storage:', storageProducts.length);
    
    const foundProduct = storageProducts.find((p: any) => p.id === actualProductId);
    
    if (foundProduct) {
      console.log('✅ Product found in furnitureProducts storage:', foundProduct.title);
      const formattedProduct = formatProductData(foundProduct);
      setProduct(formattedProduct);
      setSeller(mockSellers["1"]);
      fetchRelatedProducts(formattedProduct.category, formattedProduct.id, storageProducts);
    } else {
      console.log('❌ Product not found in storage for ID:', actualProductId);
      const mockProduct = createMockProduct(actualProductId);
      console.log('🔄 Creating mock product as fallback:', mockProduct);
      
      setProduct(mockProduct);
      setSeller(mockSellers["1"]);
      
      const related = storageProducts
        .filter((p: any) => p.category === mockProduct.category && p.id !== mockProduct.id)
        .slice(0, 4);
      setRelatedProducts(related);
    }
    
    setLoading(false);
  };

  const formatProductData = (productData: any) => {
    return {
      ...productData,
      id: productData.id,
      title: productData.name || productData.title || 'Unnamed Product',
      price: productData.price || '0',
      description: productData.description || 'No description available',
      shortDescription: productData.shortDescription || productData.description?.substring(0, 100) + '...' || '',
      category: productData.category || 'Living Room',
      type: productData.type || 'ready',
      stock_quantity: productData.stock || productData.stock_quantity || 10,
      images: productData.images || (productData.image ? [productData.image] : ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80']),
      isTopSeller: productData.isTopSeller || false,
      rating: productData.rating || '4.5',
      orders: productData.orders || '0',
      reviews: productData.reviews || '0',
      originalPrice: productData.originalPrice || (productData.price ? (parseFloat(productData.price) * 1.4).toString() : '0'),
      discount: productData.discount || '35%',
      warranty: productData.warranty || '3 mon',
      material: productData.material || 'Wood',
      finishType: productData.finishType || 'Matte',
      primaryColor: productData.primaryColor || 'Brown',
      dimensions: productData.dimensions || { length: '200', width: '100', height: '80', unit: 'cm' },
      weight: productData.weight || '50 kg',
      delivery_option: productData.delivery_option || 'free',
      delivery_price: productData.delivery_price || '0',
      delivery_time: productData.delivery_time || '3-5 days',
      availableCities: productData.availableCities || ['Riyadh'],
      city: productData.city || 'Riyadh',
      features: productData.features || ['High Quality', 'Durable', 'Easy Assembly'],
      shipping: productData.shipping || { withinCity: { free: true, cost: 0, deliveryTime: '3-5 days' } }
    };
  };

  const createMockProduct = (productId: string) => {
    return {
      id: productId,
      title: 'Sample Product',
      price: '250',
      description: 'This is a sample product description. Premium quality furniture designed for comfort and style.',
      shortDescription: 'Premium quality furniture designed for comfort and style.',
      category: 'Living Room',
      type: 'ready',
      stock_quantity: 10,
      images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80'],
      isTopSeller: true,
      rating: '4.5',
      orders: '124',
      reviews: '45',
      originalPrice: '350',
      discount: '35%',
      warranty: '3 mon',
      material: 'Solid Wood',
      finishType: 'Matte',
      primaryColor: 'Brown',
      dimensions: {
        length: '200',
        width: '100',
        height: '80',
        unit: 'cm'
      },
      weight: '50 kg',
      delivery_option: 'free',
      delivery_price: '0',
      delivery_time: '3-5 days',
      availableCities: ['Riyadh', 'Jeddah', 'Dammam'],
      city: 'Riyadh',
      features: ['High Quality', 'Durable', 'Easy Assembly', 'Premium Finish'],
      shipping: {
        withinCity: {
          free: true,
          cost: 0,
          deliveryTime: '3-5 days'
        },
        installation: {
          available: true,
          free: false,
          fee: '50'
        }
      }
    };
  };

  const fetchRelatedProducts = async (category: string, excludeId: string, allProducts: any[]) => {
    const related = allProducts
      .filter((p: any) => p.category === category && p.id !== excludeId)
      .slice(0, 4);
    setRelatedProducts(related);
  };

  const loadReviews = () => {
    try {
      const savedReviews = localStorage.getItem('productReviews');
      if (savedReviews) {
        const allReviews = JSON.parse(savedReviews);
        const productReviews = allReviews.filter((review: any) => review.productId === productId);
        setReviews(productReviews);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
  };

  useEffect(() => {
    console.log('📦 ProductDetail mounted with productId:', productId);
    fetchProduct();
    loadReviews();
    
    window.addEventListener('storage', () => {
      console.log('🔄 Storage changed, refreshing product...');
      fetchProduct();
    });
    
    return () => {
      window.removeEventListener('storage', () => {});
    };
  }, [productId]);

  const handleAddToCart = () => {
    if (!product) {
      alert('Product not loaded yet');
      return;
    }
    
    if (!user) {
      // Save cart item temporarily
      const cartItem = {
        id: product.id,
        product: {
          ...product,
          price: customization ? customization.totalPrice.toString() : product.price
        },
        quantity: quantity,
        customization: customization || null
      };
      
      // Save to localStorage
      const existingCart = JSON.parse(localStorage.getItem('gigaHomeCart') || '[]');
      localStorage.setItem('gigaHomeCart', JSON.stringify([...existingCart, cartItem]));
      
      // alert(`Added to cart! Please login to complete your purchase.`);
      
      // Navigate to home page with auth modal
      // onNavigate('home', { showAuthModal: true, authType: 'signin' });
      return;
    }

    // Call the parent's onAddToCart function
    if (onAddToCart) {
      onAddToCart(product.id, customization, quantity);
    }
    
    // Also save to localStorage for consistency
    const cartItem = {
      id: product.id,
      product: {
        ...product,
        price: customization ? customization.totalPrice.toString() : product.price
      },
      quantity: quantity,
      customization: customization || null
    };
    
    const existingCart = JSON.parse(localStorage.getItem('gigaHomeCart') || '[]');
    const updatedCart = [...existingCart, cartItem];
    localStorage.setItem('gigaHomeCart', JSON.stringify(updatedCart));
    
    if (customization) {
      alert(`Added ${quantity} customized "${product.title}" to cart! Total: ${customization.totalPrice * quantity} SR`);
    } else {
      alert(`Added ${quantity} "${product.title}" to cart! Total: ${parseFloat(product.price) * quantity} SR`);
    }
  };

  const handleBuyNow = () => {
    console.log('🛒 Buy Now button clicked!');
    
    if (!product) {
      alert('Product not loaded yet');
      return;
    }
    
    if (product.type === 'customized' && !customization) {
      alert('Please customize your product first or use the customization options below.');
      return;
    }

    const orderData = {
      product: {
        ...product,
        finalPrice: customization ? customization.totalPrice : parseFloat(product.price),
        customization: customization || null
      },
      quantity: quantity,
      total: (customization ? customization.totalPrice : parseFloat(product.price)) * quantity,
      seller: seller,
      deliveryInfo: {
        delivery_option: product.delivery_option,
        delivery_price: product.delivery_price,
        delivery_time: product.delivery_time
      }
    };

    console.log('📦 Order data created:', orderData);
    localStorage.setItem('directOrderData', JSON.stringify(orderData));
    
    console.log('✅ Saved to localStorage with key: directOrderData');
    console.log('🔀 Navigating to checkout');
    onNavigate('checkout');
  };

  const handleEnhancedCustomizationRequest = async (requestData: CustomizationRequestData) => {
    const existingRequests = JSON.parse(localStorage.getItem('customizationRequests') || '[]');
    localStorage.setItem('customizationRequests', JSON.stringify([...existingRequests, requestData]));

    if (user) {
      const userRequests = JSON.parse(localStorage.getItem(`user_${user.id}_customization_requests`) || '[]');
      localStorage.setItem(`user_${user.id}_customization_requests`, JSON.stringify([...userRequests, requestData]));
    }

    alert(`Customization request #${requestData.id.split('_')[2]} sent successfully!\n\nThe designer will contact you within 24 hours via ${requestData.contactPreference}.`);
    
    setShowEnhancedCustomizationRequest(false);
  };

  const handleSubmitReview = async () => {
    if (!user) {
      alert('Please sign in to leave a review');
      onNavigate('home', { showAuthModal: true, authType: 'signin' });
      return;
    }

    if (!newReview.comment.trim()) {
      alert('Please write a review comment');
      return;
    }

    const newReviewObj: Review = {
      id: `review_${Date.now()}`,
      rating: newReview.rating,
      comment: newReview.comment,
      buyer_name: user.name || 'Anonymous',
      created_at: new Date().toISOString(),
      helpful_count: 0,
      is_verified: true
    };

    const existingReviews = JSON.parse(localStorage.getItem('productReviews') || '[]');
    const reviewWithProduct = { ...newReviewObj, productId };
    localStorage.setItem('productReviews', JSON.stringify([...existingReviews, reviewWithProduct]));

    setReviews(prev => [newReviewObj, ...prev]);
    setShowReviewForm(false);
    setNewReview({ rating: 5, comment: '' });
    alert('Review submitted successfully!');
  };

  const handleSendMessage = async () => {
    if (!user) {
      alert('Please sign in to send a message');
      onNavigate('home', { showAuthModal: true, authType: 'signin' });
      return;
    }

    if (!message.trim()) {
      alert('Please write a message');
      return;
    }

    const messageData = {
      id: `msg_${Date.now()}`,
      productId,
      productName: product?.title,
      sellerId: seller?.id,
      sellerName: seller?.business_name,
      buyerId: user.id,
      buyerName: user.name,
      message: message,
      timestamp: new Date().toISOString(),
      status: 'sent'
    };

    const existingMessages = JSON.parse(localStorage.getItem('sellerMessages') || '[]');
    localStorage.setItem('sellerMessages', JSON.stringify([...existingMessages, messageData]));

    alert('Message sent to seller! They will respond within 24 hours.');
    setMessage('');
    setShowMessageForm(false);
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const renderMeasurementBooking = () => {
    if (product.type !== 'customized') return null;

    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mt-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <Maximize2 className="w-6 h-6 mr-2 text-blue-600" />
          Professional Measurement Service
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start space-x-3 mb-4">
              <div className="bg-blue-100 p-2 rounded-full">
                <Maximize2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-lg">On-site Measurement</h4>
                <p className="text-sm text-gray-600">Book professional measurement at your location</p>
              </div>
            </div>
            <ul className="space-y-2 mb-6 text-sm text-gray-700">
              <li className="flex items-center">
                <Check className="w-4 h-4 mr-2 text-green-500" />
                Professional measurement by experts
              </li>
              <li className="flex items-center">
                <Check className="w-4 h-4 mr-2 text-green-500" />
                Accurate dimensions for perfect fit
              </li>
              <li className="flex items-center">
                <Check className="w-4 h-4 mr-2 text-green-500" />
                Space analysis and recommendations
              </li>
              <li className="flex items-center">
                <Check className="w-4 h-4 mr-2 text-green-500" />
                Automatic contract generation
              </li>
            </ul>
            <button
              onClick={() => setShowMeasurementRequest(true)}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-colors flex items-center justify-center space-x-2"
            >
              <Maximize2 className="w-5 h-5" />
              <span>Book Measurement</span>
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start space-x-3 mb-4">
              <div className="bg-purple-100 p-2 rounded-full">
                <FileSignature className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-lg">Automatic Contract</h4>
                <p className="text-sm text-gray-600">Contract generated after measurement</p>
              </div>
            </div>
            <ul className="space-y-2 mb-6 text-sm text-gray-700">
              <li className="flex items-center">
                <Check className="w-4 h-4 mr-2 text-green-500" />
                Automatic contract draft generation
              </li>
              <li className="flex items-center">
                <Check className="w-4 h-4 mr-2 text-green-500" />
                Includes product details and pricing
              </li>
              <li className="flex items-center">
                <Check className="w-4 h-4 mr-2 text-green-500" />
                Seller and buyer information included
              </li>
              <li className="flex items-center">
                <Check className="w-4 h-4 mr-2 text-green-500" />
                Terms and conditions pre-filled
              </li>
            </ul>
            <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded-lg">
              📝 Contract will be generated automatically after measurement booking
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCustomizationOptions = () => {
    if (product.type !== 'customized') return null;

    return (
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6 mt-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <Settings className="w-6 h-6 mr-2 text-purple-600" />
          Customization Options
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start space-x-3 mb-4">
              <div className="bg-purple-100 p-2 rounded-full">
                <Settings className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-lg">Self-Customize</h4>
                <p className="text-sm text-gray-600">Configure the product yourself</p>
              </div>
            </div>
            <ul className="space-y-2 mb-6 text-sm text-gray-700">
              <li className="flex items-center">
                <Check className="w-4 h-4 mr-2 text-green-500" />
                Instant price calculation
              </li>
              <li className="flex items-center">
                <Check className="w-4 h-4 mr-2 text-green-500" />
                Add to cart immediately
              </li>
              <li className="flex items-center">
                <Check className="w-4 h-4 mr-2 text-green-500" />
                50+ customization options
              </li>
            </ul>
            <button
              onClick={() => setShowCustomization(true)}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Settings className="w-5 h-5" />
              <span>Start Customizing</span>
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start space-x-3 mb-4">
              <div className="bg-pink-100 p-2 rounded-full">
                <Scissors className="w-6 h-6 text-pink-600" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-lg">Request Custom Design</h4>
                <p className="text-sm text-gray-600">Get expert help with your design</p>
              </div>
            </div>
            <ul className="space-y-2 mb-6 text-sm text-gray-700">
              <li className="flex items-center">
                <Check className="w-4 h-4 mr-2 text-green-500" />
                Expert design consultation
              </li>
              <li className="flex items-center">
                <Check className="w-4 h-4 mr-2 text-green-500" />
                Free design mockups
              </li>
              <li className="flex items-center">
                <Check className="w-4 h-4 mr-2 text-green-500" />
                Complex designs welcome
              </li>
            </ul>
            <button
              onClick={() => setShowEnhancedCustomizationRequest(true)}
              className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-pink-700 hover:to-purple-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Scissors className="w-5 h-5" />
              <span>Request Custom Design</span>
            </button>
          </div>
        </div>

        {customization && (
          <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-green-100 p-2 rounded-full mr-3">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-green-800">Customization Applied</h4>
                  <p className="text-sm text-green-600">
                    Total: <span className="font-bold">{customization.totalPrice} SR</span>
                    {customization.priceAdjustment > 0 && (
                      <span className="ml-2">(+{customization.priceAdjustment} SR customization)</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowCustomization(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center space-x-1"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={clearCustomization}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
                >
                  Remove
                </button>
                <button
                  onClick={() => setShowEnhancedCustomizationRequest(true)}
                  className="px-4 py-2 border border-green-600 text-green-600 rounded-lg text-sm hover:bg-green-50 transition-colors"
                  title="Request modifications or get quote"
                >
                  <FileText className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderProductActions = () => {
    if (!product) return null;
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="font-semibold text-gray-700">Quantity:</label>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-bold disabled:opacity-50"
              disabled={quantity <= 1}
            >
              <Minus className="w-4 h-4 mx-auto" />
            </button>
            <span className="w-12 text-center font-semibold text-lg">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-10 h-10 border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-bold"
              disabled={quantity >= (product.stock_quantity || 10)}
            >
              <Plus className="w-4 h-4 mx-auto" />
            </button>
          </div>
          <span className="text-sm text-gray-500">Max: {product.stock_quantity || 10}</span>
        </div>

        <div className="space-y-3">
          {product.type === 'ready' ? (
            <>
              <button
                onClick={handleBuyNow}
                disabled={!product.stock_quantity || product.stock_quantity === 0}
                className="w-full bg-amber-500 text-white py-4 rounded-lg font-bold text-lg hover:bg-amber-600 transition-colors shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {!product.stock_quantity || product.stock_quantity === 0 ? 'Out of Stock' : `Buy Now - ${parseFloat(product.price) * quantity} SR`}
              </button>
              <button
                onClick={handleAddToCart}
                disabled={!product.stock_quantity || product.stock_quantity === 0}
                className="w-full border-2 border-amber-500 text-amber-500 py-4 rounded-lg font-bold text-lg hover:bg-amber-50 transition-colors flex items-center justify-center space-x-2 disabled:border-gray-400 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>Add to Cart</span>
              </button>
            </>
          ) : (
            <div className="space-y-3">
              <button
                onClick={() => setShowCustomization(true)}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-4 rounded-lg font-bold text-lg hover:from-purple-700 hover:to-purple-800 transition-colors shadow-lg flex items-center justify-center space-x-2"
              >
                <Settings className="w-6 h-6" />
                <span>
                  {customization ? 'Edit Customization' : 'Start Customizing'}
                </span>
              </button>

              <button
                onClick={() => setShowEnhancedCustomizationRequest(true)}
                className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white py-4 rounded-lg font-bold text-lg hover:from-pink-700 hover:to-purple-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Scissors className="w-6 h-6" />
                <span>Get Expert Design Help</span>
              </button>

              {customization && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-green-800 flex items-center">
                        <Check className="w-5 h-5 mr-2" />
                        Customization Ready
                      </h4>
                      <p className="text-sm text-green-600 mt-1">
                        Total: <span className="font-bold text-lg">{customization.totalPrice * quantity} SR</span>
                        {customization.priceAdjustment > 0 && (
                          <span className="ml-2 text-green-500">
                            (+{customization.priceAdjustment * quantity} SR customization)
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-green-500 mt-1">
                        Production: {customization.productionTime} • Delivery: {customization.estimatedDelivery}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={clearCustomization}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {customization && (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={!customization}
                    className="bg-amber-500 text-white py-3 rounded-lg font-bold hover:bg-amber-600 transition-colors flex items-center justify-center space-x-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span>Add to Cart</span>
                  </button>
                  <button
                    onClick={handleBuyNow}
                    disabled={!customization}
                    className="bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Buy Now
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center space-x-2 text-sm text-blue-700">
            <Truck className="w-4 h-4" />
            <span>
              {product.delivery_option === 'free' ? 'Free Delivery' : `Delivery: ${product.delivery_price || 0} SR`}
              {product.delivery_time && ` • ${product.delivery_time}`}
            </span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Product not found</h2>
          <p className="text-gray-600 mb-4">The product you're looking for doesn't exist.</p>
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
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center space-x-2 text-gray-600 hover:text-amber-500 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Products</span>
            </button>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => onToggleWishlist(productId)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Heart
                  className={`w-6 h-6 ${
                    wishlistItems.includes(productId) ? 'fill-red-500 text-red-500' : 'text-gray-600'
                  }`}
                />
              </button>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: product.title,
                      text: product.description,
                      url: window.location.href,
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Product link copied to clipboard!');
                  }
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Share2 className="w-6 h-6 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <button onClick={() => onNavigate('home')} className="hover:text-amber-600">Home</button>
          <span>/</span>
          <span className="capitalize">{product.category}</span>
          {product.subcategory && (
            <>
              <span>/</span>
              <span className="capitalize">{product.subcategory}</span>
            </>
          )}
          <span>/</span>
          <span className="text-gray-800 font-medium line-clamp-1">{product.title}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div className="space-y-4">
            <div
              className="bg-white rounded-xl shadow-lg overflow-hidden cursor-zoom-in"
              onClick={() => setShowImageModal(true)}
            >
              <img
                src={product.images?.[selectedImage] || 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80'}
                alt={product.title}
                className="w-full h-96 object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((img: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`bg-white rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                      selectedImage === index ? 'border-amber-500 ring-2 ring-amber-200' : 'border-gray-200'
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

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.round(averageRating) ? 'text-amber-500 fill-amber-500' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-gray-600">
                    ({averageRating > 0 ? averageRating.toFixed(1) : 'No ratings'}) • {reviews.length} reviews • {product.orders || 0} orders
                  </span>
                </div>
                {product.isTopSeller && (
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    🔥 Top Seller
                  </span>
                )}
              </div>

              <h1 className="text-3xl font-bold text-gray-800 mb-4">{product.title}</h1>

              <div className="flex items-baseline space-x-4 mb-6">
                <span className="text-4xl font-bold text-amber-600">
                  {customization ? customization.totalPrice : product.price} SR
                </span>
                {product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price) && (
                  <span className="text-xl text-gray-400 line-through">{product.originalPrice} SR</span>
                )}
                {product.discount && product.discount !== '0%' && (
                  <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {product.discount} OFF
                  </span>
                )}
                {product.type === 'customized' && (
                  <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                    🎨 Customizable
                  </span>
                )}
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-2 text-gray-700">
                  <MapPin className="w-5 h-5 text-amber-500" />
                  <span>Available in {product.availableCities?.join(', ') || product.city || 'Riyadh'}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-700">
                  <Package className="w-5 h-5 text-amber-500" />
                  <span className="capitalize">
                    {product.category} {product.subcategory ? `• ${product.subcategory}` : ''}
                  </span>
                </div>
                {product.stock_quantity > 0 ? (
                  <div className="flex items-center space-x-2 text-green-600">
                    <Shield className="w-5 h-5" />
                    <span>{product.stock_quantity} in stock • Ready to ship</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-red-600">
                    <Clock className="w-5 h-5" />
                    <span>Out of stock • Contact for availability</span>
                  </div>
                )}
              </div>

              <div className="border-b border-gray-200 mb-6">
                <div className="flex space-x-8 overflow-x-auto">
                  {['description', 'specifications', 'features', 'shipping'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`pb-4 px-1 font-medium text-sm capitalize transition-colors whitespace-nowrap ${
                        activeTab === tab
                          ? 'text-amber-600 border-b-2 border-amber-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6 min-h-[200px]">
                {activeTab === 'description' && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Product Description</h3>
                    <p className="text-gray-700 leading-relaxed">{product.description}</p>
                    {product.shortDescription && (
                      <p className="text-gray-600 mt-3 text-sm">{product.shortDescription}</p>
                    )}
                  </div>
                )}

                {activeTab === 'specifications' && (
                  <div className="space-y-4">
                    {product.type === 'customized' && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <h4 className="font-semibold text-purple-800 mb-2 flex items-center">
                          <Settings className="w-5 h-5 mr-2" />
                          Customizable Product
                        </h4>
                        <p className="text-purple-700 text-sm mb-3">
                          This product can be customized to your exact requirements. 
                          Modify materials, dimensions, colors, and add special features.
                        </p>
                        <button
                          onClick={() => setShowCustomization(true)}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
                        >
                          Start Customizing
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <Ruler className="w-5 h-5 text-amber-500" />
                        <div>
                          <p className="text-sm text-gray-600">Type</p>
                          <p className="font-semibold capitalize">{product.type}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <Palette className="w-5 h-5 text-amber-500" />
                        <div>
                          <p className="text-sm text-gray-600">Material</p>
                          <p className="font-semibold capitalize">{product.material || 'Solid Wood'}</p>
                        </div>
                      </div>
                      
                      {product.finishType && (
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <Tag className="w-5 h-5 text-amber-500" />
                          <div>
                            <p className="text-sm text-gray-600">Finish</p>
                            <p className="font-semibold capitalize">{product.finishType}</p>
                          </div>
                        </div>
                      )}
                      
                      {product.weight && (
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <Weight className="w-5 h-5 text-amber-500" />
                          <div>
                            <p className="text-sm text-gray-600">Weight</p>
                            <p className="font-semibold">{product.weight} kg</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {product.dimensions && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold mb-3 flex items-center space-x-2">
                          <Ruler className="w-5 h-5 text-amber-500" />
                          <span>Dimensions</span>
                        </h4>
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div className="bg-white rounded-lg p-3">
                            <p className="text-sm text-gray-600">Length</p>
                            <p className="font-bold text-lg">{product.dimensions.length} {product.dimensions.unit}</p>
                          </div>
                          <div className="bg-white rounded-lg p-3">
                            <p className="text-sm text-gray-600">Width</p>
                            <p className="font-bold text-lg">{product.dimensions.width} {product.dimensions.unit}</p>
                          </div>
                          <div className="bg-white rounded-lg p-3">
                            <p className="text-sm text-gray-600">Height</p>
                            <p className="font-bold text-lg">{product.dimensions.height} {product.dimensions.unit}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'features' && product.features && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Key Features</h3>
                    <ul className="space-y-2">
                      {product.features.map((feature: string, index: number) => (
                        <li key={index} className="flex items-center space-x-2 text-gray-700">
                          <Check className="w-4 h-4 text-green-500" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {activeTab === 'shipping' && product.shipping && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Shipping & Policies</h3>
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-800 mb-2">Delivery Options</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Within City:</span>
                            <span className="font-semibold">
                              {product.shipping.withinCity?.free ? 'FREE' : `${product.shipping.withinCity?.cost || 0} SR`}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Delivery Time:</span>
                            <span className="font-semibold">{product.shipping.withinCity?.deliveryTime || '1-3 days'}</span>
                          </div>
                        </div>
                      </div>

                      {product.shipping.installation?.available && (
                        <div className="bg-green-50 rounded-lg p-4">
                          <h4 className="font-semibold text-green-800 mb-2">Installation Service</h4>
                          <div className="flex justify-between">
                            <span>Installation Fee:</span>
                            <span className="font-semibold">
                              {product.shipping.installation.free ? 'FREE' : `${product.shipping.installation.fee || 0} SR`}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {renderProductActions()}
            </div>

            {renderCustomizationOptions()}
            {renderMeasurementBooking()}

            {seller && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="font-bold text-lg mb-4">Seller Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={seller.logo} 
                      alt={seller.business_name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-amber-200"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 text-lg">{seller.business_name}</p>
                      <p className="text-sm text-gray-600">{seller.city}</p>
                      <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                        <span>⭐ {seller.rating}/5</span>
                        <span>📞 {seller.response_rate} Response Rate</span>
                        <span>🛍️ {seller.total_products} Products</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setShowMessageForm(true)}
                      className="bg-gray-800 text-white py-3 rounded-lg hover:bg-gray-900 transition-colors flex items-center justify-center space-x-2"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>Contact Seller</span>
                    </button>
                    <button
                      onClick={() => setShowVisitModal(true)}
                      className="bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all flex items-center justify-center space-x-2 shadow-lg"
                    >
                      <Factory className="w-5 h-5" />
                      <span>Visit Factory</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <ClipboardCheck className="w-6 h-6 mr-2 text-blue-600" />
            Professional Measurement & Contract Service
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <Maximize2 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-gray-900">Step 1: Book Measurement</h4>
                  <p className="text-sm text-gray-600">Schedule professional on-site measurement</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center">
                  <Check className="w-4 h-4 mr-2 text-green-500" />
                  Expert measurement at your location
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 mr-2 text-green-500" />
                  Space analysis and recommendations
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 mr-2 text-green-500" />
                  Accurate dimensions for perfect fit
                </li>
              </ul>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="bg-green-100 p-3 rounded-full mr-4">
                  <FileSignature className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-gray-900">Step 2: Auto Contract</h4>
                  <p className="text-sm text-gray-600">Automatic contract generation</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center">
                  <Check className="w-4 h-4 mr-2 text-green-500" />
                  Contract draft generated automatically
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 mr-2 text-green-500" />
                  Includes product details and pricing
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 mr-2 text-green-500" />
                  Terms and conditions pre-filled
                </li>
              </ul>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="bg-purple-100 p-3 rounded-full mr-4">
                  <Scissors className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-gray-900">Step 3: Production</h4>
                  <p className="text-sm text-gray-600">Manufacturing after contract signing</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center">
                  <Check className="w-4 h-4 mr-2 text-green-500" />
                  Production starts after contract signed
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 mr-2 text-green-500" />
                  Quality control at every stage
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 mr-2 text-green-500" />
                  Delivery and installation included
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <button
              onClick={() => setShowMeasurementRequest(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-8 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-blue-800 transition-colors shadow-lg flex items-center justify-center space-x-3 mx-auto"
            >
              <Maximize2 className="w-6 h-6" />
              <span>Start with Professional Measurement</span>
              <FileCheck className="w-6 h-6" />
            </button>
            <p className="text-sm text-gray-600 mt-3">
              Perfect for custom furniture requiring precise measurements and formal contracts
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Customer Reviews</h2>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-1">
                  <span className="text-2xl font-bold text-amber-600">
                    {averageRating > 0 ? averageRating.toFixed(1) : '0.0'}
                  </span>
                  <span className="text-gray-500">/5</span>
                </div>
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.round(averageRating) ? 'text-amber-500 fill-amber-500' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-gray-600">({reviews.length} reviews)</span>
              </div>
            </div>
            <button
              onClick={() => setShowReviewForm(true)}
              className="bg-amber-500 text-white px-6 py-2 rounded-lg hover:bg-amber-600 transition-colors"
            >
              Write a Review
            </button>
          </div>

          {reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg mb-2">No reviews yet</p>
              <p className="text-sm">Be the first to share your experience with this product!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b pb-6 last:border-b-0">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-semibold text-gray-800">{review.buyer_name}</span>
                        {review.is_verified && (
                          <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-medium flex items-center">
                            <Check className="w-3 h-3 mr-1" />
                            Verified Purchase
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {new Date(review.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-700 leading-relaxed mb-3">{review.comment}</p>
                  <button
                    onClick={() => {
                      const updatedReviews = reviews.map(r => 
                        r.id === review.id 
                          ? { ...r, helpful_count: r.helpful_count + 1 }
                          : r
                      );
                      setReviews(updatedReviews);
                    }}
                    className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span>Helpful ({review.helpful_count})</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {relatedProducts.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relProduct) => (
                <div
                  key={relProduct.id}
                  onClick={() => onNavigate(`product-${relProduct.id}`)}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all cursor-pointer group"
                >
                  <div className="relative">
                    <img
                      src={relProduct.images?.[0] || 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80'}
                      alt={relProduct.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3 bg-amber-500 text-white px-2 py-1 rounded-full text-sm font-bold">
                      {relProduct.price} SR
                    </div>
                    {relProduct.isTopSeller && (
                      <div className="absolute top-3 left-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                        Top Seller
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">{relProduct.title}</h3>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{relProduct.city}</span>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <span>{relProduct.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCustomization && product && (
        <Customization
          product={product}
          onCustomizationUpdate={(customization) => {
            updateCustomization(customization);
            setShowCustomization(false);
          }}
          onClose={() => {
            setShowCustomization(false);
          }}
        />
      )}

      <EnhancedCustomizationRequestModal
        isOpen={showEnhancedCustomizationRequest}
        onClose={() => setShowEnhancedCustomizationRequest(false)}
        onSubmit={handleEnhancedCustomizationRequest}
        product={product}
        customization={customization}
      />

      <MeasurementRequestModal
        isOpen={showMeasurementRequest}
        onClose={() => setShowMeasurementRequest(false)}
        onSubmit={handleMeasurementRequest}
        product={product}
        seller={seller}
      />

      {showReviewForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Write a Review</h3>
              <button onClick={() => setShowReviewForm(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Rating *</label>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewReview({ ...newReview, rating: star })}
                      className="hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= newReview.rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Your Review *</label>
                <textarea
                  required
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  rows={4}
                  placeholder="Share your experience with this product..."
                />
              </div>
              <button
                onClick={handleSubmitReview}
                className="w-full bg-amber-500 text-white py-3 rounded-lg font-semibold hover:bg-amber-600 transition-colors"
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}

      {showMessageForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Message Seller</h3>
              <button onClick={() => setShowMessageForm(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Your Message to {seller?.business_name}</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  rows={4}
                  placeholder={`Hi, I'm interested in "${product.title}". Could you tell me more about...`}
                />
              </div>
              <button
                onClick={handleSendMessage}
                className="w-full bg-amber-500 text-white py-3 rounded-lg font-semibold hover:bg-amber-600 transition-colors flex items-center justify-center space-x-2"
              >
                <Send className="w-5 h-5" />
                <span>Send Message</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {seller && (
        <FactoryVisitModal
          isOpen={showVisitModal}
          onClose={() => setShowVisitModal(false)}
          sellerId={seller.id}
          sellerName={seller.business_name}
        />
      )}

      {showImageModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <button
            onClick={() => setShowImageModal(false)}
            className="absolute top-4 right-4 text-white hover:bg-white/20 p-2 rounded-full transition-colors z-10"
          >
            <X className="w-8 h-8" />
          </button>
          <button
            onClick={() => setSelectedImage((selectedImage - 1 + (product.images?.length || 1)) % (product.images?.length || 1))}
            className="absolute left-4 text-white hover:bg-white/20 p-2 rounded-full transition-colors z-10"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button
            onClick={() => setSelectedImage((selectedImage + 1) % (product.images?.length || 1))}
            className="absolute right-4 text-white hover:bg-white/20 p-2 rounded-full transition-colors z-10"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
          <div className="relative max-w-4xl max-h-full">
            <img
              src={product.images?.[selectedImage] || 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80'}
              alt={product.title}
              className="max-h-full max-w-full object-contain rounded-lg"
            />
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm">
              {selectedImage + 1} / {product.images?.length || 1}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};