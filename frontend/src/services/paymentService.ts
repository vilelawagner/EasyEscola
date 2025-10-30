import api from '../lib/api';
import { Payment } from '../types';

export interface ListPaymentsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'pending' | 'paid' | 'overdue' | 'cancelled';
  student_id?: number;
  school_id?: number;
  reference_month?: string;
}

export interface ListPaymentsResponse {
  data: PaymentWithDetails[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaymentWithDetails extends Payment {
  student_name?: string;
  school_name?: string;
}

export interface CreatePaymentData {
  student_id: number;
  reference_month: string;
  amount: number;
  due_date: string;
  notes?: string;
}

export interface UpdatePaymentData {
  amount?: number;
  due_date?: string;
  paid_date?: string;
  status?: 'pending' | 'paid' | 'overdue' | 'cancelled';
  payment_method?: string;
  notes?: string;
}

export const paymentService = {
  list: async (params: ListPaymentsParams = {}): Promise<ListPaymentsResponse> => {
    const { data } = await api.get('/group/payments', { params });
    return data;
  },

  getById: async (id: number): Promise<PaymentWithDetails> => {
    const { data } = await api.get(`/group/payments/${id}`);
    return data;
  },

  create: async (paymentData: CreatePaymentData): Promise<Payment> => {
    const { data } = await api.post('/group/payments', paymentData);
    return data;
  },

  update: async (id: number, paymentData: UpdatePaymentData): Promise<Payment> => {
    const { data } = await api.put(`/group/payments/${id}`, paymentData);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/group/payments/${id}`);
  },

  markAsPaid: async (id: number, paymentMethod: string): Promise<Payment> => {
    const { data } = await api.patch(`/group/payments/${id}/mark-paid`, {
      payment_method: paymentMethod,
      paid_date: new Date().toISOString(),
    });
    return data;
  },

  generateMonthlyPayments: async (month: string): Promise<{ created: number }> => {
    const { data } = await api.post('/group/payments/generate-monthly', {
      reference_month: month,
    });
    return data;
  },
};
