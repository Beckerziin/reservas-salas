'use strict';

// Responde 404 para qualquer rota nao mapeada.
function notFound(req, res) {
  res.status(404).json({
    erro: {
      codigo: 'ROTA_NAO_ENCONTRADA',
      mensagem: `Rota nao encontrada: ${req.method} ${req.originalUrl}`,
    },
  });
}

module.exports = { notFound };
