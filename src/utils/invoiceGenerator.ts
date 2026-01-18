// src/utils/invoiceGenerator.ts

// ============================================
// TYPES & INTERFACES
// ============================================

export interface Address {
  street: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
  apartment?: string;
  building?: string;
}

export interface ContactInfo {
  name: string;
  email: string;
  phone?: string;
  vat_number?: string;
  tax_id?: string;
  commercial_registration?: string;
}

export interface InvoiceItem {
  id: string;
  product_id: string;
  name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  unit_type?: string; // piece, kg, meter, etc.
  vat_rate: number;
  vat_amount: number;
  total_without_vat: number;
  total_with_vat: number;
  sku?: string;
  category?: string;
  discount_percentage?: number;
  discount_amount?: number;
}

export interface PaymentInfo {
  method: string; // credit_card, bank_transfer, cash, etc.
  transaction_id?: string;
  payment_date: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  card_last_four?: string;
  bank_name?: string;
}

export interface ShippingInfo {
  method: string;
  cost: number;
  tracking_number?: string;
  carrier?: string;
  estimated_delivery?: string;
  address: Address;
}

export interface Order {
  id: string;
  order_id: string;
  order_number: string;
  seller_id: string;
  customer_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  items: Array<{
    product_id: string;
    name: string;
    quantity: number;
    unit_price: number;
    sku?: string;
    category?: string;
  }>;
  shipping_fee: number;
  discount: number;
  discount_code?: string;
  notes?: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address: Address;
    vat_number?: string;
    is_business: boolean;
  };
  payment: PaymentInfo;
  shipping: ShippingInfo;
}

export interface Seller {
  id: string;
  business_name: string;
  legal_name?: string;
  vat_number: string;
  email: string;
  phone: string;
  address: Address;
  logo_url?: string;
  website?: string;
  commercial_registration?: string;
  tax_id?: string;
  bank_details?: {
    bank_name: string;
    account_name: string;
    account_number: string;
    iban: string;
  };
}

export interface InvoiceTotals {
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  shipping_fee: number;
  discount: number;
  discount_amount: number;
  total_before_vat: number;
  total_amount: number;
  items_count: number;
}

export interface InvoiceOptions {
  vat_rate?: number;
  currency?: string;
  language?: 'en' | 'ar';
  notes?: string;
  terms_and_conditions?: string;
  due_date_days?: number;
  include_breakdown?: boolean;
  include_vat_summary?: boolean;
  format_numbers?: boolean;
  round_vat?: boolean;
}

export interface Invoice {
  // Invoice metadata
  invoice_number: string;
  invoice_date: string;
  order_number: string;
  order_date: string;
  due_date: string;
  
  // Parties
  seller: Seller;
  buyer: ContactInfo & {
    address: Address;
    is_business: boolean;
  };
  
  // Items
  items: InvoiceItem[];
  items_count: number;
  
  // Totals
  totals: InvoiceTotals;
  
  // Payment & Shipping
  payment: PaymentInfo;
  shipping: ShippingInfo;
  
  // Additional info
  currency: string;
  language: string;
  notes?: string;
  terms_and_conditions?: string;
  
  // System fields
  generated_at: string;
  version: string;
  metadata: {
    original_order_id: string;
    seller_id: string;
    customer_id: string;
    is_vat_invoice: boolean;
    vat_calculation_method: 'per_item' | 'total';
  };
}

export interface InvoiceSummary {
  invoice_number: string;
  invoice_date: string;
  buyer_name: string;
  total_amount: number;
  vat_amount: number;
  status: 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled';
  due_date: string;
  currency: string;
}

export interface InvoiceGenerationResult {
  invoice: Invoice;
  raw_data: {
    items: InvoiceItem[];
    calculations: InvoiceTotals;
  };
  timestamp: string;
  success: boolean;
  error?: string;
}

// ============================================
// CONSTANTS & CONFIG
// ============================================

