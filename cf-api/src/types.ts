/* eslint-disable @typescript-eslint/no-explicit-any */
export interface CloudflareBindings {
  // Environment config
  ENVIRONMENT?: string;
  API_VERSION?: string;
  API_BASE_URL?: string;
  LOG_LEVEL?: string;
  ENABLE_DETAILED_LOGGING?: string;
  ENABLE_PERFORMANCE_MONITORING?: string;

  // Supabase
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  SUPABASE_ANON_KEY?: string;
  IP_INFO_TOKEN?: string;

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
  HEALTHIANS_WEBHOOK_SECRET?: string;

  // Database binding
  DB?: any;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  address?: string;
  postal?: string | null;
  city?: string | null;
  region?: string | null;
  country_name?: string | null;
}


// Types
export interface UserLoginInfo {
  last_sign_in: string;
  sign_in_method: string;
  provider: string;
  sign_in_count: number;
  ip_address: string;
}

export interface UpsertProfileData {
  uuid: string;
  full_name?: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  email_notifications?: boolean;
  user_login_info?: Partial<UserLoginInfo>;
}


export interface CustomStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

export interface UserData {
  full_name?: string;
  name?: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  picture?: string;
  sign_in_method?: string;
  provider?: string;
}

export interface LocationInfo {
  ip?: string;
  loc?: string;
  city?: string;
  region?: string;
  country?: string;
  postal?: string;
  timezone?: string;
}

export interface FormattedLocation {
  coordinates: string | undefined;
  city: string | undefined;
  region: string | undefined;
  country: string | undefined;
  postal: string | undefined;
  timezone: string | undefined;
  address: string;
  lastUpdated: string;
}