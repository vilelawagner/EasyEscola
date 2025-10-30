import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.integer('group_id').unsigned().nullable();
    table.integer('school_id').unsigned().nullable();
    table.string('name', 255).notNullable();
    table.string('email', 255).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.enum('role', [
      'ROLE_SUPERADMIN',
      'ROLE_GROUP_MANAGER',
      'ROLE_SCHOOL_SECRETARY',
      'ROLE_TEACHER',
      'ROLE_STUDENT',
    ]).notNullable();
    table.boolean('is_active').defaultTo(true);
    table.timestamp('last_login_at').nullable();
    table.string('refresh_token', 500).nullable();
    table.timestamps(true, true);
    
    table.foreign('group_id').references('id').inTable('groups').onDelete('CASCADE');
    table.foreign('school_id').references('id').inTable('schools').onDelete('CASCADE');
    table.index('email');
    table.index('role');
    table.index(['group_id', 'school_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('users');
}
