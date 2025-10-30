import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('materials', (table) => {
    table.increments('id').primary();
    table.integer('group_id').unsigned().notNullable();
    table.integer('school_id').unsigned().notNullable();
    table.integer('class_id').unsigned().notNullable();
    table.integer('subject_id').unsigned().notNullable();
    table.integer('teacher_id').unsigned().notNullable();
    table.string('title', 255).notNullable();
    table.text('description');
    table.string('file_path', 500).notNullable();
    table.string('mimetype', 100);
    table.integer('size').unsigned();
    table.timestamp('published_at').defaultTo(knex.fn.now());
    table.enum('visibility', ['class', 'school', 'group']).defaultTo('class');
    table.timestamps(true, true);
    
    table.foreign('group_id').references('id').inTable('groups').onDelete('CASCADE');
    table.foreign('school_id').references('id').inTable('schools').onDelete('CASCADE');
    table.foreign('class_id').references('id').inTable('classes').onDelete('CASCADE');
    table.foreign('subject_id').references('id').inTable('subjects').onDelete('CASCADE');
    table.foreign('teacher_id').references('id').inTable('teachers').onDelete('CASCADE');
    table.index(['group_id', 'school_id']);
    table.index(['class_id', 'subject_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('materials');
}
