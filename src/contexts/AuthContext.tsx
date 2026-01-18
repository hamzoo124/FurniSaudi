import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { supabase } from '../lib/supabase';

export interface User {
  id: string;
  email: string;
  name: string;
  role: "buyer" | "seller" | "admin";
  status: string;
  phone?: string;
  avatar?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error?: string }>;
  signUp: (
    email: string,
    password: string,
    name: string,
    role: "buyer" | "seller",
    phone?: string,
    city?: string,
    businessName?: string
  ) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Auth listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching user profile for ID:', userId);
      
      // First try to get user from profiles table
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      // If no profile, try users table (legacy)
      if (profileError || !profileData) {
        console.log('No profile found, checking users table...');
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("id", userId)
          .single();

        if (userError || !userData) {
          console.error("Error fetching user profile:", profileError || userError);
          
          // Create minimal user object from auth data
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (authUser) {
            const minimalUser: User = {
              id: authUser.id,
              email: authUser.email || '',
              name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
              role: 'seller', // Default to seller for demo
              status: 'active',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            setUser(minimalUser);
            console.log('Created minimal user:', minimalUser);
          }
          return;
        }

        console.log('Found user in users table:', userData);
        setUser(userData as User);
      } else {
        console.log('Found user in profiles table:', profileData);
        
        // Transform profile to user format
        const userFromProfile: User = {
          id: profileData.id,
          email: profileData.email || '',
          name: profileData.full_name || profileData.email?.split('@')[0] || 'User',
          role: profileData.role || 'buyer',
          status: profileData.status || 'active',
          phone: profileData.phone,
          avatar: profileData.avatar_url,
          created_at: profileData.created_at || new Date().toISOString(),
          updated_at: profileData.updated_at || new Date().toISOString()
        };
        
        setUser(userFromProfile);
      }
    } catch (err) {
      console.error("Error in fetchUserProfile:", err);
      // Create fallback user for demo
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const fallbackUser: User = {
          id: authUser.id,
          email: authUser.email || '',
          name: authUser.user_metadata?.name || 'Demo User',
          role: 'seller', // Default to seller
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setUser(fallbackUser);
      }
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('SignIn response:',data);
      if (error) return { error: error.message };

      if (data.user) {
        await fetchUserProfile(data.user.id);
      }

      return {};
    } catch (err) {
      return { error: "An error occurred during sign in" };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
    role: "buyer" | "seller",
    phone?: string,
    city?: string,
    businessName?: string
  ) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role
          }
        }
      });
      console.log('Auth signUp response:', authData, authError);

      if (authError) return { error: authError.message };
      if (!authData.user) return { error: "Failed to create user" };

      // Insert into profiles table (new structure)
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .insert([
          {
            id: authData.user.id,
            email,
            full_name: name,
            role,
            status: role === "seller" ? "pending" : "active",
            phone: phone || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
        ])
        .select()
        .single();

        console.log('Profile insert response:', profileData);
      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Try users table as fallback
        const { data: userData, error: userError } = await supabase
          .from("users")
          .insert([
            {
              id: authData.user.id,
              email,
              name,
              role,
              status: role === "seller" ? "pending" : "active",
              phone: phone || null,
            },
          ])
          .select()
          .single();

        if (userError) {
          await supabase.auth.admin.deleteUser(authData.user.id);
          return { error: userError.message };
        }
        
        setUser(userData as User);
      } else {
        // Set user from profile
        const userFromProfile: User = {
          id: profileData.id,
          email: profileData.email,
          name: profileData.full_name,
          role: profileData.role,
          status: profileData.status,
          phone: profileData.phone,
          created_at: profileData.created_at,
          updated_at: profileData.updated_at
        };
        setUser(userFromProfile);
      }

      // Create seller profile if seller
      if (role === "seller" && businessName) {
        try {
          await supabase.from("sellers").insert([
            {
              user_id: authData.user.id,
              business_name: businessName,
              contact_email: email,
              contact_number: phone || "",
              city: city || "",
              approval_status: "pending",
            },
          ]);
        } catch (sellerErr) {
          console.error("Error creating seller profile:", sellerErr);
        }
      }

      return {};
    } catch (err) {
      console.error('Signup error:', err);
      return { error: "An error occurred during sign up" };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) console.error("Error signing out:", error);
      setUser(null);
    } catch (err) {
      console.error("Error in signOut:", err);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};