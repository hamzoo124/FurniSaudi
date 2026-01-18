// src/utils/currency.ts

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  symbolNative: string;
  decimalDigits: number;
  rounding: number;
  namePlural: string;
  thousandsSeparator: string;
  decimalSeparator: string;
  spaceBetweenAmountAndSymbol: boolean;
  symbolOnLeft: boolean;
}

export interface ConversionRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  lastUpdated: string;
  source: string;
}

export interface CurrencyFormatOptions {
  showSymbol?: boolean;
  showCode?: boolean;
  compact?: boolean;
  notation?: 'standard' | 'scientific' | 'engineering' | 'compact';
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  useGrouping?: boolean;
  signDisplay?: 'auto' | 'never' | 'always' | 'exceptZero';
  style?: 'currency' | 'accounting';
  customSymbol?: string;
}

// ============================================
// CURRENCY DATA
// ============================================

export const CURRENCIES: Record<string, CurrencyInfo> = {
  USD: {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    symbolNative: '$',
    decimalDigits: 2,
    rounding: 0,
    namePlural: 'US dollars',
    thousandsSeparator: ',',
    decimalSeparator: '.',
    spaceBetweenAmountAndSymbol: false,
    symbolOnLeft: true,
  },
  EUR: {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    symbolNative: '€',
    decimalDigits: 2,
    rounding: 0,
    namePlural: 'euros',
    thousandsSeparator: '.',
    decimalSeparator: ',',
    spaceBetweenAmountAndSymbol: true,
    symbolOnLeft: true,
  },
  GBP: {
    code: 'GBP',
    name: 'British Pound Sterling',
    symbol: '£',
    symbolNative: '£',
    decimalDigits: 2,
    rounding: 0,
    namePlural: 'British pounds sterling',
    thousandsSeparator: ',',
    decimalSeparator: '.',
    spaceBetweenAmountAndSymbol: false,
    symbolOnLeft: true,
  },
  JPY: {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    symbolNative: '￥',
    decimalDigits: 0,
    rounding: 0,
    namePlural: 'Japanese yen',
    thousandsSeparator: ',',
    decimalSeparator: '.',
    spaceBetweenAmountAndSymbol: false,
    symbolOnLeft: true,
  },
  CNY: {
    code: 'CNY',
    name: 'Chinese Yuan',
    symbol: 'CN¥',
    symbolNative: 'CN¥',
    decimalDigits: 2,
    rounding: 0,
    namePlural: 'Chinese yuan',
    thousandsSeparator: ',',
    decimalSeparator: '.',
    spaceBetweenAmountAndSymbol: false,
    symbolOnLeft: true,
  },
  INR: {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    symbolNative: 'টকা',
    decimalDigits: 2,
    rounding: 0,
    namePlural: 'Indian rupees',
    thousandsSeparator: ',',
    decimalSeparator: '.',
    spaceBetweenAmountAndSymbol: false,
    symbolOnLeft: true,
  },
  SAR: {
    code: 'SAR',
    name: 'Saudi Riyal',
    symbol: 'SAR',
    symbolNative: 'ر.س.‏',
    decimalDigits: 2,
    rounding: 0,
    namePlural: 'Saudi riyals',
    thousandsSeparator: ',',
    decimalSeparator: '.',
    spaceBetweenAmountAndSymbol: true,
    symbolOnLeft: true,
  },
  AED: {
    code: 'AED',
    name: 'United Arab Emirates Dirham',
    symbol: 'AED',
    symbolNative: 'د.إ.‏',
    decimalDigits: 2,
    rounding: 0,
    namePlural: 'UAE dirhams',
    thousandsSeparator: ',',
    decimalSeparator: '.',
    spaceBetweenAmountAndSymbol: true,
    symbolOnLeft: true,
  },
  QAR: {
    code: 'QAR',
    name: 'Qatari Rial',
    symbol: 'QAR',
    symbolNative: 'ر.ق.‏',
    decimalDigits: 2,
    rounding: 0,
    namePlural: 'Qatari rials',
    thousandsSeparator: ',',
    decimalSeparator: '.',
    spaceBetweenAmountAndSymbol: true,
    symbolOnLeft: true,
  },
  BHD: {
    code: 'BHD',
    name: 'Bahraini Dinar',
    symbol: 'BHD',
    symbolNative: 'د.ب.‏',
    decimalDigits: 3,
    rounding: 0,
    namePlural: 'Bahraini dinars',
    thousandsSeparator: ',',
    decimalSeparator: '.',
    spaceBetweenAmountAndSymbol: true,
    symbolOnLeft: true,
  },
  KWD: {
    code: 'KWD',
    name: 'Kuwaiti Dinar',
    symbol: 'KWD',
    symbolNative: 'د.ك.‏',
    decimalDigits: 3,
    rounding: 0,
    namePlural: 'Kuwaiti dinars',
    thousandsSeparator: ',',
    decimalSeparator: '.',
    spaceBetweenAmountAndSymbol: true,
    symbolOnLeft: true,
  },
  OMR: {
    code: 'OMR',
    name: 'Omani Rial',
    symbol: 'OMR',
    symbolNative: 'ر.ع.‏',
    decimalDigits: 3,
    rounding: 0,
    namePlural: 'Omani rials',
    thousandsSeparator: ',',
    decimalSeparator: '.',
    spaceBetweenAmountAndSymbol: true,
    symbolOnLeft: true,
  },
  CAD: {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: 'CA$',
    symbolNative: '$',
    decimalDigits: 2,
    rounding: 0,
    namePlural: 'Canadian dollars',
    thousandsSeparator: ',',
    decimalSeparator: '.',
    spaceBetweenAmountAndSymbol: false,
    symbolOnLeft: true,
  },
  AUD: {
    code: 'AUD',
    name: 'Australian Dollar',
    symbol: 'AU$',
    symbolNative: '$',
    decimalDigits: 2,
    rounding: 0,
    namePlural: 'Australian dollars',
    thousandsSeparator: ',',
    decimalSeparator: '.',
    spaceBetweenAmountAndSymbol: false,
    symbolOnLeft: true,
  },
  CHF: {
    code: 'CHF',
    name: 'Swiss Franc',
    symbol: 'CHF',
    symbolNative: 'CHF',
    decimalDigits: 2,
    rounding: 0,
    namePlural: 'Swiss francs',
    thousandsSeparator: "'",
    decimalSeparator: '.',
    spaceBetweenAmountAndSymbol: true,
    symbolOnLeft: true,
  },
  SEK: {
    code: 'SEK',
    name: 'Swedish Krona',
    symbol: 'SEK',
    symbolNative: 'kr',
    decimalDigits: 2,
    rounding: 0,
    namePlural: 'Swedish kronor',
    thousandsSeparator: ' ',
    decimalSeparator: ',',
    spaceBetweenAmountAndSymbol: true,
    symbolOnLeft: false,
  },
};

