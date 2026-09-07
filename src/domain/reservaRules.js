'use strict';

/**
 * Regras de negocio de reserva, escritas como FUNCOES PURAS (sem HTTP, sem
 * banco, sem estado global). Isso as torna faceis de testar em UNIDADE.
 *
 * Mapeamento com o documento de requisitos:
 *   RN01 - antecedencia minima de 30 minutos
 *   RN02 - sem sobreposicao de horario na mesma sala (reservas ativas)
 *   RN03 - apenas o criador pode cancelar
 *   RN04 - reservas passadas nao podem ser canceladas/editadas
 *   RN05 - duracao maxima de 2 horas continuas
 */

const ANTECEDENCIA_MINIMA_MS = 30 * 60 * 1000; // 30 minutos (RN01)
const DURACAO_MAXIMA_MS = 2 * 60 * 60 * 1000; // 2 horas (RN05)

/**
 * Converte entrada em Date valido ou lanca faixa de erro simples.
 * Aceita Date ou string ISO.
 */
function paraData(valor) {
  const d = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(d.getTime())) {
    throw new RangeError(`Data/horario invalido: ${valor}`);
  }
  return d;
}

/**
 * RN01 - A reserva deve comecar com pelo menos 30 minutos de antecedencia
 * em relacao ao momento atual.
 * @returns {boolean}
 */
function temAntecedenciaMinima(inicio, agora = new Date()) {
  const i = paraData(inicio);
  const n = paraData(agora);
  return i.getTime() - n.getTime() >= ANTECEDENCIA_MINIMA_MS;
}

/**
 * RN05 - A duracao (fim - inicio) deve ser positiva e no maximo 2 horas.
 * @returns {boolean}
 */
function duracaoValida(inicio, fim) {
  const i = paraData(inicio);
  const f = paraData(fim);
  const duracao = f.getTime() - i.getTime();
  return duracao > 0 && duracao <= DURACAO_MAXIMA_MS;
}

/**
 * Verifica se dois intervalos [inicioA, fimA) e [inicioB, fimB) se sobrepoem.
 * Reservas que apenas se encostam (fim de uma == inicio da outra) NAO
 * conflitam.
 * @returns {boolean}
 */
function haSobreposicao(inicioA, fimA, inicioB, fimB) {
  const ia = paraData(inicioA).getTime();
  const fa = paraData(fimA).getTime();
  const ib = paraData(inicioB).getTime();
  const fb = paraData(fimB).getTime();
  return ia < fb && ib < fa;
}

/**
 * RN02 - Dada a nova reserva e a lista de reservas ATIVAS da mesma sala,
 * indica se ha conflito de horario com alguma delas.
 * @param {{inicio:Date|string, fim:Date|string}} nova
 * @param {Array<{inicio:Date|string, fim:Date|string, id?:string}>} reservasAtivasDaSala
 * @returns {boolean}
 */
function conflitaComReservas(nova, reservasAtivasDaSala = []) {
  return reservasAtivasDaSala.some((r) =>
    haSobreposicao(nova.inicio, nova.fim, r.inicio, r.fim)
  );
}

/**
 * RN03 + RN04 - Avalia se uma reserva pode ser cancelada por um usuario.
 * Retorna um objeto { ok, motivo } para o service decidir o erro adequado.
 * @param {{usuarioId:string, inicio:Date|string, status:string}} reserva
 * @param {string} usuarioId - quem esta tentando cancelar
 * @param {Date} [agora]
 * @returns {{ok:boolean, motivo?:'JA_CANCELADA'|'NAO_E_DONO'|'RESERVA_PASSADA'}}
 */
function podeCancelar(reserva, usuarioId, agora = new Date()) {
  if (reserva.status === 'cancelada') {
    return { ok: false, motivo: 'JA_CANCELADA' };
  }
  // RN03 - apenas o criador
  if (String(reserva.usuarioId) !== String(usuarioId)) {
    return { ok: false, motivo: 'NAO_E_DONO' };
  }
  // RN04 - nao pode cancelar reserva ja iniciada/passada
  if (paraData(reserva.inicio).getTime() <= paraData(agora).getTime()) {
    return { ok: false, motivo: 'RESERVA_PASSADA' };
  }
  return { ok: true };
}

module.exports = {
  ANTECEDENCIA_MINIMA_MS,
  DURACAO_MAXIMA_MS,
  paraData,
  temAntecedenciaMinima,
  duracaoValida,
  haSobreposicao,
  conflitaComReservas,
  podeCancelar,
};
