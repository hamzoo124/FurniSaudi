// src/api/accountSettings.ts

import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface AccountSettings {
  id: string;
  seller_id: string;
  business_name: string;
  business_email: string;
  business_phone: string;
  vat_number: string | null;
  business_address: string | null;
  business_license_number: string | null;
  business_registration_date: string | null;
  
  // Contact Information
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  
  // Security Settings
  two_factor_enabled: boolean;
  two_factor_method: 'sms' | 'email' | 'authenticator' | null;
  last_password_change: string | null;
  failed_login_attempts: number;
  account_locked_until: string | null;
  
  // Notification Preferences
  notification_preferences: {
    email_notifications: boolean;
    sms_notifications: boolean;
    push_notifications: boolean;
    
    // Specific notification types
    new_order_alerts: boolean;
    low_stock_alerts: boolean;
    customer_review_alerts: boolean;
    payment_received_alerts: boolean;
    refund_request_alerts: boolean;
    marketing_emails: boolean;
    system_updates: boolean;
  };
  
  // Privacy Settings
  privacy_settings: {
    show_contact_info: boolean;
    show_sales_stats: boolean;
    allow_messages: boolean;
    data_sharing_consent: boolean;
    marketing_consent: boolean;
  };
  
  // Communication Settings
  communication_settings: {
    auto_responder_enabled: boolean;
    auto_responder_message: string | null;
    response_time_target: number; // hours
    business_hours: {
      start: string;
      end: string;
      timezone: string;
    };
  };
  
  // Billing & Payment Settings
  billing_settings: {
    payout_method: 'bank_transfer' | 'paypal' | 'stripe' | null;
    payout_frequency: 'daily' | 'weekly' | 'monthly';
    payout_threshold: number; // Minimum amount for payout
    tax_identification_number: string | null;
    invoice_auto_generate: boolean;
  };
  
  // Account Status
  account_status: 'active' | 'suspended' | 'pending_verification' | 'restricted';
  verification_status: 'verified' | 'pending' | 'unverified';
  seller_tier: 'basic' | 'premium' | 'enterprise';
  
  // Timestamps
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
  last_activity_at: string | null;
}

export interface AccountSettingsInput {
  // Business Information
  business_name?: string;
  business_phone?: string;
  business_address?: string | null;
  vat_number?: string | null;
  
  // Contact Information
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  
  // Notification Preferences
  notification_preferences?: {
    email_notifications?: boolean;
    sms_notifications?: boolean;
    push_notifications?: boolean;
    new_order_alerts?: boolean;
    low_stock_alerts?: boolean;
    customer_review_alerts?: boolean;
    payment_received_alerts?: boolean;
    refund_request_alerts?: boolean;
    marketing_emails?: boolean;
    system_updates?: boolean;
  };
  
  // Privacy Settings
  privacy_settings?: {
    show_contact_info?: boolean;
    show_sales_stats?: boolean;
    allow_messages?: boolean;
    data_sharing_consent?: boolean;
    marketing_consent?: boolean;
  };
  
  // Communication Settings
  communication_settings?: {
    auto_responder_enabled?: boolean;
    auto_responder_message?: string | null;
    response_time_target?: number;
    business_hours?: {
      start: string;
      end: string;
      timezone: string;
    };
  };
  
  // Billing Settings
  billing_settings?: {
    payout_method?: 'bank_transfer' | 'paypal' | 'stripe' | null;
    payout_frequency?: 'daily' | 'weekly' | 'monthly';
    payout_threshold?: number;
    tax_identification_number?: string | null;
    invoice_auto_generate?: boolean;
  };
}

export interface TwoFactorSetup {
  secret: string;
  qr_code_url: string;
  backup_codes: string[];
  verified: boolean;
}

export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
  confirm_new_password: string;
}

export interface SecurityLog {
  id: string;
  seller_id: string;
  action: string;
  ip_address: string | null;
  user_agent: string | null;
  status: 'success' | 'failed';
  details: Record<string, any> | null;
  created_at: string;
}

