import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('grades', (table) => {
    table.increments('id').primary();
    table.integer('group_id').unsigned().notNullable();
    table.integer('school_id').unsigned().notNullable();
    table.integer('class_id').unsigned().notNullable();
    table.integer('subject_id').unsigned().notNullable();
    table.integer('student_id').unsigned().notNullable();
    table.integer('teacher_id').unsigned().notNullable();
    table.string('term', 10).notNullable(); // B1, B2, B3, B4, 1º, 2º
    table.decimal('grade', 5, 2).notNullable().checkBetween([0, 10]);
    table.text('comments');
    table.timestamp('recorded_at').defaultTo(knex.fn.now());
    table.timestamps(true, true);
    
    table.foreign('group_id').references('id').inTable('groups').onDelete('CASCADE');
    table.foreign('school_id').references('id').inTable('schools').onDelete('CASCADE');
    table.foreign('class_id').references('id').inTable('classes').onDelete('CASCADE');
    table.foreign('subject_id').references('id').inTable('subjects').onDelete('CASCADE');
    table.foreign('student_id').references('id').inTable('students').onDelete('CASCADE');
    table.foreign('teacher_id').references('id').inTable('teachers').onDelete('CASCADE');
    table.index(['group_id', 'school_id']);
    table.index(['student_id', 'subject_id', 'term']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('grades');
}
