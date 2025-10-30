import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('payments', (table) => {
    table.increments('id').primary();
    table.integer('group_id').unsigned().notNullable();
    table.integer('school_id').unsigned().nullable();
    table.string('reference_month', 7).notNullable(); // YYYY-MM
    table.date('due_date').notNullable();
    table.date('paid_date').nullable();
    table.decimal('amount', 10, 2).notNullable();
    table.enum('method', ['pix', 'boleto', 'cartao', 'transferencia']).nullable();
    table.enum('status', ['paid', 'pending', 'late']).defaultTo('pending');
    table.text('notes');
    table.timestamps(true, true);
    
    table.foreign('group_id').references('id').inTable('groups').onDelete('CASCADE');
    table.foreign('school_id').references('id').inTable('schools').onDelete('CASCADE');
    table.index('group_id');
    table.index(['group_id', 'school_id']);
    table.index(['reference_month', 'status']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('payments');
}
