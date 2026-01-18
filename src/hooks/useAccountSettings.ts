// src/hooks/useAccountSettings.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';

// ==================== TYPE DEFINITIONS ====================

export interface AccountSettings {
  id: string;
  seller_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  business_name?: string;
  business_phone?: string;
  business_address?: string;
  vat_number?: string | null;
  profile_image_url?: string | null;
  language: 'en' | 'ar';
  currency: 'SAR' | 'USD' | 'EUR';
  timezone: string;
  notifications_enabled: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
  marketing_emails: boolean;
  two_factor_enabled: boolean;
  two_factor_method: 'app' | 'sms' | 'email' | null;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateAccountData {
  full_name?: string;
  phone?: string;
  business_name?: string;
  business_phone?: string;
  business_address?: string;
  language?: 'en' | 'ar';
  currency?: 'SAR' | 'USD' | 'EUR';
  timezone?: string;
  notifications_enabled?: boolean;
  email_notifications?: boolean;
  sms_notifications?: boolean;
  push_notifications?: boolean;
  marketing_emails?: boolean;
}

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface TwoFactorSetup {
  secret: string;
  qr_code_url: string;
  backup_codes: string[];
}

export interface TwoFactorVerify {
  code: string;
  backup_code?: string;
}

export interface SecurityLog {
  id: string;
  user_id: string;
  action: string;
  ip_address?: string;
  user_agent?: string;
  location?: string;
  created_at: string;
}

// ==================== UTILITY FUNCTIONS ====================

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone: string): boolean => {
  // Saudi Arabia phone number validation (supports +966 and 05)
  const saPhoneRegex = /^(?:\+966|0)?5[0-9]{8}$/;
  return saPhoneRegex.test(phone.replace(/\s+/g, ''));
};

const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

const getCurrentTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

// ==================== MAIN ACCOUNT SETTINGS HOOK ====================

