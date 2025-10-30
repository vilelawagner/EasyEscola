import { Request, Response } from 'express';
import db from '../config/database';
import dayjs from 'dayjs';

export class AdminFinanceController {
  // Dashboard com métricas financeiras
  async getDashboard(_req: Request, res: Response) {
    try {
      // Buscar todas as cobranças
      const billings = await db('group_billings')
        .select(
          'group_billings.*',
          'groups.name as group_name'
        )
        .leftJoin('groups', 'group_billings.group_id', 'groups.id')
        .where('groups.status', 'active')
        .orderBy('group_billings.due_date', 'desc');

      // Calcular métricas
      let totalReceivable = 0;
      let totalReceived = 0;
      let totalPending = 0;
      let totalOverdue = 0;
      let paidCount = 0;
      let pendingCount = 0;
      let overdueCount = 0;

      const recentPayments: any[] = [];
      const overdueBillings: any[] = [];
      const monthlyRevenue: { [key: string]: number } = {};

      billings.forEach((billing: any) => {
        const amount = parseFloat(billing.total_amount.toString());
        
        // Total a receber (apenas pendentes e vencidos)
        if (billing.status === 'pending' || billing.status === 'overdue') {
          totalReceivable += amount;
        }

        // Total recebido
        if (billing.status === 'paid') {
          totalReceived += amount;
          paidCount++;
          recentPayments.push(billing);
          
          // Agrupar por mês para o gráfico
          const month = dayjs(billing.paid_date).format('YYYY-MM');
          monthlyRevenue[month] = (monthlyRevenue[month] || 0) + amount;
        }

        // Total pendente
        if (billing.status === 'pending') {
          totalPending += amount;
          pendingCount++;
        }

        // Total vencido
        if (billing.status === 'overdue') {
          totalOverdue += amount;
          overdueCount++;
          overdueBillings.push(billing);
        }
      });

      // Últimos 6 meses de receita
      const last6Months = [];
      for (let i = 5; i >= 0; i--) {
        const month = dayjs().subtract(i, 'month').format('YYYY-MM');
        last6Months.push({
          month,
          amount: monthlyRevenue[month] || 0,
        });
      }

      return res.json({
        total_receivable: totalReceivable,
        total_received: totalReceived,
        total_pending: totalPending,
        total_overdue: totalOverdue,
        paid_count: paidCount,
        pending_count: pendingCount,
        overdue_count: overdueCount,
        recent_payments: recentPayments.slice(0, 5),
        overdue_billings: overdueBillings.slice(0, 5),
        monthly_revenue: last6Months,
      });
    } catch (error) {
      console.error('Error getting finance dashboard:', error);
      return res.status(500).json({ message: 'Erro ao buscar dashboard financeiro' });
    }
  }

