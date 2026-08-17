import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'

type QueueItem = {
  id: string
  session_id: string
  user_id: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  status: 'pending' | 'claimed'
  reason: string
  summary?: string | null
  assigned_admin?: string | null
  created_at: string
  session?: { username?: string; subject?: string; category?: string; reference_id?: string; support_mode?: string; started_at?: string; last_activity_at?: string } | null
}
type ThreadMessage = { id: string; role: 'user' | 'assistant' | 'admin' | 'system'; content: string; metadata?: { admin?: string; kind?: string }; created_at: string }
type ThreadData = { session?: { id: string; user_id?: string; username?: string; subject?: string; category?: string; reference_id?: string; support_mode?: string; assigned_admin?: string; started_at?: string; last_activity_at?: string }; escalation?: QueueItem | null; messages?: ThreadMessage[] }

const API = 'https://ydaeukhqwishlrjyfktk.supabase.co/functions/v1/dlavie-assistant-admin'
const TOKEN_KEY = 'dlavie-admin-support-session-v1'

async function request(action: string, token: string, extra: Record<string, string> = {}) {
  const body = new URLSearchParams({ action, ...(token ? { admin_token: token } : {}), ...extra })
  const response = await fetch(API, { method: 'POST', body })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || !data.ok) throw new Error(data.error || 'admin_support_error')
  return data
}
function time(value?: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

export default function DLavieAdminSupport() {
  const enabled = useMemo(() => new URLSearchParams(window.location.search).get('support-admin') === '1', [])
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY) || '')
  const [code, setCode] = useState('')
  const [adminName, setAdminName] = useState('DLavie Admin')
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [selected, setSelected] = useState('')
  const [thread, setThread] = useState<ThreadData | null>(null)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const loadQueue = useCallback(async () => {
    if (!token) return
    try {
      const data = await request('queue', token)
      setQueue(data.queue || [])
      if (data.admin_name) setAdminName(data.admin_name)
      if (selected && !(data.queue || []).some((item: QueueItem) => item.session_id === selected) && thread?.session?.support_mode !== 'admin') setSelected('')
    } catch (err) {
      if (String(err).includes('expired') || String(err).includes('auth')) { sessionStorage.removeItem(TOKEN_KEY); setToken('') }
      else setError(err instanceof Error ? err.message : 'Queue gagal dimuat.')
    }
  }, [selected, thread?.session?.support_mode, token])

  const loadThread = useCallback(async () => {
    if (!token || !selected) return
    try { setThread(await request('thread', token, { session_id: selected })) }
    catch (err) { setError(err instanceof Error ? err.message : 'Thread gagal dimuat.') }
  }, [selected, token])

  useEffect(() => {
    if (!enabled || !token) return
    void loadQueue()
    const timer = window.setInterval(() => void loadQueue(), 5000)
    return () => window.clearInterval(timer)
  }, [enabled, loadQueue, token])

  useEffect(() => {
    if (!enabled || !token || !selected) return
    void loadThread()
    const timer = window.setInterval(() => void loadThread(), 2600)
    return () => window.clearInterval(timer)
  }, [enabled, loadThread, selected, token])

  if (!enabled) return null

  const login = async (event: FormEvent) => {
    event.preventDefault(); if (!code.trim() || busy) return
    setBusy(true); setError('')
    try {
      const data = await request('login', '', { access_code: code.trim() })
      sessionStorage.setItem(TOKEN_KEY, data.admin_token)
      setToken(data.admin_token); setAdminName(data.admin_name || 'DLavie Admin'); setCode('')
    } catch { setError('Kode admin tidak valid.') }
    finally { setBusy(false) }
  }

  const claim = async () => {
    if (!selected || busy) return
    setBusy(true); setError('')
    try { await request('claim', token, { session_id: selected }); await Promise.all([loadQueue(), loadThread()]) }
    catch (err) { setError(err instanceof Error ? err.message : 'Sesi gagal di-claim.') }
    finally { setBusy(false) }
  }

  const send = async (event: FormEvent) => {
    event.preventDefault(); const text = draft.trim(); if (!text || !selected || busy) return
    setBusy(true); setError('')
    try { await request('reply', token, { session_id: selected, message: text }); setDraft(''); await loadThread() }
    catch (err) { setError(err instanceof Error ? err.message : 'Balasan gagal dikirim.') }
    finally { setBusy(false) }
  }

  const resolve = async () => {
    if (!selected || busy) return
    setBusy(true); setError('')
    try {
      await request('resolve', token, { session_id: selected })
      setSelected(''); setThread(null); await loadQueue()
    } catch (err) { setError(err instanceof Error ? err.message : 'Kasus gagal diselesaikan.') }
    finally { setBusy(false) }
  }

  if (!token) return (
    <div className="dlv-admin-shell is-login">
      <form className="dlv-admin-login" onSubmit={login}>
        <span>DLAVIE INTERNAL</span><h1>Support Console</h1><p>Masuk untuk menangani sesi yang di-escalate dari DLavie Intelligence Engine.</p>
        <label><small>ADMIN ACCESS CODE</small><input type="password" value={code} onChange={(event) => setCode(event.target.value)} autoComplete="off" placeholder="DLV-ADM-…" /></label>
        {error && <div className="dlv-admin-error">{error}</div>}
        <button disabled={busy || !code.trim()}>{busy ? 'Memverifikasi…' : 'Masuk ke Support Queue'}<b>→</b></button>
      </form>
    </div>
  )

  return (
    <div className="dlv-admin-shell">
      <header className="dlv-admin-topbar"><div><span>DLAVIE INTERNAL</span><strong>Human Support Console</strong></div><div><i />{adminName}<button type="button" onClick={() => { sessionStorage.removeItem(TOKEN_KEY); setToken('') }}>Keluar</button></div></header>
      <div className="dlv-admin-layout">
        <aside className="dlv-admin-queue">
          <div className="dlv-admin-queue-head"><span>ESCALATION QUEUE</span><strong>{queue.length} aktif</strong></div>
          {queue.length === 0 ? <div className="dlv-admin-empty">Tidak ada sesi yang menunggu admin.</div> : queue.map((item) => (
            <button type="button" key={item.id} onClick={() => setSelected(item.session_id)} className={selected === item.session_id ? 'is-active' : ''}>
              <div><span className={`priority-${item.priority}`}>{item.priority}</span><small>{item.status === 'claimed' ? 'CLAIMED' : 'WAITING'}</small></div>
              <strong>{item.session?.subject || 'Support request'}</strong><p>{item.summary || item.reason}</p>
              <footer><span>{item.session?.username || item.user_id}</span><time>{time(item.created_at)}</time></footer>
            </button>
          ))}
        </aside>

        <main className="dlv-admin-thread">
          {!selected || !thread ? <div className="dlv-admin-placeholder"><span>HUMAN HANDOFF</span><h2>Pilih sesi dari antrean.</h2><p>Transcript AI, User ID, subject, reference, dan alasan escalation akan muncul di sini.</p></div> : <>
            <header className="dlv-admin-thread-head">
              <div><span>{thread.session?.support_mode === 'admin' ? 'ADMIN ONLINE' : 'WAITING FOR ADMIN'}</span><h2>{thread.session?.subject || 'Support session'}</h2><p>{thread.session?.username} · {thread.session?.user_id} · {thread.session?.reference_id || 'No reference'}</p></div>
              <div>{thread.session?.support_mode !== 'admin' ? <button type="button" className="dlv-admin-claim" onClick={() => void claim()} disabled={busy}>Claim session</button> : <button type="button" className="dlv-admin-resolve" onClick={() => void resolve()} disabled={busy}>Tandai selesai</button>}</div>
            </header>
            <section className="dlv-admin-case-meta"><div><small>REASON</small><strong>{thread.escalation?.reason || '—'}</strong></div><div><small>PRIORITY</small><strong>{thread.escalation?.priority || '—'}</strong></div><div><small>STARTED</small><strong>{time(thread.session?.started_at)}</strong></div><div><small>REFERENCE</small><strong>{thread.session?.reference_id || '—'}</strong></div></section>
            <div className="dlv-admin-messages">
              {(thread.messages || []).map((message) => <article key={message.id} className={`is-${message.role}`}><div><span>{message.role === 'assistant' ? 'DLavie Engine' : message.role === 'admin' ? (message.metadata?.admin || 'DLavie Admin') : message.role === 'user' ? (thread.session?.username || 'User') : 'System'}</span><time>{time(message.created_at)}</time></div><p>{message.content}</p></article>)}
            </div>
            <form className="dlv-admin-composer" onSubmit={send}><textarea value={draft} onChange={(event) => setDraft(event.target.value)} disabled={thread.session?.support_mode !== 'admin' || busy} placeholder={thread.session?.support_mode === 'admin' ? 'Balas sebagai DLavie Admin…' : 'Claim sesi terlebih dahulu…'} maxLength={1800} /><button disabled={!draft.trim() || thread.session?.support_mode !== 'admin' || busy}>Kirim <b>→</b></button></form>
          </>}
          {error && <div className="dlv-admin-floating-error">{error}<button onClick={() => setError('')}>×</button></div>}
        </main>
      </div>
    </div>
  )
}
