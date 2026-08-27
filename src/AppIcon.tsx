import type { ReactNode } from 'react'

export type AppIconName =
  | 'search'
  | 'spark'
  | 'inbox'
  | 'user'
  | 'sim'
  | 'phone'
  | 'network'
  | 'bolt'
  | 'wallet'
  | 'game'
  | 'play'
  | 'activity'
  | 'help'
  | 'shield'
  | 'check'
  | 'message'
  | 'deposit'
  | 'arrow'
  | 'close'
  | 'star'

const paths: Record<AppIconName, ReactNode> = {
  search: <><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></>,
  spark: <><path d="m12 3 1.4 4.2L18 9l-4.6 1.8L12 15l-1.4-4.2L6 9l4.6-1.8Z"/><path d="m19 15 .7 2.1L22 18l-2.3.9L19 21l-.7-2.1L16 18l2.3-.9Z"/></>,
  inbox: <><path d="M5 4h14l2 9v6H3v-6Z"/><path d="M3 13h5l1.5 2h5L16 13h5"/></>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
  sim: <><path d="M8 3h6l4 4v14H6V5a2 2 0 0 1 2-2Z"/><path d="M14 3v5h4"/><rect x="9" y="11" width="6" height="6" rx="1"/><path d="M12 11v6M9 14h6"/></>,
  phone: <><rect x="7" y="3" width="10" height="18" rx="2"/><path d="M10 6h4"/><path d="M11 18h2"/></>,
  network: <><path d="M4.5 9.5a10.7 10.7 0 0 1 15 0"/><path d="M7.5 12.5a6.5 6.5 0 0 1 9 0"/><path d="M10.3 15.5a2.6 2.6 0 0 1 3.4 0"/><circle cx="12" cy="18.5" r=".8" fill="currentColor" stroke="none"/></>,
  bolt: <path d="m13.3 2.8-7 10h5l-.8 8.4 7.2-11.2h-5.1z"/>,
  wallet: <><path d="M4 7a3 3 0 0 1 3-3h12v16H7a3 3 0 0 1-3-3Z"/><path d="M4 8h15"/><path d="M15 12h6v4h-6a2 2 0 0 1 0-4Z"/></>,
  game: <><path d="M7.2 8h9.6a4 4 0 0 1 3.8 5.3l-1.5 4.1a2 2 0 0 1-3.3.8l-1.7-1.7H9.9l-1.7 1.7a2 2 0 0 1-3.3-.8l-1.5-4.1A4 4 0 0 1 7.2 8Z"/><path d="M8 11v4M6 13h4"/><circle cx="16" cy="12" r=".7" fill="currentColor" stroke="none"/><circle cx="18" cy="14" r=".7" fill="currentColor" stroke="none"/></>,
  play: <><rect x="3.5" y="5" width="17" height="14" rx="3"/><path d="m10 9 5 3-5 3z"/></>,
  activity: <><path d="M4 12a8 8 0 1 0 2.3-5.7"/><path d="M4 4v6h6"/><path d="M12 8v5l3 2"/></>,
  help: <><circle cx="12" cy="12" r="9"/><path d="M9.8 9a2.4 2.4 0 0 1 4.5 1.2c0 1.8-2.3 2.1-2.3 3.8"/><path d="M12 17h.01"/></>,
  shield: <><path d="M12 3 5 6v5c0 4.8 2.8 8 7 10 4.2-2 7-5.2 7-10V6Z"/><path d="m9 12 2 2 4-4"/></>,
  check: <><circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/></>,
  message: <><path d="M5 5h14v11H9l-4 3V5Z"/><path d="M8 9h8M8 12h5"/></>,
  deposit: <><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></>,
  arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
  close: <><path d="m6 6 12 12"/><path d="M18 6 6 18"/></>,
  star: <path d="m12 3 2.7 5.4 6 .9-4.35 4.2 1.03 5.95L12 16.65l-5.38 2.8 1.03-5.95L3.3 9.3l6-.9Z"/>,
}

export default function AppIcon({ name, className = '', filled = false }: { name: AppIconName; className?: string; filled?: boolean }) {
  return (
    <svg
      className={`dlv-app-icon${className ? ` ${className}` : ''}`}
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      data-dlv-native-icon={name}
    >
      {paths[name]}
    </svg>
  )
}
