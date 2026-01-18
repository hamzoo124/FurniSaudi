import React, { useState, useEffect, useRef } from 'react';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  AiOutlineArrowLeft,
  AiOutlineDownload,
  AiOutlinePrinter,
  AiOutlineMail,
  AiOutlineEdit,
  AiOutlineCheck,
  AiOutlineClose,
  AiOutlineFilePdf,
  AiOutlineCalendar,
  AiOutlineDollar,
  AiOutlineUser,
  AiOutlineBuild,
  AiOutlinePhone,
  AiOutlineEnvironment,
  AiOutlineSafetyCertificate,
  AiOutlineFileText,
  AiOutlineSignature,
  AiOutlineShoppingCart,
  AiOutlineHome,
  AiOutlineSave,
  AiOutlinePlus,
  AiOutlineMinus,
  AiOutlineInfoCircle,
  AiOutlineLock,
  AiOutlineColumnHeight, // Replaced AiOutlineRuler with AiOutlineColumnHeight
  AiOutlineSchedule,
  AiOutlineClockCircle,
  AiOutlineFieldTime,
  AiOutlineContainer,
  AiOutlineCar,
  AiOutlineTool,
  AiOutlineTags,
  AiOutlineArrowsAlt // Added for dimensions/measurement icon
} from 'react-icons/ai';

interface ContractProps {
  onBack: () => void;
  onNavigate?: (page: string) => void;
  contractData?: Contract;
  productData?: any;
  measurementData?: any;
}

interface Contract {
  id: string;
  contractNumber: string;
  status: 'draft' | 'sent' | 'accepted' | 'completed' | 'cancelled' | 'measurement_pending';
  createdAt: string;
  lastUpdated: string;
  contractType: 'b2b' | 'b2c';
  seller: CompanyInfo;
  buyer: CustomerInfo;
  products: ProductItem[];
  equipment: EquipmentItem[];
  accessories: AccessoryItem[];
  paymentTerms: PaymentTerms;
  delivery: DeliveryInfo;
  warranty: WarrantyInfo;
  terms: TermsAndConditions;
  signatures: Signatures;
  measurementRequestId?: string;
  measurementNotes?: string;
  specialRequirements?: string;
  measurementScheduledDate?: string;
  measurementScheduledTime?: string;
  measurementStatus?: 'pending' | 'scheduled' | 'completed' | 'cancelled';
}

interface CustomerInfo {
  type: 'b2b' | 'b2c';
  name: string;
  email: string;
  phone: string;
  companyName?: string;
  crNumber?: string;
  taxNumber?: string;
  address: string;
  representative?: string;
  position?: string;
}

interface CompanyInfo {
  type: 'b2b' | 'b2c';
  name: string;
  crNumber: string;
  taxNumber: string;
  address: string;
  phone: string;
  email: string;
  representative: string;
  position: string;
}

interface ProductItem {
  id: string;
  name: string;
  image: string;
  description: string;
  materials: string[];
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specifications: {
    dimensions: string;
    weight: string;
    color: string;
    material: string;
  };
  measurementRequired: boolean;
  measurementNotes?: string;
}

interface EquipmentItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  description?: string;
}

interface AccessoryItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category: string;
}

interface PaymentTerms {
  totalAmount: number;
  vat: number;
  vatAmount: number;
  currency: string;
  deposit: number;
  depositDueDate: string;
  finalPaymentDue: string;
  paymentMethod: string;
  installmentPlan?: Installment[];
}

interface Installment {
  amount: number;
  dueDate: string;
  percentage: number;
}

interface DeliveryInfo {
  address: string;
  estimatedDate: string;
  installationIncluded: boolean;
  shippingCost: number;
  notes: string;
  specialInstructions?: string;
}

interface WarrantyInfo {
  duration: string;
  coverage: string[];
  limitations: string[];
}

interface TermsAndConditions {
  cancellationPolicy: string;
  returnPolicy: string;
  liability: string;
  governingLaw: string;
  forceMajeure: string;
  measurementPolicy?: string;
}

interface Signatures {
  sellerSigned: boolean;
  buyerSigned: boolean;
  sellerSignature?: string;
  buyerSignature?: string;
  signedDate?: string;
  measurementApproved?: boolean;
  measurementApprovedDate?: string;
}

// Field Ownership System
type FieldSource = 'buyer' | 'seller' | 'product' | 'platform' | 'measurement';
type UserRole = 'seller' | 'buyer' | 'admin';

interface FieldOwnership {
  source: FieldSource;
  editableBy?: UserRole | 'both' | 'none';
}

// Field ownership mapping
const fieldOwnership: Record<string, FieldOwnership> = {
  // Buyer Info Section
  'buyer.name': { source: 'buyer', editableBy: 'none' },
  'buyer.email': { source: 'buyer', editableBy: 'none' },
  'buyer.phone': { source: 'buyer', editableBy: 'none' },
  'buyer.address': { source: 'buyer', editableBy: 'none' },
  'buyer.companyName': { source: 'buyer', editableBy: 'none' },
  'buyer.crNumber': { source: 'buyer', editableBy: 'none' },
  'buyer.taxNumber': { source: 'buyer', editableBy: 'none' },
  'buyer.representative': { source: 'buyer', editableBy: 'none' },
  'buyer.position': { source: 'buyer', editableBy: 'none' },
  
  // Seller Info Section
  'seller.name': { source: 'seller', editableBy: 'seller' },
  'seller.email': { source: 'seller', editableBy: 'seller' },
  'seller.phone': { source: 'seller', editableBy: 'seller' },
  'seller.address': { source: 'seller', editableBy: 'seller' },
  'seller.companyName': { source: 'seller', editableBy: 'seller' },
  'seller.crNumber': { source: 'seller', editableBy: 'seller' },
  'seller.taxNumber': { source: 'seller', editableBy: 'seller' },
  'seller.representative': { source: 'seller', editableBy: 'seller' },
  'seller.position': { source: 'seller', editableBy: 'seller' },
  
  // Product Specifications
  'products.*.name': { source: 'product', editableBy: 'none' },
  'products.*.description': { source: 'product', editableBy: 'none' },
  'products.*.specifications': { source: 'measurement', editableBy: 'seller' },
  'products.*.materials': { source: 'product', editableBy: 'seller' },
  'products.*.measurementNotes': { source: 'measurement', editableBy: 'seller' },
  
  // Equipment & Accessories
  'equipment': { source: 'seller', editableBy: 'seller' },
  'accessories': { source: 'seller', editableBy: 'seller' },
  
  // Pricing
  'products.*.quantity': { source: 'seller', editableBy: 'seller' },
  'products.*.unitPrice': { source: 'seller', editableBy: 'seller' },
  'paymentTerms.totalAmount': { source: 'seller', editableBy: 'seller' },
  'paymentTerms.vat': { source: 'platform', editableBy: 'none' },
  
  // Terms & Conditions
  'terms.cancellationPolicy': { source: 'platform', editableBy: 'none' },
  'terms.returnPolicy': { source: 'platform', editableBy: 'none' },
  'terms.liability': { source: 'platform', editableBy: 'none' },
  'terms.governingLaw': { source: 'platform', editableBy: 'none' },
  'terms.forceMajeure': { source: 'platform', editableBy: 'none' },
  'terms.measurementPolicy': { source: 'platform', editableBy: 'none' },
  
  // Delivery Info
  'delivery.address': { source: 'buyer', editableBy: 'none' },
  'delivery.estimatedDate': { source: 'seller', editableBy: 'seller' },
  'delivery.installationIncluded': { source: 'seller', editableBy: 'seller' },
  'delivery.shippingCost': { source: 'seller', editableBy: 'seller' },
  'delivery.notes': { source: 'seller', editableBy: 'seller' },
  'delivery.specialInstructions': { source: 'buyer', editableBy: 'buyer' },
  
  // Measurement Info
  'measurementScheduledDate': { source: 'measurement', editableBy: 'seller' },
  'measurementScheduledTime': { source: 'measurement', editableBy: 'seller' },
  'measurementNotes': { source: 'measurement', editableBy: 'both' },
  'specialRequirements': { source: 'buyer', editableBy: 'buyer' },
  
  // Warranty Info
  'warranty.duration': { source: 'platform', editableBy: 'none' },
  'warranty.coverage': { source: 'platform', editableBy: 'none' },
  'warranty.limitations': { source: 'platform', editableBy: 'none' },
};

