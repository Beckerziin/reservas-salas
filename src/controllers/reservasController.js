'use strict';

const { asyncHandler } = require('../middlewares/asyncHandler');

// Monta um horario ISO a partir de {data, hora} quando o cliente nao envia
// inicio/fim ja completos. Ex.: data="2026-09-10", hora="14:00".
function comporHorario(data, hora) {
  if (!data || !hora) return undefined;
  return `${data}T${hora}`;
}

function criarReservasController({ reservasService }) {
  return {
    // RF04 - POST /api/reservas (autenticado)
    criar: asyncHandler(async (req, res) => {
      const body = req.body || {};
      const salaId = body.salaId;
      const inicio = body.inicio || comporHorario(body.data, body.horaInicio);
      const fim = body.fim || comporHorario(body.data, body.horaFim);

      const reserva = await reservasService.criar({
        usuarioId: req.usuario.id,
        salaId,
        inicio,
        fim,
      });
      res.status(201).json({ reserva, mensagem: 'Reserva confirmada' });
    }),

    // RF06 - GET /api/reservas/minhas (autenticado)
    listarMinhas: asyncHandler(async (req, res) => {
      const reservas = await reservasService.listarMinhas(req.usuario.id);
      res.status(200).json({ reservas });
    }),

    // RF07 - PATCH /api/reservas/:id/cancelar (autenticado)
    cancelar: asyncHandler(async (req, res) => {
      const reserva = await reservasService.cancelar({
        reservaId: req.params.id,
        usuarioId: req.usuario.id,
      });
      res.status(200).json({ reserva, mensagem: 'Reserva cancelada' });
    }),
  };
}

module.exports = { criarReservasController };
