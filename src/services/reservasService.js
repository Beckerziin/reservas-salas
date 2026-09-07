'use strict';

const {
  ValidationError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} = require('../domain/errors');
const rules = require('../domain/reservaRules');

/**
 * Service de reservas. RF04-RF07, aplicando RN01-RN05.
 * @param {{ reservas: object, salas: object }} repos
 */
function criarReservasService({ reservas, salas }) {
  return {
    /**
     * RF04/RF05 - Criar reserva validando as regras de negocio.
     * @param {{usuarioId:string, salaId:string, inicio:string|Date, fim:string|Date}} dados
     */
    async criar({ usuarioId, salaId, inicio, fim }, agora = new Date()) {
      if (!salaId) {
        throw new ValidationError('Sala e obrigatoria', 'SALA_OBRIGATORIA');
      }
      let dtInicio;
      let dtFim;
      try {
        dtInicio = rules.paraData(inicio);
        dtFim = rules.paraData(fim);
      } catch {
        throw new ValidationError('Data/horario invalido', 'HORARIO_INVALIDO');
      }

      const sala = await salas.findById(salaId);
      if (!sala) {
        throw new NotFoundError('Sala nao encontrada');
      }
      if (sala.status !== 'disponivel') {
        throw new ConflictError('Sala indisponivel para reserva', 'SALA_INDISPONIVEL');
      }

      // RN05 - duracao positiva e no maximo 2h.
      if (!rules.duracaoValida(dtInicio, dtFim)) {
        throw new ValidationError(
          'Duracao invalida: minimo 1 minuto, maximo 2 horas',
          'DURACAO_INVALIDA'
        );
      }

      // RN01 - antecedencia minima de 30 minutos (tambem cobre "nao no passado").
      if (!rules.temAntecedenciaMinima(dtInicio, agora)) {
        throw new ValidationError(
          'A reserva exige ao menos 30 minutos de antecedencia',
          'ANTECEDENCIA_INSUFICIENTE'
        );
      }

      // RN02 - sem sobreposicao com reservas ativas da mesma sala.
      const ativas = await reservas.listAtivasBySala(salaId);
      if (rules.conflitaComReservas({ inicio: dtInicio, fim: dtFim }, ativas)) {
        throw new ConflictError('Horario ja reservado para esta sala', 'CONFLITO_HORARIO');
      }

      return reservas.create({
        usuarioId,
        salaId,
        inicio: dtInicio,
        fim: dtFim,
      });
    },

    // RF06 - Consultar minhas reservas.
    async listarMinhas(usuarioId) {
      return reservas.listByUsuario(usuarioId);
    },

    /**
     * RF07 - Cancelar reserva futura do proprio usuario (RN03, RN04).
     */
    async cancelar({ reservaId, usuarioId }, agora = new Date()) {
      const reserva = await reservas.findById(reservaId);
      if (!reserva) {
        throw new NotFoundError('Reserva nao encontrada');
      }

      const avaliacao = rules.podeCancelar(reserva, usuarioId, agora);
      if (!avaliacao.ok) {
        switch (avaliacao.motivo) {
          case 'NAO_E_DONO': // RN03
            throw new ForbiddenError('Apenas o autor pode cancelar a reserva', 'NAO_E_DONO');
          case 'RESERVA_PASSADA': // RN04
            throw new ValidationError(
              'Reservas passadas nao podem ser canceladas',
              'RESERVA_PASSADA'
            );
          case 'JA_CANCELADA':
            throw new ConflictError('Reserva ja esta cancelada', 'JA_CANCELADA');
          default:
            throw new ValidationError('Nao e possivel cancelar', 'CANCELAMENTO_INVALIDO');
        }
      }

      return reservas.updateStatus(reservaId, 'cancelada');
    },
  };
}

module.exports = { criarReservasService };
