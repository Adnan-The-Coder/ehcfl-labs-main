/**
 * Booking Parameter Validation Utilities
 * Based on Healthians createBooking_v3 API specifications
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate customer data according to Healthians spec
 */
export function validateCustomer(customer: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!customer) {
    errors.push('Customer data is required');
    return { valid: false, errors, warnings };
  }

  // Mandatory fields
  if (!customer.customer_id) errors.push('customer_id is required');
  if (!customer.customer_name) {
    errors.push('customer_name is required');
  } else if (!/^[a-zA-Z0-9\s\-.,&()]+$/.test(String(customer.customer_name))) {
    warnings.push('customer_name should contain only alphanumeric and special characters');
  }

  if (!customer.relation) {
    errors.push('relation is required');
  } else {
    const validRelations = ['self', 'spouse', 'child', 'parent', 'grand parent', 'sibling', 'friend', 'native', 'neighbour', 'colleague', 'others'];
    if (!validRelations.includes(String(customer.relation).toLowerCase())) {
      errors.push(`relation must be one of: ${validRelations.join(', ')}`);
    }
  }

  if (!customer.age) {
    errors.push('age is required');
  } else if (typeof customer.age === 'string') {
    const ageNum = parseInt(String(customer.age));
    if (isNaN(ageNum) || ageNum < 5 || ageNum > 120) {
      errors.push('age must be between 5-120');
    }
  } else if (typeof customer.age === 'number' && (customer.age < 5 || customer.age > 120)) {
    errors.push('age must be between 5-120');
  }

  if (!customer.gender) {
    errors.push('gender is required');
  } else if (!['M', 'F', 'O'].includes(String(customer.gender).toUpperCase())) {
    errors.push('gender must be M, F, or O');
  }

  // Optional fields with validation
  if (customer.dob && !isValidDateFormat(String(customer.dob))) {
    errors.push('dob must be in DD/MM/YYYY format');
  }

  if (customer.contact_number && !isValidPhoneNumber(String(customer.contact_number))) {
    warnings.push('contact_number should contain only digits');
  }

  if (customer.email && !isValidEmail(String(customer.email))) {
    warnings.push('email format is invalid');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate address data
 */
export function validateAddress(address: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!address) {
    errors.push('Address is required');
    return { valid: false, errors, warnings };
  }

  if (!address.sub_locality) errors.push('sub_locality is required');
  if (!address.address) errors.push('address is required');
  if (!address.zipcode) {
    errors.push('zipcode is required');
  } else if (!/^\d{6}$/.test(String(address.zipcode))) {
    errors.push('zipcode must be 6 digits');
  }

  if (!address.latitude) errors.push('latitude is required');
  else if (!isValidLatitude(address.latitude)) errors.push('latitude is invalid');

  if (!address.longitude) errors.push('longitude is required');
  else if (!isValidLongitude(address.longitude)) errors.push('longitude is invalid');

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate slot data
 */
export function validateSlot(slot: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!slot) {
    errors.push('Slot is required');
    return { valid: false, errors, warnings };
  }

  if (!slot.slot_id && slot.slot_id !== 0) {
    errors.push('slot_id is required');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate package data
 */
export function validatePackage(pkg: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!pkg) {
    errors.push('Package is required');
    return { valid: false, errors, warnings };
  }

  if (!pkg.deal_id || (Array.isArray(pkg.deal_id) && pkg.deal_id.length === 0)) {
    errors.push('deal_id is required');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate billing details
 */
export function validateBillingDetails(billing: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!billing.customer_calling_number) {
    errors.push('customer_calling_number is required');
  } else if (!isValidPhoneNumber(String(billing.customer_calling_number))) {
    warnings.push('customer_calling_number should contain only digits');
  }

  if (!billing.billing_cust_name) {
    errors.push('billing_cust_name is required');
  }

  if (!billing.gender) {
    errors.push('gender is required');
  } else if (!['M', 'F', 'O'].includes(String(billing.gender).toUpperCase())) {
    errors.push('gender must be M, F, or O');
  }

  if (!billing.mobile) {
    errors.push('mobile is required');
  } else if (!isValidPhoneNumber(String(billing.mobile))) {
    warnings.push('mobile should contain only digits');
  }

  if (!billing.email) {
    errors.push('email is required');
  } else if (!isValidEmail(String(billing.email))) {
    errors.push('email format is invalid');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate complete booking payload
 */
export function validateBookingPayload(payload: Record<string, unknown>): ValidationResult {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  // Validate customers
  if (!payload.customer || (Array.isArray(payload.customer) && payload.customer.length === 0)) {
    allErrors.push('At least one customer is required');
  } else if (Array.isArray(payload.customer)) {
    payload.customer.forEach((cust: unknown, index: number) => {
      const custData = cust as Record<string, unknown>;
      const result = validateCustomer(custData);
      allErrors.push(...result.errors.map((e) => `Customer ${index + 1}: ${e}`));
      allWarnings.push(...result.warnings.map((w) => `Customer ${index + 1}: ${w}`));
    });
  }

  // Validate slot
  if (!payload.slot) {
    allErrors.push('Slot is required');
  } else {
    const slotResult = validateSlot(payload.slot as Record<string, unknown>);
    allErrors.push(...slotResult.errors);
    allWarnings.push(...slotResult.warnings);
  }

  // Validate package
  if (!payload.package || (Array.isArray(payload.package) && payload.package.length === 0)) {
    allErrors.push('At least one package is required');
  } else if (Array.isArray(payload.package)) {
    payload.package.forEach((pkg: unknown, index: number) => {
      const pkgData = pkg as Record<string, unknown>;
      const result = validatePackage(pkgData);
      allErrors.push(...result.errors.map((e) => `Package ${index + 1}: ${e}`));
      allWarnings.push(...result.warnings.map((w) => `Package ${index + 1}: ${w}`));
    });
  }

  // Validate billing details
  const billingResult = validateBillingDetails(payload);
  allErrors.push(...billingResult.errors);
  allWarnings.push(...billingResult.warnings);

  // Validate address
  if (payload.address) {
    const addressResult = validateAddress(payload.address as Record<string, unknown>);
    allErrors.push(...addressResult.errors);
    allWarnings.push(...addressResult.warnings);
  } else {
    allErrors.push('Address information is required');
  }

  // Validate payment option
  if (!payload.payment_option) {
    allErrors.push('payment_option is required');
  } else if (!['cod', 'prepaid'].includes(String(payload.payment_option).toLowerCase())) {
    allErrors.push('payment_option must be cod or prepaid');
  }

  // Validate discounted price
  if (payload.discounted_price === undefined || payload.discounted_price === null) {
    allErrors.push('discounted_price is required');
  } else if (typeof payload.discounted_price === 'number' && payload.discounted_price % 1 !== 0) {
    allErrors.push('discounted_price must be an integer');
  }

  // Validate zone_id
  if (!payload.zone_id) {
    allErrors.push('zone_id is required');
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
}

// Helper validation functions
function isValidDateFormat(dateString: string): boolean {
  // DD/MM/YYYY format
  return /^\d{2}\/\d{2}\/\d{4}$/.test(dateString);
}

function isValidPhoneNumber(phone: string): boolean {
  // Should contain only digits, at least 10 digits
  return /^\d{10,}$/.test(phone.replace(/\D/g, ''));
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidLatitude(lat: unknown): boolean {
  const num = typeof lat === 'string' ? parseFloat(lat as string) : typeof lat === 'number' ? lat : NaN;
  return !isNaN(num) && num >= -90 && num <= 90;
}

function isValidLongitude(long: unknown): boolean {
  const num = typeof long === 'string' ? parseFloat(long as string) : typeof long === 'number' ? long : NaN;
  return !isNaN(num) && num >= -180 && num <= 180;
}