  // Listar cobranças com filtros
  async listBillings(req: Request, res: Response) {
    try {
      const { page = 1, limit = 15, search = '', status = '' } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      let query = db('group_billings')
        .select(
          'group_billings.*',
          'groups.name as group_name'
        )
        .leftJoin('groups', 'group_billings.group_id', 'groups.id');

      // Filtro por status
      if (status) {
        query = query.where('group_billings.status', status);
      }

      // Filtro por busca (nome do grupo)
      if (search) {
        query = query.where('groups.name', 'like', `%${search}%`);
      }

      // Contar total
      const [{ count }] = await query.clone().count('* as count');
      const total = Number(count);

      // Buscar dados paginados
      const data = await query
        .orderBy('group_billings.due_date', 'desc')
        .limit(Number(limit))
        .offset(offset);

      return res.json({
        data,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error('Error listing billings:', error);
      return res.status(500).json({ message: 'Erro ao listar cobranças' });
    }
  }

  // Buscar configuração financeira de um grupo
  async getConfig(req: Request, res: Response) {
    try {
      const { groupId } = req.params;

      const config = await db('group_financial_configs')
        .where('group_id', groupId)
        .first();

      if (!config) {
        // Retornar configuração padrão se não existir
        return res.json({
          group_id: Number(groupId),
          price_per_school: 0,
          due_day: 10,
          payment_method: null,
          notes: null,
          payment_terms: null,
        });
      }

      return res.json(config);
    } catch (error) {
      console.error('Error getting financial config:', error);
      return res.status(500).json({ message: 'Erro ao buscar configuração' });
    }
  }

  // Atualizar configuração financeira de um grupo
  async updateConfig(req: Request, res: Response) {
    try {
      const { groupId } = req.params;
      const { price_per_school, due_day, payment_method, notes, payment_terms } = req.body;

      // Validações
      if (price_per_school < 0) {
        return res.status(400).json({ message: 'Valor por escola deve ser maior ou igual a 0' });
      }

      if (due_day < 1 || due_day > 28) {
        return res.status(400).json({ message: 'Dia de vencimento deve estar entre 1 e 28' });
      }

      // Verificar se grupo existe
      const group = await db('groups').where('id', groupId).first();
      if (!group) {
        return res.status(404).json({ message: 'Grupo não encontrado' });
      }

      // Verificar se já existe configuração
      const existingConfig = await db('group_financial_configs')
        .where('group_id', groupId)
        .first();

      const configData = {
        group_id: groupId,
        price_per_school,
        due_day,
        payment_method,
        notes,
        payment_terms,
        updated_at: new Date(),
      };

      if (existingConfig) {
        // Atualizar
        await db('group_financial_configs')
          .where('group_id', groupId)
          .update(configData);
      } else {
        // Criar
        await db('group_financial_configs').insert({
          ...configData,
          created_at: new Date(),
        });
      }

      const updatedConfig = await db('group_financial_configs')
        .where('group_id', groupId)
        .first();

      return res.json(updatedConfig);
    } catch (error) {
      console.error('Error updating financial config:', error);
      return res.status(500).json({ message: 'Erro ao atualizar configuração' });
    }
  }

  // Gerar cobranças mensais para todos os grupos
  async generateMonthlyBillings(req: Request, res: Response) {
    try {
      const { reference_month } = req.body;

      if (!reference_month) {
        return res.status(400).json({ message: 'Mês de referência é obrigatório' });
      }

      // Buscar todos os grupos ativos com suas configurações
      const groups = await db('groups')
        .select(
          'groups.*',
          'group_financial_configs.price_per_school',
          'group_financial_configs.due_day'
        )
        .leftJoin('group_financial_configs', 'groups.id', 'group_financial_configs.group_id')
        .where('groups.status', 'active')
        .whereNotNull('group_financial_configs.price_per_school')
        .where('group_financial_configs.price_per_school', '>', 0);

      let createdCount = 0;
      let skippedCount = 0;

      for (const group of groups) {
        // Verificar se já existe cobrança para este mês
        const existingBilling = await db('group_billings')
          .where('group_id', group.id)
          .where('reference_month', reference_month)
          .first();

        if (existingBilling) {
          skippedCount++;
          continue;
        }

        // Contar escolas ativas do grupo
        const [{ count }] = await db('schools')
          .where('group_id', group.id)
          .where('status', 'active')
          .count('* as count');

        const totalSchools = Number(count);

        if (totalSchools === 0) {
          skippedCount++;
          continue;
        }

        // Calcular valor total
        const pricePerSchool = parseFloat(group.price_per_school.toString());
        const totalAmount = totalSchools * pricePerSchool;

        // Calcular data de vencimento
        const dueDate = dayjs(reference_month + '-01')
          .date(group.due_day)
          .format('YYYY-MM-DD');

        // Criar cobrança
        await db('group_billings').insert({
          group_id: group.id,
          reference_month,
          total_schools: totalSchools,
          price_per_school: pricePerSchool,
          total_amount: totalAmount,
          due_date: dueDate,
          status: dayjs().isAfter(dayjs(dueDate)) ? 'overdue' : 'pending',
          created_at: new Date(),
        });

        createdCount++;
      }

      return res.json({
        message: `Cobranças geradas com sucesso`,
        created: createdCount,
        skipped: skippedCount,
      });
    } catch (error) {
      console.error('Error generating monthly billings:', error);
      return res.status(500).json({ message: 'Erro ao gerar cobranças' });
    }
  }

  // Marcar cobrança como paga
  async markAsPaid(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { payment_method } = req.body;

      const billing = await db('group_billings').where('id', id).first();

      if (!billing) {
        return res.status(404).json({ message: 'Cobrança não encontrada' });
      }

      if (billing.status === 'paid') {
        return res.status(400).json({ message: 'Cobrança já está paga' });
      }

      await db('group_billings')
        .where('id', id)
        .update({
          status: 'paid',
          paid_date: new Date(),
          payment_method,
          updated_at: new Date(),
        });

      const updatedBilling = await db('group_billings')
        .select(
          'group_billings.*',
          'groups.name as group_name'
        )
        .leftJoin('groups', 'group_billings.group_id', 'groups.id')
        .where('group_billings.id', id)
        .first();

      return res.json(updatedBilling);
    } catch (error) {
      console.error('Error marking billing as paid:', error);
      return res.status(500).json({ message: 'Erro ao marcar cobrança como paga' });
    }
  }

  // Cancelar cobrança
  async cancelBilling(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const billing = await db('group_billings').where('id', id).first();

      if (!billing) {
        return res.status(404).json({ message: 'Cobrança não encontrada' });
      }

      if (billing.status === 'paid') {
        return res.status(400).json({ message: 'Não é possível cancelar cobrança já paga' });
      }

      if (billing.status === 'cancelled') {
        return res.status(400).json({ message: 'Cobrança já está cancelada' });
      }

      await db('group_billings')
        .where('id', id)
        .update({
          status: 'cancelled',
          updated_at: new Date(),
        });

      const updatedBilling = await db('group_billings')
        .select(
          'group_billings.*',
          'groups.name as group_name'
        )
        .leftJoin('groups', 'group_billings.group_id', 'groups.id')
        .where('group_billings.id', id)
        .first();

      return res.json(updatedBilling);
    } catch (error) {
      console.error('Error cancelling billing:', error);
      return res.status(500).json({ message: 'Erro ao cancelar cobrança' });
    }
  }

