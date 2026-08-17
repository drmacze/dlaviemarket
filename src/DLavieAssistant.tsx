import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'

type Profile = { id: string; username: string; email: string; avatarId?: string }
type Order = { id: string; serviceName?: string; providerName?: string; price?: number; createdAt?: number; expiresAt?: number; status?: string }
type Role = 'assistant' | 'user' | 'system'
type Message = { id: string; role: Role; content: string; createdAt: number; kind?: string; typing?: boolean }
type Stage = 'ready' | 'quick' | 'intake' | 'chat' | 'ended'
type Phase = 'idle' | 'wave' | 'understanding' | 'searching' | 'thinking' | 'typing'

type ApiResponse = {
  ok?: boolean
  error?: string
  message?: string
  session_id?: string
  session_ref?: string
  started_at?: string
  wallet_ref?: string
  cooldown_ms?: number
  context_found?: boolean
}

const API_BASE = 'https://ydaeukhqwishlrjyfktk.supabase.co/functions/v1'
const PROFILE_KEY = 'dlavie-account-profile-v1'
const SESSION_KEY = 'dlavie-account-session-v1'
const CONSENT_KEY = 'dlavie-consent-v1'
const CONSENT_VERSION = '2026-08-18-v1'
const TOKEN_KEY = 'dlavie-wallet-token-v1'
const ORDER_KEY = 'dlavie-orders-v1'
const AUTH_EVENT = 'dlavie:auth-state'
const IDLE_WARNING_MS = 5 * 60 * 1000
const IDLE_CLOSE_MS = 6 * 60 * 1000
const CLIENT_COOLDOWN_MS = 3400

function readProfile(): Profile | null {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null') as Profile | null } catch { return null }
}
function hasConsent(profile: Profile | null) {
  if (!profile) return false
  try {
    const consent = JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null') as { version?: string; userId?: string } | null
    return consent?.version === CONSENT_VERSION && consent?.userId === profile.id
  } catch { return false }
}
function isSignedIn() { return sessionStorage.getItem(SESSION_KEY) === 'active' }
function language() { return localStorage.getItem('dlavie-language') === 'en' ? 'en' : 'id' }
function createWalletToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  let binary = ''
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return `dlv_${btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')}`
}
function getWalletToken() {
  let token = localStorage.getItem(TOKEN_KEY)
  if (!token) { token = createWalletToken(); localStorage.setItem(TOKEN_KEY, token) }
  return token
}
function readOrders(): Order[] {
  try { return JSON.parse(localStorage.getItem(ORDER_KEY) || '[]') as Order[] } catch { return [] }
}
function makeId(prefix = 'msg') { return `${prefix}-${crypto.randomUUID()}` }
function formatDuration(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  if (hours > 0) return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}
function clientContext() {
  return {
    route: window.location.hash || '#/home',
    language: language(),
    local_orders: readOrders().slice(-8).map((order) => ({
      id: order.id, service: order.serviceName || null, provider: order.providerName || null,
      price: order.price || null, status: order.status || null, created_at: order.createdAt || null, expires_at: order.expiresAt || null,
      source: 'browser_demo',
    })),
  }
}
function profanity(text: string) {
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ')
  return ['anjing','bangsat','bajingan','kontol','memek','ngentot','goblok','tolol','jancok','jancuk','fuck','fucking','shit','bitch','asshole','motherfucker']
    .some((word) => new RegExp(`(^|\\s)${word}(\\s|$)`, 'i').test(normalized))
}

