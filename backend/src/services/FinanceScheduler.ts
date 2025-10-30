import db from '../config/database';
import dayjs from 'dayjs';
import logger from '../utils/logger';

export class FinanceScheduler {
  // Atualizar status de cobranças vencidas
  static async updateOverdueBillings() {
    try {
      const today = dayjs().format('YYYY-MM-DD');

      // Atualizar cobranças pendentes que venceram
      const result = await db('group_billings')
        .where('status', 'pending')
        .where('due_date', '<', today)
        .update({
          status: 'overdue',
          updated_at: new Date(),
        });

      if (result > 0) {
        logger.info(`${result} cobranças marcadas como vencidas`);
      }

      return result;
    } catch (error) {
      logger.error('Erro ao atualizar cobranças vencidas:', error);
      throw error;
    }
  }

  // Gerar cobranças automaticamente no início do mês
  static async autoGenerateMonthlyBillings() {
    try {
      const currentMonth = dayjs().format('YYYY-MM');
      
      // Buscar todos os grupos ativos com configuração
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

      for (const group of groups) {
        // Verificar se já existe cobrança para este mês
        const existingBilling = await db('group_billings')
          .where('group_id', group.id)
          .where('reference_month', currentMonth)
          .first();

        if (existingBilling) {
          continue;
        }

        // Contar escolas ativas
        const [{ count }] = await db('schools')
          .where('group_id', group.id)
          .where('status', 'active')
          .count('* as count');

        const totalSchools = Number(count);

        if (totalSchools === 0) {
          continue;
        }

        // Criar cobrança
        const pricePerSchool = parseFloat(group.price_per_school.toString());
        const totalAmount = totalSchools * pricePerSchool;
        const dueDate = dayjs(currentMonth + '-01')
          .date(group.due_day)
          .format('YYYY-MM-DD');

        await db('group_billings').insert({
          group_id: group.id,
          reference_month: currentMonth,
          total_schools: totalSchools,
          price_per_school: pricePerSchool,
          total_amount: totalAmount,
          due_date: dueDate,
          status: 'pending',
          created_at: new Date(),
        });

        createdCount++;
      }

      if (createdCount > 0) {
        logger.info(`${createdCount} cobranças geradas automaticamente para ${currentMonth}`);
      }

      return createdCount;
    } catch (error) {
      logger.error('Erro ao gerar cobranças automáticas:', error);
      throw error;
    }
  }

  // Iniciar scheduler (executar diariamente)
  static startScheduler() {
    // Atualizar cobranças vencidas a cada hora
    setInterval(async () => {
      await this.updateOverdueBillings();
    }, 60 * 60 * 1000); // 1 hora

    // Executar imediatamente na inicialização
    this.updateOverdueBillings();

    logger.info('Finance scheduler iniciado');
  }
}