// ============================================
// API RESPONSE INTERFACE
// ============================================

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  meta?: {
    updated_fields?: string[];
    timestamp?: string;
  };
}

// ============================================
// CONSTANTS
// ============================================

const DEFAULT_NOTIFICATION_PREFERENCES = {
  email_notifications: true,
  sms_notifications: true,
  push_notifications: true,
  new_order_alerts: true,
  low_stock_alerts: true,
  customer_review_alerts: true,
  payment_received_alerts: true,
  refund_request_alerts: true,
  marketing_emails: false,
  system_updates: true,
};

const DEFAULT_PRIVACY_SETTINGS = {
  show_contact_info: true,
  show_sales_stats: false,
  allow_messages: true,
  data_sharing_consent: false,
  marketing_consent: false,
};

const DEFAULT_COMMUNICATION_SETTINGS = {
  auto_responder_enabled: false,
  auto_responder_message: null,
  response_time_target: 24,
  business_hours: {
    start: '09:00',
    end: '17:00',
    timezone: 'Asia/Riyadh',
  },
};

const DEFAULT_BILLING_SETTINGS = {
  payout_method: null,
  payout_frequency: 'weekly',
  payout_threshold: 1000,
  tax_identification_number: null,
  invoice_auto_generate: true,
};

// ============================================
// MAIN API FUNCTIONS
// ============================================

/**
 * Fetch the seller's account settings
 */
export const getAccountSettings = async (
  sellerId: string
): Promise<ApiResponse<AccountSettings>> => {
  try {
    // First, get the seller profile
    const { data: sellerData, error: sellerError } = await supabase
      .from('sellers')
      .select(`
        id,
        business_name,
        business_email,
        business_phone,
        vat_number,
        business_address,
        business_license_number,
        business_registration_date,
        account_status,
        verification_status,
        seller_tier,
        created_at,
        updated_at,
        user:user_id (
          email,
          phone,
          last_sign_in_at
        )
      `)
      .eq('id', sellerId)
      .single();

    if (sellerError) {
      throw new Error(`Failed to fetch seller data: ${sellerError.message}`);
    }

    // Get seller settings
    const { data: settingsData, error: settingsError } = await supabase
      .from('seller_settings')
      .select('*')
      .eq('seller_id', sellerId)
      .single();

    // If no settings exist, create default settings
    if (settingsError?.code === 'PGRST116') {
      // No settings found, create default
      const { data: newSettings, error: createError } = await supabase
        .from('seller_settings')
        .insert({
          seller_id: sellerId,
          notification_preferences: DEFAULT_NOTIFICATION_PREFERENCES,
          privacy_settings: DEFAULT_PRIVACY_SETTINGS,
          communication_settings: DEFAULT_COMMUNICATION_SETTINGS,
          billing_settings: DEFAULT_BILLING_SETTINGS,
          two_factor_enabled: false,
          two_factor_method: null,
        })
        .select()
        .single();

      if (createError) {
        throw new Error(`Failed to create default settings: ${createError.message}`);
      }

      return {
        data: mergeSettingsWithSellerData(sellerData, newSettings),
        error: null,
      };
    }

    if (settingsError) {
      throw new Error(`Failed to fetch seller settings: ${settingsError.message}`);
    }

    return {
      data: mergeSettingsWithSellerData(sellerData, settingsData),
      error: null,
    };
  } catch (error) {
    console.error('Error fetching account settings:', error);
    
    // Return mock data for demo/development
    if (process.env.NODE_ENV === 'development') {
      return {
        data: getMockAccountSettings(sellerId),
        error: null,
      };
    }

    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch account settings',
    };
  }
};

/**
 * Update account settings
 */
