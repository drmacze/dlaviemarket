import { FormEvent, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'

type Profile = { id: string; username: string; email: string; avatarId?: string }
type Order = { id: string; serviceName?: string; providerName?: string; price?: number; createdAt?: number; expiresAt?: number; status?: string }
type Role = 'assistant' | 'user' | 'system' | 'admin'
type Message = { id: string; role: Role; content: string; createdAt: number; kind?: string; typing?: boolean }
type Stage = 'ready' | 'quick' | 'intake' | 'chat' | 'ended'
type Phase = 'idle' | 'wave' | 'understanding' | 'searching' | 'thinking' | 'typing'
type SupportMode = 'ai' | 'admin_pending' | 'admin'
type IntakeMode = 'help' | 'transaction' | 'policy'
type ServerMessage = { id: string; role: Role; content: string; metadata?: { kind?: string; admin?: string }; created_at: string }
type ActiveSession = { sessionId: string; sessionRef: string; walletRef: string; startedAt: number; supportMode: SupportMode }
type ToastState = { title: string; body: string; kind: 'assistant' | 'admin' | 'system' } | null

type ApiResponse = {
  ok?: boolean
  error?: string
  message?: string | null
  session_id?: string
  session_ref?: string
  started_at?: string
  wallet_ref?: string
  cooldown_ms?: number
  context_found?: boolean
  support_mode?: SupportMode
  assigned_admin?: string | null
  escalated?: boolean
  confidence?: number
  session?: {
    status?: 'open' | 'closed'
    support_mode?: SupportMode
    assigned_admin?: string | null
    ended_at?: string | null
    session_ref?: string
  }
  messages?: ServerMessage[]
}

const API_BASE = 'https://ydaeukhqwishlrjyfktk.supabase.co/functions/v1'
const PROFILE_KEY = 'dlavie-account-profile-v1'
const SESSION_KEY = 'dlavie-account-session-v1'
const CONSENT_KEY = 'dlavie-consent-v1'
const CONSENT_VERSION = '2026-08-18-v1'
const TOKEN_KEY = 'dlavie-wallet-token-v1'
const ORDER_KEY = 'dlavie-orders-v1'
const ACTIVE_KEY = 'dlavie-assistant-active-v2'
const AUTH_EVENT = 'dlavie:auth-state'
const IDLE_WARNING_MS = 5 * 60 * 1000
const IDLE_CLOSE_MS = 6 * 60 * 1000
const CLIENT_COOLDOWN_MS = 3400

function readProfile(): Profile | null {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null') as Profile | null } catch { return null }
}
function readActive(): ActiveSession | null {
  try { return JSON.parse(localStorage.getItem(ACTIVE_KEY) || 'null') as ActiveSession | null } catch { return null }
}
function saveActive(value: ActiveSession | null) {
  if (!value) localStorage.removeItem(ACTIVE_KEY)
  else localStorage.setItem(ACTIVE_KEY, JSON.stringify(value))
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
      id: order.id,
      service: order.serviceName || null,
      provider: order.providerName || null,
      price: order.price || null,
      status: order.status || null,
      created_at: order.createdAt || null,
      expires_at: order.expiresAt || null,
      source: 'browser_demo',
    })),
  }
}
function profanity(text: string) {
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ')
  return ['anjing','bangsat','bajingan','kontol','memek','ngentot','goblok','tolol','jancok','jancuk','fuck','fucking','shit','bitch','asshole','motherfucker']
    .some((word) => new RegExp(`(^|\\s)${word}(\\s|$)`, 'i').test(normalized))
}
function toClientMessage(message: ServerMessage): Message {
  return { id: `srv-${message.id}`, role: message.role, content: message.content, createdAt: new Date(message.created_at).getTime(), kind: message.metadata?.kind || 'chat' }
}
function sameMessages(current: Message[], next: Message[]) {
  return current.length === next.length && current.every((item, index) => {
    const other = next[index]
    return !!other && item.id === other.id && item.role === other.role && item.content === other.content && item.kind === other.kind && item.createdAt === other.createdAt
  })
}
function nextAnimationFrame() { return new Promise<number>((resolve) => requestAnimationFrame(resolve)) }

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

const AssistantMessage = memo(function AssistantMessage({ message, formatter }: { message: Message; formatter: Intl.DateTimeFormat }) {
  return (
    <article className={`dlv-assistant-message is-${message.role}${message.typing ? ' is-typing' : ''}`} data-kind={message.kind || 'chat'}>
      {message.role === 'assistant' && <AssistantAvatar small phase={message.typing ? 'typing' : 'idle'} />}
      {message.role === 'admin' && <span className="dlv-admin-avatar">D</span>}
      <div>{message.role === 'admin' && <em>DLavie Admin</em>}<p>{message.content}{message.typing && <i className="dlv-type-caret" />}</p><small>{formatter.format(message.createdAt)}</small></div>
    </article>
  )
})

