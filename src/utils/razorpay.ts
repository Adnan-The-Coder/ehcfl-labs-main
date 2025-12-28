import { API_ENDPOINTS } from '@/config/api';

export interface RazorpayOptions {
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

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface CreateOrderPayload {
  amount: number;
}

export interface VerifyOrderPayload {
  orderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

/**
 * Creates a Razorpay order via backend API
 */
export const createRazorpayOrder = async (
  amount: number,
  userUuid: string
): Promise<any> => {
  const response = await fetch(API_ENDPOINTS.createOrder, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userUuid}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount }),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Failed to create Razorpay order');
  }

  return result.data;
};

/**
 * Verifies Razorpay payment signature via backend API
 */
export const verifyRazorpayPayment = async (
  orderId: string,
  paymentId: string,
  signature: string,
  userUuid: string
): Promise<boolean> => {
  const response = await fetch(API_ENDPOINTS.verifyOrder, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userUuid}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: signature,
    }),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Payment verification failed');
  }

  return result.isOk;
};

/**
 * Opens Razorpay checkout modal
 */
export const openRazorpayCheckout = (options: RazorpayOptions): void => {
  if (!window.Razorpay) {
    throw new Error('Razorpay SDK not loaded. Please refresh the page.');
  }

  const razorpay = new window.Razorpay(options);
  razorpay.open();
};

/**
 * Complete payment flow: create order, open checkout, verify payment
 */
export const processRazorpayPayment = async (
  amount: number,
  userUuid: string,
  customerDetails: {
    name: string;
    email: string;
    phone: string;
  },
  onSuccess: (paymentDetails: {
    orderId: string;
    paymentId: string;
    signature: string;
  }) => void,
  onFailure: (error: Error) => void
): Promise<void> => {
  try {
    // Step 1: Create order
    const order = await createRazorpayOrder(amount, userUuid);

    // Step 2: Open Razorpay checkout
    openRazorpayCheckout({
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
      amount: order.amount,
      currency: order.currency,
      name: 'EHCF Labs',
      description: 'Lab Test Booking Payment',
      order_id: order.id,
      prefill: {
        name: customerDetails.name,
        email: customerDetails.email,
        contact: customerDetails.phone,
      },
      theme: {
        color: '#0EA5E9', // Primary color
      },
      handler: async (response: RazorpayResponse) => {
        try {
          // Step 3: Verify payment
          const isVerified = await verifyRazorpayPayment(
            response.razorpay_order_id,
            response.razorpay_payment_id,
            response.razorpay_signature,
            userUuid
          );

          if (isVerified) {
            onSuccess({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });
          } else {
            throw new Error('Payment verification failed');
          }
        } catch (error) {
          onFailure(error instanceof Error ? error : new Error('Payment verification failed'));
        }
      },
      modal: {
        ondismiss: () => {
          onFailure(new Error('Payment cancelled by user'));
        },
      },
    });
  } catch (error) {
    onFailure(error instanceof Error ? error : new Error('Failed to initiate payment'));
  }
};
