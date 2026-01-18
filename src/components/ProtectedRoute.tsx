// src/components/ProtectedRoute.tsx
import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'seller' | 'buyer';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  // Check localStorage for authentication
  const checkLocalStorageAuth = () => {
    try {
      const demoMode = localStorage.getItem('demoMode');
      const userRole = localStorage.getItem('userRole');
      const adminToken = localStorage.getItem('admin_token');
      const authToken = localStorage.getItem('supabase.auth.token');
      
      // Check if any authentication exists
      if (demoMode || adminToken || authToken) {
        // For admin routes specifically
        if (requiredRole === 'admin') {
          // Check admin-specific conditions
          const hasAdminToken = adminToken === 'true';
          const hasAdminRole = userRole === 'admin';
          const hasAdminInAuth = authToken ? JSON.parse(authToken).user?.user_metadata?.role === 'admin' : false;
          
          return hasAdminToken || hasAdminRole || hasAdminInAuth;
        }
        
        // For seller routes
        if (requiredRole === 'seller') {
          const hasSellerRole = userRole === 'seller';
          const hasSellerInAuth = authToken ? JSON.parse(authToken).user?.user_metadata?.role === 'seller' : false;
          
          return hasSellerRole || hasSellerInAuth || demoMode === 'seller';
        }
        
        // For buyer routes
        if (requiredRole === 'buyer') {
          const hasBuyerRole = userRole === 'buyer';
          const hasBuyerInAuth = authToken ? JSON.parse(authToken).user?.user_metadata?.role === 'buyer' : false;
          
          return hasBuyerRole || hasBuyerInAuth || demoMode === 'true';
        }
        
        // If no specific role required, any auth is fine
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking localStorage auth:', error);
      return false;
    }
  };

  const isAuthenticated = checkLocalStorageAuth();

  // Not logged in → redirect to home/login page
  if (!isAuthenticated) {
    console.log('❌ ProtectedRoute: Not authenticated, redirecting to home');
    console.log('Required role:', requiredRole);
    console.log('LocalStorage check:', {
      demoMode: localStorage.getItem('demoMode'),
      userRole: localStorage.getItem('userRole'),
      adminToken: localStorage.getItem('admin_token'),
      authToken: localStorage.getItem('supabase.auth.token')
    });
    return <Navigate to="/" replace />;
  }

  console.log('✅ ProtectedRoute: Authenticated, rendering children');
  console.log('Required role:', requiredRole, 'Granted');
  
  // Authorized → render children
  return <>{children}</>;
};

export default ProtectedRoute;