function AssistantAvatar({ phase = 'idle', small = false }: { phase?: Phase; small?: boolean }) {
  return (
    <span className={`dlv-ai-avatar ${small ? 'is-small' : ''}`} data-phase={phase} aria-hidden="true">
      <svg viewBox="0 0 72 72" fill="none">
        <circle className="dlv-ai-halo" cx="36" cy="36" r="31" />
        <path className="dlv-ai-ear left" d="M14 31h-3.2A4.8 4.8 0 0 0 6 35.8v3.4a4.8 4.8 0 0 0 4.8 4.8H14" />
        <path className="dlv-ai-ear right" d="M58 31h3.2a4.8 4.8 0 0 1 4.8 4.8v3.4a4.8 4.8 0 0 1-4.8 4.8H58" />
        <rect className="dlv-ai-head" x="14" y="16" width="44" height="42" rx="16" />
        <path className="dlv-ai-screen" d="M22 31c0-5 4-9 9-9h10c5 0 9 4 9 9v9c0 6.6-5.4 12-12 12h-4c-6.6 0-12-5.4-12-12v-9Z" />
        <g className="dlv-ai-eyes"><circle cx="30" cy="35" r="2.5" /><circle cx="42" cy="35" r="2.5" /></g>
        <path className="dlv-ai-mouth" d="M31 43c2.8 2 7.2 2 10 0" />
        <path className="dlv-ai-antenna" d="M36 16V10" /><circle className="dlv-ai-antenna-dot" cx="36" cy="8" r="3" />
        <g className="dlv-ai-arm"><path d="M57 46c6 1 8.5 4.3 8 10" /><path d="m63.7 49 3.2-2M64.7 52.2l4-.2M64.8 55.2l3.6 1.5" /></g>
      </svg>
    </span>
  )
}

