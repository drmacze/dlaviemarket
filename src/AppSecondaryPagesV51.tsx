import { useEffect, useState } from 'react'
import AppIcon, { type AppIconName } from './AppIcon'
import './app-secondary-pages-v51.css'

type Page = 'guide' | 'security' | 'help' | 'legal' | null

type Card = { icon: AppIconName; title: string; body: string }

type PageData = {
  eyebrow: string
  title: string
  description: string
  cards: Card[]
  primary: { label: string; route: string }
  secondary: { label: string; route: string }
}

function getPage(hash = window.location.hash): Page {
  const value = hash.replace(/^#\/?/, '').split(/[?&]/)[0].toLowerCase()
  if (value === 'guide' || value === 'cara-kerja') return 'guide'
  if (value === 'security' || value === 'keamanan') return 'security'
  if (value === 'help' || value === 'faq' || value === 'bantuan') return 'help'
  if (value === 'legal' || value === 'terms' || value === 'privacy' || value === 'kebijakan') return 'legal'
  return null
}

const pages: Record<Exclude<Page, null>, PageData> = {
  guide: {
    eyebrow: 'Cara kerja',
    title: 'Satu alur dari saldo sampai transaksi selesai.',
    description: 'Gunakan tiga langkah utama agar pembelian dan pengecekan status tetap sederhana.',
    cards: [
      { icon: 'wallet', title: '1. Isi saldo', body: 'Tambahkan saldo DLavie sebelum memakai layanan yang dibayar melalui wallet.' },
      { icon: 'search', title: '2. Pilih layanan', body: 'Buka Market, pilih produk, lalu periksa tujuan, nominal, dan detail sebelum konfirmasi.' },
      { icon: 'activity', title: '3. Pantau transaksi', body: 'Lihat status pesanan, pembayaran, OTP, pembatalan, dan refund dari Aktivitas.' },
    ],
    primary: { label: 'Buka Market', route: '/market' },
    secondary: { label: 'Lihat Aktivitas', route: '/activity' },
  },
  security: {
    eyebrow: 'Keamanan',
    title: 'Perlindungan mengikuti setiap tahap transaksi.',
    description: 'Akun, saldo, pembayaran, pesanan, dan riwayat dipisahkan supaya statusnya lebih mudah dilacak.',
    cards: [
      { icon: 'user', title: 'Akun & sesi', body: 'Identitas akun dikelola terpisah dari data produk dan tampilan transaksi.' },
      { icon: 'wallet', title: 'Saldo & pembayaran', body: 'Perubahan saldo mengikuti alur pembayaran, bukan sekadar perubahan tampilan di browser.' },
      { icon: 'shield', title: 'Pesanan & refund', body: 'Status transaksi diarahkan kembali ke Aktivitas agar riwayatnya mudah diperiksa.' },
    ],
    primary: { label: 'Buka Aktivitas', route: '/activity' },
    secondary: { label: 'Bantuan', route: '/help' },
  },
  help: {
    eyebrow: 'Bantuan',
    title: 'Jawaban cepat untuk masalah transaksi yang paling umum.',
    description: 'Mulai dari status terakhir di Aktivitas, lalu lanjutkan sesuai kondisi pesanan atau pembayaran.',
    cards: [
      { icon: 'activity', title: 'Pesanan belum selesai', body: 'Periksa Aktivitas untuk melihat apakah order masih diproses, menunggu OTP, selesai, dibatalkan, atau refund.' },
      { icon: 'message', title: 'OTP belum masuk', body: 'Periksa status nomor virtual dan masa tunggunya sebelum membuat transaksi baru untuk kebutuhan yang sama.' },
      { icon: 'wallet', title: 'Saldo belum berubah', body: 'Periksa status pembayaran dan jangan mengulang pembayaran ketika transaksi sebelumnya masih diproses.' },
    ],
    primary: { label: 'Lihat Aktivitas', route: '/activity' },
    secondary: { label: 'Buka Keamanan', route: '/security' },
  },
  legal: {
    eyebrow: 'Kebijakan',
    title: 'Ringkasan penggunaan DLavie Market.',
    description: 'Informasi penting tentang data, pembayaran, transaksi, dan pengembalian dana disusun dalam satu tempat.',
    cards: [
      { icon: 'shield', title: 'Privasi', body: 'Data akun dan transaksi digunakan sesuai kebutuhan fitur, keamanan, dan penyelesaian layanan.' },
      { icon: 'wallet', title: 'Pembayaran', body: 'Periksa tujuan, produk, dan nominal sebelum melakukan konfirmasi akhir.' },
      { icon: 'activity', title: 'Refund', body: 'Pengembalian dana mengikuti status akhir transaksi dan alur refund yang berlaku pada pesanan.' },
    ],
    primary: { label: 'Buka Aktivitas', route: '/activity' },
    secondary: { label: 'Bantuan', route: '/help' },
  },
}

function go(route: string) {
  window.location.hash = route
}

export default function AppSecondaryPagesV51() {
  const [page, setPage] = useState<Page>(() => getPage())

  useEffect(() => {
    const sync = () => setPage(getPage())
    window.addEventListener('hashchange', sync)
    sync()
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  if (!page) return null
  const data = pages[page]
  const heroIcon: AppIconName = page === 'guide' ? 'spark' : page === 'security' ? 'shield' : page === 'help' ? 'help' : 'check'

  return (
    <main className="dlv51-secondary-page" data-secondary-page={page}>
      <section className="dlv51-secondary-hero">
        <span className="dlv51-secondary-icon is-hero"><AppIcon name={heroIcon} /></span>
        <div><small>{data.eyebrow}</small><h1>{data.title}</h1><p>{data.description}</p></div>
      </section>

      <section className="dlv51-secondary-grid">
        {data.cards.map((card) => (
          <article key={card.title}>
            <span className="dlv51-secondary-icon"><AppIcon name={card.icon} /></span>
            <div><h2>{card.title}</h2><p>{card.body}</p></div>
          </article>
        ))}
      </section>

      <section className="dlv51-secondary-actions">
        <button type="button" className="primary" onClick={() => go(data.primary.route)}>{data.primary.label}<AppIcon name="arrow" /></button>
        <button type="button" onClick={() => go(data.secondary.route)}>{data.secondary.label}<AppIcon name="arrow" /></button>
      </section>
    </main>
  )
}
