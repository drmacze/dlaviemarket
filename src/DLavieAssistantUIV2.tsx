import { useEffect } from 'react'

type PromptSet = { id: string[]; en: string[] }

const DEFAULT_PROMPTS: PromptSet = {
  id: ['Cara deposit', 'Cek saldo', 'OTP belum masuk', 'Aturan refund', 'Hubungi admin'],
  en: ['How to deposit', 'Check balance', 'OTP not received', 'Refund rules', 'Talk to admin'],
}

function currentLang() { return localStorage.getItem('dlavie-language') === 'en' ? 'en' : 'id' }
function routeKey() {
  const route = (location.hash || '#/home').toLowerCase()
  if (route.includes('market')) return 'market'
  if (route.includes('activity')) return 'activity'
  if (route.includes('guide')) return 'guide'
  if (route.includes('security')) return 'security'
  if (route.includes('help')) return 'help'
  if (route.includes('legal')) return 'legal'
  if (route.includes('docs')) return 'docs'
  return 'home'
}
function routeLabel() {
  const en = currentLang() === 'en'
  const labels: Record<string, [string, string]> = {
    home: ['Beranda', 'Home'], market: ['Market', 'Market'], activity: ['Aktivitas', 'Activity'], guide: ['Cara Kerja', 'How it works'],
    security: ['Keamanan', 'Security'], help: ['FAQ', 'FAQ'], legal: ['Legal Center', 'Legal Center'], docs: ['Dokumentasi', 'Documentation'],
  }
  return labels[routeKey()]?.[en ? 1 : 0] || (en ? 'Home' : 'Beranda')
}
function prompts(): PromptSet {
  const key = routeKey()
  if (key === 'activity') return {
    id: ['Cek deposit terakhir', 'OTP belum masuk', 'Arti status expired', 'Cek refund', 'Hubungi admin'],
    en: ['Check latest deposit', 'OTP not received', 'What expired means', 'Check refund', 'Talk to admin'],
  }
  if (key === 'market') return {
    id: ['Cara beli nomor', 'Pilih provider', 'Kenapa stok berubah', 'Cara lihat OTP', 'Hubungi admin'],
    en: ['How to buy a number', 'Choose provider', 'Why stock changes', 'Where to see OTP', 'Talk to admin'],
  }
  if (key === 'security') return {
    id: ['Amankan akun', 'Bedanya User & Wallet ID', 'Privasi data', 'Akun terasa diretas', 'Hubungi admin'],
    en: ['Secure my account', 'User vs Wallet ID', 'Data privacy', 'Account may be hacked', 'Talk to admin'],
  }
  if (key === 'legal') return {
    id: ['Aturan refund', 'Privacy Policy', 'Terms of Service', 'Acceptable Use', 'Tanya admin'],
    en: ['Refund rules', 'Privacy Policy', 'Terms of Service', 'Acceptable Use', 'Ask admin'],
  }
  return DEFAULT_PROMPTS
}
function promptMessage(index: number) {
  const p = prompts()
  const en = currentLang() === 'en'
  const label = (en ? p.en : p.id)[index] || ''
  const detail: Record<string, [string, string]> = {
    'Cara deposit': ['Saya bingung cara deposit. Tolong jelaskan langkahnya dari awal dengan sederhana.', 'How do I make a deposit? Please explain it step by step.'],
    'Cek saldo': ['Tolong bantu jelaskan status saldo wallet saya dan cara mengecek riwayat deposit.', 'Please explain my wallet balance status and how to check deposit history.'],
    'OTP belum masuk': ['OTP saya belum masuk. Apa yang sebaiknya saya cek terlebih dahulu?', 'My OTP has not arrived. What should I check first?'],
    'Aturan refund': ['Tolong jelaskan kapan refund bisa berlaku dan kapan tidak.', 'Please explain when a refund may apply and when it does not.'],
    'Hubungi admin': ['Saya ingin melanjutkan percakapan ini dengan admin manusia.', 'I want to continue this conversation with a human admin.'],
    'Cek deposit terakhir': ['Tolong bantu saya memahami status deposit terakhir di wallet saya.', 'Please help me understand the latest deposit status in my wallet.'],
    'Arti status expired': ['Apa arti status expired dan apa yang harus saya lakukan setelahnya?', 'What does an expired status mean and what should I do next?'],
    'Cek refund': ['Saya ingin memahami status atau kelayakan refund untuk transaksi saya.', 'I want to understand the status or eligibility of a refund for my transaction.'],
    'Cara beli nomor': ['Saya bingung cara membeli nomor virtual. Tolong jelaskan langkahnya.', 'I am confused about how to buy a virtual number. Please explain the steps.'],
    'Pilih provider': ['Bagaimana cara memilih provider yang tepat untuk layanan saya?', 'How should I choose the right provider for my service?'],
    'Kenapa stok berubah': ['Kenapa stok dan harga layanan bisa berubah di Market?', 'Why can stock and prices change in Market?'],
    'Cara lihat OTP': ['Di mana saya bisa melihat OTP dari order yang aktif?', 'Where can I see the OTP for an active order?'],
    'Amankan akun': ['Apa yang harus saya lakukan untuk menjaga akun DLavie tetap aman?', 'What should I do to keep my DLavie account secure?'],
    'Bedanya User & Wallet ID': ['Apa perbedaan User ID, Wallet ID, dan Order ID?', 'What is the difference between User ID, Wallet ID and Order ID?'],
    'Privasi data': ['Data apa yang digunakan DLavie dan bagaimana privasinya dijaga?', 'What data does DLavie use and how is privacy handled?'],
    'Akun terasa diretas': ['Saya khawatir akun saya diakses orang lain. Tolong bantu arahkan langkah aman.', 'I am worried someone else accessed my account. Please guide me through safe next steps.'],
  }
  const found = Object.entries(detail).find(([key]) => label === key || label.toLowerCase() === key.toLowerCase())
  return found ? found[1][en ? 1 : 0] : label
}
function setReactTextareaValue(textarea: HTMLTextAreaElement, value: string) {
  const descriptor = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')
  descriptor?.set?.call(textarea, value)
  textarea.dispatchEvent(new Event('input', { bubbles: true }))
  textarea.focus({ preventScroll: true })
}
function element<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, html = '') {
  const node = document.createElement(tag)
  node.className = className
  if (html) node.innerHTML = html
  return node
}