export default function DLavieAssistant() {
  const [open, setOpen] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(() => readProfile())
  const [authorized, setAuthorized] = useState(() => isSignedIn() && hasConsent(readProfile()))
  const [stage, setStage] = useState<Stage>('ready')
  const [phase, setPhase] = useState<Phase>('wave')
  const [messages, setMessages] = useState<Message[]>([])
  const [sessionId, setSessionId] = useState('')
  const [sessionRef, setSessionRef] = useState('')
  const [walletRef, setWalletRef] = useState('')
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [endedAt, setEndedAt] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now())
  const [busy, setBusy] = useState(false)
  const [unread, setUnread] = useState(0)
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState('payment_wallet')
  const [referenceId, setReferenceId] = useState('')
  const [detail, setDetail] = useState('')
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  const [cooldownUntil, setCooldownUntil] = useState(0)
  const [cooldownLeft, setCooldownLeft] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastInteractionRef = useRef(Date.now())
  const warnedAtRef = useRef<number | null>(null)
  const idleBusyRef = useRef(false)
  const typingAbortRef = useRef(0)

  const lang = language()
  const copy = useMemo(() => lang === 'en' ? {
    title: 'DLavie Assistant', subtitle: 'AI support · account-aware', online: 'Available', guest: 'Sign in to use live AI support.', guestBody: 'Public documentation and policies remain available without an account. Live support can access only the signed-in user context.', signIn: 'Sign in / create account',
    readyEyebrow: 'PRIVATE SUPPORT SESSION', readyTitle: 'Need help with DLavie?', readyBody: 'Start a session to ask about payments, wallet, order references, OTP sessions, policies, or a technical issue.', start: 'Start session', session: 'Session', elapsed: 'Elapsed', end: 'End',
    help: 'Help me', transaction: 'Check a transaction', policy: 'Ask about policy', quickHint: 'Choose an option to continue. The message field will unlock after a short support intake.',
    intakeTitle: 'A little context first.', intakeBody: 'This helps Assistant inspect the right information before opening free chat.', subject: 'Subject', category: 'Category', reference: 'Reference ID (optional)', detail: 'Short summary (optional)', sendIntake: 'Send context',
    categories: { payment_wallet: 'Payment & wallet', order_otp: 'Order & OTP', account: 'Account', technical: 'Technical issue', policy: 'Policy & refund', other: 'Other' },
    placeholder: 'Write a message to DLavie Assistant…', send: 'Send', cooldown: 'Please wait', filtered: 'Change the wording before sending. This chat blocks inappropriate language.', closed: 'Session closed', newSession: 'Start new session', sessionReceipt: 'Session receipt',
  } : {
    title: 'DLavie Assistant', subtitle: 'AI support · memahami akunmu', online: 'Tersedia', guest: 'Masuk untuk menggunakan live AI support.', guestBody: 'Dokumentasi dan kebijakan tetap dapat dibaca tanpa akun. Live support hanya boleh membaca konteks user yang sedang login.', signIn: 'Masuk / buat akun',
    readyEyebrow: 'PRIVATE SUPPORT SESSION', readyTitle: 'Ada yang bisa dibantu?', readyBody: 'Mulai sesi untuk bertanya tentang pembayaran, wallet, reference ID, order/OTP, kebijakan, atau kendala teknis.', start: 'Start session', session: 'Sesi', elapsed: 'Durasi', end: 'Akhiri',
    help: 'Bantu saya', transaction: 'Cek transaksi', policy: 'Tanya kebijakan', quickHint: 'Pilih salah satu untuk melanjutkan. Kolom chat akan terbuka setelah form konteks singkat.',
    intakeTitle: 'Berikan sedikit konteks.', intakeBody: 'Ini membantu Assistant memeriksa informasi yang tepat sebelum free chat dibuka.', subject: 'Subject', category: 'Kategori', reference: 'Reference ID (opsional)', detail: 'Ringkasan singkat (opsional)', sendIntake: 'Kirim konteks',
    categories: { payment_wallet: 'Pembayaran & wallet', order_otp: 'Order & OTP', account: 'Akun', technical: 'Kendala teknis', policy: 'Kebijakan & refund', other: 'Lainnya' },
    placeholder: 'Tulis pesan ke DLavie Assistant…', send: 'Kirim', cooldown: 'Tunggu sebentar', filtered: 'Ubah kalimat sebelum dikirim. Percakapan ini memblokir kata yang tidak pantas.', closed: 'Sesi ditutup', newSession: 'Mulai sesi baru', sessionReceipt: 'Tanda terima sesi',
  }, [lang])

  const syncAuth = useCallback(() => {
    const next = readProfile()
    setProfile(next)
    setAuthorized(isSignedIn() && hasConsent(next))
  }, [])

  useEffect(() => {
    window.addEventListener(AUTH_EVENT, syncAuth)
    window.addEventListener('storage', syncAuth)
    window.addEventListener('focus', syncAuth)
    return () => { window.removeEventListener(AUTH_EVENT, syncAuth); window.removeEventListener('storage', syncAuth); window.removeEventListener('focus', syncAuth) }
  }, [syncAuth])

  useEffect(() => {
    const timer = window.setInterval(() => {
      const tick = Date.now()
      setNow(tick)
      const left = Math.max(0, cooldownUntil - tick)
      setCooldownLeft(left)
    }, 250)
    return () => window.clearInterval(timer)
  }, [cooldownUntil])

  useEffect(() => {
    if (!open) return
    requestAnimationFrame(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight })
  }, [messages, open, stage, busy])

  const touch = useCallback(() => {
    lastInteractionRef.current = Date.now()
    warnedAtRef.current = null
  }, [])

  const api = useCallback(async (action: string, extra: Record<string, string> = {}) => {
    if (!profile) throw new Error('profile_required')
    const body = new URLSearchParams({
      action,
      wallet_token: getWalletToken(),
      user_id: profile.id,
      username: profile.username,
      lang,
      ...extra,
    })
    const response = await fetch(`${API_BASE}/dlavie-assistant`, { method: 'POST', body })
    const data = await response.json().catch(() => ({})) as ApiResponse
    if (!response.ok || !data.ok) {
      const problem = new Error(data.message || data.error || 'assistant_error') as Error & { code?: string; cooldown?: number }
      problem.code = data.error
      problem.cooldown = data.cooldown_ms
      throw problem
    }
    return data
  }, [profile, lang])

  const ensureWallet = useCallback(async () => {
    const body = new URLSearchParams({ action: 'ensure', wallet_token: getWalletToken() })
    const response = await fetch(`${API_BASE}/dlavie-wallet`, { method: 'POST', body })
    const data = await response.json().catch(() => ({})) as { ok?: boolean; wallet_token?: string | null }
    if (!response.ok || !data.ok) throw new Error('wallet_unavailable')
    if (data.wallet_token) localStorage.setItem(TOKEN_KEY, data.wallet_token)
  }, [])

  const typeAssistant = useCallback(async (text: string, kind = 'reply') => {
    const id = makeId('ai')
    const abortId = ++typingAbortRef.current
    setPhase('typing')
    setMessages((list) => [...list, { id, role: 'assistant', content: '', createdAt: Date.now(), kind, typing: true }])
    if (!open) setUnread((value) => value + 1)
    const step = text.length > 700 ? 5 : text.length > 350 ? 3 : 2
    for (let index = 0; index < text.length; index += step) {
      if (typingAbortRef.current !== abortId) return
      const chunk = text.slice(0, Math.min(text.length, index + step))
      setMessages((list) => list.map((item) => item.id === id ? { ...item, content: chunk } : item))
      await new Promise((resolve) => window.setTimeout(resolve, text.length > 700 ? 7 : 11))
    }
    setMessages((list) => list.map((item) => item.id === id ? { ...item, content: text, typing: false } : item))
    setPhase('idle')
  }, [open])

  const withProcessing = useCallback(async (request: () => Promise<ApiResponse>) => {
    setBusy(true)
    setError('')
    const labels: Phase[] = ['understanding', 'searching', 'thinking']
    let index = 0
    setPhase(labels[index])
    const timer = window.setInterval(() => { index = (index + 1) % labels.length; setPhase(labels[index]) }, 900)
    try { return await request() }
    finally { window.clearInterval(timer); setBusy(false) }
  }, [])

  const startSession = async () => {
    if (!authorized || !profile || busy) return
    touch(); setBusy(true); setError(''); setPhase('understanding')
    try {
      await ensureWallet()
      const data = await api('start', { client_meta: JSON.stringify({ route: window.location.hash, language: lang, user_agent: navigator.userAgent.slice(0, 180) }) })
      const started = data.started_at ? new Date(data.started_at).getTime() : Date.now()
      setSessionId(data.session_id || ''); setSessionRef(data.session_ref || ''); setWalletRef(data.wallet_ref || '')
      setStartedAt(started); setEndedAt(null); setMessages([]); setStage('quick'); setUnread(0); warnedAtRef.current = null
      setPhase('wave')
    } catch (err) { setError(err instanceof Error ? err.message : 'Assistant belum dapat dimulai.'); setPhase('idle') }
    finally { setBusy(false) }
  }

  const chooseHelp = async (mode: 'help' | 'transaction' | 'policy') => {
    if (!profile) return
    touch(); setPhase('wave')
    if (mode === 'transaction') setCategory('payment_wallet')
    if (mode === 'policy') setCategory('policy')
    const greeting = lang === 'en'
      ? `Hi ${profile.username}, I'm DLavie Assistant. I'll help you inspect the issue step by step. Before free chat opens, please send a short support context so I can look at the right account or transaction information.`
      : `Hai ${profile.username}, saya DLavie Assistant. Saya akan bantu memeriksa masalahmu langkah demi langkah. Sebelum free chat dibuka, isi konteks singkat dulu supaya saya bisa melihat informasi akun atau transaksi yang tepat.`
    await new Promise((resolve) => window.setTimeout(resolve, 350))
    await typeAssistant(greeting, 'greeting')
    setStage('intake')
  }

  const submitIntake = async (event: FormEvent) => {
    event.preventDefault()
    if (!sessionId || subject.trim().length < 3 || busy) return
    touch()
    const summary = `${copy.subject}: ${subject.trim()}\n${copy.category}: ${copy.categories[category as keyof typeof copy.categories]}${referenceId.trim() ? `\nReference: ${referenceId.trim()}` : ''}${detail.trim() ? `\n${detail.trim()}` : ''}`
    setMessages((list) => [...list, { id: makeId('user'), role: 'user', content: summary, createdAt: Date.now(), kind: 'intake' }])
    try {
      const data = await withProcessing(() => api('context', {
        session_id: sessionId, subject: subject.trim(), category, reference_id: referenceId.trim(), detail: detail.trim(),
        client_context: JSON.stringify(clientContext()),
      }))
      await typeAssistant(data.message || (lang === 'en' ? 'I have the context. You can continue in free chat.' : 'Konteks sudah saya terima. Kamu bisa melanjutkan lewat free chat.'), 'intake_response')
      setStage('chat')
      setCooldownUntil(Date.now() + 900)
    } catch (err) {
      setStage('chat')
      setError(err instanceof Error ? err.message : 'Assistant belum dapat memproses konteks.')
      setPhase('idle')
    }
  }

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault()
    const text = draft.trim()
    if (!text || !sessionId || busy || cooldownLeft > 0 || stage !== 'chat') return
    touch(); setError('')
    if (profanity(text)) { setError(copy.filtered); return }
    setDraft('')
    setMessages((list) => [...list, { id: makeId('user'), role: 'user', content: text, createdAt: Date.now(), kind: 'chat' }])
    setCooldownUntil(Date.now() + CLIENT_COOLDOWN_MS)
    try {
      const data = await withProcessing(() => api('message', {
        session_id: sessionId, message: text, reference_id: referenceId.trim(), client_context: JSON.stringify(clientContext()),
      }))
      await typeAssistant(data.message || '—', 'reply')
    } catch (err) {
      const problem = err as Error & { code?: string; cooldown?: number }
      if (problem.cooldown) setCooldownUntil(Date.now() + problem.cooldown)
      setError(problem.message || 'Pesan belum dapat diproses.')
      setPhase('idle')
    }
  }

  const closeSession = useCallback(async (reason = 'user_closed') => {
    if (!sessionId || stage === 'ended' || idleBusyRef.current) return
    idleBusyRef.current = true
    setBusy(true); setPhase('thinking')
    try {
      const data = await api('close', { session_id: sessionId, reason })
      await typeAssistant(data.message || (lang === 'en' ? 'Thank you. This session has been closed.' : 'Terima kasih. Sesi ini sudah ditutup.'), 'closing')
    } catch {
      await typeAssistant(lang === 'en' ? 'Thank you for chatting with DLavie Assistant. This session is now closed.' : 'Terima kasih sudah menggunakan DLavie Assistant. Sesi percakapan ini sekarang ditutup.', 'closing')
    } finally {
      setEndedAt(Date.now()); setStage('ended'); setBusy(false); setPhase('idle'); idleBusyRef.current = false
    }
  }, [api, lang, sessionId, stage, typeAssistant])

  useEffect(() => {
    if (!sessionId || stage === 'ended' || stage === 'ready') return
    const timer = window.setInterval(() => {
      const current = Date.now()
      const idle = current - lastInteractionRef.current
      if (idle >= IDLE_WARNING_MS && !warnedAtRef.current && !idleBusyRef.current) {
        warnedAtRef.current = current
        const text = lang === 'en'
          ? 'Are you still there? If there is anything else I can help with, send a message. If there is no response in 1 minute, I will close this support session automatically.'
          : 'Apakah masih ada yang bisa saya bantu? Jika masih ada, kirim pesan kapan saja. Jika dalam 1 menit tidak ada respons, sesi percakapan ini akan saya tutup otomatis.'
        void typeAssistant(text, 'idle_warning')
      }
      if (idle >= IDLE_CLOSE_MS && warnedAtRef.current && !idleBusyRef.current) void closeSession('idle_timeout')
    }, 1000)
    return () => window.clearInterval(timer)
  }, [closeSession, lang, sessionId, stage, typeAssistant])

  const newSession = () => {
    setStage('ready'); setSessionId(''); setSessionRef(''); setWalletRef(''); setStartedAt(null); setEndedAt(null); setMessages([])
    setSubject(''); setCategory('payment_wallet'); setReferenceId(''); setDetail(''); setDraft(''); setError(''); setCooldownUntil(0); warnedAtRef.current = null; touch()
  }

  const duration = startedAt ? (endedAt || now) - startedAt : 0
  const cooldownPercent = cooldownLeft > 0 ? Math.max(0, Math.min(100, (cooldownLeft / CLIENT_COOLDOWN_MS) * 100)) : 0
  const phaseLabel = phase === 'understanding' ? (lang === 'en' ? 'Understanding your request…' : 'Memahami masalah…')
    : phase === 'searching' ? (lang === 'en' ? 'Checking account information…' : 'Memeriksa informasi akun…')
      : phase === 'thinking' ? (lang === 'en' ? 'Preparing the clearest answer…' : 'Menyiapkan jawaban…')
        : phase === 'typing' ? (lang === 'en' ? 'DLavie Assistant is typing…' : 'DLavie Assistant sedang mengetik…') : ''

  const openPanel = () => { setOpen(true); setUnread(0); syncAuth(); touch() }

  return (
    <div className={`dlv-assistant${open ? ' is-open' : ''}`} onPointerDown={touch} onKeyDown={touch}>
      {!open && (
        <button className="dlv-assistant-launcher" type="button" onClick={openPanel} aria-label="Buka DLavie Assistant">
          <AssistantAvatar small phase={authorized ? 'wave' : 'idle'} />
          <span><strong>DLavie</strong><small>Assistant</small></span>
          {unread > 0 && <b className="dlv-assistant-unread">{Math.min(unread, 9)}</b>}
        </button>
      )}

      {open && (
        <section className="dlv-assistant-panel" aria-label="DLavie Assistant live support">
          <header className="dlv-assistant-header">
            <div className="dlv-assistant-identity"><AssistantAvatar phase={phase} /><span><strong>{copy.title}</strong><small><i /> {copy.online} · {copy.subtitle}</small></span></div>
            <div className="dlv-assistant-header-actions">
              {sessionId && stage !== 'ended' && <button type="button" className="dlv-assistant-end" onClick={() => void closeSession('user_closed')} disabled={busy}>{copy.end}</button>}
              <button type="button" className="dlv-assistant-close" onClick={() => setOpen(false)} aria-label="Tutup Assistant">×</button>
            </div>
          </header>

          {!authorized ? (
            <div className="dlv-assistant-guest">
              <AssistantAvatar phase="wave" />
              <span>MEMBER SUPPORT</span><h3>{copy.guest}</h3><p>{copy.guestBody}</p>
              <button type="button" onClick={() => { document.querySelector<HTMLButtonElement>('.avatar-button')?.click(); setOpen(false) }}>{copy.signIn}<b>→</b></button>
              <a href="#/docs/overview">{lang === 'en' ? 'Read DLavie documentation' : 'Baca dokumentasi DLavie'} ↗</a>
            </div>
          ) : (
            <>
              <div className="dlv-assistant-sessionbar">
                <div><small>{copy.session}</small><strong>{sessionRef || '—'}</strong></div>
                <div><small>{copy.elapsed}</small><strong className="dlv-assistant-timer">{formatDuration(duration)}</strong></div>
                <div><small>USER</small><strong>{profile?.id || '—'}</strong></div>
              </div>

              <div className="dlv-assistant-body" ref={scrollRef}>
                {stage === 'ready' && (
                  <div className="dlv-assistant-ready">
                    <span>{copy.readyEyebrow}</span><h3>{copy.readyTitle}</h3><p>{copy.readyBody}</p>
                    <div className="dlv-assistant-ready-meta"><div><small>AI</small><strong>GPT support</strong></div><div><small>CONTEXT</small><strong>User-scoped</strong></div><div><small>PRIVACY</small><strong>Server-side</strong></div></div>
                    {error && <div className="dlv-assistant-error">{error}</div>}
                    <button type="button" className="dlv-assistant-start" onClick={() => void startSession()} disabled={busy}><span>{busy ? (lang === 'en' ? 'Starting…' : 'Menyiapkan sesi…') : copy.start}</span><b>→</b></button>
                  </div>
                )}

                {stage !== 'ready' && (
                  <div className="dlv-assistant-thread">
                    {messages.map((message) => (
                      <article key={message.id} className={`dlv-assistant-message is-${message.role}${message.typing ? ' is-typing' : ''}`} data-kind={message.kind || 'chat'}>
                        {message.role === 'assistant' && <AssistantAvatar small phase={message.typing ? 'typing' : 'idle'} />}
                        <div><p>{message.content}{message.typing && <i className="dlv-type-caret" />}</p><small>{new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'id-ID', { hour: '2-digit', minute: '2-digit' }).format(message.createdAt)}</small></div>
                      </article>
                    ))}
                    {busy && phaseLabel && <div className="dlv-assistant-process"><AssistantAvatar small phase={phase} /><div><span>{phaseLabel}</span><i><b /><b /><b /></i></div></div>}
                  </div>
                )}

                {stage === 'quick' && (
                  <div className="dlv-assistant-quick">
                    <p>{copy.quickHint}</p>
                    <button type="button" onClick={() => void chooseHelp('help')}><span><b>✦</b><strong>{copy.help}</strong></span><i>→</i></button>
                    <button type="button" onClick={() => void chooseHelp('transaction')}><span><b>↗</b><strong>{copy.transaction}</strong></span><i>→</i></button>
                    <button type="button" onClick={() => void chooseHelp('policy')}><span><b>§</b><strong>{copy.policy}</strong></span><i>→</i></button>
                  </div>
                )}

                {stage === 'intake' && (
                  <form className="dlv-assistant-intake" onSubmit={submitIntake}>
                    <div><span>SUPPORT INTAKE</span><h3>{copy.intakeTitle}</h3><p>{copy.intakeBody}</p></div>
                    <label><span>{copy.subject}</span><input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder={lang === 'en' ? 'Example: QRIS deposit failed' : 'Contoh: deposit QRIS gagal'} maxLength={100} /></label>
                    <label><span>{copy.category}</span><select value={category} onChange={(event) => setCategory(event.target.value)}>{Object.entries(copy.categories).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
                    <label><span>{copy.reference}</span><input value={referenceId} onChange={(event) => setReferenceId(event.target.value.trimStart())} placeholder={`${profile?.id || 'DLV-…'} / DLVDEP-… / WLT-…`} maxLength={100} /></label>
                    <label><span>{copy.detail}</span><textarea value={detail} onChange={(event) => setDetail(event.target.value)} placeholder={lang === 'en' ? 'What happened?' : 'Apa yang terjadi?'} maxLength={500} rows={3} /></label>
                    {error && <div className="dlv-assistant-error">{error}</div>}
                    <button type="submit" disabled={subject.trim().length < 3 || busy}><span>{busy ? (lang === 'en' ? 'Reviewing…' : 'Memeriksa…') : copy.sendIntake}</span><b>→</b></button>
                  </form>
                )}

                {stage === 'ended' && (
                  <div className="dlv-assistant-receipt"><span>SESSION COMPLETE</span><h3>{copy.closed}</h3><div><p><small>{copy.sessionReceipt}</small><strong>{sessionRef}</strong></p><p><small>{copy.elapsed}</small><strong>{formatDuration(duration)}</strong></p><p><small>USER ID</small><strong>{profile?.id}</strong></p><p><small>WALLET</small><strong>{walletRef || '—'}</strong></p></div><button type="button" onClick={newSession}>{copy.newSession}<b>→</b></button></div>
                )}
              </div>

              {stage === 'chat' && (
                <div className="dlv-assistant-composer-wrap">
                  {error && <div className="dlv-assistant-composer-error">{error}<button type="button" onClick={() => setError('')}>×</button></div>}
                  <form className={`dlv-assistant-composer${cooldownLeft > 0 ? ' is-cooldown' : ''}`} onSubmit={sendMessage}>
                    <div className="dlv-assistant-cooldown-track" style={{ '--cooldown': `${cooldownPercent}%` } as React.CSSProperties} />
                    <textarea value={draft} onChange={(event) => { setDraft(event.target.value); touch() }} disabled={busy || cooldownLeft > 0} placeholder={cooldownLeft > 0 ? `${copy.cooldown} · ${(cooldownLeft / 1000).toFixed(1)}s` : copy.placeholder} rows={1} maxLength={1500} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit() } }} />
                    <button type="submit" disabled={!draft.trim() || busy || cooldownLeft > 0} aria-label={copy.send}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m4 4 17 8-17 8 3-8-3-8Z"/><path d="M7 12h14"/></svg></button>
                  </form>
                  <div className="dlv-assistant-composer-meta"><span>{draft.length}/1500</span><span>{lang === 'en' ? 'Spam & language filter active' : 'Filter spam & bahasa aktif'}</span></div>
                </div>
              )}
            </>
          )}
        </section>
      )}
    </div>
  )
}
