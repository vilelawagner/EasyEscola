import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('students', (table) => {
    table.increments('id').primary();
    table.integer('group_id').unsigned().notNullable();
    table.integer('school_id').unsigned().notNullable();
    table.string('ra', 50).notNullable();
    table.string('name', 255).notNullable();
    table.string('email', 255);
    table.date('birthdate');
    table.string('cpf', 14);
    table.string('guardian_name', 255);
    table.string('guardian_phone', 20);
    table.enum('status', ['active', 'inactive', 'alumni', 'suspended', 'transferred']).defaultTo('active');
    table.timestamps(true, true);
    
    table.foreign('group_id').references('id').inTable('groups').onDelete('CASCADE');
    table.foreign('school_id').references('id').inTable('schools').onDelete('CASCADE');
    table.unique(['school_id', 'ra']);
    table.index(['group_id', 'school_id']);
    table.index('status');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('students');
}
