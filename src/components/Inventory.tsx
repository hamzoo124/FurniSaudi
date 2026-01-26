import React, { useState, useEffect } from 'react';
import { 
  Package, 
  AlertTriangle, 
  XCircle, 
  Warehouse, 
  RefreshCw, 
  Search, 
  Filter, 
  Download, 
  Plus, 
  Eye, 
  Edit, 
  Ban, 
  X, 
  Check, 
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  FileText,
  Box,
  Sofa,
  Table,
  Chair,
  Bed,
  Trees,
  Droplets,
  Cpu,
  Wrench,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Layers,
  Home,
  Building,
  Clock,
  Calendar,
  Users
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

// ============================
// TYPES
// ============================

interface InventoryItem {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  product_type: 'ready-made' | 'custom';
  category: 'indoor' | 'outdoor';
  stock_quantity: number;
  reserved_quantity: number;
  min_stock_level: number;
  unit_cost: number;
  total_value: number;
  last_updated: string;
  image_url?: string;
  supplier?: string;
  location?: string;
  status: 'active' | 'inactive' | 'draft';
  selling_price: number;
}

interface MaterialInventory {
  id: string;
  material_name: string;
  material_type: 'wood' | 'fabric' | 'metal' | 'foam' | 'hardware' | 'other';
  available_units: number;
  unit_type: string;
  min_stock_level: number;
  unit_cost: number;
  total_value: number;
  last_updated: string;
  supplier?: string;
  seller_id: string;
}

interface StockUpdateData {
  itemId: string;
  productName: string;
  currentStock: number;
  adjustment: number;
  reason: 'purchase' | 'adjustment' | 'damage' | 'return' | 'production' | 'sale';
  notes?: string;
}

interface FilterState {
  category: 'all' | 'indoor' | 'outdoor';
  productType: 'all' | 'ready-made' | 'custom';
  stockStatus: 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';
  searchQuery: string;
  sortBy: 'name' | 'stock' | 'last-updated' | 'value' | 'price';
  sortOrder: 'asc' | 'desc';
}

// ============================
// MAIN COMPONENT
// ============================

const Inventory: React.FC = () => {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [materials, setMaterials] = useState<MaterialInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [stockUpdateData, setStockUpdateData] = useState<StockUpdateData>({
    itemId: '',
    productName: '',
    currentStock: 0,
    adjustment: 0,
    reason: 'adjustment',
    notes: ''
  });
  
  // Filter State
  const [filters, setFilters] = useState<FilterState>({
    category: 'all',
    productType: 'all',
    stockStatus: 'all',
    searchQuery: '',
    sortBy: 'last-updated',
    sortOrder: 'desc'
  });

  // ============================
  // REAL DATA FETCHING
  // ============================

  useEffect(() => {
    if (user) {
      fetchInventory();
      fetchMaterials();
    }
  }, [user]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      
      // Get seller ID first
      const { data: sellerData } = await supabase
        .from('sellers')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!sellerData) {
        toast.error('Seller profile not found');
        return;
      }

      // Fetch products from database
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', sellerData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform products to inventory items
      const inventoryItems: InventoryItem[] = products.map(product => ({
        id: product.id,
        product_id: product.id,
        product_name: product.name || 'Unnamed Product',
        sku: product.sku || `SKU-${product.id.slice(-6)}`,
        product_type: product.product_type === 'customized' ? 'custom' : 'ready-made',
        category: product.location === 'outdoor' ? 'outdoor' : 'indoor',
        stock_quantity: product.stock_quantity || 0,
        reserved_quantity: product.reserved_quantity || 0,
        min_stock_level: product.min_stock_level || 5,
        unit_cost: product.unit_cost || product.selling_price * 0.6 || 0,
        total_value: (product.stock_quantity || 0) * (product.unit_cost || product.selling_price * 0.6 || 0),
        last_updated: product.updated_at || product.created_at,
        image_url: product.main_image || product.images?.[0],
        supplier: product.supplier || 'Not specified',
        location: product.warehouse_location || 'Main Warehouse',
        status: product.status || 'active',
        selling_price: product.selling_price || 0
      }));

      setInventory(inventoryItems);
    } catch (error: any) {
      console.error('Error fetching inventory:', error);
      toast.error(error.message || 'Failed to load inventory');
    }
  };

  const fetchMaterials = async () => {
    try {
      const { data: sellerData } = await supabase
        .from('sellers')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!sellerData) return;

      // Fetch materials from database
      const { data: materialsData, error } = await supabase
        .from('materials')
        .select('*')
        .eq('seller_id', sellerData.id);

      if (error) throw error;

      if (materialsData && materialsData.length > 0) {
        setMaterials(materialsData.map(material => ({
          ...material,
          total_value: material.available_units * material.unit_cost
        })));
      } else {
        // Create default materials if none exist
        const defaultMaterials: MaterialInventory[] = [
          {
            id: 'mat-001',
            material_name: 'Premium Wood',
            material_type: 'wood',
            available_units: 100,
            unit_type: 'board feet',
            min_stock_level: 30,
            unit_cost: 850,
            total_value: 85000,
            last_updated: new Date().toISOString(),
            supplier: 'Timber Suppliers Ltd.',
            seller_id: sellerData.id
          },
          {
            id: 'mat-002',
            material_name: 'Italian Leather',
            material_type: 'fabric',
            available_units: 50,
            unit_type: 'sq meters',
            min_stock_level: 15,
            unit_cost: 1250,
            total_value: 62500,
            last_updated: new Date().toISOString(),
            supplier: 'Leather Masters',
            seller_id: sellerData.id
          },
          {
            id: 'mat-003',
            material_name: 'Stainless Steel',
            material_type: 'metal',
            available_units: 75,
            unit_type: 'sheets',
            min_stock_level: 25,
            unit_cost: 650,
            total_value: 48750,
            last_updated: new Date().toISOString(),
            supplier: 'Metal Works Co.',
            seller_id: sellerData.id
          }
        ];
        setMaterials(defaultMaterials);
      }
    } catch (error: any) {
      console.error('Error fetching materials:', error);
      toast.error('Failed to load materials');
    } finally {
      setLoading(false);
    }
  };

  // ============================
  // CALCULATIONS & HELPERS
  // ============================

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-SA', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getStockStatus = (quantity: number, minLevel: number): { status: string; color: string; bgColor: string } => {
    if (quantity === 0) {
      return { status: 'Out of Stock', color: 'text-red-600', bgColor: 'bg-red-50' };
    } else if (quantity <= minLevel) {
      return { status: 'Low Stock', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    } else {
      return { status: 'In Stock', color: 'text-green-600', bgColor: 'bg-green-50' };
    }
  };

  const getProductIcon = (category: string, productType: string) => {
    if (productType === 'custom') return <Package className="w-5 h-5" />;
    
    switch(category) {
      case 'indoor': return <Home className="w-5 h-5" />;
      case 'outdoor': return <Building className="w-5 h-5" />;
      default: return <Box className="w-5 h-5" />;
    }
  };

  const getMaterialIcon = (materialType: string) => {
    switch(materialType) {
      case 'wood': return <Trees className="w-5 h-5" />;
      case 'fabric': return <Droplets className="w-5 h-5" />;
      case 'metal': return <Wrench className="w-5 h-5" />;
      case 'foam': return <Box className="w-5 h-5" />;
      case 'hardware': return <Cpu className="w-5 h-5" />;
      default: return <Package className="w-5 h-5" />;
    }
  };

  // ============================
  // STATS CALCULATIONS
  // ============================

  const totalProducts = inventory.length;
  const inStockItems = inventory.filter(item => item.stock_quantity > item.min_stock_level).length;
  const lowStockItems = inventory.filter(item => item.stock_quantity > 0 && item.stock_quantity <= item.min_stock_level).length;
  const outOfStockItems = inventory.filter(item => item.stock_quantity === 0).length;
  
  const readyMadeInventoryValue = inventory
    .filter(item => item.product_type === 'ready-made')
    .reduce((sum, item) => sum + item.total_value, 0);
  
  const materialsInventoryValue = materials
    .reduce((sum, material) => sum + material.total_value, 0);
  
  const totalInventoryValue = readyMadeInventoryValue + materialsInventoryValue;

  // ============================
  // FILTER & SORT LOGIC
  // ============================

  const filteredInventory = React.useMemo(() => {
    let filtered = [...inventory];

    // Apply search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.product_name.toLowerCase().includes(query) ||
        item.sku.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(item => item.category === filters.category);
    }

    // Apply product type filter
    if (filters.productType !== 'all') {
      filtered = filtered.filter(item => item.product_type === filters.productType);
    }

    // Apply stock status filter
    if (filters.stockStatus !== 'all') {
      filtered = filtered.filter(item => {
        const { status } = getStockStatus(item.stock_quantity, item.min_stock_level);
        return status.toLowerCase().replace(' ', '-') === filters.stockStatus;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (filters.sortBy) {
        case 'name':
          aValue = a.product_name;
          bValue = b.product_name;
          break;
        case 'stock':
          aValue = a.stock_quantity;
          bValue = b.stock_quantity;
          break;
        case 'value':
          aValue = a.total_value;
          bValue = b.total_value;
          break;
        case 'price':
          aValue = a.selling_price;
          bValue = b.selling_price;
          break;
        case 'last-updated':
        default:
          aValue = new Date(a.last_updated).getTime();
          bValue = new Date(b.last_updated).getTime();
          break;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return filters.sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return filters.sortOrder === 'asc'
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number);
      }
    });

    return filtered;
  }, [inventory, filters]);

  // ============================
  // PAGINATION
  // ============================

  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredInventory.slice(startIndex, endIndex);

  // ============================
  // HANDLERS
  // ============================

  const handleRefresh = async () => {
    await fetchInventory();
    await fetchMaterials();
    toast.success('Inventory refreshed successfully');
  };

  const handleExportCSV = () => {
    if (filteredInventory.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = [
      'Product Name',
      'SKU',
      'Type',
      'Category',
      'Stock Quantity',
      'Reserved',
      'Available',
      'Status',
      'Unit Cost',
      'Selling Price',
      'Total Value',
      'Last Updated',
      'Location'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredInventory.map(item => [
        `"${item.product_name}"`,
        item.sku,
        item.product_type,
        item.category,
        item.stock_quantity,
        item.reserved_quantity,
        item.stock_quantity - item.reserved_quantity,
        getStockStatus(item.stock_quantity, item.min_stock_level).status,
        formatCurrency(item.unit_cost).replace(/[^\d.-]/g, ''),
        formatCurrency(item.selling_price).replace(/[^\d.-]/g, ''),
        formatCurrency(item.total_value).replace(/[^\d.-]/g, ''),
        new Date(item.last_updated).toISOString(),
        `"${item.location || 'N/A'}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success('Inventory exported successfully');
  };

  const handleStockUpdate = (item: InventoryItem) => {
    setSelectedItem(item);
    setStockUpdateData({
      itemId: item.id,
      productName: item.product_name,
      currentStock: item.stock_quantity,
      adjustment: 0,
      reason: 'adjustment',
      notes: ''
    });
    setShowStockModal(true);
  };

  const handleUpdateSubmit = async () => {
    if (!selectedItem) return;
    
    if (stockUpdateData.currentStock + stockUpdateData.adjustment < 0) {
      toast.error('Stock cannot go negative');
      return;
    }

    try {
      const newStock = stockUpdateData.currentStock + stockUpdateData.adjustment;
      
      // Update in Supabase
      const { error } = await supabase
        .from('products')
        .update({
          stock_quantity: newStock,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedItem.id);

      if (error) throw error;

      // Update local state
      setInventory(prev => prev.map(item => {
        if (item.id === selectedItem.id) {
          const updatedItem = {
            ...item,
            stock_quantity: newStock,
            total_value: newStock * item.unit_cost,
            last_updated: new Date().toISOString()
          };
          return updatedItem;
        }
        return item;
      }));

      // Create stock history record
      await supabase
        .from('stock_history')
        .insert({
          product_id: selectedItem.id,
          previous_stock: stockUpdateData.currentStock,
          new_stock: newStock,
          adjustment: stockUpdateData.adjustment,
          reason: stockUpdateData.reason,
          notes: stockUpdateData.notes,
          created_by: user?.id,
          created_at: new Date().toISOString()
        });

      toast.success('Stock updated successfully');
      setShowStockModal(false);
      setSelectedItem(null);
    } catch (error: any) {
      console.error('Update error:', error);
      toast.error(error.message || 'Failed to update stock');
    }
  };

  const handleDisableProduct = async (itemId: string) => {
    if (!window.confirm('Are you sure you want to disable this product? It will no longer be available for sale.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('products')
        .update({ status: 'inactive' })
        .eq('id', itemId);

      if (error) throw error;

      // Update local state
      setInventory(prev => prev.map(item => 
        item.id === itemId ? { ...item, status: 'inactive' } : item
      ));

      toast.success('Product disabled successfully');
    } catch (error: any) {
      console.error('Disable error:', error);
      toast.error(error.message || 'Failed to disable product');
    }
  };

  // ============================
  // RENDER FUNCTIONS
  // ============================

  const renderStatsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {/* Total Products */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-800">
            {totalProducts}
          </span>
        </div>
        <p className="text-xl font-bold text-gray-900 mb-1">{totalProducts}</p>
        <p className="text-sm font-medium text-gray-700">Total Products</p>
        <p className="text-xs text-gray-500 mt-1">Across all categories</p>
      </div>

      {/* In Stock */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Check className="w-5 h-5 text-green-600" />
          </div>
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-800">
            {inStockItems}
          </span>
        </div>
        <p className="text-xl font-bold text-gray-900 mb-1">{inStockItems}</p>
        <p className="text-sm font-medium text-gray-700">In Stock</p>
        <p className="text-xs text-gray-500 mt-1">Ready for sale</p>
      </div>

      {/* Low Stock */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
          </div>
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
            {lowStockItems}
          </span>
        </div>
        <p className="text-xl font-bold text-gray-900 mb-1">{lowStockItems}</p>
        <p className="text-sm font-medium text-gray-700">Low Stock</p>
        <p className="text-xs text-gray-500 mt-1">Needs restocking</p>
      </div>

      {/* Out of Stock */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-800">
            {outOfStockItems}
          </span>
        </div>
        <p className="text-xl font-bold text-gray-900 mb-1">{outOfStockItems}</p>
        <p className="text-sm font-medium text-gray-700">Out of Stock</p>
        <p className="text-xs text-gray-500 mt-1">Urgent attention needed</p>
      </div>

      {/* Inventory Value */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Warehouse className="w-5 h-5 text-purple-600" />
          </div>
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-100 text-purple-800">
            Total Value
          </span>
        </div>
        <p className="text-xl font-bold text-gray-900 mb-1">{formatCurrency(totalInventoryValue)}</p>
        <p className="text-sm font-medium text-gray-700">Inventory Value</p>
        <p className="text-xs text-gray-500 mt-1">Ready-made + Materials</p>
      </div>
    </div>
  );

  const renderFilters = () => (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by product name or SKU..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.searchQuery}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, searchQuery: e.target.value }));
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {/* Category Filter */}
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={filters.category}
            onChange={(e) => {
              setFilters(prev => ({ ...prev, category: e.target.value as any }));
              setCurrentPage(1);
            }}
          >
            <option value="all">All Categories</option>
            <option value="indoor">Indoor</option>
            <option value="outdoor">Outdoor</option>
          </select>

          {/* Product Type Filter */}
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={filters.productType}
            onChange={(e) => {
              setFilters(prev => ({ ...prev, productType: e.target.value as any }));
              setCurrentPage(1);
            }}
          >
            <option value="all">All Types</option>
            <option value="ready-made">Ready-made</option>
            <option value="custom">Custom</option>
          </select>

          {/* Stock Status Filter */}
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={filters.stockStatus}
            onChange={(e) => {
              setFilters(prev => ({ ...prev, stockStatus: e.target.value as any }));
              setCurrentPage(1);
            }}
          >
            <option value="all">All Stock Status</option>
            <option value="in-stock">In Stock</option>
            <option value="low-stock">Low Stock</option>
            <option value="out-of-stock">Out of Stock</option>
          </select>

          {/* Sort By */}
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={filters.sortBy}
            onChange={(e) => {
              setFilters(prev => ({ ...prev, sortBy: e.target.value as any }));
              setCurrentPage(1);
            }}
          >
            <option value="last-updated">Last Updated</option>
            <option value="name">Product Name</option>
            <option value="stock">Stock Quantity</option>
            <option value="value">Total Value</option>
            <option value="price">Selling Price</option>
          </select>

          {/* Sort Order */}
          <button
            onClick={() => {
              setFilters(prev => ({ ...prev, sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' }));
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {filters.sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {/* Reset Filters */}
          <button
            onClick={() => {
              setFilters({
                category: 'all',
                productType: 'all',
                stockStatus: 'all',
                searchQuery: '',
                sortBy: 'last-updated',
                sortOrder: 'desc'
              });
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );

  const renderInventoryTable = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SKU & Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Value
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Updated
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <RefreshCw className="w-8 h-8 text-gray-300 animate-spin mx-auto mb-3" />
                  <p className="text-gray-500">Loading inventory...</p>
                </td>
              </tr>
            ) : currentItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-1">No inventory items found</h3>
                  <p className="text-gray-500 text-sm">Try adjusting your filters or search query</p>
                </td>
              </tr>
            ) : (
              currentItems.map((item) => {
                const stockStatus = getStockStatus(item.stock_quantity, item.min_stock_level);
                const availableStock = item.stock_quantity - item.reserved_quantity;
                
                return (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    {/* Product Column */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          {item.image_url ? (
                            <img
                              className="h-10 w-10 rounded-lg object-cover"
                              src={item.image_url}
                              alt={item.product_name}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150';
                                (e.target as HTMLImageElement).className = 'h-10 w-10 rounded-lg object-cover bg-gray-200';
                              }}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                              {getProductIcon(item.category, item.product_type)}
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{item.product_name}</div>
                          <div className="text-xs text-gray-500">
                            {item.product_type === 'custom' ? 'Custom Furniture' : 'Ready-made'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* SKU & Type */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-900">{item.sku}</div>
                      <div className="text-xs text-gray-500">
                        {item.product_type === 'ready-made' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            Ready-made
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            Custom
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {item.category === 'indoor' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            Indoor
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Outdoor
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Stock Details */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Stock:</span>
                          <span className="text-sm font-bold text-gray-900">{item.stock_quantity}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Reserved:</span>
                          <span className="text-xs font-medium text-gray-700">{item.reserved_quantity}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Available:</span>
                          <span className={`text-xs font-bold ${
                            availableStock <= 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {availableStock}
                          </span>
                        </div>
                        <div className="mt-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${stockStatus.bgColor} ${stockStatus.color}`}>
                            {stockStatus.status}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Value */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="text-sm font-bold text-gray-900">{formatCurrency(item.total_value)}</div>
                        <div className="text-xs text-gray-500">
                          Sell: {formatCurrency(item.selling_price)}
                        </div>
                      </div>
                    </td>

                    {/* Last Updated */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(item.last_updated)}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleStockUpdate(item)}
                          className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                          title="Update Stock"
                          disabled={item.status === 'inactive'}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => window.open(`/seller/products/${item.product_id}`, '_blank')}
                          className="text-gray-600 hover:text-gray-900 p-1 hover:bg-gray-50 rounded"
                          title="View Product"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {item.status !== 'inactive' && (
                          <button
                            onClick={() => handleDisableProduct(item.id)}
                            className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
                            title="Disable Product"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && filteredInventory.length > itemsPerPage && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
              <span className="font-medium">{Math.min(endIndex, filteredInventory.length)}</span> of{' '}
              <span className="font-medium">{filteredInventory.length}</span> results
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 text-sm rounded ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderMaterialsSection = () => (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Raw Materials Inventory</h2>
        <div className="text-sm text-gray-600">
          Total Value: <span className="font-bold text-gray-900">{formatCurrency(materialsInventoryValue)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {materials.map((material) => {
          const isLowStock = material.available_units <= material.min_stock_level;
          
          return (
            <div key={material.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${isLowStock ? 'bg-yellow-100' : 'bg-gray-100'}`}>
                  {getMaterialIcon(material.material_type)}
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  isLowStock ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                }`}>
                  {isLowStock ? 'Low Stock' : 'Available'}
                </span>
              </div>
              <p className="text-sm font-bold text-gray-900 mb-1">{material.material_name}</p>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Available:</span>
                  <span className={`text-sm font-bold ${
                    isLowStock ? 'text-yellow-600' : 'text-gray-900'
                  }`}>
                    {material.available_units} {material.unit_type}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Min Level:</span>
                  <span className="text-xs font-medium text-gray-700">{material.min_stock_level} {material.unit_type}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Unit Cost:</span>
                  <span className="text-xs font-medium text-gray-700">{formatCurrency(material.unit_cost)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Total Value:</span>
                  <span className="text-xs font-bold text-gray-900">{formatCurrency(material.total_value)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderStockUpdateModal = () => (
    showStockModal && selectedItem && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Update Stock</h3>
              <button
                onClick={() => setShowStockModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-1">Update stock for: {stockUpdateData.productName}</p>
          </div>

          <div className="px-6 py-4 space-y-4">
            {/* Current Stock */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Stock
              </label>
              <div className="text-xl font-bold text-gray-900">
                {stockUpdateData.currentStock} units
              </div>
            </div>

            {/* Adjustment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Adjustment
              </label>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setStockUpdateData(prev => ({
                    ...prev,
                    adjustment: Math.max(prev.adjustment - 1, -prev.currentStock)
                  }))}
                  className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
                >
                  -
                </button>
                <input
                  type="number"
                  value={stockUpdateData.adjustment}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    setStockUpdateData(prev => ({
                      ...prev,
                      adjustment: Math.max(value, -prev.currentStock)
                    }));
                  }}
                  className="flex-1 px-3 py-1 border border-gray-300 rounded text-center"
                />
                <button
                  onClick={() => setStockUpdateData(prev => ({ ...prev, adjustment: prev.adjustment + 1 }))}
                  className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
                >
                  +
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Enter positive number to add stock, negative to remove
              </p>
            </div>

            {/* New Stock Total */}
            <div className={`p-3 rounded-lg ${
              stockUpdateData.currentStock + stockUpdateData.adjustment === 0
                ? 'bg-red-50 border border-red-200'
                : stockUpdateData.currentStock + stockUpdateData.adjustment <= selectedItem.min_stock_level
                ? 'bg-yellow-50 border border-yellow-200'
                : 'bg-green-50 border border-green-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">New Stock Total:</span>
                <span className={`text-lg font-bold ${
                  stockUpdateData.currentStock + stockUpdateData.adjustment === 0
                    ? 'text-red-600'
                    : stockUpdateData.currentStock + stockUpdateData.adjustment <= selectedItem.min_stock_level
                    ? 'text-yellow-600'
                    : 'text-green-600'
                }`}>
                  {stockUpdateData.currentStock + stockUpdateData.adjustment} units
                </span>
              </div>
              {stockUpdateData.currentStock + stockUpdateData.adjustment === 0 && (
                <p className="text-xs text-red-600 mt-1">
                  ⚠️ Product will be marked as Out of Stock
                </p>
              )}
              {stockUpdateData.currentStock + stockUpdateData.adjustment > 0 && 
               stockUpdateData.currentStock + stockUpdateData.adjustment <= selectedItem.min_stock_level && (
                <p className="text-xs text-yellow-600 mt-1">
                  ⚠️ Product will be marked as Low Stock
                </p>
              )}
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Adjustment
              </label>
              <select
                value={stockUpdateData.reason}
                onChange={(e) => setStockUpdateData(prev => ({ ...prev, reason: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="purchase">New Purchase</option>
                <option value="sale">Sale/Order</option>
                <option value="adjustment">Stock Adjustment</option>
                <option value="damage">Damage/Loss</option>
                <option value="return">Customer Return</option>
                <option value="production">Production Use</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                value={stockUpdateData.notes}
                onChange={(e) => setStockUpdateData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add any additional notes..."
              />
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              onClick={() => setShowStockModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateSubmit}
              disabled={stockUpdateData.adjustment === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Update Stock
            </button>
          </div>
        </div>
      </div>
    )
  );

  // ============================
  // MAIN RENDER
  // ============================

  return (
    <div className="min-h-screen  px-3">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
            <p className="text-sm text-gray-600 mt-1">
              Monitor and manage your furniture inventory and raw materials
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 border bg-yellow-400 border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleExportCSV}
              disabled={inventory.length === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-yellow-400 text-black rounded-lg text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500  disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {renderStatsCards()}

      {/* Filters */}
      {renderFilters()}

      {/* Inventory Table */}
      {renderInventoryTable()}

      {/* Materials Section */}
      {materials.length > 0 && renderMaterialsSection()}

      {/* Empty State */}
      {!loading && filteredInventory.length === 0 && filters.searchQuery && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-600 mb-1">No matching items found</h3>
          <p className="text-gray-500 text-sm">
            Try adjusting your search or filters to find what you're looking for
          </p>
        </div>
      )}

      {/* Info Panel */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-blue-900">Inventory Management Tips</h4>
            <ul className="text-xs text-blue-800 mt-1 space-y-1">
              <li>• Low stock items (≤ min level) are marked in yellow and need immediate attention</li>
              <li>• Out of stock items are marked in red and should be restocked or disabled</li>
              <li>• For custom furniture, ensure raw materials are available before accepting orders</li>
              <li>• Update stock immediately after sales, returns, or new purchases</li>
              <li>• Regular inventory counts help prevent discrepancies</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Stock Update Modal */}
      {renderStockUpdateModal()}
    </div>
  );
};

export default Inventory;