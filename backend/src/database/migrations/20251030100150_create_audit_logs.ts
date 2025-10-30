import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('audit_logs', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().nullable();
    table.string('action', 100).notNullable();
    table.string('resource', 255).notNullable();
    table.string('method', 10).notNullable();
    table.text('payload_before');
    table.text('payload_after');
    table.integer('status_code').unsigned();
    table.string('ip_address', 45);
    table.string('user_agent', 500);
    table.integer('duration_ms').unsigned();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.foreign('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.index('user_id');
    table.index('action');
    table.index('created_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('audit_logs');
}
