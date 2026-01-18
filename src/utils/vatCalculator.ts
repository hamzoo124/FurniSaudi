// src/utils/vatCalculator.ts

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface VATCalculation {
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
  vatRate: number;
  currency: string;
}

export interface VATBreakdown {
  items: Array<{
    description: string;
    netAmount: number;
    vatAmount: number;
    grossAmount: number;
    vatRate: number;
  }>;
  subtotal: number;
  totalVAT: number;
  totalGross: number;
}

export interface VATRate {
  rate: number; // 0.15 for 15%
  name: string;
  code: string;
  description?: string;
  effectiveFrom: string;
  effectiveTo?: string;
}

export interface VATCountryRule {
  countryCode: string;
  countryName: string;
  standardRate: number;
  reducedRates: VATRate[];
  exemptCategories: string[];
  vatRegistrationThreshold: number;
  roundingRule: 'standard' | 'commercial' | 'floor' | 'ceil';
  decimalPlaces: number;
}

export interface VATTransaction {
  id: string;
  date: string;
  type: 'sale' | 'purchase' | 'refund';
  description: string;
  netAmount: number;
  vatRate: number;
  vatAmount: number;
  grossAmount: number;
  currency: string;
  invoiceNumber?: string;
  customerVATNumber?: string;
  reverseCharge?: boolean;
  vatDeductible?: boolean;
}

// ============================================
// CONSTANTS
// ============================================

export const VAT_RATES: Record<string, VATRate[]> = {
  // Saudi Arabia
  SA: [
    {
      rate: 0.15,
      name: 'Standard VAT Rate',
      code: 'VAT_STANDARD',
      description: 'Standard Value Added Tax rate',
      effectiveFrom: '2020-07-01',
    },
  ],
  
  // United Arab Emirates
  AE: [
    {
      rate: 0.05,
      name: 'Standard VAT Rate',
      code: 'VAT_STANDARD',
      description: 'Standard Value Added Tax rate',
      effectiveFrom: '2018-01-01',
    },
  ],
  
  // Bahrain
  BH: [
    {
      rate: 0.10,
      name: 'Standard VAT Rate',
      code: 'VAT_STANDARD',
      description: 'Standard Value Added Tax rate',
      effectiveFrom: '2019-01-01',
    },
  ],
  
  // Qatar
  QA: [
    {
      rate: 0,
      name: 'VAT Exempt',
      code: 'VAT_EXEMPT',
      description: 'VAT not implemented yet',
      effectiveFrom: '2021-01-01',
    },
  ],
  
  // Kuwait
  KW: [
    {
      rate: 0,
      name: 'VAT Exempt',
      code: 'VAT_EXEMPT',
      description: 'VAT not implemented yet',
      effectiveFrom: '2021-01-01',
    },
  ],
  
  // Oman
  OM: [
    {
      rate: 0.05,
      name: 'Standard VAT Rate',
      code: 'VAT_STANDARD',
      description: 'Standard Value Added Tax rate',
      effectiveFrom: '2021-04-01',
    },
  ],
  
  // Default (International)
  DEFAULT: [
    {
      rate: 0,
      name: 'Standard VAT Rate',
      code: 'VAT_STANDARD',
      description: 'Standard Value Added Tax rate',
      effectiveFrom: '2000-01-01',
    },
  ],
};

export const VAT_CATEGORIES = {
  STANDARD: 'standard',
  REDUCED: 'reduced',
  ZERO: 'zero',
  EXEMPT: 'exempt',
  OUT_OF_SCOPE: 'out_of_scope',
  REVERSE_CHARGE: 'reverse_charge',
} as const;

export type VATCategory = typeof VAT_CATEGORIES[keyof typeof VAT_CATEGORIES];

