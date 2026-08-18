import { useEffect } from 'react'

const PROMPTS: Record<string, { id: string[]; en: string[] }> = {
  home: {
    id: ['Cara deposit', 'Cek saldo', 'OTP belum masuk', 'Aturan refund', 'Hubungi admin'],
    en: ['How to deposit', 'Check balance', 'OTP not received', 'Refund rules', 'Contact admin'],
  },
  market: {
    id: ['Cara beli nomor', 'Pilih provider', 'Kenapa stok berubah', 'Cek saldo', 'Hubungi admin'],
    en: ['How to buy a number', 'Choose a provider', 'Why stock changes', 'Check balance', 'Contact admin'],
  },
  activity: {
    id: ['Cek deposit terakhir', 'OTP belum masuk', 'Arti status expired', 'Cek order', 'Hubungi admin'],
    en: ['Check latest deposit', 'OTP not received', 'What expired means', 'Check order', 'Contact admin'],
  },
  help: {
    id: ['Cara deposit', 'Cara beli nomor', 'Aturan refund', 'Keamanan akun', 'Hubungi admin'],
    en: ['How to deposit', 'How to buy a number', 'Refund rules', 'Account security', 'Contact admin'],
  },
  legal: {
    id: ['Aturan refund', 'Privasi data', 'Terms of Service', 'Acceptable Use', 'Tanya admin'],
    en: ['Refund policy', 'Data privacy', 'Terms of Service', 'Acceptable Use', 'Ask admin'],
  },
}

function lang() { return localStorage.getItem('dlavie-language') === 'en' ? 'en' : 'id' }
function routeKey() {
  const route = (location.hash || '#/home').toLowerCase()
  if (route.includes('market')) return 'market'
  if (route.includes('activity')) return 'activity'
  if (route.includes('help')) return 'help'
  if (route.includes('legal')) return 'legal'
  return 'home'
}
function routeLabel() {
  const key = routeKey()
  if (key === 'market') return 'Market'
  if (key === 'activity') return lang() === 'en' ? 'Activity' : 'Aktivitas'
  if (key === 'help') return 'FAQ'
  if (key === 'legal') return 'Legal Center'
  return lang() === 'en' ? 'Home' : 'Beranda'
}
function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, html = '') {
  const node = document.createElement(tag)
  node.className = className
  if (html) node.innerHTML = html
  return node
}
function setTextarea(textarea: HTMLTextAreaElement, value: string) {
  const descriptor = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')
  descriptor?.set?.call(textarea, value)
  textarea.dispatchEvent(new Event('input', { bubbles: true }))
  textarea.focus({ preventScroll: true })
}
function stageOf(panel: HTMLElement) {
  if (panel.querySelector('.dlv-assistant-guest')) return 'guest'
  if (panel.querySelector('.dlv-assistant-receipt')) return 'ended'
  if (panel.querySelector('.dlv-assistant-composer-wrap')) return 'chat'
  if (panel.querySelector('.dlv-assistant-intake')) return 'intake'
  if (panel.querySelector('.dlv-assistant-quick')) return 'quick'
  return 'ready'
}

