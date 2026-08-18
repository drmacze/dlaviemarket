import { useEffect } from 'react'

const PROMPTS_ID = [
  'Saya bingung cara deposit',
  'Cek status saldo saya',
  'OTP saya belum masuk',
  'Jelaskan aturan refund',
  'Saya ingin bicara dengan admin',
]

const PROMPTS_EN = [
  'How do I make a deposit?',
  'Check my wallet balance status',
  'My OTP has not arrived',
  'Explain the refund rules',
  'I want to talk to an admin',
]

function lang() { return localStorage.getItem('dlavie-language') === 'en' ? 'en' : 'id' }

function setReactTextareaValue(textarea: HTMLTextAreaElement, value: string) {
  const descriptor = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')
  descriptor?.set?.call(textarea, value)
  textarea.dispatchEvent(new Event('input', { bubbles: true }))
  textarea.focus({ preventScroll: true })
}

function routeLabel() {
  const route = (location.hash || '#/home').toLowerCase()
  if (route.includes('market')) return 'Market'
  if (route.includes('activity')) return lang() === 'en' ? 'Activity' : 'Aktivitas'
  if (route.includes('guide')) return lang() === 'en' ? 'How it works' : 'Cara Kerja'
  if (route.includes('security')) return lang() === 'en' ? 'Security' : 'Keamanan'
  if (route.includes('help')) return 'FAQ'
  if (route.includes('legal')) return 'Legal Center'
  if (route.includes('docs')) return 'Documentation'
  return lang() === 'en' ? 'Home' : 'Beranda'
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
    root.dataset.ui = 'v2'

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
        flow = element('div', 'dlv-ui-flow')
        flow.innerHTML = `
          <span data-step="ready"><i>1</i><b>${lang() === 'en' ? 'Start' : 'Mulai'}</b></span>
          <em></em>
          <span data-step="quick"><i>2</i><b>${lang() === 'en' ? 'Choose' : 'Pilih'}</b></span>
          <em></em>
          <span data-step="intake"><i>3</i><b>${lang() === 'en' ? 'Context' : 'Konteks'}</b></span>
          <em></em>
          <span data-step="chat"><i>4</i><b>Chat</b></span>`
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

    const ensureModeChip = (panel: HTMLElement) => {
      const actions = panel.querySelector<HTMLElement>('.dlv-assistant-header-actions')
      if (!actions) return
      let chip = actions.querySelector<HTMLElement>('.dlv-ui-mode-chip')
      if (!chip) {
        chip = element('span', 'dlv-ui-mode-chip', '<i></i><b></b>')
        actions.prepend(chip)
      }
      const admin = root.classList.contains('mode-admin')
      const pending = root.classList.contains('mode-admin_pending')
      chip.dataset.mode = admin ? 'admin' : pending ? 'pending' : 'ai'
      const label = chip.querySelector('b')
      if (label) label.textContent = admin ? 'ADMIN' : pending ? (lang() === 'en' ? 'QUEUE' : 'ANTRE') : 'ENGINE'
    }

    const ensureReadyDetails = (panel: HTMLElement) => {
      const ready = panel.querySelector<HTMLElement>('.dlv-assistant-ready')
      if (!ready || ready.querySelector('.dlv-ui-capabilities')) return
      const capabilities = element('div', 'dlv-ui-capabilities')
      capabilities.innerHTML = `
        <div><i>↗</i><span><b>${lang() === 'en' ? 'Transaction help' : 'Bantuan transaksi'}</b><small>${lang() === 'en' ? 'Wallet, deposit, status and references' : 'Wallet, deposit, status & reference'}</small></span></div>
        <div><i>◎</i><span><b>${lang() === 'en' ? 'Order & OTP' : 'Order & OTP'}</b><small>${lang() === 'en' ? 'Sessions, expiry and delivery status' : 'Sesi, expiry & status penerimaan'}</small></span></div>
        <div><i>§</i><span><b>${lang() === 'en' ? 'Policy knowledge' : 'Pengetahuan kebijakan'}</b><small>${lang() === 'en' ? 'Terms, privacy and refunds' : 'Terms, privasi & refund'}</small></span></div>
        <div><i>◇</i><span><b>${lang() === 'en' ? 'Human fallback' : 'Fallback manusia'}</b><small>${lang() === 'en' ? 'Escalates when manual help is needed' : 'Dialihkan jika butuh tindakan admin'}</small></span></div>`
      const meta = ready.querySelector('.dlv-assistant-ready-meta')
      if (meta) ready.insertBefore(capabilities, meta)
      else ready.appendChild(capabilities)

      const trust = element('div', 'dlv-ui-trustline')
      trust.innerHTML = `<i></i><span>${lang() === 'en' ? 'Reads only the signed-in user context · session auto-closes after inactivity' : 'Hanya membaca konteks user yang login · sesi tertutup otomatis saat tidak aktif'}</span>`
      ready.querySelector('.dlv-assistant-start')?.insertAdjacentElement('afterend', trust)
    }

    const enhanceQuick = (panel: HTMLElement) => {
      const quick = panel.querySelector<HTMLElement>('.dlv-assistant-quick')
      if (!quick) return
      if (!quick.querySelector('.dlv-ui-quick-heading')) {
        const heading = element('div', 'dlv-ui-quick-heading')
        heading.innerHTML = `<span>${lang() === 'en' ? 'STEP 2 OF 4' : 'LANGKAH 2 DARI 4'}</span><strong>${lang() === 'en' ? 'Choose the closest type of request' : 'Pilih jenis kebutuhan yang paling sesuai'}</strong>`
        quick.prepend(heading)
      }
      const descriptions = lang() === 'en'
        ? ['Guidance, troubleshooting or general questions', 'Inspect a deposit, order or refund reference', 'Understand Terms, Privacy, Refund or service rules']
        : ['Panduan, troubleshooting, atau pertanyaan umum', 'Periksa reference deposit, order, atau refund', 'Pahami Terms, Privasi, Refund, atau aturan layanan']
      quick.querySelectorAll<HTMLButtonElement>(':scope > button').forEach((button, index) => {
        const span = button.querySelector<HTMLElement>(':scope > span')
        if (!span || span.querySelector('small')) return
        const copy = document.createElement('small')
        copy.textContent = descriptions[index] || ''
        span.appendChild(copy)
        button.dataset.intent = index === 1 ? 'transaction' : index === 2 ? 'policy' : 'help'
      })
    }

    const enhanceIntake = (panel: HTMLElement) => {
      const intake = panel.querySelector<HTMLElement>('.dlv-assistant-intake')
      if (!intake) return
      if (!intake.querySelector('.dlv-ui-intake-progress')) {
        const progress = element('div', 'dlv-ui-intake-progress')
        progress.innerHTML = `<span><i></i>${lang() === 'en' ? 'Context setup' : 'Penyusunan konteks'}</span><b>3 / 4</b>`
        intake.prepend(progress)
      }
      intake.querySelectorAll('label').forEach((label, index) => {
        if (!(label instanceof HTMLElement)) return
        label.style.setProperty('--field-index', String(index))
      })
    }

    const ensureComposerTools = (panel: HTMLElement) => {
      const wrap = panel.querySelector<HTMLElement>('.dlv-assistant-composer-wrap')
      if (!wrap) return
      if (!wrap.querySelector('.dlv-ui-chat-context')) {
        const context = element('div', 'dlv-ui-chat-context')
        context.innerHTML = `<span><i></i><b>${lang() === 'en' ? 'Active context' : 'Konteks aktif'}</b></span><small>${routeLabel()} · ${lang() === 'en' ? 'messages are user-scoped' : 'pesan dibatasi ke user ini'}</small>`
        wrap.prepend(context)
      }
      if (!wrap.querySelector('.dlv-ui-prompt-strip')) {
        const prompts = element('div', 'dlv-ui-prompt-strip')
        const items = lang() === 'en' ? PROMPTS_EN : PROMPTS_ID
        prompts.innerHTML = items.map((item, index) => `<button type="button" data-prompt="${index}">${item}</button>`).join('')
        const form = wrap.querySelector('.dlv-assistant-composer')
        if (form) wrap.insertBefore(prompts, form)
      }
      if (!wrap.querySelector('.dlv-ui-composer-hint')) {
        const hint = element('div', 'dlv-ui-composer-hint')
        hint.innerHTML = `<span>↵ ${lang() === 'en' ? 'send' : 'kirim'} · ⇧↵ ${lang() === 'en' ? 'new line' : 'baris baru'}</span><span><i></i>${lang() === 'en' ? 'Spam protection active' : 'Proteksi spam aktif'}</span>`
        wrap.appendChild(hint)
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
      const actions = element('div', 'dlv-ui-message-actions')
      actions.innerHTML = latest.classList.contains('is-admin')
        ? `<button type="button" data-message-action="copy">${lang() === 'en' ? 'Copy' : 'Salin'}</button><button type="button" data-message-action="reply-admin">${lang() === 'en' ? 'Reply to admin' : 'Balas admin'}</button>`
        : `<button type="button" data-message-action="copy">${lang() === 'en' ? 'Copy' : 'Salin'}</button><button type="button" data-message-action="unclear">${lang() === 'en' ? 'Still unclear' : 'Masih bingung'}</button><button type="button" data-message-action="admin">${lang() === 'en' ? 'Ask admin' : 'Minta admin'}</button>`
      bubble.appendChild(actions)
    }

    const patch = () => {
      raf = 0
      const panel = root.querySelector<HTMLElement>('.dlv-assistant-panel')
      if (!panel) return
      const stage = getStage(panel)
      panel.dataset.uiStage = stage
      if (lastStage !== stage) {
        panel.classList.remove('dlv-ui-stage-enter')
        requestAnimationFrame(() => panel.classList.add('dlv-ui-stage-enter'))
        lastStage = stage
      }
      ensureFlow(panel, stage)
      ensureModeChip(panel)
      ensureReadyDetails(panel)
      enhanceQuick(panel)
      enhanceIntake(panel)
      ensureComposerTools(panel)
      enhanceLatestMessage(panel)
    }

    const schedulePatch = () => {
      if (raf) return
      raf = requestAnimationFrame(patch)
    }

    const click = async (event: Event) => {
      const target = event.target as HTMLElement | null
      if (!target) return
      const prompt = target.closest<HTMLButtonElement>('[data-prompt]')
      if (prompt) {
        const textarea = root.querySelector<HTMLTextAreaElement>('.dlv-assistant-composer textarea')
        const index = Number(prompt.dataset.prompt || 0)
        const text = (lang() === 'en' ? PROMPTS_EN : PROMPTS_ID)[index]
        if (textarea && text) setReactTextareaValue(textarea, text)
        return
      }
      const action = target.closest<HTMLButtonElement>('[data-message-action]')
      if (!action) return
      const latest = action.closest('.dlv-assistant-message')
      const message = latest?.querySelector('p')?.textContent?.trim() || ''
      if (action.dataset.messageAction === 'copy') {
        try { await navigator.clipboard.writeText(message) } catch { /* no-op */ }
        const old = action.textContent
        action.textContent = lang() === 'en' ? 'Copied ✓' : 'Tersalin ✓'
        setTimeout(() => { action.textContent = old }, 1200)
        return
      }
      const textarea = root.querySelector<HTMLTextAreaElement>('.dlv-assistant-composer textarea')
      if (!textarea) return
      const value = action.dataset.messageAction === 'admin'
        ? (lang() === 'en' ? 'I want to continue this conversation with a human admin.' : 'Saya ingin melanjutkan percakapan ini dengan admin manusia.')
        : action.dataset.messageAction === 'reply-admin'
          ? (lang() === 'en' ? 'I am still here. I want to add more information for the admin.' : 'Saya masih di sini. Saya ingin menambahkan informasi untuk admin.')
          : (lang() === 'en' ? 'I am still confused. Please explain the previous answer more simply and step by step.' : 'Saya masih bingung. Tolong jelaskan jawaban sebelumnya dengan lebih sederhana dan langkah demi langkah.')
      setReactTextareaValue(textarea, value)
    }

    const hash = () => schedulePatch()
    root.addEventListener('click', click)
    window.addEventListener('hashchange', hash)
    const observer = new MutationObserver((mutations) => {
      if (mutations.some((mutation) => mutation.type === 'childList' || mutation.type === 'attributes')) schedulePatch()
    })
    observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] })
    schedulePatch()

    return () => {
      if (raf) cancelAnimationFrame(raf)
      observer.disconnect()
      root.removeEventListener('click', click)
      window.removeEventListener('hashchange', hash)
    }
  }, [])

  return null
}
