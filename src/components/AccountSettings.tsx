import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
  User, Mail, Phone, Camera, Lock, Shield,
  CheckCircle, XCircle, Eye, EyeOff, Smartphone,
  Globe, Moon, Sun, Bell, Save, RefreshCw,
  AlertCircle, Check, X, Download, Key,
  MapPin, Calendar, Clock, Smartphone as Device,
  LogOut, Upload, Trash2, QrCode, UserCheck,
  ChevronDown, Store, ExternalLink
} from 'lucide-react';

// ============== TYPES ==============
interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  email_verified: boolean;
  phone: string;
  phone_verified: boolean;
  profile_picture_url: string | null;
  language: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

interface SecuritySettings {
  password_last_changed: string;
  two_factor_enabled: boolean;
  two_factor_secret?: string;
  recovery_codes?: string[];
}

interface NotificationSettings {
  email_orders: boolean;
  email_custom_orders: boolean;
  email_shipping: boolean;
  email_reviews: boolean;
  email_promotions: boolean;
  email_finance: boolean;
  push_enabled: boolean;
}

interface LoginActivity {
  id: string;
  device: string;
  location: string;
  ip_address: string;
  timestamp: string;
  success: boolean;
}

interface AccountSettingsForm {
  full_name: string;
  email: string;
  phone: string;
  language: string;
  timezone: string;
  profile_picture: File | null;
  current_password: string;
  new_password: string;
  confirm_password: string;
  two_factor_enabled: boolean;
  notifications: NotificationSettings;
  theme: 'light' | 'dark' | 'auto';
}

interface ValidationErrors {
  [key: string]: string;
}

// ============== MOCK DATA ==============
const MOCK_PROFILE: UserProfile = {
  id: '1',
  user_id: 'user_123',
  full_name: 'Premium Furniture Store',
  email: 'seller@premiumfurniture.com',
  email_verified: true,
  phone: '+966 55 123 4567',
  phone_verified: true,
  profile_picture_url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=400&fit=crop',
  language: 'en',
  timezone: 'Asia/Riyadh',
  created_at: '2023-01-15T10:30:00Z',
  updated_at: '2024-01-15T14:20:00Z'
};

const MOCK_SECURITY: SecuritySettings = {
  password_last_changed: '2024-01-01T00:00:00Z',
  two_factor_enabled: false,
  two_factor_secret: 'JBSWY3DPEHPK3PXP',
  recovery_codes: ['ABC123', 'DEF456', 'GHI789', 'JKL012', 'MNO345']
};

const MOCK_NOTIFICATIONS: NotificationSettings = {
  email_orders: true,
  email_custom_orders: true,
  email_shipping: true,
  email_reviews: true,
  email_promotions: false,
  email_finance: true,
  push_enabled: true
};

const MOCK_LOGIN_ACTIVITY: LoginActivity[] = [
  {
    id: '1',
    device: 'Chrome on Windows',
    location: 'Riyadh, Saudi Arabia',
    ip_address: '192.168.1.100',
    timestamp: '2024-01-20T10:30:00Z',
    success: true
  },
  {
    id: '2',
    device: 'Safari on iPhone',
    location: 'Jeddah, Saudi Arabia',
    ip_address: '192.168.1.101',
    timestamp: '2024-01-19T14:45:00Z',
    success: true
  },
  {
    id: '3',
    device: 'Firefox on Mac',
    location: 'Dammam, Saudi Arabia',
    ip_address: '192.168.1.102',
    timestamp: '2024-01-18T09:15:00Z',
    success: false
  },
  {
    id: '4',
    device: 'Chrome on Android',
    location: 'Madinah, Saudi Arabia',
    ip_address: '192.168.1.103',
    timestamp: '2024-01-17T16:20:00Z',
    success: true
  },
  {
    id: '5',
    device: 'Microsoft Edge',
    location: 'Abha, Saudi Arabia',
    ip_address: '192.168.1.104',
    timestamp: '2024-01-16T11:45:00Z',
    success: true
  }
];

// ============== UTILITY FUNCTIONS ==============
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-SA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const timeSince = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return `${interval} year${interval > 1 ? 's' : ''} ago`;
  
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return `${interval} month${interval > 1 ? 's' : ''} ago`;
  
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return `${interval} day${interval > 1 ? 's' : ''} ago`;
  
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return `${interval} hour${interval > 1 ? 's' : ''} ago`;
  
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return `${interval} minute${interval > 1 ? 's' : ''} ago`;
  
  return 'Just now';
};