export const useAccountSettings = () => {
  const [accountSettings, setAccountSettings] = useState<AccountSettings | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);

  // Fetch current user and account settings
  const fetchAccountData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Get current authenticated user
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      if (!currentUser) throw new Error('No authenticated user found');

      setUser(currentUser);

      // Fetch seller profile
      const { data: sellerData, error: sellerError } = await supabase
        .from('sellers')
        .select(`
          *,
          profiles (
            full_name,
            email,
            phone,
            avatar_url
          )
        `)
        .eq('user_id', currentUser.id)
        .single();

      if (sellerError) {
        console.warn('Seller profile not found, creating default settings');
        // Create default settings if not exists
        const defaultSettings = createDefaultSettings(currentUser.id);
        setAccountSettings(defaultSettings);
        return;
      }

      // Fetch user settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('seller_id', sellerData.id)
        .single();

      // Combine seller data with settings
      const combinedData: AccountSettings = {
        id: sellerData.id,
        seller_id: sellerData.id,
        full_name: sellerData.profiles?.full_name || currentUser.email?.split('@')[0] || 'Seller',
        email: sellerData.profiles?.email || currentUser.email || '',
        phone: sellerData.profiles?.phone || null,
        business_name: sellerData.business_name,
        business_phone: sellerData.business_phone,
        business_address: sellerData.business_address,
        vat_number: sellerData.vat_number,
        profile_image_url: sellerData.profiles?.avatar_url,
        language: settingsData?.language || 'en',
        currency: (settingsData?.currency as 'SAR' | 'USD' | 'EUR') || 'SAR',
        timezone: settingsData?.timezone || getCurrentTimezone(),
        notifications_enabled: settingsData?.notifications_enabled ?? true,
        email_notifications: settingsData?.email_notifications ?? true,
        sms_notifications: settingsData?.sms_notifications ?? true,
        push_notifications: settingsData?.push_notifications ?? true,
        marketing_emails: settingsData?.marketing_emails ?? false,
        two_factor_enabled: settingsData?.two_factor_enabled ?? false,
        two_factor_method: settingsData?.two_factor_method as 'app' | 'sms' | 'email',
        last_login_at: sellerData.last_login_at,
        created_at: sellerData.created_at,
        updated_at: settingsData?.updated_at || sellerData.updated_at
      };

      setAccountSettings(combinedData);

      // Fetch security logs
      fetchSecurityLogs(sellerData.id);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load account settings');
      console.error('Error fetching account data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch security logs
  const fetchSecurityLogs = async (sellerId: string) => {
    try {
      const { data, error } = await supabase
        .from('security_logs')
        .select('*')
        .eq('user_id', sellerId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setSecurityLogs(data || []);
    } catch (err) {
      console.error('Error fetching security logs:', err);
    }
  };

  // Update account settings
  const updateAccountSettings = async (updates: UpdateAccountData) => {
    setLoading(true);
    setError(null);

    try {
      if (!user || !accountSettings) {
        throw new Error('User not authenticated');
      }

      // Validate phone if provided
      if (updates.phone && !validatePhone(updates.phone)) {
        throw new Error('Invalid Saudi Arabia phone number format');
      }

      // Get current seller data
      const { data: sellerData, error: sellerError } = await supabase
        .from('sellers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (sellerError) throw sellerError;

      // Optimistic update
      const optimisticUpdate: AccountSettings = {
        ...accountSettings,
        ...updates,
        updated_at: new Date().toISOString()
      };
      setAccountSettings(optimisticUpdate);

      // Prepare updates for different tables
      const profileUpdates: any = {};
      const sellerUpdates: any = {};
      const settingsUpdates: any = {};

      // Categorize updates
      Object.entries(updates).forEach(([key, value]) => {
        if (['full_name', 'phone'].includes(key)) {
          profileUpdates[key] = value;
        } else if (['business_name', 'business_phone', 'business_address'].includes(key)) {
          sellerUpdates[key] = value;
        } else {
          settingsUpdates[key] = value;
        }
      });

      // Execute updates in parallel
      const updatePromises = [];

      // Update profile
      if (Object.keys(profileUpdates).length > 0) {
        updatePromises.push(
          supabase
            .from('profiles')
            .update(profileUpdates)
            .eq('id', user.id)
        );
      }

      // Update seller info
      if (Object.keys(sellerUpdates).length > 0) {
        updatePromises.push(
          supabase
            .from('sellers')
            .update(sellerUpdates)
            .eq('user_id', user.id)
        );
      }

      // Update user settings
      if (Object.keys(settingsUpdates).length > 0) {
        // Check if settings exist
        const { data: existingSettings } = await supabase
          .from('user_settings')
          .select('id')
          .eq('seller_id', sellerData.id)
          .single();

        if (existingSettings) {
          updatePromises.push(
            supabase
              .from('user_settings')
              .update({
                ...settingsUpdates,
                updated_at: new Date().toISOString()
              })
              .eq('seller_id', sellerData.id)
          );
        } else {
          updatePromises.push(
            supabase
              .from('user_settings')
              .insert({
                seller_id: sellerData.id,
                ...settingsUpdates,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
          );
        }
      }

      const results = await Promise.all(updatePromises);
      
      // Check for errors
      const hasError = results.some(result => result.error);
      if (hasError) {
        throw new Error('Failed to update some settings');
      }

      // Log security action
      await logSecurityAction('UPDATE_ACCOUNT_SETTINGS', sellerData.id);

      // Refresh data to ensure consistency
      await fetchAccountData();

      return { success: true };
    } catch (err) {
      // Revert optimistic update on error
      await fetchAccountData();
      
      setError(err instanceof Error ? err.message : 'Failed to update account settings');
      return { success: false, error: err instanceof Error ? err.message : 'Update failed' };
    } finally {
      setLoading(false);
    }
  };

  // Change password
  const changePassword = async (passwordData: ChangePasswordData) => {
    setLoading(true);
    setError(null);

    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Validate new password
      const passwordValidation = validatePassword(passwordData.new_password);
      if (!passwordValidation.valid) {
        throw new Error(passwordValidation.errors[0]);
      }

      // Check if passwords match
      if (passwordData.new_password !== passwordData.confirm_password) {
        throw new Error('New passwords do not match');
      }

      // Update password using Supabase auth
      const { error } = await supabase.auth.updateUser({
        password: passwordData.new_password
      });

      if (error) {
        // If it's an auth error, try to re-authenticate first
        if (error.message.includes('reauthenticate')) {
          throw new Error('Please re-authenticate before changing password');
        }
        throw error;
      }

      // Log security action
      if (accountSettings) {
        await logSecurityAction('CHANGE_PASSWORD', accountSettings.seller_id);
      }

      return { success: true };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
      return { success: false, error: err instanceof Error ? err.message : 'Password change failed' };
    } finally {
      setLoading(false);
    }
  };

  // Log security actions
  const logSecurityAction = async (action: string, sellerId: string) => {
    try {
      // Get IP and location info (simplified - in production, use a proper service)
      const response = await fetch('https://api.ipify.org?format=json');
      const ipData = await response.json();
      const ipAddress = ipData.ip;

      await supabase
        .from('security_logs')
        .insert({
          user_id: sellerId,
          action,
          ip_address: ipAddress,
          user_agent: navigator.userAgent,
          created_at: new Date().toISOString()
        });

      // Refresh security logs
      fetchSecurityLogs(sellerId);
    } catch (err) {
      console.error('Error logging security action:', err);
    }
  };

  // Initialize
  useEffect(() => {
    fetchAccountData();
  }, [fetchAccountData]);

  return {
    // Data
    accountSettings,
    user,
    securityLogs,
    
    // State
    loading,
    error,
    
    // Actions
    fetchAccountData,
    updateAccountSettings,
    changePassword,
    logSecurityAction,
    
    // Helpers
    validatePhone,
    validatePassword
  };
};

// ==================== TWO-FACTOR AUTHENTICATION HOOK ====================

export const useTwoFactorAuth = () => {
  const [twoFactorSetup, setTwoFactorSetup] = useState<TwoFactorSetup | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Generate 2FA secret and QR code
  const generateTwoFactorSecret = async (sellerId: string, method: 'app' | 'sms' | 'email') => {
    setLoading(true);
    setError(null);

    try {
      // In a real implementation, you would:
      // 1. Generate a secret using a library like speakeasy
      // 2. Create QR code for authenticator apps
      // 3. Generate backup codes
      
      // For demo purposes, we'll simulate the response
      const mockSetup: TwoFactorSetup = {
        secret: 'JBSWY3DPEHPK3PXP', // Base32 encoded secret
        qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/SellerApp:${sellerId}?secret=JBSWY3DPEHPK3PXP&issuer=FurnitureMarketplace`,
        backup_codes: [
          'ABCD-1234',
          'EFGH-5678',
          'IJKL-9012',
          'MNOP-3456',
          'QRST-7890'
        ]
      };

      setTwoFactorSetup(mockSetup);

      // Store the secret temporarily (in production, this should be stored securely)
      sessionStorage.setItem(`2fa_secret_${sellerId}`, mockSetup.secret);
      sessionStorage.setItem(`2fa_backup_codes_${sellerId}`, JSON.stringify(mockSetup.backup_codes));

      return { success: true, data: mockSetup };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate 2FA secret');
      return { success: false, error: err instanceof Error ? err.message : 'Generation failed' };
    } finally {
      setLoading(false);
    }
  };

  // Verify 2FA code and enable
  const verifyAndEnableTwoFactor = async (sellerId: string, verification: TwoFactorVerify) => {
    setLoading(true);
    setError(null);

    try {
      const secret = sessionStorage.getItem(`2fa_secret_${sellerId}`);
      if (!secret) {
        throw new Error('2FA setup not found. Please generate a new setup.');
      }

      // In a real implementation, verify the TOTP code
      // const isValid = speakeasy.totp.verify({
      //   secret: secret,
      //   encoding: 'base32',
      //   token: verification.code
      // });

      // For demo, accept any 6-digit code
      const isValid = /^\d{6}$/.test(verification.code);

      if (!isValid) {
        throw new Error('Invalid verification code');
      }

      // Update user settings in database
      const { error: updateError } = await supabase
        .from('user_settings')
        .update({
          two_factor_enabled: true,
          two_factor_method: 'app',
          updated_at: new Date().toISOString()
        })
        .eq('seller_id', sellerId);

      if (updateError) throw updateError;

      // Clear temporary storage
      sessionStorage.removeItem(`2fa_secret_${sellerId}`);
      sessionStorage.removeItem(`2fa_backup_codes_${sellerId}`);

      return { success: true };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enable 2FA');
      return { success: false, error: err instanceof Error ? err.message : 'Enable failed' };
    } finally {
      setLoading(false);
    }
  };

  // Disable 2FA
  const disableTwoFactor = async (sellerId: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      // Verify password first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: '', // Will be populated by current session
        password: password
      });

      if (signInError) {
        throw new Error('Invalid password');
      }

      // Update user settings
      const { error: updateError } = await supabase
        .from('user_settings')
        .update({
          two_factor_enabled: false,
          two_factor_method: null,
          updated_at: new Date().toISOString()
        })
        .eq('seller_id', sellerId);

      if (updateError) throw updateError;

      return { success: true };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disable 2FA');
      return { success: false, error: err instanceof Error ? err.message : 'Disable failed' };
    } finally {
      setLoading(false);
    }
  };

  // Verify backup code
  const verifyBackupCode = async (sellerId: string, backupCode: string) => {
    try {
      const storedCodes = sessionStorage.getItem(`2fa_backup_codes_${sellerId}`);
      if (!storedCodes) {
        throw new Error('No backup codes found');
      }

      const backupCodes: string[] = JSON.parse(storedCodes);
      const isValid = backupCodes.includes(backupCode);

      if (isValid) {
        // Remove used backup code
        const updatedCodes = backupCodes.filter(code => code !== backupCode);
        sessionStorage.setItem(`2fa_backup_codes_${sellerId}`, JSON.stringify(updatedCodes));
        
        return { success: true };
      } else {
        throw new Error('Invalid backup code');
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Invalid backup code' };
    }
  };

  return {
    // Data
    twoFactorSetup,
    
    // State
    loading,
    error,
    
    // Actions
    generateTwoFactorSecret,
    verifyAndEnableTwoFactor,
    disableTwoFactor,
    verifyBackupCode
  };
};

// ==================== INDIVIDUAL HOOKS ====================

export const useProfileUpdate = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const updateProfile = async (sellerId: string, updates: UpdateAccountData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Validate inputs
      if (updates.email && !validateEmail(updates.email)) {
        throw new Error('Invalid email address');
      }

      if (updates.phone && !validatePhone(updates.phone)) {
        throw new Error('Invalid phone number');
      }

      // Update user email if changed
      if (updates.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: updates.email
        });

        if (emailError) {
          // Handle email verification required
          if (emailError.message.includes('email_change')) {
            throw new Error('Email verification required. Please check your new email.');
          }
          throw emailError;
        }
      }

      // Update profile in database
      const { error: profileError } = await supabase
        .from('sellers')
        .update(updates)
        .eq('id', sellerId);

      if (profileError) throw profileError;

      setSuccess(true);
      return { success: true };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      return { success: false, error: err instanceof Error ? err.message : 'Update failed' };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    success,
    updateProfile
  };
};

export const usePasswordChange = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const changePassword = async (passwordData: ChangePasswordData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Validate password strength
      const passwordValidation = validatePassword(passwordData.new_password);
      if (!passwordValidation.valid) {
        throw new Error(passwordValidation.errors[0]);
      }

      // Verify passwords match
      if (passwordData.new_password !== passwordData.confirm_password) {
        throw new Error('New passwords do not match');
      }

      // Re-authenticate before password change (security best practice)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: passwordData.current_password
      });

      if (signInError) {
        throw new Error('Current password is incorrect');
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.new_password
      });

      if (updateError) throw updateError;

      setSuccess(true);
      return { success: true };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
      return { success: false, error: err instanceof Error ? err.message : 'Password change failed' };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    success,
    changePassword
  };
};

export const useNotificationSettings = (sellerId: string) => {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('seller_id', sellerId)
          .single();

        if (error) throw error;
        setSettings(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load notification settings');
        console.error('Error fetching notification settings:', err);
      } finally {
        setLoading(false);
      }
    };

    if (sellerId) {
      fetchSettings();
    }
  }, [sellerId]);

  const updateNotificationSettings = async (updates: any) => {
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('user_settings')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('seller_id', sellerId);

      if (error) throw error;

      // Optimistic update
      setSettings((prev: any) => ({
        ...prev,
        ...updates,
        updated_at: new Date().toISOString()
      }));

      return { success: true };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update notification settings');
      return { success: false, error: err instanceof Error ? err.message : 'Update failed' };
    } finally {
      setLoading(false);
    }
  };

  return {
    settings,
    loading,
    error,
    updateNotificationSettings
  };
};

// ==================== HELPER FUNCTIONS ====================

const createDefaultSettings = (userId: string): AccountSettings => {
  const now = new Date().toISOString();
  
  return {
    id: userId,
    seller_id: userId,
    full_name: 'Seller',
    email: '',
    phone: null,
    business_name: '',
    business_phone: '',
    business_address: '',
    vat_number: null,
    profile_image_url: null,
    language: 'en',
    currency: 'SAR',
    timezone: getCurrentTimezone(),
    notifications_enabled: true,
    email_notifications: true,
    sms_notifications: true,
    push_notifications: true,
    marketing_emails: false,
    two_factor_enabled: false,
    two_factor_method: null,
    created_at: now,
    updated_at: now
  };
};

// ==================== MOCK DATA FOR DEVELOPMENT ====================

export const getMockAccountSettings = (sellerId: string): AccountSettings => ({
  id: sellerId,
  seller_id: sellerId,
  full_name: 'Ahmed Al-Mansoor',
  email: 'ahmed@premiumfurniture.sa',
  phone: '+966551234567',
  business_name: 'Premium Furniture Store',
  business_phone: '+966112345678',
  business_address: '123 King Fahd Road, Riyadh, Saudi Arabia',
  vat_number: 'VAT123456789',
  profile_image_url: 'https://randomuser.me/api/portraits/men/32.jpg',
  language: 'en',
  currency: 'SAR',
  timezone: 'Asia/Riyadh',
  notifications_enabled: true,
  email_notifications: true,
  sms_notifications: true,
  push_notifications: true,
  marketing_emails: false,
  two_factor_enabled: false,
  two_factor_method: null,
  last_login_at: new Date().toISOString(),
  created_at: '2024-01-15T10:30:00Z',
  updated_at: new Date().toISOString()
});

export const getMockSecurityLogs = (sellerId: string): SecurityLog[] => [
  {
    id: '1',
    user_id: sellerId,
    action: 'LOGIN_SUCCESS',
    ip_address: '197.45.203.123',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    location: 'Riyadh, Saudi Arabia',
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    user_id: sellerId,
    action: 'PASSWORD_CHANGED',
    ip_address: '197.45.203.123',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    location: 'Riyadh, Saudi Arabia',
    created_at: new Date(Date.now() - 86400000).toISOString() // 1 day ago
  },
  {
    id: '3',
    user_id: sellerId,
    action: 'PROFILE_UPDATED',
    ip_address: '197.45.203.123',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    location: 'Riyadh, Saudi Arabia',
    created_at: new Date(Date.now() - 172800000).toISOString() // 2 days ago
  },
  {
    id: '4',
    user_id: sellerId,
    action: 'LOGIN_ATTEMPT_FAILED',
    ip_address: '102.165.43.78',
    user_agent: 'PostmanRuntime/7.29.2',
    location: 'Unknown',
    created_at: new Date(Date.now() - 259200000).toISOString() // 3 days ago
  }
];

// ==================== DATABASE SCHEMA HELPERS ====================

/*
-- SQL for required tables (run in Supabase SQL editor)

1. user_settings table:

CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES sellers(id) ON DELETE CASCADE,
  language VARCHAR(2) DEFAULT 'en',
  currency VARCHAR(3) DEFAULT 'SAR',
  timezone VARCHAR(50) DEFAULT 'Asia/Riyadh',
  notifications_enabled BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT false,
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_method VARCHAR(10) CHECK (two_factor_method IN ('app', 'sms', 'email')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(seller_id)
);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_settings_updated_at 
  BEFORE UPDATE ON user_settings 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

2. security_logs table:

CREATE TABLE IF NOT EXISTS security_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action VARCHAR(100) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  location VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX idx_security_logs_created_at ON security_logs(created_at DESC);

3. sellers table (extended):

-- If sellers table doesn't have these columns, add them:
ALTER TABLE sellers 
ADD COLUMN IF NOT EXISTS business_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS business_address TEXT,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;

4. profiles table (extended):

-- If profiles table doesn't have these columns, add them:
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

5. Create function to log security actions:

CREATE OR REPLACE FUNCTION log_security_action(
  p_user_id UUID,
  p_action VARCHAR(100),
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_location VARCHAR(255) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO security_logs (
    user_id,
    action,
    ip_address,
    user_agent,
    location
  ) VALUES (
    p_user_id,
    p_action,
    p_ip_address,
    p_user_agent,
    p_location
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql;
*/

export default useAccountSettings;