export default function DLavieAssistant() {
  const restored = useMemo(() => readActive(), [])
  const [open, setOpen] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(() => readProfile())
  const [authorized, setAuthorized] = useState(() => isSignedIn() && hasConsent(readProfile()))
  const [stage, setStage] = useState<Stage>(restored ? 'chat' : 'ready')
  const [phase, setPhase] = useState<Phase>('wave')
  const [messages, setMessages] = useState<Message[]>([])
  const [sessionId, setSessionId] = useState(restored?.sessionId || '')
  const [sessionRef, setSessionRef] = useState(restored?.sessionRef || '')
  const [walletRef, setWalletRef] = useState(restored?.walletRef || '')
  const [supportMode, setSupportMode] = useState<SupportMode>(restored?.supportMode || 'ai')
  const [assignedAdmin, setAssignedAdmin] = useState('')
  const [startedAt, setStartedAt] = useState<number | null>(restored?.startedAt || null)
  const [endedAt, setEndedAt] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now())
  const [busy, setBusy] = useState(false)
  const [unread, setUnread] = useState(0)
  const [toast, setToast] = useState<ToastState>(null)
  const [intakeMode, setIntakeMode] = useState<IntakeMode>('help')
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState('payment_wallet')
  const [referenceId, setReferenceId] = useState('')
  const [detail, setDetail] = useState('')
  const [impact, setImpact] = useState('normal')
  const [startedWhen, setStartedWhen] = useState('today')
  const [transactionType, setTransactionType] = useState('deposit')
  const [visibleStatus, setVisibleStatus] = useState('failed')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [policyTopic, setPolicyTopic] = useState('payment_refund')
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  const [cooldownUntil, setCooldownUntil] = useState(0)
  const [cooldownLeft, setCooldownLeft] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastInteractionRef = useRef(Date.now())
  const warnedAtRef = useRef<number | null>(null)
  const idleBusyRef = useRef(false)
  const typingAbortRef = useRef(0)
  const seenServerIdsRef = useRef(new Set<string>())
  const syncBusyRef = useRef(false)

  const lang = language()
  const messageTimeFormatter = useMemo(() => new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'id-ID', { hour: '2-digit', minute: '2-digit' }), [lang])
  const copy = useMemo(() => lang === 'en' ? {
    title: 'DLavie Assistant', online: 'Available', guest: 'Sign in to use live support.', guestBody: 'Public documentation and policies remain available without an account. Live support can access only the signed-in user context.', signIn: 'Sign in / create account',
    readyEyebrow: 'PRIVATE SUPPORT SESSION', readyTitle: 'Need help with DLavie?', readyBody: 'Start a session to ask about payments, wallet, order references, OTP sessions, policies, or a technical issue.', start: 'Start session', session: 'Session', elapsed: 'Elapsed', end: 'End',
    help: 'Help me', transaction: 'Check a transaction', policy: 'Ask about policy', quickHint: 'Choose the kind of support you need. Each path asks only for context relevant to that request.',
    placeholder: 'Write a message to DLavie Support…', send: 'Send', cooldown: 'Please wait', filtered: 'Change the wording before sending. This chat blocks inappropriate language.', closed: 'Session closed', newSession: 'Start new session', sessionReceipt: 'Session receipt',
    waitingAdmin: 'Waiting for admin', adminOnline: 'Admin online', aiMode: 'DLavie Engine',
    categories: { payment_wallet: 'Payment & wallet', order_otp: 'Order & OTP', account: 'Account', technical: 'Technical issue', pricing_stock: 'Price & stock', documentation: 'Navigation & documentation', other: 'Other' },
  } : {
    title: 'DLavie Assistant', online: 'Tersedia', guest: 'Masuk untuk menggunakan live support.', guestBody: 'Dokumentasi dan kebijakan tetap dapat dibaca tanpa akun. Live support hanya boleh membaca konteks user yang sedang login.', signIn: 'Masuk / buat akun',
    readyEyebrow: 'PRIVATE SUPPORT SESSION', readyTitle: 'Ada yang bisa dibantu?', readyBody: 'Mulai sesi untuk bertanya tentang pembayaran, wallet, reference ID, order/OTP, kebijakan, atau kendala teknis.', start: 'Start session', session: 'Sesi', elapsed: 'Durasi', end: 'Akhiri',
    help: 'Bantu saya', transaction: 'Cek transaksi', policy: 'Tanya kebijakan', quickHint: 'Pilih jenis bantuan. Setiap jalur hanya menanyakan informasi yang memang relevan untuk permintaan tersebut.',
    placeholder: 'Tulis pesan ke DLavie Support…', send: 'Kirim', cooldown: 'Tunggu sebentar', filtered: 'Ubah kalimat sebelum dikirim. Percakapan ini memblokir kata yang tidak pantas.', closed: 'Sesi ditutup', newSession: 'Mulai sesi baru', sessionReceipt: 'Tanda terima sesi',
    waitingAdmin: 'Menunggu admin', adminOnline: 'Admin online', aiMode: 'DLavie Engine',
    categories: { payment_wallet: 'Pembayaran & wallet', order_otp: 'Order & OTP', account: 'Akun', technical: 'Kendala teknis', pricing_stock: 'Harga & stok', documentation: 'Navigasi & dokumentasi', other: 'Lainnya' },
  }, [lang])

  const intakeCopy = useMemo(() => {
    if (lang === 'en') {
      if (intakeMode === 'transaction') return { eyebrow: 'TRANSACTION CHECK', title: 'Which record should I inspect?', body: 'A transaction check needs an exact reference and the state you currently see.', submit: 'Check this transaction' }
      if (intakeMode === 'policy') return { eyebrow: 'POLICY QUESTION', title: 'What rule do you want to understand?', body: 'Choose the policy area and describe your scenario. A transaction ID is not needed unless the question later becomes a case review.', submit: 'Review policy' }
      return { eyebrow: 'GENERAL SUPPORT', title: 'Tell me what is getting in your way.', body: 'Give me the issue area, impact, when it started, and a short description. I will decide whether a reference is actually needed.', submit: 'Analyze my issue' }
    }
    if (intakeMode === 'transaction') return { eyebrow: 'CEK TRANSAKSI', title: 'Record mana yang perlu saya periksa?', body: 'Pemeriksaan transaksi membutuhkan reference yang tepat serta status yang saat ini kamu lihat.', submit: 'Periksa transaksi' }
    if (intakeMode === 'policy') return { eyebrow: 'TANYA KEBIJAKAN', title: 'Aturan apa yang ingin kamu pahami?', body: 'Pilih topik kebijakan dan ceritakan skenarionya. ID transaksi belum dibutuhkan kecuali pertanyaan berubah menjadi pemeriksaan kasus.', submit: 'Pelajari kebijakan' }
    return { eyebrow: 'BANTU SAYA', title: 'Ceritakan apa yang sedang menghambatmu.', body: 'Berikan area masalah, dampak, kapan mulai terjadi, dan ringkasan singkat. Saya akan menentukan sendiri apakah reference ID memang diperlukan.', submit: 'Analisis masalah' }
  }, [intakeMode, lang])

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
    if (!open) return
    const tick = () => setNow(Date.now())
    tick()
    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [open])

  useEffect(() => {
    const initial = Math.max(0, cooldownUntil - Date.now())
    setCooldownLeft(initial)
    if (!open || initial <= 0) return
    const timer = window.setInterval(() => {
      const left = Math.max(0, cooldownUntil - Date.now())
      setCooldownLeft(left)
      if (left <= 0) window.clearInterval(timer)
    }, 250)
    return () => window.clearInterval(timer)
  }, [cooldownUntil, open])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 6200)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (!open) return
    requestAnimationFrame(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight })
  }, [messages, open, stage, busy, intakeMode])

  useEffect(() => {
    if (!sessionId || !startedAt || stage === 'ended') return
    saveActive({ sessionId, sessionRef, walletRef, startedAt, supportMode })
  }, [sessionId, sessionRef, walletRef, startedAt, supportMode, stage])

  const touch = useCallback(() => { lastInteractionRef.current = Date.now(); warnedAtRef.current = null }, [])

  const api = useCallback(async (action: string, extra: Record<string, string> = {}) => {
    if (!profile) throw new Error('profile_required')
    const body = new URLSearchParams({ action, wallet_token: getWalletToken(), user_id: profile.id, username: profile.username, lang, ...extra })
    const response = await fetch(`${API_BASE}/dlavie-assistant`, { method: 'POST', body })
    const data = await response.json().catch(() => ({})) as ApiResponse
    if (!response.ok || !data.ok) {
      const problem = new Error(String(data.message || data.error || 'assistant_error')) as Error & { code?: string; cooldown?: number }
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
    const rate = text.length > 700 ? 5 / 7 : text.length > 350 ? 3 / 11 : 2 / 11
    const started = performance.now()
    let visibleLength = 0
    while (visibleLength < text.length) {
      if (typingAbortRef.current !== abortId) return
      const frame = await nextAnimationFrame()
      if (typingAbortRef.current !== abortId) return
      const nextLength = Math.min(text.length, Math.max(1, Math.floor((frame - started) * rate)))
      if (nextLength === visibleLength) continue
      visibleLength = nextLength
      const chunk = text.slice(0, visibleLength)
      setMessages((list) => list.map((item) => item.id === id ? { ...item, content: chunk } : item))
    }
    setMessages((list) => list.map((item) => item.id === id ? { ...item, content: text, typing: false } : item))
    setPhase('idle')
    if (!open) {
      setUnread((value) => value + 1)
      setToast({ title: lang === 'en' ? 'DLavie Assistant replied' : 'DLavie Assistant membalas', body: text.slice(0, 120), kind: 'assistant' })
    }
  }, [open, lang])

  const withProcessing = useCallback(async (request: () => Promise<ApiResponse>) => {
    setBusy(true); setError('')
    const labels: Phase[] = ['understanding', 'searching', 'thinking']
    let index = 0
    setPhase(labels[index])
    const timer = window.setInterval(() => { index = (index + 1) % labels.length; setPhase(labels[index]) }, 900)
    try { return await request() }
    finally { window.clearInterval(timer); setBusy(false) }
  }, [])

  const syncHumanThread = useCallback(async (silent = true) => {
    if (!sessionId || syncBusyRef.current || !profile) return
    syncBusyRef.current = true
    try {
      const data = await api('sync', { session_id: sessionId })
      const nextMode = data.session?.support_mode || data.support_mode || supportMode
      const nextAdmin = data.session?.assigned_admin || data.assigned_admin || ''
      setSupportMode(nextMode)
      setAssignedAdmin(nextAdmin || '')
      if (data.messages) {
        const incoming = data.messages.filter((item) => !seenServerIdsRef.current.has(item.id))
        data.messages.forEach((item) => seenServerIdsRef.current.add(item.id))
        const nextMessages = data.messages.map(toClientMessage)
        setMessages((current) => sameMessages(current, nextMessages) ? current : nextMessages)
        const important = incoming.filter((item) => item.role === 'admin' || item.metadata?.kind === 'admin_joined' || item.metadata?.kind === 'admin_resolved')
        const newest = important.at(-1)
        if (newest && !open) {
          setUnread((value) => value + 1)
          setToast({
            title: newest.role === 'admin' ? (lang === 'en' ? 'DLavie Admin replied' : 'DLavie Admin membalas') : (lang === 'en' ? 'Support status updated' : 'Status support diperbarui'),
            body: newest.content.slice(0, 130),
            kind: newest.role === 'admin' ? 'admin' : 'system',
          })
        }
      }
      if (data.session?.status === 'closed') {
        setEndedAt(data.session.ended_at ? new Date(data.session.ended_at).getTime() : Date.now())
        setStage('ended')
        saveActive(null)
      } else if (stage !== 'ended' && stage !== 'ready' && stage !== 'quick' && stage !== 'intake') setStage('chat')
    } catch (err) {
      if (!silent) setError(err instanceof Error ? err.message : 'Support sync gagal.')
    } finally { syncBusyRef.current = false }
  }, [api, lang, open, profile, sessionId, stage, supportMode])

  useEffect(() => {
    if (!sessionId || !authorized || stage === 'ended') return
    if (supportMode === 'ai' && !restored) return
    void syncHumanThread(true)
    const timer = window.setInterval(() => void syncHumanThread(true), supportMode === 'admin' ? 2600 : 3800)
    return () => window.clearInterval(timer)
  }, [authorized, restored, sessionId, stage, supportMode, syncHumanThread])

  const startSession = async () => {
    if (!authorized || !profile || busy) return
    touch(); setBusy(true); setError(''); setPhase('understanding')
    try {
      await ensureWallet()
      const data = await api('start', { client_meta: JSON.stringify({ route: window.location.hash, language: lang, user_agent: navigator.userAgent.slice(0, 180) }) })
      const started = data.started_at ? new Date(data.started_at).getTime() : Date.now()
      const mode = data.support_mode || 'ai'
      setSessionId(data.session_id || ''); setSessionRef(data.session_ref || ''); setWalletRef(data.wallet_ref || ''); setSupportMode(mode); setAssignedAdmin('')
      setStartedAt(started); setEndedAt(null); setMessages([]); seenServerIdsRef.current.clear(); setStage('quick'); setUnread(0); warnedAtRef.current = null
      if (data.session_id) saveActive({ sessionId: data.session_id, sessionRef: data.session_ref || '', walletRef: data.wallet_ref || '', startedAt: started, supportMode: mode })
      setPhase('wave')
    } catch (err) { setError(err instanceof Error ? err.message : 'Assistant belum dapat dimulai.'); setPhase('idle') }
    finally { setBusy(false) }
  }

  const chooseHelp = async (mode: IntakeMode) => {
    if (!profile) return
    touch(); setPhase('wave'); setIntakeMode(mode); setError(''); setDetail(''); setReferenceId('')
    if (mode === 'transaction') { setCategory('payment_wallet'); setTransactionType('deposit'); setVisibleStatus('failed') }
    if (mode === 'policy') setCategory('policy')
    const greeting = lang === 'en'
      ? mode === 'transaction'
        ? `Hi ${profile.username}. Send me the exact transaction reference and the state you see. I will inspect only records linked to your signed-in wallet.`
        : mode === 'policy'
          ? `Hi ${profile.username}. Tell me which DLavie policy you want to understand and the scenario you have in mind. I will answer from the active DLavie documentation before asking for transaction data.`
          : `Hi ${profile.username}. Tell me what is confusing or not working. I will first understand the situation, then ask for a reference only if the case actually needs one.`
      : mode === 'transaction'
        ? `Hai ${profile.username}. Kirim reference transaksi yang tepat dan status yang kamu lihat. Saya hanya akan memeriksa record yang terhubung ke wallet akunmu.`
        : mode === 'policy'
          ? `Hai ${profile.username}. Pilih kebijakan DLavie yang ingin kamu pahami dan ceritakan skenarionya. Saya akan menjawab dari dokumentasi DLavie terlebih dahulu tanpa meminta data transaksi yang tidak diperlukan.`
          : `Hai ${profile.username}. Ceritakan apa yang membingungkan atau tidak berjalan sesuai harapan. Saya akan memahami situasinya dulu, lalu baru meminta reference jika kasusnya memang membutuhkan pemeriksaan record.`
    await new Promise((resolve) => window.setTimeout(resolve, 260))
    await typeAssistant(greeting, 'greeting')
    setStage('intake')
  }

  const applySupportMode = (data: ApiResponse) => {
    const mode = data.support_mode || supportMode
    setSupportMode(mode)
    if (data.assigned_admin) setAssignedAdmin(data.assigned_admin)
    if (mode === 'admin_pending' || mode === 'admin') saveActive(sessionId && startedAt ? { sessionId, sessionRef, walletRef, startedAt, supportMode: mode } : null)
  }

  const intakeValid = intakeMode === 'transaction'
    ? referenceId.trim().length >= 5 && detail.trim().length >= 3
    : intakeMode === 'policy'
      ? policyTopic.length > 0 && detail.trim().length >= 3
      : subject.trim().length >= 3 && detail.trim().length >= 3

  const submitIntake = async (event: FormEvent) => {
    event.preventDefault()
    if (!sessionId || !intakeValid || busy) return
    touch(); setError('')

    const generatedSubject = intakeMode === 'transaction'
      ? `${lang === 'en' ? 'Transaction check' : 'Cek transaksi'} · ${transactionType}`
      : intakeMode === 'policy'
        ? `${lang === 'en' ? 'Policy question' : 'Pertanyaan kebijakan'} · ${policyTopic}`
        : subject.trim()
    const generatedCategory = intakeMode === 'policy' ? 'policy' : intakeMode === 'transaction' ? (transactionType === 'order' ? 'order_otp' : 'payment_wallet') : category
    const structured = {
      intake_type: intakeMode,
      issue_area: intakeMode === 'help' ? category : '',
      impact: intakeMode === 'help' ? impact : '',
      started_when: intakeMode === 'help' ? startedWhen : '',
      transaction_type: intakeMode === 'transaction' ? transactionType : '',
      visible_status: intakeMode === 'transaction' ? visibleStatus : '',
      payment_method: intakeMode === 'transaction' ? paymentMethod.trim() : '',
      policy_topic: intakeMode === 'policy' ? policyTopic : '',
      scenario: detail.trim(),
    }

    const summary = intakeMode === 'transaction'
      ? `${lang === 'en' ? 'Transaction' : 'Transaksi'}: ${transactionType}\nReference: ${referenceId.trim()}\n${lang === 'en' ? 'Visible status' : 'Status terlihat'}: ${visibleStatus}${paymentMethod.trim() ? `\n${lang === 'en' ? 'Method' : 'Metode'}: ${paymentMethod.trim()}` : ''}\n${detail.trim()}`
      : intakeMode === 'policy'
        ? `${lang === 'en' ? 'Policy topic' : 'Topik kebijakan'}: ${policyTopic}\n${detail.trim()}`
        : `${lang === 'en' ? 'Issue' : 'Masalah'}: ${subject.trim()}\n${lang === 'en' ? 'Area' : 'Area'}: ${copy.categories[category as keyof typeof copy.categories] || category}\n${lang === 'en' ? 'Impact' : 'Dampak'}: ${impact}\n${lang === 'en' ? 'Started' : 'Mulai'}: ${startedWhen}\n${detail.trim()}`

    setMessages((list) => [...list, { id: makeId('user'), role: 'user', content: summary, createdAt: Date.now(), kind: `intake_${intakeMode}` }])
    try {
      const data = await withProcessing(() => api('context', {
        session_id: sessionId,
        intake_type: intakeMode,
        subject: generatedSubject,
        category: generatedCategory,
        reference_id: intakeMode === 'transaction' ? referenceId.trim() : '',
        detail: detail.trim(),
        impact: structured.impact,
        started_when: structured.started_when,
        transaction_type: structured.transaction_type,
        visible_status: structured.visible_status,
        payment_method: structured.payment_method,
        policy_topic: structured.policy_topic,
        intake_data: JSON.stringify(structured),
        client_context: JSON.stringify(clientContext()),
      }))
      applySupportMode(data)
      if (data.message) await typeAssistant(data.message, data.escalated ? 'handoff' : 'intake_response')
      setStage('chat'); setCooldownUntil(Date.now() + 900)
    } catch (err) {
      setStage('chat'); setError(err instanceof Error ? err.message : 'Assistant belum dapat memproses konteks.'); setPhase('idle')
    }
  }

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault()
    const text = draft.trim()
    if (!text || !sessionId || busy || cooldownLeft > 0 || stage !== 'chat') return
    touch(); setError('')
    if (profanity(text)) { setError(copy.filtered); return }
    setDraft('')
    setMessages((list) => [...list, { id: makeId('user'), role: 'user', content: text, createdAt: Date.now(), kind: supportMode === 'ai' ? 'chat' : 'human_chat' }])
    setCooldownUntil(Date.now() + (supportMode === 'ai' ? CLIENT_COOLDOWN_MS : 1500))
    try {
      const data = supportMode === 'ai'
        ? await withProcessing(() => api('message', { session_id: sessionId, message: text, reference_id: referenceId.trim(), client_context: JSON.stringify(clientContext()) }))
        : await api('message', { session_id: sessionId, message: text, reference_id: referenceId.trim(), client_context: JSON.stringify(clientContext()) })
      applySupportMode(data)
      if (data.message) await typeAssistant(data.message, data.escalated ? 'handoff' : 'reply')
      if (data.support_mode === 'admin_pending' || data.support_mode === 'admin') window.setTimeout(() => void syncHumanThread(true), 500)
    } catch (err) {
      const problem = err as Error & { code?: string; cooldown?: number }
      if (problem.cooldown) setCooldownUntil(Date.now() + problem.cooldown)
      setError(problem.message || 'Pesan belum dapat diproses.'); setPhase('idle')
    }
  }

  const closeSession = useCallback(async (reason = 'user_closed') => {
    if (!sessionId || stage === 'ended' || idleBusyRef.current) return
    idleBusyRef.current = true; setBusy(true); setPhase('thinking')
    try {
      const data = await api('close', { session_id: sessionId, reason })
      if (data.message) await typeAssistant(data.message, 'closing')
    } catch {
      await typeAssistant(lang === 'en' ? 'Thank you for using DLavie Support. This session is now closed.' : 'Terima kasih sudah menggunakan DLavie Support. Sesi ini sekarang ditutup.', 'closing')
    } finally {
      setEndedAt(Date.now()); setStage('ended'); setBusy(false); setPhase('idle'); idleBusyRef.current = false; saveActive(null)
    }
  }, [api, lang, sessionId, stage, typeAssistant])

  useEffect(() => {
    if (!sessionId || stage === 'ended' || stage === 'ready' || supportMode !== 'ai') return
    const timer = window.setInterval(() => {
      const current = Date.now(); const idle = current - lastInteractionRef.current
      if (idle >= IDLE_WARNING_MS && !warnedAtRef.current && !idleBusyRef.current) {
        warnedAtRef.current = current
        const text = lang === 'en' ? 'Are you still there? If there is no response in 1 minute, I will close this AI support session automatically.' : 'Apakah masih ada yang bisa saya bantu? Jika dalam 1 menit tidak ada respons, sesi AI ini akan saya tutup otomatis.'
        void typeAssistant(text, 'idle_warning')
      }
      if (idle >= IDLE_CLOSE_MS && warnedAtRef.current && !idleBusyRef.current) void closeSession('idle_timeout')
    }, 1000)
    return () => window.clearInterval(timer)
  }, [closeSession, lang, sessionId, stage, supportMode, typeAssistant])

  const newSession = () => {
    setStage('ready'); setSessionId(''); setSessionRef(''); setWalletRef(''); setSupportMode('ai'); setAssignedAdmin(''); setStartedAt(null); setEndedAt(null); setMessages([]); seenServerIdsRef.current.clear()
    setIntakeMode('help'); setSubject(''); setCategory('payment_wallet'); setReferenceId(''); setDetail(''); setImpact('normal'); setStartedWhen('today'); setTransactionType('deposit'); setVisibleStatus('failed'); setPaymentMethod(''); setPolicyTopic('payment_refund'); setDraft(''); setError(''); setCooldownUntil(0); warnedAtRef.current = null; saveActive(null); touch()
  }

  const duration = startedAt ? (endedAt || now) - startedAt : 0
  const cooldownBase = supportMode === 'ai' ? CLIENT_COOLDOWN_MS : 1500
  const cooldownPercent = cooldownLeft > 0 ? Math.max(0, Math.min(100, (cooldownLeft / cooldownBase) * 100)) : 0
  const phaseLabel = phase === 'understanding' ? (lang === 'en' ? 'Understanding your request…' : 'Memahami masalah…') : phase === 'searching' ? (lang === 'en' ? 'Checking account information…' : 'Memeriksa informasi akun…') : phase === 'thinking' ? (lang === 'en' ? 'Preparing the clearest answer…' : 'Menyiapkan jawaban…') : phase === 'typing' ? (lang === 'en' ? 'DLavie Assistant is typing…' : 'DLavie Assistant sedang mengetik…') : ''
  const statusText = supportMode === 'admin' ? `${copy.adminOnline}${assignedAdmin ? ` · ${assignedAdmin}` : ''}` : supportMode === 'admin_pending' ? copy.waitingAdmin : copy.aiMode
  const openPanel = () => {
    setOpen(true); setUnread(0); setToast(null); touch()
    requestAnimationFrame(() => { syncAuth(); if (supportMode !== 'ai') void syncHumanThread(true) })
  }

  return (
    <div className={`dlv-assistant${open ? ' is-open' : ''} mode-${supportMode}`} onPointerDown={touch} onKeyDown={touch}>
      {toast && !open && <button type="button" className={`dlv-assistant-toast is-${toast.kind}`} onClick={openPanel}><span><i />{toast.title}</span><strong>{toast.body}</strong><b>Open →</b></button>}
      {!open && (
        <button className="dlv-assistant-launcher" type="button" onClick={openPanel} aria-label="Buka DLavie Assistant" data-mode={supportMode}>
          <span className="dlv-launcher-avatar"><AssistantAvatar small phase={supportMode === 'ai' && authorized ? 'wave' : 'idle'} /><i /></span>
          <span className="dlv-launcher-copy"><strong>DLavie Assistant</strong><small>{statusText}</small></span>
          <span className="dlv-launcher-arrow">↗</span>
          {unread > 0 && <b className="dlv-assistant-unread">{Math.min(unread, 9)}</b>}
        </button>
      )}

      {open && (
        <section className="dlv-assistant-panel" aria-label="DLavie Assistant live support">
          <header className="dlv-assistant-header">
            <div className="dlv-assistant-identity"><AssistantAvatar phase={phase} /><span><strong>{copy.title}</strong><small><i /> {copy.online} · {statusText}</small></span></div>
            <div className="dlv-assistant-header-actions">
              {sessionId && stage !== 'ended' && <button type="button" className="dlv-assistant-end" onClick={() => void closeSession('user_closed')} disabled={busy}>{copy.end}</button>}
              <button type="button" className="dlv-assistant-close" onClick={() => setOpen(false)} aria-label="Tutup Assistant">×</button>
            </div>
          </header>

          {!authorized ? (
            <div className="dlv-assistant-guest">
              <AssistantAvatar phase="wave" /><span>MEMBER SUPPORT</span><h3>{copy.guest}</h3><p>{copy.guestBody}</p>
              <button type="button" onClick={() => { document.querySelector<HTMLButtonElement>('.avatar-button')?.click(); setOpen(false) }}>{copy.signIn}<b>→</b></button>
              <a href="#/docs/overview">{lang === 'en' ? 'Read DLavie documentation' : 'Baca dokumentasi DLavie'} ↗</a>
            </div>
          ) : (
            <>
              <div className="dlv-assistant-sessionbar">
                <div><small>{copy.session}</small><strong>{sessionRef || '—'}</strong></div>
                <div><small>{copy.elapsed}</small><strong className="dlv-assistant-timer">{formatDuration(duration)}</strong></div>
                <div><small>{supportMode === 'admin' ? 'SUPPORT' : 'USER'}</small><strong>{supportMode === 'admin' ? (assignedAdmin || 'DLavie Admin') : (profile?.id || '—')}</strong></div>
              </div>

              {supportMode !== 'ai' && stage !== 'ended' && <div className={`dlv-assistant-handoff-banner is-${supportMode}`}><i /><span><strong>{supportMode === 'admin' ? copy.adminOnline : copy.waitingAdmin}</strong><small>{supportMode === 'admin' ? (lang === 'en' ? 'AI replies are paused. You are chatting with human support.' : 'Balasan AI dihentikan. Kamu sedang chat dengan human support.') : (lang === 'en' ? 'Your transcript is in the admin queue. You can keep sending details.' : 'Transcript sudah masuk antrean admin. Kamu tetap bisa mengirim detail tambahan.')}</small></span></div>}

              <div className="dlv-assistant-body" ref={scrollRef}>
                {stage === 'ready' && (
                  <div className="dlv-assistant-ready">
                    <span>{copy.readyEyebrow}</span><h3>{copy.readyTitle}</h3><p>{copy.readyBody}</p>
                    <div className="dlv-assistant-ready-meta"><div><small>ENGINE</small><strong>DLavie v4</strong></div><div><small>FALLBACK</small><strong>Human admin</strong></div><div><small>PRIVACY</small><strong>User-scoped</strong></div></div>
                    {error && <div className="dlv-assistant-error">{error}</div>}
                    <button type="button" className="dlv-assistant-start" onClick={() => void startSession()} disabled={busy}><span>{busy ? (lang === 'en' ? 'Starting…' : 'Menyiapkan sesi…') : copy.start}</span><b>→</b></button>
                  </div>
                )}

                {stage !== 'ready' && <div className="dlv-assistant-thread">
                  {messages.map((message) => <AssistantMessage key={message.id} message={message} formatter={messageTimeFormatter} />)}
                  {busy && phaseLabel && <div className="dlv-assistant-process"><AssistantAvatar small phase={phase} /><div><span>{phaseLabel}</span><i><b /><b /><b /></i></div></div>}
                </div>}

                {stage === 'quick' && <div className="dlv-assistant-quick"><p>{copy.quickHint}</p><button type="button" onClick={() => void chooseHelp('help')}><span><b>✦</b><strong>{copy.help}</strong></span><i>→</i></button><button type="button" onClick={() => void chooseHelp('transaction')}><span><b>↗</b><strong>{copy.transaction}</strong></span><i>→</i></button><button type="button" onClick={() => void chooseHelp('policy')}><span><b>§</b><strong>{copy.policy}</strong></span><i>→</i></button></div>}

                {stage === 'intake' && (
                  <form className={`dlv-assistant-intake intake-${intakeMode}`} data-intake={intakeMode} onSubmit={submitIntake}>
                    <div><span>{intakeCopy.eyebrow}</span><h3>{intakeCopy.title}</h3><p>{intakeCopy.body}</p></div>

                    {intakeMode === 'help' && <>
                      <label><span>{lang === 'en' ? 'What do you need help with?' : 'Apa yang ingin dibantu?'}</span><input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder={lang === 'en' ? 'Example: I do not understand how to deposit' : 'Contoh: saya bingung cara melakukan deposit'} maxLength={120} /></label>
                      <label><span>{lang === 'en' ? 'Issue area' : 'Area masalah'}</span><select value={category} onChange={(event) => setCategory(event.target.value)}>{Object.entries(copy.categories).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
                      <div className="dlv-intake-split">
                        <label><span>{lang === 'en' ? 'Impact' : 'Dampak'}</span><select value={impact} onChange={(event) => setImpact(event.target.value)}><option value="question">{lang === 'en' ? 'Just a question' : 'Hanya pertanyaan'}</option><option value="normal">{lang === 'en' ? 'Blocking one action' : 'Menghambat satu proses'}</option><option value="high">{lang === 'en' ? 'Cannot continue' : 'Tidak bisa melanjutkan'}</option></select></label>
                        <label><span>{lang === 'en' ? 'Started' : 'Mulai terjadi'}</span><select value={startedWhen} onChange={(event) => setStartedWhen(event.target.value)}><option value="just_now">{lang === 'en' ? 'Just now' : 'Baru saja'}</option><option value="today">{lang === 'en' ? 'Today' : 'Hari ini'}</option><option value="days">{lang === 'en' ? 'A few days' : 'Beberapa hari'}</option><option value="not_problem">{lang === 'en' ? 'Not a problem / how-to' : 'Bukan error / hanya ingin tahu'}</option></select></label>
                      </div>
                      <label><span>{lang === 'en' ? 'Describe the situation' : 'Ceritakan situasinya'}</span><textarea value={detail} onChange={(event) => setDetail(event.target.value)} placeholder={lang === 'en' ? 'What are you trying to do, and where are you confused or blocked?' : 'Apa yang sedang kamu coba lakukan, dan di bagian mana kamu bingung atau terhambat?'} maxLength={700} rows={4} /></label>
                    </>}

                    {intakeMode === 'transaction' && <>
                      <label><span>{lang === 'en' ? 'Transaction type' : 'Jenis transaksi'}</span><select value={transactionType} onChange={(event) => setTransactionType(event.target.value)}><option value="deposit">Deposit / wallet</option><option value="order">Order / nomor</option><option value="refund">Refund</option></select></label>
                      <label><span>{lang === 'en' ? 'Reference ID · required' : 'Reference ID · wajib'}</span><input value={referenceId} onChange={(event) => setReferenceId(event.target.value.trimStart())} placeholder="DLVDEP-… / Order ID" maxLength={110} required /></label>
                      <div className="dlv-intake-split">
                        <label><span>{lang === 'en' ? 'Status you see' : 'Status yang terlihat'}</span><select value={visibleStatus} onChange={(event) => setVisibleStatus(event.target.value)}><option value="failed">Failed / gagal</option><option value="pending">Pending</option><option value="paid">Paid / berhasil</option><option value="expired">Expired</option><option value="missing">{lang === 'en' ? 'Missing / not shown' : 'Tidak muncul'}</option><option value="other">{lang === 'en' ? 'Other' : 'Lainnya'}</option></select></label>
                        <label><span>{lang === 'en' ? 'Method / provider' : 'Metode / provider'}</span><input value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} placeholder="QRIS / GoPay / BCA / provider" maxLength={60} /></label>
                      </div>
                      <label><span>{lang === 'en' ? 'What looks wrong?' : 'Apa yang tidak sesuai?'}</span><textarea value={detail} onChange={(event) => setDetail(event.target.value)} placeholder={lang === 'en' ? 'Example: payment failed after selecting QRIS, but I want to know whether any balance was charged.' : 'Contoh: pembayaran gagal setelah memilih QRIS, saya ingin memastikan apakah ada saldo yang terpotong.'} maxLength={700} rows={4} /></label>
                    </>}

                    {intakeMode === 'policy' && <>
                      <label><span>{lang === 'en' ? 'Policy topic' : 'Topik kebijakan'}</span><select value={policyTopic} onChange={(event) => setPolicyTopic(event.target.value)}><option value="terms">Terms of Service</option><option value="privacy">Privacy Policy</option><option value="payment_refund">Payment & Refund</option><option value="acceptable_use">Acceptable Use</option><option value="service_disclosure">Service Disclosure</option><option value="account_access">{lang === 'en' ? 'Account & access rules' : 'Aturan akun & akses'}</option></select></label>
                      <label><span>{lang === 'en' ? 'Your question or scenario' : 'Pertanyaan atau skenario'}</span><textarea value={detail} onChange={(event) => setDetail(event.target.value)} placeholder={lang === 'en' ? 'Example: if an OTP never arrives before expiry, when can a refund apply?' : 'Contoh: jika OTP tidak pernah masuk sampai sesi expired, kapan refund bisa berlaku?'} maxLength={900} rows={5} /></label>
                      <p className="dlv-intake-note">{lang === 'en' ? 'Assistant will answer from DLavie documentation first. It will request a transaction reference only if your question becomes a case-specific review.' : 'Assistant akan menjawab dari dokumentasi DLavie terlebih dahulu. Reference transaksi baru diminta jika pertanyaan berubah menjadi pemeriksaan kasus tertentu.'}</p>
                    </>}

                    {error && <div className="dlv-assistant-error">{error}</div>}
                    <button type="submit" disabled={!intakeValid || busy}><span>{busy ? (lang === 'en' ? 'Reviewing…' : 'Memeriksa…') : intakeCopy.submit}</span><b>→</b></button>
                  </form>
                )}

                {stage === 'ended' && <div className="dlv-assistant-receipt"><span>SESSION COMPLETE</span><h3>{copy.closed}</h3><div><p><small>{copy.sessionReceipt}</small><strong>{sessionRef}</strong></p><p><small>{copy.elapsed}</small><strong>{formatDuration(duration)}</strong></p><p><small>USER ID</small><strong>{profile?.id}</strong></p><p><small>WALLET</small><strong>{walletRef || '—'}</strong></p></div><button type="button" onClick={newSession}>{copy.newSession}<b>→</b></button></div>}
              </div>

              {stage === 'chat' && <div className="dlv-assistant-composer-wrap">
                {error && <div className="dlv-assistant-composer-error">{error}<button type="button" onClick={() => setError('')}>×</button></div>}
                <form className={`dlv-assistant-composer${cooldownLeft > 0 ? ' is-cooldown' : ''}`} onSubmit={sendMessage}>
                  <div className="dlv-assistant-cooldown-track" style={{ '--cooldown': `${cooldownPercent}%` } as React.CSSProperties} />
                  <textarea value={draft} onChange={(event) => { setDraft(event.target.value); touch() }} disabled={busy || cooldownLeft > 0} placeholder={cooldownLeft > 0 ? `${copy.cooldown} · ${(cooldownLeft / 1000).toFixed(1)}s` : copy.placeholder} rows={1} maxLength={1600} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit() } }} />
                  <button type="submit" disabled={!draft.trim() || busy || cooldownLeft > 0} aria-label={copy.send}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m4 4 17 8-17 8 3-8-3-8Z"/><path d="M7 12h14"/></svg></button>
                </form>
                <div className="dlv-assistant-composer-meta"><span>{draft.length}/1600</span><span>{supportMode === 'ai' ? (lang === 'en' ? 'DLavie Engine · fallback ready' : 'DLavie Engine · fallback siap') : statusText}</span></div>
              </div>}
            </>
          )}
        </section>
      )}
    </div>
  )
}
