// src/utils/date.ts

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type DateFormat = 
  | 'iso'          // 2025-12-23T14:30:00Z
  | 'iso-date'     // 2025-12-23
  | 'iso-time'     // 14:30:00
  | 'full'         // Monday, December 23, 2025 at 2:30 PM
  | 'long'         // December 23, 2025, 2:30 PM
  | 'medium'       // Dec 23, 2025, 2:30 PM
  | 'short'        // 12/23/2025, 2:30 PM
  | 'date-only'    // December 23, 2025
  | 'time-only'    // 2:30 PM
  | 'month-year'   // December 2025
  | 'year-month'   // 2025-12
  | 'day-month'    // 23 Dec
  | 'db'           // 20251223_143000 (for file naming)
  | 'human'        // Today at 2:30 PM
  | 'dashboard'    // 23 Dec • 14:30
  | 'ar-SA'        // Arabic Saudi Arabia format
  | 'custom';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface RelativeTimeOptions {
  future?: boolean;
  includeSuffix?: boolean;
  precision?: 'second' | 'minute' | 'hour' | 'day' | 'month' | 'year';
}

export interface DateFilterOptions<T> {
  dateField: keyof T;
  startDate?: Date | null;
  endDate?: Date | null;
  includeTime?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_LOCALE = 'en-US';
const DEFAULT_TIMEZONE = 'Asia/Riyadh'; // Saudi Arabia timezone

const FORMAT_PATTERNS: Record<DateFormat, Intl.DateTimeFormatOptions> = {
  'iso': { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit', 
    timeZoneName: 'short' 
  },
  'iso-date': { year: 'numeric', month: '2-digit', day: '2-digit' },
  'iso-time': { hour: '2-digit', minute: '2-digit', second: '2-digit' },
  'full': { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit', 
    timeZoneName: 'short' 
  },
  'long': { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  },
  'medium': { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  },
  'short': { 
    year: '2-digit', 
    month: 'numeric', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  },
  'date-only': { year: 'numeric', month: 'long', day: 'numeric' },
  'time-only': { hour: '2-digit', minute: '2-digit', hour12: true },
  'month-year': { year: 'numeric', month: 'long' },
  'year-month': { year: 'numeric', month: '2-digit' },
  'day-month': { month: 'short', day: 'numeric' },
  'db': { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  },
  'human': { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  },
  'dashboard': { 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false 
  },
  'ar-SA': { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric', 
    hour: 'numeric', 
    minute: '2-digit', 
    calendar: 'islamic-umalqura' 
  },
  'custom': {}
};

// Common date input patterns
const DATE_PATTERNS = {
  ISO: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$/,
  ISO_DATE: /^\d{4}-\d{2}-\d{2}$/,
  SLASH_DATE: /^\d{1,2}\/\d{1,2}\/\d{4}$/,
  DASH_DATE: /^\d{1,2}-\d{1,2}-\d{4}$/,
} as const;

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Formats a date to human-readable string with various format options
 * @param date - Date string, timestamp, or Date object
 * @param format - Predefined format or custom format string
 * @param locale - Locale for formatting
 * @returns Formatted date string
 */
export function formatDate(
  date: string | number | Date,
  format: DateFormat | string = 'medium',
  locale: string = DEFAULT_LOCALE
): string {
  try {
    const dateObj = normalizeDate(date);
    
    if (!dateObj) {
      return 'Invalid date';
    }

    // Handle custom format string
    if (format === 'custom' || format.includes('{')) {
      return formatCustomDate(dateObj, format, locale);
    }

    // Handle predefined formats
    const formatOptions = FORMAT_PATTERNS[format as DateFormat] || FORMAT_PATTERNS.medium;
    
    if (format === 'db') {
      // Special handling for database-style format
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const hour = String(dateObj.getHours()).padStart(2, '0');
      const minute = String(dateObj.getMinutes()).padStart(2, '0');
      const second = String(dateObj.getSeconds()).padStart(2, '0');
      return `${year}${month}${day}_${hour}${minute}${second}`;
    }

    if (format === 'dashboard') {
      // Special dashboard format: "23 Dec • 14:30"
      const formatter = new Intl.DateTimeFormat(locale, {
        month: 'short',
        day: 'numeric'
      });
      const timeFormatter = new Intl.DateTimeFormat(locale, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      return `${formatter.format(dateObj)} • ${timeFormatter.format(dateObj)}`;
    }

    if (format === 'human') {
      // Human-readable format with relative time for recent dates
      const now = new Date();
      const diffMs = now.getTime() - dateObj.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return `Today at ${formatDate(dateObj, 'time-only', locale)}`;
      } else if (diffDays === 1) {
        return `Yesterday at ${formatDate(dateObj, 'time-only', locale)}`;
      } else if (diffDays < 7) {
        const dayFormatter = new Intl.DateTimeFormat(locale, { weekday: 'long' });
        return `${dayFormatter.format(dateObj)} at ${formatDate(dateObj, 'time-only', locale)}`;
      }
    }

    // Use Intl.DateTimeFormat for most cases
    const formatter = new Intl.DateTimeFormat(locale, {
      timeZone: DEFAULT_TIMEZONE,
      ...formatOptions
    });

    return formatter.format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

/**
 * Parses a date string into a Date object
 * @param dateStr - Date string to parse
 * @param format - Optional format hint
 * @returns Date object
 */
export function parseDate(dateStr: string, format?: string): Date {
  try {
    // If it's already a Date object
    if (dateStr instanceof Date) {
      return dateStr;
    }

    // If it's a timestamp
    if (!isNaN(Number(dateStr))) {
      return new Date(Number(dateStr));
    }

    // Try parsing ISO string
    if (DATE_PATTERNS.ISO.test(dateStr)) {
      return new Date(dateStr);
    }

    // Try parsing ISO date (without time)
    if (DATE_PATTERNS.ISO_DATE.test(dateStr)) {
      return new Date(dateStr + 'T00:00:00Z');
    }

    // Try parsing with format hint
    if (format) {
      const parsed = parseWithFormat(dateStr, format);
      if (parsed) {
        return parsed;
      }
    }

    // Try Date constructor as fallback
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date;
    }

    throw new Error(`Unable to parse date: ${dateStr}`);
  } catch (error) {
    console.error('Error parsing date:', error);
    return new Date(NaN); // Return invalid date
  }
}

/**
 * Filters an array of objects by date range
 * @param items - Array of objects to filter
 * @param options - Filter options including date field and range
 * @returns Filtered array
 */
export function dateRangeFilter<T extends Record<string, any>>(
  items: T[],
  options: DateFilterOptions<T>
): T[] {
  try {
    const { dateField, startDate, endDate, includeTime = true } = options;

    // If no dates provided, return all items
    if (!startDate && !endDate) {
      return items;
    }

    return items.filter(item => {
      const itemDate = item[dateField];
      if (!itemDate) return false;

      const date = normalizeDate(itemDate);
      if (!date || isNaN(date.getTime())) {
        return false;
      }

      let isValid = true;

      // Check start date
      if (startDate) {
        if (includeTime) {
          isValid = isValid && date >= startDate;
        } else {
          const itemDateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
          const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
          isValid = isValid && itemDateOnly >= startDateOnly;
        }
      }

      // Check end date
      if (endDate) {
        if (includeTime) {
          isValid = isValid && date <= endDate;
        } else {
          const itemDateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
          const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
          isValid = isValid && itemDateOnly <= endDateOnly;
        }
      }

      return isValid;
    });
  } catch (error) {
    console.error('Error filtering by date range:', error);
    return [];
  }
}

/**
 * Returns relative time string (e.g., "3 hours ago", "2 days ago")
 * @param date - Date to compare
 * @param options - Formatting options
 * @returns Relative time string
 */
export function getRelativeTime(
  date: string | number | Date,
  options: RelativeTimeOptions = {}
): string {
  try {
    const {
      future = false,
      includeSuffix = true,
      precision = 'minute'
    } = options;

    const dateObj = normalizeDate(date);
    if (!dateObj) {
      return 'Invalid date';
    }

    const now = new Date();
    const diffMs = future ? dateObj.getTime() - now.getTime() : now.getTime() - dateObj.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffMonths / 12);

    // Determine the appropriate unit
    let value: number;
    let unit: string;

    if (precision === 'second' || Math.abs(diffSeconds) < 60) {
      value = diffSeconds;
      unit = 'second';
    } else if (precision === 'minute' || Math.abs(diffMinutes) < 60) {
      value = diffMinutes;
      unit = 'minute';
    } else if (precision === 'hour' || Math.abs(diffHours) < 24) {
      value = diffHours;
      unit = 'hour';
    } else if (precision === 'day' || Math.abs(diffDays) < 30) {
      value = diffDays;
      unit = 'day';
    } else if (precision === 'month' || Math.abs(diffMonths) < 12) {
      value = diffMonths;
      unit = 'month';
    } else {
      value = diffYears;
      unit = 'year';
    }

    // Handle just now/right now cases
    if (Math.abs(value) < 1) {
      return future ? 'Right now' : 'Just now';
    }

    // Make value positive for display
    value = Math.abs(value);

    // Pluralize unit
    const pluralizedUnit = value === 1 ? unit : `${unit}s`;

    // Build the string
    let result = `${value} ${pluralizedUnit}`;
    
    if (includeSuffix) {
      if (future) {
        result += ' from now';
      } else {
        result += ' ago';
      }
    }

    return result;
  } catch (error) {
    console.error('Error getting relative time:', error);
    return 'Invalid date';
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Normalizes various date inputs to Date object
 */
function normalizeDate(date: string | number | Date): Date | null {
  if (!date) return null;

  try {
    if (date instanceof Date) {
      return isNaN(date.getTime()) ? null : date;
    }

    if (typeof date === 'number') {
      const d = new Date(date);
      return isNaN(d.getTime()) ? null : d;
    }

    if (typeof date === 'string') {
      const d = parseDate(date);
      return isNaN(d.getTime()) ? null : d;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Formats date with custom pattern
 */
function formatCustomDate(date: Date, pattern: string, locale: string): string {
  const tokens: Record<string, () => string> = {
    '{yyyy}': () => date.getFullYear().toString(),
    '{yy}': () => date.getFullYear().toString().slice(-2),
    '{MM}': () => String(date.getMonth() + 1).padStart(2, '0'),
    '{M}': () => String(date.getMonth() + 1),
    '{MMM}': () => new Intl.DateTimeFormat(locale, { month: 'short' }).format(date),
    '{MMMM}': () => new Intl.DateTimeFormat(locale, { month: 'long' }).format(date),
    '{dd}': () => String(date.getDate()).padStart(2, '0'),
    '{d}': () => String(date.getDate()),
    '{HH}': () => String(date.getHours()).padStart(2, '0'),
    '{H}': () => String(date.getHours()),
    '{hh}': () => String(date.getHours() % 12 || 12).padStart(2, '0'),
    '{h}': () => String(date.getHours() % 12 || 12),
    '{mm}': () => String(date.getMinutes()).padStart(2, '0'),
    '{m}': () => String(date.getMinutes()),
    '{ss}': () => String(date.getSeconds()).padStart(2, '0'),
    '{s}': () => String(date.getSeconds()),
    '{a}': () => date.getHours() < 12 ? 'AM' : 'PM',
    '{A}': () => date.getHours() < 12 ? 'am' : 'pm',
  };

  let result = pattern;
  for (const [token, getValue] of Object.entries(tokens)) {
    result = result.replace(new RegExp(token, 'g'), getValue());
  }

  return result;
}

/**
 * Parses date string with specific format
 */
function parseWithFormat(dateStr: string, format: string): Date | null {
  try {
    // Simple format parser for common patterns
    const formatLower = format.toLowerCase();
    
    if (formatLower.includes('dd/mm/yyyy') || formatLower.includes('d/m/y')) {
      const parts = dateStr.split(/[/-]/);
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        return new Date(year, month, day);
      }
    }
    
    if (formatLower.includes('mm/dd/yyyy') || formatLower.includes('m/d/y')) {
      const parts = dateStr.split(/[/-]/);
      if (parts.length === 3) {
        const month = parseInt(parts[0], 10) - 1;
        const day = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        return new Date(year, month, day);
      }
    }
    
    if (formatLower.includes('yyyy-mm-dd')) {
      return new Date(dateStr + 'T00:00:00Z');
    }
    
    return null;
  } catch {
    return null;
  }
}

// ============================================================================
// DATE UTILITY FUNCTIONS
// ============================================================================

/**
 * Checks if a date is today
 */
export function isToday(date: string | number | Date): boolean {
  const dateObj = normalizeDate(date);
  if (!dateObj) return false;

  const today = new Date();
  return dateObj.getDate() === today.getDate() &&
         dateObj.getMonth() === today.getMonth() &&
         dateObj.getFullYear() === today.getFullYear();
}

/**
 * Checks if a date is yesterday
 */
export function isYesterday(date: string | number | Date): boolean {
  const dateObj = normalizeDate(date);
  if (!dateObj) return false;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  return dateObj.getDate() === yesterday.getDate() &&
         dateObj.getMonth() === yesterday.getMonth() &&
         dateObj.getFullYear() === yesterday.getFullYear();
}

/**
 * Checks if a date is within last N days
 */
export function isWithinLastDays(date: string | number | Date, days: number): boolean {
  const dateObj = normalizeDate(date);
  if (!dateObj) return false;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  return dateObj >= cutoff;
}

/**
 * Gets start of day for a date
 */
export function startOfDay(date: string | number | Date): Date {
  const dateObj = normalizeDate(date) || new Date();
  return new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
}

/**
 * Gets end of day for a date
 */
export function endOfDay(date: string | number | Date): Date {
  const dateObj = normalizeDate(date) || new Date();
  return new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 23, 59, 59, 999);
}

/**
 * Gets start of month for a date
 */
export function startOfMonth(date: string | number | Date): Date {
  const dateObj = normalizeDate(date) || new Date();
  return new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
}

/**
 * Gets end of month for a date
 */
export function endOfMonth(date: string | number | Date): Date {
  const dateObj = normalizeDate(date) || new Date();
  return new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0, 23, 59, 59, 999);
}

/**
 * Gets date range for a specific period
 */
export function getDateRange(period: 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear'): DateRange {
  const now = new Date();
  
  switch (period) {
    case 'today':
      return {
        start: startOfDay(now),
        end: endOfDay(now)
      };
      
    case 'yesterday':
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        start: startOfDay(yesterday),
        end: endOfDay(yesterday)
      };
      
    case 'thisWeek':
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
      return {
        start: startOfDay(startOfWeek),
        end: endOfDay(now)
      };
      
    case 'lastWeek':
      const lastWeekStart = new Date(now);
      lastWeekStart.setDate(now.getDate() - now.getDay() - 7);
      const lastWeekEnd = new Date(lastWeekStart);
      lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
      return {
        start: startOfDay(lastWeekStart),
        end: endOfDay(lastWeekEnd)
      };
      
    case 'thisMonth':
      return {
        start: startOfMonth(now),
        end: endOfDay(now)
      };
      
    case 'lastMonth':
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return {
        start: startOfMonth(lastMonth),
        end: endOfMonth(lastMonth)
      };
      
    case 'thisYear':
      return {
        start: new Date(now.getFullYear(), 0, 1),
        end: endOfDay(now)
      };
      
    case 'lastYear':
      return {
        start: new Date(now.getFullYear() - 1, 0, 1),
        end: new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999)
      };
      
    default:
      return {
        start: startOfMonth(now),
        end: endOfDay(now)
      };
  }
}

/**
 * Adds days to a date
 */
export function addDays(date: string | number | Date, days: number): Date {
  const dateObj = normalizeDate(date) || new Date();
  const result = new Date(dateObj);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Calculates difference in days between two dates
 */
export function diffInDays(date1: string | number | Date, date2: string | number | Date): number {
  const d1 = normalizeDate(date1);
  const d2 = normalizeDate(date2);
  
  if (!d1 || !d2) return 0;
  
  const diffMs = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

// ============================================================================
// EXAMPLES OF USAGE
// ============================================================================

/*
// Example 1: Formatting dates
const isoDate = '2025-12-23T14:30:00Z';
console.log(formatDate(isoDate, 'medium')); // "Dec 23, 2025, 2:30 PM"
console.log(formatDate(isoDate, 'dashboard')); // "23 Dec • 14:30"
console.log(formatDate(isoDate, 'ar-SA')); // Arabic format

// Example 2: Parsing dates
const parsed = parseDate('23/12/2025', 'dd/mm/yyyy');
console.log(parsed); // Date object

// Example 3: Filtering by date range
const orders = [
  { id: 1, created_at: '2025-12-20T10:00:00Z', total: 100 },
  { id: 2, created_at: '2025-12-23T14:30:00Z', total: 200 },
  { id: 3, created_at: '2025-12-25T09:15:00Z', total: 150 }
];

const filtered = dateRangeFilter(orders, {
  dateField: 'created_at',
  startDate: new Date('2025-12-22'),
  endDate: new Date('2025-12-24')
});
// Returns orders with id 2 only

// Example 4: Relative time
console.log(getRelativeTime('2025-12-23T14:30:00Z')); // "3 hours ago"
console.log(getRelativeTime(addDays(new Date(), 2), { future: true })); // "2 days from now"

// Example 5: Date ranges for dashboard
const thisMonthRange = getDateRange('thisMonth');
const filteredOrders = dateRangeFilter(orders, {
  dateField: 'created_at',
  startDate: thisMonthRange.start,
  endDate: thisMonthRange.end
});

// Example 6: Date utilities
console.log(isToday('2025-12-23T14:30:00Z')); // true if today
console.log(isWithinLastDays('2025-12-20T10:00:00Z', 7)); // true
console.log(startOfMonth(new Date())); // First day of current month
console.log(diffInDays('2025-12-20', '2025-12-23')); // 3
*/