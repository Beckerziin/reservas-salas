import { useEffect, useMemo, useState } from 'react'
import { api, sessionStorage } from './api'
import './App.css'

const today = new Date().toISOString().slice(0, 10)
const initialReserva = { salaId: '', data: today, horaInicio: '14:00', horaFim: '15:00' }
const initialLogin = { email: '', senha: '' }
const initialCadastro = { nome: '', email: '', senha: '' }
const initialSala = { nome: '', capacidade: 4, status: 'disponivel' }

function Icon({ name }) {
  const paths = {
    calendar: 'M7 2v3M17 2v3M3 9h18M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z',
    door: 'M4 21h16M7 21V4a2 2 0 0 1 2-2h6v19M14 12h.01',
    user: 'M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z',
    plus: 'M12 5v14M5 12h14',
    x: 'M18 6 6 18M6 6l12 12',
    refresh: 'M21 12a9 9 0 0 1-15.6 6.1L3 16M3 21v-5h5M3 12A9 9 0 0 1 18.6 5.9L21 8M21 3v5h-5',
    logout: 'M10 17l5-5-5-5M15 12H3M21 3v18h-7',
    check: 'M20 6 9 17l-5-5',
    building: 'M4 21V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16M9 21v-4h6v4M8 7h.01M12 7h.01M16 7h.01M8 11h.01M12 11h.01M16 11h.01',
    users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
    clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 6v6l4 2',
    grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
    list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
    settings: 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.12 2.12-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.04 1.56v.09h-3v-.09A1.7 1.7 0 0 0 10.66 18.7a1.7 1.7 0 0 0-1.88.34l-.06.06-2.12-2.12.06-.06A1.7 1.7 0 0 0 7 15.04a1.7 1.7 0 0 0-1.56-1.04h-.09v-3h.09A1.7 1.7 0 0 0 7 9.96a1.7 1.7 0 0 0-.34-1.88l-.06-.06L8.72 5.9l.06.06A1.7 1.7 0 0 0 10.66 6.3a1.7 1.7 0 0 0 1.04-1.56v-.09h3v.09A1.7 1.7 0 0 0 15.74 6.3a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.12 2.12-.06.06A1.7 1.7 0 0 0 19.4 9.96a1.7 1.7 0 0 0 1.56 1.04h.09v3h-.09A1.7 1.7 0 0 0 19.4 15Z',
    arrowRight: 'M5 12h14M13 6l6 6-6 6',
    arrowLeft: 'M19 12H5M11 18l-6-6 6-6',
  }

  return <svg aria-hidden="true" className="icon" fill="none" viewBox="0 0 24 24"><path d={paths[name]} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
}

