// components/admin/categories/CategoryForm.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../..//lib/supabase';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface CategoryFormData {
  id?: string;
  name: string;
  display_name: string;
  description: string;
  category_type: 'customized' | 'ready_made';
  usage_type: 'indoor' | 'outdoor' | 'both';
  product_type: string | null;
  product_categories: string[];
  parent_id: string | null;
  is_active: boolean;
  is_featured?: boolean;
  level: number;
  display_order: number;
  icon: string;
  color: string;
  metadata: Record<string, any>;
  slug?: string;
}

interface CategoryFormProps {
  initialData?: Partial<CategoryFormData>;
  onSubmit?: (data: CategoryFormData) => Promise<void>;
  isLoading?: boolean;
  onCancel?: () => void;
  mode?: 'create' | 'edit';
  onSuccess?: () => void;
}

const CategoryForm: React.FC<CategoryFormProps> = ({
  initialData,
  onSubmit,
  isLoading = false,
  onCancel,
  mode = 'create',
  onSuccess
}) => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<CategoryFormData>({
    name: initialData?.name || '',
    display_name: initialData?.display_name || '',
    description: initialData?.description || '',
    category_type: initialData?.category_type || 'customized',
    usage_type: initialData?.usage_type || 'indoor',
    product_type: initialData?.product_type || null,
    product_categories: initialData?.product_categories || [],
    parent_id: initialData?.parent_id || null,
    is_active: initialData?.is_active ?? true,
    is_featured: initialData?.is_featured || false,
    level: initialData?.level || 1,
    display_order: initialData?.display_order || 0,
    icon: initialData?.icon || '📦',
    color: initialData?.color || '#3B82F6',
    metadata: initialData?.metadata || {},
    slug: initialData?.slug || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [existingCategories, setExistingCategories] = useState<CategoryFormData[]>([]);
  
  const [showAddProductType, setShowAddProductType] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newProductType, setNewProductType] = useState('');
  const [newCategory, setNewCategory] = useState('');

  const categoryTypes = [
    { value: 'customized', label: 'Customized', icon: '✏️', color: '#8B5CF6' },
    { value: 'ready_made', label: 'Ready Made', icon: '📦', color: '#10B981' }
  ];

  const usageTypes = [
    { value: 'indoor', label: 'Indoor', icon: '🏠', color: '#3B82F6' },
    { value: 'outdoor', label: 'Outdoor', icon: '☀️', color: '#F59E0B' },
    { value: 'both', label: 'Both', icon: '🔄', color: '#8B5CF6' }
  ];

  const [productTypes, setProductTypes] = useState([
    { value: 'sofa', label: 'Sofa', icon: '🛋️', color: '#EF4444' },
    { value: 'bed', label: 'Bed', icon: '🛏️', color: '#6366F1' },
    { value: 'table', label: 'Table', icon: '🪑', color: '#F59E0B' },
    { value: 'chair', label: 'Chair', icon: '💺', color: '#10B981' },
    { value: 'cabinet', label: 'Cabinet', icon: '🗄️', color: '#8B5CF6' },
    { value: 'wardrobe', label: 'Wardrobe', icon: '👔', color: '#EC4899' },
    { value: 'shelf', label: 'Shelf', icon: '📚', color: '#8B5CF6' },
    { value: 'desk', label: 'Desk', icon: '💻', color: '#3B82F6' }
  ]);

  const [productCategories, setProductCategories] = useState([
    { value: 'living_room', label: 'Living Room', icon: '🛋️', color: '#EF4444' },
    { value: 'bedroom', label: 'Bedroom', icon: '🛏️', color: '#6366F1' },
    { value: 'kitchen', label: 'Kitchen', icon: '🍳', color: '#F59E0B' },
    { value: 'office', label: 'Office', icon: '💼', color: '#8B5CF6' },
    { value: 'garden', label: 'Garden', icon: '🌳', color: '#10B981' },
    { value: 'dining', label: 'Dining', icon: '🍽️', color: '#8B5CF6' },
    { value: 'bathroom', label: 'Bathroom', icon: '🛁', color: '#3B82F6' },
    { value: 'kids_room', label: "Kids' Room", icon: '🧸', color: '#EC4899' }
  ]);

  useEffect(() => {
    fetchExistingCategories();
  }, []);

  useEffect(() => {
    // Auto-generate display name based on selections
    if (formData.category_type && formData.usage_type && formData.product_type) {
      const categoryTypeLabel = categoryTypes.find(t => t.value === formData.category_type)?.label || '';
      const usageTypeLabel = usageTypes.find(t => t.value === formData.usage_type)?.label || '';
      const productTypeLabel = productTypes.find(t => t.value === formData.product_type)?.label || '';
      
      // Generate name like "Custom Sofa Indoor" or "Ready Bed Outdoor"
      const generatedName = `${categoryTypeLabel} ${productTypeLabel} ${usageTypeLabel}`;
      const generatedDisplayName = `${categoryTypeLabel} ${productTypeLabel}`;
      const generatedSlug = generatedName
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
      
      setFormData(prev => ({ 
        ...prev, 
        name: generatedName,
        display_name: generatedDisplayName,
        slug: generatedSlug,
        // Set level based on selections (matches HomePage structure)
        level: getCategoryLevel()
      }));
    }
  }, [formData.category_type, formData.usage_type, formData.product_type]);

  const getCategoryLevel = () => {
    if (formData.category_type && formData.usage_type && formData.product_type && formData.product_categories.length > 0) {
      return 4; // Full category with product categories
    } else if (formData.category_type && formData.usage_type && formData.product_type) {
      return 3; // Category with product type
    } else if (formData.category_type && formData.usage_type) {
      return 2; // Category with usage type
    }
    return 1; // Just category type
  };

  const fetchExistingCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order');

      if (error) {
        console.error('Error fetching categories:', error);
        setExistingCategories([]);
        return;
      }
      setExistingCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setExistingCategories([]);
    }
  };

  const handleAddProductType = () => {
    if (!newProductType.trim()) {
      toast.error('Please enter product type name');
      return;
    }

    const newType = {
      value: newProductType.toLowerCase().replace(/\s+/g, '_'),
      label: newProductType,
      icon: '📦',
      color: '#6B7280'
    };

    setProductTypes(prev => [...prev, newType]);
    setFormData(prev => ({
      ...prev,
      product_type: newType.value,
      level: 3
    }));
    
    setNewProductType('');
    setShowAddProductType(false);
    toast.success('Product type added!');
  };

  const handleAddCategory = () => {
    if (!newCategory.trim()) {
      toast.error('Please enter category name');
      return;
    }

    const newCat = {
      value: newCategory.toLowerCase().replace(/\s+/g, '_'),
      label: newCategory,
      icon: '🏷️',
      color: '#6B7280'
    };

    setProductCategories(prev => [...prev, newCat]);
    setFormData(prev => ({
      ...prev,
      product_categories: [...prev.product_categories, newCat.value],
      level: 4
    }));
    
    setNewCategory('');
    setShowAddCategory(false);
    toast.success('Category added!');
  };

  const handleCategoryCheckboxChange = (categoryValue: string) => {
    setFormData(prev => {
      const currentCategories = prev.product_categories || [];
      const newCategories = currentCategories.includes(categoryValue)
        ? currentCategories.filter(cat => cat !== categoryValue)
        : [...currentCategories, categoryValue];
      
      return {
        ...prev,
        product_categories: newCategories,
        level: newCategories.length > 0 ? 4 : 3
      };
    });
  };

  const handleCategoryTypeSelect = (type: 'customized' | 'ready_made') => {
    setFormData(prev => ({
      ...prev,
      category_type: type,
      usage_type: 'indoor', // Reset to default
      product_type: null,
      product_categories: [],
      level: 1
    }));
  };

  const handleUsageTypeSelect = (type: 'indoor' | 'outdoor' | 'both') => {
    setFormData(prev => ({
      ...prev,
      usage_type: type,
      product_type: null,
      product_categories: [],
      level: 2
    }));
  };

  const handleProductTypeSelect = (productType: string) => {
    setFormData(prev => ({
      ...prev,
      product_type: productType,
      product_categories: [],
      level: 3
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.category_type) {
      newErrors.category_type = 'Select furniture type';
    }

    if (!formData.usage_type) {
      newErrors.usage_type = 'Select usage area';
    }

    if (!formData.product_type) {
      newErrors.product_type = 'Select product type';
    }

    if (formData.product_categories.length === 0) {
      newErrors.product_categories = 'Select at least one category';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix form errors');
      return;
    }

    try {
      setLoading(true);
      
      // Build hierarchy path that matches HomePage structure
      const hierarchyPath = getHierarchyPath();
      
      // Create filter tags for easy filtering in HomePage
      const filterTags = [
        formData.category_type,
        formData.usage_type,
        formData.product_type,
        ...formData.product_categories
      ].filter(Boolean);
      
      const categoryTypeLabel = categoryTypes.find(t => t.value === formData.category_type)?.label || '';
      const usageTypeLabel = usageTypes.find(t => t.value === formData.usage_type)?.label || '';
      const productTypeLabel = productTypes.find(t => t.value === formData.product_type)?.label || '';
      
      // Generate display name that matches HomePage sidebar format
      const displayName = `${categoryTypeLabel} ${productTypeLabel}`;
      
      const categoryData = {
        name: formData.name || displayName,
        display_name: displayName,
        description: formData.description || `Browse our collection of ${productTypeLabel.toLowerCase()}s for ${usageTypeLabel.toLowerCase()} spaces`,
        category_type: formData.category_type,
        usage_type: formData.usage_type,
        product_type: formData.product_type,
        product_categories: formData.product_categories,
        parent_id: formData.parent_id,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
        level: formData.level,
        display_order: formData.display_order,
        icon: formData.icon,
        color: formData.color,
        metadata: {
          hierarchy_path: hierarchyPath,
          filter_tags: filterTags,
          product_type_label: productTypeLabel,
          usage_type_label: usageTypeLabel,
          category_type_label: categoryTypeLabel
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Saving category:', categoryData);

      let result;
      
      if (mode === 'edit' && formData.id) {
        const { data, error } = await supabase
          .from('categories')
          .update(categoryData)
          .eq('id', formData.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
        toast.success('Category updated!');
      } else {
        const { data, error } = await supabase
          .from('categories')
          .insert([categoryData])
          .select()
          .single();

        if (error) {
          console.error('Insert error:', error);
          
          // Save to localStorage as fallback
          const categoriesFromStorage = JSON.parse(localStorage.getItem('adminCategories') || '[]');
          const newCategory = {
            id: `cat_${Date.now()}`,
            ...categoryData
          };
          localStorage.setItem('adminCategories', JSON.stringify([...categoriesFromStorage, newCategory]));
          result = newCategory;
          toast.success('Category saved to local storage!');
        } else {
          result = data;
          toast.success('Category created!');
        }
      }

      if (onSubmit) await onSubmit(result);
      if (onSuccess) onSuccess();

      if (mode === 'create') {
        resetForm();
      }

      await fetchExistingCategories();

    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Failed to save category.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      display_name: '',
      description: '',
      category_type: 'customized',
      usage_type: 'indoor',
      product_type: null,
      product_categories: [],
      parent_id: null,
      is_active: true,
      is_featured: false,
      level: 1,
      display_order: 0,
      icon: '📦',
      color: '#3B82F6',
      metadata: {},
      slug: ''
    });
    setErrors({});
    setShowAddProductType(false);
    setShowAddCategory(false);
    setNewProductType('');
    setNewCategory('');
  };

  const getHierarchyPath = () => {
    const path = [];
    
    const step1 = categoryTypes.find(t => t.value === formData.category_type);
    if (step1) path.push(step1.label);
    
    const step2 = usageTypes.find(t => t.value === formData.usage_type);
    if (step2) path.push(step2.label);
    
    if (formData.product_type) {
      const step3 = productTypes.find(t => t.value === formData.product_type);
      if (step3) path.push(step3.label);
    }
    
    if (formData.product_categories.length > 0) {
      const selectedCategories = formData.product_categories
        .map(catValue => productCategories.find(t => t.value === catValue)?.label)
        .filter(Boolean);
      if (selectedCategories.length > 0) {
        path.push(selectedCategories.join(', '));
      }
    }
    
    return path.join(' → ');
  };

  const StepBox = ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">{title}</h3>
      {children}
    </div>
  );

  const BackButton = () => (
    <button
      type="button"
      onClick={() => navigate('/admin/dashboard')}
      className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
    >
      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      Back to Dashboard
    </button>
  );

  const AddNewInput = ({ 
    value, 
    setValue, 
    onAdd, 
    onCancel, 
    placeholder 
  }: { 
    value: string; 
    setValue: (val: string) => void; 
    onAdd: () => void; 
    onCancel: () => void; 
    placeholder: string; 
  }) => (
    <div className="mt-2 p-3 bg-blue-50 rounded border border-blue-200">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-blue-300 rounded mb-3"
        placeholder={placeholder}
        autoFocus
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onAdd}
          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
        >
          Add
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  const CategoryCheckbox = ({ option }: { option: { value: string; label: string; icon: string } }) => {
    const isChecked = formData.product_categories?.includes(option.value) || false;
    
    return (
      <label className={`flex items-center p-3 rounded border cursor-pointer transition-all ${
        isChecked 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 hover:bg-gray-50'
      }`}>
        <input
          type="checkbox"
          checked={isChecked}
          onChange={() => handleCategoryCheckboxChange(option.value)}
          className="h-4 w-4 text-blue-600 rounded border-gray-300"
        />
        <span className="ml-3 mr-2 text-lg">{option.icon}</span>
        <span className="text-sm text-gray-700">{option.label}</span>
      </label>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-4 bg-gray-100">
      <div className="mb-6">
        <BackButton />
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <h1 className="text-lg font-bold text-gray-900">
            {mode === 'edit' ? 'Edit Category' : 'Create New Category'}
          </h1>
          <p className="text-sm text-gray-600 mt-1">Create categories that will appear in the HomePage sidebar</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <StepBox title="Step 1: Furniture Type">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleCategoryTypeSelect('customized')}
                  className={`p-4 rounded-lg border flex flex-col items-center justify-center transition-all ${
                    formData.category_type === 'customized' 
                      ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-sm' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-2xl mb-2">✏️</span>
                  <span className="text-sm font-medium">Customized</span>
                  <span className="text-xs text-gray-500 mt-1">Made to order</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => handleCategoryTypeSelect('ready_made')}
                  className={`p-4 rounded-lg border flex flex-col items-center justify-center transition-all ${
                    formData.category_type === 'ready_made' 
                      ? 'border-green-500 bg-green-50 text-green-700 shadow-sm' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-2xl mb-2">📦</span>
                  <span className="text-sm font-medium">Ready Made</span>
                  <span className="text-xs text-gray-500 mt-1">Ready to ship</span>
                </button>
              </div>
              {errors.category_type && (
                <p className="mt-2 text-xs text-red-600">{errors.category_type}</p>
              )}
            </StepBox>

            {formData.category_type && (
              <StepBox title="Step 2: Usage Area">
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => handleUsageTypeSelect('indoor')}
                    className={`p-4 rounded-lg border flex flex-col items-center justify-center transition-all ${
                      formData.usage_type === 'indoor' 
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-2xl mb-2">🏠</span>
                    <span className="text-sm font-medium">Indoor</span>
                    <span className="text-xs text-gray-500 mt-1">For indoor use</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleUsageTypeSelect('outdoor')}
                    className={`p-4 rounded-lg border flex flex-col items-center justify-center transition-all ${
                      formData.usage_type === 'outdoor' 
                        ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-2xl mb-2">☀️</span>
                    <span className="text-sm font-medium">Outdoor</span>
                    <span className="text-xs text-gray-500 mt-1">Weather resistant</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleUsageTypeSelect('both')}
                    className={`p-4 rounded-lg border flex flex-col items-center justify-center transition-all ${
                      formData.usage_type === 'both' 
                        ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-sm' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-2xl mb-2">🔄</span>
                    <span className="text-sm font-medium">Both</span>
                    <span className="text-xs text-gray-500 mt-1">Indoor & outdoor</span>
                  </button>
                </div>
                {errors.usage_type && (
                  <p className="mt-2 text-xs text-red-600">{errors.usage_type}</p>
                )}
              </StepBox>
            )}
          </div>

          <div className="space-y-4">
            {formData.usage_type && (
              <StepBox title="Step 3: Product Type">
                <div className="mb-3">
                  <select
                    value={formData.product_type || ''}
                    onChange={(e) => handleProductTypeSelect(e.target.value)}
                    className={`w-full px-3 py-2.5 text-sm border rounded-lg ${
                      errors.product_type ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select product type</option>
                    {productTypes.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.icon} {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.product_type && (
                    <p className="mt-1 text-xs text-red-600">{errors.product_type}</p>
                  )}
                </div>
                
                {!showAddProductType ? (
                  <button
                    type="button"
                    onClick={() => setShowAddProductType(true)}
                    className="w-full py-2.5 text-sm text-blue-600 hover:text-blue-800 border border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  >
                    + Add New Product Type
                  </button>
                ) : (
                  <AddNewInput
                    value={newProductType}
                    setValue={setNewProductType}
                    onAdd={handleAddProductType}
                    onCancel={() => setShowAddProductType(false)}
                    placeholder="Enter new product type (e.g., Dining Table)"
                  />
                )}
              </StepBox>
            )}

            {formData.product_type && (
              <StepBox title="Step 4: Product Categories (Select Multiple)">
                <div className="grid grid-cols-2 gap-2 mb-3 max-h-64 overflow-y-auto p-1">
                  {productCategories.map(option => (
                    <CategoryCheckbox key={option.value} option={option} />
                  ))}
                </div>
                
                {errors.product_categories && (
                  <p className="text-xs text-red-600 mb-2">{errors.product_categories}</p>
                )}
                
                {!showAddCategory ? (
                  <button
                    type="button"
                    onClick={() => setShowAddCategory(true)}
                    className="w-full py-2.5 text-sm text-blue-600 hover:text-blue-800 border border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  >
                    + Add New Category
                  </button>
                ) : (
                  <AddNewInput
                    value={newCategory}
                    setValue={setNewCategory}
                    onAdd={handleAddCategory}
                    onCancel={() => setShowAddCategory(false)}
                    placeholder="Enter new category (e.g., Home Office)"
                  />
                )}
              </StepBox>
            )}
          </div>
        </div>

        {formData.category_type && (
          <StepBox title="Preview & Settings">
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Category Preview</h4>
                <div className="space-y-1">
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">Category Name:</span>{' '}
                    <span className="text-gray-900 font-medium">{formData.display_name || 'Auto-generated'}</span>
                  </div>
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">Category Type:</span>{' '}
                    <span className="text-gray-900 capitalize">{formData.category_type.replace('_', ' ')}</span>
                  </div>
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">Usage Type:</span>{' '}
                    <span className="text-gray-900 capitalize">{formData.usage_type}</span>
                  </div>
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">Product Type:</span>{' '}
                    <span className="text-gray-900">{formData.product_type || 'Not selected'}</span>
                  </div>
                  {formData.product_categories.length > 0 && (
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">Product Categories:</span>{' '}
                      <span className="text-gray-900">{formData.product_categories.length} selected</span>
                    </div>
                  )}
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">Hierarchy Path:</span>{' '}
                    <span className="text-gray-900">{getHierarchyPath()}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Display Order
                    </label>
                    <input
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        display_order: parseInt(e.target.value) || 0
                      }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                      min="0"
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="flex items-center p-2 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          is_active: e.target.checked
                        }))}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                      <div className="ml-3">
                        <span className="text-sm font-medium text-gray-900">Active Category</span>
                        <p className="text-xs text-gray-500">Show on website</p>
                      </div>
                    </label>
                    
                    <label className="flex items-center p-2 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_featured}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          is_featured: e.target.checked
                        }))}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                      <div className="ml-3">
                        <span className="text-sm font-medium text-gray-900">Featured Category</span>
                        <p className="text-xs text-gray-500">Highlight on homepage</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Category Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      description: e.target.value
                    }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                    rows={4}
                    placeholder="Optional: Add a description for this category..."
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty for auto-generated description</p>
                </div>
              </div>
            </div>
          </StepBox>
        )}

        <div className="flex justify-between pt-4 border-t border-gray-200">
          <div>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
            >
              Clear Form
            </button>
          </div>
          
          <div className="flex gap-3">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
            
            <button
              type="submit"
              disabled={isLoading || loading || !formData.category_type || !formData.usage_type || !formData.product_type || formData.product_categories.length === 0}
              className="px-6 py-2 text-sm bg-gray-900 text-white rounded hover:bg-black disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {isLoading || loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </span>
              ) : mode === 'edit' ? 'Update Category' : 'Create Category'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CategoryForm;