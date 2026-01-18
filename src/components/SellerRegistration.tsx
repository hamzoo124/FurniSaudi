// src/components/seller/SellerRegistration.tsx - UPDATED
import React, { useState, useRef } from "react";
import { 
  User, Store, FileText, CreditCard, Mail, Phone, 
  MapPin, Upload, CheckCircle, AlertCircle, Loader2, 
  Shield, Calendar, FileCheck, Send
} from "lucide-react";
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

interface SellerRegistrationProps {
  onRegistrationComplete?: () => void;
}

const SellerRegistration: React.FC<SellerRegistrationProps> = ({ 
  onRegistrationComplete 
}) => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [applicationId, setApplicationId] = useState<string>('');
  const [submitError, setSubmitError] = useState<string>('');
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    contactNumber: '',
    address: '',
    city: '',
    businessType: 'individual',
    businessDescription: '',
    crNumber: '',
    crDocument: null as File | null,
    bankName: '',
    accountNumber: '',
    iban: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const saudiCities = [
    'Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam', 'Khobar', 'Dhahran',
    'Taif', 'Tabuk', 'Abha', 'Jazan', 'Hail', 'Buraidah', 'Najran'
  ];

  const saudiBanks = [
    'Al Rajhi Bank',
    'Saudi National Bank (SNB)',
    'Riyad Bank',
    'Saudi British Bank (SABB)',
    'Arab National Bank (ANB)',
    'Alinma Bank',
    'Bank AlBilad',
    'Saudi Investment Bank (SAIB)',
    'Bank AlJazira',
    'Emirates NBD'
  ];

  // Format functions
  const formatPhone = (value: string): string => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  };

  const formatAccountNumber = (value: string): string => {
    const digits = value.replace(/\D/g, '').slice(0, 20);
    let formatted = '';
    for (let i = 0; i < digits.length; i++) {
      if (i > 0 && i % 4 === 0) formatted += ' ';
      formatted += digits[i];
    }
    return formatted;
  };

  const formatIBAN = (value: string): string => {
    const clean = value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    let formatted = '';
    for (let i = 0; i < clean.length; i++) {
      if (i > 0 && i % 4 === 0) formatted += ' ';
      formatted += clean[i];
    }
    return formatted.slice(0, 29);
  };

  // Handle input changes
  const handleInputChange = (field: string, value: any) => {
    let processedValue = value;
    
    switch (field) {
      case 'contactNumber':
        processedValue = formatPhone(value);
        break;
      case 'accountNumber':
        processedValue = formatAccountNumber(value);
        break;
      case 'iban':
        processedValue = formatIBAN(value);
        break;
      case 'crNumber':
        processedValue = value.replace(/\D/g, '').slice(0, 10);
        break;
      default:
        processedValue = value;
    }

    setFormData(prev => ({
      ...prev,
      [field]: processedValue
    }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle file upload
  const handleFileUpload = (files: FileList | null) => {
    if (!files || !files[0]) return;
    const file = files[0];
    
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, crDocument: 'File size exceeds 5MB' }));
      return;
    }
    
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, crDocument: 'Invalid file type' }));
      return;
    }

    setFormData(prev => ({ ...prev, crDocument: file }));
    setErrors(prev => ({ ...prev, crDocument: '' }));
  };

  // CORRECTED Validate form - FIXED VERSION
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Account info - only validate required fields
    if (!formData.fullName.trim()) newErrors.fullName = 'Required';
    
    if (!formData.email.trim()) {
      newErrors.email = 'Required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Min 6 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Required';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Business info
    if (!formData.businessName.trim()) newErrors.businessName = 'Required';
    
    const phoneDigits = formData.contactNumber.replace(/\D/g, '');
    if (!phoneDigits) {
      newErrors.contactNumber = 'Required';
    } else if (!/^05\d{8}$/.test(phoneDigits)) {
      newErrors.contactNumber = 'Invalid Saudi number (05XXXXXXXX)';
    }
    
    if (!formData.address.trim()) newErrors.address = 'Required';
    if (!formData.city.trim()) newErrors.city = 'Required';
    
    if (!formData.businessDescription.trim()) {
      newErrors.businessDescription = 'Required';
    } else if (formData.businessDescription.trim().length < 20) {
      newErrors.businessDescription = 'Min 20 characters';
    }

    // Documents & bank - FIXED: only validate required fields
    const crDigits = formData.crNumber.replace(/\D/g, '');
    if (!crDigits) {
      newErrors.crNumber = 'Required';
    } else if (!/^\d{10}$/.test(crDigits)) {
      newErrors.crNumber = 'Must be 10 digits';
    }
    
    if (!formData.bankName.trim()) newErrors.bankName = 'Required';
    
    const accountDigits = formData.accountNumber.replace(/\D/g, '');
    if (!accountDigits) {
      newErrors.accountNumber = 'Required';
    } else if (!/^\d{10,20}$/.test(accountDigits)) {
      newErrors.accountNumber = '10-20 digits required';
    }
    
    const ibanClean = formData.iban.replace(/\s/g, '').toUpperCase();
    if (!ibanClean) {
      newErrors.iban = 'Required';
    } else if (!/^SA\d{22}$/.test(ibanClean)) {
      newErrors.iban = 'Invalid IBAN format (SA followed by 22 digits)';
    }

    // CR Document is optional, so no validation needed

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Generate application ID
  const generateApplicationId = (): string => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `SELL-${timestamp}${random}`;
  };

  // Upload file to storage
  const uploadFile = async (file: File, userId: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `seller-documents/${fileName}`;

      const { error } = await supabase.storage
        .from('public')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('public')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    }
  };

  // Check existing email
  const checkExistingEmail = async (email: string): Promise<boolean> => {
    try {
      const { data: authData } = await supabase.auth.admin.listUsers();
      if (authData?.users?.some(user => user.email === email)) return true;

      const { data: profileCheck } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email)
        .limit(1);
      if (profileCheck?.length) return true;

      const { data: appCheck } = await supabase
        .from('seller_applications')
        .select('email')
        .eq('email', email)
        .in('status', ['pending', 'approved'])
        .limit(1);
      return !!appCheck?.length;
    } catch {
      return false;
    }
  };

  // Create admin notification
  const createAdminNotification = async (applicationId: string, businessName: string, userId: string) => {
    try {
      const notificationId = uuidv4();
      await supabase
        .from('admin_notifications')
        .insert({
          id: notificationId,
          type: 'new_seller_application',
          title: 'New Seller Application',
          message: `${businessName} has submitted a seller application`,
          data: JSON.stringify({ 
            application_id: applicationId,
            business_name: businessName,
            user_id: userId
          }),
          read: false,
          priority: 'high',
          created_at: new Date().toISOString()
        });

      // Send real-time broadcast
      const adminChannel = supabase.channel('admin-dashboard');
      await adminChannel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          adminChannel.send({
            type: 'broadcast',
            event: 'new-seller-application',
            payload: {
              type: 'NEW_SELLER_APPLICATION',
              applicationId,
              businessName,
              userId,
              timestamp: new Date().toISOString(),
              immediateRefresh: true
            }
          });
        }
      });

      // Create activity log
      await supabase
        .from('activity_logs')
        .insert({
          user_id: userId,
          user_type: 'seller_pending',
          action: 'seller_application_submitted',
          target_type: 'seller_application',
          target_id: applicationId,
          details: JSON.stringify({
            business_name: businessName,
            email: formData.email,
            city: formData.city
          }),
          user_agent: navigator.userAgent,
          created_at: new Date().toISOString()
        });

    } catch (error) {
      console.error('Notification error:', error);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!validateForm()) {
      toast.error('Please fix all errors');
      return;
    }

    setIsSubmitting(true);
    const appId = generateApplicationId();
    setApplicationId(appId);

    try {
      // Check email availability
      const emailExists = await checkExistingEmail(formData.email);
      if (emailExists) {
        throw new Error('Email already registered. Please use a different email.');
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            user_type: 'seller_pending',
            business_name: formData.businessName,
            application_id: appId
          }
        }
      });

      if (authError) throw new Error(authError.message);
      if (!authData.user) throw new Error('No user created');

      const userId = authData.user.id;

      // Upload document if exists
      let crDocumentUrl = null;
      if (formData.crDocument) {
        crDocumentUrl = await uploadFile(formData.crDocument, userId);
      }

      // Create profile
      await supabase
        .from('profiles')
        .upsert({
          id: userId,
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.contactNumber.replace(/\D/g, ''),
          user_type: 'seller_pending',
          business_name: formData.businessName,
          business_type: formData.businessType,
          address: formData.address,
          city: formData.city,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      // Create seller application
      const applicationData = {
        id: uuidv4(),
        application_id: appId,
        user_id: userId,
        full_name: formData.fullName,
        email: formData.email,
        business_name: formData.businessName,
        contact_number: formData.contactNumber.replace(/\D/g, ''),
        address: formData.address,
        city: formData.city,
        business_type: formData.businessType,
        business_description: formData.businessDescription,
        cr_number: formData.crNumber.replace(/\D/g, ''),
        cr_document_url: crDocumentUrl,
        bank_name: formData.bankName,
        account_number: formData.accountNumber.replace(/\s/g, ''),
        iban: formData.iban.replace(/\s/g, '').toUpperCase(),
        status: 'pending',
        admin_notes: null,
        rejection_reason: null,
        reviewed_by: null,
        reviewed_at: null,
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: appError } = await supabase
        .from('seller_applications')
        .insert([applicationData]);

      if (appError) {
        console.error('Application insert error:', appError);
        throw new Error('Failed to save application: ' + appError.message);
      }

      console.log('✅ Application saved:', applicationData);

      // Send notification to admin
      await createAdminNotification(appId, formData.businessName, userId);

      // Success
      setShowSuccess(true);
      
      toast.success('Application submitted successfully!', {
        description: 'Admin has been notified and will review your application.',
        duration: 5000
      });

      // Auto-redirect after 5 seconds
      setTimeout(() => {
        if (onRegistrationComplete) {
          onRegistrationComplete();
        } else {
          window.location.href = '/seller/status';
        }
      }, 5000);

    } catch (error: any) {
      console.error('Registration error:', error);
      setSubmitError(error.message || 'Registration failed. Please try again.');
      toast.error('Registration failed', {
        description: error.message || 'Please try again later.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render success screen
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-whitesmoke rounded-xl border border-gray-300 p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-gray-300">
              <CheckCircle className="text-green-600" size={32} />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Application Submitted!</h1>
            <p className="text-gray-600 mb-6">
              Your application has been sent to admin for review. You'll receive an email notification when it's approved.
            </p>
            
            <div className="bg-white rounded-lg p-5 mb-6 border border-gray-300">
              <p className="text-sm font-semibold text-gray-800 mb-2">Application ID</p>
              <p className="font-mono font-bold text-gray-900 text-lg">{applicationId}</p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => window.location.href = '/seller/status'}
                className="w-full py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 font-semibold"
              >
                Track Application Status
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full py-2.5 bg-white text-gray-700 rounded-lg hover:bg-gray-50 font-medium border border-gray-300"
              >
                Return to Homepage
              </button>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-300">
              <div className="flex flex-col items-center gap-3 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Review time: 24-48 hours</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4" />
                  <span>Check email for updates</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render registration form
  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Seller Registration</h1>
            <p className="text-gray-600 mb-4">Complete all fields below to register your business</p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
              <Send className="w-4 h-4" />
              <span>Admin receives real-time notification</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="bg-whitesmoke rounded-xl border border-gray-300 p-6">
            {/* Error Display */}
            {submitError && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-red-500 mt-0.5" size={20} />
                  <p className="text-red-800">{submitError}</p>
                </div>
              </div>
            )}

            {/* Real-time indicator */}
            <div className="bg-white p-4 mb-6 rounded-lg border border-gray-300">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-200 rounded-lg">
                  <Send className="w-5 h-5 text-gray-700" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Real-time Application</p>
                  <p className="text-sm text-gray-700">Admin notified immediately upon submission</p>
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gray-200 rounded-lg">
                  <User className="w-6 h-6 text-gray-700" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Account Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                    placeholder="Your full legal name"
                  />
                  {errors.fullName && <p className="mt-2 text-sm text-red-600">{errors.fullName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                    placeholder="you@business.com"
                  />
                  {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                    placeholder="At least 6 characters"
                  />
                  {errors.password && <p className="mt-2 text-sm text-red-600">{errors.password}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                    placeholder="Re-enter your password"
                  />
                  {errors.confirmPassword && <p className="mt-2 text-sm text-red-600">{errors.confirmPassword}</p>}
                </div>
              </div>
            </div>

            {/* Business Information */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gray-200 rounded-lg">
                  <Store className="w-6 h-6 text-gray-700" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Business Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                    placeholder="Your official business name"
                  />
                  {errors.businessName && <p className="mt-2 text-sm text-red-600">{errors.businessName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Contact Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.contactNumber}
                    onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                    placeholder="05X XXX XXXX"
                    maxLength={12}
                  />
                  {errors.contactNumber && <p className="mt-2 text-sm text-red-600">{errors.contactNumber}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    City *
                  </label>
                  <select
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white"
                  >
                    <option value="">Select your city</option>
                    {saudiCities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                  {errors.city && <p className="mt-2 text-sm text-red-600">{errors.city}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Full Address *
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                    placeholder="Complete business address"
                  />
                  {errors.address && <p className="mt-2 text-sm text-red-600">{errors.address}</p>}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Business Type *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <label className={`flex items-center p-4 border rounded-lg cursor-pointer ${
                    formData.businessType === 'individual' 
                      ? 'border-gray-500 bg-white' 
                      : 'border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="businessType"
                      value="individual"
                      checked={formData.businessType === 'individual'}
                      onChange={(e) => handleInputChange('businessType', e.target.value)}
                      className="mr-3"
                    />
                    <div>
                      <p className="font-medium text-gray-900">Individual</p>
                      <p className="text-sm text-gray-600">Sole proprietorship</p>
                    </div>
                  </label>
                  <label className={`flex items-center p-4 border rounded-lg cursor-pointer ${
                    formData.businessType === 'sharkah' 
                      ? 'border-gray-500 bg-white' 
                      : 'border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="businessType"
                      value="sharkah"
                      checked={formData.businessType === 'sharkah'}
                      onChange={(e) => handleInputChange('businessType', e.target.value)}
                      className="mr-3"
                    />
                    <div>
                      <p className="font-medium text-gray-900">Large Company</p>
                      <p className="text-sm text-gray-600">(Sharkah)</p>
                    </div>
                  </label>
                  <label className={`flex items-center p-4 border rounded-lg cursor-pointer ${
                    formData.businessType === 'sijjal' 
                      ? 'border-gray-500 bg-white' 
                      : 'border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="businessType"
                      value="sijjal"
                      checked={formData.businessType === 'sijjal'}
                      onChange={(e) => handleInputChange('businessType', e.target.value)}
                      className="mr-3"
                    />
                    <div>
                      <p className="font-medium text-gray-900">Small Company</p>
                      <p className="text-sm text-gray-600">(Sijjal)</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Business Description *
                </label>
                <textarea
                  value={formData.businessDescription}
                  onChange={(e) => handleInputChange('businessDescription', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 resize-none"
                  placeholder="Describe your business, products, and experience..."
                  maxLength={500}
                />
                {errors.businessDescription && <p className="mt-2 text-sm text-red-600">{errors.businessDescription}</p>}
                <p className="mt-2 text-xs text-gray-500">
                  {formData.businessDescription.length}/500 characters (Minimum 20)
                </p>
              </div>
            </div>

            {/* Documents & Bank Information */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gray-200 rounded-lg">
                  <CreditCard className="w-6 h-6 text-gray-700" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Documents & Bank Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    CR Number *
                  </label>
                  <input
                    type="text"
                    value={formData.crNumber}
                    onChange={(e) => handleInputChange('crNumber', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                    placeholder="10-digit Commercial Registration"
                    maxLength={10}
                  />
                  {errors.crNumber && <p className="mt-2 text-sm text-red-600">{errors.crNumber}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    CR Document (Optional)
                  </label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer ${
                      formData.crDocument 
                        ? 'border-green-500 bg-white' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".jpg,.jpeg,.png,.pdf,.webp"
                      onChange={(e) => handleFileUpload(e.target.files)}
                    />
                    
                    {formData.crDocument ? (
                      <div>
                        <CheckCircle className="text-green-600 mx-auto mb-3" size={24} />
                        <p className="font-semibold text-gray-700 mb-1">{formData.crDocument.name}</p>
                        <p className="text-xs text-gray-500">
                          {(formData.crDocument.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <Upload className="mx-auto text-gray-400 mb-3" size={24} />
                        <p className="font-medium text-gray-700 mb-1">Upload CR Document</p>
                        <p className="text-sm text-gray-600">PDF, JPG, PNG (Max 5MB)</p>
                      </div>
                    )}
                  </div>
                  {errors.crDocument && <p className="mt-2 text-sm text-red-600">{errors.crDocument}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Bank Name *
                  </label>
                  <select
                    value={formData.bankName}
                    onChange={(e) => handleInputChange('bankName', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white"
                  >
                    <option value="">Select your bank</option>
                    {saudiBanks.map(bank => (
                      <option key={bank} value={bank}>{bank}</option>
                    ))}
                  </select>
                  {errors.bankName && <p className="mt-2 text-sm text-red-600">{errors.bankName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    value={formData.accountNumber}
                    onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                    placeholder="XXXX XXXX XXXX XXXX"
                    maxLength={23}
                  />
                  {errors.accountNumber && <p className="mt-2 text-sm text-red-600">{errors.accountNumber}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    IBAN Number *
                  </label>
                  <input
                    type="text"
                    value={formData.iban}
                    onChange={(e) => handleInputChange('iban', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                    placeholder="SAXX XXXX XXXX XXXX XXXX XXXX"
                    maxLength={34}
                  />
                  {errors.iban && <p className="mt-2 text-sm text-red-600">{errors.iban}</p>}
                </div>
              </div>
            </div>

            {/* Submit Section */}
            <div className="bg-white p-6 rounded-lg border border-gray-300">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Ready to submit?</p>
                  <p className="text-sm text-gray-600">Admin will review your application in 24-48 hours</p>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3.5 bg-gray-800 text-white rounded-lg hover:bg-gray-900 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="bg-whitesmoke rounded-lg border border-gray-300 p-6 mb-4">
            <p className="font-semibold text-gray-900 mb-2">Need Assistance?</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="flex items-center gap-2 text-gray-700">
                <Mail size={16} />
                <span>support@furnituremarket.com</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Phone size={16} />
                <span>+966 11 234 5678</span>
              </div>
            </div>
          </div>
          
          <p className="text-gray-600 mb-2">Already have a seller account?</p>
          <a 
            href="/seller/login" 
            className="text-gray-800 hover:text-gray-900 font-semibold hover:underline"
          >
            Login to Seller Dashboard
          </a>
          
          <div className="mt-6 pt-4 border-t border-gray-300">
            <p className="text-sm text-gray-600">
              By submitting, you agree to our 
              <a href="/terms" className="text-gray-800 hover:underline mx-1">Terms</a>
              and
              <a href="/privacy" className="text-gray-800 hover:underline ml-1">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerRegistration;