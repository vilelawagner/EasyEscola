# Banco de Dados - InovaEdu

Este diretório pode conter diagramas, dumps e documentação do banco.

## Modelo Relacional (Resumo)
- secretarias (1) -> (N) escolas
- escolas (1) -> (N) turmas
- turmas (1) -> (N) alunos
- professores (N) <-> (N) disciplinas (professores_disciplinas)
- alunos (1) -> (N) mensalidades
- secretarias (1) -> (N) contratos
- contratos (1) -> (N) pagamentos
- frequencias/diarios_classe/notas vinculados a turma/disciplinas/alunos