export const updateAccountSettings = async (
  sellerId: string,
  updatedData: AccountSettingsInput
): Promise<ApiResponse<AccountSettings>> => {
  try {
    const updatedFields: string[] = [];
    const now = new Date().toISOString();

    // 1. Update seller table fields if present
    const sellerUpdates: any = {};
    
    if (updatedData.business_name !== undefined) {
      sellerUpdates.business_name = updatedData.business_name;
      updatedFields.push('business_name');
    }
    
    if (updatedData.business_phone !== undefined) {
      sellerUpdates.business_phone = updatedData.business_phone;
      updatedFields.push('business_phone');
    }
    
    if (updatedData.business_address !== undefined) {
      sellerUpdates.business_address = updatedData.business_address;
      updatedFields.push('business_address');
    }
    
    if (updatedData.vat_number !== undefined) {
      sellerUpdates.vat_number = updatedData.vat_number;
      updatedFields.push('vat_number');
    }
    
    if (updatedData.contact_person !== undefined) {
      sellerUpdates.contact_person = updatedData.contact_person;
      updatedFields.push('contact_person');
    }
    
    if (updatedData.contact_email !== undefined) {
      sellerUpdates.contact_email = updatedData.contact_email;
      updatedFields.push('contact_email');
    }
    
    if (updatedData.contact_phone !== undefined) {
      sellerUpdates.contact_phone = updatedData.contact_phone;
      updatedFields.push('contact_phone');
    }

    // Update seller record if there are changes
    if (Object.keys(sellerUpdates).length > 0) {
      sellerUpdates.updated_at = now;
      
      const { error: sellerUpdateError } = await supabase
        .from('sellers')
        .update(sellerUpdates)
        .eq('id', sellerId);

      if (sellerUpdateError) {
        throw new Error(`Failed to update seller data: ${sellerUpdateError.message}`);
      }
    }

    // 2. Update seller_settings table fields
    const settingsUpdates: any = {};
    
    if (updatedData.notification_preferences) {
      settingsUpdates.notification_preferences = updatedData.notification_preferences;
      updatedFields.push('notification_preferences');
    }
    
    if (updatedData.privacy_settings) {
      settingsUpdates.privacy_settings = updatedData.privacy_settings;
      updatedFields.push('privacy_settings');
    }
    
    if (updatedData.communication_settings) {
      settingsUpdates.communication_settings = updatedData.communication_settings;
      updatedFields.push('communication_settings');
    }
    
    if (updatedData.billing_settings) {
      settingsUpdates.billing_settings = updatedData.billing_settings;
      updatedFields.push('billing_settings');
    }

    // Update settings record if there are changes
    if (Object.keys(settingsUpdates).length > 0) {
      // Get current settings to merge
      const { data: currentSettings } = await supabase
        .from('seller_settings')
        .select('*')
        .eq('seller_id', sellerId)
        .single();

      if (currentSettings) {
        // Merge updates with existing settings
        const mergedSettings = {
          ...currentSettings,
          ...settingsUpdates,
          updated_at: now,
        };

        const { error: settingsUpdateError } = await supabase
          .from('seller_settings')
          .update(mergedSettings)
          .eq('seller_id', sellerId);

        if (settingsUpdateError) {
          throw new Error(`Failed to update settings: ${settingsUpdateError.message}`);
        }
      }
    }

    // 3. Log the update activity
    await logSecurityActivity(sellerId, 'settings_update', 'success', {
      updated_fields: updatedFields,
    });

    // 4. Return updated settings
    const { data: updatedSettings, error: fetchError } = await getAccountSettings(sellerId);
    
    if (fetchError) {
      throw new Error(`Failed to fetch updated settings: ${fetchError}`);
    }

    return {
      data: updatedSettings.data,
      error: null,
      meta: {
        updated_fields: updatedFields,
        timestamp: now,
      },
    };
  } catch (error) {
    console.error('Error updating account settings:', error);
    
    // Log failed update
    await logSecurityActivity(sellerId, 'settings_update', 'failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update account settings',
    };
  }
};

/**
 * Change the seller's account password
 */
