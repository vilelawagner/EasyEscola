import api from '../lib/api';

export interface FinancialConfig {
  id: number;
  group_id: number;
  price_per_school: number;
  due_day: number; // Dia do vencimento (1-28)
  payment_method?: string;
  notes?: string;
  payment_terms?: string;
  created_at: string;
  updated_at: string;
}

export interface GroupBilling {
  id: number;
  group_id: number;
  group_name?: string;
  reference_month: string;
  total_schools: number;
  price_per_school: number;
  total_amount: number;
  due_date: string;
  paid_date?: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  payment_method?: string;
  notes?: string;
  created_at: string;
}

export interface FinancialDashboard {
  total_receivable: number;
  total_received: number;
  total_pending: number;
  total_overdue: number;
  overdue_count: number;
  pending_count: number;
  paid_count: number;
  recent_payments: GroupBilling[];
  overdue_billings: GroupBilling[];
  monthly_revenue: Array<{ month: string; amount: number }>;
}

export interface ListBillingsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'pending' | 'paid' | 'overdue' | 'cancelled';
  group_id?: number;
  reference_month?: string;
}

export interface ListBillingsResponse {
  data: GroupBilling[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateBillingData {
  group_id: number;
  reference_month: string;
  notes?: string;
}

export interface UpdateConfigData {
  price_per_school: number;
  due_day: number;
  payment_method?: string;
  notes?: string;
  payment_terms?: string;
}

export const adminFinanceService = {
  // Dashboard
  getDashboard: async (): Promise<FinancialDashboard> => {
    const { data } = await api.get('/admin/finance/dashboard');
    return data;
  },

  // Configurações
  getConfig: async (groupId: number): Promise<FinancialConfig> => {
    const { data } = await api.get(`/admin/finance/config/${groupId}`);
    return data;
  },

  updateConfig: async (groupId: number, configData: UpdateConfigData): Promise<FinancialConfig> => {
    const { data } = await api.put(`/admin/finance/config/${groupId}`, configData);
    return data;
  },

  // Cobranças
  listBillings: async (params: ListBillingsParams = {}): Promise<ListBillingsResponse> => {
    const { data } = await api.get('/admin/finance/billings', { params });
    return data;
  },

  createBilling: async (billingData: CreateBillingData): Promise<GroupBilling> => {
    const { data } = await api.post('/admin/finance/billings', billingData);
    return data;
  },

  markAsPaid: async (id: number, paymentMethod: string): Promise<GroupBilling> => {
    const { data } = await api.patch(`/admin/finance/billings/${id}/mark-paid`, {
      payment_method: paymentMethod,
      paid_date: new Date().toISOString(),
    });
    return data;
  },

  cancelBilling: async (id: number): Promise<void> => {
    await api.delete(`/admin/finance/billings/${id}`);
  },

  generateMonthlyBillings: async (month: string): Promise<{ created: number }> => {
    const { data } = await api.post('/admin/finance/billings/generate-monthly', {
      reference_month: month,
    });
    return data;
  },
};
