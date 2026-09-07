'use strict';

const bcrypt = require('bcryptjs');
const { ValidationError, ConflictError, NotFoundError } = require('../domain/errors');
const { emailValido, textoPreenchido } = require('../domain/validacoes');
const { sanitizarUsuario } = require('./sanitizar');

const SENHA_MIN = 6;
const BCRYPT_ROUNDS = 10;

/**
 * Service de usuarios. RF01 (cadastro).
 * @param {{ usuarios: object }} repos
 */
function criarUsuariosService({ usuarios }) {
  return {
    /**
     * RF01 - Cadastrar usuario (nome, e-mail, senha).
     * Criterios (HU01): e-mail valido, sem duplicidade, confirmar cadastro.
     */
    async cadastrar({ nome, email, senha, papel = 'user' }) {
      if (!textoPreenchido(nome)) {
        throw new ValidationError('Nome e obrigatorio', 'NOME_OBRIGATORIO');
      }
      if (!emailValido(email)) {
        throw new ValidationError('E-mail invalido', 'EMAIL_INVALIDO');
      }
      if (typeof senha !== 'string' || senha.length < SENHA_MIN) {
        throw new ValidationError(
          `Senha deve ter ao menos ${SENHA_MIN} caracteres`,
          'SENHA_FRACA'
        );
      }

      const existente = await usuarios.findByEmail(email);
      if (existente) {
        throw new ConflictError('E-mail ja cadastrado', 'EMAIL_DUPLICADO');
      }

      // RNF03 - senha sempre com hash, nunca em texto puro.
      const senhaHash = await bcrypt.hash(senha, BCRYPT_ROUNDS);

      const criado = await usuarios.create({
        nome: nome.trim(),
        email,
        senhaHash,
        papel,
      });

      return sanitizarUsuario(criado);
    },

    async buscarPorId(id) {
      const usuario = await usuarios.findById(id);
      if (!usuario) throw new NotFoundError('Usuario nao encontrado');
      return sanitizarUsuario(usuario);
    },
  };
}

module.exports = { criarUsuariosService };
