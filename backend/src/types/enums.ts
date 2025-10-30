// Roles do sistema
export enum UserRole {
  SUPERADMIN = 'ROLE_SUPERADMIN',
  GROUP_MANAGER = 'ROLE_GROUP_MANAGER',
  SCHOOL_SECRETARY = 'ROLE_SCHOOL_SECRETARY',
  TEACHER = 'ROLE_TEACHER',
  STUDENT = 'ROLE_STUDENT',
}

// Status diversos
export enum Status {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  REQUESTED = 'requested',
  ALUMNI = 'alumni',
  SUSPENDED = 'suspended',
  TRANSFERRED = 'transferred',
}

// Status de pagamento
export enum PaymentStatus {
  PAID = 'paid',
  PENDING = 'pending',
  LATE = 'late',
}

// Métodos de pagamento
export enum PaymentMethod {
  PIX = 'pix',
  BOLETO = 'boleto',
  CARD = 'cartao',
  TRANSFER = 'transferencia',
}

// Turnos
export enum Shift {
  MORNING = 'manhã',
  AFTERNOON = 'tarde',
  NIGHT = 'noite',
  FULL_TIME = 'integral',
}

// Termos/Bimestres
export enum Term {
  B1 = 'B1',
  B2 = 'B2',
  B3 = 'B3',
  B4 = 'B4',
  FIRST_SEM = '1º',
  SECOND_SEM = '2º',
}

// Tipos de solicitações
export enum RequestType {
  ENROLLMENT_CERTIFICATE = 'comprovante_matricula',
  AFFILIATION_DECLARATION = 'declaracao_vinculo',
  TRANSCRIPT = 'historico',
  SECOND_COPY_ID = '2a_via_carteirinha',
  CREDIT_TRANSFER = 'aproveitamento',
  OTHER = 'outros',
}

// Status de solicitação
export enum RequestStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  CLOSED = 'closed',
}

// Visibilidade de materiais
export enum MaterialVisibility {
  CLASS = 'class',
  SCHOOL = 'school',
  GROUP = 'group',
}

// Níveis de acesso (para tenant guard)
export enum AccessLevel {
  GLOBAL = 1, // Superadmin
  GROUP = 2, // Gestor do Grupo
  SCHOOL = 3, // Secretaria/Professor
  STUDENT = 4, // Aluno
}