// ============================================
// CURRENCY CONVERSION RATES (STATIC FOR DEMO)
// ============================================

// Base currency: USD
const DEMO_CONVERSION_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.85,
  GBP: 0.73,
  JPY: 110.5,
  CNY: 6.45,
  INR: 74.5,
  SAR: 3.75,
  AED: 3.67,
  QAR: 3.64,
  BHD: 0.38,
  KWD: 0.30,
  OMR: 0.38,
  CAD: 1.25,
  AUD: 1.35,
  CHF: 0.92,
  SEK: 8.65,
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Validates currency code
 */
const validateCurrencyCode = (currencyCode: string): void => {
  if (!CURRENCIES[currencyCode.toUpperCase()]) {
    throw new Error(`Invalid currency code: ${currencyCode}. Supported codes: ${Object.keys(CURRENCIES).join(', ')}`);
  }
};

/**
 * Safely parse locale
 */
const parseLocale = (locale?: string): string => {
  if (!locale) return 'en-US';
  
  try {
    // Test if locale is valid
    new Intl.NumberFormat(locale);
    return locale;
  } catch {
    console.warn(`Invalid locale "${locale}", falling back to "en-US"`);
    return 'en-US';
  }
};

/**
 * Get currency info
 */
export const getCurrencyInfo = (currencyCode: string): CurrencyInfo => {
  const code = currencyCode.toUpperCase();
  validateCurrencyCode(code);
  return CURRENCIES[code];
};

// ============================================
// MAIN FUNCTIONS
// ============================================

/**
 * Formats a number into a readable currency string
 */
