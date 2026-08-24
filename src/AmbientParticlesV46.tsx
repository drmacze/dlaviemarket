import type { ReactNode } from 'react'

type AmbientIconName = 'wallet' | 'card' | 'box' | 'receipt' | 'tag' | 'cart' | 'signal' | 'spark'

function AmbientIcon({ name }: { name: AmbientIconName }) {
  const paths: Record<AmbientIconName, ReactNode> = {
    wallet: <><path d="M4 7a3 3 0 0 1 3-3h12v16H7a3 3 0 0 1-3-3Z"/><path d="M4 8h15"/><path d="M15 12h6v4h-6a2 2 0 0 1 0-4Z"/></>,
    card: <><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3 9h18"/><path d="M7 14h4"/></>,
    box: <><path d="m4 8 8-4 8 4-8 4-8-4Z"/><path d="m4 8 8 4 8-4v8l-8 4-8-4Z"/><path d="M12 12v8"/></>,
    receipt: <><path d="M6 3h12v18l-3-1.7-3 1.7-3-1.7L6 21Z"/><path d="M9 8h6M9 12h6M9 16h4"/></>,
    tag: <><path d="M4 11V5h6l9 9-6 6-9-9Z"/><circle cx="8" cy="9" r="1.2"/></>,
    cart: <><path d="M4 5h2l2 10h9l2-7H7"/><circle cx="10" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/></>,
    signal: <><path d="M4.5 10a10.8 10.8 0 0 1 15 0"/><path d="M7.5 13a6.5 6.5 0 0 1 9 0"/><path d="M10.3 16a2.6 2.6 0 0 1 3.4 0"/><circle cx="12" cy="19" r=".8" fill="currentColor" stroke="none"/></>,
    spark: <><path d="m12 3 1.5 4.4L18 9l-4.5 1.6L12 15l-1.5-4.4L6 9l4.5-1.6Z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8Z"/></>,
  }
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

const particles: AmbientIconName[] = [
  'wallet','box','tag','card','cart','receipt','signal','spark',
  'box','wallet','receipt','tag','signal','card','spark','cart',
]

export default function AmbientParticlesV46() {
  return (
    <div className="dlv46-ambient-particles" aria-hidden="true">
      {particles.map((icon, index) => (
        <span className={`dlv46-particle p${index + 1}`} key={`${icon}-${index}`}>
          <AmbientIcon name={icon} />
        </span>
      ))}
    </div>
  )
}
