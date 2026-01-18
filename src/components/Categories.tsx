// components/admin/categories/CategoryForm.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, AlertCircle } from 'lucide-react';

// Assume this interface exists in your codebase
interface CategoryFormData {
  id?: string;
  name: string;
  description: string;
  parent_id: string | null;
  is_featured: boolean;
  is_active: boolean;
  display_order: number;
  icon: string;
  color: string;
  // New fields to be added
  category_type?: string;
  usage_type?: string;
  custom_attributes?: Record<string, any>;
  // Existing fields remain unchanged
}

interface CategoryFormProps {
  initialData?: CategoryFormData;
  onSubmit: (data: CategoryFormData) => void;
  isLoading?: boolean;
}

const CategoryForm: React.FC<CategoryFormProps> = ({ 
  initialData, 
  onSubmit, 
  isLoading = false 
}) => {
  // Existing form state (keep all existing fields)
  const [formData, setFormData] = useState<CategoryFormData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    parent_id: initialData?.parent_id || null,
    is_featured: initialData?.is_featured || false,
    is_active: initialData?.is_active || true,
    display_order: initialData?.display_order || 0,
    icon: initialData?.icon || 'tag',
    color: initialData?.color || '#3B82F6',
    // Initialize new fields
    category_type: initialData?.category_type || '',
    usage_type: initialData?.usage_type || '',
    custom_attributes: initialData?.custom_attributes || {}
  });

  // NEW: Dynamic form state
  const [showUsageType, setShowUsageType] = useState(false);
  const [showDetailedForm, setShowDetailedForm] = useState(false);
  const [customAttributes, setCustomAttributes] = useState<
    Array<{ id: string; label: string; value: string }>
  >([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // NEW: Category type options
  const categoryTypes = [
    { value: 'customized', label: 'Customized Furniture' },
    { value: 'ready_made', label: 'Ready Made Furniture' }
  ];

  // NEW: Usage type options
  const usageTypes = [
    { value: 'indoor', label: 'Indoor' },
    { value: 'outdoor', label: 'Outdoor' }
  ];

  // NEW: Initialize custom attributes from existing data
  useEffect(() => {
    if (initialData?.custom_attributes) {
      const attrs = Object.entries(initialData.custom_attributes).map(
        ([key, value], index) => ({
          id: `attr-${index}`,
          label: key,
          value: String(value)
        })
      );
      setCustomAttributes(attrs);
    }
    
    // Auto-show sections if editing existing category with data
    if (initialData?.category_type) {
      setShowUsageType(true);
      if (initialData?.usage_type) {
        setShowDetailedForm(true);
      }
    }
  }, [initialData]);

  // NEW: Handle category type selection
  const handleCategoryTypeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      category_type: value,
      // Reset usage type when category type changes
      usage_type: ''
    }));
    setShowUsageType(true);
    setShowDetailedForm(false);
    // Clear usage type errors
    if (errors.usage_type) {
      setErrors(prev => ({ ...prev, usage_type: '' }));
    }
  };

  // NEW: Handle usage type selection
  const handleUsageTypeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      usage_type: value
    }));
    setShowDetailedForm(true);
  };

  // NEW: Add custom attribute field
  const addCustomAttribute = () => {
    const newId = `attr-${Date.now()}`;
    setCustomAttributes(prev => [
      ...prev,
      { id: newId, label: '', value: '' }
    ]);
  };

  // NEW: Remove custom attribute field
  const removeCustomAttribute = (id: string) => {
    setCustomAttributes(prev => prev.filter(attr => attr.id !== id));
  };

  // NEW: Update custom attribute
  const updateCustomAttribute = (id: string, field: 'label' | 'value', newValue: string) => {
    setCustomAttributes(prev =>
      prev.map(attr =>
        attr.id === id ? { ...attr, [field]: newValue } : attr
      )
    );
  };

  // UPDATED: Enhanced validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // New validations
    if (!formData.category_type) {
      newErrors.category_type = 'Category type is required';
    }

    if (showUsageType && !formData.usage_type) {
      newErrors.usage_type = 'Usage type is required';
    }

    // Existing validations (preserved)
    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    }

    // Custom attribute validations
    customAttributes.forEach((attr, index) => {
      if (attr.label && !attr.value) {
        newErrors[`attr-value-${index}`] = 'Value is required when label is provided';
      }
      if (!attr.label && attr.value) {
        newErrors[`attr-label-${index}`] = 'Label is required when value is provided';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // UPDATED: Enhanced submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Prepare custom attributes object
    const attributesObj: Record<string, any> = {};
    customAttributes.forEach(attr => {
      if (attr.label.trim() && attr.value.trim()) {
        attributesObj[attr.label.trim()] = attr.value.trim();
      }
    });

    // Submit all data including new fields
    onSubmit({
      ...formData,
      custom_attributes: Object.keys(attributesObj).length > 0 ? attributesObj : undefined
    });
  };

  // UPDATED: Enhanced form with conditional sections
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* SECTION 1: CATEGORY TYPE (REQUIRED) */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          1. Primary Category Type
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category Type *
            </label>
            <select
              value={formData.category_type}
              onChange={(e) => handleCategoryTypeChange(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.category_type ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            >
              <option value="">Select a category type</option>
              {categoryTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.category_type && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.category_type}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: USAGE TYPE (CONDITIONAL) */}
      {showUsageType && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 animate-slideDown">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            2. Usage Type
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Usage Type *
            </label>
            <select
              value={formData.usage_type}
              onChange={(e) => handleUsageTypeChange(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.usage_type ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            >
              <option value="">Select usage type</option>
              {usageTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.usage_type && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.usage_type}
              </p>
            )}
          </div>
        </div>
      )}

      {/* SECTION 3: DETAILED FORM (CONDITIONAL) */}
      {showDetailedForm && (
        <div className="space-y-6">
          {/* EXISTING CATEGORY DETAILS - Preserved exactly */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              3. Category Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Modern Sofas"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Slug (auto-generated from name - keep existing logic) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slug
                </label>
                <input
                  type="text"
                  value={formData.name.toLowerCase().replace(/\s+/g, '-')}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Describe this category..."
                />
              </div>
            </div>
          </div>

          {/* EXISTING SETTINGS - Preserved exactly */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Settings
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Is Active */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                  Is Active
                </label>
              </div>

              {/* Is Featured */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_featured"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_featured" className="ml-2 text-sm text-gray-700">
                  Featured Category
                </label>
              </div>

              {/* Display Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Order
                </label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* NEW: CUSTOM ATTRIBUTES SECTION */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                4. Custom Attributes
              </h3>
              <button
                type="button"
                onClick={addCustomAttribute}
                className="flex items-center space-x-1 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
              >
                <Plus className="w-4 h-4" />
                <span>Add Attribute</span>
              </button>
            </div>
            
            <p className="text-sm text-gray-500 mb-4">
              Add custom attributes like Material, Dimensions, Warranty, etc.
            </p>

            <div className="space-y-4">
              {customAttributes.map((attr, index) => (
                <div key={attr.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <input
                        type="text"
                        value={attr.label}
                        onChange={(e) => updateCustomAttribute(attr.id, 'label', e.target.value)}
                        className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors[`attr-label-${index}`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Attribute name (e.g., Material)"
                      />
                      {errors[`attr-label-${index}`] && (
                        <p className="mt-1 text-xs text-red-600">{errors[`attr-label-${index}`]}</p>
                      )}
                    </div>
                    <div>
                      <input
                        type="text"
                        value={attr.value}
                        onChange={(e) => updateCustomAttribute(attr.id, 'value', e.target.value)}
                        className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors[`attr-value-${index}`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Value (e.g., Solid Wood)"
                      />
                      {errors[`attr-value-${index}`] && (
                        <p className="mt-1 text-xs text-red-600">{errors[`attr-value-${index}`]}</p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCustomAttribute(attr.id)}
                    className="p-2 text-gray-400 hover:text-red-600"
                    aria-label="Remove attribute"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {customAttributes.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <p>No custom attributes added yet.</p>
                  <p className="text-sm mt-1">Click "Add Attribute" to get started.</p>
                </div>
              )}
            </div>
          </div>

          {/* EXISTING MEDIA SECTION - Preserved exactly */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Media
            </h3>
            {/* Keep existing image upload and icon selector components */}
            <div className="space-y-4">
              {/* Existing image upload component here */}
              {/* Existing icon selector component here */}
            </div>
          </div>
        </div>
      )}

      {/* SUBMIT BUTTON - Enhanced */}
      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          onClick={() => {
            // Reset form logic (preserve existing)
            setFormData({
              name: '',
              description: '',
              parent_id: null,
              is_featured: false,
              is_active: true,
              display_order: 0,
              icon: 'tag',
              color: '#3B82F6',
              category_type: '',
              usage_type: '',
              custom_attributes: {}
            });
            setShowUsageType(false);
            setShowDetailedForm(false);
            setCustomAttributes([]);
            setErrors({});
          }}
        >
          Reset
        </button>
        
        <button
          type="submit"
          disabled={isLoading || !showDetailedForm || !formData.category_type || !formData.usage_type}
          className={`px-6 py-2 rounded-lg font-medium ${
            isLoading || !showDetailedForm || !formData.category_type || !formData.usage_type
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isLoading ? 'Creating...' : initialData ? 'Update Category' : 'Create Category'}
        </button>
      </div>
    </form>
  );
};

// Add CSS for animation (in your global CSS or style tag)
const style = `
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .animate-slideDown {
    animation: slideDown 0.3s ease-out;
  }
`;

export default CategoryForm;