// src/utils/pagination.ts

// ============================================
// TYPES & INTERFACES
// ============================================

export interface PaginationState<T> {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  startIndex: number;
  endIndex: number;
}

export interface PaginatedData<T> extends PaginationState<T> {
  data: T[];
  allData: T[];
}

export interface PaginationControls {
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  goToFirst: () => void;
  goToLast: () => void;
  setItemsPerPage: (items: number) => void;
  reset: () => void;
}

export interface UsePaginationReturn<T> extends PaginatedData<T>, PaginationControls {
  isFirstPage: boolean;
  isLastPage: boolean;
  pageNumbers: number[];
  visiblePageNumbers: number[];
}

export interface PaginationOptions {
  itemsPerPage?: number;
  initialPage?: number;
  maxVisiblePages?: number;
  keepDataOnPageChange?: boolean;
}

export interface ApiPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiPaginationParams {
  page: number;
  limit: number;
  offset?: number;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Calculate total pages based on total items and items per page
 */
export function calculateTotalPages(
  totalItems: number,
  itemsPerPage: number
): number {
  if (itemsPerPage <= 0) {
    console.warn('itemsPerPage must be greater than 0. Defaulting to 1.');
    itemsPerPage = 1;
  }
  
  if (totalItems <= 0) return 0;
  
  return Math.ceil(totalItems / itemsPerPage);
}

/**
 * Get paginated data from an array
 */
export function getPaginatedData<T>(
  data: T[],
  page: number,
  limit: number
): T[] {
  if (!Array.isArray(data)) {
    console.error('getPaginatedData: data must be an array');
    return [];
  }
  
  if (page < 1) {
    console.warn('Page number must be at least 1. Defaulting to page 1.');
    page = 1;
  }
  
  if (limit <= 0) {
    console.warn('Limit must be greater than 0. Defaulting to 10.');
    limit = 10;
  }
  
  const totalItems = data.length;
  const totalPages = calculateTotalPages(totalItems, limit);
  
  // Ensure page is within valid range
  const validPage = Math.max(1, Math.min(page, totalPages || 1));
  
  const startIndex = (validPage - 1) * limit;
  const endIndex = Math.min(startIndex + limit, totalItems);
  
  return data.slice(startIndex, endIndex);
}

/**
 * Calculate pagination metadata
 */
export function calculatePaginationState<T>(
  data: T[],
  page: number,
  limit: number
): PaginationState<T> {
  const totalItems = data.length;
  const totalPages = calculateTotalPages(totalItems, limit);
  const validPage = Math.max(1, Math.min(page, totalPages || 1));
  const startIndex = (validPage - 1) * limit;
  const endIndex = Math.min(startIndex + limit, totalItems);
  
  return {
    currentPage: validPage,
    totalPages,
    itemsPerPage: limit,
    totalItems,
    hasNextPage: validPage < totalPages,
    hasPrevPage: validPage > 1,
    startIndex,
    endIndex
  };
}

/**
 * Generate an array of page numbers for display
 */
export function generatePageNumbers(
  currentPage: number,
  totalPages: number,
  maxVisiblePages: number = 7
): number[] {
  if (totalPages <= 1) return [1];
  
  // Ensure maxVisiblePages is odd for symmetric display
  const visiblePages = Math.min(maxVisiblePages, totalPages);
  
  let startPage: number;
  let endPage: number;
  
  if (totalPages <= visiblePages) {
    // Show all pages
    startPage = 1;
    endPage = totalPages;
  } else {
    // Calculate start and end pages
    const maxPagesBeforeCurrent = Math.floor(visiblePages / 2);
    const maxPagesAfterCurrent = Math.ceil(visiblePages / 2) - 1;
    
    if (currentPage <= maxPagesBeforeCurrent) {
      // Near the beginning
      startPage = 1;
      endPage = visiblePages;
    } else if (currentPage + maxPagesAfterCurrent >= totalPages) {
      // Near the end
      startPage = totalPages - visiblePages + 1;
      endPage = totalPages;
    } else {
      // Somewhere in the middle
      startPage = currentPage - maxPagesBeforeCurrent;
      endPage = currentPage + maxPagesAfterCurrent;
    }
  }
  
  // Generate array of page numbers
  return Array.from(
    { length: endPage - startPage + 1 },
    (_, i) => startPage + i
  );
}

/**
 * Calculate offset for database queries
 */
export function calculateOffset(page: number, limit: number): number {
  return (Math.max(1, page) - 1) * limit;
}

/**
 * Get pagination parameters for API requests
 */
export function getApiPaginationParams(
  page: number,
  limit: number
): ApiPaginationParams {
  return {
    page: Math.max(1, page),
    limit: Math.max(1, limit),
    offset: calculateOffset(page, limit)
  };
}

/**
 * Format API pagination metadata for consistent response structure
 */
export function formatApiPaginationMeta(
  totalItems: number,
  page: number,
  limit: number
): ApiPaginationMeta {
  const totalPages = calculateTotalPages(totalItems, limit);
  const validPage = Math.max(1, Math.min(page, totalPages || 1));
  
  return {
    total: totalItems,
    page: validPage,
    limit,
    totalPages,
    hasNextPage: validPage < totalPages,
    hasPrevPage: validPage > 1
  };
}

/**
 * Validate pagination parameters
 */
export function validatePaginationParams(
  page: number,
  limit: number,
  maxLimit: number = 100
): { page: number; limit: number; isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validate page
  let validPage = page;
  if (!Number.isInteger(page) || page < 1) {
    errors.push(`Page must be a positive integer. Got: ${page}`);
    validPage = 1;
  }
  
  // Validate limit
  let validLimit = limit;
  if (!Number.isInteger(limit) || limit < 1) {
    errors.push(`Limit must be a positive integer. Got: ${limit}`);
    validLimit = 10;
  } else if (limit > maxLimit) {
    errors.push(`Limit cannot exceed ${maxLimit}. Got: ${limit}`);
    validLimit = Math.min(limit, maxLimit);
  }
  
  return {
    page: validPage,
    limit: validLimit,
    isValid: errors.length === 0,
    errors
  };
}

// ============================================
// REACT HOOKS
// ============================================

import { useState, useEffect, useMemo, useCallback } from 'react';

/**
 * Custom hook for client-side pagination
 */
export function usePagination<T>(
  data: T[],
  options: PaginationOptions = {}
): UsePaginationReturn<T> {
  const {
    itemsPerPage: initialItemsPerPage = 10,
    initialPage = 1,
    maxVisiblePages = 7,
    keepDataOnPageChange = true
  } = options;
  
  // State
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);
  const [cachedData, setCachedData] = useState<T[]>(data);
  
