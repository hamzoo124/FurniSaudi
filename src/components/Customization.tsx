import React, { useState, useEffect } from 'react';
import {
  AiOutlineClose,
  AiOutlineCheck,
  AiOutlineEdit,
  AiOutlineEye,
  AiOutlineCalendar,
  AiOutlineShoppingCart,
  AiOutlineInfoCircle,
  AiOutlineRotateLeft,
  AiOutlineSave
} from 'react-icons/ai';
import {
  Settings, Palette, Ruler, Wrench, Shield, Factory,
  Package, Truck, Tag, Box, Scissors, FileText
} from 'lucide-react';

interface CustomizationProps {
  product: any;
  onCustomizationUpdate: (customization: ProductCustomization) => void;
  onClose: () => void;
  isEditing?: boolean;
  initialCustomization?: ProductCustomization;
}

interface ProductCustomization {
  selectedMaterial: string;
  selectedFinish: string;
  selectedColor: string;
  customDimensions: {
    length: string;
    width: string;
    height: string;
    unit: 'cm' | 'inches';
  };
  selectedFeatures: string[];
  additionalOptions: string[];
  technicalSpecs: {
    weight: string;
    loadCapacity: string;
    assemblyRequired: boolean;
    customNotes: string;
  };
  priceAdjustment: number;
  totalPrice: number;
  productionTime: string;
  estimatedDelivery: string;
}

const CUSTOMIZATION_OPTIONS = {
  materials: [
    'Solid Wood', 'Engineered Wood', 'Metal', 'Glass', 'Marble', 'Granite',
    'Leather', 'Fabric', 'Rattan', 'Wicker', 'Plastic', 'Acrylic', 
    'Stainless Steel', 'Aluminum', 'Teak', 'Oak', 'Mahogany', 'Bamboo'
  ],
  
  finishes: [
    'Glossy', 'Matte', 'Natural', 'Semi-Gloss', 'Textured', 'Polished',
    'Brushed', 'Satin', 'Oil-Rubbed', 'Distressed', 'Hand-scraped'
  ],
  
  colors: [
    'White', 'Black', 'Gray', 'Brown', 'Beige', 'Cream', 'Navy', 'Blue', 
    'Green', 'Red', 'Yellow', 'Orange', 'Pink', 'Purple', 'Gold', 'Silver',
    'Bronze', 'Walnut', 'Oak', 'Mahogany', 'Espresso', 'Charcoal'
  ],
  
  features: [
    'Storage Compartments', 'Adjustable Shelves', 'Soft-Close Mechanism',
    'LED Lighting', 'USB Ports', 'Built-in Charging', 'Wheels/Casters',
    'Reclining Feature', 'Massage Function', 'Heating System',
    'Waterproof Coating', 'Anti-scratch Surface', 'Child Safety Locks',
    'Modular Design', 'Expandable Sections', 'Convertible Function'
  ],
  
  productionTimes: [
    '1-2 weeks',
    '2-3 weeks', 
    '3-4 weeks',
    '4-6 weeks',
    '6-8 weeks',
    '8+ weeks (Complex Custom)'
  ]
};

const PRICE_ADJUSTMENTS = {
  materials: {
    'Solid Wood': 200,
    'Engineered Wood': 50,
    'Metal': 100,
    'Glass': 150,
    'Marble': 500,
    'Granite': 450,
    'Leather': 300,
    'Fabric': 80,
    'Rattan': 120,
    'Wicker': 90,
    'Plastic': -50,
    'Acrylic': 100,
    'Stainless Steel': 180,
    'Aluminum': 120,
    'Teak': 250,
    'Oak': 200,
    'Mahogany': 350,
    'Bamboo': 80
  },
  
  finishes: {
    'Glossy': 50,
    'Matte': 30,
    'Natural': 20,
    'Semi-Gloss': 40,
    'Textured': 60,
    'Polished': 70,
    'Brushed': 45,
    'Satin': 35,
    'Oil-Rubbed': 55,
    'Distressed': 65,
    'Hand-scraped': 75
  },
  
  features: {
    'Storage Compartments': 80,
    'Adjustable Shelves': 40,
    'Soft-Close Mechanism': 25,
    'LED Lighting': 60,
    'USB Ports': 35,
    'Built-in Charging': 45,
    'Wheels/Casters': 30,
    'Reclining Feature': 120,
    'Massage Function': 200,
    'Heating System': 150,
    'Waterproof Coating': 70,
    'Anti-scratch Surface': 40,
    'Child Safety Locks': 25,
    'Modular Design': 90,
    'Expandable Sections': 60,
    'Convertible Function': 110
  }
};