export const formatCurrency = (
  amount: number,
  currency: string = 'USD',
  locale?: string,
  options: CurrencyFormatOptions = {}
): string => {
  try {
    const safeLocale = parseLocale(locale);
    const currencyInfo = getCurrencyInfo(currency);
    
    const {
      showSymbol = true,
      showCode = false,
      compact = false,
      notation = 'standard',
      minimumFractionDigits,
      maximumFractionDigits,
      useGrouping = true,
      signDisplay = 'auto',
      style = 'currency',
      customSymbol,
    } = options;

    // Handle negative zero
    const normalizedAmount = Object.is(amount, -0) ? 0 : amount;

    // Use Intl.NumberFormat for standard formatting
    const formatter = new Intl.NumberFormat(safeLocale, {
      style,
      currency,
      currencyDisplay: showCode ? 'code' : 'symbol',
      notation: compact ? 'compact' : notation,
      minimumFractionDigits: minimumFractionDigits !== undefined 
        ? minimumFractionDigits 
        : currencyInfo.decimalDigits,
      maximumFractionDigits: maximumFractionDigits !== undefined 
        ? maximumFractionDigits 
        : currencyInfo.decimalDigits,
      useGrouping,
      signDisplay,
    });

    let formatted = formatter.format(normalizedAmount);

    // Custom symbol handling
    if (customSymbol && showSymbol) {
      const symbolPattern = new RegExp(`[${currencyInfo.symbol}${currencyInfo.symbolNative}]`, 'g');
      formatted = formatted.replace(symbolPattern, customSymbol);
    }

    // Handle special cases
    if (!showSymbol && !showCode) {
      // Remove currency symbol/code
      const symbolPattern = new RegExp(`[^0-9${currencyInfo.thousandsSeparator}${currencyInfo.decimalSeparator}\-\+\s]`, 'g');
      formatted = formatted.replace(symbolPattern, '').trim();
    }

    return formatted;
  } catch (error) {
    console.error('Error formatting currency:', error);
    
    // Fallback formatting
    const currencyInfo = getCurrencyInfo(currency);
    const formattedAmount = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: currencyInfo.decimalDigits,
      maximumFractionDigits: currencyInfo.decimalDigits,
    }).format(Math.abs(amount));
    
    const sign = amount < 0 ? '-' : '';
    const symbol = options.customSymbol || currencyInfo.symbol;
    const space = currencyInfo.spaceBetweenAmountAndSymbol ? ' ' : '';
    
    if (currencyInfo.symbolOnLeft) {
      return `${sign}${symbol}${space}${formattedAmount}`;
    } else {
      return `${sign}${formattedAmount}${space}${symbol}`;
    }
  }
};

/**
 * Formats currency with specific precision for financial reporting
 */
export const formatCurrencyPrecise = (
  amount: number,
  currency: string = 'USD',
  precision: number = 2
): string => {
  const currencyInfo = getCurrencyInfo(currency);
  const actualPrecision = Math.min(precision, currencyInfo.decimalDigits);
  
  return formatCurrency(amount, currency, 'en-US', {
    minimumFractionDigits: actualPrecision,
    maximumFractionDigits: actualPrecision,
  });
};

/**
 * Formats large currency amounts in a compact form
 */
