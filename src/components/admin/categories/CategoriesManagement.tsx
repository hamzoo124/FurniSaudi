// src/components/admin/categories/CategoriesManagement.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  FolderTree,
  Grid,
  List,
  Download,
  RefreshCw,
  AlertCircle,
  Check,
  X,
  Eye,
  MoreVertical,
  ArrowUp,
  ArrowDown,
  Folder,
  Tag,
  Layers,
  Home
} from 'lucide-react';
import CategoryForm from './CategoryForm';

// Assume this interface exists in your codebase
interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  is_featured: boolean;
  is_active: boolean;
  display_order: number;
  icon: string;
  color: string;
  category_type?: string;
  usage_type?: string;
  custom_attributes?: Record<string, any>;
  created_at: string;
  updated_at: string;
  children?: Category[];
  products_count?: number;
}

interface CategoriesManagementProps {
  onNavigate?: (page: string) => void;
  onBack?: () => void;
}

const CategoriesManagement: React.FC<CategoriesManagementProps> = ({ onNavigate, onBack }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive' | 'featured'>('all');
  
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  
  // Load categories from localStorage (or API in real implementation)
  const loadCategories = useCallback(() => {
    setLoading(true);
    try {
      // In a real app, this would be an API call
      // For now, use localStorage or mock data
      const storedCategories = localStorage.getItem('furniture_categories');
      
      if (storedCategories) {
        const parsedCategories: Category[] = JSON.parse(storedCategories);
        setCategories(parsedCategories);
        setFilteredCategories(parsedCategories);
      } else {
        // Sample data
        const sampleCategories: Category[] = [
          {
            id: '1',
            name: 'Sofas & Couches',
            slug: 'sofas-couches',
            description: 'Modern and traditional sofas for your living room',
            parent_id: null,
            is_featured: true,
            is_active: true,
            display_order: 1,
            icon: 'sofa',
            color: '#3B82F6',
            category_type: 'ready_made',
            usage_type: 'indoor',
            created_at: '2024-01-15T10:30:00Z',
            updated_at: '2024-01-15T10:30:00Z',
            products_count: 24
          },
          {
            id: '2',
            name: 'Dining Tables',
            slug: 'dining-tables',
            description: 'Elegant dining tables for family gatherings',
            parent_id: null,
            is_featured: true,
            is_active: true,
            display_order: 2,
            icon: 'table',
            color: '#10B981',
            category_type: 'customized',
            usage_type: 'indoor',
            created_at: '2024-01-16T11:45:00Z',
            updated_at: '2024-01-16T11:45:00Z',
            products_count: 18
          },
          {
            id: '3',
            name: 'Office Chairs',
            slug: 'office-chairs',
            description: 'Ergonomic chairs for home and office',
            parent_id: null,
            is_featured: false,
            is_active: true,
            display_order: 3,
            icon: 'chair',
            color: '#8B5CF6',
            category_type: 'ready_made',
            usage_type: 'indoor',
            created_at: '2024-01-17T09:15:00Z',
            updated_at: '2024-01-17T09:15:00Z',
            products_count: 32
          },
          {
            id: '4',
            name: 'Bedroom Sets',
            slug: 'bedroom-sets',
            description: 'Complete bedroom furniture sets',
            parent_id: null,
            is_featured: true,
            is_active: true,
            display_order: 4,
            icon: 'bed',
            color: '#F59E0B',
            category_type: 'customized',
            usage_type: 'indoor',
            created_at: '2024-01-18T14:20:00Z',
            updated_at: '2024-01-18T14:20:00Z',
            products_count: 15
          },
          {
            id: '5',
            name: 'Outdoor Furniture',
            slug: 'outdoor-furniture',
            description: 'Weather-resistant furniture for outdoor spaces',
            parent_id: null,
            is_featured: false,
            is_active: true,
            display_order: 5,
            icon: 'sun',
            color: '#EF4444',
            category_type: 'ready_made',
            usage_type: 'outdoor',
            created_at: '2024-01-19T16:10:00Z',
            updated_at: '2024-01-19T16:10:00Z',
            products_count: 12
          }
        ];
        
        setCategories(sampleCategories);
        setFilteredCategories(sampleCategories);
        localStorage.setItem('furniture_categories', JSON.stringify(sampleCategories));
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to load categories');
      console.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter categories based on search and filters
  useEffect(() => {
    let result = [...categories];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(cat => 
        cat.name.toLowerCase().includes(query) ||
        cat.description?.toLowerCase().includes(query) ||
        cat.slug.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (activeFilter === 'active') {
      result = result.filter(cat => cat.is_active);
    } else if (activeFilter === 'inactive') {
      result = result.filter(cat => !cat.is_active);
    } else if (activeFilter === 'featured') {
      result = result.filter(cat => cat.is_featured);
    }
    
    setFilteredCategories(result);
  }, [categories, searchQuery, activeFilter]);

  // Initial load
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Handle category form submission
  const handleCategorySubmit = (formData: any) => {
    const now = new Date().toISOString();
    
    if (editingCategory) {
      // Update existing category
      const updatedCategories = categories.map(cat =>
        cat.id === editingCategory.id
          ? {
              ...cat,
              ...formData,
              updated_at: now,
              slug: formData.name.toLowerCase().replace(/\s+/g, '-')
            }
          : cat
      );
      setCategories(updatedCategories);
      localStorage.setItem('furniture_categories', JSON.stringify(updatedCategories));
    } else {
      // Create new category
      const newCategory: Category = {
        id: `cat_${Date.now()}`,
        slug: formData.name.toLowerCase().replace(/\s+/g, '-'),
        created_at: now,
        updated_at: now,
        products_count: 0,
        children: [],
        ...formData
      };
      
      const updatedCategories = [...categories, newCategory];
      setCategories(updatedCategories);
      localStorage.setItem('furniture_categories', JSON.stringify(updatedCategories));
    }
    
    setShowForm(false);
    setEditingCategory(null);
    loadCategories();
  };

  // Handle delete category
  const handleDeleteCategory = () => {
    if (!categoryToDelete) return;
    
    // Check if category has products
    if (categoryToDelete.products_count && categoryToDelete.products_count > 0) {
      alert(`Cannot delete category "${categoryToDelete.name}" because it contains ${categoryToDelete.products_count} products.`);
      setShowDeleteModal(false);
      setCategoryToDelete(null);
      return;
    }
    
    const updatedCategories = categories.filter(cat => cat.id !== categoryToDelete.id);
    setCategories(updatedCategories);
    localStorage.setItem('furniture_categories', JSON.stringify(updatedCategories));
    
    setShowDeleteModal(false);
    setCategoryToDelete(null);
    loadCategories();
  };

  // Toggle category expansion
  const toggleExpand = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Move category up/down in display order
  const moveCategory = (categoryId: string, direction: 'up' | 'down') => {
    const categoryIndex = categories.findIndex(cat => cat.id === categoryId);
    if (categoryIndex === -1) return;
    
    const newIndex = direction === 'up' ? categoryIndex - 1 : categoryIndex + 1;
    
    if (newIndex >= 0 && newIndex < categories.length) {
      const updatedCategories = [...categories];
      const [movedCategory] = updatedCategories.splice(categoryIndex, 1);
      updatedCategories.splice(newIndex, 0, movedCategory);
      
      // Update display_order
      updatedCategories.forEach((cat, index) => {
        cat.display_order = index + 1;
      });
      
      setCategories(updatedCategories);
      localStorage.setItem('furniture_categories', JSON.stringify(updatedCategories));
      loadCategories();
    }
  };

  // Stats
  const stats = {
    total: categories.length,
    active: categories.filter(cat => cat.is_active).length,
    featured: categories.filter(cat => cat.is_featured).length,
    inactive: categories.filter(cat => !cat.is_active).length,
    ready_made: categories.filter(cat => cat.category_type === 'ready_made').length,
    customized: categories.filter(cat => cat.category_type === 'customized').length
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Render category card (grid view)
  const renderCategoryCard = (category: Category) => (
    <div key={category.id} className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: category.color, color: 'white' }}
          >
            <FolderTree className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900">{category.name}</h3>
            <p className="text-sm text-gray-600">{category.slug}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {category.is_featured && (
            <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full">Featured</span>
          )}
          <span className={`px-2 py-1 text-xs rounded-full ${category.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
            {category.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
      
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{category.description || 'No description'}</p>
      
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2 bg-gray-50 rounded border border-gray-200">
          <div className="font-bold text-gray-900">{category.products_count || 0}</div>
          <div className="text-xs text-gray-600">Products</div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded border border-gray-200">
          <div className="font-bold text-gray-900">{category.category_type || 'N/A'}</div>
          <div className="text-xs text-gray-600">Type</div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded border border-gray-200">
          <div className="font-bold text-gray-900">{category.display_order}</div>
          <div className="text-xs text-gray-600">Order</div>
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          Updated: {formatDate(category.updated_at)}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => moveCategory(category.id, 'up')}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            title="Move up"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => moveCategory(category.id, 'down')}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            title="Move down"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setEditingCategory(category);
              setShowForm(true);
            }}
            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setCategoryToDelete(category);
              setShowDeleteModal(true);
            }}
            className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  // Render category row (list view)
  const renderCategoryRow = (category: Category) => (
    <tr key={category.id} className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center space-x-3">
          <div 
            className="w-8 h-8 rounded flex items-center justify-center"
            style={{ backgroundColor: category.color, color: 'white' }}
          >
            <FolderTree className="w-4 h-4" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{category.name}</div>
            <div className="text-sm text-gray-500">{category.slug}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{category.description || '—'}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{category.category_type || 'N/A'}</div>
        <div className="text-xs text-gray-500">{category.usage_type || 'N/A'}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 py-1 text-xs rounded-full ${category.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          {category.is_active ? 'Active' : 'Inactive'}
        </span>
        {category.is_featured && (
          <span className="ml-1 px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full">Featured</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {category.products_count || 0}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {category.display_order}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => moveCategory(category.id, 'up')}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            title="Move up"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => moveCategory(category.id, 'down')}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            title="Move down"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setEditingCategory(category);
              setShowForm(true);
            }}
            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setCategoryToDelete(category);
              setShowDeleteModal(true);
            }}
            className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Categories Management</h1>
                <p className="text-gray-600">
                  Organize and manage product categories with custom attributes
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => loadCategories()}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800"
              >
                <Plus className="w-4 h-4" />
                <span>Add Category</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Categories</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FolderTree className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <Check className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Featured</p>
                <p className="text-2xl font-bold text-amber-600">{stats.featured}</p>
              </div>
              <Tag className="w-8 h-8 text-amber-500" />
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ready Made</p>
                <p className="text-2xl font-bold text-purple-600">{stats.ready_made}</p>
              </div>
              <Layers className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Customized</p>
                <p className="text-2xl font-bold text-indigo-600">{stats.customized}</p>
              </div>
              <Home className="w-8 h-8 text-indigo-500" />
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inactive</p>
                <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
              </div>
              <X className="w-8 h-8 text-gray-500" />
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search categories by name, description, or slug..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={activeFilter}
                  onChange={(e) => setActiveFilter(e.target.value as any)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Categories</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                  <option value="featured">Featured Only</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-1 border border-gray-300 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
              
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              Showing {filteredCategories.length} of {categories.length} categories
            </div>
            <div className="flex items-center space-x-2">
              <span>Sort by:</span>
              <select className="border-none bg-transparent text-gray-900 font-medium">
                <option>Display Order</option>
                <option>Name A-Z</option>
                <option>Newest First</option>
                <option>Product Count</option>
              </select>
            </div>
          </div>
        </div>

        {/* Categories Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading categories...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Error Loading Categories</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <button
              onClick={loadCategories}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <FolderTree className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No categories found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery ? 'Try changing your search terms' : 'Get started by creating your first category'}
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800"
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Add Category
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map(renderCategoryCard)}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Products
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCategories.map(renderCategoryRow)}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Category Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingCategory ? 'Edit Category' : 'Create New Category'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setEditingCategory(null);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <CategoryForm
                  initialData={editingCategory || undefined}
                  onSubmit={handleCategorySubmit}
                  isLoading={loading}
                />
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && categoryToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Delete Category</h3>
                </div>
                
                <p className="text-gray-600 mb-4">
                  Are you sure you want to delete the category <strong>"{categoryToDelete.name}"</strong>?
                  {categoryToDelete.products_count && categoryToDelete.products_count > 0 && (
                    <span className="block mt-2 text-red-600">
                      ⚠️ This category contains {categoryToDelete.products_count} products. 
                      Deleting it will also remove these products.
                    </span>
                  )}
                </p>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setCategoryToDelete(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteCategory}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Delete Category
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4 mb-2 md:mb-0">
              <span>© {new Date().getFullYear()} Furniture Marketplace</span>
              <span className="text-gray-400 hidden md:inline">•</span>
              <span className="hidden md:inline">Categories Management System</span>
            </div>
            <div className="flex items-center space-x-4">
              <span>{stats.total} categories</span>
              <span className="text-gray-400">•</span>
              <span>{stats.active} active</span>
              <span className="text-gray-400">•</span>
              <span>Updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CategoriesManagement;