export const useCustomization = () => {
  const [customization, setCustomization] = useState<ProductCustomization | null>(null);

  const updateCustomization = (newCustomization: ProductCustomization) => {
    setCustomization(newCustomization);
  };

  const clearCustomization = () => {
    setCustomization(null);
  };

  return {
    customization,
    updateCustomization,
    clearCustomization
  };
};

const Customization: React.FC<CustomizationProps> = ({
  product,
  onCustomizationUpdate,
  onClose,
  isEditing = false,
  initialCustomization
}) => {
  const [customization, setCustomization] = useState<ProductCustomization>(
    initialCustomization || {
      selectedMaterial: product.material || 'Solid Wood',
      selectedFinish: product.finishType || 'Natural',
      selectedColor: product.primaryColor || 'Brown',
      customDimensions: {
        length: product.dimensions?.length || '',
        width: product.dimensions?.width || '',
        height: product.dimensions?.height || '',
        unit: product.dimensions?.unit || 'cm'
      },
      selectedFeatures: [],
      additionalOptions: [],
      technicalSpecs: {
        weight: product.weight || '',
        loadCapacity: '',
        assemblyRequired: false,
        customNotes: ''
      },
      priceAdjustment: 0,
      totalPrice: parseFloat(product.price) || 0,
      productionTime: '3-4 weeks',
      estimatedDelivery: calculateEstimatedDelivery('3-4 weeks')
    }
  );

  const [activeTab, setActiveTab] = useState<'materials' | 'dimensions' | 'features' | 'specs' | 'summary'>('materials');
  const [isEditingMode, setIsEditingMode] = useState(isEditing);

  function calculateEstimatedDelivery(productionTime: string): string {
    const today = new Date();
    const weeks = parseInt(productionTime.split('-')[0]) || 3;
    const deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() + (weeks * 7));
    return deliveryDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  useEffect(() => {
    let adjustment = 0;
    
    adjustment += PRICE_ADJUSTMENTS.materials[customization.selectedMaterial as keyof typeof PRICE_ADJUSTMENTS.materials] || 0;
    adjustment += PRICE_ADJUSTMENTS.finishes[customization.selectedFinish as keyof typeof PRICE_ADJUSTMENTS.finishes] || 0;
    
    customization.selectedFeatures.forEach(feature => {
      adjustment += PRICE_ADJUSTMENTS.features[feature as keyof typeof PRICE_ADJUSTMENTS.features] || 0;
    });

    const basePrice = parseFloat(product.price) || 0;
    const totalPrice = basePrice + adjustment;

    setCustomization(prev => ({
      ...prev,
      priceAdjustment: adjustment,
      totalPrice: totalPrice,
      estimatedDelivery: calculateEstimatedDelivery(prev.productionTime)
    }));
  }, [customization.selectedMaterial, customization.selectedFinish, customization.selectedFeatures, product.price]);

  const handleDimensionChange = (field: keyof ProductCustomization['customDimensions'], value: string) => {
    setCustomization(prev => ({
      ...prev,
      customDimensions: {
        ...prev.customDimensions,
        [field]: value
      }
    }));
  };

  const handleFeatureToggle = (feature: string) => {
    setCustomization(prev => ({
      ...prev,
      selectedFeatures: prev.selectedFeatures.includes(feature)
        ? prev.selectedFeatures.filter(f => f !== feature)
        : [...prev.selectedFeatures, feature]
    }));
  };

  const handleTechnicalSpecChange = (field: keyof ProductCustomization['technicalSpecs'], value: any) => {
    setCustomization(prev => ({
      ...prev,
      technicalSpecs: {
        ...prev.technicalSpecs,
        [field]: value
      }
    }));
  };

  const handleSaveCustomization = () => {
    onCustomizationUpdate(customization);
    if (!isEditing) {
      onClose();
    } else {
      setIsEditingMode(false);
    }
  };

  const handleReset = () => {
    setCustomization({
      selectedMaterial: product.material || 'Solid Wood',
      selectedFinish: product.finishType || 'Natural',
      selectedColor: product.primaryColor || 'Brown',
      customDimensions: {
        length: product.dimensions?.length || '',
        width: product.dimensions?.width || '',
        height: product.dimensions?.height || '',
        unit: product.dimensions?.unit || 'cm'
      },
      selectedFeatures: [],
      additionalOptions: [],
      technicalSpecs: {
        weight: product.weight || '',
        loadCapacity: '',
        assemblyRequired: false,
        customNotes: ''
      },
      priceAdjustment: 0,
      totalPrice: parseFloat(product.price) || 0,
      productionTime: '3-4 weeks',
      estimatedDelivery: calculateEstimatedDelivery('3-4 weeks')
    });
  };

  const renderMaterialSelection = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 flex items-center">
            <Factory className="w-5 h-5 mr-2 text-blue-600" />
            Select Material
          </h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {CUSTOMIZATION_OPTIONS.materials.map(material => (
              <label key={material} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="material"
                  value={material}
                  checked={customization.selectedMaterial === material}
                  onChange={(e) => setCustomization(prev => ({ ...prev, selectedMaterial: e.target.value }))}
                  className="w-4 h-4 text-blue-500"
                />
                <span className="flex-1 text-sm text-gray-700">{material}</span>
                <span className="text-xs font-medium text-green-600">
                  +{PRICE_ADJUSTMENTS.materials[material as keyof typeof PRICE_ADJUSTMENTS.materials] || 0} SR
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 flex items-center">
            <Palette className="w-5 h-5 mr-2 text-blue-600" />
            Select Finish
          </h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {CUSTOMIZATION_OPTIONS.finishes.map(finish => (
              <label key={finish} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="finish"
                  value={finish}
                  checked={customization.selectedFinish === finish}
                  onChange={(e) => setCustomization(prev => ({ ...prev, selectedFinish: e.target.value }))}
                  className="w-4 h-4 text-blue-500"
                />
                <span className="flex-1 text-sm text-gray-700">{finish}</span>
                <span className="text-xs font-medium text-green-600">
                  +{PRICE_ADJUSTMENTS.finishes[finish as keyof typeof PRICE_ADJUSTMENTS.finishes] || 0} SR
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 flex items-center">
            <Palette className="w-5 h-5 mr-2 text-blue-600" />
            Select Color
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {CUSTOMIZATION_OPTIONS.colors.map(color => (
              <label key={color} className="flex items-center space-x-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="color"
                  value={color}
                  checked={customization.selectedColor === color}
                  onChange={(e) => setCustomization(prev => ({ ...prev, selectedColor: e.target.value }))}
                  className="w-4 h-4 text-blue-500"
                />
                <div 
                  className="w-6 h-6 rounded border"
                  style={{ 
                    backgroundColor: color.toLowerCase(),
                    borderColor: color.toLowerCase() === 'white' ? '#e5e7eb' : 'transparent'
                  }}
                />
                <span className="text-sm text-gray-700">{color}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h5 className="font-semibold text-blue-800 mb-2">Current Selection</h5>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-blue-600 font-medium">Material:</span>
            <span className="ml-2 text-gray-700">{customization.selectedMaterial}</span>
          </div>
          <div>
            <span className="text-blue-600 font-medium">Finish:</span>
            <span className="ml-2 text-gray-700">{customization.selectedFinish}</span>
          </div>
          <div>
            <span className="text-blue-600 font-medium">Color:</span>
            <span className="ml-2 text-gray-700">{customization.selectedColor}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDimensionsCustomization = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
          <Ruler className="w-5 h-5 mr-2 text-blue-600" />
          Custom Dimensions
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Length</label>
            <div className="flex space-x-2">
              <input
                type="text"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
                value={customization.customDimensions.length}
                onChange={(e) => handleDimensionChange('length', e.target.value)}
              />
              <select
                className="w-20 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={customization.customDimensions.unit}
                onChange={(e) => handleDimensionChange('unit', e.target.value)}
              >
                <option value="cm">cm</option>
                <option value="inches">inches</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Width</label>
            <div className="flex space-x-2">
              <input
                type="text"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
                value={customization.customDimensions.width}
                onChange={(e) => handleDimensionChange('width', e.target.value)}
              />
              <span className="flex items-center px-2 text-gray-500">
                {customization.customDimensions.unit}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Height</label>
            <div className="flex space-x-2">
              <input
                type="text"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
                value={customization.customDimensions.height}
                onChange={(e) => handleDimensionChange('height', e.target.value)}
              />
              <span className="flex items-center px-2 text-gray-500">
                {customization.customDimensions.unit}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={customization.customDimensions.unit}
              onChange={(e) => handleDimensionChange('unit', e.target.value)}
            >
              <option value="cm">Centimeters</option>
              <option value="inches">Inches</option>
            </select>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h5 className="font-semibold text-yellow-800 mb-2">Dimension Guidelines</h5>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Minimum dimensions: 50cm for length/width, 30cm for height</li>
            <li>• Maximum dimensions: 300cm for length/width, 250cm for height</li>
            <li>• Custom dimensions may affect production time and cost</li>
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h5 className="font-semibold text-gray-900 mb-3">Original Dimensions</h5>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Length:</span>
              <span className="font-medium">{product.dimensions?.length || 'N/A'} {product.dimensions?.unit || 'cm'}</span>
            </div>
            <div className="flex justify-between">
              <span>Width:</span>
              <span className="font-medium">{product.dimensions?.width || 'N/A'} {product.dimensions?.unit || 'cm'}</span>
            </div>
            <div className="flex justify-between">
              <span>Height:</span>
              <span className="font-medium">{product.dimensions?.height || 'N/A'} {product.dimensions?.unit || 'cm'}</span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h5 className="font-semibold text-blue-900 mb-3">Custom Dimensions</h5>
          <div className="space-y-2 text-sm text-blue-700">
            <div className="flex justify-between">
              <span>Length:</span>
              <span className="font-medium">
                {customization.customDimensions.length || 'Not set'} {customization.customDimensions.unit}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Width:</span>
              <span className="font-medium">
                {customization.customDimensions.width || 'Not set'} {customization.customDimensions.unit}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Height:</span>
              <span className="font-medium">
                {customization.customDimensions.height || 'Not set'} {customization.customDimensions.unit}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFeaturesSelection = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
          <Wrench className="w-5 h-5 mr-2 text-blue-600" />
          Additional Features & Options
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CUSTOMIZATION_OPTIONS.features.map(feature => (
            <label key={feature} className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-white cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={customization.selectedFeatures.includes(feature)}
                onChange={() => handleFeatureToggle(feature)}
                className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-700">{feature}</span>
              </div>
              <span className="text-sm font-medium text-green-600">
                +{PRICE_ADJUSTMENTS.features[feature as keyof typeof PRICE_ADJUSTMENTS.features] || 0} SR
              </span>
            </label>
          ))}
        </div>
      </div>

      {customization.selectedFeatures.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h5 className="font-semibold text-green-800 mb-2">Selected Features</h5>
          <div className="flex flex-wrap gap-2">
            {customization.selectedFeatures.map(feature => (
              <span key={feature} className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                <AiOutlineCheck className="w-3 h-3 mr-1" />
                {feature}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderTechnicalSpecs = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-blue-600" />
            Technical Specifications
          </h4>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Estimated weight"
              value={customization.technicalSpecs.weight}
              onChange={(e) => handleTechnicalSpecChange('weight', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Load Capacity (kg)</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Maximum load capacity"
              value={customization.technicalSpecs.loadCapacity}
              onChange={(e) => handleTechnicalSpecChange('loadCapacity', e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="assemblyRequired"
              checked={customization.technicalSpecs.assemblyRequired}
              onChange={(e) => handleTechnicalSpecChange('assemblyRequired', e.target.checked)}
              className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500"
            />
            <label htmlFor="assemblyRequired" className="text-sm text-gray-700">
              Assembly required upon delivery
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 flex items-center">
            <AiOutlineCalendar className="w-5 h-5 mr-2 text-blue-600" />
            Production Timeline
          </h4>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Production Time</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={customization.productionTime}
              onChange={(e) => setCustomization(prev => ({ ...prev, productionTime: e.target.value }))}
            >
              {CUSTOMIZATION_OPTIONS.productionTimes.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h5 className="font-semibold text-blue-800 mb-2">Estimated Delivery</h5>
            <p className="text-blue-700 font-medium">{customization.estimatedDelivery}</p>
            <p className="text-xs text-blue-600 mt-1">
              Based on {customization.productionTime} production time
            </p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes & Requirements</label>
        <textarea
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Any special requirements, notes, or specific instructions for your custom order..."
          value={customization.technicalSpecs.customNotes}
          onChange={(e) => handleTechnicalSpecChange('customNotes', e.target.value)}
        />
      </div>
    </div>
  );

  const renderSummary = () => (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Customization Summary</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h5 className="font-medium text-gray-700 mb-2">Materials & Finish</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Material:</span>
                  <span className="font-medium">{customization.selectedMaterial}</span>
                </div>
                <div className="flex justify-between">
                  <span>Finish:</span>
                  <span className="font-medium">{customization.selectedFinish}</span>
                </div>
                <div className="flex justify-between">
                  <span>Color:</span>
                  <span className="font-medium">{customization.selectedColor}</span>
                </div>
              </div>
            </div>

            <div>
              <h5 className="font-medium text-gray-700 mb-2">Dimensions</h5>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Length:</span>
                  <span className="font-medium">
                    {customization.customDimensions.length || 'Original'} {customization.customDimensions.unit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Width:</span>
                  <span className="font-medium">
                    {customization.customDimensions.width || 'Original'} {customization.customDimensions.unit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Height:</span>
                  <span className="font-medium">
                    {customization.customDimensions.height || 'Original'} {customization.customDimensions.unit}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h5 className="font-medium text-gray-700 mb-2">Selected Features</h5>
              {customization.selectedFeatures.length > 0 ? (
                <ul className="text-sm space-y-1">
                  {customization.selectedFeatures.map(feature => (
                    <li key={feature} className="flex justify-between">
                      <span>{feature}</span>
                      <span className="font-medium text-green-600">
                        +{PRICE_ADJUSTMENTS.features[feature as keyof typeof PRICE_ADJUSTMENTS.features] || 0} SR
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No additional features selected</p>
              )}
            </div>

            <div>
              <h5 className="font-medium text-gray-700 mb-2">Timeline</h5>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Production:</span>
                  <span className="font-medium">{customization.productionTime}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery:</span>
                  <span className="font-medium">{customization.estimatedDelivery}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="font-semibold text-blue-900 mb-4">Pricing Summary</h4>
        
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Base Price:</span>
            <span className="font-medium">{parseFloat(product.price) || 0} SR</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span>Customization Adjustments:</span>
            <span className="font-medium text-green-600">+{customization.priceAdjustment} SR</span>
          </div>
          
          <div className="border-t border-blue-200 pt-2">
            <div className="flex justify-between font-semibold text-lg">
              <span>Total Price:</span>
              <span className="text-blue-700">{customization.totalPrice} SR</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Technical Specifications</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Weight:</span>
            <span className="ml-2 font-medium">{customization.technicalSpecs.weight || 'To be determined'} kg</span>
          </div>
          <div>
            <span className="text-gray-600">Load Capacity:</span>
            <span className="ml-2 font-medium">{customization.technicalSpecs.loadCapacity || 'To be determined'} kg</span>
          </div>
          <div>
            <span className="text-gray-600">Assembly:</span>
            <span className="ml-2 font-medium">
              {customization.technicalSpecs.assemblyRequired ? 'Required' : 'Not Required'}
            </span>
          </div>
        </div>

        {customization.technicalSpecs.customNotes && (
          <div className="mt-4">
            <span className="text-gray-600 text-sm">Additional Notes:</span>
            <p className="text-sm text-gray-700 mt-1">{customization.technicalSpecs.customNotes}</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditingMode ? 'Edit Customization' : 'Customize Product'}
            </h2>
            <p className="text-gray-600 mt-1">{product.title}</p>
          </div>
          
          <div className="flex items-center space-x-3">
            {isEditingMode && (
              <button
                onClick={handleReset}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <AiOutlineRotateLeft size={16} />
                <span>Reset</span>
              </button>
            )}
            
            {!isEditing && (
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <AiOutlineClose size={24} />
              </button>
            )}
          </div>
        </div>

        <div className="border-b border-gray-200">
          <div className="flex space-x-8 px-6 overflow-x-auto">
            {[
              { id: 'materials' as const, label: 'Materials', icon: Factory },
              { id: 'dimensions' as const, label: 'Dimensions', icon: Ruler },
              { id: 'features' as const, label: 'Features', icon: Wrench },
              { id: 'specs' as const, label: 'Specs & Timeline', icon: Shield },
              { id: 'summary' as const, label: 'Summary', icon: AiOutlineEye }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center space-x-2 py-4 font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon size={18} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'materials' && renderMaterialSelection()}
          {activeTab === 'dimensions' && renderDimensionsCustomization()}
          {activeTab === 'features' && renderFeaturesSelection()}
          {activeTab === 'specs' && renderTechnicalSpecs()}
          {activeTab === 'summary' && renderSummary()}
        </div>

        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {customization.totalPrice} SR
                </div>
                <div className="text-sm text-gray-600">
                  {customization.priceAdjustment > 0 && (
                    <span className="text-green-600">
                      +{customization.priceAdjustment} SR customization
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {!isEditing && (
                <button
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
              )}
              
              <button
                onClick={handleSaveCustomization}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <AiOutlineSave size={16} />
                <span>
                  {isEditingMode ? 'Update Customization' : 
                   isEditing ? 'Save Changes' : 'Add to Cart with Customization'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Customization;