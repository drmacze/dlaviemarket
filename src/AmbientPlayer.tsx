import { useEffect, useRef, useState } from 'react'

type Soundscape = {
  id: string
  title: string
  subtitle: string
  chords: number[][]
  waveform: OscillatorType
  chordSeconds: number
  filterHz: number
  noise: number
  noiseFilterHz: number
  detune: number
  bellNotes?: number[]
}

const SOUNDS: Soundscape[] = [
  {
    id: 'night-drift',
    title: 'Night Drift',
    subtitle: 'Pad malam yang lembut',
    chords: [[57, 60, 64, 71], [53, 57, 60, 64], [48, 55, 59, 64], [55, 59, 62, 69]],
    waveform: 'sine', chordSeconds: 9, filterHz: 1180, noise: .012, noiseFilterHz: 700, detune: 4,
  },
  {
    id: 'soft-rain',
    title: 'Soft Rain',
    subtitle: 'Hujan halus & pad tenang',
    chords: [[52, 59, 62, 67], [48, 55, 59, 64], [50, 57, 60, 64], [47, 54, 59, 62]],
    waveform: 'triangle', chordSeconds: 10, filterHz: 920, noise: .055, noiseFilterHz: 2200, detune: 3,
  },
  {
    id: 'warm-lofi',
    title: 'Warm Lofi',
    subtitle: 'Chords hangat untuk browsing',
    chords: [[48, 55, 59, 64], [45, 52, 55, 60], [50, 57, 60, 64], [43, 50, 55, 59]],
    waveform: 'triangle', chordSeconds: 7.5, filterHz: 1450, noise: .018, noiseFilterHz: 950, detune: 7,
    bellNotes: [72, 74, 76, 79],
  },
  {
    id: 'ocean-air',
    title: 'Ocean Air',
    subtitle: 'Gelombang udara yang luas',
    chords: [[45, 52, 57, 61], [50, 57, 61, 64], [47, 54, 59, 62], [52, 59, 64, 68]],
    waveform: 'sine', chordSeconds: 11, filterHz: 760, noise: .04, noiseFilterHz: 520, detune: 2,
  },
  {
    id: 'glass-garden',
    title: 'Glass Garden',
    subtitle: 'Bell ringan & ambience bening',
    chords: [[60, 64, 67, 71], [57, 60, 64, 69], [62, 65, 69, 72], [55, 59, 62, 67]],
    waveform: 'sine', chordSeconds: 8.5, filterHz: 1800, noise: .009, noiseFilterHz: 1500, detune: 5,
    bellNotes: [79, 83, 86, 88, 91],
  },
]

const TRACK_KEY = 'dlavie-ambient-track'
const VOLUME_KEY = 'dlavie-ambient-volume'

const midiToHz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12)

class AmbientEngine {
  private context: AudioContext | null = null
  private master: GainNode | null = null
  private compressor: DynamicsCompressorNode | null = null
  private chordTimer: number | null = null
  private bellTimer: number | null = null
  private sources: AudioScheduledSourceNode[] = []
  private chordGains: GainNode[] = []
  private noiseSource: AudioBufferSourceNode | null = null
  private noiseGain: GainNode | null = null
  private chordIndex = 0
  private running = false

  private ensureContext() {
    if (this.context) return this.context
    const Ctx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) throw new Error('Web Audio tidak didukung di browser ini.')
    this.context = new Ctx()
    this.master = this.context.createGain()
    this.compressor = this.context.createDynamicsCompressor()
    this.compressor.threshold.value = -24
    this.compressor.knee.value = 18
    this.compressor.ratio.value = 3
    this.compressor.attack.value = .02
    this.compressor.release.value = .35
    this.master.connect(this.compressor)
    this.compressor.connect(this.context.destination)
    return this.context
  }

  async start(sound: Soundscape, volume: number) {
    const ctx = this.ensureContext()
    if (ctx.state === 'suspended') await ctx.resume()
    this.stopVoices()
    this.running = true
    this.chordIndex = 0
    this.setVolume(volume)
    this.createNoise(sound)
    this.playChord(sound)
    this.chordTimer = window.setInterval(() => this.playChord(sound), sound.chordSeconds * 1000)
    if (sound.bellNotes?.length) {
      this.bellTimer = window.setInterval(() => this.playBell(sound), sound.id === 'warm-lofi' ? 4200 : 3300)
    }
  }

  setVolume(volume: number) {
    if (!this.context || !this.master) return
    const safe = Math.max(0, Math.min(1, volume))
    this.master.gain.setTargetAtTime(safe * .58, this.context.currentTime, .08)
  }

  stop() {
    this.running = false
    this.stopVoices()
    if (this.context && this.master) this.master.gain.setTargetAtTime(0, this.context.currentTime, .05)
  }

  destroy() {
    this.stop()
    void this.context?.close()
    this.context = null
    this.master = null
    this.compressor = null
  }

  private stopVoices() {
    if (this.chordTimer !== null) window.clearInterval(this.chordTimer)
    if (this.bellTimer !== null) window.clearInterval(this.bellTimer)
    this.chordTimer = null
    this.bellTimer = null
    this.chordGains.forEach((gain) => {
      try { gain.gain.cancelScheduledValues(0) } catch { /* no-op */ }
    })
    this.sources.forEach((source) => {
      try { source.stop() } catch { /* source already stopped */ }
    })
    this.sources = []
    this.chordGains = []
    this.noiseSource = null
    this.noiseGain = null
  }

  private playChord(sound: Soundscape) {
    if (!this.running || !this.context || !this.master) return
    const ctx = this.context
    const now = ctx.currentTime
    const oldGains = this.chordGains
    const oldSources = [...this.sources].filter((source) => source !== this.noiseSource)
    oldGains.forEach((gain) => {
      gain.gain.cancelScheduledValues(now)
      gain.gain.setTargetAtTime(0.0001, now, 1.1)
    })
    oldSources.forEach((source) => {
      try { source.stop(now + 3.2) } catch { /* no-op */ }
    })

    this.sources = this.noiseSource ? [this.noiseSource] : []
    this.chordGains = []
    const chord = sound.chords[this.chordIndex % sound.chords.length]
    this.chordIndex += 1

    chord.forEach((midi, noteIndex) => {
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = sound.filterHz + noteIndex * 70
      filter.Q.value = .55
      filter.connect(this.master!)

      const gain = ctx.createGain()
      gain.gain.setValueAtTime(.0001, now)
      gain.gain.exponentialRampToValueAtTime(.036 / Math.max(1, chord.length / 4), now + 2.1)
      gain.connect(filter)
      this.chordGains.push(gain)

      ;[-sound.detune, sound.detune].forEach((detune, layer) => {
        const osc = ctx.createOscillator()
        osc.type = layer === 0 ? sound.waveform : 'sine'
        osc.frequency.value = midiToHz(midi)
        osc.detune.value = detune + (noteIndex - 1.5) * 1.2
        osc.connect(gain)
        osc.start(now + noteIndex * .025)
        this.sources.push(osc)
      })
    })
  }

  private createNoise(sound: Soundscape) {
    if (!this.context || !this.master || sound.noise <= 0) return
    const ctx = this.context
    const length = ctx.sampleRate * 4
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    let last = 0
    for (let i = 0; i < length; i += 1) {
      const white = Math.random() * 2 - 1
      last = last * .985 + white * .015
      data[i] = sound.id === 'soft-rain' ? white * .58 + last * .42 : last
    }

    const source = ctx.createBufferSource()
    const filter = ctx.createBiquadFilter()
    const gain = ctx.createGain()
    source.buffer = buffer
    source.loop = true
    filter.type = 'lowpass'
    filter.frequency.value = sound.noiseFilterHz
    filter.Q.value = .35
    gain.gain.value = sound.noise
    source.connect(filter)
    filter.connect(gain)
    gain.connect(this.master)

    if (sound.id === 'ocean-air' || sound.id === 'soft-rain') {
      const lfo = ctx.createOscillator()
      const lfoGain = ctx.createGain()
      lfo.type = 'sine'
      lfo.frequency.value = sound.id === 'ocean-air' ? .09 : .16
      lfoGain.gain.value = sound.id === 'ocean-air' ? .018 : .012
      lfo.connect(lfoGain)
      lfoGain.connect(gain.gain)
      lfo.start()
      this.sources.push(lfo)
    }

    source.start()
    this.noiseSource = source
    this.noiseGain = gain
    this.sources.push(source)
  }

  private playBell(sound: Soundscape) {
    if (!this.running || !this.context || !this.master || !sound.bellNotes?.length) return
    const ctx = this.context
    const now = ctx.currentTime
    const note = sound.bellNotes[Math.floor(Math.random() * sound.bellNotes.length)]
    const osc = ctx.createOscillator()
    const overtone = ctx.createOscillator()
    const gain = ctx.createGain()
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = sound.id === 'glass-garden' ? 4100 : 2350
    osc.type = 'sine'
    overtone.type = 'sine'
    osc.frequency.value = midiToHz(note)
    overtone.frequency.value = midiToHz(note) * 2.01
    gain.gain.setValueAtTime(.0001, now)
    gain.gain.exponentialRampToValueAtTime(sound.id === 'glass-garden' ? .025 : .014, now + .035)
    gain.gain.exponentialRampToValueAtTime(.0001, now + 2.6)
    osc.connect(gain)
    overtone.connect(gain)
    gain.connect(filter)
    filter.connect(this.master)
    osc.start(now)
    overtone.start(now)
    osc.stop(now + 2.8)
    overtone.stop(now + 2.8)
  }
}

