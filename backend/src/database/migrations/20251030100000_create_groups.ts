import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('groups', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.string('doc_cnpj', 18);
    table.string('email', 255);
    table.string('phone', 20);
    table.string('billing_plan', 50);
    table.enum('status', ['active', 'inactive', 'pending']).defaultTo('active');
    table.timestamps(true, true);
    
    table.index('status');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('groups');
}
