# InovaEdu

Sistema completo de Gestão Escolar e Administrativa.

## Estrutura

```
InovaEdu/
  backend/   # API Node.js + Express + Sequelize (MySQL)
  frontend/  # React + Vite + Tailwind + Router + Context API
  database/  # Documentação/artefatos do banco
```

## Requisitos
- Node.js 18+
- MySQL 8+

## Variáveis de Ambiente
Crie um arquivo `.env` na pasta `backend/` baseado em `.env.example` na raiz (copie e ajuste as variáveis). Para o frontend, opcionalmente crie `frontend/.env`:

```
cp .env.example backend/.env
cp frontend/.env.example frontend/.env
```

Principais chaves:
- DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS
- JWT_SECRET
- PORT (porta do backend) e CORS_ORIGIN (origem do frontend)
No frontend, a chave principal é:
- VITE_API_URL (ex.: http://localhost:4000/api)

## Instalação
Na raiz do projeto:

```
npm install
```

Isso instalará dependências de `backend` e `frontend` via workspaces.

## Comandos
- `npm run dev` – inicia backend (Express) e frontend (Vite) em modo desenvolvimento.
- `npm run build` – compila backend e frontend.
- `npm run migrate` – executa migrações do Sequelize.
- `npm run seed` – popula o banco com dados iniciais (AdminInova, Secretaria exemplo, etc.).
- `npm start` – inicia o servidor backend em produção e o preview do frontend.

## Fluxo de Desenvolvimento
1. Configurar `.env` em `backend/.env`.
2. Subir MySQL local e garantir credenciais.
3. `npm run migrate` e `npm run seed`.
4. `npm run dev` para iniciar API e Web.

## Módulos (visão geral)
- Acadêmico: Alunos, Turmas, Disciplinas, Notas, Frequência, Diário, Boletins, Certificados.
- Professores e Colaboradores: Professores, Funcionários, Folha de Pagamento.
- Financeiro: Mensalidades, Pagamentos, Bolsas, Estoque, Relatórios.
- Gestão Pública: Secretarias (clientes), Escolas, Contratos, Licenças.
- Portal Inova (AdminInova): gestão comercial/financeira da empresa.

## Frontend
- Vite + React + Tailwind.
- Context API para autenticação e permissões.
- Tabelas com filtros, exportação PDF/XLS e gráficos (Recharts).

## Backend
- Express + Sequelize (MySQL)
- Autenticação JWT e papéis: AdminInova, GestorPublico, GestorEscola, Professor, Aluno, Responsavel.
- Padrão MVC, migrações e seeders.

## Banco de Dados
Relacionamentos principais:
- Secretaria (1) -> N Escolas
- Escola (1) -> N Turmas
- Turma (1) -> N Alunos
- Professor (N) <-> (N) Disciplinas
- Aluno (1) -> N Mensalidades
- Secretaria (1) -> N Contratos
- Contrato (1) -> N Pagamentos

## Troubleshooting
- Verifique as credenciais do MySQL e se o usuário tem permissão de criar banco e tabelas.
- Caso a porta 5173 (Vite) ou 4000 (API) esteja em uso, ajuste `CORS_ORIGIN` e `PORT`.

## Licença
MIT
