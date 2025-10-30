import { Knex } from 'knex';
import bcrypt from 'bcrypt';
import { UserRole, Status, Shift } from '../../types/enums';

export async function seed(knex: Knex): Promise<void> {
  // Limpa tabelas (em ordem reversa de dependências)
  await knex('notifications').del();
  await knex('audit_logs').del();
  await knex('payments').del();
  await knex('requests').del();
  await knex('materials').del();
  await knex('absences').del();
  await knex('grades').del();
  await knex('enrollments').del();
  await knex('class_schedules').del();
  await knex('class_subjects').del();
  await knex('classes').del();
  await knex('subjects').del();
  await knex('teachers').del();
  await knex('students').del();
  await knex('users').del();
  await knex('schools').del();
  await knex('groups').del();

  // Hash da senha padrão: "senha123"
  const passwordHash = await bcrypt.hash('senha123', 10);

  // 1. SUPERADMIN (N1)
  await knex('users').insert({
    id: 1,
    group_id: null,
    school_id: null,
    name: 'Administrador do Sistema',
    email: 'admin@easyescola.com',
    password_hash: passwordHash,
    role: UserRole.SUPERADMIN,
    is_active: true,
  });

  // 2. GRUPO DEMO
  await knex('groups').insert({
    id: 1,
    name: 'Grupo Educacional Demo',
    doc_cnpj: '12.345.678/0001-90',
    email: 'contato@grupodemo.com',
    phone: '(11) 98765-4321',
    billing_plan: 'premium',
    status: Status.ACTIVE,
  });

  // 3. GESTOR DO GRUPO (N2)
  await knex('users').insert({
    id: 2,
    group_id: 1,
    school_id: null,
    name: 'Gestor do Grupo',
    email: 'gestor@grupodemo.com',
    password_hash: passwordHash,
    role: UserRole.GROUP_MANAGER,
    is_active: true,
  });

  // 4. ESCOLA DEMO
  await knex('schools').insert({
    id: 1,
    group_id: 1,
    name: 'Escola Demo Central',
    doc_cnpj: '12.345.678/0002-71',
    address: 'Rua das Flores, 123',
    city: 'São Paulo',
    state: 'SP',
    zip: '01234-567',
    email: 'contato@escolademo.com',
    phone: '(11) 3456-7890',
    status: Status.ACTIVE,
  });

  // 5. SECRETÁRIA (N3)
  await knex('users').insert({
    id: 3,
    group_id: 1,
    school_id: 1,
    name: 'Secretária Escola',
    email: 'secretaria@escolademo.com',
    password_hash: passwordHash,
    role: UserRole.SCHOOL_SECRETARY,
    is_active: true,
  });

  // 6. PROFESSORES (N3)
  await knex('teachers').insert([
    {
      id: 1,
      group_id: 1,
      school_id: 1,
      name: 'Prof. João Silva',
      email: 'joao.silva@escolademo.com',
      register_code: 'PROF001',
      status: Status.ACTIVE,
    },
    {
      id: 2,
      group_id: 1,
      school_id: 1,
      name: 'Profa. Maria Santos',
      email: 'maria.santos@escolademo.com',
      register_code: 'PROF002',
      status: Status.ACTIVE,
    },
  ]);

  await knex('users').insert([
    {
      id: 4,
      group_id: 1,
      school_id: 1,
      name: 'Prof. João Silva',
      email: 'joao.silva@escolademo.com',
      password_hash: passwordHash,
      role: UserRole.TEACHER,
      is_active: true,
    },
    {
      id: 5,
      group_id: 1,
      school_id: 1,
      name: 'Profa. Maria Santos',
      email: 'maria.santos@escolademo.com',
      password_hash: passwordHash,
      role: UserRole.TEACHER,
      is_active: true,
    },
  ]);

  // 7. ALUNOS (N4)
  await knex('students').insert([
    {
      id: 1,
      group_id: 1,
      school_id: 1,
      ra: '2025001',
      name: 'Ana Paula Costa',
      email: 'ana.costa@aluno.com',
      birthdate: '2008-03-15',
      cpf: '123.456.789-01',
      guardian_name: 'Paulo Costa',
      guardian_phone: '(11) 91234-5678',
      status: Status.ACTIVE,
    },
    {
      id: 2,
      group_id: 1,
      school_id: 1,
      ra: '2025002',
      name: 'Bruno Oliveira',
      email: 'bruno.oliveira@aluno.com',
      birthdate: '2008-05-20',
      cpf: '234.567.890-12',
      guardian_name: 'Carlos Oliveira',
      guardian_phone: '(11) 92345-6789',
      status: Status.ACTIVE,
    },
    {
      id: 3,
      group_id: 1,
      school_id: 1,
      ra: '2025003',
      name: 'Carla Souza',
      email: 'carla.souza@aluno.com',
      birthdate: '2008-07-10',
      cpf: '345.678.901-23',
      guardian_name: 'Marina Souza',
      guardian_phone: '(11) 93456-7890',
      status: Status.ACTIVE,
    },
    {
      id: 4,
      group_id: 1,
      school_id: 1,
      ra: '2025004',
      name: 'Daniel Lima',
      email: 'daniel.lima@aluno.com',
      birthdate: '2008-09-25',
      cpf: '456.789.012-34',
      guardian_name: 'Roberto Lima',
      guardian_phone: '(11) 94567-8901',
      status: Status.ACTIVE,
    },
    {
      id: 5,
      group_id: 1,
      school_id: 1,
      ra: '2025005',
      name: 'Eduarda Ferreira',
      email: 'eduarda.ferreira@aluno.com',
      birthdate: '2008-11-30',
      cpf: '567.890.123-45',
      guardian_name: 'Fernanda Ferreira',
      guardian_phone: '(11) 95678-9012',
      status: Status.ACTIVE,
    },
  ]);

  await knex('users').insert([
    {
      id: 6,
      group_id: 1,
      school_id: 1,
      name: 'Ana Paula Costa',
      email: 'ana.costa@aluno.com',
      password_hash: passwordHash,
      role: UserRole.STUDENT,
      is_active: true,
    },
    {
      id: 7,
      group_id: 1,
      school_id: 1,
      name: 'Bruno Oliveira',
      email: 'bruno.oliveira@aluno.com',
      password_hash: passwordHash,
      role: UserRole.STUDENT,
      is_active: true,
    },
    {
      id: 8,
      group_id: 1,
      school_id: 1,
      name: 'Carla Souza',
      email: 'carla.souza@aluno.com',
      password_hash: passwordHash,
      role: UserRole.STUDENT,
      is_active: true,
    },
    {
      id: 9,
      group_id: 1,
      school_id: 1,
      name: 'Daniel Lima',
      email: 'daniel.lima@aluno.com',
      password_hash: passwordHash,
      role: UserRole.STUDENT,
      is_active: true,
    },
    {
      id: 10,
      group_id: 1,
      school_id: 1,
      name: 'Eduarda Ferreira',
      email: 'eduarda.ferreira@aluno.com',
      password_hash: passwordHash,
      role: UserRole.STUDENT,
      is_active: true,
    },
  ]);

  // 8. TURMAS
  await knex('classes').insert([
    {
      id: 1,
      group_id: 1,
      school_id: 1,
      name: '9º Ano A',
      year: 2025,
      semester: 1,
      shift: Shift.MORNING,
      status: Status.ACTIVE,
    },
    {
      id: 2,
      group_id: 1,
      school_id: 1,
      name: '9º Ano B',
      year: 2025,
      semester: 1,
      shift: Shift.AFTERNOON,
      status: Status.ACTIVE,
    },
  ]);

  // 9. DISCIPLINAS
  await knex('subjects').insert([
    {
      id: 1,
      group_id: 1,
      school_id: 1,
      name: 'Matemática',
      code: 'MAT',
      description: 'Matemática fundamental',
      status: Status.ACTIVE,
    },
    {
      id: 2,
      group_id: 1,
      school_id: 1,
      name: 'Português',
      code: 'PORT',
      description: 'Língua Portuguesa',
      status: Status.ACTIVE,
    },
    {
      id: 3,
      group_id: 1,
      school_id: 1,
      name: 'História',
      code: 'HIST',
      description: 'História Geral e do Brasil',
      status: Status.ACTIVE,
    },
    {
      id: 4,
      group_id: 1,
      school_id: 1,
      name: 'Ciências',
      code: 'CIE',
      description: 'Ciências Naturais',
      status: Status.ACTIVE,
    },
  ]);

  // 10. VÍNCULO TURMA-DISCIPLINA-PROFESSOR
  await knex('class_subjects').insert([
    { id: 1, group_id: 1, school_id: 1, class_id: 1, subject_id: 1, teacher_id: 1 },
    { id: 2, group_id: 1, school_id: 1, class_id: 1, subject_id: 2, teacher_id: 2 },
    { id: 3, group_id: 1, school_id: 1, class_id: 2, subject_id: 1, teacher_id: 1 },
    { id: 4, group_id: 1, school_id: 1, class_id: 2, subject_id: 3, teacher_id: 2 },
  ]);

  // 11. AGENDA DE AULAS
  await knex('class_schedules').insert([
    // 9º A - Segunda
    { group_id: 1, school_id: 1, class_id: 1, subject_id: 1, teacher_id: 1, day_of_week: 1, start_time: '08:00', end_time: '09:00', room: 'Sala 101' },
    { group_id: 1, school_id: 1, class_id: 1, subject_id: 2, teacher_id: 2, day_of_week: 1, start_time: '09:00', end_time: '10:00', room: 'Sala 101' },
    // 9º A - Terça
    { group_id: 1, school_id: 1, class_id: 1, subject_id: 1, teacher_id: 1, day_of_week: 2, start_time: '08:00', end_time: '09:00', room: 'Sala 101' },
  ]);

  // 12. MATRÍCULAS
  await knex('enrollments').insert([
    { group_id: 1, school_id: 1, class_id: 1, student_id: 1, status: Status.ACTIVE },
    { group_id: 1, school_id: 1, class_id: 1, student_id: 2, status: Status.ACTIVE },
    { group_id: 1, school_id: 1, class_id: 1, student_id: 3, status: Status.ACTIVE },
    { group_id: 1, school_id: 1, class_id: 2, student_id: 4, status: Status.ACTIVE },
    { group_id: 1, school_id: 1, class_id: 2, student_id: 5, status: Status.ACTIVE },
  ]);

  // 13. PAGAMENTOS
  await knex('payments').insert([
    {
      group_id: 1,
      school_id: 1,
      reference_month: '2025-01',
      due_date: '2025-01-10',
      paid_date: '2025-01-08',
      amount: 5000.00,
      method: 'pix',
      status: 'paid',
      notes: 'Pagamento referente a janeiro/2025',
    },
    {
      group_id: 1,
      school_id: 1,
      reference_month: '2025-02',
      due_date: '2025-02-10',
      paid_date: null,
      amount: 5000.00,
      method: null,
      status: 'pending',
      notes: 'Pagamento referente a fevereiro/2025',
    },
  ]);

  console.log('✓ Seeds executados com sucesso!');
  console.log('\nCredenciais de acesso:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('SUPERADMIN:');
  console.log('  Email: admin@easyescola.com');
  console.log('  Senha: senha123');
  console.log('\nGESTOR DO GRUPO:');
  console.log('  Email: gestor@grupodemo.com');
  console.log('  Senha: senha123');
  console.log('\nSECRETÁRIA:');
  console.log('  Email: secretaria@escolademo.com');
  console.log('  Senha: senha123');
  console.log('\nPROFESSORes:');
  console.log('  Email: joao.silva@escolademo.com');
  console.log('  Email: maria.santos@escolademo.com');
  console.log('  Senha: senha123');
  console.log('\nALUNOS:');
  console.log('  Email: ana.costa@aluno.com');
  console.log('  Email: bruno.oliveira@aluno.com');
  console.log('  (e outros 3 alunos)');
  console.log('  Senha: senha123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}
