export interface CloudflareBindings {
  // Environment config
  ENVIRONMENT?: string;
  API_VERSION?: string;
  API_BASE_URL?: string;
  LOG_LEVEL?: string;
  ENABLE_DETAILED_LOGGING?: string;
  ENABLE_PERFORMANCE_MONITORING?: string;

  // Database
  JWT_SECRET?: string;
  DATABASE_URL?: string;

  // Payment (Razorpay)
  RAZORPAY_LIVE_KEY_ID?: string;
  RAZORPAY_LIVE_KEY_SECRET?: string;

  // Healthians API
  HEALTHIANS_BASE_URL?: string;
  HEALTHIANS_PARTNER_NAME?: string;
  HEALTHIANS_USERNAME?: string;
  HEALTHIANS_PASSWORD?: string;
  HEALTHIANS_CHECKSUM_SECRET?: string;

  // Database binding
  DB?: any;
}
