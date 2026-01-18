import React, { createContext, useContext, useState, useEffect } from "react";
// import { supabaseAdmin as supabase } from '@/lib/supabase';
import { supabaseAdmin as supabase } from '../lib/supabase';

interface AuthContextType {
  user: any;
  userRole: "buyer" | "seller" | "admin" | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (
    email: string,
    password: string,
    name: string,
    role: string,
    phone?: string,
    city?: string,
    businessName?: string
  ) => Promise<any>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  isLoading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<"buyer" | "seller" | "admin" | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to check localStorage for demo/admin tokens
  const checkLocalStorageAuth = () => {
    try {
      // Check for demo/admin tokens from App.tsx
      const storedToken = localStorage.getItem('supabase.auth.token');
      const demoMode = localStorage.getItem('demoMode');
      const storedRole = localStorage.getItem('userRole');
      const adminToken = localStorage.getItem('admin_token');
      
      // If demo mode is active
      if (demoMode === 'true' && storedRole) {
        const mockUser = {
          id: storedRole === 'buyer' ? 'demo-buyer-id-456' : 
               storedRole === 'seller' ? 'demo-seller-id-123' : 
               'demo-admin-id-789',
          email: storedRole === 'buyer' ? 'demo@buyer.com' : 
                 storedRole === 'seller' ? 'seller@example.com' : 
                 'admin@example.com',
          user_metadata: {
            full_name: storedRole === 'buyer' ? 'Demo Buyer' : 
                       storedRole === 'seller' ? 'Demo Furniture Store' : 
                       'Admin User',
            role: storedRole
          }
        };
        
        setUser(mockUser);
        setUserRole(storedRole as any);
        setIsLoading(false);
        return true;
      }
      
      // If admin token is set
      if (adminToken === 'true') {
        const adminUser = {
          id: 'admin-id-123',
          email: 'admin@premiumfurniture.com',
          user_metadata: {
            full_name: 'Admin User',
            role: 'admin'
          }
        };
        
        setUser(adminUser);
        setUserRole('admin');
        setIsLoading(false);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking localStorage auth:', error);
      return false;
    }
  };

  // Load session on start
  useEffect(() => {
    const loadSession = async () => {
      setIsLoading(true);
      
      // First check localStorage for demo/admin auth
      const hasLocalAuth = checkLocalStorageAuth();
      if (hasLocalAuth) {
        return;
      }

      // If no localStorage auth, check Supabase
      try {
        const { data } = await supabase.auth.getSession();

        if (data.session?.user) {
          setUser(data.session.user);

          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", data.session.user.id)
            .single();

          if (profile?.role) {
            setUserRole(profile.role as any);
            // Store role in localStorage for consistency
            localStorage.setItem('userRole', profile.role);
          }
        }
      } catch (error) {
        console.error('Error loading session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();

    // Listen for login/logout changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      if (session?.user) {
        setUser(session.user);

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        const role = profile?.role || null;
        setUserRole(role as any);
        
        if (role) {
          localStorage.setItem('userRole', role);
        }
      } else {
        setUser(null);
        setUserRole(null);
        localStorage.removeItem('userRole');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign-in function
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return { error: error.message };

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    setUser(data.user);
    setUserRole(profile?.role || null);
    
    if (profile?.role) {
      localStorage.setItem('userRole', profile.role);
    }

    return { error: null };
  };

  // Sign-up function
  const signUp = async (
    email: string,
    password: string,
    name: string,
    role: string,
    phone?: string,
    city?: string,
    businessName?: string
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error || !data.user) return { error: error?.message || "Signup failed" };

    // Insert into profiles table
    await supabase.from("profiles").insert({
      id: data.user.id,
      name,
      role,
      phone,
      city,
      business_name: businessName,
      email,
    });

    setUser(data.user);
    setUserRole(role as any);
    localStorage.setItem('userRole', role);

    return { error: null };
  };

  // Sign-out function
  const signOut = async () => {
    // Clear localStorage auth data
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('demoMode');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('userRole');
    
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    setUser(null);
    setUserRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userRole,
        isLoading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};