  // Update cached data when source data changes
  useEffect(() => {
    if (keepDataOnPageChange || currentPage === 1) {
      setCachedData(data);
    }
  }, [data, keepDataOnPageChange, currentPage]);
  
  // Calculate pagination state
  const paginationState = useMemo(() => {
    return calculatePaginationState(cachedData, currentPage, itemsPerPage);
  }, [cachedData, currentPage, itemsPerPage]);
  
  // Get paginated data
  const paginatedData = useMemo(() => {
    return getPaginatedData(cachedData, currentPage, itemsPerPage);
  }, [cachedData, currentPage, itemsPerPage]);
  
  // Generate page numbers for UI
  const pageNumbers = useMemo(() => {
    return generatePageNumbers(currentPage, paginationState.totalPages, maxVisiblePages);
  }, [currentPage, paginationState.totalPages, maxVisiblePages]);
  
  // Calculate visible page numbers (for ellipsis display)
  const visiblePageNumbers = useMemo(() => {
    const allNumbers = Array.from(
      { length: paginationState.totalPages },
      (_, i) => i + 1
    );
    
    if (paginationState.totalPages <= maxVisiblePages) {
      return allNumbers;
    }
    
    return generatePageNumbers(currentPage, paginationState.totalPages, maxVisiblePages);
  }, [currentPage, paginationState.totalPages, maxVisiblePages]);
  
  // Navigation controls
  const goToPage = useCallback((page: number) => {
    const validPage = Math.max(1, Math.min(page, paginationState.totalPages || 1));
    setCurrentPage(validPage);
  }, [paginationState.totalPages]);
  