function MusicIcon({ playing }: { playing: boolean }) {
  return (
    <span className={`ambient-eq${playing ? ' playing' : ''}`} aria-hidden="true">
      <i /><i /><i />
    </span>
  )
}

function PlayIcon({ playing }: { playing: boolean }) {
  return playing
    ? <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
    : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7Z"/></svg>
}

export default function AmbientPlayer() {
  const engine = useRef<AmbientEngine | null>(null)
  const [open, setOpen] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [trackIndex, setTrackIndex] = useState(() => {
    const saved = localStorage.getItem(TRACK_KEY)
    const index = SOUNDS.findIndex((sound) => sound.id === saved)
    return index >= 0 ? index : 0
  })
  const [volume, setVolume] = useState(() => {
    const saved = Number(localStorage.getItem(VOLUME_KEY))
    return Number.isFinite(saved) && saved >= 0 && saved <= 1 ? saved : .34
  })
  const [error, setError] = useState('')

  const sound = SOUNDS[trackIndex]

  useEffect(() => {
    engine.current = new AmbientEngine()
    return () => engine.current?.destroy()
  }, [])

  useEffect(() => {
    localStorage.setItem(TRACK_KEY, sound.id)
    localStorage.setItem(VOLUME_KEY, String(volume))
    engine.current?.setVolume(volume)
  }, [sound.id, volume])

  const start = async (index = trackIndex) => {
    try {
      setError('')
      await engine.current?.start(SOUNDS[index], volume)
      setPlaying(true)
    } catch {
      setPlaying(false)
      setError('Audio tidak dapat dimulai di browser ini.')
    }
  }

  const toggle = () => {
    if (playing) {
      engine.current?.stop()
      setPlaying(false)
      return
    }
    void start()
  }

  const chooseTrack = (index: number) => {
    setTrackIndex(index)
    if (playing) void start(index)
  }

  const shiftTrack = (direction: number) => {
    const index = (trackIndex + direction + SOUNDS.length) % SOUNDS.length
    chooseTrack(index)
  }

  return (
    <div className={`ambient-player${open ? ' open' : ''}`}>
      <button className="ambient-trigger" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label="Buka pemutar musik">
        <MusicIcon playing={playing} />
        <span><small>Ambient</small><strong>{sound.title}</strong></span>
      </button>

      {open && (
        <section className="ambient-panel" aria-label="Background music">
          <header>
            <div><small>Background sound</small><strong>Suasana santai</strong></div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Tutup pemutar">×</button>
          </header>

          <div className="ambient-now">
            <MusicIcon playing={playing} />
            <div><small>{playing ? 'Sedang diputar' : 'Siap diputar'}</small><strong>{sound.title}</strong><span>{sound.subtitle}</span></div>
          </div>

          <div className="ambient-controls">
            <button type="button" onClick={() => shiftTrack(-1)} aria-label="Track sebelumnya">‹</button>
            <button className="ambient-play" type="button" onClick={toggle} aria-label={playing ? 'Jeda musik' : 'Putar musik'}><PlayIcon playing={playing} /></button>
            <button type="button" onClick={() => shiftTrack(1)} aria-label="Track berikutnya">›</button>
          </div>

          <div className="ambient-track-list">
            {SOUNDS.map((item, index) => (
              <button className={index === trackIndex ? 'active' : ''} type="button" key={item.id} onClick={() => chooseTrack(index)}>
                <i>{String(index + 1).padStart(2, '0')}</i>
                <span><strong>{item.title}</strong><small>{item.subtitle}</small></span>
                {index === trackIndex && <b>{playing ? 'PLAY' : 'SELECTED'}</b>}
              </button>
            ))}
          </div>

          <label className="ambient-volume">
            <span>Volume <b>{Math.round(volume * 100)}%</b></span>
            <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(event) => setVolume(Number(event.target.value))} />
          </label>

          <p className="ambient-note">Musik mulai setelah kamu menekan Play. Semua sound dibuat langsung di browser dan tidak memakai file audio eksternal.</p>
          {error && <p className="ambient-error">{error}</p>}
        </section>
      )}
    </div>
  )
}