export default function DLavieAssistantUIV2() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.dlv-assistant')
    if (!root) return
    root.dataset.ui = 'v4'
    let frame = 0
    let previousStage = ''

    const ensureFlow = (panel: HTMLElement, stage: string) => {
      const sessionBar = panel.querySelector<HTMLElement>('.dlv-assistant-sessionbar')
      if (!sessionBar || stage === 'guest') return
      let flow = panel.querySelector<HTMLElement>('.dlv-ui-flow')
      if (!flow) {
        flow = el('div', 'dlv-ui-flow')
        const labels = lang() === 'en' ? ['Start', 'Choose', 'Context', 'Chat'] : ['Mulai', 'Pilih', 'Konteks', 'Chat']
        flow.innerHTML = labels.map((label, index) => `${index ? '<em></em>' : ''}<span data-step="${index}"><i>${index + 1}</i><b>${label}</b></span>`).join('')
        sessionBar.insertAdjacentElement('afterend', flow)
      }
      const order = ['ready', 'quick', 'intake', 'chat']
      const active = stage === 'ended' ? 4 : Math.max(0, order.indexOf(stage))
      flow.querySelectorAll<HTMLElement>('[data-step]').forEach((node, index) => {
        node.classList.toggle('is-active', index === active)
        node.classList.toggle('is-done', stage === 'ended' || index < active)
      })
      flow.classList.toggle('is-complete', stage === 'ended')
    }

    const ensureMode = (panel: HTMLElement, stage: string) => {
      if (stage === 'ended') root.dataset.sessionVisual = 'closed'
      else if (['quick', 'intake', 'chat'].includes(stage)) root.dataset.sessionVisual = 'active'

      const actions = panel.querySelector<HTMLElement>('.dlv-assistant-header-actions')
      if (!actions) return
      let chip = actions.querySelector<HTMLElement>('.dlv-ui-mode-chip')
      if (!chip) {
        chip = el('span', 'dlv-ui-mode-chip', '<i></i><b></b>')
        actions.prepend(chip)
      }
      const closed = root.dataset.sessionVisual === 'closed'
      const admin = !closed && root.classList.contains('mode-admin')
      const pending = !closed && root.classList.contains('mode-admin_pending')
      chip.dataset.mode = closed ? 'closed' : admin ? 'admin' : pending ? 'pending' : 'ai'
      const label = chip.querySelector('b')
      if (label) label.textContent = closed ? (lang() === 'en' ? 'CLOSED' : 'SELESAI') : admin ? 'ADMIN' : pending ? (lang() === 'en' ? 'QUEUE' : 'ANTRE') : 'ENGINE'
    }

    const ensureReady = (panel: HTMLElement) => {
      const ready = panel.querySelector<HTMLElement>('.dlv-assistant-ready')
      if (!ready || ready.querySelector('.dlv-ui-capabilities')) return
      const capabilities = el('div', 'dlv-ui-capabilities')
      capabilities.innerHTML = lang() === 'en'
        ? '<div><i>↗</i><span><b>Payments & wallet</b><small>Deposit, balance, status and references</small></span></div><div><i>◎</i><span><b>Order & OTP</b><small>Sessions, expiry and delivery status</small></span></div><div><i>§</i><span><b>Rules & documentation</b><small>Policies, FAQ and internal guidance</small></span></div><div><i>◇</i><span><b>Human fallback</b><small>Manual and sensitive cases go to admin</small></span></div>'
        : '<div><i>↗</i><span><b>Pembayaran & wallet</b><small>Deposit, saldo, status dan reference</small></span></div><div><i>◎</i><span><b>Order & OTP</b><small>Sesi, expiry dan status penerimaan</small></span></div><div><i>§</i><span><b>Aturan & dokumentasi</b><small>Kebijakan, FAQ dan panduan internal</small></span></div><div><i>◇</i><span><b>Fallback manusia</b><small>Kasus manual dan sensitif diteruskan ke admin</small></span></div>'
      const meta = ready.querySelector('.dlv-assistant-ready-meta')
      if (meta) ready.insertBefore(capabilities, meta)
      const trust = el('div', 'dlv-ui-trustline')
      trust.innerHTML = `<i></i><span>${lang() === 'en' ? 'User-scoped context · server-side session timeout' : 'Konteks dibatasi ke user · timeout sesi berjalan di server'}</span>`
      ready.querySelector('.dlv-assistant-start')?.insertAdjacentElement('afterend', trust)
    }

    const enhanceQuick = (panel: HTMLElement) => {
      const quick = panel.querySelector<HTMLElement>('.dlv-assistant-quick')
      if (!quick) return
      if (!quick.querySelector('.dlv-ui-quick-heading')) {
        const heading = el('div', 'dlv-ui-quick-heading')
        heading.innerHTML = `<span>${lang() === 'en' ? 'STEP 2 OF 4' : 'LANGKAH 2 DARI 4'}</span><strong>${lang() === 'en' ? 'Choose the closest request type' : 'Pilih jenis kebutuhan yang paling sesuai'}</strong>`
        quick.prepend(heading)
      }
      const descriptions = lang() === 'en'
        ? ['Guidance, troubleshooting or general questions', 'Inspect a deposit, order or refund record', 'Understand Terms, Privacy, Refund or service rules']
        : ['Panduan, troubleshooting, atau pertanyaan umum', 'Periksa record deposit, order, atau refund', 'Pahami Terms, Privasi, Refund, atau aturan layanan']
      quick.querySelectorAll<HTMLButtonElement>(':scope > button').forEach((button, index) => {
        const holder = button.querySelector<HTMLElement>(':scope > span')
        if (!holder || holder.querySelector('small')) return
        const small = document.createElement('small')
        small.textContent = descriptions[index] || ''
        holder.appendChild(small)
      })
    }

    const enhanceIntake = (panel: HTMLElement) => {
      const intake = panel.querySelector<HTMLElement>('.dlv-assistant-intake')
      if (!intake || intake.querySelector('.dlv-ui-intake-progress')) return
      const progress = el('div', 'dlv-ui-intake-progress')
      progress.innerHTML = `<span><i></i>${lang() === 'en' ? 'Only relevant details' : 'Isi hanya detail yang relevan'}</span><b>3 / 4</b>`
      intake.prepend(progress)
    }

    const ensureComposerTools = (panel: HTMLElement) => {
      const wrap = panel.querySelector<HTMLElement>('.dlv-assistant-composer-wrap')
      if (!wrap) return
      if (!wrap.querySelector('.dlv-ui-chat-context')) {
        const context = el('div', 'dlv-ui-chat-context')
        context.innerHTML = `<span><i></i><b>${lang() === 'en' ? 'Active page' : 'Halaman aktif'}</b></span><small>${routeLabel()}</small>`
        wrap.prepend(context)
      } else {
        const label = wrap.querySelector<HTMLElement>('.dlv-ui-chat-context small')
        if (label) label.textContent = routeLabel()
      }
      let strip = wrap.querySelector<HTMLElement>('.dlv-ui-prompt-strip')
      if (!strip) {
        strip = el('div', 'dlv-ui-prompt-strip')
        const form = wrap.querySelector('.dlv-assistant-composer')
        if (form) wrap.insertBefore(strip, form)
      }
      const list = PROMPTS[routeKey()] || PROMPTS.home
      const prompts = lang() === 'en' ? list.en : list.id
      const signature = `${routeKey()}-${lang()}`
      if (strip.dataset.signature !== signature) {
        strip.dataset.signature = signature
        strip.innerHTML = prompts.map((item, index) => `<button type="button" data-prompt="${index}">${item}</button>`).join('')
      }
    }

    const enhanceLatestMessage = (panel: HTMLElement) => {
      const replies = [...panel.querySelectorAll<HTMLElement>('.dlv-assistant-message.is-assistant:not(.is-typing), .dlv-assistant-message.is-admin')]
      const latest = replies.at(-1)
      panel.querySelectorAll<HTMLElement>('.dlv-ui-message-actions').forEach((actions) => {
        if (!latest || !latest.contains(actions)) actions.remove()
      })
      if (!latest || latest.querySelector('.dlv-ui-message-actions')) return
      const bubble = latest.querySelector<HTMLElement>(':scope > div')
      const text = latest.querySelector('p')?.textContent?.trim()
      if (!bubble || !text) return
      const isHumanMode = root.classList.contains('mode-admin') || root.classList.contains('mode-admin_pending')
      const actions = el('div', 'dlv-ui-message-actions')
      if (latest.classList.contains('is-admin')) {
        actions.innerHTML = `<button type="button" data-message-action="copy">${lang() === 'en' ? 'Copy' : 'Salin'}</button><button type="button" data-message-action="reply-admin">${lang() === 'en' ? 'Reply' : 'Balas admin'}</button>`
      } else if (isHumanMode) {
        actions.innerHTML = `<button type="button" data-message-action="copy">${lang() === 'en' ? 'Copy' : 'Salin'}</button>`
      } else {
        actions.innerHTML = `<button type="button" data-message-action="copy">${lang() === 'en' ? 'Copy' : 'Salin'}</button><button type="button" data-message-action="unclear">${lang() === 'en' ? 'Explain simply' : 'Jelaskan sederhana'}</button><button type="button" data-message-action="admin">${lang() === 'en' ? 'Ask admin' : 'Minta admin'}</button>`
      }
      bubble.appendChild(actions)
    }

    const patchLauncher = () => {
      const launcher = root.querySelector<HTMLElement>('.dlv-assistant-launcher')
      if (!launcher) return
      const closed = root.dataset.sessionVisual === 'closed'
      if (closed) {
        launcher.dataset.mode = 'ai'
        const small = launcher.querySelector<HTMLElement>('.dlv-launcher-copy small')
        if (small) small.textContent = lang() === 'en' ? 'Available · new session' : 'Tersedia · sesi baru'
      }
    }

    const patch = () => {
      frame = 0
      const panel = root.querySelector<HTMLElement>('.dlv-assistant-panel')
      if (!panel) { patchLauncher(); return }
      const stage = stageOf(panel)
      panel.dataset.uiStage = stage
      if (stage !== previousStage) {
        panel.classList.remove('dlv-ui-stage-enter')
        requestAnimationFrame(() => panel.classList.add('dlv-ui-stage-enter'))
        previousStage = stage
      }
      ensureFlow(panel, stage)
      ensureMode(panel, stage)
      ensureReady(panel)
      enhanceQuick(panel)
      enhanceIntake(panel)
      ensureComposerTools(panel)
      enhanceLatestMessage(panel)
      patchLauncher()
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(patch) }

    const click = async (event: Event) => {
      const target = event.target as HTMLElement | null
      if (!target) return
      const prompt = target.closest<HTMLButtonElement>('[data-prompt]')
      if (prompt) {
        const list = PROMPTS[routeKey()] || PROMPTS.home
        const value = (lang() === 'en' ? list.en : list.id)[Number(prompt.dataset.prompt || 0)] || ''
        const fast = document.querySelector<HTMLTextAreaElement>('.dlv-fast-composer-input')
        if (fast) {
          fast.value = value
          fast.dispatchEvent(new Event('input', { bubbles: true }))
          fast.focus({ preventScroll: true })
        } else {
          const textarea = root.querySelector<HTMLTextAreaElement>('.dlv-assistant-composer textarea')
          if (textarea) setTextarea(textarea, value)
        }
        return
      }
      const action = target.closest<HTMLButtonElement>('[data-message-action]')
      if (!action) return
      const article = action.closest('.dlv-assistant-message')
      const message = article?.querySelector('p')?.textContent?.trim() || ''
      if (action.dataset.messageAction === 'copy') {
        try { await navigator.clipboard.writeText(message) } catch { /* optional */ }
        const original = action.textContent
        action.textContent = lang() === 'en' ? 'Copied ✓' : 'Tersalin ✓'
        setTimeout(() => { action.textContent = original }, 1100)
        return
      }
      const value = action.dataset.messageAction === 'admin'
        ? (lang() === 'en' ? 'Please hand this session to a human admin.' : 'Tolong lanjutkan sesi ini ke admin manusia.')
        : action.dataset.messageAction === 'reply-admin'
          ? (lang() === 'en' ? 'I am still here. I want to add more information.' : 'Saya masih di sini. Saya ingin menambahkan informasi.')
          : (lang() === 'en' ? 'Explain your previous answer more simply, with a direct answer first and clear steps.' : 'Jelaskan jawaban sebelumnya lebih sederhana. Beri jawaban langsung terlebih dahulu lalu langkah yang jelas.')
      const fast = document.querySelector<HTMLTextAreaElement>('.dlv-fast-composer-input')
      if (fast) {
        fast.value = value
        fast.dispatchEvent(new Event('input', { bubbles: true }))
        fast.focus({ preventScroll: true })
      } else {
        const textarea = root.querySelector<HTMLTextAreaElement>('.dlv-assistant-composer textarea')
        if (textarea) setTextarea(textarea, value)
      }
    }

    const childObserver = new MutationObserver(() => schedule())
    childObserver.observe(root, { childList: true, subtree: true })
    const classObserver = new MutationObserver(() => schedule())
    classObserver.observe(root, { attributes: true, attributeFilter: ['class'] })
    root.addEventListener('click', click)
    window.addEventListener('hashchange', schedule)
    schedule()

    return () => {
      if (frame) cancelAnimationFrame(frame)
      childObserver.disconnect()
      classObserver.disconnect()
      root.removeEventListener('click', click)
      window.removeEventListener('hashchange', schedule)
    }
  }, [])
  return null
}
