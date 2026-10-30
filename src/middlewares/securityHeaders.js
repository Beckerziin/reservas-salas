'use strict';

/**
 * Cabecalhos de seguranca basicos para uma API JSON (equivalente enxuto ao
 * helmet): o navegador nunca deve interpretar a resposta como HTML/script.
 */
function securityHeaders(_req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
  res.setHeader('Cache-Control', 'no-store');
  next();
}

module.exports = { securityHeaders };
