import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('schools', (table) => {
    table.increments('id').primary();
    table.integer('group_id').unsigned().notNullable();
    table.string('name', 255).notNullable();
    table.string('doc_cnpj', 18);
    table.string('address', 255);
    table.string('city', 100);
    table.string('state', 2);
    table.string('zip', 10);
    table.string('email', 255);
    table.string('phone', 20);
    table.enum('status', ['active', 'inactive', 'requested']).defaultTo('active');
    table.timestamps(true, true);
    
    table.foreign('group_id').references('id').inTable('groups').onDelete('CASCADE');
    table.index('group_id');
    table.index(['group_id', 'status']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('schools');
}