export default function DLavieAssistantUIV2() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.dlv-assistant')
    if (!root) return
    root.dataset.ui = 'v3'
    let raf = 0
    let lastStage = ''

    const getStage = (panel: HTMLElement) => {
      if (panel.querySelector('.dlv-assistant-guest')) return 'guest'
      if (panel.querySelector('.dlv-assistant-receipt')) return 'ended'
      if (panel.querySelector('.dlv-assistant-composer-wrap')) return 'chat'
      if (panel.querySelector('.dlv-assistant-intake')) return 'intake'
      if (panel.querySelector('.dlv-assistant-quick')) return 'quick'
      return 'ready'
    }

    const ensureFlow = (panel: HTMLElement, stage: string) => {
      const sessionBar = panel.querySelector<HTMLElement>('.dlv-assistant-sessionbar')
      if (!sessionBar || stage === 'guest') return
      let flow = panel.querySelector<HTMLElement>('.dlv-ui-flow')
      if (!flow) {
        const en = currentLang() === 'en'
        flow = element('div', 'dlv-ui-flow')
        flow.innerHTML = `
          <span data-step="ready"><i>1</i><b>${en ? 'Start' : 'Mulai'}</b></span><em></em>
          <span data-step="quick"><i>2</i><b>${en ? 'Choose topic' : 'Pilih topik'}</b></span><em></em>
          <span data-step="intake"><i>3</i><b>${en ? 'Add context' : 'Isi konteks'}</b></span><em></em>
          <span data-step="chat"><i>4</i><b>Chat</b></span>`
        sessionBar.insertAdjacentElement('afterend', flow)
      }
      const order = ['ready', 'quick', 'intake', 'chat']
      const active = stage === 'ended' ? 4 : Math.max(0, order.indexOf(stage))
      flow.querySelectorAll<HTMLElement>('[data-step]').forEach((node, index) => {
        node.classList.toggle('is-active', index === active)
        node.classList.toggle('is-done', stage === 'ended' || index < active)
        if (index === active) node.setAttribute('aria-current', 'step'); else node.removeAttribute('aria-current')
      })
      flow.classList.toggle('is-complete', stage === 'ended')
    }

    const ensureModeChip = (panel: HTMLElement) => {
      const actions = panel.querySelector<HTMLElement>('.dlv-assistant-header-actions')
      if (!actions) return
      let chip = actions.querySelector<HTMLElement>('.dlv-ui-mode-chip')
      if (!chip) { chip = element('span', 'dlv-ui-mode-chip', '<i></i><b></b>'); actions.prepend(chip) }
      const admin = root.classList.contains('mode-admin')
      const pending = root.classList.contains('mode-admin_pending')
      chip.dataset.mode = admin ? 'admin' : pending ? 'pending' : 'ai'
      const label = chip.querySelector('b')
      if (label) label.textContent = admin ? 'ADMIN' : pending ? (currentLang() === 'en' ? 'QUEUE' : 'ANTRE') : 'ENGINE'
    }

    const ensureReadyDetails = (panel: HTMLElement) => {
      const ready = panel.querySelector<HTMLElement>('.dlv-assistant-ready')
      if (!ready) return
      const engineCell = [...ready.querySelectorAll<HTMLElement>('.dlv-assistant-ready-meta div')].find((cell) => cell.querySelector('small')?.textContent?.trim().toUpperCase() === 'ENGINE')
      const engineValue = engineCell?.querySelector('strong')
      if (engineValue) engineValue.textContent = 'DLavie v6'
      if (!ready.querySelector('.dlv-ui-capabilities')) {
        const en = currentLang() === 'en'
        const capabilities = element('div', 'dlv-ui-capabilities')
        capabilities.innerHTML = `
          <div><i>↗</i><span><b>${en ? 'Payments & wallet' : 'Pembayaran & wallet'}</b><small>${en ? 'Guides, status and references' : 'Panduan, status & reference'}</small></span></div>
          <div><i>◎</i><span><b>Order & OTP</b><small>${en ? 'Sessions, expiry and delivery' : 'Sesi, expiry & penerimaan'}</small></span></div>
          <div><i>§</i><span><b>${en ? 'Rules & documentation' : 'Aturan & dokumentasi'}</b><small>${en ? 'Policy, FAQ and navigation' : 'Kebijakan, FAQ & navigasi'}</small></span></div>
          <div><i>◇</i><span><b>${en ? 'Human support' : 'Dukungan manusia'}</b><small>${en ? 'Admin fallback for manual cases' : 'Admin untuk kasus manual'}</small></span></div>`
        const meta = ready.querySelector('.dlv-assistant-ready-meta')
        if (meta) ready.insertBefore(capabilities, meta); else ready.appendChild(capabilities)
      }
      if (!ready.querySelector('.dlv-ui-trustline')) {
        const trust = element('div', 'dlv-ui-trustline')
        trust.innerHTML = `<i></i><span>${currentLang() === 'en' ? 'Explains first · asks for a reference only when a record lookup is needed' : 'Menjelaskan dulu · meminta reference hanya jika perlu cek record'}</span>`
        ready.querySelector('.dlv-assistant-start')?.insertAdjacentElement('afterend', trust)
      }
    }

    const enhanceQuick = (panel: HTMLElement) => {
      const quick = panel.querySelector<HTMLElement>('.dlv-assistant-quick')
      if (!quick) return
      if (!quick.querySelector('.dlv-ui-quick-heading')) {
        const en = currentLang() === 'en'
        const heading = element('div', 'dlv-ui-quick-heading')
        heading.innerHTML = `<span>${en ? 'CHOOSE A SUPPORT PATH' : 'PILIH JALUR BANTUAN'}</span><strong>${en ? 'What do you need right now?' : 'Apa yang paling kamu butuhkan sekarang?'}</strong>`
        quick.prepend(heading)
      }
      const descriptions = currentLang() === 'en'
        ? ['Guidance, troubleshooting or a general question', 'Inspect a deposit, order or refund reference', 'Understand Terms, Privacy, Refund or service rules']
        : ['Panduan, troubleshooting, atau pertanyaan umum', 'Periksa reference deposit, order, atau refund', 'Pahami Terms, Privasi, Refund, atau aturan layanan']
      quick.querySelectorAll<HTMLButtonElement>(':scope > button').forEach((button, index) => {
        const span = button.querySelector<HTMLElement>(':scope > span')
        if (!span) return
        let desc = span.querySelector('small')
        if (!desc) { desc = document.createElement('small'); span.appendChild(desc) }
        desc.textContent = descriptions[index] || ''
        button.dataset.intent = index === 1 ? 'transaction' : index === 2 ? 'policy' : 'help'
      })
    }

    const enhanceIntake = (panel: HTMLElement) => {
      const intake = panel.querySelector<HTMLElement>('.dlv-assistant-intake')
      if (!intake) return
      if (!intake.querySelector('.dlv-ui-intake-progress')) {
        const progress = element('div', 'dlv-ui-intake-progress')
        progress.innerHTML = `<span><i></i>${currentLang() === 'en' ? 'Add only the details relevant to this request' : 'Isi hanya detail yang relevan untuk kebutuhan ini'}</span><b>3 / 4</b>`
        intake.prepend(progress)
      }
      intake.querySelectorAll('label').forEach((label, index) => { if (label instanceof HTMLElement) label.style.setProperty('--field-index', String(index)) })
    }

    const ensureComposerTools = (panel: HTMLElement) => {
      const wrap = panel.querySelector<HTMLElement>('.dlv-assistant-composer-wrap')
      if (!wrap) return
      let context = wrap.querySelector<HTMLElement>('.dlv-ui-chat-context')
      if (!context) { context = element('div', 'dlv-ui-chat-context'); wrap.prepend(context) }
      context.innerHTML = `<span><i></i><b>${currentLang() === 'en' ? 'Current page' : 'Halaman aktif'}</b></span><small>${routeLabel()}</small>`
      let strip = wrap.querySelector<HTMLElement>('.dlv-ui-prompt-strip')
      if (!strip) {
        strip = element('div', 'dlv-ui-prompt-strip')
        const form = wrap.querySelector('.dlv-assistant-composer')
        if (form) wrap.insertBefore(strip, form)
      }
      const p = prompts(); const items = currentLang() === 'en' ? p.en : p.id
      if (strip.dataset.route !== routeKey()) {
        strip.dataset.route = routeKey()
        strip.innerHTML = items.map((item, index) => `<button type="button" data-prompt="${index}">${item}</button>`).join('')
      }
      if (!wrap.querySelector('.dlv-ui-composer-hint')) {
        const hint = element('div', 'dlv-ui-composer-hint')
        hint.innerHTML = `<span><i></i>${currentLang() === 'en' ? 'Spam protection active' : 'Proteksi spam aktif'}</span><span>${currentLang() === 'en' ? 'Enter sends · Shift+Enter adds a line' : 'Enter kirim · Shift+Enter baris baru'}</span>`
        wrap.appendChild(hint)
      }
      const meta = wrap.querySelector<HTMLElement>('.dlv-assistant-composer-meta span:last-child')
      if (meta && root.classList.contains('mode-ai')) meta.textContent = currentLang() === 'en' ? 'DLavie Engine · human fallback ready' : 'DLavie Engine · admin fallback siap'
    }

    const enhanceMessages = (panel: HTMLElement) => {
      panel.querySelectorAll<HTMLElement>('.dlv-assistant-message').forEach((message) => {
        if (message.dataset.uiRole) return
        const role = message.classList.contains('is-admin') ? 'admin' : message.classList.contains('is-user') ? 'user' : message.classList.contains('is-system') ? 'system' : 'assistant'
        message.dataset.uiRole = role
      })
      const replies = [...panel.querySelectorAll<HTMLElement>('.dlv-assistant-message.is-assistant:not(.is-typing), .dlv-assistant-message.is-admin')]
      const latest = replies.at(-1)
      panel.querySelectorAll<HTMLElement>('.dlv-ui-message-actions').forEach((actions) => { if (!latest || !latest.contains(actions)) actions.remove() })
      if (!latest || latest.querySelector('.dlv-ui-message-actions')) return
      const bubble = latest.querySelector<HTMLElement>(':scope > div')
      const text = latest.querySelector('p')?.textContent?.trim()
      if (!bubble || !text) return
      const actions = element('div', 'dlv-ui-message-actions')
      actions.innerHTML = latest.classList.contains('is-admin')
        ? `<button type="button" data-message-action="copy"><i>⧉</i>${currentLang() === 'en' ? 'Copy' : 'Salin'}</button><button type="button" data-message-action="reply-admin"><i>↩</i>${currentLang() === 'en' ? 'Reply' : 'Balas admin'}</button>`
        : `<button type="button" data-message-action="copy"><i>⧉</i>${currentLang() === 'en' ? 'Copy' : 'Salin'}</button><button type="button" data-message-action="unclear"><i>≡</i>${currentLang() === 'en' ? 'Explain simply' : 'Jelaskan sederhana'}</button><button type="button" data-message-action="admin"><i>◇</i>${currentLang() === 'en' ? 'Human admin' : 'Minta admin'}</button>`
      bubble.appendChild(actions)
    }

    const enhanceReceipt = (panel: HTMLElement) => {
      const receipt = panel.querySelector<HTMLElement>('.dlv-assistant-receipt')
      if (!receipt || receipt.querySelector('.dlv-ui-resolution')) return
      const admin = root.classList.contains('mode-admin') || root.classList.contains('mode-admin_pending')
      const summary = element('div', 'dlv-ui-resolution')
      summary.innerHTML = `<i>✓</i><span><b>${currentLang() === 'en' ? 'Conversation ended safely' : 'Percakapan telah berakhir'}</b><small>${admin ? (currentLang() === 'en' ? 'Human-support session completed' : 'Sesi human support selesai') : (currentLang() === 'en' ? 'DLavie Engine session completed' : 'Sesi DLavie Engine selesai')}</small></span>`
      receipt.insertBefore(summary, receipt.firstChild)
    }

    const patch = () => {
      raf = 0
      const panel = root.querySelector<HTMLElement>('.dlv-assistant-panel')
      if (!panel) return
      const stage = getStage(panel)
      panel.dataset.uiStage = stage
      root.dataset.route = routeKey()
      root.dataset.unread = root.querySelector('.dlv-assistant-unread') ? 'true' : 'false'
      if (lastStage !== stage) {
        panel.classList.remove('dlv-ui-stage-enter')
        requestAnimationFrame(() => panel.classList.add('dlv-ui-stage-enter'))
        lastStage = stage
      }
      ensureFlow(panel, stage); ensureModeChip(panel); ensureReadyDetails(panel); enhanceQuick(panel); enhanceIntake(panel); ensureComposerTools(panel); enhanceMessages(panel); enhanceReceipt(panel)
      const body = panel.querySelector<HTMLElement>('.dlv-assistant-body')
      if (body && stage === 'ready' && body.scrollTop !== 0) body.scrollTop = 0
    }

    const schedulePatch = () => { if (!raf) raf = requestAnimationFrame(patch) }
    const click = async (event: Event) => {
      const target = event.target as HTMLElement | null
      if (!target) return
      const prompt = target.closest<HTMLButtonElement>('[data-prompt]')
      if (prompt) {
        const textarea = root.querySelector<HTMLTextAreaElement>('.dlv-assistant-composer textarea')
        if (textarea) setReactTextareaValue(textarea, promptMessage(Number(prompt.dataset.prompt || 0)))
        return
      }
      const action = target.closest<HTMLButtonElement>('[data-message-action]')
      if (!action) return
      const message = action.closest('.dlv-assistant-message')?.querySelector('p')?.textContent?.trim() || ''
      if (action.dataset.messageAction === 'copy') {
        try { await navigator.clipboard.writeText(message) } catch { /* clipboard unavailable */ }
        const old = action.innerHTML; action.innerHTML = `<i>✓</i>${currentLang() === 'en' ? 'Copied' : 'Tersalin'}`; setTimeout(() => { action.innerHTML = old }, 1200); return
      }
      const textarea = root.querySelector<HTMLTextAreaElement>('.dlv-assistant-composer textarea')
      if (!textarea) return
      const value = action.dataset.messageAction === 'admin'
        ? (currentLang() === 'en' ? 'I want to continue this conversation with a human admin.' : 'Saya ingin melanjutkan percakapan ini dengan admin manusia.')
        : action.dataset.messageAction === 'reply-admin'
          ? (currentLang() === 'en' ? 'I am still here. I want to add more information for the admin.' : 'Saya masih di sini. Saya ingin menambahkan informasi untuk admin.')
          : (currentLang() === 'en' ? 'Please explain the previous answer again in simpler language, with short steps and the next action I should take.' : 'Tolong jelaskan jawaban sebelumnya lagi dengan bahasa yang lebih sederhana, langkah singkat, dan tindakan berikutnya yang harus saya lakukan.')
      setReactTextareaValue(textarea, value)
    }

    root.addEventListener('click', click)
    const hash = () => schedulePatch(); window.addEventListener('hashchange', hash)
    const observer = new MutationObserver((mutations) => { if (mutations.some((m) => m.type === 'childList' || m.type === 'attributes')) schedulePatch() })
    observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] })
    schedulePatch()
    return () => { if (raf) cancelAnimationFrame(raf); observer.disconnect(); root.removeEventListener('click', click); window.removeEventListener('hashchange', hash) }
  }, [])
  return null
}
