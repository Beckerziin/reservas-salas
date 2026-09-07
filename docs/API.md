# Referência da API

Base URL local: `http://localhost:3000`
Todas as respostas são JSON. Erros seguem o formato:

```json
{ "erro": { "codigo": "CODIGO_DO_ERRO", "mensagem": "descricao" } }
```

Autenticação: envie o token JWT no header `Authorization: Bearer <token>`.

---

## RF01 — Cadastrar usuário
`POST /api/usuarios` (público)

```json
{ "nome": "Maria", "email": "maria@ex.com", "senha": "senha123" }
```
- `201` → `{ "usuario": { "id", "nome", "email", "papel", "createdAt" }, "mensagem" }`
- `400 EMAIL_INVALIDO | NOME_OBRIGATORIO | SENHA_FRACA`
- `409 EMAIL_DUPLICADO`

## RF02 — Login
`POST /api/auth/login` (público)

```json
{ "email": "maria@ex.com", "senha": "senha123" }
```
- `200` → `{ "token": "<jwt>", "usuario": { ... } }`
- `401 CREDENCIAIS_INVALIDAS`

## Sessão — Usuário atual
`GET /api/auth/me` (JWT)
- `200` → `{ "usuario": { ... } }`
- `401 NAO_AUTENTICADO`

## RF03 — Listar salas
`GET /api/salas` (público)
- `200` → `{ "salas": [ { "id", "nome", "capacidade", "status", "createdAt" } ] }`

## RF08 — Cadastrar sala (admin)
`POST /api/salas` (JWT + papel `admin`)

```json
{ "nome": "Sala 1", "capacidade": 4, "status": "disponivel" }
```
- `201` → `{ "sala": { ... }, "mensagem" }`
- `403 ACESSO_NEGADO` (não-admin)
- `400 CAPACIDADE_INVALIDA | NOME_OBRIGATORIO | STATUS_INVALIDO`

## RF04/RF05 — Criar reserva
`POST /api/reservas` (JWT)

Dois formatos de horário aceitos:
```json
{ "salaId": "<uuid>", "inicio": "2026-09-10T14:00:00Z", "fim": "2026-09-10T15:00:00Z" }
```
```json
{ "salaId": "<uuid>", "data": "2026-09-10", "horaInicio": "14:00", "horaFim": "15:00" }
```
- `201` → `{ "reserva": { ... }, "mensagem": "Reserva confirmada" }`
- `400 ANTECEDENCIA_INSUFICIENTE` (RN01: mín. 30 min)
- `400 DURACAO_INVALIDA` (RN05: máx. 2 h)
- `400 HORARIO_INVALIDO | SALA_OBRIGATORIA`
- `404 NAO_ENCONTRADO` (sala inexistente)
- `409 CONFLITO_HORARIO` (RN02: sobreposição)
- `409 SALA_INDISPONIVEL`

## RF06 — Minhas reservas
`GET /api/reservas/minhas` (JWT)
- `200` → `{ "reservas": [ { "id","usuarioId","salaId","inicio","fim","status","createdAt" } ] }`

## RF07 — Cancelar reserva
`PATCH /api/reservas/:id/cancelar` (JWT)
- `200` → `{ "reserva": { ..., "status": "cancelada" }, "mensagem" }`
- `403 NAO_E_DONO` (RN03)
- `400 RESERVA_PASSADA` (RN04)
- `409 JA_CANCELADA`
- `404 NAO_ENCONTRADO`

## Health
`GET /api/health` (público) → `200` `{ "status": "ok", "dataSource": "memory|supabase" }`
