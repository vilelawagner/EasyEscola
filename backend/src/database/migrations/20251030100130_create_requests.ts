import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('requests', (table) => {
    table.increments('id').primary();
    table.integer('group_id').unsigned().notNullable();
    table.integer('school_id').unsigned().notNullable();
    table.integer('student_id').unsigned().notNullable();
    table.enum('type', [
      'comprovante_matricula',
      'declaracao_vinculo',
      'historico',
      '2a_via_carteirinha',
      'aproveitamento',
      'outros',
    ]).notNullable();
    table.json('payload');
    table.enum('status', ['open', 'in_progress', 'closed']).defaultTo('open');
    table.text('response');
    table.timestamp('closed_at').nullable();
    table.timestamps(true, true);
    
    table.foreign('group_id').references('id').inTable('groups').onDelete('CASCADE');
    table.foreign('school_id').references('id').inTable('schools').onDelete('CASCADE');
    table.foreign('student_id').references('id').inTable('students').onDelete('CASCADE');
    table.index(['group_id', 'school_id']);
    table.index(['student_id', 'status']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('requests');
}
