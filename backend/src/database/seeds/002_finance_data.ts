import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Limpar tabelas financeiras existentes
  await knex('group_billings').del();
  await knex('group_financial_configs').del();

  // Buscar IDs dos grupos existentes
  const groups = await knex('groups').select('id');

  if (groups.length === 0) {
    console.log('⚠️  Nenhum grupo encontrado. Execute primeiro o seed inicial.');
    return;
  }

  // Configurações financeiras para os grupos
  const configs = groups.map((group, index) => ({
    group_id: group.id,
    price_per_school: 150.00 + (index * 50), // R$ 150, R$ 200, R$ 250, etc
    due_day: 10,
    payment_method: 'pix',
    notes: 'Pagamento preferencial via PIX',
    payment_terms: 'Desconto de 5% para pagamento até o dia 5. Juros de 2% após vencimento.',
    created_at: new Date(),
    updated_at: new Date(),
  }));

  await knex('group_financial_configs').insert(configs);

  console.log(`✓ ${configs.length} configurações financeiras criadas`);

  // Criar algumas cobranças de exemplo
  const billings = [];
  const currentMonth = new Date().toISOString().slice(0, 7);
  const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1))
    .toISOString()
    .slice(0, 7);
  const twoMonthsAgo = new Date(new Date().setMonth(new Date().getMonth() - 2))
    .toISOString()
    .slice(0, 7);

  for (const group of groups) {
    // Buscar número de escolas do grupo
    const [{ count }] = await knex('schools')
      .where('group_id', group.id)
      .where('status', 'active')
      .count('* as count');

    const totalSchools = Number(count) || 3; // Default 3 se não tiver escolas

    // Buscar configuração
    const config = await knex('group_financial_configs')
      .where('group_id', group.id)
      .first();

    if (!config) continue;

    const pricePerSchool = parseFloat(config.price_per_school.toString());

    // Cobrança de 2 meses atrás (paga)
    billings.push({
      group_id: group.id,
      reference_month: twoMonthsAgo,
      total_schools: totalSchools,
      price_per_school: pricePerSchool,
      total_amount: totalSchools * pricePerSchool,
      due_date: new Date(twoMonthsAgo + '-10'),
      paid_date: new Date(twoMonthsAgo + '-08'),
      status: 'paid',
      payment_method: 'pix',
      notes: 'Pagamento recebido via PIX',
      created_at: new Date(twoMonthsAgo + '-01'),
      updated_at: new Date(twoMonthsAgo + '-08'),
    });

    // Cobrança do mês passado (vencida para alguns, paga para outros)
    const isPaid = Math.random() > 0.5;
    billings.push({
      group_id: group.id,
      reference_month: lastMonth,
      total_schools: totalSchools,
      price_per_school: pricePerSchool,
      total_amount: totalSchools * pricePerSchool,
      due_date: new Date(lastMonth + '-10'),
      paid_date: isPaid ? new Date(lastMonth + '-09') : null,
      status: isPaid ? 'paid' : 'overdue',
      payment_method: isPaid ? 'transferencia' : null,
      notes: isPaid ? 'Pagamento recebido via transferência' : null,
      created_at: new Date(lastMonth + '-01'),
      updated_at: isPaid ? new Date(lastMonth + '-09') : new Date(lastMonth + '-01'),
    });

    // Cobrança do mês atual (pendente)
    billings.push({
      group_id: group.id,
      reference_month: currentMonth,
      total_schools: totalSchools,
      price_per_school: pricePerSchool,
      total_amount: totalSchools * pricePerSchool,
      due_date: new Date(currentMonth + '-10'),
      paid_date: null,
      status: 'pending',
      payment_method: null,
      notes: null,
      created_at: new Date(currentMonth + '-01'),
      updated_at: new Date(currentMonth + '-01'),
    });
  }

  await knex('group_billings').insert(billings);

  console.log(`✓ ${billings.length} cobranças criadas`);
}
