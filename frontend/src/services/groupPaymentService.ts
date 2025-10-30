import api from '../lib/api';

export interface PaymentSummary {
  total_count: number;
  paid_count: number;
  pending_count: number;
  late_count: number;
  total_paid: string;
  total_pending: string;
}

export interface GroupPayment {
  id: number;
  group_id: number;
  school_id: number;
  reference_month: string;
  due_date: string;
  paid_date: string | null;
  amount: string;
  method: string | null;
  status: 'paid' | 'pending' | 'late';
  notes: string | null;
  created_at: string;
  updated_at: string;
  school_name?: string;
}

export interface ListPaymentsParams {
  page?: number;
  limit?: number;
  schoolId?: number;
  status?: 'paid' | 'pending' | 'late';
  month?: string;
}

export interface ListPaymentsResponse {
  data: GroupPayment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const groupPaymentService = {
  getSummary: async (month?: string): Promise<PaymentSummary> => {
    const params = month ? { month } : {};
    const { data } = await api.get('/group/payments/summary', { params });
    return data;
  },

  list: async (params: ListPaymentsParams = {}): Promise<ListPaymentsResponse> => {
    const { data } = await api.get('/group/payments', { params });
    return data;
  },
};
