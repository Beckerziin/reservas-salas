'use strict';

/**
 * Erros de dominio com codigo HTTP associado.
 * O middleware errorHandler traduz estes erros em respostas JSON.
 */
class AppError extends Error {
  constructor(message, statusCode = 500, codigo = 'ERRO_INTERNO') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.codigo = codigo;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

// 400 - dados invalidos enviados pelo cliente
class ValidationError extends AppError {
  constructor(message, codigo = 'VALIDACAO') {
    super(message, 400, codigo);
  }
}

// 401 - nao autenticado / credenciais invalidas
class UnauthorizedError extends AppError {
  constructor(message = 'Nao autenticado', codigo = 'NAO_AUTENTICADO') {
    super(message, 401, codigo);
  }
}

// 403 - autenticado, mas sem permissao
class ForbiddenError extends AppError {
  constructor(message = 'Acesso negado', codigo = 'ACESSO_NEGADO') {
    super(message, 403, codigo);
  }
}

// 404 - recurso nao encontrado
class NotFoundError extends AppError {
  constructor(message = 'Recurso nao encontrado', codigo = 'NAO_ENCONTRADO') {
    super(message, 404, codigo);
  }
}

// 409 - conflito (ex.: e-mail duplicado, sobreposicao de horario - RN02)
class ConflictError extends AppError {
  constructor(message, codigo = 'CONFLITO') {
    super(message, 409, codigo);
  }
}

module.exports = {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
};