function Brand() {
  return <div className="brand"><span className="brand-mark"><img alt="FAG" src="/icone-fag.ico" /></span><span>Reserva<span>FAG</span></span></div>
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

function App() {
  const [session, setSession] = useState(() => sessionStorage.get())
  const [authMode, setAuthMode] = useState('login')
  const [activePage, setActivePage] = useState('inicio')
  const [loginForm, setLoginForm] = useState(initialLogin)
  const [cadastroForm, setCadastroForm] = useState(initialCadastro)
  const [reservaForm, setReservaForm] = useState(initialReserva)
  const [salaForm, setSalaForm] = useState(initialSala)
  const [health, setHealth] = useState(null)
  const [salas, setSalas] = useState([])
  const [reservas, setReservas] = useState([])
  const [notice, setNotice] = useState(null)
  const [loading, setLoading] = useState(false)

  const token = session?.token
  const usuario = session?.usuario
  const isAdmin = usuario?.papel === 'admin'
  const salaById = useMemo(() => new Map(salas.map((sala) => [sala.id, sala])), [salas])
  const reservasOrdenadas = useMemo(() => [...reservas].sort((a, b) => new Date(a.inicio) - new Date(b.inicio)), [reservas])
  const salaSelecionada = salaById.get(reservaForm.salaId)
  const salasDisponiveis = salas.filter((sala) => sala.status === 'disponivel').length

  function showNotice(type, message) { setNotice({ type, message }) }

  async function loadPublicData() {
    const [healthData, salasData] = await Promise.all([api.health(), api.listarSalas()])
    setHealth(healthData)
    setSalas(salasData.salas || [])
    setReservaForm((current) => ({ ...current, salaId: current.salaId || salasData.salas?.[0]?.id || '' }))
  }

  async function loadReservas(currentToken = token) {
    if (!currentToken) return setReservas([])
    const data = await api.minhasReservas(currentToken)
    setReservas(data.reservas || [])
  }

  useEffect(() => { loadPublicData().catch((error) => showNotice('error', error.message)) }, [])
  useEffect(() => {
    loadReservas().catch(() => {
      sessionStorage.save(null)
      setSession(null)
      showNotice('error', 'Sua sessão expirou. Entre novamente para continuar.')
    })
  }, [token])

  async function runAction(action, successMessage) {
    setLoading(true)
    setNotice(null)
    try {
      await action()
      if (successMessage) showNotice('success', successMessage)
    } catch (error) { showNotice('error', error.message) } finally { setLoading(false) }
  }

  function handleSession(data) {
    const nextSession = { token: data.token, usuario: data.usuario }
    sessionStorage.save(nextSession)
    setSession(nextSession)
    setActivePage('inicio')
  }

  async function handleLogin(event) {
    event.preventDefault()
    await runAction(async () => { handleSession(await api.login(loginForm)) }, 'Bem-vindo de volta.')
  }

  async function handleCadastro(event) {
    event.preventDefault()
    await runAction(async () => {
      await api.cadastrarUsuario(cadastroForm)
      handleSession(await api.login({ email: cadastroForm.email, senha: cadastroForm.senha }))
      setCadastroForm(initialCadastro)
    }, 'Conta criada. Agora você já pode reservar uma sala.')
  }

  async function handleReserva(event) {
    event.preventDefault()
    await runAction(async () => {
      await api.criarReserva(token, reservaForm)
      await loadReservas()
      setActivePage('reservas')
    }, 'Reserva confirmada com sucesso.')
  }

  async function handleCancelar(id) {
    await runAction(async () => { await api.cancelarReserva(token, id); await loadReservas() }, 'Reserva cancelada.')
  }

  async function handleSala(event) {
    event.preventDefault()
    await runAction(async () => {
      await api.cadastrarSala(token, { ...salaForm, capacidade: Number(salaForm.capacidade) })
      setSalaForm(initialSala)
      await loadPublicData()
    }, 'Sala cadastrada.')
  }

  function escolherSala(sala) {
    if (sala.status !== 'disponivel') return
    setReservaForm((current) => ({ ...current, salaId: sala.id }))
    setActivePage('reserva')
  }

  function handleLogout() {
    sessionStorage.save(null)
    setSession(null)
    setReservas([])
    setActivePage('inicio')
  }

  if (!usuario) {
    return <main className="auth-page">
      <header className="auth-topbar"><Brand /><span className={`connection ${health ? 'online' : ''}`}>{health ? 'Sistema online' : 'Conectando...'}</span></header>
      {notice && <div className={`notice auth-notice ${notice.type}`}>{notice.message}</div>}
      <section className="auth-layout">
        <div className="auth-presentation">
          <p className="overline">Sistema de reservas</p>
          <h1>Estude no espaço certo.</h1>
          <p>Consulte as salas disponíveis, organize seu horário e mantenha sua agenda em um só lugar.</p>
          <div className="auth-steps"><span>01</span><div><strong>Escolha a sala</strong><p>Veja os espaços disponíveis para estudar.</p></div><span>02</span><div><strong>Defina o horário</strong><p>Reserve em poucos passos, sem conflito.</p></div></div>
        </div>
        <section className="auth-card" aria-label="Acesso à plataforma">
          <p className="overline">{authMode === 'login' ? 'Acesse sua conta' : 'Crie sua conta'}</p>
          <h2>{authMode === 'login' ? 'Olá, de volta.' : 'Comece por aqui.'}</h2>
          <div className="auth-switch" aria-label="Alternar acesso">
            <button className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')} type="button">Entrar</button>
            <button className={authMode === 'cadastro' ? 'active' : ''} onClick={() => setAuthMode('cadastro')} type="button">Criar conta</button>
          </div>
          {authMode === 'login' ? <form onSubmit={handleLogin}>
            <label>E-mail<input autoComplete="email" onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })} placeholder="voce@fag.edu.br" required type="email" value={loginForm.email} /></label>
            <label>Senha<input autoComplete="current-password" onChange={(event) => setLoginForm({ ...loginForm, senha: event.target.value })} placeholder="Sua senha" required type="password" value={loginForm.senha} /></label>
            <button className="primary-button" disabled={loading} type="submit">Entrar <Icon name="arrowRight" /></button>
          </form> : <form onSubmit={handleCadastro}>
            <label>Nome completo<input autoComplete="name" onChange={(event) => setCadastroForm({ ...cadastroForm, nome: event.target.value })} required value={cadastroForm.nome} /></label>
            <label>E-mail<input autoComplete="email" onChange={(event) => setCadastroForm({ ...cadastroForm, email: event.target.value })} placeholder="voce@fag.edu.br" required type="email" value={cadastroForm.email} /></label>
            <label>Senha<input autoComplete="new-password" minLength="6" onChange={(event) => setCadastroForm({ ...cadastroForm, senha: event.target.value })} placeholder="Mínimo de 6 caracteres" required type="password" value={cadastroForm.senha} /></label>
            <button className="primary-button" disabled={loading} type="submit">Criar conta <Icon name="arrowRight" /></button>
          </form>}
        </section>
      </section>
    </main>
  }

  const navigation = [
    ['inicio', 'Visão geral', 'grid'], ['reserva', 'Reservar sala', 'calendar'], ['reservas', 'Minhas reservas', 'list'],
    ...(isAdmin ? [['salas', 'Gerenciar salas', 'settings']] : []),
  ]
  const pageTitles = { inicio: ['Visão geral', 'Encontre um ambiente e comece a organizar sua próxima sessão de estudos.'], reserva: ['Nova reserva', 'Escolha o horário que funciona melhor para você.'], reservas: ['Minhas reservas', 'Acompanhe e gerencie os seus horários reservados.'], salas: ['Gerenciar salas', 'Cadastre e mantenha os espaços de estudo atualizados.'] }

  return <main className="platform">
    <aside className="side-nav">
      <Brand />
      <nav aria-label="Navegação principal">{navigation.map(([page, label, icon]) => <button className={activePage === page ? 'active' : ''} key={page} onClick={() => setActivePage(page)} type="button"><Icon name={icon} />{label}</button>)}</nav>
      <div className="nav-user"><span>{usuario.nome?.slice(0, 1).toUpperCase()}</span><div><strong>{usuario.nome}</strong><small>{isAdmin ? 'Administrador' : 'Estudante'}</small></div><button aria-label="Sair" onClick={handleLogout} title="Sair" type="button"><Icon name="logout" /></button></div>
    </aside>
    <section className="main-view">
      <header className="app-header"><div><p className="overline">ReservaFAG / {health ? 'Online' : 'Verificando conexão'}</p><h1>{pageTitles[activePage][0]}</h1><p>{pageTitles[activePage][1]}</p></div>{activePage === 'inicio' && <button className="primary-button header-action" onClick={() => setActivePage('reserva')} type="button"><Icon name="plus" /> Nova reserva</button>}</header>
      {notice && <div className={`notice ${notice.type}`}>{notice.message}</div>}

      {activePage === 'inicio' && <section className="page-content">
        <div className="summary-strip"><div><span>Salas disponíveis</span><strong>{salasDisponiveis}</strong></div><div><span>Salas cadastradas</span><strong>{salas.length}</strong></div><div><span>Reservas ativas</span><strong>{reservas.filter((reserva) => reserva.status !== 'cancelada').length}</strong></div></div>
        <div className="section-bar"><div><p className="overline">Disponibilidade agora</p><h2>Escolha uma sala</h2></div><button className="text-button" onClick={() => runAction(loadPublicData)} type="button"><Icon name="refresh" /> Atualizar</button></div>
        <div className="rooms-list">{salas.map((sala) => <article className="room-row" key={sala.id}><span className="room-number"><Icon name="door" /></span><div><h3>{sala.nome}</h3><p><Icon name="users" /> Capacidade para {sala.capacidade} pessoas</p></div><span className={`status ${sala.status}`}>{sala.status}</span><button className="row-action" disabled={sala.status !== 'disponivel'} onClick={() => escolherSala(sala)} type="button">Selecionar <Icon name="arrowRight" /></button></article>)}</div>
      </section>}

      {activePage === 'reserva' && <section className="page-content booking-page">
        <button className="back-link" onClick={() => setActivePage('inicio')} type="button"><Icon name="arrowLeft" /> Voltar para as salas</button>
        <div className="booking-grid"><aside className="booking-aside"><p className="overline">Sua escolha</p><h2>{salaSelecionada?.nome || 'Escolha uma sala'}</h2><p>{salaSelecionada ? `Capacidade para ${salaSelecionada.capacidade} pessoas.` : 'Selecione uma sala disponível para continuar.'}</p><div className="booking-note"><Icon name="clock" /> Você poderá conferir a reserva na sua agenda assim que confirmar.</div></aside><form className="reservation-form" onSubmit={handleReserva}><label>Sala<select onChange={(event) => setReservaForm({ ...reservaForm, salaId: event.target.value })} required value={reservaForm.salaId}>{salas.filter((sala) => sala.status === 'disponivel').map((sala) => <option key={sala.id} value={sala.id}>{sala.nome} — {sala.capacidade} lugares</option>)}</select></label><div className="form-columns"><label>Data<input min={today} onChange={(event) => setReservaForm({ ...reservaForm, data: event.target.value })} required type="date" value={reservaForm.data} /></label><label>Início<input onChange={(event) => setReservaForm({ ...reservaForm, horaInicio: event.target.value })} required type="time" value={reservaForm.horaInicio} /></label><label>Fim<input onChange={(event) => setReservaForm({ ...reservaForm, horaFim: event.target.value })} required type="time" value={reservaForm.horaFim} /></label></div><button className="primary-button" disabled={!reservaForm.salaId || loading} type="submit">Confirmar reserva <Icon name="check" /></button></form></div>
      </section>}

      {activePage === 'reservas' && <section className="page-content"><div className="section-bar"><div><p className="overline">Sua agenda</p><h2>Próximos horários</h2></div><button className="text-button" onClick={() => runAction(loadReservas)} type="button"><Icon name="refresh" /> Atualizar</button></div>{reservasOrdenadas.length === 0 ? <div className="empty-page"><Icon name="calendar" /><h2>Nenhuma reserva por aqui.</h2><p>Quando encontrar uma sala ideal, sua reserva aparecerá nesta lista.</p><button className="primary-button" onClick={() => setActivePage('inicio')} type="button">Ver salas</button></div> : <div className="reservations-table">{reservasOrdenadas.map((reserva) => { const sala = salaById.get(reserva.salaId); const cancelada = reserva.status === 'cancelada'; return <article className="reservation-item" key={reserva.id}><span className="date-mark"><strong>{new Date(reserva.inicio).getDate()}</strong><small>{new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(new Date(reserva.inicio)).replace('.', '')}</small></span><div><h3>{sala?.nome || 'Sala removida'}</h3><p>{formatDateTime(reserva.inicio)} até {formatDateTime(reserva.fim)}</p></div><span className={`status ${reserva.status}`}>{reserva.status}</span><button className="cancel-button" disabled={cancelada || loading} onClick={() => handleCancelar(reserva.id)} type="button">Cancelar</button></article> })}</div>}</section>}

      {activePage === 'salas' && <section className="page-content"><div className="admin-layout"><div><p className="overline">Administração</p><h2>Adicionar uma nova sala</h2><p>O espaço ficará disponível para reservas assim que for cadastrado como disponível.</p></div><form className="reservation-form" onSubmit={handleSala}><label>Nome da sala<input onChange={(event) => setSalaForm({ ...salaForm, nome: event.target.value })} required value={salaForm.nome} /></label><div className="form-columns two"><label>Capacidade<input min="1" onChange={(event) => setSalaForm({ ...salaForm, capacidade: event.target.value })} required type="number" value={salaForm.capacidade} /></label><label>Status<select onChange={(event) => setSalaForm({ ...salaForm, status: event.target.value })} value={salaForm.status}><option value="disponivel">Disponível</option><option value="indisponivel">Indisponível</option></select></label></div><button className="primary-button" disabled={loading} type="submit">Cadastrar sala <Icon name="plus" /></button></form></div></section>}
    </section>
  </main>
}

export default App