// Helper functions
const isFieldEditable = (fieldSource: FieldOwnership, userRole: UserRole): boolean => {
  if (fieldSource.editableBy === 'none') return false;
  if (fieldSource.editableBy === userRole) return true;
  if (fieldSource.editableBy === 'both') return true;
  return false;
};

const getFieldSourceHelper = (source: FieldSource): string => {
  switch (source) {
    case 'buyer': return 'Information provided by buyer';
    case 'seller': return 'Filled by service provider';
    case 'product': return 'Product information';
    case 'platform': return 'Platform terms and conditions';
    case 'measurement': return 'Based on measurement data';
    default: return '';
  }
};

const getSourceColor = (source: FieldSource): string => {
  switch (source) {
    case 'buyer': return 'bg-blue-50 text-blue-700 border border-blue-200';
    case 'seller': return 'bg-green-50 text-green-700 border border-green-200';
    case 'product': return 'bg-purple-50 text-purple-700 border border-purple-200';
    case 'platform': return 'bg-gray-100 text-gray-700 border border-gray-300';
    case 'measurement': return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
    default: return 'bg-gray-50 text-gray-700';
  }
};

// Default company data
const defaultCompany: CompanyInfo = {
  type: 'b2b',
  name: 'Giga Home Furniture',
  crNumber: '1010567890',
  taxNumber: '310456789012345',
  address: '123 Business District, Riyadh 11564, Saudi Arabia',
  phone: '+966 11 123 4567',
  email: 'contracts@gigahome.com',
  representative: 'Ahmed Al-Rashid',
  position: 'Sales Manager'
};

// Default VAT
const DEFAULT_VAT = 15;

// Default contract with measurement integration
const defaultContract: Contract = {
  id: 'CT-2024-001',
  contractNumber: 'GH-CONTRACT-2024-001',
  status: 'draft',
  createdAt: new Date().toISOString().split('T')[0],
  lastUpdated: new Date().toISOString().split('T')[0],
  contractType: 'b2c',
  seller: defaultCompany,
  buyer: {
    type: 'b2c',
    name: '',
    email: '',
    phone: '',
    companyName: '',
    crNumber: '',
    taxNumber: '',
    address: '',
    representative: '',
    position: ''
  },
  products: [],
  equipment: [],
  accessories: [],
  paymentTerms: {
    totalAmount: 0,
    vat: DEFAULT_VAT,
    vatAmount: 0,
    currency: 'SAR',
    deposit: 0,
    depositDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    finalPaymentDue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    paymentMethod: 'Bank Transfer',
    installmentPlan: []
  },
  delivery: {
    address: '',
    estimatedDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    installationIncluded: true,
    shippingCost: 0,
    notes: 'Delivery between 9 AM - 5 PM, Monday to Friday'
  },
  warranty: {
    duration: '24 months',
    coverage: [
      'Manufacturing defects',
      'Structural integrity',
      'Material quality',
      'Hardware functionality'
    ],
    limitations: [
      'Normal wear and tear',
      'Damage from improper use',
      'Modifications by third parties',
      'Commercial misuse'
    ]
  },
  terms: {
    cancellationPolicy: 'Orders can be cancelled within 7 days with full refund. After 7 days, 50% cancellation fee applies.',
    returnPolicy: 'Products can be returned within 14 days if unused and in original packaging. Return shipping costs borne by buyer.',
    liability: 'Seller liability limited to product replacement or repair. Not liable for consequential damages.',
    governingLaw: 'Laws of the Kingdom of Saudi Arabia',
    forceMajeure: 'Neither party liable for delays due to circumstances beyond reasonable control.',
    measurementPolicy: 'Measurement appointments must be confirmed 24 hours in advance. Cancellations less than 24 hours may incur fees.'
  },
  signatures: {
    sellerSigned: false,
    buyerSigned: false
  }
};

// Field with Source Indicator Component
const FieldWithSource: React.FC<{
  fieldKey: string;
  source: FieldSource;
  children: React.ReactNode;
}> = ({ fieldKey, source, children }) => {
  return (
    <div className="relative mb-2">
      {children}
      <div className={`absolute -top-3 right-0 px-2 py-1 text-xs rounded-full ${getSourceColor(source)} flex items-center space-x-1`}>
        <AiOutlineInfoCircle size={12} />
        <span>{getFieldSourceHelper(source)}</span>
      </div>
    </div>
  );
};