export const changePassword = async (
  sellerId: string,
  passwordChange: PasswordChangeRequest
): Promise<ApiResponse<{ success: boolean; message: string }>> => {
  try {
    const { current_password, new_password, confirm_new_password } = passwordChange;

    // Validation
    if (new_password !== confirm_new_password) {
      return {
        data: null,
        error: 'New passwords do not match',
      };
    }

    if (new_password.length < 8) {
      return {
        data: null,
        error: 'Password must be at least 8 characters long',
      };
    }

    // Get the user ID from seller
    const { data: sellerData, error: sellerError } = await supabase
      .from('sellers')
      .select('user_id')
      .eq('id', sellerId)
      .single();

    if (sellerError) {
      throw new Error(`Failed to fetch seller: ${sellerError.message}`);
    }

    // Update password using Supabase Auth
    const { error: updateError } = await supabase.auth.updateUser({
      password: new_password,
    });

    if (updateError) {
      throw new Error(`Failed to update password: ${updateError.message}`);
    }

    // Update last_password_change in seller_settings
    const { error: settingsError } = await supabase
      .from('seller_settings')
      .update({
        last_password_change: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('seller_id', sellerId);

    if (settingsError) {
      console.warn('Failed to update last_password_change:', settingsError.message);
    }

    // Log successful password change
    await logSecurityActivity(sellerId, 'password_change', 'success');

    return {
      data: {
        success: true,
        message: 'Password updated successfully',
      },
      error: null,
    };
  } catch (error) {
    console.error('Error changing password:', error);
    
    // Log failed password change
    await logSecurityActivity(sellerId, 'password_change', 'failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to change password',
    };
  }
};

/**
 * Enable or disable two-factor authentication
 */
export const toggleTwoFactorAuth = async (
  sellerId: string,
  enable: boolean,
  method?: 'sms' | 'email' | 'authenticator'
): Promise<ApiResponse<{ two_factor_enabled: boolean; setup_required?: boolean }>> => {
  try {
    // Get current settings
    const { data: currentSettings, error: fetchError } = await supabase
      .from('seller_settings')
      .select('two_factor_enabled, two_factor_method')
      .eq('seller_id', sellerId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch current 2FA settings: ${fetchError.message}`);
    }

    let setupRequired = false;
    const updates: any = {
      two_factor_enabled: enable,
      updated_at: new Date().toISOString(),
    };

    if (enable) {
      if (!currentSettings.two_factor_method && !method) {
        // If enabling without a method, require setup
        setupRequired = true;
        
        // For demo purposes, we'll use authenticator as default
        updates.two_factor_method = 'authenticator';
        
        // In production, you would generate and store TOTP secrets here
        // const secret = generateTOTPSecret();
        // updates.totp_secret = secret;
        // setupRequired = true;
      } else if (method) {
        updates.two_factor_method = method;
        
        if (method === 'authenticator') {
          // TOTP setup required
          setupRequired = true;
        }
      }
    } else {
      // Disabling 2FA
      updates.two_factor_method = null;
      // In production, you would also clear the TOTP secret
      // updates.totp_secret = null;
    }

    // Update settings
    const { error: updateError } = await supabase
      .from('seller_settings')
      .update(updates)
      .eq('seller_id', sellerId);

    if (updateError) {
      throw new Error(`Failed to update 2FA settings: ${updateError.message}`);
    }

    // Log the change
    await logSecurityActivity(sellerId, '2fa_toggle', 'success', {
      enabled: enable,
      method: updates.two_factor_method,
    });

    return {
      data: {
        two_factor_enabled: enable,
        setup_required: setupRequired,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error toggling 2FA:', error);
    
    await logSecurityActivity(sellerId, '2fa_toggle', 'failed', {
      enabled: enable,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to toggle 2FA',
    };
  }
};

/**
 * Generate TOTP setup for 2FA (production implementation)
 */
export const generateTwoFactorSetup = async (
  sellerId: string
): Promise<ApiResponse<TwoFactorSetup>> => {
  try {
    // In production, use a library like 'otplib' or 'speakeasy'
    // This is a placeholder implementation
    
    const secret = 'JBSWY3DPEHPK3PXP'; // Generated TOTP secret (base32)
    const qrCodeUrl = `otpauth://totp/FurnitureMarketplace:${sellerId}?secret=${secret}&issuer=FurnitureMarketplace`;
    const backupCodes = Array.from({ length: 10 }, () => 
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );

    // Store the secret in the database (encrypted in production)
    const { error: updateError } = await supabase
      .from('seller_settings')
      .update({
        totp_secret: secret, // Encrypt this in production!
        backup_codes: backupCodes,
        updated_at: new Date().toISOString(),
      })
      .eq('seller_id', sellerId);

    if (updateError) {
      throw new Error(`Failed to store TOTP secret: ${updateError.message}`);
    }

    await logSecurityActivity(sellerId, '2fa_setup_generated', 'success');

    return {
      data: {
        secret,
        qr_code_url: qrCodeUrl,
        backup_codes: backupCodes,
        verified: false,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error generating 2FA setup:', error);
    
    await logSecurityActivity(sellerId, '2fa_setup_generated', 'failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to generate 2FA setup',
    };
  }
};

/**
 * Verify TOTP code and complete 2FA setup
 */
export const verifyTwoFactorSetup = async (
  sellerId: string,
  code: string
): Promise<ApiResponse<{ verified: boolean }>> => {
  try {
    // Get stored TOTP secret
    const { data: settings, error: fetchError } = await supabase
      .from('seller_settings')
      .select('totp_secret')
      .eq('seller_id', sellerId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch TOTP secret: ${fetchError.message}`);
    }

    // In production: verify the TOTP code
    // const isValid = authenticator.verify({ secret: settings.totp_secret, token: code });
    const isValid = code.length === 6 && /^\d+$/.test(code); // Demo validation

    if (!isValid) {
      await logSecurityActivity(sellerId, '2fa_verification', 'failed', {
        reason: 'invalid_code',
      });

      return {
        data: null,
        error: 'Invalid verification code',
      };
    }

    // Mark 2FA as verified
    const { error: updateError } = await supabase
      .from('seller_settings')
      .update({
        two_factor_enabled: true,
        two_factor_method: 'authenticator',
        two_factor_verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('seller_id', sellerId);

    if (updateError) {
      throw new Error(`Failed to update 2FA verification status: ${updateError.message}`);
    }

    await logSecurityActivity(sellerId, '2fa_verification', 'success');

    return {
      data: { verified: true },
      error: null,
    };
  } catch (error) {
    console.error('Error verifying 2FA setup:', error);
    
    await logSecurityActivity(sellerId, '2fa_verification', 'failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to verify 2FA setup',
    };
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Merge seller data with settings data
 */
const mergeSettingsWithSellerData = (sellerData: any, settingsData: any): AccountSettings => {
  return {
    id: sellerData.id,
    seller_id: sellerData.id,
    business_name: sellerData.business_name,
    business_email: sellerData.business_email,
    business_phone: sellerData.business_phone,
    vat_number: sellerData.vat_number,
    business_address: sellerData.business_address,
    business_license_number: sellerData.business_license_number,
    business_registration_date: sellerData.business_registration_date,
    
    contact_person: sellerData.contact_person || sellerData.business_name,
    contact_email: sellerData.contact_email || sellerData.business_email,
    contact_phone: sellerData.contact_phone || sellerData.business_phone,
    
    two_factor_enabled: settingsData?.two_factor_enabled || false,
    two_factor_method: settingsData?.two_factor_method || null,
    last_password_change: settingsData?.last_password_change || null,
    failed_login_attempts: settingsData?.failed_login_attempts || 0,
    account_locked_until: settingsData?.account_locked_until || null,
    
    notification_preferences: settingsData?.notification_preferences || DEFAULT_NOTIFICATION_PREFERENCES,
    privacy_settings: settingsData?.privacy_settings || DEFAULT_PRIVACY_SETTINGS,
    communication_settings: settingsData?.communication_settings || DEFAULT_COMMUNICATION_SETTINGS,
    billing_settings: settingsData?.billing_settings || DEFAULT_BILLING_SETTINGS,
    
    account_status: sellerData.account_status || 'active',
    verification_status: sellerData.verification_status || 'unverified',
    seller_tier: sellerData.seller_tier || 'basic',
    
    created_at: sellerData.created_at,
    updated_at: sellerData.updated_at,
    last_login_at: sellerData.user?.last_sign_in_at || null,
    last_activity_at: settingsData?.last_activity_at || null,
  };
};

/**
 * Log security-related activities
 */
const logSecurityActivity = async (
  sellerId: string,
  action: string,
  status: 'success' | 'failed',
  details?: Record<string, any>
): Promise<void> => {
  try {
    await supabase.from('security_logs').insert({
      seller_id: sellerId,
      action,
      status,
      details,
      ip_address: null, // In production, extract from request
      user_agent: null, // In production, extract from request
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to log security activity:', error);
  }
};

// ============================================
// MOCK DATA FOR TESTING/DEMO
// ============================================

export const getMockAccountSettings = (sellerId: string): AccountSettings => ({
  id: sellerId,
  seller_id: sellerId,
  business_name: 'Premium Furniture Store',
  business_email: 'sales@premiumfurniture.com',
  business_phone: '+966 55 123 4567',
  vat_number: 'VAT123456789',
  business_address: 'King Abdullah Road, Riyadh, Saudi Arabia',
  business_license_number: 'CR-123456789',
  business_registration_date: '2023-01-15T00:00:00Z',
  
  contact_person: 'Ahmed Al-Mansoor',
  contact_email: 'ahmed@premiumfurniture.com',
  contact_phone: '+966 55 987 6543',
  
  two_factor_enabled: false,
  two_factor_method: null,
  last_password_change: '2024-01-15T10:30:00Z',
  failed_login_attempts: 0,
  account_locked_until: null,
  
  notification_preferences: DEFAULT_NOTIFICATION_PREFERENCES,
  privacy_settings: DEFAULT_PRIVACY_SETTINGS,
  communication_settings: DEFAULT_COMMUNICATION_SETTINGS,
  billing_settings: {
    payout_method: 'bank_transfer',
    payout_frequency: 'weekly',
    payout_threshold: 1000,
    tax_identification_number: 'TIN-123456789',
    invoice_auto_generate: true,
  },
  
  account_status: 'active',
  verification_status: 'verified',
  seller_tier: 'premium',
  
  created_at: '2023-01-15T00:00:00Z',
  updated_at: new Date().toISOString(),
  last_login_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  last_activity_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
});

/**
 * Get security logs for the seller
 */
export const getSecurityLogs = async (
  sellerId: string,
  limit: number = 50
): Promise<ApiResponse<SecurityLog[]>> => {
  try {
    const { data, error } = await supabase
      .from('security_logs')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch security logs: ${error.message}`);
    }

    return {
      data: data || [],
      error: null,
    };
  } catch (error) {
    console.error('Error fetching security logs:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch security logs',
    };
  }
};

/**
 * Request account deletion
 */
export const requestAccountDeletion = async (
  sellerId: string,
  reason?: string
): Promise<ApiResponse<{ request_id: string; estimated_completion: string }>> => {
  try {
    // In production, this would create a deletion request in a queue
    const requestId = `DEL-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const estimatedCompletion = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
    
    // Log the deletion request
    await logSecurityActivity(sellerId, 'account_deletion_requested', 'success', {
      request_id: requestId,
      reason,
    });

    return {
      data: {
        request_id: requestId,
        estimated_completion,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error requesting account deletion:', error);
    
    await logSecurityActivity(sellerId, 'account_deletion_requested', 'failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to request account deletion',
    };
  }
};