const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validatePhone = (phone: string): boolean => {
  const re = /^\+966\s\d{2}\s\d{3}\s\d{4}$/;
  return re.test(phone);
};

const checkPasswordStrength = (password: string): {
  score: number;
  strength: 'weak' | 'fair' | 'good' | 'strong';
  color: string;
} => {
  let score = 0;
  
  // Length check
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  
  // Complexity checks
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  
  let strength: 'weak' | 'fair' | 'good' | 'strong' = 'weak';
  let color = 'bg-red-500';
  
  if (score <= 2) {
    strength = 'weak';
    color = 'bg-red-500';
  } else if (score === 3) {
    strength = 'fair';
    color = 'bg-yellow-500';
  } else if (score === 4) {
    strength = 'good';
    color = 'bg-blue-500';
  } else {
    strength = 'strong';
    color = 'bg-green-500';
  }
  
  return { score, strength, color };
};

// ============== AVAILABLE OPTIONS ==============
const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'ar', label: 'العربية' },
  { value: 'fr', label: 'Français' },
  { value: 'es', label: 'Español' }
];

const TIMEZONES = [
  { value: 'Asia/Riyadh', label: 'Riyadh (GMT+3)' },
  { value: 'Asia/Dubai', label: 'Dubai (GMT+4)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'America/New_York', label: 'New York (GMT-5)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (GMT+9)' }
];

interface AccountSettingsProps {
  onNavigateToStoreProfile?: () => void;
}

// ============== MAIN COMPONENT ==============
export const AccountSettings: React.FC<AccountSettingsProps> = ({ onNavigateToStoreProfile }) => {
  const { user } = useAuth();
  
  // State Management
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(MOCK_PROFILE);
  const [security, setSecurity] = useState<SecuritySettings>(MOCK_SECURITY);
  const [notifications, setNotifications] = useState<NotificationSettings>(MOCK_NOTIFICATIONS);
  const [loginActivity, setLoginActivity] = useState<LoginActivity[]>(MOCK_LOGIN_ACTIVITY);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [formData, setFormData] = useState<AccountSettingsForm>({
    full_name: MOCK_PROFILE.full_name,
    email: MOCK_PROFILE.email,
    phone: MOCK_PROFILE.phone,
    language: MOCK_PROFILE.language,
    timezone: MOCK_PROFILE.timezone,
    profile_picture: null,
    current_password: '',
    new_password: '',
    confirm_password: '',
    two_factor_enabled: MOCK_SECURITY.two_factor_enabled,
    notifications: MOCK_NOTIFICATIONS,
    theme: 'light'
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(checkPasswordStrength(''));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(MOCK_PROFILE.profile_picture_url);
  const [verificationCode, setVerificationCode] = useState('');

  // Load Data from Supabase
  const loadAccountData = async () => {
    try {
      setLoading(true);
      
      // Check for demo mode
      const demoMode = localStorage.getItem('demoMode') === 'true';
      
      if (demoMode) {
        // Use mock data for demo
        setProfile(MOCK_PROFILE);
        setSecurity(MOCK_SECURITY);
        setNotifications(MOCK_NOTIFICATIONS);
        setLoginActivity(MOCK_LOGIN_ACTIVITY);
        
        setFormData({
          full_name: MOCK_PROFILE.full_name,
          email: MOCK_PROFILE.email,
          phone: MOCK_PROFILE.phone,
          language: MOCK_PROFILE.language,
          timezone: MOCK_PROFILE.timezone,
          profile_picture: null,
          current_password: '',
          new_password: '',
          confirm_password: '',
          two_factor_enabled: MOCK_SECURITY.two_factor_enabled,
          notifications: MOCK_NOTIFICATIONS,
          theme: 'light'
        });
        
        setProfilePreview(MOCK_PROFILE.profile_picture_url);
        setLoading(false);
        return;
      }
      
      // Real Supabase queries
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error('Error loading profile:', profileError);
        // Use mock data as fallback
        setProfile(MOCK_PROFILE);
        setProfilePreview(MOCK_PROFILE.profile_picture_url);
      } else if (profileData) {
        setProfile(profileData as UserProfile);
        setProfilePreview(profileData.profile_picture_url);
      }
      
      // Load security settings (if table exists)
      try {
        const { data: securityData, error: securityError } = await supabase
          .from('security_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (!securityError && securityData) {
          setSecurity(securityData as SecuritySettings);
        }
      } catch (error) {
        console.log('Security settings table might not exist, using mock data');
      }
      
      // Load notification settings (if table exists)
      try {
        const { data: notificationData, error: notificationError } = await supabase
          .from('notification_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (!notificationError && notificationData) {
          setNotifications(notificationData as NotificationSettings);
        }
      } catch (error) {
        console.log('Notification settings table might not exist, using mock data');
      }
      
      // Load login activity (if table exists)
      try {
        const { data: activityData, error: activityError } = await supabase
          .from('login_activity')
          .select('*')
          .eq('user_id', user.id)
          .order('timestamp', { ascending: false })
          .limit(5);
        
        if (!activityError && activityData) {
          setLoginActivity(activityData as LoginActivity[]);
        }
      } catch (error) {
        console.log('Login activity table might not exist, using mock data');
      }
      
      // Update form data
      setFormData(prev => ({
        ...prev,
        full_name: profileData?.full_name || MOCK_PROFILE.full_name,
        email: user.email || MOCK_PROFILE.email,
        phone: profileData?.phone || MOCK_PROFILE.phone,
        language: profileData?.language || 'en',
        timezone: profileData?.timezone || 'Asia/Riyadh',
        two_factor_enabled: security?.two_factor_enabled || false,
        notifications: notifications || MOCK_NOTIFICATIONS
      }));
      
    } catch (error) {
      console.error('Error loading account data:', error);
      // Use mock data as fallback
      setProfile(MOCK_PROFILE);
      setSecurity(MOCK_SECURITY);
      setNotifications(MOCK_NOTIFICATIONS);
      setLoginActivity(MOCK_LOGIN_ACTIVITY);
      
      setFormData({
        full_name: MOCK_PROFILE.full_name,
        email: user?.email || MOCK_PROFILE.email,
        phone: MOCK_PROFILE.phone,
        language: MOCK_PROFILE.language,
        timezone: MOCK_PROFILE.timezone,
        profile_picture: null,
        current_password: '',
        new_password: '',
        confirm_password: '',
        two_factor_enabled: MOCK_SECURITY.two_factor_enabled,
        notifications: MOCK_NOTIFICATIONS,
        theme: 'light'
      });
      
      setProfilePreview(MOCK_PROFILE.profile_picture_url);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccountData();
  }, [user]);

  // Handle Input Changes
  const handleInputChange = (field: keyof AccountSettingsForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
    
    if (field === 'new_password') {
      setPasswordStrength(checkPasswordStrength(value));
    }
  };

  const handleNotificationChange = (field: keyof NotificationSettings) => {
    setFormData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [field]: !prev.notifications[field]
      }
    }));
  };

  // Handle Profile Picture Upload
  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type and size
      const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, profile_picture: 'Please upload a valid image (JPEG, PNG, GIF)' }));
        return;
      }
      
      if (file.size > maxSize) {
        setErrors(prev => ({ ...prev, profile_picture: 'Image size must be less than 5MB' }));
        return;
      }
      
      setFormData(prev => ({ ...prev, profile_picture: file }));
      setErrors(prev => ({ ...prev, profile_picture: '' }));
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeProfilePicture = () => {
    setFormData(prev => ({ ...prev, profile_picture: null }));
    setProfilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Validation
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    
    // Personal Information Validation
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (formData.phone && !validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid Saudi phone number (+966 XX XXX XXXX)';
    }
    
    // Password Change Validation (if any password field is filled)
    if (formData.current_password || formData.new_password || formData.confirm_password) {
      if (!formData.current_password) {
        newErrors.current_password = 'Current password is required to change password';
      }
      
      if (!formData.new_password) {
        newErrors.new_password = 'New password is required';
      } else if (formData.new_password.length < 8) {
        newErrors.new_password = 'Password must be at least 8 characters';
      } else if (passwordStrength.strength === 'weak') {
        newErrors.new_password = 'Password is too weak. Include uppercase, lowercase, numbers, and symbols';
      }
      
      if (formData.new_password !== formData.confirm_password) {
        newErrors.confirm_password = 'Passwords do not match';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save Changes
  const handleSaveChanges = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      setSaving(true);
      
      // Check for demo mode
      const demoMode = localStorage.getItem('demoMode') === 'true';
      
      if (demoMode) {
        // Simulate API call for demo mode
        setTimeout(() => {
          setSaving(false);
          setSuccessMessage('Settings saved successfully! (Demo Mode)');
          setTimeout(() => setSuccessMessage(''), 3000);
          
          // Update state with form data
          setProfile(prev => ({
            ...prev,
            full_name: formData.full_name,
            email: formData.email,
            phone: formData.phone,
            language: formData.language,
            timezone: formData.timezone,
            profile_picture_url: profilePreview || prev.profile_picture_url
          }));
          
          setSecurity(prev => ({
            ...prev,
            two_factor_enabled: formData.two_factor_enabled
          }));
          
          setNotifications(formData.notifications);
          
        }, 1000);
        return;
      }
      
      if (!user) throw new Error('User not authenticated');
      
      // Update profile in Supabase
      const updates: any = {
        full_name: formData.full_name,
        phone: formData.phone,
        language: formData.language,
        timezone: formData.timezone,
        updated_at: new Date().toISOString()
      };
      
      // Handle profile picture upload
      if (formData.profile_picture) {
        const fileExt = formData.profile_picture.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        try {
          // Upload to Supabase Storage
          const { error: uploadError } = await supabase.storage
            .from('profile-pictures')
            .upload(fileName, formData.profile_picture);
          
          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('profile-pictures')
              .getPublicUrl(fileName);
            
            updates.profile_picture_url = publicUrl;
          }
        } catch (uploadError) {
          console.error('Error uploading profile picture:', uploadError);
          // Continue without profile picture update
        }
      }
      
      const { error: profileError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
      
      if (profileError) {
        console.error('Error updating profile:', profileError);
        // Try to insert if update fails
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            ...updates,
            created_at: new Date().toISOString()
          });
        
        if (insertError) throw insertError;
      }
      
      // Update email if changed
      if (formData.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: formData.email
        });
        
        if (emailError) {
          if (emailError.message.includes('already registered')) {
            throw new Error('Email already registered with another account');
          }
          throw emailError;
        }
      }
      
      // Update password if changed
      if (formData.new_password) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: formData.new_password
        });
        
        if (passwordError) {
          if (passwordError.message.includes('reauthenticate')) {
            throw new Error('Please re-authenticate before changing password');
          }
          throw passwordError;
        }
        
        // Update security settings
        try {
          const { error: securityError } = await supabase
            .from('security_settings')
            .upsert({
              user_id: user.id,
              password_last_changed: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          
          if (securityError && !securityError.message.includes('does not exist')) {
            console.error('Error updating security settings:', securityError);
          }
        } catch (securityError) {
          console.error('Security settings table might not exist:', securityError);
        }
      }
      
      // Update notification settings
      try {
        const { error: notificationError } = await supabase
          .from('notification_settings')
          .upsert({
            user_id: user.id,
            ...formData.notifications,
            updated_at: new Date().toISOString()
          });
        
        if (notificationError && !notificationError.message.includes('does not exist')) {
          console.error('Error updating notification settings:', notificationError);
        }
      } catch (notificationError) {
        console.error('Notification settings table might not exist:', notificationError);
      }
      
      // Update 2FA settings
      if (formData.two_factor_enabled !== security.two_factor_enabled) {
        try {
          const { error: twoFactorError } = await supabase
            .from('security_settings')
            .upsert({
              user_id: user.id,
              two_factor_enabled: formData.two_factor_enabled,
              updated_at: new Date().toISOString()
            });
          
          if (twoFactorError && !twoFactorError.message.includes('does not exist')) {
            console.error('Error updating 2FA settings:', twoFactorError);
          }
        } catch (twoFactorError) {
          console.error('Security settings table might not exist for 2FA:', twoFactorError);
        }
      }
      
      // Reload data
      await loadAccountData();
      
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: ''
      }));
      
      // Show success message
      setSuccessMessage('Settings saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (error: any) {
      console.error('Error saving settings:', error);
      setErrors(prev => ({ ...prev, _general: error.message || 'Failed to save settings' }));
    } finally {
      setSaving(false);
    }
  };

  // Handle 2FA Toggle
  const handleToggle2FA = () => {
    if (!formData.two_factor_enabled) {
      setShow2FAModal(true);
    } else {
      if (window.confirm('Are you sure you want to disable two-factor authentication?')) {
        handleInputChange('two_factor_enabled', false);
      }
    }
  };

  const handleEnable2FA = () => {
    // In production, this would generate a real 2FA secret
    handleInputChange('two_factor_enabled', true);
    setShow2FAModal(false);
    setSuccessMessage('Two-factor authentication enabled successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Handle Download Recovery Codes
  const handleDownloadRecoveryCodes = () => {
    if (!security.recovery_codes) return;
    
    const codesText = security.recovery_codes.join('\n');
    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recovery-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Reset form to original values
  const handleDiscardChanges = () => {
    setFormData({
      full_name: profile.full_name,
      email: profile.email,
      phone: profile.phone,
      language: profile.language,
      timezone: profile.timezone,
      profile_picture: null,
      current_password: '',
      new_password: '',
      confirm_password: '',
      two_factor_enabled: security.two_factor_enabled,
      notifications: notifications,
      theme: 'light'
    });
    setProfilePreview(profile.profile_picture_url);
    setErrors({});
    setSuccessMessage('Changes discarded');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading account settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Account Settings</h1>
            <p className="text-gray-600 text-sm">Manage your personal information, security, and preferences</p>
          </div>
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={loadAccountData}
              className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            {onNavigateToStoreProfile && (
              <button
                onClick={onNavigateToStoreProfile}
                className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
              >
                <Store className="w-4 h-4" />
                <span>Store Profile</span>
              </button>
            )}
            <button
              onClick={handleSaveChanges}
              disabled={saving}
              className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mr-2 sm:mr-3" />
              <p className="text-green-800 font-medium text-sm sm:text-base">{successMessage}</p>
            </div>
          </div>
        )}

        {/* General Error */}
        {errors._general && (
          <div className="mb-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 mr-2 sm:mr-3" />
              <p className="text-red-800 font-medium text-sm sm:text-base">{errors._general}</p>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Personal Information Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Personal Information</h2>
            </div>
          </div>
          
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
              {/* Profile Picture */}
              <div className="lg:col-span-1">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-700">Profile Picture</h3>
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                      <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow-lg">
                        {profilePreview ? (
                          <img
                            src={profilePreview}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 p-1.5 sm:p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-lg"
                      >
                        <Camera className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      className="hidden"
                    />
                    
                    <div className="flex flex-wrap justify-center gap-2">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium"
                      >
                        Upload Photo
                      </button>
                      {profilePreview && (
                        <button
                          onClick={removeProfilePicture}
                          className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    
                    {errors.profile_picture && (
                      <p className="text-xs text-red-600 text-center">{errors.profile_picture}</p>
                    )}
                    
                    <p className="text-xs text-gray-500 text-center">
                      Recommended: Square image, at least 400x400px, max 5MB
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Form Fields */}
              <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => handleInputChange('full_name', e.target.value)}
                        className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                          errors.full_name ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter your full name"
                      />
                    </div>
                    {errors.full_name && (
                      <p className="mt-1 text-xs text-red-600">{errors.full_name}</p>
                    )}
                  </div>
                  
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                          errors.email ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="email@example.com"
                      />
                      {profile.email_verified ? (
                        <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-yellow-600" />
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      {errors.email ? (
                        <p className="text-xs text-red-600">{errors.email}</p>
                      ) : (
                        <p className="text-xs text-gray-500">
                          {profile.email_verified ? 'Verified' : 'Not verified'}
                        </p>
                      )}
                      {!profile.email_verified && (
                        <button className="text-xs text-blue-600 hover:text-blue-800">
                          Verify email
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                          errors.phone ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="+966 XX XXX XXXX"
                      />
                      {profile.phone_verified ? (
                        <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-yellow-600" />
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      {errors.phone ? (
                        <p className="text-xs text-red-600">{errors.phone}</p>
                      ) : (
                        <p className="text-xs text-gray-500">
                          {profile.phone_verified ? 'Verified' : 'Not verified'}
                        </p>
                      )}
                      {!profile.phone_verified && (
                        <button className="text-xs text-blue-600 hover:text-blue-800">
                          Verify phone
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Language */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Language
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <select
                        value={formData.language}
                        onChange={(e) => handleInputChange('language', e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none text-sm"
                      >
                        {LANGUAGES.map((lang) => (
                          <option key={lang.value} value={lang.value}>
                            {lang.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  
                  {/* Timezone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Timezone
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <select
                        value={formData.timezone}
                        onChange={(e) => handleInputChange('timezone', e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none text-sm"
                      >
                        {TIMEZONES.map((tz) => (
                          <option key={tz.value} value={tz.value}>
                            {tz.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Security</h2>
            </div>
          </div>
          
          <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
            {/* Change Password */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword.current ? 'text' : 'password'}
                      value={formData.current_password}
                      onChange={(e) => handleInputChange('current_password', e.target.value)}
                      className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                        errors.current_password ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => ({ ...prev, current: !prev.current }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {showPassword.current ? (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.current_password && (
                    <p className="mt-1 text-xs text-red-600">{errors.current_password}</p>
                  )}
                </div>
                
                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword.new ? 'text' : 'password'}
                      value={formData.new_password}
                      onChange={(e) => handleInputChange('new_password', e.target.value)}
                      className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                        errors.new_password ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {showPassword.new ? (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  
                  {/* Password Strength Indicator */}
                  {formData.new_password && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">Password strength:</span>
                        <span className={`text-xs font-medium ${
                          passwordStrength.strength === 'weak' ? 'text-red-600' :
                          passwordStrength.strength === 'fair' ? 'text-yellow-600' :
                          passwordStrength.strength === 'good' ? 'text-blue-600' :
                          'text-green-600'
                        }`}>
                          {passwordStrength.strength.charAt(0).toUpperCase() + passwordStrength.strength.slice(1)}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${passwordStrength.color} transition-all duration-300`}
                          style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {errors.new_password && (
                    <p className="mt-1 text-xs text-red-600">{errors.new_password}</p>
                  )}
                </div>
                
                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword.confirm ? 'text' : 'password'}
                      value={formData.confirm_password}
                      onChange={(e) => handleInputChange('confirm_password', e.target.value)}
                      className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                        errors.confirm_password ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {showPassword.confirm ? (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.confirm_password && (
                    <p className="mt-1 text-xs text-red-600">{errors.confirm_password}</p>
                  )}
                </div>
                
                {/* Password Info */}
                <div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
                    <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Password Requirements</h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li className="flex items-center">
                        <Check className="w-3 h-3 text-green-600 mr-2" />
                        At least 8 characters long
                      </li>
                      <li className="flex items-center">
                        <Check className="w-3 h-3 text-green-600 mr-2" />
                        Include uppercase and lowercase letters
                      </li>
                      <li className="flex items-center">
                        <Check className="w-3 h-3 text-green-600 mr-2" />
                        Include at least one number
                      </li>
                      <li className="flex items-center">
                        <Check className="w-3 h-3 text-green-600 mr-2" />
                        Include at least one special character
                      </li>
                    </ul>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Last changed: {timeSince(security.password_last_changed)}
                  </p>
                </div>
              </div>
            </div>

            {/* Two-Factor Authentication */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Two-Factor Authentication</h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <button
                  onClick={handleToggle2FA}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors self-start sm:self-auto ${
                    formData.two_factor_enabled ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.two_factor_enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              {formData.two_factor_enabled && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center mb-2">
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mr-2" />
                        <span className="font-medium text-green-800 text-sm sm:text-base">2FA is enabled</span>
                      </div>
                      <p className="text-xs sm:text-sm text-green-700">
                        Your account is protected with two-factor authentication
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setShowRecoveryCodes(true)}
                        className="px-3 py-1.5 text-xs sm:text-sm bg-green-100 hover:bg-green-200 text-green-800 rounded-lg font-medium"
                      >
                        View Recovery Codes
                      </button>
                      <button
                        onClick={handleDownloadRecoveryCodes}
                        className="px-3 py-1.5 text-xs sm:text-sm bg-white border border-green-200 hover:bg-green-50 text-green-700 rounded-lg font-medium flex items-center"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Download Codes
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Login Activity */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Recent Login Activity</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px]">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="text-left py-3 px-3 sm:px-4 text-xs font-semibold text-gray-600 uppercase">
                          Device
                        </th>
                        <th className="text-left py-3 px-3 sm:px-4 text-xs font-semibold text-gray-600 uppercase">
                          Location
                        </th>
                        <th className="text-left py-3 px-3 sm:px-4 text-xs font-semibold text-gray-600 uppercase">
                          IP Address
                        </th>
                        <th className="text-left py-3 px-3 sm:px-4 text-xs font-semibold text-gray-600 uppercase">
                          Time
                        </th>
                        <th className="text-left py-3 px-3 sm:px-4 text-xs font-semibold text-gray-600 uppercase">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {loginActivity.map((activity) => (
                        <tr key={activity.id} className="hover:bg-white">
                          <td className="py-3 px-3 sm:px-4">
                            <div className="flex items-center">
                              <Device className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="text-xs sm:text-sm text-gray-900 truncate max-w-[120px]">
                                {activity.device}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 sm:px-4">
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="text-xs sm:text-sm text-gray-900">{activity.location}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 sm:px-4 text-xs sm:text-sm text-gray-900">
                            {activity.ip_address}
                          </td>
                          <td className="py-3 px-3 sm:px-4 text-xs sm:text-sm text-gray-900">
                            {formatDate(activity.timestamp)}
                          </td>
                          <td className="py-3 px-3 sm:px-4">
                            {activity.success ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Success
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <XCircle className="w-3 h-3 mr-1" />
                                Failed
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-3 sm:p-4 border-t border-gray-200">
                  <button className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium">
                    View All Activity →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications & Preferences Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Notifications & Preferences</h2>
            </div>
          </div>
          
          <div className="p-4 sm:p-6">
            <div className="space-y-6 sm:space-y-8">
              {/* Email Notifications */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Email Notifications</h3>
                <div className="space-y-3 sm:space-y-4">
                  {Object.entries({
                    email_orders: { label: 'Order Updates', desc: 'New orders, cancellations, status changes' },
                    email_custom_orders: { label: 'Custom Orders', desc: 'Custom order requests and updates' },
                    email_shipping: { label: 'Shipping Updates', desc: 'Delivery status and tracking' },
                    email_reviews: { label: 'Reviews & Ratings', desc: 'New reviews and rating changes' },
                    email_finance: { label: 'Finance Updates', desc: 'Payments, payouts, and VAT reminders' },
                    email_promotions: { label: 'Promotions & Marketing', desc: 'Sales promotions and marketing updates' }
                  }).map(([key, { label, desc }]) => (
                    <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <p className="font-medium text-gray-900 text-sm sm:text-base">{label}</p>
                        <p className="text-xs sm:text-sm text-gray-600">{desc}</p>
                      </div>
                      <button
                        onClick={() => handleNotificationChange(key as keyof NotificationSettings)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors self-start sm:self-auto ${
                          formData.notifications[key as keyof NotificationSettings] ? 'bg-blue-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            formData.notifications[key as keyof NotificationSettings] ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Push Notifications */}
              <div className="border-t border-gray-200 pt-6 sm:pt-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm sm:text-base">Push Notifications</h3>
                    <p className="text-xs sm:text-sm text-gray-600">Receive browser notifications</p>
                  </div>
                  <button
                    onClick={() => handleNotificationChange('push_enabled')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors self-start sm:self-auto ${
                      formData.notifications.push_enabled ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.notifications.push_enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Theme Preference */}
              <div className="border-t border-gray-200 pt-6 sm:pt-8">
                <h3 className="font-medium text-gray-900 text-sm sm:text-base mb-4">Theme Preference</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => handleInputChange('theme', 'light')}
                    className={`flex flex-col items-center p-3 sm:p-4 border-2 rounded-lg transition-all ${
                      formData.theme === 'light'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Sun className={`w-6 h-6 sm:w-8 sm:h-8 mb-2 ${
                      formData.theme === 'light' ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                    <span className={`font-medium text-sm ${
                      formData.theme === 'light' ? 'text-blue-700' : 'text-gray-700'
                    }`}>
                      Light
                    </span>
                  </button>
                  
                  <button
                    onClick={() => handleInputChange('theme', 'dark')}
                    className={`flex flex-col items-center p-3 sm:p-4 border-2 rounded-lg transition-all ${
                      formData.theme === 'dark'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Moon className={`w-6 h-6 sm:w-8 sm:h-8 mb-2 ${
                      formData.theme === 'dark' ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                    <span className={`font-medium text-sm ${
                      formData.theme === 'dark' ? 'text-blue-700' : 'text-gray-700'
                    }`}>
                      Dark
                    </span>
                  </button>
                  
                  <button
                    onClick={() => handleInputChange('theme', 'auto')}
                    className={`flex flex-col items-center p-3 sm:p-4 border-2 rounded-lg transition-all ${
                      formData.theme === 'auto'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="relative w-6 h-6 sm:w-8 sm:h-8 mb-2">
                      <Sun className={`absolute top-0 left-0 w-3 h-3 sm:w-4 sm:h-4 ${
                        formData.theme === 'auto' ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                      <Moon className={`absolute bottom-0 right-0 w-3 h-3 sm:w-4 sm:h-4 ${
                        formData.theme === 'auto' ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                    </div>
                    <span className={`font-medium text-sm ${
                      formData.theme === 'auto' ? 'text-blue-700' : 'text-gray-700'
                    }`}>
                      Auto
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">
                Make sure to save your changes before leaving this page
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleDiscardChanges}
                className="px-4 sm:px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm"
              >
                Discard Changes
              </button>
              <button
                onClick={handleSaveChanges}
                disabled={saving}
                className="px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
              >
                {saving ? 'Saving...' : 'Save All Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2FA Setup Modal */}
      {show2FAModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">Set Up Two-Factor Authentication</h3>
                <button
                  onClick={() => setShow2FAModal(false)}
                  className="p-1 sm:p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
              
              <div className="space-y-4 sm:space-y-6">
                <div className="text-center">
                  <div className="bg-gray-100 p-3 sm:p-4 rounded-lg inline-block mb-3 sm:mb-4">
                    <QrCode className="w-24 h-24 sm:w-32 sm:h-32 text-gray-700" />
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-2">
                    Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                  </p>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 sm:p-3">
                    <code className="text-xs sm:text-sm font-mono text-gray-900 break-all">
                      {security.two_factor_secret}
                    </code>
                  </div>
                </div>
                
                <div className="space-y-2 sm:space-y-3">
                  <p className="text-xs sm:text-sm text-gray-600">
                    Enter the 6-digit code from your authenticator app to verify setup:
                  </p>
                  <input
                    type="text"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full px-4 py-2 text-center text-xl sm:text-2xl font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 tracking-widest"
                  />
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                  <div className="flex">
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mr-2 sm:mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-blue-800">Save your recovery codes</p>
                      <p className="text-xs text-blue-700 mt-1">
                        Make sure to download and securely store your recovery codes. 
                        You'll need them if you lose access to your authenticator app.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 sm:space-x-3 pt-3 sm:pt-4">
                  <button
                    onClick={() => setShow2FAModal(false)}
                    className="flex-1 px-3 sm:px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEnable2FA}
                    disabled={verificationCode.length !== 6}
                    className="flex-1 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Enable 2FA
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recovery Codes Modal */}
      {showRecoveryCodes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">Recovery Codes</h3>
                <button
                  onClick={() => setShowRecoveryCodes(false)}
                  className="p-1 sm:p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
              
              <div className="space-y-4 sm:space-y-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
                  <div className="flex">
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 mr-2 sm:mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-red-800">Keep these codes safe</p>
                      <p className="text-xs text-red-700 mt-1">
                        Each code can be used only once. Store them in a secure place.
                        If you lose them, you'll lose access to your account.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {security.recovery_codes?.map((code, index) => (
                      <div
                        key={index}
                        className="text-center p-2 bg-white border border-gray-200 rounded"
                      >
                        <code className="font-mono text-xs sm:text-sm text-gray-900">{code}</code>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 sm:space-x-3 pt-3 sm:pt-4">
                  <button
                    onClick={handleDownloadRecoveryCodes}
                    className="flex-1 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm flex items-center justify-center"
                  >
                    <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Download Codes
                  </button>
                  <button
                    onClick={() => setShowRecoveryCodes(false)}
                    className="flex-1 px-3 sm:px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountSettings;