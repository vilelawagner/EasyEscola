# 📚 Easy Escola - Documentação de API

## 🔐 Autenticação

Base URL: `http://localhost:4000/api/v1`

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@easyescola.com",
  "password": "senha123"
}

Response:
{
  "user": {
    "id": 1,
    "name": "Admin Inova",
    "email": "admin@easyescola.com",
    "role": "ROLE_SUPERADMIN"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}
```

### Logout
```http
POST /auth/logout
Authorization: Bearer {accessToken}
```

### Me
```http
GET /auth/me
Authorization: Bearer {accessToken}
```

---

## 👑 Nível 1 - Superadmin (`/admin/*`)

### Dashboard
```http
GET /admin/dashboard
Authorization: Bearer {accessToken}
```

### Grupos
```http
GET /admin/groups?page=1&limit=10&search=termo
POST /admin/groups
GET /admin/groups/:id
PUT /admin/groups/:id
DELETE /admin/groups/:id
```

### Escolas (Global)
```http
GET /admin/schools?page=1&limit=10
PUT /admin/schools/:id/status
```

### Pagamentos (Global)
```http
GET /admin/payments?page=1&limit=10
PUT /admin/payments/:id/status
GET /admin/payments/summary
```

### Impersonate
```http
POST /admin/impersonate
Body: { "userId": 2 }
```

---

## 🏢 Nível 2 - Gestor de Grupo (`/group/*`)

### Dashboard
```http
GET /group/dashboard
```

### Escolas (Próprio Grupo)
```http
GET /group/schools
POST /group/schools
GET /group/schools/:id
PUT /group/schools/:id
```

### Pagamentos (Próprio Grupo)
```http
GET /group/payments
GET /group/payments/summary
```

---

## 🏫 Nível 3 - Secretaria (`/school/*`)

### Alunos
```http
GET /school/students?page=1&limit=10&search=termo
POST /school/students
GET /school/students/:id
PUT /school/students/:id
DELETE /school/students/:id
```

### Professores
```http
GET /school/teachers
POST /school/teachers
PUT /school/teachers/:id
DELETE /school/teachers/:id
```

### Disciplinas
```http
GET /school/subjects
POST /school/subjects
PUT /school/subjects/:id
DELETE /school/subjects/:id
```

### Turmas
```http
GET /school/classes
POST /school/classes
PUT /school/classes/:id
DELETE /school/classes/:id
```

### Disciplinas da Turma
```http
POST /school/classes/:classId/subjects
DELETE /school/classes/:classId/subjects/:subjectId
```

### Horários
```http
GET /school/classes/:classId/schedules
POST /school/classes/:classId/schedules
DELETE /school/schedules/:id
```

### Matrículas
```http
GET /school/enrollments
POST /school/enrollments
DELETE /school/enrollments/:id
```

---

## 👨‍🏫 Nível 3 - Professor (`/teacher/*`)

### Dashboard
```http
GET /teacher/dashboard
```

### Materiais
```http
GET /teacher/materials?subjectId=1
POST /teacher/materials
Content-Type: multipart/form-data
Body: file, title, description, subjectId, classId, visibility

DELETE /teacher/materials/:id
GET /teacher/materials/:id/download
```

### Notas
```http
GET /teacher/grades?subjectId=1&classId=1
POST /teacher/grades
PUT /teacher/grades/:id
```

### Faltas
```http
GET /teacher/absences?subjectId=1&classId=1
POST /teacher/absences
PUT /teacher/absences/:id
DELETE /teacher/absences/:id
```

---

## 🎓 Nível 4 - Aluno (`/student/*`)

### Overview
```http
GET /student/overview
```

### Disciplinas
```http
GET /student/subjects
```

### Materiais
```http
GET /student/materials?subjectId=1
```

### Notas
```http
GET /student/grades
```

### Faltas
```http
GET /student/absences
```

### Histórico
```http
GET /student/history
```

### Horário
```http
GET /student/schedule
```

### Solicitações
```http
GET /student/requests
POST /student/requests
GET /student/requests/:id
```

### Notificações
```http
GET /student/notifications
PUT /student/notifications/:id/read
PUT /student/notifications/read-all
```

### Meus Dados
```http
GET /student/me
```

---

## 📝 Credenciais de Teste

```
Superadmin:
  Email: admin@easyescola.com
  Senha: senha123

Gestor do Grupo:
  Email: gestor@grupodemo.com
  Senha: senha123

Secretária:
  Email: secretaria@escolademo.com
  Senha: senha123

Professores:
  Email: joao.silva@escolademo.com
  Email: maria.santos@escolademo.com
  Senha: senha123

Alunos:
  Email: ana.costa@aluno.com
  Email: bruno.oliveira@aluno.com
  Senha: senha123
```

---

## 🔒 Headers Necessários

Todas as rotas protegidas (exceto `/auth/login` e `/auth/refresh`) requerem:

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

Para upload de arquivos:
```
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data
```

---

## 📊 Paginação

Resposta padrão paginada:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

---

## ❌ Erros

```json
{
  "message": "Mensagem de erro",
  "errors": {
    "field": ["Erro específico do campo"]
  }
}
```

Status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error