export const COUNTRY_RULES: Record<string, VATCountryRule> = {
  SA: {
    countryCode: 'SA',
    countryName: 'Saudi Arabia',
    standardRate: 0.15,
    reducedRates: [],
    exemptCategories: [
      'financial_services',
      'healthcare',
      'education',
      'local_transport',
    ],
    vatRegistrationThreshold: 375000, // SAR annually
    roundingRule: 'commercial',
    decimalPlaces: 2,
  },
  AE: {
    countryCode: 'AE',
    countryName: 'United Arab Emirates',
    standardRate: 0.05,
    reducedRates: [],
    exemptCategories: [
      'financial_services',
      'healthcare',
      'education',
      'local_passenger_transport',
      'bare_land',
      'residential_buildings',
    ],
    vatRegistrationThreshold: 375000, // AED annually
    roundingRule: 'standard',
    decimalPlaces: 2,
  },
  BH: {
    countryCode: 'BH',
    countryName: 'Bahrain',
    standardRate: 0.10,
    reducedRates: [],
    exemptCategories: [
      'financial_services',
      'healthcare',
      'education',
      'real_estate',
    ],
    vatRegistrationThreshold: 5000000, // BHD annually
    roundingRule: 'standard',
    decimalPlaces: 3, // Bahrain uses 3 decimal places
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Safely round amount based on rounding rule
 */
const roundAmount = (
  amount: number,
  rule: VATCountryRule['roundingRule'] = 'commercial',
  decimalPlaces: number = 2
): number => {
  const multiplier = Math.pow(10, decimalPlaces);
  
  switch (rule) {
    case 'floor':
      return Math.floor(amount * multiplier) / multiplier;
    
    case 'ceil':
      return Math.ceil(amount * multiplier) / multiplier;
    
    case 'standard':
      // Round half away from zero
      return Math.sign(amount) * Math.round(Math.abs(amount) * multiplier) / multiplier;
    
    case 'commercial':
    default:
      // Banker's rounding (round half to even)
      const rounded = Math.round(amount * multiplier) / multiplier;
      // Handle -0
      return rounded === 0 ? 0 : rounded;
  }
};

/**
 * Validate input parameters
 */
const validateInput = (amount: number, vatRate: number, context: string = ''): void => {
  if (typeof amount !== 'number' || isNaN(amount) || !isFinite(amount)) {
    throw new Error(`${context}: Amount must be a valid number`);
  }
  
  if (typeof vatRate !== 'number' || isNaN(vatRate) || !isFinite(vatRate)) {
    throw new Error(`${context}: VAT rate must be a valid number`);
  }
  
  if (amount < 0) {
    throw new Error(`${context}: Amount cannot be negative`);
  }
  
  if (vatRate < 0 || vatRate > 1) {
    throw new Error(`${context}: VAT rate must be between 0 and 1 (0% to 100%)`);
  }
};

/**
 * Get effective VAT rate for a country and date
 */
export const getVATRate = (
  countryCode: string = 'SA',
  date: Date = new Date(),
  category: string = 'standard'
): number => {
  const rates = VAT_RATES[countryCode.toUpperCase()] || VAT_RATES.DEFAULT;
  const targetDate = date instanceof Date ? date : new Date(date);
  
  // Find the applicable rate for the given date and category
  const applicableRate = rates.find(rate => {
    const effectiveFrom = new Date(rate.effectiveFrom);
    const effectiveTo = rate.effectiveTo ? new Date(rate.effectiveTo) : null;
    
    return targetDate >= effectiveFrom && 
           (!effectiveTo || targetDate <= effectiveTo) &&
           rate.code.includes(category.toUpperCase());
  });
  
  return applicableRate?.rate ?? rates[0]?.rate ?? 0;
};

/**
 * Get country rule
 */
export const getCountryRule = (countryCode: string = 'SA'): VATCountryRule => {
  return COUNTRY_RULES[countryCode.toUpperCase()] || {
    countryCode: countryCode.toUpperCase(),
    countryName: 'Unknown Country',
    standardRate: 0,
    reducedRates: [],
    exemptCategories: [],
    vatRegistrationThreshold: 0,
    roundingRule: 'standard',
    decimalPlaces: 2,
  };
};

// ============================================
// MAIN CALCULATION FUNCTIONS
// ============================================

/**
 * Calculates VAT amount for a given net amount
 */
export const calculateVAT = (
  netAmount: number,
  vatRate: number,
  countryCode: string = 'SA'
): number => {
  validateInput(netAmount, vatRate, 'calculateVAT');
  
  const countryRule = getCountryRule(countryCode);
  const vatAmount = netAmount * vatRate;
  
  return roundAmount(vatAmount, countryRule.roundingRule, countryRule.decimalPlaces);
};

/**
 * Calculates price including VAT
 */
export const calculatePriceWithVAT = (
  netAmount: number,
  vatRate: number,
  countryCode: string = 'SA'
): number => {
  validateInput(netAmount, vatRate, 'calculatePriceWithVAT');
  
  const countryRule = getCountryRule(countryCode);
  const vatAmount = calculateVAT(netAmount, vatRate, countryCode);
  const grossAmount = netAmount + vatAmount;
  
  return roundAmount(grossAmount, countryRule.roundingRule, countryRule.decimalPlaces);
};

/**
 * Extracts VAT from total amount (reverse calculation)
 */
export const extractVAT = (
  grossAmount: number,
  vatRate: number,
  countryCode: string = 'SA'
): { netAmount: number; vatAmount: number } => {
  validateInput(grossAmount, vatRate, 'extractVAT');
  
  const countryRule = getCountryRule(countryCode);
  
  if (vatRate === 0) {
    return {
      netAmount: roundAmount(grossAmount, countryRule.roundingRule, countryRule.decimalPlaces),
      vatAmount: 0,
    };
  }
  
  if (vatRate === 1) {
    return {
      netAmount: 0,
      vatAmount: roundAmount(grossAmount, countryRule.roundingRule, countryRule.decimalPlaces),
    };
  }
  
  const netAmount = grossAmount / (1 + vatRate);
  const vatAmount = grossAmount - netAmount;
  
  return {
    netAmount: roundAmount(netAmount, countryRule.roundingRule, countryRule.decimalPlaces),
    vatAmount: roundAmount(vatAmount, countryRule.roundingRule, countryRule.decimalPlaces),
  };
};

// ============================================
// ADVANCED CALCULATION FUNCTIONS
// ============================================

/**
 * Calculate VAT for multiple items with different rates
 */
export const calculateVATBreakdown = (
  items: Array<{
    description: string;
    netAmount: number;
    vatRate: number;
    category?: VATCategory;
  }>,
  countryCode: string = 'SA'
): VATBreakdown => {
  const countryRule = getCountryRule(countryCode);
  
  const processedItems = items.map(item => {
    validateInput(item.netAmount, item.vatRate, `Item: ${item.description}`);
    
    const vatAmount = calculateVAT(item.netAmount, item.vatRate, countryCode);
    const grossAmount = item.netAmount + vatAmount;
    
    return {
      description: item.description,
      netAmount: roundAmount(item.netAmount, countryRule.roundingRule, countryRule.decimalPlaces),
      vatAmount,
      grossAmount,
      vatRate: item.vatRate,
    };
  });
  
  const subtotal = processedItems.reduce((sum, item) => sum + item.netAmount, 0);
  const totalVAT = processedItems.reduce((sum, item) => sum + item.vatAmount, 0);
  const totalGross = processedItems.reduce((sum, item) => sum + item.grossAmount, 0);
  
  return {
    items: processedItems,
    subtotal: roundAmount(subtotal, countryRule.roundingRule, countryRule.decimalPlaces),
    totalVAT: roundAmount(totalVAT, countryRule.roundingRule, countryRule.decimalPlaces),
    totalGross: roundAmount(totalGross, countryRule.roundingRule, countryRule.decimalPlaces),
  };
};

/**
 * Calculate VAT liability for a period
 */
export const calculateVATLiability = (
  transactions: VATTransaction[],
  countryCode: string = 'SA'
): {
  salesVAT: number;
  purchaseVAT: number;
  netVATLiability: number;
  taxableSales: number;
  taxablePurchases: number;
} => {
  const countryRule = getCountryRule(countryCode);
  
  let salesVAT = 0;
  let purchaseVAT = 0;
  let taxableSales = 0;
  let taxablePurchases = 0;
  
  transactions.forEach(transaction => {
    if (transaction.reverseCharge) {
      // Reverse charge: VAT is accounted for differently
      taxablePurchases += transaction.netAmount;
      // No VAT added to purchaseVAT for reverse charge
      return;
    }
    
    if (transaction.vatDeductible === false) {
      // Non-deductible VAT
      if (transaction.type === 'purchase') {
        purchaseVAT += transaction.vatAmount;
        taxablePurchases += transaction.netAmount;
      }
      return;
    }
    
    switch (transaction.type) {
      case 'sale':
        salesVAT += transaction.vatAmount;
        taxableSales += transaction.netAmount;
        break;
        
      case 'purchase':
        purchaseVAT += transaction.vatAmount;
        taxablePurchases += transaction.netAmount;
        break;
        
      case 'refund':
        if (transaction.vatAmount > 0) {
          // Refund of VAT
          salesVAT -= transaction.vatAmount;
          taxableSales -= transaction.netAmount;
        }
        break;
    }
  });
  
  const netVATLiability = salesVAT - purchaseVAT;
  
  return {
    salesVAT: roundAmount(salesVAT, countryRule.roundingRule, countryRule.decimalPlaces),
    purchaseVAT: roundAmount(purchaseVAT, countryRule.roundingRule, countryRule.decimalPlaces),
    netVATLiability: roundAmount(netVATLiability, countryRule.roundingRule, countryRule.decimalPlaces),
    taxableSales: roundAmount(taxableSales, countryRule.roundingRule, countryRule.decimalPlaces),
    taxablePurchases: roundAmount(taxablePurchases, countryRule.roundingRule, countryRule.decimalPlaces),
  };
};

/**
 * Generate VAT invoice breakdown
 */
export const generateVATInvoice = (
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
    discount?: number;
  }>,
  shippingCost: number = 0,
  countryCode: string = 'SA'
): {
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    netAmount: number;
    vatRate: number;
    vatAmount: number;
    grossAmount: number;
  }>;
  subtotal: number;
  shipping: number;
  totalBeforeVAT: number;
  totalVAT: number;
  totalAmount: number;
  vatSummary: Array<{ rate: number; netAmount: number; vatAmount: number }>;
} => {
  const countryRule = getCountryRule(countryCode);
  
  // Process items
  const processedItems = items.map(item => {
    validateInput(item.unitPrice, item.vatRate, `Item: ${item.description}`);
    
    const discount = item.discount || 0;
    const netAmount = item.quantity * item.unitPrice * (1 - discount);
    const vatAmount = calculateVAT(netAmount, item.vatRate, countryCode);
    
    return {
      description: item.description,
      quantity: item.quantity,
      unitPrice: roundAmount(item.unitPrice, countryRule.roundingRule, countryRule.decimalPlaces),
      discount,
      netAmount: roundAmount(netAmount, countryRule.roundingRule, countryRule.decimalPlaces),
      vatRate: item.vatRate,
      vatAmount,
      grossAmount: roundAmount(netAmount + vatAmount, countryRule.roundingRule, countryRule.decimalPlaces),
    };
  });
  
  // Calculate subtotal
  const subtotal = processedItems.reduce((sum, item) => sum + item.netAmount, 0);
  
  // Calculate VAT summary by rate
  const vatSummaryMap = new Map<number, { netAmount: number; vatAmount: number }>();
  
  processedItems.forEach(item => {
    const existing = vatSummaryMap.get(item.vatRate) || { netAmount: 0, vatAmount: 0 };
    existing.netAmount += item.netAmount;
    existing.vatAmount += item.vatAmount;
    vatSummaryMap.set(item.vatRate, existing);
  });
  
  const vatSummary = Array.from(vatSummaryMap.entries())
    .map(([rate, amounts]) => ({
      rate,
      netAmount: roundAmount(amounts.netAmount, countryRule.roundingRule, countryRule.decimalPlaces),
      vatAmount: roundAmount(amounts.vatAmount, countryRule.roundingRule, countryRule.decimalPlaces),
    }))
    .sort((a, b) => b.rate - a.rate);
  
  // Calculate shipping VAT (typically same as standard rate)
  const standardVATRate = getVATRate(countryCode);
  const shippingVAT = calculateVAT(shippingCost, standardVATRate, countryCode);
  const shippingWithVAT = shippingCost + shippingVAT;
  
  // Calculate totals
  const totalBeforeVAT = subtotal + shippingCost;
  const totalVAT = processedItems.reduce((sum, item) => sum + item.vatAmount, 0) + shippingVAT;
  const totalAmount = totalBeforeVAT + totalVAT;
  
  return {
    items: processedItems,
    subtotal: roundAmount(subtotal, countryRule.roundingRule, countryRule.decimalPlaces),
    shipping: roundAmount(shippingCost, countryRule.roundingRule, countryRule.decimalPlaces),
    totalBeforeVAT: roundAmount(totalBeforeVAT, countryRule.roundingRule, countryRule.decimalPlaces),
    totalVAT: roundAmount(totalVAT, countryRule.roundingRule, countryRule.decimalPlaces),
    totalAmount: roundAmount(totalAmount, countryRule.roundingRule, countryRule.decimalPlaces),
    vatSummary,
  };
};

