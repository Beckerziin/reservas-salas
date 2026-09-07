'use strict';

/**
 * Envolve um handler async e encaminha qualquer erro para o next()
 * (evita try/catch repetido em todo controller).
 */
function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { asyncHandler };
