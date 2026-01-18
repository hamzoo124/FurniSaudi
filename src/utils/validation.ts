// src/utils/validation.ts

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ValidationRule<T = any> {
  validator: (value: T) => boolean;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ValidationOptions {
  trim?: boolean;
  allowEmpty?: boolean;
  customMessage?: string;
}

export interface EmailValidationOptions extends ValidationOptions {
  allowLocal?: boolean;
  allowSubdomains?: boolean;
  requireTld?: boolean;
}

export interface PhoneValidationOptions extends ValidationOptions {
  countryCode?: string;
  format?: 'international' | 'local' | 'any';
  allowExtensions?: boolean;
}

export interface NumberValidationOptions extends ValidationOptions {
  min?: number;
  max?: number;
  integerOnly?: boolean;
  positiveOnly?: boolean;
}

export interface StringValidationOptions extends ValidationOptions {
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  allowedChars?: string[];
  disallowedChars?: string[];
}

export interface Validator<T = any> {
  (value: T, options?: ValidationOptions): ValidationResult;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
const STRICT_EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

// Saudi Arabia phone regex (starts with 05, 10 digits total)
const SA_PHONE_REGEX = /^(009665|9665|\+9665|05|5)(5|0|3|6|4|9|1|8|7|2)([0-9]{7})$/;
// International phone regex (E.164 format)
const INTERNATIONAL_PHONE_REGEX = /^\+[1-9]\d{1,14}$/;
// General phone regex
const GENERAL_PHONE_REGEX = /^[\+]?[1-9][\d]{0,15}$/;

const NUMBER_REGEX = /^-?\d*\.?\d+$/;
const INTEGER_REGEX = /^-?\d+$/;
const POSITIVE_NUMBER_REGEX = /^\d*\.?\d+$/;
const POSITIVE_INTEGER_REGEX = /^\d+$/;

// Special characters that should be restricted in most inputs
const RESTRICTED_CHARS = ['<', '>', '&', '"', "'", '\\', '/', ';', '`'];

// VAT Number regex for Saudi Arabia
const VAT_REGEX = /^\d{15}$/;

// URL validation regex
const URL_REGEX = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;

// Currency regex (SAR)
const CURRENCY_REGEX = /^[\d,]+\.?\d{0,2}$/;

// ============================================================================
// MAIN VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates if a value is a valid email address
 * @param value - Email string to validate
 * @param options - Validation options
 * @returns Validation result
 */
export function validateEmail(
  value: string,
  options: EmailValidationOptions = {}
): ValidationResult {
  const errors: string[] = [];
  const {
    trim = true,
    allowEmpty = false,
    customMessage,
    allowLocal = false,
    allowSubdomains = true,
    requireTld = true
  } = options;

  const processedValue = trim ? value.trim() : value;

  // Check if empty
  if (!processedValue) {
    if (!allowEmpty) {
      errors.push(customMessage || 'Email is required');
    }
    return { isValid: errors.length === 0, errors };
  }

  // Use appropriate regex based on options
  const regex = requireTld ? STRICT_EMAIL_REGEX : EMAIL_REGEX;
  const isValidFormat = regex.test(processedValue);

  if (!isValidFormat) {
    errors.push(customMessage || 'Please enter a valid email address');
    return { isValid: false, errors };
  }

  // Check for local addresses (without @domain)
  if (!allowLocal && processedValue.indexOf('@') === -1) {
    errors.push(customMessage || 'Email must contain a domain');
    return { isValid: false, errors };
  }

  // Additional validation for subdomains
  if (!allowSubdomains) {
    const domainParts = processedValue.split('@')[1].split('.');
    if (domainParts.length > 2) {
      errors.push(customMessage || 'Subdomains are not allowed');
      return { isValid: false, errors };
    }
  }

  return { isValid: true, errors: [] };
}

/**
 * Validates if a value is a valid phone number
 * @param value - Phone number string to validate
 * @param options - Validation options
 * @returns Validation result
 */
export function validatePhoneNumber(
  value: string,
  options: PhoneValidationOptions = {}
): ValidationResult {
  const errors: string[] = [];
  const {
    trim = true,
    allowEmpty = false,
    customMessage,
    countryCode = 'SA',
    format = 'any',
    allowExtensions = false
  } = options;

  const processedValue = trim ? value.trim().replace(/\s+/g, '') : value;

  // Check if empty
  if (!processedValue) {
    if (!allowEmpty) {
      errors.push(customMessage || 'Phone number is required');
    }
    return { isValid: errors.length === 0, errors };
  }

  // Remove any non-digit characters except + and x (for extensions)
  const cleanValue = allowExtensions 
    ? processedValue.replace(/[^\d+x]/g, '')
    : processedValue.replace(/[^\d+]/g, '');

  let isValid = false;
  let validationMessage = customMessage || 'Please enter a valid phone number';

  // Validate based on format
  switch (format) {
    case 'international':
      isValid = INTERNATIONAL_PHONE_REGEX.test(cleanValue);
      validationMessage = customMessage || 'Phone number must be in international format (e.g., +966501234567)';
      break;

    case 'local':
      if (countryCode === 'SA') {
        isValid = SA_PHONE_REGEX.test(cleanValue);
        validationMessage = customMessage || 'Phone number must be a valid Saudi number (e.g., 0501234567)';
      } else {
        isValid = GENERAL_PHONE_REGEX.test(cleanValue);
      }
      break;

    case 'any':
    default:
      // Try different formats
      if (countryCode === 'SA') {
        isValid = SA_PHONE_REGEX.test(cleanValue) || INTERNATIONAL_PHONE_REGEX.test(cleanValue);
      } else {
        isValid = INTERNATIONAL_PHONE_REGEX.test(cleanValue) || GENERAL_PHONE_REGEX.test(cleanValue);
      }
      break;
  }

  if (!isValid) {
    errors.push(validationMessage);
  }

  return { isValid, errors };
}

/**
 * Validates if a value is required (non-empty)
 * @param value - Value to check
 * @param options - Validation options
 * @returns Validation result
 */
export function validateRequired<T>(
  value: T,
  options: ValidationOptions = {}
): ValidationResult {
  const errors: string[] = [];
  const { trim = false, allowEmpty = false, customMessage } = options;

  if (allowEmpty) {
    return { isValid: true, errors: [] };
  }

  let isEmpty = false;

  if (typeof value === 'string') {
    const processedValue = trim ? value.trim() : value;
    isEmpty = !processedValue;
  } else if (typeof value === 'number') {
    isEmpty = isNaN(value);
  } else if (Array.isArray(value)) {
    isEmpty = value.length === 0;
  } else if (value === null || value === undefined) {
    isEmpty = true;
  } else if (typeof value === 'object') {
    isEmpty = Object.keys(value).length === 0;
  }

  if (isEmpty) {
    errors.push(customMessage || 'This field is required');
  }

  return { isValid: !isEmpty, errors };
}

/**
 * Validates if a string meets minimum length requirement
 * @param value - String to validate
 * @param minLength - Minimum length required
 * @param options - Validation options
 * @returns Validation result
 */
export function validateMinLength(
  value: string,
  minLength: number,
  options: ValidationOptions = {}
): ValidationResult {
  const errors: string[] = [];
  const { trim = true, allowEmpty = false, customMessage } = options;

  const processedValue = trim ? value.trim() : value;

  // Check if empty and allowed
  if (!processedValue && allowEmpty) {
    return { isValid: true, errors: [] };
  }

  if (!processedValue) {
    errors.push(customMessage || 'This field is required');
    return { isValid: false, errors };
  }

  if (processedValue.length < minLength) {
    errors.push(customMessage || `Minimum ${minLength} characters required`);
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validates if a string meets maximum length requirement
 * @param value - String to validate
 * @param maxLength - Maximum length allowed
 * @param options - Validation options
 * @returns Validation result
 */
export function validateMaxLength(
  value: string,
  maxLength: number,
  options: ValidationOptions = {}
): ValidationResult {
  const errors: string[] = [];
  const { trim = true, customMessage } = options;

  const processedValue = trim ? value.trim() : value;

  if (!processedValue) {
    return { isValid: true, errors: [] };
  }

  if (processedValue.length > maxLength) {
    errors.push(customMessage || `Maximum ${maxLength} characters allowed`);
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validates if a value is a valid number
 * @param value - Value to validate
 * @param options - Validation options
 * @returns Validation result
 */
export function validateNumber(
  value: string | number,
  options: NumberValidationOptions = {}
): ValidationResult {
  const errors: string[] = [];
  const {
    trim = true,
    allowEmpty = false,
    customMessage,
    min,
    max,
    integerOnly = false,
    positiveOnly = false
  } = options;

  const processedValue = typeof value === 'string' ? (trim ? value.trim() : value) : value.toString();

  // Check if empty
  if (!processedValue) {
    if (!allowEmpty) {
      errors.push(customMessage || 'This field is required');
    }
    return { isValid: errors.length === 0, errors };
  }

  // Check if it's a valid number
  let isValidNumber = false;
  let numericValue: number;

  if (typeof value === 'number') {
    numericValue = value;
    isValidNumber = !isNaN(value);
  } else {
    // String validation
    if (positiveOnly) {
      isValidNumber = integerOnly 
        ? POSITIVE_INTEGER_REGEX.test(processedValue)
        : POSITIVE_NUMBER_REGEX.test(processedValue);
    } else {
      isValidNumber = integerOnly 
        ? INTEGER_REGEX.test(processedValue)
        : NUMBER_REGEX.test(processedValue);
    }

    if (isValidNumber) {
      numericValue = parseFloat(processedValue);
    } else {
      errors.push(customMessage || 'Please enter a valid number');
      return { isValid: false, errors };
    }
  }

  // Check integer requirement
  if (integerOnly && !Number.isInteger(numericValue)) {
    errors.push(customMessage || 'Please enter a whole number');
    return { isValid: false, errors };
  }

  // Check positive requirement
  if (positiveOnly && numericValue < 0) {
    errors.push(customMessage || 'Please enter a positive number');
    return { isValid: false, errors };
  }

  // Check minimum value
  if (min !== undefined && numericValue < min) {
    errors.push(customMessage || `Minimum value is ${min}`);
  }

  // Check maximum value
  if (max !== undefined && numericValue > max) {
    errors.push(customMessage || `Maximum value is ${max}`);
  }

  return { isValid: errors.length === 0, errors };
}

// ============================================================================
// COMPOSITE VALIDATORS
// ============================================================================

/**
 * Creates a composite validator that runs multiple validation rules
 * @param validators - Array of validation rules
 * @returns Composite validation result
 */
export function createCompositeValidator<T>(
  validators: Array<ValidationRule<T>>
): Validator<T> {
  return (value: T): ValidationResult => {
    const errors: string[] = [];

    for (const rule of validators) {
      if (!rule.validator(value)) {
        errors.push(rule.message);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };
}

/**
 * Validates a string with multiple constraints
 * @param value - String to validate
 * @param options - String validation options
 * @returns Validation result
 */
export function validateString(
  value: string,
  options: StringValidationOptions = {}
): ValidationResult {
  const errors: string[] = [];
  const {
    trim = true,
    allowEmpty = false,
    minLength,
    maxLength,
    pattern,
    allowedChars,
    disallowedChars = RESTRICTED_CHARS
  } = options;

  const processedValue = trim ? value.trim() : value;

  // Check required
  if (!allowEmpty && !processedValue) {
    errors.push('This field is required');
    return { isValid: false, errors };
  }

  if (!processedValue && allowEmpty) {
    return { isValid: true, errors: [] };
  }

  // Check min length
  if (minLength && processedValue.length < minLength) {
    errors.push(`Minimum ${minLength} characters required`);
  }

  // Check max length
  if (maxLength && processedValue.length > maxLength) {
    errors.push(`Maximum ${maxLength} characters allowed`);
  }

  // Check pattern
  if (pattern && !pattern.test(processedValue)) {
    errors.push('Invalid format');
  }

  // Check for disallowed characters
  if (disallowedChars && disallowedChars.length > 0) {
    const foundDisallowed = disallowedChars.filter(char => 
      processedValue.includes(char)
    );
    if (foundDisallowed.length > 0) {
      errors.push(`Contains invalid characters: ${foundDisallowed.join(', ')}`);
    }
  }

  // Check for allowed characters (whitelist)
  if (allowedChars && allowedChars.length > 0) {
    const invalidChars = Array.from(processedValue).filter(char => 
      !allowedChars.includes(char)
    );
    if (invalidChars.length > 0) {
      errors.push(`Contains invalid characters: ${invalidChars.slice(0, 5).join(', ')}`);
    }
  }

  return { isValid: errors.length === 0, errors };
}

// ============================================================================
// DOMAIN-SPECIFIC VALIDATORS
// ============================================================================

/**
 * Validates Saudi Arabia VAT number
 * @param value - VAT number string
 * @param options - Validation options
 * @returns Validation result
 */
export function validateVATNumber(
  value: string,
  options: ValidationOptions = {}
): ValidationResult {
  const errors: string[] = [];
  const { trim = true, allowEmpty = false, customMessage } = options;

  const processedValue = trim ? value.trim() : value;

  if (!processedValue) {
    if (!allowEmpty) {
      errors.push(customMessage || 'VAT number is required');
    }
    return { isValid: errors.length === 0, errors };
  }

  if (!VAT_REGEX.test(processedValue)) {
    errors.push(customMessage || 'VAT number must be 15 digits');
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validates a URL
 * @param value - URL string
 * @param options - Validation options
 * @returns Validation result
 */
export function validateURL(
  value: string,
  options: ValidationOptions & { requireProtocol?: boolean } = {}
): ValidationResult {
  const errors: string[] = [];
  const { trim = true, allowEmpty = false, customMessage, requireProtocol = false } = options;

  const processedValue = trim ? value.trim() : value;

  if (!processedValue) {
    if (!allowEmpty) {
      errors.push(customMessage || 'URL is required');
    }
    return { isValid: errors.length === 0, errors };
  }

  try {
    // Try to create a URL object
    const url = new URL(processedValue.includes('://') ? processedValue : `https://${processedValue}`);
    
    if (requireProtocol && !processedValue.includes('://')) {
      errors.push(customMessage || 'URL must include protocol (http:// or https://)');
    }

    // Additional checks
    if (!url.hostname.includes('.')) {
      errors.push(customMessage || 'Please enter a valid domain name');
    }
  } catch {
    errors.push(customMessage || 'Please enter a valid URL');
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validates currency amount (SAR format)
 * @param value - Currency string or number
 * @param options - Validation options
 * @returns Validation result
 */
export function validateCurrency(
  value: string | number,
  options: NumberValidationOptions & { allowNegative?: boolean } = {}
): ValidationResult {
  const errors: string[] = [];
  const {
    trim = true,
    allowEmpty = false,
    customMessage,
    min = 0,
    max,
    integerOnly = false,
    allowNegative = false
  } = options;

  const processedValue = typeof value === 'string' ? (trim ? value.trim() : value) : value.toString();

  if (!processedValue) {
    if (!allowEmpty) {
      errors.push(customMessage || 'Amount is required');
    }
    return { isValid: errors.length === 0, errors };
  }

  // Remove commas for validation
  const cleanValue = processedValue.replace(/,/g, '');

  // Validate number format
  const numberResult = validateNumber(cleanValue, {
    integerOnly,
    positiveOnly: !allowNegative,
    min: allowNegative ? undefined : min,
    max
  });

  if (!numberResult.isValid) {
    errors.push(...numberResult.errors.map(err => 
      customMessage ? customMessage : err.replace('number', 'amount')
    ));
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validates password strength
 * @param value - Password string
 * @param options - Validation options
 * @returns Validation result
 */
export function validatePassword(
  value: string,
  options: ValidationOptions & { 
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumbers?: boolean;
    requireSpecialChars?: boolean;
    minLength?: number;
  } = {}
): ValidationResult {
  const errors: string[] = [];
  const {
    trim = false,
    allowEmpty = false,
    customMessage,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = true,
    minLength = 8
  } = options;

  const processedValue = trim ? value.trim() : value;

  if (!processedValue) {
    if (!allowEmpty) {
      errors.push(customMessage || 'Password is required');
    }
    return { isValid: errors.length === 0, errors };
  }

  // Check minimum length
  if (processedValue.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }

  // Check uppercase
  if (requireUppercase && !/[A-Z]/.test(processedValue)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Check lowercase
  if (requireLowercase && !/[a-z]/.test(processedValue)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Check numbers
  if (requireNumbers && !/\d/.test(processedValue)) {
    errors.push('Password must contain at least one number');
  }

  // Check special characters
  if (requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(processedValue)) {
    errors.push('Password must contain at least one special character');
  }

  return { isValid: errors.length === 0, errors };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Creates a validation rule with a custom validator
 */
export function createValidationRule<T>(
  validator: (value: T) => boolean,
  message: string
): ValidationRule<T> {
  return { validator, message };
}

/**
 * Extracts error messages from validation results
 */
export function extractErrorMessages(results: ValidationResult[]): string[] {
  return results.flatMap(result => result.errors);
}

/**
 * Checks if all validation results are valid
 */
export function allValid(results: ValidationResult[]): boolean {
  return results.every(result => result.isValid);
}

// ============================================================================
// SIMPLE VALIDATORS (for direct use)
// ============================================================================

/**
 * Simple email validation
 */
export function isEmail(value: string): boolean {
  return validateEmail(value).isValid;
}

/**
 * Simple phone number validation
 */
export function isPhoneNumber(value: string): boolean {
  return validatePhoneNumber(value).isValid;
}

/**
 * Simple required validation
 */
export function isRequired<T>(value: T): boolean {
  return validateRequired(value).isValid;
}

/**
 * Simple minimum length validation
 */
export function minLength(value: string, length: number): boolean {
  return validateMinLength(value, length).isValid;
}

/**
 * Simple maximum length validation
 */
export function maxLength(value: string, length: number): boolean {
  return validateMaxLength(value, length).isValid;
}

/**
 * Simple number validation
 */
export function isNumber(value: string | number): boolean {
  return validateNumber(value).isValid;
}

// ============================================================================
// EXAMPLES OF USAGE
// ============================================================================

/*
// Example 1: Email validation
const emailResult = validateEmail('seller@example.com');
console.log(emailResult.isValid); // true
console.log(emailResult.errors); // []

// Example 2: Phone number validation (Saudi format)
const phoneResult = validatePhoneNumber('0501234567', { countryCode: 'SA', format: 'local' });
console.log(phoneResult.isValid); // true

// Example 3: Required field validation
const requiredResult = validateRequired('', { customMessage: 'Name is required' });
console.log(requiredResult.isValid); // false
console.log(requiredResult.errors); // ['Name is required']

// Example 4: Password validation
const passwordResult = validatePassword('Password123!', {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true
});
console.log(passwordResult.isValid); // true

// Example 5: Composite validation for product form
const productValidators = createCompositeValidator([
  createValidationRule(
    (name: string) => validateRequired(name).isValid,
    'Product name is required'
  ),
  createValidationRule(
    (price: number) => validateNumber(price, { min: 1, positiveOnly: true }).isValid,
    'Price must be greater than 0'
  ),
  createValidationRule(
    (stock: number) => validateNumber(stock, { integerOnly: true, min: 0 }).isValid,
    'Stock must be a non-negative integer'
  )
]);

const productValidation = productValidators({
  name: 'Premium Chair',
  price: 199.99,
  stock: 50
});
console.log(productValidation.isValid); // true

// Example 6: Simple validators
console.log(isEmail('test@example.com')); // true
console.log(isPhoneNumber('+966501234567')); // true
console.log(isRequired('not empty')); // true
console.log(minLength('password', 8)); // false
console.log(maxLength('short', 10)); // true
console.log(isNumber('123.45')); // true

// Example 7: Store profile validation
const storeValidation = allValid([
  validateRequired(storeName, { customMessage: 'Store name is required' }),
  validateEmail(storeEmail),
  validatePhoneNumber(storePhone, { countryCode: 'SA' }),
  validateVATNumber(vatNumber, { allowEmpty: true }),
  validateURL(website, { requireProtocol: true, allowEmpty: true })
]);

// Example 8: String validation with pattern
const skuValidation = validateString(sku, {
  minLength: 3,
  maxLength: 50,
  pattern: /^[A-Z0-9-_]+$/,
  customMessage: 'SKU must contain only uppercase letters, numbers, hyphens, and underscores'
});
*/

export default {
  // Simple validators
  isEmail,
  isPhoneNumber,
  isRequired,
  minLength,
  maxLength,
  isNumber,

  // Composite validators
  validateEmail,
  validatePhoneNumber,
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validateNumber,
  validateString,
  validateVATNumber,
  validateURL,
  validateCurrency,
  validatePassword,

  // Utility functions
  createCompositeValidator,
  createValidationRule,
  extractErrorMessages,
  allValid
};