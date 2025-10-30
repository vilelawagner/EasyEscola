# Easy Escola - Backend

Backend da plataforma educacional multi-tenant Easy Escola.

## 🚀 Tecnologias

- **Node.js** + **TypeScript**
- **Express** - Framework web
- **Knex** - Query builder SQL
- **MySQL** - Banco de dados
- **JWT** - Autenticação
- **Bcrypt** - Hash de senhas
- **Winston** - Logs
- **Zod** - Validação de dados
- **Multer** - Upload de arquivos

## 📋 Pré-requisitos

- Node.js >= 18.0.0
- npm >= 9.0.0
- MySQL >= 8.0

## ⚙️ Instalação

1. Clone o repositório e entre na pasta do backend:
```bash
cd backend
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
APP_PORT=4000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=easy_escola
JWT_ACCESS_SECRET=sua_chave_secreta_access
JWT_REFRESH_SECRET=sua_chave_secreta_refresh
```

4. Execute as migrations:
```bash
npm run migrate:latest
```

5. (Opcional) Execute os seeds:
```bash
npm run seed:run
```

## 🏃 Executando

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm run build
npm start
```

## 📊 Banco de Dados

### Migrations

Criar nova migration:
```bash
npm run migrate:make nome_da_migration
```

Executar migrations:
```bash
npm run migrate:latest
```

Reverter última migration:
```bash
npm run migrate:rollback
```

### Seeds

Criar nova seed:
```bash
npm run seed:make nome_da_seed
```

Executar seeds:
```bash
npm run seed:run
```

## 🗂️ Estrutura do Projeto

```
backend/
├── src/
│   ├── config/          # Configurações (DB, Knex)
│   ├── controllers/     # Controllers
│   ├── database/
│   │   ├── migrations/  # Migrations do banco
│   │   └── seeds/       # Seeds de dados
│   ├── middlewares/     # Middlewares
│   │   ├── authMiddleware.ts      # Autenticação JWT
│   │   ├── rbacMiddleware.ts      # Controle de acesso por role
│   │   ├── tenantMiddleware.ts    # Multi-tenant guard
│   │   ├── auditMiddleware.ts     # Auditoria de ações
│   │   └── errorHandler.ts        # Tratamento de erros
│   ├── routes/          # Rotas da API
│   ├── schemas/         # Schemas de validação Zod
│   ├── types/           # Tipos TypeScript
│   ├── utils/           # Utilitários
│   ├── app.ts           # Configuração do Express
│   └── server.ts        # Inicialização do servidor
├── tests/               # Testes
├── .env.example         # Exemplo de variáveis de ambiente
├── package.json
└── tsconfig.json
```

## 🔐 Autenticação

A API usa JWT (JSON Web Tokens) para autenticação. Existem dois tipos de tokens:

- **Access Token**: Expira em 15 minutos (padrão)
- **Refresh Token**: Expira em 7 dias (padrão)

### Endpoints de Autenticação

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "usuario@example.com",
  "password": "senha123"
}
```

Resposta:
```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "user": {
    "id": 1,
    "name": "Nome do Usuário",
    "email": "usuario@example.com",
    "role": "ROLE_SUPERADMIN",
    "groupId": null,
    "schoolId": null
  }
}
```

#### Refresh Token
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "..."
}
```

#### Logout
```http
POST /api/v1/auth/logout
Authorization: Bearer <access_token>
```

#### Obter dados do usuário
```http
GET /api/v1/auth/me
Authorization: Bearer <access_token>
```

## 👥 Sistema Multi-Tenant

O sistema implementa 4 níveis de acesso:

### Nível 1: Superadmin (ROLE_SUPERADMIN)
- Acesso global a todos os grupos e escolas
- Pode impersonar outros usuários
- Gerencia pagamentos e financeiro
- Sem filtros de tenant aplicados

### Nível 2: Gestor do Grupo (ROLE_GROUP_MANAGER)
- Acesso apenas ao seu grupo
- Gerencia escolas do grupo
- Visualiza financeiro do grupo
- Filtros: `group_id`

### Nível 3: Secretaria e Professor
- **ROLE_SCHOOL_SECRETARY**: Gerencia alunos, turmas, professores
- **ROLE_TEACHER**: Gerencia materiais, notas e faltas
- Acesso apenas à sua escola
- Filtros: `group_id` + `school_id`

### Nível 4: Aluno (ROLE_STUDENT)
- Acesso apenas aos próprios dados
- Visualiza materiais, notas, faltas
- Faz solicitações (documentos, declarações)
- Filtros: `group_id` + `school_id` + `student_id`

### TenantGuard

O middleware `tenantMiddleware` injeta automaticamente filtros nas queries baseado no nível de acesso:

```typescript
import { applyTenantFilter } from './middlewares/tenantMiddleware';

// Exemplo de uso
const query = db('students').select('*');
applyTenantFilter(query, req); // Adiciona filtros automaticamente
const students = await query;
```

## 🛡️ RBAC (Role-Based Access Control)

Use o middleware `requireRole` para proteger rotas:

```typescript
import { requireRole } from './middlewares/rbacMiddleware';
import { UserRole } from './types/enums';

// Apenas superadmin
router.get('/admin/stats', 
  authenticateToken,
  requireRole(UserRole.SUPERADMIN),
  AdminController.getStats
);

// Secretaria ou Professor
router.get('/classes',
  authenticateToken,
  requireRole(UserRole.SCHOOL_SECRETARY, UserRole.TEACHER),
  ClassController.list
);
```

## 📝 Auditoria

Todas as ações importantes são registradas na tabela `audit_logs`:

```typescript
import { auditLog } from './middlewares/auditMiddleware';

router.post('/students',
  authenticateToken,
  requireRole(UserRole.SCHOOL_SECRETARY),
  auditLog('create_student'), // Registra a ação
  StudentController.create
);
```

## 🧪 Testes

Executar testes:
```bash
npm test
```

Executar com coverage:
```bash
npm run test:coverage
```

Executar em watch mode:
```bash
npm run test:watch
```

## 📦 Scripts Disponíveis

- `npm run dev` - Inicia em modo desenvolvimento
- `npm run build` - Compila TypeScript
- `npm start` - Inicia em produção
- `npm run migrate:make` - Cria nova migration
- `npm run migrate:latest` - Executa migrations
- `npm run migrate:rollback` - Reverte migration
- `npm run seed:make` - Cria nova seed
- `npm run seed:run` - Executa seeds
- `npm run lint` - Executa ESLint
- `npm run lint:fix` - Corrige problemas do ESLint
- `npm run format` - Formata código com Prettier
- `npm test` - Executa testes

## 📄 Licença

MIT
