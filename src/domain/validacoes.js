'use strict';

// Validacoes puras e reutilizaveis (tambem faceis de testar em unidade).

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function emailValido(email) {
  return typeof email === 'string' && EMAIL_REGEX.test(email.trim());
}

function textoPreenchido(valor) {
  return typeof valor === 'string' && valor.trim().length > 0;
}

// bcrypt so usa os primeiros 72 bytes da senha: o resto seria ignorado em
// silencio (duas senhas diferentes virariam a mesma). Recusamos acima disso.
const SENHA_MAX_BYTES = 72;

function senhaDentroDoLimite(senha) {
  return typeof senha === 'string' && Buffer.byteLength(senha, 'utf8') <= SENHA_MAX_BYTES;
}

// Defesa em profundidade contra XSS armazenado: nomes nao tem motivo para
// conter marcacao HTML. (O frontend React tambem escapa na renderizacao.)
const MARCACAO_HTML = /[<>]/;

function textoSemMarcacao(valor) {
  return typeof valor === 'string' && !MARCACAO_HTML.test(valor);
}

// Identificadores chegam como string. Objetos/arrays (ex.: {"$ne": null})
// sao tentativas de injecao de operador e sao recusados antes do banco.
function identificadorValido(valor) {
  return typeof valor === 'string' && valor.trim().length > 0 && valor.length <= 64;
}

const STATUS_SALA =['disponivel', 'indisponivel', 'manutencao'];
const STATUS_RESERVA = ['ativa', 'cancelada'];
const PAPEIS = ['user', 'admin'];

module.exports = {
  EMAIL_REGEX,
  emailValido,
  textoPreenchido,
  SENHA_MAX_BYTES,
  senhaDentroDoLimite,
  textoSemMarcacao,
  identificadorValido,
  STATUS_SALA,
  STATUS_RESERVA,
  PAPEIS,
};