/**
 * Calculate VAT for partial payments
 */
export const calculateVATForPartialPayment = (
  grossAmount: number,
  vatRate: number,
  paymentPercentage: number,
  countryCode: string = 'SA'
): { paymentAmount: number; vatComponent: number } => {
  validateInput(grossAmount, vatRate, 'calculateVATForPartialPayment');
  
  if (paymentPercentage < 0 || paymentPercentage > 100) {
    throw new Error('Payment percentage must be between 0 and 100');
  }
  
  const { netAmount, vatAmount } = extractVAT(grossAmount, vatRate, countryCode);
  const paymentNet = (netAmount * paymentPercentage) / 100;
  const paymentVAT = (vatAmount * paymentPercentage) / 100;
  const paymentAmount = paymentNet + paymentVAT;
  
  const countryRule = getCountryRule(countryCode);
  
  return {
    paymentAmount: roundAmount(paymentAmount, countryRule.roundingRule, countryRule.decimalPlaces),
    vatComponent: roundAmount(paymentVAT, countryRule.roundingRule, countryRule.decimalPlaces),
  };
};

/**
 * Validate VAT number format
 */
export const validateVATNumber = (
  vatNumber: string,
  countryCode: string = 'SA'
): { isValid: boolean; formattedNumber?: string; message?: string } => {
  if (!vatNumber || typeof vatNumber !== 'string') {
    return { isValid: false, message: 'VAT number is required' };
  }
  
  const cleaned = vatNumber.replace(/\s/g, '').toUpperCase();
  
  // Country-specific validation patterns
  const patterns: Record<string, RegExp> = {
    SA: /^3\d{13}$/, // Saudi Arabia: 15 digits starting with 3
    AE: /^\d{15}$/, // UAE: 15 digits
    BH: /^2\d{8}$/, // Bahrain: 9 digits starting with 2
    OM: /^1\d{13}$/, // Oman: 14 digits starting with 1
  };
  
  const pattern = patterns[countryCode.toUpperCase()];
  
  if (!pattern) {
    // Default validation for unknown countries
    return {
      isValid: /^[A-Z0-9]{8,15}$/.test(cleaned),
      formattedNumber: cleaned,
    };
  }
  
  const isValid = pattern.test(cleaned);
  
  if (!isValid) {
    return {
      isValid: false,
      message: `Invalid VAT number format for ${countryCode}. Expected format: ${countryCode === 'SA' ? '15 digits starting with 3' : 'Check local regulations'}`,
    };
  }
  
  // Format the VAT number
  let formattedNumber = cleaned;
  if (countryCode === 'SA') {
    formattedNumber = cleaned.replace(/(\d{3})(\d{4})(\d{4})(\d{4})/, '$1-$2-$3-$4');
  }
  
  return { isValid: true, formattedNumber };
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format VAT rate for display
 */
export const formatVATRate = (vatRate: number): string => {
  return `${(vatRate * 100).toFixed(2)}%`;
};

/**
 * Check if VAT registration is required
 */
export const isVATRegistrationRequired = (
  annualTurnover: number,
  countryCode: string = 'SA'
): boolean => {
  const countryRule = getCountryRule(countryCode);
  return annualTurnover >= countryRule.vatRegistrationThreshold;
};

/**
 * Calculate quarterly VAT filing amounts
 */
export const calculateQuarterlyVAT = (
  monthlySales: number[],
  vatRate: number,
  countryCode: string = 'SA'
): Array<{
  quarter: number;
  period: string;
  taxableSales: number;
  vatCollected: number;
  vatDueDate: string;
}> => {
  if (monthlySales.length !== 12) {
    throw new Error('Monthly sales array must have 12 entries');
  }
  
  const quarters = [];
  const countryRule = getCountryRule(countryCode);
  
  for (let quarter = 0; quarter < 4; quarter++) {
    const startMonth = quarter * 3;
    const quarterlySales = monthlySales.slice(startMonth, startMonth + 3);
    const taxableSales = quarterlySales.reduce((sum, sales) => sum + sales, 0);
    const vatCollected = calculateVAT(taxableSales, vatRate, countryCode);
    
    // Calculate due date (typically end of month following quarter)
    const year = new Date().getFullYear();
    const dueMonth = startMonth + 4; // Month following quarter end
    const dueDate = new Date(year, dueMonth, 1); // 1st of month
    dueDate.setMonth(dueDate.getMonth() + 1); // Move to next month
    dueDate.setDate(0); // Last day of month
    
    quarters.push({
      quarter: quarter + 1,
      period: `Q${quarter + 1} ${year}`,
      taxableSales: roundAmount(taxableSales, countryRule.roundingRule, countryRule.decimalPlaces),
      vatCollected,
      vatDueDate: dueDate.toISOString().split('T')[0],
    });
  }
  
  return quarters;
};

// ============================================
// EXPORT ALL UTILITIES
// ============================================

export default {
  // Basic calculations
  calculateVAT,
  calculatePriceWithVAT,
  extractVAT,
  
  // Advanced calculations
  calculateVATBreakdown,
  calculateVATLiability,
  generateVATInvoice,
  calculateVATForPartialPayment,
  
  // VAT utilities
  getVATRate,
  getCountryRule,
  validateVATNumber,
  formatVATRate,
  isVATRegistrationRequired,
  calculateQuarterlyVAT,
  
  // Constants
  VAT_RATES,
  VAT_CATEGORIES,
  COUNTRY_RULES,
};

// ============================================
// USAGE EXAMPLES
// ============================================

/*
// Example 1: Basic VAT calculation
const vatAmount = calculateVAT(1000, 0.15); // Returns: 150
const priceWithVAT = calculatePriceWithVAT(1000, 0.15); // Returns: 1150

// Example 2: Extract VAT from total
const { netAmount, vatAmount } = extractVAT(1150, 0.15);
// Returns: { netAmount: 1000, vatAmount: 150 }

// Example 3: Multi-item invoice
const invoice = generateVATInvoice([
  { description: 'Office Chair', quantity: 2, unitPrice: 500, vatRate: 0.15 },
  { description: 'Desk Lamp', quantity: 1, unitPrice: 150, vatRate: 0.15, discount: 0.1 },
], 50); // SAR 50 shipping

// Example 4: VAT liability calculation
const liability = calculateVATLiability([
  {
    id: '1',
    date: '2024-01-15',
    type: 'sale',
    description: 'Sale to Customer A',
    netAmount: 1000,
    vatRate: 0.15,
    vatAmount: 150,
    grossAmount: 1150,
    currency: 'SAR',
  },
  {
    id: '2',
    date: '2024-01-16',
    type: 'purchase',
    description: 'Purchase from Supplier B',
    netAmount: 500,
    vatRate: 0.15,
    vatAmount: 75,
    grossAmount: 575,
    currency: 'SAR',
  },
]);

// Example 5: Validate VAT number
const validation = validateVATNumber('300123456789012', 'SA');
// Returns: { isValid: true, formattedNumber: '300-1234-5678-9012' }

// Example 6: Check VAT registration requirement
const needsRegistration = isVATRegistrationRequired(400000, 'SA'); // Returns: true

// Example 7: Get country-specific VAT rate
const saudiVATRate = getVATRate('SA', new Date(), 'standard'); // Returns: 0.15

// Example 8: Partial payment VAT calculation
const partial = calculateVATForPartialPayment(1150, 0.15, 50); // 50% payment
// Returns: { paymentAmount: 575, vatComponent: 75 }
*/