  const nextPage = useCallback(() => {
    if (paginationState.hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  }, [paginationState.hasNextPage]);
  
  const prevPage = useCallback(() => {
    if (paginationState.hasPrevPage) {
      setCurrentPage(prev => prev - 1);
    }
  }, [paginationState.hasPrevPage]);
  
  const goToFirst = useCallback(() => {
    setCurrentPage(1);
  }, []);
  
  const goToLast = useCallback(() => {
    setCurrentPage(paginationState.totalPages || 1);
  }, [paginationState.totalPages]);
  
  const setItemsPerPage = useCallback((items: number) => {
    const validItems = Math.max(1, items);
    setItemsPerPage(validItems);
    // Reset to first page when changing items per page
    setCurrentPage(1);
  }, []);
  
  const reset = useCallback(() => {
    setCurrentPage(initialPage);
    setItemsPerPage(initialItemsPerPage);
  }, [initialPage, initialItemsPerPage]);
  
  // Reset pagination when data changes significantly
  useEffect(() => {
    if (data.length !== cachedData.length) {
      setCurrentPage(1);
    }
  }, [data.length, cachedData.length]);
  
  return {
    // Data
    data: paginatedData,
    allData: cachedData,
    
    // Pagination state
    ...paginationState,
    
    // UI helpers
    isFirstPage: currentPage === 1,
    isLastPage: currentPage === (paginationState.totalPages || 1),
    pageNumbers,
    visiblePageNumbers,
    
    // Controls
    goToPage,
    nextPage,
    prevPage,
    goToFirst,
    goToLast,
    setItemsPerPage,
    reset
  };
}

/**
 * Hook for server-side pagination with API calls
 */
export function useApiPagination<T>(
  initialData: T[] = [],
  initialTotalItems: number = 0,
  options: PaginationOptions & {
    onPageChange?: (page: number, limit: number) => Promise<void>;
  } = {}
) {
  const {
    itemsPerPage: initialItemsPerPage = 10,
    initialPage = 1,
    maxVisiblePages = 7,
    onPageChange
  } = options;
  
  // State
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);
  const [data, setData] = useState<T[]>(initialData);
  const [totalItems, setTotalItems] = useState(initialTotalItems);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Calculate derived values
  const totalPages = useMemo(() => {
    return calculateTotalPages(totalItems, itemsPerPage);
  }, [totalItems, itemsPerPage]);
  
  const paginationState = useMemo((): PaginationState<T> => {
    const startIndex = calculateOffset(currentPage, itemsPerPage);
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    
    return {
      currentPage,
      totalPages,
      itemsPerPage,
      totalItems,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
      startIndex,
      endIndex
    };
  }, [currentPage, totalPages, itemsPerPage, totalItems]);
  
  const pageNumbers = useMemo(() => {
    return generatePageNumbers(currentPage, totalPages, maxVisiblePages);
  }, [currentPage, totalPages, maxVisiblePages]);
  
  // Navigation with API call
  const goToPage = useCallback(async (page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages || 1));
    
    if (validPage === currentPage) return;
    
    setCurrentPage(validPage);
    
    if (onPageChange) {
      setIsLoading(true);
      setError(null);
      
      try {
        await onPageChange(validPage, itemsPerPage);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch page');
        // Revert to previous page on error
        setCurrentPage(currentPage);
      } finally {
        setIsLoading(false);
      }
    }
  }, [currentPage, totalPages, itemsPerPage, onPageChange]);
  
  const nextPage = useCallback(async () => {
    if (paginationState.hasNextPage) {
      await goToPage(currentPage + 1);
    }
  }, [currentPage, paginationState.hasNextPage, goToPage]);
  
  const prevPage = useCallback(async () => {
    if (paginationState.hasPrevPage) {
      await goToPage(currentPage - 1);
    }
  }, [currentPage, paginationState.hasPrevPage, goToPage]);
  
  const goToFirst = useCallback(async () => {
    await goToPage(1);
  }, [goToPage]);
  
  const goToLast = useCallback(async () => {
    await goToPage(totalPages || 1);
  }, [goToPage, totalPages]);
  
  const handleSetItemsPerPage = useCallback(async (items: number) => {
    const validItems = Math.max(1, items);
    setItemsPerPage(validItems);
    
    // Reset to first page and trigger API call
    if (onPageChange) {
      setIsLoading(true);
      try {
        await onPageChange(1, validItems);
        setCurrentPage(1);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    } else {
      setCurrentPage(1);
    }
  }, [onPageChange]);
  
  const reset = useCallback(() => {
    setCurrentPage(initialPage);
    setItemsPerPage(initialItemsPerPage);
    setData(initialData);
    setTotalItems(initialTotalItems);
    setError(null);
  }, [initialPage, initialItemsPerPage, initialData, initialTotalItems]);
  
  return {
    // Data
    data,
    setData,
    totalItems,
    setTotalItems,
    
    // Pagination state
    ...paginationState,
    
    // UI state
    isLoading,
    error,
    setError,
    
    // UI helpers
    pageNumbers,
    isFirstPage: currentPage === 1,
    isLastPage: currentPage === (totalPages || 1),
    
    // Controls
    goToPage,
    nextPage,
    prevPage,
    goToFirst,
    goToLast,
    setItemsPerPage: handleSetItemsPerPage,
    reset,
    
    // For debugging
    offset: calculateOffset(currentPage, itemsPerPage)
  };
}