const DEFAULT_VAT_RATE = 0.15; // 15% for Saudi Arabia
const DEFAULT_CURRENCY = 'SAR';
const DEFAULT_LANGUAGE = 'en';
const INVOICE_NUMBER_PREFIX = 'INV';
const INVOICE_VERSION = '1.0.0';

// Saudi Arabia VAT compliance requirements
const VAT_COMPLIANCE = {
  required_fields: [
    'seller_vat_number',
    'invoice_date',
    'invoice_number',
    'taxable_amount',
    'vat_amount',
    'total_amount'
  ],
  rounding: {
    method: 'half_up' as const,
    decimals: 2
  },
  currency: 'SAR',
  languages: ['en', 'ar'] as const,
  retention_period_years: 5
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Safely round numbers for financial calculations
 */
function roundCurrency(amount: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round((amount + Number.EPSILON) * factor) / factor;
}

/**
 * Format currency with proper symbols
 */
function formatCurrency(amount: number, currency: string = DEFAULT_CURRENCY): string {
  return new Intl.NumberFormat('en-SA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Format date in Saudi Arabia standard format
 */
function formatDate(date: Date | string, format: 'short' | 'long' = 'short'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (format === 'long') {
    return dateObj.toLocaleDateString('en-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  }
  
  return dateObj.toLocaleDateString('en-SA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

/**
 * Generate a unique invoice number
 */
export function generateInvoiceNumber(
  prefix: string = INVOICE_NUMBER_PREFIX,
  sequence?: number
): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  
  // Generate sequence if not provided
  const seq = sequence || Math.floor(Math.random() * 1000000);
  const sequenceStr = seq.toString().padStart(6, '0');
  
  return `${prefix}-${year}${month}${day}-${sequenceStr}`;
}

/**
 * Calculate VAT amount for a given amount
 */
export function calculateVATAmount(
  amount: number,
  vatRate: number = DEFAULT_VAT_RATE,
  round: boolean = true
): number {
  const vatAmount = amount * vatRate;
  return round ? roundCurrency(vatAmount) : vatAmount;
}

/**
 * Calculate invoice item totals
 */
export function calculateItemTotals(
  quantity: number,
  unitPrice: number,
  vatRate: number = DEFAULT_VAT_RATE,
  discountPercentage: number = 0
): {
  total_without_vat: number;
  vat_amount: number;
  total_with_vat: number;
  discount_amount: number;
} {
  // Calculate base amount
  const baseAmount = quantity * unitPrice;
  
  // Apply discount if any
  const discountAmount = roundCurrency(baseAmount * (discountPercentage / 100));
  const amountAfterDiscount = baseAmount - discountAmount;
  
  // Calculate VAT
  const vatAmount = calculateVATAmount(amountAfterDiscount, vatRate);
  const totalWithVAT = amountAfterDiscount + vatAmount;
  
  return {
    total_without_vat: roundCurrency(amountAfterDiscount),
    vat_amount: roundCurrency(vatAmount),
    total_with_vat: roundCurrency(totalWithVAT),
    discount_amount: roundCurrency(discountAmount)
  };
}

/**
 * Calculate all invoice totals from items
 */
export function calculateInvoiceTotals(
  items: InvoiceItem[],
  shippingFee: number = 0,
  discount: number = 0,
  vatRate: number = DEFAULT_VAT_RATE
): InvoiceTotals {
  // Calculate items totals
  let subtotal = 0;
  let itemsVAT = 0;
  let itemsCount = 0;
  
  items.forEach(item => {
    subtotal += item.total_without_vat;
    itemsVAT += item.vat_amount;
    itemsCount += item.quantity;
  });
  
  // Calculate shipping VAT (if applicable)
  const shippingVAT = calculateVATAmount(shippingFee, vatRate);
  const totalShipping = shippingFee + shippingVAT;
  
  // Calculate discount VAT (reverse calculation)
  const discountVAT = calculateVATAmount(discount, vatRate);
  const totalDiscount = discount + discountVAT;
  
  // Calculate totals
  const totalBeforeVAT = subtotal + shippingFee - discount;
  const totalVAT = itemsVAT + shippingVAT - discountVAT;
  const totalAmount = totalBeforeVAT + totalVAT;
  
  return {
    subtotal: roundCurrency(subtotal),
    vat_rate: vatRate,
    vat_amount: roundCurrency(totalVAT),
    shipping_fee: roundCurrency(shippingFee),
    discount: roundCurrency(discount),
    discount_amount: roundCurrency(totalDiscount),
    total_before_vat: roundCurrency(totalBeforeVAT),
    total_amount: roundCurrency(totalAmount),
    items_count: itemsCount
  };
}

/**
 * Validate seller VAT number (Saudi Arabia format)
 */
export function validateVATNumber(vatNumber: string): boolean {
  // Saudi Arabia VAT number format: 15 digits starting with 3
  const saudiVATRegex = /^3\d{14}$/;
  
  // Also support temporary VAT numbers (TIN)
  const tinRegex = /^\d{10,15}$/;
  
  return saudiVATRegex.test(vatNumber) || tinRegex.test(vatNumber);
}

/**
 * Prepare buyer information from order
 */
export function prepareBuyerInfo(order: Order): ContactInfo & {
  address: Address;
  is_business: boolean;
} {
  const { customer } = order;
  
  return {
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    vat_number: customer.vat_number,
    address: customer.address,
    is_business: customer.is_business
  };
}

/**
 * Prepare invoice items from order
 */
export function prepareInvoiceItems(
  orderItems: Order['items'],
  vatRate: number = DEFAULT_VAT_RATE
): InvoiceItem[] {
  return orderItems.map((item, index) => {
    const totals = calculateItemTotals(
      item.quantity,
      item.unit_price,
      vatRate,
      0 // No item-level discount by default
    );
    
    return {
      id: `item_${index + 1}`,
      product_id: item.product_id,
      name: item.name,
      quantity: item.quantity,
      unit_price: roundCurrency(item.unit_price),
      unit_type: 'piece',
      vat_rate: vatRate,
      vat_amount: totals.vat_amount,
      total_without_vat: totals.total_without_vat,
      total_with_vat: totals.total_with_vat,
      sku: item.sku,
      category: item.category
    };
  });
}

/**
 * Prepare payment information for invoice
 */
export function preparePaymentInfo(
  orderPayment: PaymentInfo,
  invoiceTotal: number
): PaymentInfo {
  return {
    ...orderPayment,
    status: orderPayment.status === 'completed' ? 'completed' : 'pending'
  };
}

// ============================================
// MAIN INVOICE GENERATOR
// ============================================

/**
 * Generate a complete invoice from order and seller data
 */
export function generateInvoice(
  order: Order,
  seller: Seller,
  options: InvoiceOptions = {}
): InvoiceGenerationResult {
  try {
    // Validate required data
    if (!order || !seller) {
      throw new Error('Order and seller data are required');
    }
    
    if (!seller.vat_number) {
      throw new Error('Seller VAT number is required for invoice generation');
    }
    
    // Validate seller VAT number
    if (!validateVATNumber(seller.vat_number)) {
      console.warn('Seller VAT number format may be invalid:', seller.vat_number);
    }
    
    // Apply defaults
    const vatRate = options.vat_rate ?? DEFAULT_VAT_RATE;
    const currency = options.currency ?? DEFAULT_CURRENCY;
    const language = options.language ?? DEFAULT_LANGUAGE;
    const dueDateDays = options.due_date_days ?? 30;
    
    // Generate invoice number
    const invoiceNumber = generateInvoiceNumber();
    
    // Calculate dates
    const invoiceDate = new Date().toISOString();
    const orderDate = order.created_at;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + dueDateDays);
    
    // Prepare buyer info
    const buyer = prepareBuyerInfo(order);
    
    // Prepare invoice items
    const items = prepareInvoiceItems(order.items, vatRate);
    
    // Calculate totals
    const totals = calculateInvoiceTotals(
      items,
      order.shipping_fee,
      order.discount,
      vatRate
    );
    
    // Prepare payment info
    const payment = preparePaymentInfo(order.payment, totals.total_amount);
    
    // Construct invoice
    const invoice: Invoice = {
      // Metadata
      invoice_number: invoiceNumber,
      invoice_date: invoiceDate,
      order_number: order.order_number,
      order_date: orderDate,
      due_date: dueDate.toISOString(),
      
      // Parties
      seller,
      buyer,
      
      // Items
      items,
      items_count: totals.items_count,
      
      // Totals
      totals,
      
      // Payment & Shipping
      payment,
      shipping: order.shipping,
      
      // Additional info
      currency,
      language,
      notes: options.notes || order.notes,
      terms_and_conditions: options.terms_and_conditions,
      
      // System fields
      generated_at: invoiceDate,
      version: INVOICE_VERSION,
      metadata: {
        original_order_id: order.id,
        seller_id: seller.id,
        customer_id: order.customer_id,
        is_vat_invoice: !!seller.vat_number,
        vat_calculation_method: 'per_item'
      }
    };
    
    return {
      invoice,
      raw_data: {
        items,
        calculations: totals
      },
      timestamp: invoiceDate,
      success: true
    };
    
  } catch (error) {
    console.error('Error generating invoice:', error);
    
    return {
      invoice: {} as Invoice,
      raw_data: {
        items: [],
        calculations: {} as InvoiceTotals
      },
      timestamp: new Date().toISOString(),
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Generate invoice summary for listing
 */
export function generateInvoiceSummary(invoice: Invoice): InvoiceSummary {
  return {
    invoice_number: invoice.invoice_number,
    invoice_date: invoice.invoice_date,
    buyer_name: invoice.buyer.name,
    total_amount: invoice.totals.total_amount,
    vat_amount: invoice.totals.vat_amount,
    status: invoice.payment.status === 'completed' ? 'paid' : 'issued',
    due_date: invoice.due_date,
    currency: invoice.currency
  };
}

/**
 * Generate multiple invoices in batch
 */
export function generateBatchInvoices(
  orders: Order[],
  seller: Seller,
  options: InvoiceOptions = {}
): InvoiceGenerationResult[] {
  return orders.map(order => generateInvoice(order, seller, options));
}

/**
 * Convert invoice to JSON string for storage/transmission
 */
export function serializeInvoice(invoice: Invoice): string {
  return JSON.stringify(invoice, null, 2);
}

/**
 * Parse invoice from JSON string
 */
export function deserializeInvoice(json: string): Invoice {
  return JSON.parse(json);
}

/**
 * Generate HTML template for PDF rendering
 */
export function generateInvoiceHTML(invoice: Invoice): string {
  const formattedDate = formatDate(invoice.invoice_date, 'long');
  const dueDate = formatDate(invoice.due_date, 'short');
  
  return `
<!DOCTYPE html>
<html lang="${invoice.language}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoice.invoice_number}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
        }
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 8px;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            border-bottom: 2px solid #4CAF50;
            padding-bottom: 20px;
        }
        .seller-info {
            flex: 1;
        }
        .invoice-meta {
            text-align: right;
        }
        .logo {
            max-width: 150px;
            margin-bottom: 10px;
        }
        .parties {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
        }
        .party {
            flex: 1;
            margin: 0 10px;
        }
        .party h3 {
            color: #4CAF50;
            border-bottom: 1px solid #eee;
            padding-bottom: 5px;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        .items-table th {
            background-color: #f5f5f5;
            text-align: left;
            padding: 12px;
            border-bottom: 2px solid #ddd;
        }
        .items-table td {
            padding: 12px;
            border-bottom: 1px solid #eee;
        }
        .totals {
            float: right;
            width: 300px;
            margin-top: 20px;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
        }
        .total-row.final {
            font-weight: bold;
            font-size: 1.2em;
            border-top: 2px solid #4CAF50;
            padding-top: 10px;
            margin-top: 10px;
        }
        .vat-breakdown {
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 5px;
            margin-top: 20px;
        }
        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 0.9em;
            color: #666;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: bold;
        }
        .status-paid { background-color: #4CAF50; color: white; }
        .status-pending { background-color: #ff9800; color: white; }
        .status-overdue { background-color: #f44336; color: white; }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="header">
            <div class="seller-info">
                ${invoice.seller.logo_url ? `<img src="${invoice.seller.logo_url}" alt="${invoice.seller.business_name}" class="logo">` : ''}
                <h1>${invoice.seller.business_name}</h1>
                <p>${invoice.seller.address.street}<br>
                ${invoice.seller.address.city}, ${invoice.seller.address.postal_code}<br>
                ${invoice.seller.address.country}</p>
                <p>VAT: ${invoice.seller.vat_number}</p>
                <p>Email: ${invoice.seller.email}<br>
                Phone: ${invoice.seller.phone}</p>
            </div>
            <div class="invoice-meta">
                <h2>INVOICE</h2>
                <p><strong>Invoice #:</strong> ${invoice.invoice_number}</p>
                <p><strong>Date:</strong> ${formattedDate}</p>
                <p><strong>Order #:</strong> ${invoice.order_number}</p>
                <p><strong>Due Date:</strong> ${dueDate}</p>
                <span class="status-badge status-${invoice.payment.status}">
                    ${invoice.payment.status.toUpperCase()}
                </span>
            </div>
        </div>
        
        <div class="parties">
            <div class="party">
                <h3>Bill From</h3>
                <p><strong>${invoice.seller.business_name}</strong><br>
                ${invoice.seller.address.street}<br>
                ${invoice.seller.address.city}, ${invoice.seller.address.postal_code}<br>
                ${invoice.seller.address.country}<br>
                VAT: ${invoice.seller.vat_number}</p>
            </div>
            <div class="party">
                <h3>Bill To</h3>
                <p><strong>${invoice.buyer.name}</strong><br>
                ${invoice.buyer.address.street}<br>
                ${invoice.buyer.address.city}, ${invoice.buyer.address.postal_code}<br>
                ${invoice.buyer.address.country}<br>
                ${invoice.buyer.vat_number ? `VAT: ${invoice.buyer.vat_number}<br>` : ''}
                ${invoice.buyer.email}<br>
                ${invoice.buyer.phone || ''}</p>
            </div>
        </div>
        
        <table class="items-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Description</th>
                    <th>Quantity</th>
                    <th>Unit Price (${invoice.currency})</th>
                    <th>VAT (${(invoice.totals.vat_rate * 100).toFixed(0)}%)</th>
                    <th>Total (${invoice.currency})</th>
                </tr>
            </thead>
            <tbody>
                ${invoice.items.map((item, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>
                        <strong>${item.name}</strong><br>
                        <small>SKU: ${item.sku || 'N/A'}</small>
                    </td>
                    <td>${item.quantity} ${item.unit_type || ''}</td>
                    <td>${formatCurrency(item.unit_price, invoice.currency)}</td>
                    <td>${formatCurrency(item.vat_amount, invoice.currency)}</td>
                    <td>${formatCurrency(item.total_with_vat, invoice.currency)}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
        
        <div class="totals">
            <div class="total-row">
                <span>Subtotal:</span>
                <span>${formatCurrency(invoice.totals.subtotal, invoice.currency)}</span>
            </div>
            ${invoice.totals.discount > 0 ? `
            <div class="total-row">
                <span>Discount:</span>
                <span>-${formatCurrency(invoice.totals.discount, invoice.currency)}</span>
            </div>
            ` : ''}
            ${invoice.totals.shipping_fee > 0 ? `
            <div class="total-row">
                <span>Shipping:</span>
                <span>${formatCurrency(invoice.totals.shipping_fee, invoice.currency)}</span>
            </div>
            ` : ''}
            <div class="total-row">
                <span>VAT (${(invoice.totals.vat_rate * 100).toFixed(0)}%):</span>
                <span>${formatCurrency(invoice.totals.vat_amount, invoice.currency)}</span>
            </div>
            <div class="total-row final">
                <span>Total:</span>
                <span>${formatCurrency(invoice.totals.total_amount, invoice.currency)}</span>
            </div>
        </div>
        
        <div class="vat-breakdown">
            <h4>VAT Summary</h4>
            <p>VAT Rate: ${(invoice.totals.vat_rate * 100).toFixed(2)}%</p>
            <p>Total VAT Amount: ${formatCurrency(invoice.totals.vat_amount, invoice.currency)}</p>
            ${invoice.buyer.is_business ? '<p><strong>This is a tax invoice</strong></p>' : ''}
        </div>
        
        ${invoice.notes ? `
        <div class="footer">
            <h4>Notes</h4>
            <p>${invoice.notes}</p>
        </div>
        ` : ''}
        
        ${invoice.terms_and_conditions ? `
        <div class="footer">
            <h4>Terms & Conditions</h4>
            <p>${invoice.terms_and_conditions}</p>
        </div>
        ` : ''}
        
        <div class="footer">
            <p>Invoice generated on ${formatDate(invoice.generated_at, 'long')}</p>
            <p>This is a computer-generated invoice. No signature required.</p>
            <p>Thank you for your business!</p>
        </div>
    </div>
</body>
</html>
  `;
}

/**
 * Generate simplified JSON for API responses
 */
export function generateInvoiceJSON(invoice: Invoice): Record<string, any> {
  const { seller, buyer, ...rest } = invoice;
  
  return {
    ...rest,
    seller: {
      business_name: seller.business_name,
      vat_number: seller.vat_number,
      email: seller.email
    },
    buyer: {
      name: buyer.name,
      vat_number: buyer.vat_number,
      email: buyer.email
    },
    formatted_totals: {
      subtotal: formatCurrency(invoice.totals.subtotal, invoice.currency),
      vat_amount: formatCurrency(invoice.totals.vat_amount, invoice.currency),
      total_amount: formatCurrency(invoice.totals.total_amount, invoice.currency)
    }
  };
}

// ============================================
// VALIDATION & UTILITIES
// ============================================

/**
 * Validate invoice data for compliance
 */
export function validateInvoiceCompliance(invoice: Invoice): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Required fields check
  if (!invoice.invoice_number) {
    errors.push('Invoice number is required');
  }
  
  if (!invoice.seller.vat_number) {
    errors.push('Seller VAT number is required');
  }
  
  if (!validateVATNumber(invoice.seller.vat_number)) {
    warnings.push('Seller VAT number format may be invalid');
  }
  
  if (invoice.items.length === 0) {
    errors.push('Invoice must have at least one item');
  }
  
  // VAT calculation validation
  const calculatedTotals = calculateInvoiceTotals(
    invoice.items,
    invoice.totals.shipping_fee,
    invoice.totals.discount,
    invoice.totals.vat_rate
  );
  
  const tolerance = 0.01; // 1 halala tolerance
  if (Math.abs(calculatedTotals.total_amount - invoice.totals.total_amount) > tolerance) {
    errors.push('Invoice totals calculation mismatch');
  }
  
  // Due date validation
  const invoiceDate = new Date(invoice.invoice_date);
  const dueDate = new Date(invoice.due_date);
  
  if (dueDate < invoiceDate) {
    errors.push('Due date cannot be before invoice date');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================
// SAMPLE DATA & USAGE
// ============================================

/**
 * Example usage of invoice generator
 */
export function exampleInvoiceGeneration(): InvoiceGenerationResult {
  // Sample order data
  const sampleOrder: Order = {
    id: 'order_001',
    order_id: 'ORD-7894',
    order_number: 'ORD-7894',
    seller_id: 'seller_123',
    customer_id: 'cust_001',
    status: 'completed',
    created_at: '2024-12-20T10:30:00Z',
    updated_at: '2024-12-20T10:30:00Z',
    items: [
      {
        product_id: 'prod_001',
        name: 'Premium Leather Sofa',
        quantity: 1,
        unit_price: 2450.00,
        sku: 'SOFA-001',
        category: 'Furniture'
      },
      {
        product_id: 'prod_002',
        name: 'Coffee Table',
        quantity: 2,
        unit_price: 450.00,
        sku: 'TABLE-002',
        category: 'Furniture'
      }
    ],
    shipping_fee: 150.00,
    discount: 100.00,
    discount_code: 'WELCOME10',
    notes: 'Deliver to reception',
    customer: {
      id: 'cust_001',
      name: 'Ahmed Al-Mansoor',
      email: 'ahmed@example.com',
      phone: '+966 55 123 4567',
      address: {
        street: 'King Fahd Road',
        city: 'Riyadh',
        postal_code: '12345',
        country: 'Saudi Arabia',
        building: 'Tower A'
      },
      vat_number: '312345678901234',
      is_business: true
    },
    payment: {
      method: 'credit_card',
      transaction_id: 'TXN-789456',
      payment_date: '2024-12-20T10:31:00Z',
      status: 'completed',
      card_last_four: '1234'
    },
    shipping: {
      method: 'Express',
      cost: 150.00,
      tracking_number: 'TRK123456789',
      carrier: 'Aramex',
      estimated_delivery: '2024-12-22',
      address: {
        street: 'King Fahd Road',
        city: 'Riyadh',
        postal_code: '12345',
        country: 'Saudi Arabia',
        building: 'Tower A'
      }
    }
  };
  
  // Sample seller data
  const sampleSeller: Seller = {
    id: 'seller_123',
    business_name: 'Premium Furniture Store',
    legal_name: 'Premium Furniture Trading Co.',
    vat_number: '312345678901235',
    email: 'sales@premiumfurniture.com',
    phone: '+966 11 123 4567',
    address: {
      street: 'Industrial Area, Street 45',
      city: 'Riyadh',
      postal_code: '13579',
      country: 'Saudi Arabia'
    },
    logo_url: 'https://example.com/logo.png',
    website: 'https://premiumfurniture.com',
    commercial_registration: 'CR-123456789',
    tax_id: '7001234567',
    bank_details: {
      bank_name: 'Saudi National Bank',
      account_name: 'Premium Furniture Trading Co.',
      account_number: 'SA1234567890123456789',
      iban: 'SA03 8000 0000 6080 1016 7519'
    }
  };
  
  // Generate invoice
  return generateInvoice(sampleOrder, sampleSeller, {
    vat_rate: 0.15,
    currency: 'SAR',
    language: 'en',
    notes: 'Thank you for your purchase!',
    terms_and_conditions: 'All sales are final. Warranty provided as per manufacturer terms.',
    due_date_days: 30
  });
}

// ============================================
// EXPORT ALL FUNCTIONS
// ============================================

export {
  roundCurrency,
  formatCurrency,
  formatDate,
  validateVATNumber,
  prepareBuyerInfo,
  prepareInvoiceItems,
  preparePaymentInfo,
  generateInvoiceSummary,
  generateBatchInvoices,
  serializeInvoice,
  deserializeInvoice,
  generateInvoiceHTML,
  generateInvoiceJSON,
  validateInvoiceCompliance,
  exampleInvoiceGeneration
};

// Default export for main function
export default generateInvoice;