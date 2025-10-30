import api from '../lib/api';

export interface StudentPayment {
  id: number;
  group_id: number;
  school_id: number;
  student_id: number;
  enrollment_id?: number;
  reference_month: string; // YYYY-MM
  barcode?: string;
  pix_key?: string;
  due_date: string;
  paid_date?: string;
  amount: number;
  discount: number;
  fine: number;
  interest: number;
  amount_paid?: number;
  payment_method?: 'pix' | 'boleto' | 'cartao' | 'dinheiro' | 'transferencia';
  status: 'paid' | 'pending' | 'late' | 'cancelled';
  description: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Join fields
  student_name?: string;
  student_ra?: string;
}

export interface FinanceSummary {
  total_expected: number;
  total_received: number;
  total_pending: number;
  total_late: number;
  late_count: number;
  defaulters_count: number;
}

export interface Defaulter {
  student_id: number;
  student_name: string;
  student_ra: string;
  student_email: string;
  late_payments_count: number;
  total_debt: number;
}

export interface GenerateBoletoData {
  studentId: number;
  referenceMonth: string;
  amount: number;
  dueDate: string;
  description?: string;
}

export interface MarkAsPaidData {
  paymentMethod?: 'pix' | 'boleto' | 'cartao' | 'dinheiro' | 'transferencia';
  amountPaid?: number;
  paidDate?: string;
  notes?: string;
}

export const schoolFinanceService = {
  async getSummary(month?: string): Promise<FinanceSummary> {
    const params = month ? { month } : {};
    const response = await api.get('/school/finance/summary', { params });
    return response.data;
  },

  async listPayments(params?: {
    page?: number;
    limit?: number;
    status?: string;
    month?: string;
    studentId?: number;
  }) {
    const response = await api.get('/school/finance/payments', { params });
    return response.data;
  },

  async listDefaulters(params?: {
    page?: number;
    limit?: number;
  }) {
    const response = await api.get('/school/finance/defaulters', { params });
    return response.data;
  },

  async generateBoleto(data: GenerateBoletoData): Promise<StudentPayment> {
    const response = await api.post('/school/finance/boleto', data);
    return response.data;
  },

  async markAsPaid(paymentId: number, data: MarkAsPaidData): Promise<StudentPayment> {
    const response = await api.put(`/school/finance/payments/${paymentId}/paid`, data);
    return response.data;
  },
};