/**
 * Hook for infinite scroll pagination
 */
export function useInfinitePagination<T>(
  initialData: T[] = [],
  fetchMore: (page: number, limit: number) => Promise<{ data: T[]; hasMore: boolean }>,
  options: {
    initialPage?: number;
    itemsPerPage?: number;
    threshold?: number; // pixels from bottom to trigger fetch
  } = {}
) {
  const {
    initialPage = 1,
    itemsPerPage = 20,
    threshold = 100
  } = options;
  
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [data, setData] = useState<T[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const nextPage = currentPage + 1;
      const result = await fetchMore(nextPage, itemsPerPage);
      
      setData(prev => [...prev, ...result.data]);
      setCurrentPage(nextPage);
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more data');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, fetchMore, isLoading, hasMore]);
  
  // Set up scroll listener for infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - threshold
      ) {
        loadMore();
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMore, threshold]);
  
  const reset = useCallback(() => {
    setCurrentPage(initialPage);
    setData(initialData);
    setHasMore(true);
    setError(null);
    setIsLoading(false);
  }, [initialPage, initialData]);
  
  return {
    data,
    isLoading,
    error,
    hasMore,
    currentPage,
    loadMore,
    reset,
    setData
  };
}

// ============================================
// EXAMPLE USAGE
// ============================================

/*
// Example 1: Basic client-side pagination
function ProductsTable({ products }: { products: Product[] }) {
  const {
    data: paginatedProducts,
    currentPage,
    totalPages,
    itemsPerPage,
    nextPage,
    prevPage,
    goToPage,
    setItemsPerPage
  } = usePagination(products, {
    itemsPerPage: 10,
    initialPage: 1
  });
  
  return (
    <div>
      <table>
        {paginatedProducts.map(product => (
          <ProductRow key={product.id} product={product} />
        ))}
      </table>
      
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onNext={nextPage}
        onPrev={prevPage}
        onPageChange={goToPage}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={setItemsPerPage}
      />
    </div>
  );
}

// Example 2: Server-side pagination with API
function OrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  
  const fetchOrders = useCallback(async (page: number, limit: number) => {
    const response = await api.getOrders({ page, limit });
    setOrders(response.orders);
    setTotalOrders(response.total);
  }, []);
  
  const {
    data,
    currentPage,
    totalPages,
    isLoading,
    nextPage,
    prevPage
  } = useApiPagination(orders, totalOrders, {
    itemsPerPage: 20,
    onPageChange: fetchOrders
  });
  
  return (
    <div>
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          {data.map(order => (
            <OrderCard key={order.id} order={order} />
          ))}
          
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onNext={nextPage}
            onPrev={prevPage}
            disabled={isLoading}
          />
        </>
      )}
    </div>
  );
}

// Example 3: Using utility functions directly
function DashboardStats({ transactions }: { transactions: Transaction[] }) {
  const [page, setPage] = useState(1);
  const limit = 15;
  
  const paginatedTransactions = getPaginatedData(transactions, page, limit);
  const totalPages = calculateTotalPages(transactions.length, limit);
  
  const handlePageChange = (newPage: number) => {
    const validPage = Math.max(1, Math.min(newPage, totalPages));
    setPage(validPage);
  };
  
  return (
    <div>
      {paginatedTransactions.map(transaction => (
        <TransactionItem key={transaction.id} transaction={transaction} />
      ))}
      
      <div>
        <button 
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 1}
        >
          Previous
        </button>
        
        <span>Page {page} of {totalPages}</span>
        
        <button 
          onClick={() => handlePageChange(page + 1)}
          disabled={page === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}

// Example 4: Infinite scroll
function ProductsFeed() {
  const fetchProducts = useCallback(async (page: number, limit: number) => {
    const response = await api.getProducts({ page, limit });
    return {
      data: response.products,
      hasMore: response.hasMore
    };
  }, []);
  
  const {
    data: products,
    isLoading,
    hasMore,
    error
  } = useInfinitePagination([], fetchProducts, {
    itemsPerPage: 20
  });
  
  return (
    <div>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
      
      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}
      {!hasMore && <p>No more products to load</p>}
    </div>
  );
}
*/

// ============================================
// EXPORT ALL UTILITIES
// ============================================

export {
  calculateTotalPages,
  getPaginatedData,
  calculatePaginationState,
  generatePageNumbers,
  calculateOffset,
  getApiPaginationParams,
  formatApiPaginationMeta,
  validatePaginationParams,
  usePagination,
  useApiPagination,
  useInfinitePagination
};