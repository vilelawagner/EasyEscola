import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('student_payments', (table) => {
    table.increments('id').primary();
    table.integer('group_id').unsigned().notNullable();
    table.integer('school_id').unsigned().notNullable();
    table.integer('student_id').unsigned().notNullable();
    table.integer('enrollment_id').unsigned().nullable();
    table.string('reference_month', 7).notNullable(); // YYYY-MM
    table.string('barcode', 100).nullable(); // Código de barras do boleto
    table.string('pix_key', 200).nullable(); // Chave PIX para pagamento
    table.date('due_date').notNullable();
    table.date('paid_date').nullable();
    table.decimal('amount', 10, 2).notNullable();
    table.decimal('discount', 10, 2).defaultTo(0);
    table.decimal('fine', 10, 2).defaultTo(0);
    table.decimal('interest', 10, 2).defaultTo(0);
    table.decimal('amount_paid', 10, 2).nullable();
    table.enum('payment_method', ['pix', 'boleto', 'cartao', 'dinheiro', 'transferencia']).nullable();
    table.enum('status', ['paid', 'pending', 'late', 'cancelled']).defaultTo('pending');
    table.string('description', 200).notNullable(); // Ex: "Mensalidade Outubro 2025"
    table.text('notes');
    table.timestamps(true, true);
    
    table.foreign('group_id').references('id').inTable('groups').onDelete('CASCADE');
    table.foreign('school_id').references('id').inTable('schools').onDelete('CASCADE');
    table.foreign('student_id').references('id').inTable('students').onDelete('CASCADE');
    table.foreign('enrollment_id').references('id').inTable('enrollments').onDelete('SET NULL');
    
    table.index('group_id');
    table.index('school_id');
    table.index('student_id');
    table.index(['group_id', 'school_id']);
    table.index(['student_id', 'status']);
    table.index(['reference_month', 'status']);
    table.index(['due_date', 'status']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('student_payments');
}