  // Criar cobrança manual para um grupo específico
  async createBilling(req: Request, res: Response) {
    try {
      const { group_id, reference_month, notes } = req.body;

      // Validações
      if (!group_id || !reference_month) {
        return res.status(400).json({ message: 'Grupo e mês de referência são obrigatórios' });
      }

      // Verificar se já existe cobrança para este mês
      const existingBilling = await db('group_billings')
        .where('group_id', group_id)
        .where('reference_month', reference_month)
        .first();

      if (existingBilling) {
        return res.status(400).json({ message: 'Já existe cobrança para este grupo neste mês' });
      }

      // Buscar configuração do grupo
      const config = await db('group_financial_configs')
        .where('group_id', group_id)
        .first();

      if (!config || !config.price_per_school || config.price_per_school <= 0) {
        return res.status(400).json({ 
          message: 'Grupo não possui configuração financeira válida' 
        });
      }

      // Contar escolas ativas do grupo
      const [{ count }] = await db('schools')
        .where('group_id', group_id)
        .where('status', 'active')
        .count('* as count');

      const totalSchools = Number(count);

      if (totalSchools === 0) {
        return res.status(400).json({ 
          message: 'Grupo não possui escolas ativas' 
        });
      }

      // Calcular valor total
      const pricePerSchool = parseFloat(config.price_per_school.toString());
      const totalAmount = totalSchools * pricePerSchool;

      // Calcular data de vencimento
      const dueDate = dayjs(reference_month + '-01')
        .date(config.due_day)
        .format('YYYY-MM-DD');

      // Criar cobrança
      const [billingId] = await db('group_billings').insert({
        group_id,
        reference_month,
        total_schools: totalSchools,
        price_per_school: pricePerSchool,
        total_amount: totalAmount,
        due_date: dueDate,
        status: dayjs().isAfter(dayjs(dueDate)) ? 'overdue' : 'pending',
        notes,
        created_at: new Date(),
      });

      const newBilling = await db('group_billings')
        .select(
          'group_billings.*',
          'groups.name as group_name'
        )
        .leftJoin('groups', 'group_billings.group_id', 'groups.id')
        .where('group_billings.id', billingId)
        .first();

      return res.status(201).json(newBilling);
    } catch (error) {
      console.error('Error creating billing:', error);
      return res.status(500).json({ message: 'Erro ao criar cobrança' });
    }
  }
}
