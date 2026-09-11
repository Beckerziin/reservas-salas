const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

function getStoredSession() {
  try {
    return JSON.parse(localStorage.getItem('reservas.session')) || null
  } catch {
    return null
  }
}

function saveSession(session) {
  if (!session) {
    localStorage.removeItem('reservas.session')
    return
  }
  localStorage.setItem('reservas.session', JSON.stringify(session))
}

async function request(path, { token, ...options } = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await response.json() : null

  if (!response.ok) {
    const message = data?.erro?.mensagem || data?.message || 'Nao foi possivel concluir a acao.'
    const error = new Error(message)
    error.status = response.status
    error.code = data?.erro?.codigo
    throw error
  }

  return data
}

export const sessionStorage = {
  get: getStoredSession,
  save: saveSession,
}

export const api = {
  health: () => request('/health'),
  listarSalas: () => request('/salas'),
  login: (payload) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  cadastrarUsuario: (payload) =>
    request('/usuarios', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  minhasReservas: (token) => request('/reservas/minhas', { token }),
  criarReserva: (token, payload) =>
    request('/reservas', {
      method: 'POST',
      token,
      body: JSON.stringify(payload),
    }),
  cancelarReserva: (token, id) =>
    request(`/reservas/${id}/cancelar`, {
      method: 'PATCH',
      token,
    }),
  cadastrarSala: (token, payload) =>
    request('/salas', {
      method: 'POST',
      token,
      body: JSON.stringify(payload),
    }),
}
