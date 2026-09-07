'use strict';

const bcrypt = require('bcryptjs');
const { ValidationError, UnauthorizedError } = require('../domain/errors');
const { emailValido } = require('../domain/validacoes');
const { sanitizarUsuario } = require('./sanitizar');

/**
 * Service de autenticacao. RF02 (login) + emissao de JWT.
 * @param {{ usuarios: object }} repos
 * @param {{ tokenService: object }} deps
 */
function criarAuthService({ usuarios }, { tokenService }) {
  return {
    /**
     * RF02 - Autenticar com e-mail e senha.
     * Criterios (HU02): validar credenciais, bloquear invalidas, manter sessao
     * (via token JWT devolvido ao cliente).
     * @returns {{ token:string, usuario:object }}
     */
    async login({ email, senha }) {
      if (!emailValido(email) || typeof senha !== 'string' || senha.length === 0) {
        throw new ValidationError('Informe e-mail e senha', 'CREDENCIAIS_INCOMPLETAS');
      }

      const usuario = await usuarios.findByEmail(email);
      // Mesma mensagem para usuario inexistente ou senha errada (evita
      // enumeracao de e-mails).
      const senhaOk = usuario ? await bcrypt.compare(senha, usuario.senhaHash) : false;
      if (!usuario || !senhaOk) {
        throw new UnauthorizedError('Credenciais invalidas', 'CREDENCIAIS_INVALIDAS');
      }

      const token = tokenService.assinar({
        sub: usuario.id,
        email: usuario.email,
        papel: usuario.papel,
      });

      return { token, usuario: sanitizarUsuario(usuario) };
    },
  };
}

module.exports = { criarAuthService };
