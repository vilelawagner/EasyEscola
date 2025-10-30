import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('group_billings', (table) => {
    table.increments('id').primary();
    table.integer('group_id').unsigned().notNullable();
    table.string('reference_month', 7).notNullable().comment('Mês de referência (YYYY-MM)');
    table.integer('total_schools').unsigned().notNullable().comment('Quantidade de escolas no mês');
    table.decimal('price_per_school', 10, 2).notNullable().comment('Valor por escola');
    table.decimal('total_amount', 10, 2).notNullable().comment('Valor total da cobrança');
    table.date('due_date').notNullable().comment('Data de vencimento');
    table.date('paid_date').nullable().comment('Data do pagamento');
    table.enum('status', ['pending', 'paid', 'overdue', 'cancelled']).defaultTo('pending');
    table.string('payment_method', 50).nullable().comment('Forma de pagamento recebida');
    table.text('notes').nullable().comment('Observações');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Foreign key
    table.foreign('group_id').references('id').inTable('groups').onDelete('CASCADE');
    
    // Índice único para garantir uma cobrança por grupo por mês
    table.unique(['group_id', 'reference_month']);
    
    // Índices para performance
    table.index('status');
    table.index('due_date');
    table.index('reference_month');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('group_billings');
}
