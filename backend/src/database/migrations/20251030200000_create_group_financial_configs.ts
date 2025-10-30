import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('group_financial_configs', (table) => {
    table.increments('id').primary();
    table.integer('group_id').unsigned().notNullable();
    table.decimal('price_per_school', 10, 2).defaultTo(0).comment('Valor por escola');
    table.integer('due_day').defaultTo(10).comment('Dia do vencimento (1-28)');
    table.string('payment_method', 50).nullable().comment('Forma de pagamento preferencial');
    table.text('notes').nullable().comment('Observações gerais');
    table.text('payment_terms').nullable().comment('Termos de pagamento');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Foreign key
    table.foreign('group_id').references('id').inTable('groups').onDelete('CASCADE');
    
    // Índice único para garantir uma configuração por grupo
    table.unique('group_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('group_financial_configs');
}
