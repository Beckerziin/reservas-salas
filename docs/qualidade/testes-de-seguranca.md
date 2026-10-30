# Testes de segurança

Testes automatizados (Jest + Supertest) que atacam a própria API para
verificar as quatro classes de falha trabalhadas em aula. Ficam em
`tests/security/` e rodam sem banco (modo memória).

```bash
npm run test:security
```

| Arquivo | Falha | Testes |
|---------|-------|--------|
| `idor.test.js` | IDOR / controle de acesso | 11 |
| `criptografia-senhas.test.js` | Criptografia e senhas | 17 |
| `injecao.test.js` | Injeção de código | 26 |
| `bots.test.js` | Bots | 11 |

Cada teste confere o **estado final no repositório**, não só o status HTTP:
um 403 não adianta se a reserva da vítima foi cancelada mesmo assim.

## IDOR

Um usuário autenticado tenta mexer em recursos de outro trocando o
identificador na requisição.

- Cancelar a reserva de outro usuário pelo id → **403** e a reserva continua `ativa`.
- Mandar `usuarioId` da vítima no corpo (no cancelamento e na criação) → ignorado; vale sempre o dono do token.
- `GET /reservas/minhas` e `GET /auth/me?id=<outro>` → só devolvem dados do dono do token.
- Usuário comum criando sala (ação de admin) → **403**.
- Mass assignment: `papel: "admin"` no cadastro → conta criada como `user`.
- JWT forjado com outro segredo ou com o payload adulterado (`papel: admin`) → **401**.

**Defesa:** o id do usuário vem sempre do JWT (`req.usuario.id`), nunca do
cliente; a regra RN03 (`podeCancelar`) confere o dono; o controller só lê os
campos permitidos do corpo.

## Criptografia e senhas

- Senha guardada como hash **bcrypt** (formato `$2a$10$...`), nunca em texto puro.
- Custo do bcrypt **≥ 10 rounds**; mesma senha em duas contas → hashes diferentes (salt).
- Senha < 6 caracteres → `SENHA_FRACA`; senha > 72 bytes → `SENHA_MUITO_LONGA`
  (o bcrypt ignoraria o excesso em silêncio).
- Cadastro, login e `/me` nunca devolvem `senha`, `senhaHash` nem algo com cara de hash.
- O payload do JWT contém só `sub`, `email`, `papel`, `iat`, `exp`.
- Login errado: mesma resposta para e-mail inexistente e senha errada (sem enumeração de contas).
- JWT: assinado com **HS256**; tokens com `alg: none`, com outro algoritmo (HS512) ou expirados → **401**.
- Em produção o servidor **não sobe** sem `JWT_SECRET` ou com os segredos de
  exemplo publicados no repositório; segredo com menos de 32 caracteres gera aviso.

## Injeção de código

- **SQL injection:** `' OR '1'='1`, `' OR 1=1 --`, `'; DROP TABLE usuarios; --` etc.
  no e-mail, na senha e no id da URL → nunca autentica nem altera dados. Um
  nome com SQL é guardado literalmente, como texto (o Supabase usa consultas
  parametrizadas).
- **Injeção de operador (NoSQL/PostgREST):** `{"$ne": null}`, `{"$gt": ""}`,
  arrays no lugar de texto → **400**, nada é autenticado nem reservado.
- **XSS:** `<script>`, `<img onerror>`, `<svg onload>` em nome de usuário ou
  de sala → **400** (`NOME_INVALIDO`). Toda resposta é JSON com
  `X-Content-Type-Options: nosniff` e `Content-Security-Policy: default-src 'none'`.
- **Prototype pollution:** `__proto__: {papel: "admin"}` no corpo → usuário continua `user`.
- JSON malformado → **400** sem stack trace; corpo acima de 10 KB → **413**.

## Bots

- **Força bruta no login:** depois de 10 senhas erradas (5 no teste) o IP
  recebe **429** com `Retry-After`, inclusive se acertar a senha depois.
  Logins certos não gastam tentativas. O bloqueio expira ao fim da janela (15 min).
- **Credential stuffing:** o limite é por IP, então trocar de e-mail não adianta.
- **Cadastro em massa:** mais de 10 cadastros por hora (3 no teste) do mesmo IP → **429**.
- **Honeypot:** o formulário de cadastro tem um campo `website` invisível.
  Pessoas não o preenchem; se vier preenchido, o cadastro é recusado com uma
  mensagem genérica que não denuncia o motivo.
- `X-Forwarded-For` forjado não dribla o limite. Só atrás de proxy confiável
  (Vercel, ou `TRUST_PROXY=true`) o IP vem desse cabeçalho.

Limites configuráveis por `RATE_LIMIT_LOGIN_MAX` e `RATE_LIMIT_CADASTRO_MAX`.
Na Vercel o contador fica em memória por instância: é uma barreira contra
bots, não uma cota exata.

## Os testes pegam as falhas de verdade?

Rodando `tests/security` contra o código **antes** destas correções:
**21 falhas, 44 aprovados** (de 65). Falharam:

- Bots: os 8 testes de rate limit e o do honeypot (não existiam);
- Injeção: XSS no nome (4), cabeçalhos `nosniff`/CSP, corpo de 10 KB, `salaId` como objeto;
- Criptografia: senha > 72 bytes, JWT com outro algoritmo, segredo de exemplo/fraco em produção.

Os testes de IDOR já passavam: o código original confere o dono da reserva
e tira o id do usuário do token. Eles ficam como **teste de regressão**,
para que nenhuma mudança futura abra essa falha.

## CI/CD

- `.github/workflows/ci.yml` — job **Testes de segurança** em todo Pull
  Request para a `main`: roda `npm run test:security`, faz `npm audit`
  (vulnerabilidade alta/crítica reprova) e publica `security-report.json`.
- `.github/workflows/deploy.yml` — em todo push na `main`: lint + testes +
  auditoria e, se tudo passar, deploy de produção na Vercel. Precisa dos
  segredos `VERCEL_TOKEN`, `VERCEL_ORG_ID` e `VERCEL_PROJECT_ID`; a variável
  opcional `PRODUCTION_URL` liga o health check pós-deploy.