const Contracts: React.FC<ContractProps> = ({ onBack, onNavigate, contractData, productData, measurementData }) => {
  const [currentContract, setCurrentContract] = useState<Contract>(contractData || defaultContract);
  const [isEditing, setIsEditing] = useState(contractData?.status === 'draft' || contractData?.status === 'measurement_pending');
  const [products, setProducts] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<UserRole>('seller');
  const [measurementComplete, setMeasurementComplete] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  // Load user role
  useEffect(() => {
    const savedRole = localStorage.getItem('userRole') as UserRole;
    if (savedRole) {
      setUserRole(savedRole);
    }
  }, []);

  // Load measurement data if provided
  useEffect(() => {
    if (measurementData) {
      console.log('📐 Loading measurement data into contract:', measurementData);
      
      const buyerInfo: CustomerInfo = {
        type: 'b2c',
        name: measurementData.buyerName,
        email: measurementData.buyerEmail,
        phone: measurementData.buyerPhone,
        address: measurementData.buyerAddress,
        companyName: '',
        crNumber: '',
        taxNumber: '',
        representative: measurementData.buyerName,
        position: 'Customer'
      };

      const productItem: ProductItem = {
        id: measurementData.productId,
        name: measurementData.productName,
        image: measurementData.productImage,
        description: 'Custom furniture requiring professional measurement',
        materials: ['To be determined after measurement'],
        quantity: 1,
        unitPrice: measurementData.estimatedBudget || 0,
        totalPrice: measurementData.estimatedBudget || 0,
        specifications: {
          dimensions: 'To be determined after measurement',
          weight: 'To be determined',
          color: 'To be selected',
          material: 'To be determined'
        },
        measurementRequired: true,
        measurementNotes: measurementData.measurementNotes
      };

      const updatedContract: Contract = {
        ...currentContract,
        id: measurementData.contractId || `CT-${Date.now()}`,
        contractNumber: measurementData.contractId || `CT-${Date.now()}`,
        status: 'measurement_pending',
        buyer: buyerInfo,
        products: [productItem],
        measurementRequestId: measurementData.id,
        measurementNotes: measurementData.measurementNotes,
        specialRequirements: measurementData.specialRequirements,
        measurementScheduledDate: measurementData.preferredDate,
        measurementScheduledTime: measurementData.preferredTime,
        measurementStatus: 'pending',
        delivery: {
          ...currentContract.delivery,
          address: measurementData.buyerAddress
        }
      };

      setCurrentContract(updatedContract);
    }
  }, [measurementData]);

  // Load products from localStorage
  useEffect(() => {
    const loadProducts = () => {
      try {
        const savedProducts = localStorage.getItem('furnitureProducts');
        if (savedProducts) {
          const parsedProducts = JSON.parse(savedProducts);
          setProducts(parsedProducts);
          
          if (productData && !contractData && !measurementData) {
            const productItem: ProductItem = {
              id: productData.id,
              name: productData.name,
              image: productData.image || productData.images?.[0] || 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
              description: productData.description || productData.shortDescription,
              materials: productData.materials || [productData.material || 'Solid Wood'],
              quantity: 1,
              unitPrice: parseFloat(productData.price) || 0,
              totalPrice: parseFloat(productData.price) || 0,
              specifications: {
                dimensions: productData.dimensions ? 
                  `${productData.dimensions.length} × ${productData.dimensions.width} × ${productData.dimensions.height} ${productData.dimensions.unit}` 
                  : 'Standard dimensions',
                weight: productData.weight || 'N/A',
                color: productData.primaryColor || 'N/A',
                material: productData.material || 'N/A'
              },
              measurementRequired: productData.type === 'customized',
              measurementNotes: ''
            };

            setCurrentContract(prev => ({
              ...prev,
              products: [...prev.products, productItem]
            }));
          }
        }
      } catch (error) {
        console.error('Error loading products:', error);
      }
    };

    loadProducts();
  }, [productData, contractData, measurementData]);

  // Auto-fill buyer data from localStorage
  useEffect(() => {
    const loadBuyerData = () => {
      const buyerProfile = JSON.parse(localStorage.getItem('buyerProfile') || '{}');
      if (Object.keys(buyerProfile).length > 0 && !currentContract.buyer.name) {
        setCurrentContract(prev => ({
          ...prev,
          buyer: {
            ...prev.buyer,
            name: buyerProfile.name || '',
            email: buyerProfile.email || '',
            phone: buyerProfile.phone || '',
            address: buyerProfile.address || '',
            companyName: buyerProfile.companyName || '',
            crNumber: buyerProfile.crNumber || '',
            taxNumber: buyerProfile.taxNumber || '',
            representative: buyerProfile.representative || buyerProfile.name || '',
            position: buyerProfile.position || 'Customer'
          }
        }));
      }
    };

    loadBuyerData();
  }, []);

  // Auto-fill seller data from localStorage
  useEffect(() => {
    const loadSellerData = () => {
      const sellerProfile = JSON.parse(localStorage.getItem('sellerProfile') || '{}');
      if (Object.keys(sellerProfile).length > 0) {
        setCurrentContract(prev => ({
          ...prev,
          seller: {
            ...prev.seller,
            name: sellerProfile.name || defaultCompany.name,
            email: sellerProfile.email || defaultCompany.email,
            phone: sellerProfile.phone || defaultCompany.phone,
            address: sellerProfile.address || defaultCompany.address,
            companyName: sellerProfile.companyName || defaultCompany.name,
            crNumber: sellerProfile.crNumber || defaultCompany.crNumber,
            taxNumber: sellerProfile.taxNumber || defaultCompany.taxNumber,
            representative: sellerProfile.representative || defaultCompany.representative,
            position: sellerProfile.position || defaultCompany.position
          }
        }));
      }
    };

    loadSellerData();
  }, []);

  // Calculate totals
  useEffect(() => {
    const productsTotal = currentContract.products.reduce((sum, product) => sum + product.totalPrice, 0);
    const equipmentTotal = currentContract.equipment.reduce((sum, item) => sum + item.totalPrice, 0);
    const accessoriesTotal = currentContract.accessories.reduce((sum, item) => sum + item.totalPrice, 0);
    const subtotal = productsTotal + equipmentTotal + accessoriesTotal;
    const vatAmount = subtotal * (currentContract.paymentTerms.vat / 100);
    const totalAmount = subtotal + vatAmount;
    
    setCurrentContract(prev => ({
      ...prev,
      paymentTerms: {
        ...prev.paymentTerms,
        totalAmount,
        vatAmount,
        deposit: totalAmount * 0.5
      }
    }));
  }, [currentContract.products, currentContract.equipment, currentContract.accessories, currentContract.paymentTerms.vat]);

  // Equipment functions
  const handleAddEquipment = () => {
    const newEquipment: EquipmentItem = {
      id: Date.now().toString(),
      name: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      description: ''
    };
    
    setCurrentContract(prev => ({
      ...prev,
      equipment: [...prev.equipment, newEquipment]
    }));
  };

  const handleRemoveEquipment = (equipmentId: string) => {
    setCurrentContract(prev => ({
      ...prev,
      equipment: prev.equipment.filter(item => item.id !== equipmentId)
    }));
  };

  const handleEquipmentFieldChange = (equipmentId: string, field: keyof EquipmentItem, value: any) => {
    setCurrentContract(prev => ({
      ...prev,
      equipment: prev.equipment.map(item => {
        if (item.id === equipmentId) {
          const updatedItem = {
            ...item,
            [field]: field === 'quantity' || field === 'unitPrice' ? parseFloat(value) || 0 : value
          };
          
          if (field === 'quantity' || field === 'unitPrice') {
            updatedItem.totalPrice = updatedItem.quantity * updatedItem.unitPrice;
          }
          
          return updatedItem;
        }
        return item;
      })
    }));
  };

  // Accessories functions
  const handleAddAccessory = () => {
    const newAccessory: AccessoryItem = {
      id: Date.now().toString(),
      name: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      category: 'Hardware'
    };
    
    setCurrentContract(prev => ({
      ...prev,
      accessories: [...prev.accessories, newAccessory]
    }));
  };

  const handleRemoveAccessory = (accessoryId: string) => {
    setCurrentContract(prev => ({
      ...prev,
      accessories: prev.accessories.filter(item => item.id !== accessoryId)
    }));
  };

  const handleAccessoryFieldChange = (accessoryId: string, field: keyof AccessoryItem, value: any) => {
    setCurrentContract(prev => ({
      ...prev,
      accessories: prev.accessories.map(item => {
        if (item.id === accessoryId) {
          const updatedItem = {
            ...item,
            [field]: field === 'quantity' || field === 'unitPrice' ? parseFloat(value) || 0 : value
          };
          
          if (field === 'quantity' || field === 'unitPrice') {
            updatedItem.totalPrice = updatedItem.quantity * updatedItem.unitPrice;
          }
          
          return updatedItem;
        }
        return item;
      })
    }));
  };

  // Product functions
  const handleAddDefaultFurniture = () => {
    const newProduct: ProductItem = {
      id: Date.now().toString(),
      name: 'Custom Furniture Item',
      image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80',
      description: 'High-quality custom furniture piece',
      materials: ['Solid Wood', 'Premium Finish'],
      quantity: 1,
      unitPrice: 750,
      totalPrice: 750,
      specifications: {
        dimensions: 'Custom dimensions',
        weight: 'Custom weight',
        color: 'Custom color',
        material: 'Solid Wood'
      },
      measurementRequired: true,
      measurementNotes: 'Requires on-site measurement'
    };

    setCurrentContract(prev => ({
      ...prev,
      products: [...prev.products, newProduct]
    }));
  };

  const handleAddProduct = () => {
    if (products.length > 0) {
      const product = products[0];
      const productItem: ProductItem = {
        id: product.id,
        name: product.name,
        image: product.image,
        description: product.description,
        materials: [product.material || 'Solid Wood'],
        quantity: 1,
        unitPrice: parseFloat(product.price) || 0,
        totalPrice: parseFloat(product.price) || 0,
        specifications: {
          dimensions: product.dimensions ? 
            `${product.dimensions.length} × ${product.dimensions.width} × ${product.dimensions.height} ${product.dimensions.unit}` 
            : 'Standard dimensions',
          weight: product.weight || 'N/A',
          color: product.primaryColor || 'N/A',
          material: product.material || 'N/A'
        },
        measurementRequired: product.type === 'customized',
        measurementNotes: product.type === 'customized' ? 'Requires measurement' : ''
      };

      setCurrentContract(prev => ({
        ...prev,
        products: [...prev.products, productItem]
      }));
    }
  };

  const handleRemoveProduct = (productId: string) => {
    setCurrentContract(prev => ({
      ...prev,
      products: prev.products.filter(p => p.id !== productId)
    }));
  };

  const handleProductQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    setCurrentContract(prev => ({
      ...prev,
      products: prev.products.map(product => 
        product.id === productId 
          ? {
              ...product,
              quantity: newQuantity,
              totalPrice: product.unitPrice * newQuantity
            }
          : product
      )
    }));
  };

  const handleProductSpecificationChange = (productId: string, field: keyof ProductItem['specifications'], value: string) => {
    setCurrentContract(prev => ({
      ...prev,
      products: prev.products.map(product => 
        product.id === productId 
          ? {
              ...product,
              specifications: {
                ...product.specifications,
                [field]: value
              }
            }
          : product
      )
    }));
  };

  // Field change handlers
  const handleBuyerFieldChange = (field: keyof CustomerInfo, value: string) => {
    setCurrentContract(prev => ({
      ...prev,
      buyer: {
        ...prev.buyer,
        [field]: value
      }
    }));
  };

  const handleSellerFieldChange = (field: keyof CompanyInfo, value: string) => {
    setCurrentContract(prev => ({
      ...prev,
      seller: {
        ...prev.seller,
        [field]: value
      }
    }));
  };

  const handleContractTypeChange = (type: 'b2b' | 'b2c') => {
    setCurrentContract(prev => ({
      ...prev,
      contractType: type,
      buyer: {
        ...prev.buyer,
        type: type
      }
    }));
  };

  const handleDeliveryFieldChange = (field: keyof DeliveryInfo, value: any) => {
    setCurrentContract(prev => ({
      ...prev,
      delivery: {
        ...prev.delivery,
        [field]: value
      }
    }));
  };

  const handlePaymentFieldChange = (field: keyof PaymentTerms, value: any) => {
    setCurrentContract(prev => ({
      ...prev,
      paymentTerms: {
        ...prev.paymentTerms,
        [field]: value
      }
    }));
  };

  const handleMeasurementComplete = () => {
    setMeasurementComplete(true);
    
    // Update contract status and add measurement approval
    setCurrentContract(prev => ({
      ...prev,
      status: 'draft',
      measurementStatus: 'completed',
      signatures: {
        ...prev.signatures,
        measurementApproved: true,
        measurementApprovedDate: new Date().toISOString().split('T')[0]
      },
      lastUpdated: new Date().toISOString().split('T')[0]
    }));

    // Auto-populate product specifications based on typical measurements
    if (currentContract.products.length > 0) {
      const updatedProducts = currentContract.products.map(product => ({
        ...product,
        specifications: {
          dimensions: 'Custom dimensions as measured on-site',
          weight: 'Approximate weight after measurement',
          color: 'Selected during measurement',
          material: 'Confirmed during measurement'
        },
        measurementNotes: 'Measurement completed and specifications confirmed'
      }));

      setCurrentContract(prev => ({
        ...prev,
        products: updatedProducts
      }));
    }

    alert('✅ Measurement marked as complete! Product specifications have been updated based on measurement data.');
  };

  // Existing contract functions
  const handleSendContract = () => {
    if (currentContract.status === 'measurement_pending' && !measurementComplete) {
      alert('Please complete measurement before sending contract');
      return;
    }

    setCurrentContract(prev => ({ 
      ...prev, 
      status: 'sent',
      lastUpdated: new Date().toISOString().split('T')[0]
    }));
    setIsEditing(false);
    saveContractToStorage();
    alert('Contract sent to customer!');
  };

  const handleAcceptContract = () => {
    setCurrentContract(prev => ({ 
      ...prev, 
      status: 'accepted',
      signatures: {
        ...prev.signatures,
        buyerSigned: true,
        signedDate: new Date().toISOString().split('T')[0]
      },
      lastUpdated: new Date().toISOString().split('T')[0]
    }));
    saveContractToStorage();
    alert('Contract accepted and signed!');
  };

  const handleSaveContract = () => {
    setCurrentContract(prev => ({ 
      ...prev, 
      lastUpdated: new Date().toISOString().split('T')[0]
    }));
    setIsEditing(false);
    saveContractToStorage();
    alert('Contract saved successfully!');
  };

  const saveContractToStorage = () => {
    try {
      const existingContracts = JSON.parse(localStorage.getItem('contracts') || '[]');
      const updatedContracts = existingContracts.filter((c: Contract) => c.id !== currentContract.id);
      localStorage.setItem('contracts', JSON.stringify([...updatedContracts, currentContract]));

      // Also save to seller-specific contracts
      const sellerContractsKey = `seller_${currentContract.seller.name.replace(/\s+/g, '_')}_contracts`;
      const sellerContracts = JSON.parse(localStorage.getItem(sellerContractsKey) || '[]');
      const updatedSellerContracts = sellerContracts.filter((c: Contract) => c.id !== currentContract.id);
      localStorage.setItem(sellerContractsKey, JSON.stringify([...updatedSellerContracts, currentContract]));

      // Save to buyer-specific contracts if buyer has ID
      if (currentContract.buyer.email) {
        const buyerContractsKey = `buyer_${currentContract.buyer.email.replace(/[@.]/g, '_')}_contracts`;
        const buyerContracts = JSON.parse(localStorage.getItem(buyerContractsKey) || '[]');
        const updatedBuyerContracts = buyerContracts.filter((c: Contract) => c.id !== currentContract.id);
        localStorage.setItem(buyerContractsKey, JSON.stringify([...updatedBuyerContracts, currentContract]));
      }
    } catch (error) {
      console.error('Error saving contract:', error);
    }
  };

  const handleEditToggle = () => {
    if (currentContract.status === 'accepted' || currentContract.status === 'completed') {
      alert('Cannot edit accepted or completed contracts');
      return;
    }
    setIsEditing(!isEditing);
  };

  // PDF functions
  const handleDownloadPDF = async () => {
    if (!pdfRef.current) return;

    const canvas = await html2canvas(pdfRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`contract-${currentContract.contractNumber}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper functions
  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-700 border border-gray-300',
      measurement_pending: 'bg-yellow-100 text-yellow-700 border border-yellow-300',
      sent: 'bg-blue-100 text-blue-700 border border-blue-300',
      accepted: 'bg-green-100 text-green-700 border border-green-300',
      completed: 'bg-green-100 text-green-700 border border-green-300',
      cancelled: 'bg-red-100 text-red-700 border border-red-300'
    };
    return colors[status as keyof typeof colors] || colors.draft;
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    return timeString.replace('-', ' to ');
  };

  // Check if field is editable
  const checkFieldEditable = (fieldKey: string): boolean => {
    const ownership = fieldOwnership[fieldKey];
    if (!ownership) return false;
    return isFieldEditable(ownership, userRole);
  };

  // Render Measurement Section
  const renderMeasurementSection = () => {
    if (!currentContract.measurementRequestId && !currentContract.measurementScheduledDate) return null;

    return (
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-6 mb-6">
        <FieldWithSource fieldKey="measurementScheduledDate" source="measurement">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AiOutlineColumnHeight className="mr-2 text-indigo-600" />
            Measurement Details
          </h3>
        </FieldWithSource>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-lg p-4 border border-indigo-100">
            <div className="flex items-center mb-2">
              <AiOutlineSchedule className="text-indigo-500 mr-2" />
              <span className="font-medium text-gray-700">Scheduled Date</span>
            </div>
            {isEditing && checkFieldEditable('measurementScheduledDate') ? (
              <input
                type="date"
                value={currentContract.measurementScheduledDate || ''}
                onChange={(e) => setCurrentContract(prev => ({
                  ...prev,
                  measurementScheduledDate: e.target.value
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            ) : (
              <p className="text-gray-900 font-semibold">
                {currentContract.measurementScheduledDate ? formatDate(currentContract.measurementScheduledDate) : 'Not scheduled'}
              </p>
            )}
          </div>

          <div className="bg-white rounded-lg p-4 border border-indigo-100">
            <div className="flex items-center mb-2">
              <AiOutlineClockCircle className="text-indigo-500 mr-2" />
              <span className="font-medium text-gray-700">Scheduled Time</span>
            </div>
            {isEditing && checkFieldEditable('measurementScheduledTime') ? (
              <select
                value={currentContract.measurementScheduledTime || ''}
                onChange={(e) => setCurrentContract(prev => ({
                  ...prev,
                  measurementScheduledTime: e.target.value
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select Time</option>
                <option value="08:00-10:00">8:00 AM - 10:00 AM</option>
                <option value="10:00-12:00">10:00 AM - 12:00 PM</option>
                <option value="12:00-14:00">12:00 PM - 2:00 PM</option>
                <option value="14:00-16:00">2:00 PM - 4:00 PM</option>
                <option value="16:00-18:00">4:00 PM - 6:00 PM</option>
              </select>
            ) : (
              <p className="text-gray-900 font-semibold">
                {currentContract.measurementScheduledTime ? formatTime(currentContract.measurementScheduledTime) : 'Not scheduled'}
              </p>
            )}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Measurement Notes</label>
          {isEditing && checkFieldEditable('measurementNotes') ? (
            <textarea
              value={currentContract.measurementNotes || ''}
              onChange={(e) => setCurrentContract(prev => ({
                ...prev,
                measurementNotes: e.target.value
              }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
              placeholder="Notes from the measurement appointment..."
            />
          ) : (
            <p className="text-gray-700 bg-white p-3 rounded-lg border border-gray-200">
              {currentContract.measurementNotes || 'No measurement notes available'}
            </p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Special Requirements</label>
          {isEditing && checkFieldEditable('specialRequirements') ? (
            <textarea
              value={currentContract.specialRequirements || ''}
              onChange={(e) => setCurrentContract(prev => ({
                ...prev,
                specialRequirements: e.target.value
              }))}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
              placeholder="Any special requirements from the customer..."
            />
          ) : (
            <p className="text-gray-700 bg-white p-3 rounded-lg border border-gray-200">
              {currentContract.specialRequirements || 'No special requirements'}
            </p>
          )}
        </div>

        {currentContract.status === 'measurement_pending' && userRole === 'seller' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-yellow-800 mb-1">Measurement Pending</h4>
                <p className="text-sm text-yellow-700">Complete measurement to finalize contract details</p>
              </div>
              <button
                onClick={handleMeasurementComplete}
                className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors flex items-center space-x-2"
              >
                <AiOutlineCheck size={18} />
                <span>Mark Measurement Complete</span>
              </button>
            </div>
          </div>
        )}

        {measurementComplete && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <AiOutlineCheck className="text-green-500 mr-2" size={20} />
              <div>
                <h4 className="font-semibold text-green-800">Measurement Completed</h4>
                <p className="text-sm text-green-700">Product specifications have been updated based on measurement data</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render Equipment Section
  const renderEquipmentSection = () => {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <FieldWithSource fieldKey="equipment" source="seller">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <AiOutlineTool className="mr-2" />
              Equipment
            </h3>
          </FieldWithSource>
          {isEditing && checkFieldEditable('equipment') && (
            <button
              onClick={handleAddEquipment}
              className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <AiOutlinePlus size={16} />
              <span>Add Equipment</span>
            </button>
          )}
        </div>
        
        {currentContract.equipment.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <AiOutlineTool className="mx-auto text-3xl mb-2" />
            <p>No equipment added</p>
          </div>
        ) : (
          <div className="space-y-4">
            {currentContract.equipment.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    {isEditing && checkFieldEditable('equipment') ? (
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleEquipmentFieldChange(item.id, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
                        placeholder="Equipment name"
                      />
                    ) : (
                      <h4 className="font-bold text-gray-900">{item.name}</h4>
                    )}
                    
                    {isEditing && checkFieldEditable('equipment') && (
                      <textarea
                        value={item.description || ''}
                        onChange={(e) => handleEquipmentFieldChange(item.id, 'description', e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                        placeholder="Description (optional)"
                      />
                    )}
                    {!isEditing && item.description && (
                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                    )}
                  </div>
                  
                  {isEditing && checkFieldEditable('equipment') && (
                    <button
                      onClick={() => handleRemoveEquipment(item.id)}
                      className="text-red-600 hover:text-red-800 ml-2"
                    >
                      <AiOutlineClose size={20} />
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Quantity</label>
                    {isEditing && checkFieldEditable('equipment') ? (
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleEquipmentFieldChange(item.id, 'quantity', e.target.value)}
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    ) : (
                      <p className="font-medium">{item.quantity}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Unit Price</label>
                    {isEditing && checkFieldEditable('equipment') ? (
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => handleEquipmentFieldChange(item.id, 'unitPrice', e.target.value)}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    ) : (
                      <p className="font-medium">{formatCurrency(item.unitPrice, currentContract.paymentTerms.currency)}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Total</label>
                    <p className="font-bold text-gray-900">
                      {formatCurrency(item.totalPrice, currentContract.paymentTerms.currency)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render Accessories Section
  const renderAccessoriesSection = () => {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <FieldWithSource fieldKey="accessories" source="seller">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <AiOutlineTags className="mr-2" />
              Accessories
            </h3>
          </FieldWithSource>
          {isEditing && checkFieldEditable('accessories') && (
            <button
              onClick={handleAddAccessory}
              className="flex items-center space-x-2 bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
            >
              <AiOutlinePlus size={16} />
              <span>Add Accessory</span>
            </button>
          )}
        </div>
        
        {currentContract.accessories.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <AiOutlineTags className="mx-auto text-3xl mb-2" />
            <p>No accessories added</p>
          </div>
        ) : (
          <div className="space-y-4">
            {currentContract.accessories.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    {isEditing && checkFieldEditable('accessories') ? (
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleAccessoryFieldChange(item.id, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
                        placeholder="Accessory name"
                      />
                    ) : (
                      <h4 className="font-bold text-gray-900">{item.name}</h4>
                    )}
                    
                    {isEditing && checkFieldEditable('accessories') && (
                      <select
                        value={item.category}
                        onChange={(e) => handleAccessoryFieldChange(item.id, 'category', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="Hardware">Hardware</option>
                        <option value="Finishing">Finishing</option>
                        <option value="Electrical">Electrical</option>
                        <option value="Safety">Safety</option>
                        <option value="Other">Other</option>
                      </select>
                    )}
                    {!isEditing && (
                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs mt-1">
                        {item.category}
                      </span>
                    )}
                  </div>
                  
                  {isEditing && checkFieldEditable('accessories') && (
                    <button
                      onClick={() => handleRemoveAccessory(item.id)}
                      className="text-red-600 hover:text-red-800 ml-2"
                    >
                      <AiOutlineClose size={20} />
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Quantity</label>
                    {isEditing && checkFieldEditable('accessories') ? (
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleAccessoryFieldChange(item.id, 'quantity', e.target.value)}
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    ) : (
                      <p className="font-medium">{item.quantity}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Unit Price</label>
                    {isEditing && checkFieldEditable('accessories') ? (
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => handleAccessoryFieldChange(item.id, 'unitPrice', e.target.value)}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    ) : (
                      <p className="font-medium">{formatCurrency(item.unitPrice, currentContract.paymentTerms.currency)}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Total</label>
                    <p className="font-bold text-gray-900">
                      {formatCurrency(item.totalPrice, currentContract.paymentTerms.currency)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render Products Section with Measurement Integration
  const renderProductsSection = () => {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <FieldWithSource fieldKey="products.*.name" source="product">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AiOutlineShoppingCart className="mr-2 text-purple-600" />
            Products
          </h3>
        </FieldWithSource>
        
        {currentContract.products.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <AiOutlineShoppingCart className="mx-auto text-4xl mb-4" />
            <p>No products added</p>
          </div>
        ) : (
          <div className="space-y-6">
            {currentContract.products.map((product) => (
              <div key={product.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex space-x-4">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-20 h-20 object-cover rounded-lg border border-gray-300"
                    />
                    <div>
                      <h4 className="font-bold text-gray-900">{product.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                      {product.measurementRequired && (
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs mt-1">
                          <AiOutlineArrowsAlt size={12} className="inline mr-1" />
                          Requires Measurement
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(product.totalPrice, currentContract.paymentTerms.currency)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatCurrency(product.unitPrice, currentContract.paymentTerms.currency)} × {product.quantity}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h5 className="font-medium text-gray-700 mb-2">Materials</h5>
                    <div className="flex flex-wrap gap-1">
                      {product.materials.map((material, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 rounded text-xs">
                          {material}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-gray-700 mb-2">Quantity</h5>
                    <div className="flex items-center space-x-2">
                      {isEditing && checkFieldEditable('products.*.quantity') ? (
                        <>
                          <button
                            onClick={() => handleProductQuantityChange(product.id, product.quantity - 1)}
                            className="w-6 h-6 border border-gray-300 rounded flex items-center justify-center"
                            disabled={product.quantity <= 1}
                          >
                            <AiOutlineMinus size={12} />
                          </button>
                          <span className="font-medium">{product.quantity}</span>
                          <button
                            onClick={() => handleProductQuantityChange(product.id, product.quantity + 1)}
                            className="w-6 h-6 border border-gray-300 rounded flex items-center justify-center"
                          >
                            <AiOutlinePlus size={12} />
                          </button>
                        </>
                      ) : (
                        <span className="font-medium">{product.quantity} units</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h5 className="font-medium text-gray-700 mb-2">Specifications</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Dimensions</label>
                      {isEditing && checkFieldEditable('products.*.specifications') ? (
                        <input
                          type="text"
                          value={product.specifications.dimensions}
                          onChange={(e) => handleProductSpecificationChange(product.id, 'dimensions', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      ) : (
                        <p className="font-medium text-sm">{product.specifications.dimensions}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Weight</label>
                      {isEditing && checkFieldEditable('products.*.specifications') ? (
                        <input
                          type="text"
                          value={product.specifications.weight}
                          onChange={(e) => handleProductSpecificationChange(product.id, 'weight', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      ) : (
                        <p className="font-medium text-sm">{product.specifications.weight}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Color</label>
                      {isEditing && checkFieldEditable('products.*.specifications') ? (
                        <input
                          type="text"
                          value={product.specifications.color}
                          onChange={(e) => handleProductSpecificationChange(product.id, 'color', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      ) : (
                        <p className="font-medium text-sm">{product.specifications.color}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Material</label>
                      {isEditing && checkFieldEditable('products.*.specifications') ? (
                        <input
                          type="text"
                          value={product.specifications.material}
                          onChange={(e) => handleProductSpecificationChange(product.id, 'material', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      ) : (
                        <p className="font-medium text-sm">{product.specifications.material}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                {product.measurementRequired && product.measurementNotes && (
                  <div className="bg-blue-50 rounded-lg p-3 mb-3">
                    <div className="flex items-start">
                      <AiOutlineColumnHeight className="text-blue-500 mr-2 mt-0.5 flex-shrink-0" size={16} />
                      <div>
                        <h6 className="font-medium text-blue-800 text-sm mb-1">Measurement Notes</h6>
                        <p className="text-blue-700 text-sm">{product.measurementNotes}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {isEditing && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleRemoveProduct(product.id)}
                      className="text-red-600 hover:text-red-800 flex items-center space-x-1 text-sm"
                    >
                      <AiOutlineClose size={14} />
                      <span>Remove</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {isEditing && (
          <div className="mt-6 flex space-x-3">
            <button
              onClick={handleAddDefaultFurniture}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <AiOutlinePlus size={16} />
              <span>Add Furniture</span>
            </button>
            <button
              onClick={handleAddProduct}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              <AiOutlinePlus size={16} />
              <span>Add Product</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  // Render Pricing Summary
  const renderPricingSummary = () => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
        <AiOutlineDollar className="mr-2" />
        Pricing Summary
      </h3>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-700">Products Subtotal:</span>
          <span className="font-medium">
            {formatCurrency(
              currentContract.products.reduce((sum, p) => sum + p.totalPrice, 0),
              currentContract.paymentTerms.currency
            )}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-700">Equipment Subtotal:</span>
          <span className="font-medium">
            {formatCurrency(
              currentContract.equipment.reduce((sum, e) => sum + e.totalPrice, 0),
              currentContract.paymentTerms.currency
            )}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-700">Accessories Subtotal:</span>
          <span className="font-medium">
            {formatCurrency(
              currentContract.accessories.reduce((sum, a) => sum + a.totalPrice, 0),
              currentContract.paymentTerms.currency
            )}
          </span>
        </div>
        
        <div className="flex justify-between items-center border-t pt-3">
          <span className="text-gray-700">Subtotal:</span>
          <span className="font-medium">
            {formatCurrency(
              currentContract.paymentTerms.totalAmount - currentContract.paymentTerms.vatAmount,
              currentContract.paymentTerms.currency
            )}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-700">VAT ({currentContract.paymentTerms.vat}%):</span>
          <span className="font-medium">
            {formatCurrency(currentContract.paymentTerms.vatAmount, currentContract.paymentTerms.currency)}
          </span>
        </div>
        
        <div className="flex justify-between items-center border-t pt-3 text-lg font-bold">
          <span className="text-gray-900">Total Overall Price Including VAT:</span>
          <span className="text-blue-600">
            {formatCurrency(currentContract.paymentTerms.totalAmount, currentContract.paymentTerms.currency)}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Hidden PDF Content */}
      <div className="hidden">
        <div ref={pdfRef} className="bg-white p-8">
          <div className="text-center border-b-2 border-gray-800 pb-4 mb-8">
            <h1 className="text-3xl font-bold">FURNITURE SUPPLY CONTRACT</h1>
            <p className="text-lg font-semibold">Contract #{currentContract.contractNumber}</p>
            <p className="text-gray-600">Date: {formatDate(currentContract.createdAt)}</p>
            {currentContract.measurementScheduledDate && (
              <p className="text-gray-600">Measurement Date: {formatDate(currentContract.measurementScheduledDate)}</p>
            )}
          </div>

          {/* Measurement Section in PDF */}
          {currentContract.measurementScheduledDate && (
            <div className="mb-8 p-4 bg-gray-50 rounded-lg">
              <h2 className="text-xl font-bold mb-4 border-b pb-2">MEASUREMENT DETAILS</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p><strong>Scheduled Date:</strong> {formatDate(currentContract.measurementScheduledDate)}</p>
                  <p><strong>Scheduled Time:</strong> {currentContract.measurementScheduledTime ? formatTime(currentContract.measurementScheduledTime) : 'N/A'}</p>
                </div>
                <div>
                  <p><strong>Measurement Status:</strong> {currentContract.measurementStatus || 'Pending'}</p>
                  {currentContract.measurementApprovedDate && (
                    <p><strong>Measurement Approved:</strong> {formatDate(currentContract.measurementApprovedDate)}</p>
                  )}
                </div>
              </div>
              {currentContract.measurementNotes && (
                <div className="mt-3">
                  <p><strong>Measurement Notes:</strong> {currentContract.measurementNotes}</p>
                </div>
              )}
            </div>
          )}

          {/* Parties */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 border-b pb-2">PARTIES</h2>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="font-bold mb-2">SELLER</h3>
                <p className="font-bold">{currentContract.seller.name}</p>
                <p>CR: {currentContract.seller.crNumber}</p>
                <p>VAT: {currentContract.seller.taxNumber}</p>
                <p>Address: {currentContract.seller.address}</p>
                <p>Phone: {currentContract.seller.phone}</p>
                <p>Email: {currentContract.seller.email}</p>
                <p>Representative: {currentContract.seller.representative}</p>
                <p>Position: {currentContract.seller.position}</p>
              </div>
              
              <div>
                <h3 className="font-bold mb-2">BUYER</h3>
                <p className="font-bold">{currentContract.buyer.name || '[Customer Name]'}</p>
                {currentContract.buyer.companyName && <p>Company: {currentContract.buyer.companyName}</p>}
                {currentContract.buyer.crNumber && <p>CR: {currentContract.buyer.crNumber}</p>}
                {currentContract.buyer.taxNumber && <p>VAT: {currentContract.buyer.taxNumber}</p>}
                <p>Email: {currentContract.buyer.email || '[Email]'}</p>
                <p>Phone: {currentContract.buyer.phone || '[Phone]'}</p>
                <p>Address: {currentContract.buyer.address || '[Address]'}</p>
                {currentContract.buyer.representative && <p>Representative: {currentContract.buyer.representative}</p>}
                {currentContract.buyer.position && <p>Position: {currentContract.buyer.position}</p>}
              </div>
            </div>
          </div>

          {/* Products in PDF */}
          {currentContract.products.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4 border-b pb-2">PRODUCTS</h2>
              {currentContract.products.map((product, index) => (
                <div key={index} className="mb-4 p-4 border border-gray-300 rounded-lg">
                  <h4 className="font-bold text-lg mb-2">{product.name}</h4>
                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <div>
                      <p><strong>Description:</strong> {product.description}</p>
                      <p><strong>Quantity:</strong> {product.quantity}</p>
                      <p><strong>Unit Price:</strong> {formatCurrency(product.unitPrice, currentContract.paymentTerms.currency)}</p>
                      <p><strong>Total Price:</strong> {formatCurrency(product.totalPrice, currentContract.paymentTerms.currency)}</p>
                    </div>
                    <div>
                      <p><strong>Dimensions:</strong> {product.specifications.dimensions}</p>
                      <p><strong>Weight:</strong> {product.specifications.weight}</p>
                      <p><strong>Color:</strong> {product.specifications.color}</p>
                      <p><strong>Material:</strong> {product.specifications.material}</p>
                    </div>
                  </div>
                  {product.measurementRequired && (
                    <p className="text-sm text-blue-600"><strong>Note:</strong> This product requires professional measurement</p>
                  )}
                  {product.measurementNotes && (
                    <p className="text-sm text-gray-600 mt-2"><strong>Measurement Notes:</strong> {product.measurementNotes}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Equipment Table in PDF */}
          {currentContract.equipment.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4 border-b pb-2">EQUIPMENT</h2>
              <table className="w-full border-collapse border border-gray-800">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-800 p-2 text-left">Item Name</th>
                    <th className="border border-gray-800 p-2 text-left">Description</th>
                    <th className="border border-gray-800 p-2 text-left">Quantity</th>
                    <th className="border border-gray-800 p-2 text-left">Unit Price</th>
                    <th className="border border-gray-800 p-2 text-left">Total Price</th>
                  </tr>
                </thead>
                <tbody>
                  {currentContract.equipment.map((item) => (
                    <tr key={item.id}>
                      <td className="border border-gray-300 p-2">{item.name}</td>
                      <td className="border border-gray-300 p-2">{item.description || '-'}</td>
                      <td className="border border-gray-300 p-2 text-center">{item.quantity}</td>
                      <td className="border border-gray-300 p-2 text-right">{formatCurrency(item.unitPrice, currentContract.paymentTerms.currency)}</td>
                      <td className="border border-gray-300 p-2 text-right font-bold">{formatCurrency(item.totalPrice, currentContract.paymentTerms.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Accessories Table in PDF */}
          {currentContract.accessories.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4 border-b pb-2">ACCESSORIES</h2>
              <table className="w-full border-collapse border border-gray-800">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-800 p-2 text-left">Item Name</th>
                    <th className="border border-gray-800 p-2 text-left">Category</th>
                    <th className="border border-gray-800 p-2 text-left">Quantity</th>
                    <th className="border border-gray-800 p-2 text-left">Unit Price</th>
                    <th className="border border-gray-800 p-2 text-left">Total Price</th>
                  </tr>
                </thead>
                <tbody>
                  {currentContract.accessories.map((item) => (
                    <tr key={item.id}>
                      <td className="border border-gray-300 p-2">{item.name}</td>
                      <td className="border border-gray-300 p-2">{item.category}</td>
                      <td className="border border-gray-300 p-2 text-center">{item.quantity}</td>
                      <td className="border border-gray-300 p-2 text-right">{formatCurrency(item.unitPrice, currentContract.paymentTerms.currency)}</td>
                      <td className="border border-gray-300 p-2 text-right font-bold">{formatCurrency(item.totalPrice, currentContract.paymentTerms.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Existing PDF content continues... */}
        </div>
      </div>

      {/* Main UI */}
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-700 transition-colors bg-white p-3 rounded-xl border border-gray-200 hover:border-gray-300"
              >
                <AiOutlineArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Contract Agreement</h1>
                <p className="text-gray-600 mt-1">Furniture Supply Contract - {currentContract.contractNumber}</p>
                {currentContract.measurementRequestId && (
                  <p className="text-sm text-blue-600 mt-1">Linked to Measurement Request</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(currentContract.status)}`}>
                {currentContract.status === 'measurement_pending' ? 'Measurement Pending' : 
                 currentContract.status.charAt(0).toUpperCase() + currentContract.status.slice(1)}
              </span>
              
              {isEditing ? (
                <>
                  <button
                    onClick={handleSaveContract}
                    className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <AiOutlineSave size={18} />
                    <span>Save</span>
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex items-center space-x-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <AiOutlineClose size={18} />
                    <span>Cancel</span>
                  </button>
                </>
              ) : (
                <>
                  {(currentContract.status === 'draft' || currentContract.status === 'measurement_pending') && (
                    <button
                      onClick={handleEditToggle}
                      className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <AiOutlineEdit size={18} />
                      <span>Edit</span>
                    </button>
                  )}
                  <button
                    onClick={handleDownloadPDF}
                    className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <AiOutlineFilePdf size={18} />
                    <span>Download PDF</span>
                  </button>
                  <button
                    onClick={handlePrint}
                    className="flex items-center space-x-2 bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <AiOutlinePrinter size={18} />
                    <span>Print</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Contract Container - Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div>
              {/* Measurement Section */}
              {renderMeasurementSection()}

              {/* Buyer Information */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <FieldWithSource fieldKey="buyer.name" source="buyer">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <AiOutlineUser className="mr-2 text-blue-600" />
                    Buyer Information
                  </h3>
                </FieldWithSource>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                    <input
                      type="text"
                      value={currentContract.buyer.name}
                      readOnly
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 cursor-not-allowed"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={currentContract.buyer.email}
                        readOnly
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={currentContract.buyer.phone}
                        readOnly
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 cursor-not-allowed"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea
                      value={currentContract.buyer.address}
                      readOnly
                      rows={3}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 cursor-not-allowed resize-none"
                    />
                  </div>
                  
                  {currentContract.contractType === 'b2b' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                          <input
                            type="text"
                            value={currentContract.buyer.companyName || ''}
                            readOnly
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">CR Number</label>
                          <input
                            type="text"
                            value={currentContract.buyer.crNumber || ''}
                            readOnly
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 cursor-not-allowed"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tax Number</label>
                          <input
                            type="text"
                            value={currentContract.buyer.taxNumber || ''}
                            readOnly
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Representative</label>
                          <input
                            type="text"
                            value={currentContract.buyer.representative || ''}
                            readOnly
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 cursor-not-allowed"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Seller Information */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <FieldWithSource fieldKey="seller.name" source="seller">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <AiOutlineBuild className="mr-2 text-green-600" />
                    Seller Information
                  </h3>
                </FieldWithSource>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                    <input
                      type="text"
                      value={currentContract.seller.name}
                      onChange={(e) => handleSellerFieldChange('name', e.target.value)}
                      disabled={!isEditing || !checkFieldEditable('seller.name')}
                      className={`w-full px-3 py-2 border rounded-lg ${
                        isEditing && checkFieldEditable('seller.name')
                          ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                          : 'bg-gray-50 border-gray-300 text-gray-700 cursor-not-allowed'
                      }`}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={currentContract.seller.email}
                        onChange={(e) => handleSellerFieldChange('email', e.target.value)}
                        disabled={!isEditing || !checkFieldEditable('seller.email')}
                        className={`w-full px-3 py-2 border rounded-lg ${
                          isEditing && checkFieldEditable('seller.email')
                            ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                            : 'bg-gray-50 border-gray-300 text-gray-700 cursor-not-allowed'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={currentContract.seller.phone}
                        onChange={(e) => handleSellerFieldChange('phone', e.target.value)}
                        disabled={!isEditing || !checkFieldEditable('seller.phone')}
                        className={`w-full px-3 py-2 border rounded-lg ${
                          isEditing && checkFieldEditable('seller.phone')
                            ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                            : 'bg-gray-50 border-gray-300 text-gray-700 cursor-not-allowed'
                        }`}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea
                      value={currentContract.seller.address}
                      onChange={(e) => handleSellerFieldChange('address', e.target.value)}
                      disabled={!isEditing || !checkFieldEditable('seller.address')}
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-lg resize-none ${
                        isEditing && checkFieldEditable('seller.address')
                          ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                          : 'bg-gray-50 border-gray-300 text-gray-700 cursor-not-allowed'
                      }`}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CR Number</label>
                      <input
                        type="text"
                        value={currentContract.seller.crNumber}
                        onChange={(e) => handleSellerFieldChange('crNumber', e.target.value)}
                        disabled={!isEditing || !checkFieldEditable('seller.crNumber')}
                        className={`w-full px-3 py-2 border rounded-lg ${
                          isEditing && checkFieldEditable('seller.crNumber')
                            ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                            : 'bg-gray-50 border-gray-300 text-gray-700 cursor-not-allowed'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tax Number</label>
                      <input
                        type="text"
                        value={currentContract.seller.taxNumber}
                        onChange={(e) => handleSellerFieldChange('taxNumber', e.target.value)}
                        disabled={!isEditing || !checkFieldEditable('seller.taxNumber')}
                        className={`w-full px-3 py-2 border rounded-lg ${
                          isEditing && checkFieldEditable('seller.taxNumber')
                            ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                            : 'bg-gray-50 border-gray-300 text-gray-700 cursor-not-allowed'
                        }`}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Representative</label>
                      <input
                        type="text"
                        value={currentContract.seller.representative}
                        onChange={(e) => handleSellerFieldChange('representative', e.target.value)}
                        disabled={!isEditing || !checkFieldEditable('seller.representative')}
                        className={`w-full px-3 py-2 border rounded-lg ${
                          isEditing && checkFieldEditable('seller.representative')
                            ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                            : 'bg-gray-50 border-gray-300 text-gray-700 cursor-not-allowed'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                      <input
                        type="text"
                        value={currentContract.seller.position}
                        onChange={(e) => handleSellerFieldChange('position', e.target.value)}
                        disabled={!isEditing || !checkFieldEditable('seller.position')}
                        className={`w-full px-3 py-2 border rounded-lg ${
                          isEditing && checkFieldEditable('seller.position')
                            ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                            : 'bg-gray-50 border-gray-300 text-gray-700 cursor-not-allowed'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Equipment & Accessories */}
              <div className="space-y-6">
                {renderEquipmentSection()}
                {renderAccessoriesSection()}
              </div>

              {/* Pricing Summary */}
              {renderPricingSummary()}
            </div>

            {/* Right Column */}
            <div>
              {/* Products Section */}
              {renderProductsSection()}

              {/* Delivery Information */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <FieldWithSource fieldKey="delivery.address" source="buyer">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <AiOutlineCalendar className="mr-2" />
                    Delivery Information
                  </h3>
                </FieldWithSource>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
                    <textarea
                      value={currentContract.delivery.address}
                      onChange={(e) => handleDeliveryFieldChange('address', e.target.value)}
                      disabled={!isEditing || !checkFieldEditable('delivery.address')}
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-lg resize-none ${
                        isEditing && checkFieldEditable('delivery.address')
                          ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                          : 'bg-gray-50 border-gray-300 text-gray-700 cursor-not-allowed'
                      }`}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Date</label>
                      <input
                        type="date"
                        value={currentContract.delivery.estimatedDate}
                        onChange={(e) => handleDeliveryFieldChange('estimatedDate', e.target.value)}
                        disabled={!isEditing || !checkFieldEditable('delivery.estimatedDate')}
                        className={`w-full px-3 py-2 border rounded-lg ${
                          isEditing && checkFieldEditable('delivery.estimatedDate')
                            ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                            : 'bg-gray-50 border-gray-300 text-gray-700 cursor-not-allowed'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Cost</label>
                      <input
                        type="number"
                        value={currentContract.delivery.shippingCost}
                        onChange={(e) => handleDeliveryFieldChange('shippingCost', parseFloat(e.target.value) || 0)}
                        disabled={!isEditing || !checkFieldEditable('delivery.shippingCost')}
                        className={`w-full px-3 py-2 border rounded-lg ${
                          isEditing && checkFieldEditable('delivery.shippingCost')
                            ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                            : 'bg-gray-50 border-gray-300 text-gray-700 cursor-not-allowed'
                        }`}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Installation Included</span>
                    <input
                      type="checkbox"
                      checked={currentContract.delivery.installationIncluded}
                      onChange={(e) => handleDeliveryFieldChange('installationIncluded', e.target.checked)}
                      disabled={!isEditing || !checkFieldEditable('delivery.installationIncluded')}
                      className={`w-4 h-4 rounded ${
                        isEditing && checkFieldEditable('delivery.installationIncluded')
                          ? 'text-blue-600 focus:ring-blue-500'
                          : 'bg-gray-200 border-gray-300'
                      }`}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Notes</label>
                    <textarea
                      value={currentContract.delivery.notes}
                      onChange={(e) => handleDeliveryFieldChange('notes', e.target.value)}
                      disabled={!isEditing || !checkFieldEditable('delivery.notes')}
                      rows={2}
                      className={`w-full px-3 py-2 border rounded-lg resize-none ${
                        isEditing && checkFieldEditable('delivery.notes')
                          ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                          : 'bg-gray-50 border-gray-300 text-gray-700 cursor-not-allowed'
                      }`}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
                    <textarea
                      value={currentContract.delivery.specialInstructions || ''}
                      onChange={(e) => handleDeliveryFieldChange('specialInstructions', e.target.value)}
                      disabled={!isEditing || !checkFieldEditable('delivery.specialInstructions')}
                      rows={2}
                      className={`w-full px-3 py-2 border rounded-lg resize-none ${
                        isEditing && checkFieldEditable('delivery.specialInstructions')
                          ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                          : 'bg-gray-50 border-gray-300 text-gray-700 cursor-not-allowed'
                      }`}
                      placeholder="Any special delivery instructions..."
                    />
                  </div>
                </div>
              </div>

              {/* Terms & Conditions */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <FieldWithSource fieldKey="terms.cancellationPolicy" source="platform">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <AiOutlineFileText className="mr-2 text-gray-600" />
                    Terms & Conditions
                  </h3>
                </FieldWithSource>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Cancellation Policy</h4>
                    <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg">
                      {currentContract.terms.cancellationPolicy}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Return Policy</h4>
                    <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg">
                      {currentContract.terms.returnPolicy}
                    </p>
                  </div>
                  
                  {currentContract.terms.measurementPolicy && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Measurement Policy</h4>
                      <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg">
                        {currentContract.terms.measurementPolicy}
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Governing Law</h4>
                    <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg">
                      {currentContract.terms.governingLaw}
                    </p>
                  </div>
                </div>
              </div>

              {/* Warranty Information */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <FieldWithSource fieldKey="warranty.duration" source="platform">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <AiOutlineSafetyCertificate className="mr-2 text-gray-600" />
                    Warranty Information
                  </h3>
                </FieldWithSource>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Warranty Duration</h4>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                      {currentContract.warranty.duration}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Coverage Includes</h4>
                    <ul className="space-y-1">
                      {currentContract.warranty.coverage.map((item, idx) => (
                        <li key={idx} className="flex items-start text-sm text-gray-700">
                          <AiOutlineCheck className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Limitations</h4>
                    <ul className="space-y-1">
                      {currentContract.warranty.limitations.map((item, idx) => (
                        <li key={idx} className="flex items-start text-sm text-gray-700">
                          <AiOutlineClose className="text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 mt-8">
            {currentContract.status === 'measurement_pending' && userRole === 'seller' && (
              <button
                onClick={handleMeasurementComplete}
                className="bg-yellow-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-yellow-700 transition-colors flex items-center space-x-2"
              >
                <AiOutlineColumnHeight size={20} />
                <span>Complete Measurement</span>
              </button>
            )}
            
            {(currentContract.status === 'draft' || currentContract.status === 'measurement_pending') && !isEditing && (
              <button
                onClick={handleEditToggle}
                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                Edit Contract
              </button>
            )}
            
            {(currentContract.status === 'draft' || currentContract.status === 'measurement_pending') && isEditing && (
              <button
                onClick={handleSaveContract}
                className="bg-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
              >
                Save Contract
              </button>
            )}
            
            {currentContract.status === 'draft' && (
              <button
                onClick={handleSendContract}
                className="bg-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors"
              >
                Send to Customer
              </button>
            )}
            
            {currentContract.status === 'sent' && userRole === 'buyer' && (
              <button
                onClick={handleAcceptContract}
                className="bg-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
              >
                Accept & Sign Contract
              </button>
            )}
            
            <button
              onClick={onBack}
              className="bg-white text-gray-700 border border-gray-300 px-8 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Contracts;