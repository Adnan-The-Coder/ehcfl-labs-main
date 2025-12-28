/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PUBLIC_SUPABASE_URL: string
  readonly VITE_PUBLIC_SUPABASE_ANON_KEY: string
  readonly VITE_BACKEND_API_BASE_URL: string
  readonly VITE_PUBLIC_IP_INFO_TOKEN: string
  readonly VITE_RAZORPAY_KEY_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Razorpay types
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open(): void;
  on(event: string, callback: () => void): void;
}

interface Window {
  Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
}