export const formatCurrencyCompact = (
  amount: number,
  currency: string = 'USD'
): string => {
  return formatCurrency(amount, currency, 'en-US', {
    compact: true,
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
};

/**
 * Converts amount from one currency to another
 */
export const convertCurrency = async (
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rate?: number
): Promise<number> => {
  try {
    validateCurrencyCode(fromCurrency);
    validateCurrencyCode(toCurrency);
    
    // If same currency, return original amount
    if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) {
      return amount;
    }

    let conversionRate: number;

    if (rate !== undefined) {
      // Use provided rate
      conversionRate = rate;
    } else {
      // Fetch conversion rate (in production, use a real API)
      conversionRate = await fetchConversionRate(fromCurrency, toCurrency);
    }

    // Convert amount
    const converted = amount * conversionRate;
    
    // Round to appropriate decimal places
    const toCurrencyInfo = getCurrencyInfo(toCurrency);
    const multiplier = Math.pow(10, toCurrencyInfo.decimalDigits);
    const rounded = Math.round(converted * multiplier) / multiplier;
    
    return rounded;
  } catch (error) {
    console.error('Error converting currency:', error);
    throw new Error(`Failed to convert currency: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Parses formatted currency strings to numeric value
 */
export const parseCurrency = (
  input: string,
  currency: string = 'USD'
): number => {
  try {
    if (!input || typeof input !== 'string') {
      return 0;
    }

    const currencyInfo = getCurrencyInfo(currency);
    
    // Remove all currency symbols, codes, and special characters
    const symbolsToRemove = [
      currencyInfo.symbol,
      currencyInfo.symbolNative,
      currencyInfo.code,
      // Common currency symbols
      '$', '€', '£', '¥', '₹', '₽', '₩', '₺',
      // Thousands separators (keep decimal separator)
      currencyInfo.thousandsSeparator,
      // Additional spaces and non-breaking spaces
      ' ', ' ',
    ];

    let cleaned = input.trim();
    
    // Remove symbols
    symbolsToRemove.forEach(symbol => {
      cleaned = cleaned.replace(new RegExp(`\\${symbol}`, 'g'), '');
    });

    // Remove parentheses for negative accounting format
    const isNegativeAccounting = cleaned.startsWith('(') && cleaned.endsWith(')');
    if (isNegativeAccounting) {
      cleaned = cleaned.slice(1, -1);
    }

    // Handle negative signs
    const isNegative = cleaned.includes('-') || isNegativeAccounting;
    cleaned = cleaned.replace(/-/g, '');

    // Replace decimal separator with dot for parsing
    if (currencyInfo.decimalSeparator !== '.') {
      cleaned = cleaned.replace(new RegExp(`\\${currencyInfo.decimalSeparator}`, 'g'), '.');
    }

    // Parse the number
    const parsed = parseFloat(cleaned);
    
    if (isNaN(parsed)) {
      throw new Error(`Failed to parse currency string: ${input}`);
    }

    // Apply negative sign if needed
    return isNegative ? -Math.abs(parsed) : parsed;
  } catch (error) {
    console.error('Error parsing currency:', error);
    throw new Error(`Failed to parse currency: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// ============================================
// CONVERSION RATE MANAGEMENT
// ============================================

/**
 * Fetch conversion rate from an API (demo implementation)
 */
const fetchConversionRate = async (
  fromCurrency: string,
  toCurrency: string
): Promise<number> => {
  // In production, use a real API like:
  // - ExchangeRate-API
  // - OpenExchangeRates
  // - Fixer.io
  
  // For demo purposes, use static rates
  const fromUpper = fromCurrency.toUpperCase();
  const toUpper = toCurrency.toUpperCase();
  
  // Convert through USD as base
  const fromRate = DEMO_CONVERSION_RATES[fromUpper];
  const toRate = DEMO_CONVERSION_RATES[toUpper];
  
  if (!fromRate || !toRate) {
    throw new Error(`Conversion rate not available for ${fromCurrency} to ${toCurrency}`);
  }
  
  // Calculate rate: fromCurrency → USD → toCurrency
  return toRate / fromRate;
};

/**
 * Get all available conversion rates
 */
export const getConversionRates = async (
  baseCurrency: string = 'USD'
): Promise<ConversionRate[]> => {
  const baseRate = DEMO_CONVERSION_RATES[baseCurrency.toUpperCase()];
  
  if (!baseRate) {
    throw new Error(`Base currency ${baseCurrency} not supported`);
  }
  
  return Object.entries(DEMO_CONVERSION_RATES).map(([currency, rate]) => ({
    fromCurrency: baseCurrency,
    toCurrency: currency,
    rate: rate / baseRate,
    lastUpdated: new Date().toISOString(),
    source: 'demo',
  }));
};

// ============================================
// FINANCIAL CALCULATION UTILITIES
// ============================================

/**
 * Calculate VAT amount
 */
export const calculateVAT = (
  amount: number,
  vatRate: number = 0.15, // 15% default for Saudi Arabia
  inclusive: boolean = false
): { net: number; vat: number; gross: number } => {
  const safeVatRate = Math.max(0, Math.min(vatRate, 1)); // Clamp between 0 and 1
  
  if (inclusive) {
    // Amount includes VAT
    const net = amount / (1 + safeVatRate);
    const vat = amount - net;
    return {
      net: roundCurrency(net),
      vat: roundCurrency(vat),
      gross: roundCurrency(amount),
    };
  } else {
    // Amount excludes VAT
    const vat = amount * safeVatRate;
    const gross = amount + vat;
    return {
      net: roundCurrency(amount),
      vat: roundCurrency(vat),
      gross: roundCurrency(gross),
    };
  }
};

/**
 * Round currency amount to appropriate decimal places
 */
export const roundCurrency = (
  amount: number,
  currency: string = 'USD'
): number => {
  const currencyInfo = getCurrencyInfo(currency);
  const multiplier = Math.pow(10, currencyInfo.decimalDigits);
  return Math.round(amount * multiplier) / multiplier;
};

/**
 * Format percentage
 */
export const formatPercentage = (
  value: number,
  decimalPlaces: number = 2,
  showSymbol: boolean = true
): string => {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(value * 100);
  
  return showSymbol ? `${formatted}%` : formatted;
};

/**
 * Calculate profit margin
 */
export const calculateProfitMargin = (
  revenue: number,
  cost: number
): number => {
  if (revenue === 0) return 0;
  const profit = revenue - cost;
  return profit / revenue;
};

// ============================================
// BATCH OPERATIONS
// ============================================

/**
 * Format multiple currency amounts
 */
export const formatCurrencies = (
  amounts: number[],
  currency: string = 'USD',
  locale?: string
): string[] => {
  return amounts.map(amount => formatCurrency(amount, currency, locale));
};

/**
 * Convert multiple amounts
 */
export const convertCurrencies = async (
  amounts: number[],
  fromCurrency: string,
  toCurrency: string,
  rate?: number
): Promise<number[]> => {
  const conversionRate = rate !== undefined 
    ? rate 
    : await fetchConversionRate(fromCurrency, toCurrency);
  
  return amounts.map(amount => {
    const converted = amount * conversionRate;
    return roundCurrency(converted, toCurrency);
  });
};

// ============================================
// VALIDATION UTILITIES
// ============================================

/**
 * Validate currency amount
 */
export const isValidCurrencyAmount = (amount: number): boolean => {
  return (
    typeof amount === 'number' &&
    !isNaN(amount) &&
    isFinite(amount) &&
    amount >= Number.MIN_SAFE_INTEGER &&
    amount <= Number.MAX_SAFE_INTEGER
  );
};

/**
 * Get supported currencies list
 */
export const getSupportedCurrencies = (): string[] => {
  return Object.keys(CURRENCIES).sort();
};

/**
 * Check if currency is supported
 */
export const isCurrencySupported = (currencyCode: string): boolean => {
  return CURRENCIES[currencyCode.toUpperCase()] !== undefined;
};

// ============================================
// EXPORT ALL UTILITIES
// ============================================

export default {
  formatCurrency,
  formatCurrencyPrecise,
  formatCurrencyCompact,
  convertCurrency,
  parseCurrency,
  calculateVAT,
  roundCurrency,
  formatPercentage,
  calculateProfitMargin,
  formatCurrencies,
  convertCurrencies,
  isValidCurrencyAmount,
  getSupportedCurrencies,
  isCurrencySupported,
  getCurrencyInfo,
  getConversionRates,
  CURRENCIES,
};

// ============================================
// USAGE EXAMPLES
// ============================================

/*
// Example 1: Basic formatting
formatCurrency(1500, 'USD'); // "$1,500.00"
formatCurrency(1500, 'EUR', 'de-DE'); // "1.500,00 €"
formatCurrency(1500, 'JPY'); // "¥1,500"

// Example 2: Compact formatting
formatCurrencyCompact(1500000, 'USD'); // "$1.5M"
formatCurrencyCompact(1500, 'USD'); // "$1.5K"

// Example 3: Custom options
formatCurrency(1500, 'USD', 'en-US', {
  showSymbol: false,
  compact: true,
}); // "1.5K"

// Example 4: Currency conversion
const converted = await convertCurrency(100, 'USD', 'EUR');
// Returns: 85 (using demo rate of 0.85)

// Example 5: Parsing
parseCurrency("$1,500.00", 'USD'); // 1500
parseCurrency("1.500,00 €", 'EUR'); // 1500

// Example 6: VAT calculation
const vatResult = calculateVAT(1000, 0.15, false);
// Returns: { net: 1000, vat: 150, gross: 1150 }

// Example 7: Percentage formatting
formatPercentage(0.1567); // "15.67%"
formatPercentage(0.1567, 1, false); // "15.7"

// Example 8: Get currency info
getCurrencyInfo('SAR');
// Returns detailed Saudi Riyal information
*/