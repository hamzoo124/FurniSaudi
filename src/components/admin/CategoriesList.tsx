// src/components/admin/Categories.tsx
import React, { useState, useEffect } from 'react';
import { 
  Plus, FolderTree, Layers, ChevronRight, Edit, Trash2, Eye, EyeOff, 
  Star, Tag, Grid, List, Search, Filter, ArrowUp, ArrowDown, 
  RefreshCw, Check, X, Save, XCircle, AlertCircle, Package,
  Home, Sofa, TreePine, Hammer, Building, Users, ShoppingBag,
  Grid3x3, Type, MapPin, DoorOpen, Hash, Building2,
  PlusCircle, AlertTriangle, Lock, Unlock
} from 'lucide-react';
import { supabaseAdmin as supabase } from '@/lib/supabase';

interface Category {
  id: string;
  name: string;
  description: string;
  slug: string;
  icon: string;
  color: string;
  parent_id: string | null;
  display_order: number;
  is_active: boolean;
  is_featured: boolean;
  product_count: number;
  created_at: string;
  updated_at: string;
  children?: Category[];
  level?: number;
  parent_name?: string;
}

// Define level configuration
const CATEGORY_LEVELS = {
  LEVEL_1: 1, // Furniture Type
  LEVEL_2: 2, // Usage Area
  LEVEL_3: 3, // Space/Room
  LEVEL_4: 4  // Product Type
};

// Available icons with better furniture-related options
const availableIcons = [
  { value: 'sofa', label: 'Sofa', icon: <Sofa className="w-4 h-4" /> },
  { value: 'home', label: 'Home', icon: <Home className="w-4 h-4" /> },
  { value: 'tree-pine', label: 'Outdoor', icon: <TreePine className="w-4 h-4" /> },
  { value: 'door-open', label: 'Room', icon: <DoorOpen className="w-4 h-4" /> },
  { value: 'grid-3x3', label: 'Type', icon: <Grid3x3 className="w-4 h-4" /> },
  { value: 'type', label: 'Category', icon: <Type className="w-4 h-4" /> },
  { value: 'map-pin', label: 'Area', icon: <MapPin className="w-4 h-4" /> },
  { value: 'building-2', label: 'Furniture', icon: <Building2 className="w-4 h-4" /> },
  { value: 'package', label: 'Product', icon: <Package className="w-4 h-4" /> },
  { value: 'shopping-bag', label: 'Shopping', icon: <ShoppingBag className="w-4 h-4" /> }
];

// Available colors
const availableColors = [
  '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#84CC16'
];

const AdminCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [viewMode, setViewMode] = useState<'tree' | 'grid'>('tree');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive' | 'featured'>('all');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    featured: 0,
    level1: 0,
    level2: 0,
    level3: 0,
    level4: 0
  });

  // Step-by-step form state
  const [formStep, setFormStep] = useState(1);
  const [formData, setFormData] = useState({
    level1: { name: '', id: '' }, // Furniture Type
    level2: { name: '', id: '' }, // Usage Area
    level3: { name: '', id: '' }, // Space/Room
    level4: { name: '', id: '' }, // Product Type
    customInput: '',
    description: '',
    icon: 'sofa',
    color: '#3B82F6',
    is_active: true,
    is_featured: false,
    parent_id: null as string | null
  });

  // Available options for each level (fetched from DB)
  const [levelOptions, setLevelOptions] = useState({
    level1: [] as Category[], // Furniture Types
    level2: [] as Category[], // Usage Areas (based on selected level1)
    level3: [] as Category[], // Rooms (based on selected level2)
    level4: [] as Category[]  // Product Types (based on selected level3)
  });

  // Load all categories with hierarchy
  const loadCategories = async () => {
    setLoading(true);
    try {
      // Fetch all categories
      const { data: allCategories, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) throw error;

      // Calculate level for each category based on parent hierarchy
      const calculateLevel = (categoryId: string, categoriesList: Category[]): number => {
        let level = 1;
        let currentId = categoryId;
        
        while (true) {
          const category = categoriesList.find(c => c.id === currentId);
          if (!category || !category.parent_id) break;
          level++;
          currentId = category.parent_id;
        }
        
        return level;
      };

      // Add level and parent name to each category
      const categoriesWithLevel = (allCategories || []).map(cat => {
        const level = calculateLevel(cat.id, allCategories || []);
        const parent = allCategories?.find(c => c.id === cat.parent_id);
        return {
          ...cat,
          level,
          parent_name: parent?.name || null
        };
      });

      // Build hierarchical tree
      const buildTree = (items: Category[], parentId: string | null = null): Category[] => {
        return items
          .filter(item => item.parent_id === parentId)
          .map(item => ({
            ...item,
            children: buildTree(items, item.id)
          }))
          .sort((a, b) => a.display_order - b.display_order);
      };

      const categoryTree = buildTree(categoriesWithLevel);
      setCategories(categoryTree);
      applyFilters(categoryTree, searchQuery, activeFilter);

      // Calculate level-specific stats
      const levelStats = {
        total: categoriesWithLevel.length,
        active: categoriesWithLevel.filter(c => c.is_active).length,
        inactive: categoriesWithLevel.filter(c => !c.is_active).length,
        featured: categoriesWithLevel.filter(c => c.is_featured).length,
        level1: categoriesWithLevel.filter(c => c.level === 1).length,
        level2: categoriesWithLevel.filter(c => c.level === 2).length,
        level3: categoriesWithLevel.filter(c => c.level === 3).length,
        level4: categoriesWithLevel.filter(c => c.level === 4).length
      };
      
      setStats(levelStats);

      // Load level 1 options (top-level categories)
      const level1Cats = categoriesWithLevel.filter(c => c.level === 1);
      setLevelOptions(prev => ({ ...prev, level1: level1Cats }));

    } catch (error) {
      console.error('Error loading categories:', error);
      alert('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  // Load options for next level based on selection
  const loadNextLevelOptions = async (parentId: string, level: number) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('parent_id', parentId)
        .order('display_order', { ascending: true });
      
      if (error) throw error;

      if (level === 2) {
        setLevelOptions(prev => ({ ...prev, level2: data || [] }));
      } else if (level === 3) {
        setLevelOptions(prev => ({ ...prev, level3: data || [] }));
      } else if (level === 4) {
        setLevelOptions(prev => ({ ...prev, level4: data || [] }));
      }
    } catch (error) {
      console.error('Error loading level options:', error);
    }
  };

  // Apply filters and search
  const applyFilters = (categoryList: Category[], query: string, filter: string) => {
    let filtered = [...categoryList];
    
    // Apply search
    if (query) {
      const searchLower = query.toLowerCase();
      const searchInTree = (items: Category[]): Category[] => {
        return items
          .map(item => {
            const matches = 
              item.name.toLowerCase().includes(searchLower) ||
              item.description?.toLowerCase().includes(searchLower) ||
              item.slug.toLowerCase().includes(searchLower);
            
            const children = item.children ? searchInTree(item.children) : [];
            
            if (matches || children.length > 0) {
              return {
                ...item,
                children: children.length > 0 ? children : item.children
              };
            }
            return null;
          })
          .filter(Boolean) as Category[];
      };
      
      filtered = searchInTree(filtered);
    }
    
    // Apply status filter
    if (filter === 'active') {
      filtered = filtered.filter(cat => cat.is_active);
    } else if (filter === 'inactive') {
      filtered = filtered.filter(cat => !cat.is_active);
    } else if (filter === 'featured') {
      filtered = filtered.filter(cat => cat.is_featured);
    }
    
    setFilteredCategories(filtered);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    applyFilters(categories, searchQuery, activeFilter);
  }, [searchQuery, activeFilter, categories]);

  // Handle level selection in form
  const handleLevelSelect = async (level: number, category: Category | null, useCustom: boolean = false) => {
    const categoryName = useCustom ? formData.customInput : (category?.name || '');
    const categoryId = useCustom ? '' : (category?.id || '');

    // Update form data
    if (level === 1) {
      setFormData(prev => ({
        ...prev,
        level1: { name: categoryName, id: categoryId },
        level2: { name: '', id: '' },
        level3: { name: '', id: '' },
        level4: { name: '', id: '' },
        parent_id: null,
        customInput: ''
      }));
      setFormStep(2);
      
      // Load level 2 options if not using custom
      if (!useCustom && categoryId) {
        await loadNextLevelOptions(categoryId, 2);
      }
    } else if (level === 2) {
      const parentId = useCustom ? formData.level1.id : categoryId;
      setFormData(prev => ({
        ...prev,
        level2: { name: categoryName, id: categoryId },
        level3: { name: '', id: '' },
        level4: { name: '', id: '' },
        parent_id: parentId,
        customInput: ''
      }));
      setFormStep(3);
      
      if (!useCustom && categoryId) {
        await loadNextLevelOptions(categoryId, 3);
      }
    } else if (level === 3) {
      const parentId = useCustom ? formData.level2.id : categoryId;
      setFormData(prev => ({
        ...prev,
        level3: { name: categoryName, id: categoryId },
        level4: { name: '', id: '' },
        parent_id: parentId,
        customInput: ''
      }));
      setFormStep(4);
      
      if (!useCustom && categoryId) {
        await loadNextLevelOptions(categoryId, 4);
      }
    } else if (level === 4) {
      const parentId = useCustom ? formData.level3.id : categoryId;
      setFormData(prev => ({
        ...prev,
        level4: { name: categoryName, id: categoryId },
        parent_id: parentId,
        customInput: ''
      }));
    }
  };

  // Handle custom input change
  const handleCustomInputChange = (value: string) => {
    setFormData(prev => ({ ...prev, customInput: value }));
  };

  // Save category (create new or update)
  const handleSaveCategory = async () => {
    try {
      const categoryName = formData.customInput.trim() || 
                          formData.level4.name || 
                          formData.level3.name || 
                          formData.level2.name || 
                          formData.level1.name;
      
      if (!categoryName) {
        alert('Please enter a category name');
        return;
      }

      // Calculate level
      const level = formData.level4.name ? 4 : 
                   formData.level3.name ? 3 : 
                   formData.level2.name ? 2 : 1;

      // Get highest display_order for this parent
      const { data: siblings } = await supabase
        .from('categories')
        .select('display_order')
        .eq('parent_id', formData.parent_id)
        .order('display_order', { descending: true })
        .limit(1);

      const display_order = siblings && siblings.length > 0 ? siblings[0].display_order + 1 : 0;

      // Create slug
      const slug = categoryName.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]/g, '');

      const categoryData = {
        name: categoryName,
        description: formData.description,
        slug,
        icon: formData.icon,
        color: formData.color,
        parent_id: formData.parent_id,
        display_order,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
        product_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Check if editing
      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(categoryData)
          .eq('id', editingCategory.id);
        
        if (error) throw error;
        alert('Category updated successfully!');
      } else {
        const { error } = await supabase
          .from('categories')
          .insert([categoryData]);
        
        if (error) throw error;
        alert('Category created successfully!');
      }

      await loadCategories();
      resetForm();
    } catch (error: any) {
      console.error('Error saving category:', error);
      alert(`Error: ${error.message}`);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      level1: { name: '', id: '' },
      level2: { name: '', id: '' },
      level3: { name: '', id: '' },
      level4: { name: '', id: '' },
      customInput: '',
      description: '',
      icon: 'sofa',
      color: '#3B82F6',
      is_active: true,
      is_featured: false,
      parent_id: null
    });
    setFormStep(1);
    setEditingCategory(null);
    setShowForm(false);
    setLevelOptions({
      level1: [],
      level2: [],
      level3: [],
      level4: []
    });
  };

  // Edit existing category
  const handleEditCategory = (category: Category) => {
    // Load parent chain for editing
    const loadParentChain = async () => {
      try {
        // Get all parents
        let currentId = category.parent_id;
        const parents: Category[] = [];
        
        while (currentId) {
          const { data } = await supabase
            .from('categories')
            .select('*')
            .eq('id', currentId)
            .single();
          
          if (data) {
            parents.unshift(data);
            currentId = data.parent_id;
          } else {
            break;
          }
        }
        
        // Set form data based on level
        const formLevels = {
          level1: parents[0] || { name: '', id: '' },
          level2: parents[1] || { name: '', id: '' },
          level3: parents[2] || { name: '', id: '' },
          level4: category.level === 4 ? category : { name: '', id: '' }
        };
        
        setFormData(prev => ({
          ...prev,
          ...formLevels,
          description: category.description,
          icon: category.icon,
          color: category.color,
          parent_id: category.parent_id,
          is_active: category.is_active,
          is_featured: category.is_featured
        }));
        
        // Load options for each level
        if (parents[0]?.id) await loadNextLevelOptions(parents[0].id, 2);
        if (parents[1]?.id) await loadNextLevelOptions(parents[1].id, 3);
        if (parents[2]?.id) await loadNextLevelOptions(parents[2].id, 4);
        
        setEditingCategory(category);
        setShowForm(true);
        setFormStep(category.level || 1);
      } catch (error) {
        console.error('Error loading parent chain:', error);
      }
    };
    
    loadParentChain();
  };

  // Delete category with child check
  const handleDeleteCategory = async (categoryId: string) => {
    try {
      // Check if category has children
      const { data: children } = await supabase
        .from('categories')
        .select('id')
        .eq('parent_id', categoryId);
      
      if (children && children.length > 0) {
        alert('Cannot delete category with sub-categories. Please delete sub-categories first.');
        setShowDeleteConfirm(null);
        return;
      }

      // Check if category has products
      const { data: products } = await supabase
        .from('products')
        .select('id')
        .eq('category_id', categoryId)
        .limit(1);
      
      if (products && products.length > 0) {
        alert('Cannot delete category with associated products. Please reassign products first.');
        setShowDeleteConfirm(null);
        return;
      }

      // Delete the category
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);
      
      if (error) throw error;
      
      await loadCategories();
      setShowDeleteConfirm(null);
      alert('Category deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting category:', error);
      alert(`Error: ${error.message}`);
    }
  };

  // Toggle category status
  const toggleStatus = async (categoryId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ 
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', categoryId);
      
      if (error) throw error;
      
      await loadCategories();
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  // Move category order
  const moveOrder = async (categoryId: string, direction: 'up' | 'down') => {
    try {
      const category = categories.find(c => c.id === categoryId);
      if (!category) return;

      // Find siblings
      const { data: siblings } = await supabase
        .from('categories')
        .select('*')
        .eq('parent_id', category.parent_id)
        .order('display_order', { ascending: true });
      
      if (!siblings) return;

      const currentIndex = siblings.findIndex(s => s.id === categoryId);
      if (direction === 'up' && currentIndex > 0) {
        // Swap with previous
        const prevCategory = siblings[currentIndex - 1];
        await supabase
          .from('categories')
          .update({ display_order: prevCategory.display_order })
          .eq('id', categoryId);
        await supabase
          .from('categories')
          .update({ display_order: category.display_order })
          .eq('id', prevCategory.id);
      } else if (direction === 'down' && currentIndex < siblings.length - 1) {
        // Swap with next
        const nextCategory = siblings[currentIndex + 1];
        await supabase
          .from('categories')
          .update({ display_order: nextCategory.display_order })
          .eq('id', categoryId);
        await supabase
          .from('categories')
          .update({ display_order: category.display_order })
          .eq('id', nextCategory.id);
      }

      await loadCategories();
    } catch (error) {
      console.error('Error moving category:', error);
    }
  };

  // Toggle expand/collapse
  const toggleExpand = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Render category tree with proper hierarchy
  const renderCategoryTree = (categoryList: Category[], level = 0) => {
    return categoryList.map(category => (
      <div key={category.id}>
        {/* Category Card */}
        <div 
          className={`flex items-center justify-between p-4 mb-2 rounded-xl border transition-all ${
            level === 0 
              ? 'bg-gray-50 border-gray-200' 
              : 'bg-white border-gray-100'
          } ${!category.is_active ? 'opacity-60' : ''}`}
          style={{ marginLeft: `${level * 24}px` }}
        >
          <div className="flex items-center space-x-4">
            {/* Expand/Collapse Button */}
            {category.children && category.children.length > 0 && (
              <button
                onClick={() => toggleExpand(category.id)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <ChevronRight className={`w-4 h-4 transition-transform ${
                  expandedCategories.includes(category.id) ? 'rotate-90' : ''
                }`} />
              </button>
            )}
            
            {/* Level Indicator */}
            <div className="flex flex-col items-center">
              <div 
                className="w-2 h-2 rounded-full mb-1"
                style={{ 
                  backgroundColor: category.level === 1 ? '#3B82F6' :
                                 category.level === 2 ? '#10B981' :
                                 category.level === 3 ? '#8B5CF6' :
                                 '#F59E0B'
                }}
              />
              <span className="text-xs text-gray-500 font-mono">L{category.level}</span>
            </div>
            
            {/* Category Icon and Color */}
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm"
              style={{ backgroundColor: category.color }}
            >
              {availableIcons.find(icon => icon.value === category.icon)?.icon || <Tag className="w-5 h-5 text-white" />}
            </div>
            
            {/* Category Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h4 className="font-semibold text-gray-900 truncate">{category.name}</h4>
                {category.is_featured && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full flex items-center shrink-0">
                    <Star className="w-3 h-3 mr-1" /> Featured
                  </span>
                )}
                {!category.is_active && (
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full shrink-0">Inactive</span>
                )}
                {category.parent_name && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full truncate max-w-[120px]" title={`Parent: ${category.parent_name}`}>
                    ← {category.parent_name}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1 truncate">{category.description || 'No description'}</p>
              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                <span className="truncate">Slug: {category.slug}</span>
                <span>•</span>
                <span>Products: {category.product_count || 0}</span>
                <span>•</span>
                <span>Order: {category.display_order}</span>
                <span>•</span>
                <span>Level: {category.level}</span>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => moveOrder(category.id, 'up')}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              title="Move up"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => moveOrder(category.id, 'down')}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              title="Move down"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                // Toggle featured status
                supabase
                  .from('categories')
                  .update({ 
                    is_featured: !category.is_featured,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', category.id)
                  .then(() => loadCategories());
              }}
              className={`p-2 rounded-lg ${
                category.is_featured 
                  ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              title={category.is_featured ? 'Remove from featured' : 'Mark as featured'}
            >
              <Star className="w-4 h-4" />
            </button>
            <button
              onClick={() => toggleStatus(category.id, category.is_active)}
              className={`p-2 rounded-lg ${
                category.is_active 
                  ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                  : 'bg-red-100 text-red-600 hover:bg-red-200'
              }`}
              title={category.is_active ? 'Deactivate' : 'Activate'}
            >
              {category.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            <button
              onClick={() => handleEditCategory(category)}
              className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(category.id)}
              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Children Categories */}
        {category.children && category.children.length > 0 && expandedCategories.includes(category.id) && (
          <div className="ml-6">
            {renderCategoryTree(category.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  // Render step-by-step form
  const renderFormStep = () => {
    const renderOptions = (options: Category[], level: number) => (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {options.map(option => (
          <button
            key={option.id}
            type="button"
            onClick={() => handleLevelSelect(level, option)}
            className={`p-4 border rounded-xl text-left transition-all ${
              (level === 1 && formData.level1.id === option.id) ||
              (level === 2 && formData.level2.id === option.id) ||
              (level === 3 && formData.level3.id === option.id) ||
              (level === 4 && formData.level4.id === option.id)
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500 ring-opacity-20'
                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: option.color }}
              >
                {availableIcons.find(icon => icon.value === option.icon)?.icon || <Tag className="w-5 h-5 text-white" />}
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{option.name}</h4>
                {option.description && (
                  <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    );

    return (
      <div className="space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-center space-x-4 mb-8">
          {[1, 2, 3, 4].map(step => (
            <div key={step} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                formStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
              }`}>
                {step}
              </div>
              {step < 4 && (
                <div className={`w-16 h-1 ${formStep > step ? 'bg-blue-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Furniture Type */}
        {formStep === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Step 1: Select Furniture Type</h3>
              <p className="text-gray-600 mb-4">Choose the primary furniture type category.</p>
            </div>
            
            {renderOptions(levelOptions.level1, 1)}
            
            {/* Custom Input */}
            <div className="border-t pt-6">
              <h4 className="font-medium text-gray-900 mb-3">Add Missing Furniture Type</h4>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={formData.customInput}
                  onChange={(e) => handleCustomInputChange(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Customized Furniture, Ready-Made Furniture, Other"
                />
                <button
                  type="button"
                  onClick={() => handleLevelSelect(1, null, true)}
                  disabled={!formData.customInput.trim()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add & Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Usage Area */}
        {formStep === 2 && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <button
                  type="button"
                  onClick={() => setFormStep(1)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                </button>
                <h3 className="text-lg font-semibold text-gray-900">Step 2: Select Usage Area</h3>
              </div>
              <p className="text-gray-600 mb-4">Selected: <span className="font-medium">{formData.level1.name}</span></p>
            </div>
            
            {renderOptions(levelOptions.level2, 2)}
            
            {/* Custom Input */}
            <div className="border-t pt-6">
              <h4 className="font-medium text-gray-900 mb-3">Add Missing Usage Area</h4>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={formData.customInput}
                  onChange={(e) => handleCustomInputChange(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Indoor, Outdoor, Both, Other"
                />
                <button
                  type="button"
                  onClick={() => handleLevelSelect(2, null, true)}
                  disabled={!formData.customInput.trim()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add & Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Space/Room */}
        {formStep === 3 && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <button
                  type="button"
                  onClick={() => setFormStep(2)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                </button>
                <h3 className="text-lg font-semibold text-gray-900">Step 3: Select Space/Room</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Path: <span className="font-medium">{formData.level1.name}</span> → <span className="font-medium">{formData.level2.name}</span>
              </p>
            </div>
            
            {renderOptions(levelOptions.level3, 3)}
            
            {/* Custom Input */}
            <div className="border-t pt-6">
              <h4 className="font-medium text-gray-900 mb-3">Add Missing Space/Room</h4>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={formData.customInput}
                  onChange={(e) => handleCustomInputChange(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Bedroom, Living Room, Kitchen, Garden, Other"
                />
                <button
                  type="button"
                  onClick={() => handleLevelSelect(3, null, true)}
                  disabled={!formData.customInput.trim()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add & Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Product Type */}
        {formStep === 4 && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <button
                  type="button"
                  onClick={() => setFormStep(3)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                </button>
                <h3 className="text-lg font-semibold text-gray-900">Step 4: Select Product Type</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Path: <span className="font-medium">{formData.level1.name}</span> → 
                <span className="font-medium"> {formData.level2.name}</span> → 
                <span className="font-medium"> {formData.level3.name}</span>
              </p>
            </div>
            
            {renderOptions(levelOptions.level4, 4)}
            
            {/* Custom Input */}
            <div className="border-t pt-6">
              <h4 className="font-medium text-gray-900 mb-3">Add Missing Product Type</h4>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={formData.customInput}
                  onChange={(e) => handleCustomInputChange(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Bed, Sofa, Cabinet, Table, Other"
                />
                <button
                  type="button"
                  onClick={() => handleLevelSelect(4, null, true)}
                  disabled={!formData.customInput.trim()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Product Type
                </button>
              </div>
            </div>

            {/* Additional Details */}
            <div className="border-t pt-6">
              <h4 className="font-medium text-gray-900 mb-4">Category Details</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Describe this category..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Icon
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {availableIcons.map(icon => (
                        <button
                          key={icon.value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, icon: icon.value }))}
                          className={`p-2 border rounded-lg flex flex-col items-center justify-center ${
                            formData.icon === icon.value
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {icon.icon}
                          <span className="text-xs mt-1">{icon.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Color
                    </label>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-10 h-10 rounded-lg border"
                        style={{ backgroundColor: formData.color }}
                      ></div>
                      <div className="grid grid-cols-4 gap-1">
                        {availableColors.map(color => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, color }))}
                            className={`w-8 h-8 rounded-full border-2 ${
                              formData.color === color ? 'border-gray-800' : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="rounded text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                      className="rounded text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Featured</span>
                  </label>
                </div>
              </div>

              {/* Final Actions */}
              <div className="flex justify-end space-x-3 pt-6">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCategory}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Category Management</h1>
          <p className="text-gray-600 mt-1">Build hierarchical furniture categories (Level 1 → 2 → 3 → 4)</p>
        </div>
        
        <button
          onClick={() => {
            resetForm();
            loadCategories(); // Refresh options
            setShowForm(true);
          }}
          className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Create New Category</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          <div className="text-sm text-gray-600">Active</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
          <div className="text-sm text-gray-600">Inactive</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-2xl font-bold text-yellow-600">{stats.featured}</div>
          <div className="text-sm text-gray-600">Featured</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-2xl font-bold text-blue-600">{stats.level1}</div>
          <div className="text-sm text-gray-600">Level 1</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-2xl font-bold text-green-600">{stats.level2}</div>
          <div className="text-sm text-gray-600">Level 2</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-2xl font-bold text-purple-600">{stats.level3}</div>
          <div className="text-sm text-gray-600">Level 3</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-2xl font-bold text-orange-600">{stats.level4}</div>
          <div className="text-sm text-gray-600">Level 4</div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search categories by name, description, or slug..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64 md:w-80"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value as any)}
              >
                <option value="all">All Categories</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
                <option value="featured">Featured Only</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* View Mode Toggle */}
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('tree')}
                className={`p-2 rounded ${viewMode === 'tree' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                title="Tree View"
              >
                <FolderTree className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>

            {/* Refresh Button */}
            <button
              onClick={loadCategories}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Categories Display */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <FolderTree className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-600 mb-1">No categories found</h3>
            <p className="text-gray-500 text-sm mb-4">
              {searchQuery ? 'Try a different search term' : 'Start by creating your first category'}
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveFilter('all');
                setShowForm(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create First Category
            </button>
          </div>
        ) : viewMode === 'tree' ? (
          <div className="space-y-2">
            {/* Level Legend */}
            <div className="flex items-center space-x-4 mb-4 pb-4 border-b">
              <span className="text-sm font-medium text-gray-700">Level Legend:</span>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-xs text-gray-600">Level 1 (Type)</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-xs text-gray-600">Level 2 (Area)</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span className="text-xs text-gray-600">Level 3 (Room)</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span className="text-xs text-gray-600">Level 4 (Product)</span>
                </div>
              </div>
            </div>
            
            {renderCategoryTree(filteredCategories)}
          </div>
        ) : (
          // Grid View
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(() => {
              const flattenCategories = (items: Category[]): Category[] => {
                return items.flatMap(item => [item, ...(item.children ? flattenCategories(item.children) : [])]);
              };
              return flattenCategories(filteredCategories).map(category => (
                <div key={category.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm"
                        style={{ backgroundColor: category.color }}
                      >
                        {availableIcons.find(icon => icon.value === category.icon)?.icon || <Tag className="w-5 h-5 text-white" />}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold text-gray-900">{category.name}</h4>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            category.level === 1 ? 'bg-blue-100 text-blue-800' :
                            category.level === 2 ? 'bg-green-100 text-green-800' :
                            category.level === 3 ? 'bg-purple-100 text-purple-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                            L{category.level}
                          </span>
                        </div>
                        {category.parent_name && (
                          <p className="text-xs text-gray-500">Parent: {category.parent_name}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      {category.is_featured && <Star className="w-4 h-4 text-yellow-500" />}
                      {category.is_active ? <Eye className="w-4 h-4 text-green-500" /> : <EyeOff className="w-4 h-4 text-red-500" />}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{category.description || 'No description'}</p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <div>
                      <div className="flex items-center mb-1">
                        <Package className="w-3 h-3 mr-1" />
                        <span>{category.product_count || 0} products</span>
                      </div>
                      <div className="text-gray-400">Slug: {category.slug}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">Order: {category.display_order}</div>
                      <div className={`text-xs px-2 py-1 rounded-full mt-1 ${
                        category.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {category.is_active ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditCategory(category)}
                      className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(category.id)}
                      className="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ));
            })()}
          </div>
        )}
      </div>

      {/* Category Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </h3>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {renderFormStep()}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Delete Category</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-4">
              Deleting this category will:
            </p>
            <ul className="text-sm text-gray-600 mb-6 space-y-2">
              <li className="flex items-center">
                <XCircle className="w-4 h-4 text-red-500 mr-2" />
                Remove all sub-categories (if any)
              </li>
              <li className="flex items-center">
                <XCircle className="w-4 h-4 text-red-500 mr-2" />
                Remove product associations
              </li>
              <li className="flex items-center">
                <AlertCircle className="w-4 h-4 text-yellow-500 mr-2" />
                Products without categories may become unorganized
              </li>
            </ul>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteCategory(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;