# Frontend - Sistema de Reservas de Salas

Interface React + Vite para consumir a API deste repositorio.

## Rodar em desenvolvimento

No terminal da raiz do projeto:

```bash
npm install
$env:SEED_DEV="true"; npm run dev
```

Em outro terminal, dentro de `frontend/`:

```bash
npm install
npm run dev
```

O Vite abre em `http://localhost:5173` e redireciona chamadas `/api` para
`http://localhost:3000`.

## Usuarios de exemplo

Quando a API esta em memoria com `SEED_DEV=true`:

- `aluno@fag.local` / `aluno123`
- `admin@fag.local` / `admin123`

## Configurar outra API

Crie um arquivo `.env` dentro de `frontend/` quando precisar apontar para outro
backend:

```bash
VITE_API_URL=https://sua-api.vercel.app/api
```
