export interface RazorpayOptions {
  key_id: string;
  key_secret: string;
}

export interface RazorpayOrderOptions {
  amount: number; // Amount in smallest currency unit (paise for INR)
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number | string;
  amount_paid: number | string;
  amount_due: number | string;
  currency: string;
  receipt?: string;
  status: string;
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
}

export interface RazorpayPayment {
  id: string;
  entity: string;
  amount: number | string;
  currency: string;
  status: string;
  order_id: string;
  invoice_id: string | null;
  international: boolean;
  method: string;
  amount_refunded: number;
  refund_status: string;
  captured: boolean;
  description: string;
  card_id: string;
  bank: string;
  wallet: string;
  vpa: string;
  email: string;
  contact: string;
  notes: Record<string, string>;
  fee: number;
  tax: number;
  error_code: string;
  error_description: string;
  created_at: number;
}

export interface RazorpayWebhookEvent {
  entity: string;
  account_id: string;
  event: string;
  contains: string[];
  payload: {
    payment: RazorpayPayment;
    order?: RazorpayOrder;
  };
  created_at: number;
}
