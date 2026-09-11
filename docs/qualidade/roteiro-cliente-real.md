# Roteiro do teste com cliente real

Objetivo: observar uma pessoa de verdade usando o sistema, sem ajuda, para
achar problemas de usabilidade que nenhum teste automatizado enxerga (E2E
prova que o fluxo *funciona*; isso aqui prova que alguém *consegue usar* sem
explicação).

## Perfil da pessoa

- Aluno(a) da FAG que usaria salas de estudo de verdade, **fora do grupo do
  projeto** (não pode já conhecer a tela).
- Não precisa ser familiarizado com tecnologia — o contrário, inclusive: se a
  pessoa for de uma área bem distante de TI, o teste é mais honesto.
- Agendar ~15 minutos, presencial ou por chamada com tela compartilhada.

## A tarefa (entregue em uma frase, sem instrução de clique)

> "Reserve uma sala de estudo para amanhã à tarde e depois cancele."

Não completar com passos ("clique aqui", "depois vá em..."). Se a pessoa
perguntar como fazer, responder algo neutro como "faça do jeito que parecer
certo pra você" — a hesitação *é* o dado.

## Antes de começar

- Ambiente já de pé: `npm run dev` (backend, `SEED_DEV=true`) + `npm run dev`
  em `frontend/` — ver [`README.md`](../../README.md#como-rodar-os-testes).
- Gravar tela **e** áudio (a fala da pessoa pensando em voz alta vale tanto
  quanto o clique). Avisar e pedir consentimento antes de gravar.
- **Não intervir** durante a tarefa — nem para corrigir, nem para confirmar
  que ela está no caminho certo. Deixar o silêncio acontecer.
- Ter um usuário/sala já disponíveis (seed padrão) — não deixar a pessoa
  esbarrar num obstáculo que não é o que se quer observar (ex.: banco vazio).

## Checklist de observação (preencher durante a sessão)

| Momento | O que observar | Anotação |
|---|---|---|
| Chegada na tela inicial | Entendeu que precisa criar conta/entrar? Tentou reservar direto sem login? | |
| Cadastro/login | Hesitou em algum campo? Mensagem de erro (se houver) fez sentido pra ela? | |
| Escolher sala | Como decidiu qual sala escolher? Usou a capacidade mostrada? | |
| Escolher data/horário | Entendeu os campos de data/hora? Tentou escolher horário passado ou muito em cima da hora? | |
| Confirmar reserva | Viu a mensagem de sucesso? Sabia que tinha dado certo sem perguntar? | |
| Encontrar a reserva feita | Achou sozinha a lista "Minhas reservas" ou ficou perdida? | |
| Cancelar | Achou o botão de cancelar? Teve dúvida/medo de clicar (ex.: "isso é reversível?")? | |
| Geral | Quanto tempo levou do início ao fim? Quantos cliques "errados" (que não levaram a nada)? O que ela perguntou em voz alta? | |

## Impressão final da pessoa (2–3 frases, nas palavras dela)

> _(preencher durante/após a sessão — não parafrasear, registrar como ela
> disse)_

## Conclusões

- **O que será corrigido antes da apresentação:** _(listar achados que viram
  ajuste rápido — ex.: texto de botão confuso, campo sem label claro)_
- **O que fica registrado como melhoria futura** (fora do escopo do MVP):
  _(ex.: confirmação antes de cancelar, indicação visual de "reserva
  amanhã" vs "hoje")_
- **O que NÃO foi problema** (vale registrar também — evita reabrir debate
  sobre algo que já foi validado): _(preencher)_
