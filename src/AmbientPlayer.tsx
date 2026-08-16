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
  padLevel: number
  bassLevel: number
  reverb: number
  movement: number
  sparkleNotes?: number[]
  sparkleEvery?: number
  sparkleLevel?: number
}

const SOUNDS: Soundscape[] = [
  {
    id: 'midnight-terminal',
    title: 'Midnight Terminal',
    subtitle: 'Deep ambient · clean & cinematic',
    chords: [[50, 57, 60, 64], [46, 53, 57, 62], [53, 60, 64, 69], [48, 55, 62, 64]],
    waveform: 'sine', chordSeconds: 10.5, filterHz: 1120, noise: .006, noiseFilterHz: 620, detune: 5,
    padLevel: .026, bassLevel: .022, reverb: .34, movement: 150,
    sparkleNotes: [74, 77, 81, 84], sparkleEvery: 7600, sparkleLevel: .009,
  },
  {
    id: 'soft-neon',
    title: 'Soft Neon',
    subtitle: 'Airy synth · warm city glow',
    chords: [[52, 59, 63, 66], [48, 55, 59, 64], [50, 57, 61, 64], [55, 62, 66, 71]],
    waveform: 'triangle', chordSeconds: 9, filterHz: 1750, noise: .004, noiseFilterHz: 1100, detune: 6,
    padLevel: .022, bassLevel: .014, reverb: .39, movement: 230,
    sparkleNotes: [76, 78, 83, 85], sparkleEvery: 6200, sparkleLevel: .008,
  },
  {
    id: 'quiet-checkout',
    title: 'Quiet Checkout',
    subtitle: 'Soft pulse · minimal & focused',
    chords: [[48, 55, 59, 64], [45, 52, 57, 60], [50, 57, 60, 65], [43, 50, 55, 59]],
    waveform: 'triangle', chordSeconds: 7.2, filterHz: 1380, noise: .009, noiseFilterHz: 820, detune: 4,
    padLevel: .021, bassLevel: .019, reverb: .27, movement: 110,
    sparkleNotes: [72, 76, 79, 83], sparkleEvery: 5700, sparkleLevel: .0065,
  },
  {
    id: 'after-hours',
    title: 'After Hours',
    subtitle: 'Slow drift · dark and spacious',
    chords: [[45, 52, 57, 60], [41, 48, 52, 57], [43, 50, 55, 59], [47, 54, 59, 62]],
    waveform: 'sine', chordSeconds: 12, filterHz: 790, noise: .012, noiseFilterHz: 480, detune: 3,
    padLevel: .029, bassLevel: .027, reverb: .43, movement: 90,
  },
  {
    id: 'glass-signal',
    title: 'Glass Signal',
    subtitle: 'Crystal tones · light & futuristic',
    chords: [[60, 64, 67, 71], [57, 60, 64, 69], [62, 65, 69, 72], [55, 59, 62, 67]],
    waveform: 'sine', chordSeconds: 9.5, filterHz: 2350, noise: .0035, noiseFilterHz: 1700, detune: 4,
    padLevel: .016, bassLevel: .007, reverb: .49, movement: 280,
    sparkleNotes: [79, 83, 86, 88, 91], sparkleEvery: 3600, sparkleLevel: .014,
  },
]

const TRACK_KEY = 'dlavie-ambient-track'
const VOLUME_KEY = 'dlavie-ambient-volume'

const midiToHz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12)

class AmbientEngine {
  private context: AudioContext | null = null
  private output: GainNode | null = null
  private dryBus: GainNode | null = null
  private reverb: ConvolverNode | null = null
  private wetBus: GainNode | null = null
  private compressor: DynamicsCompressorNode | null = null
  private chordTimer: number | null = null
  private sparkleTimer: number | null = null
  private chordSources: AudioScheduledSourceNode[] = []
  private bedSources: AudioScheduledSourceNode[] = []
  private chordGains: GainNode[] = []
  private chordIndex = 0
  private running = false

  private ensureContext() {
    if (this.context) return this.context
    const Ctx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) throw new Error('Web Audio tidak didukung di browser ini.')

    this.context = new Ctx()
    const ctx = this.context
    this.output = ctx.createGain()
    this.dryBus = ctx.createGain()
    this.reverb = ctx.createConvolver()
    this.wetBus = ctx.createGain()
    this.compressor = ctx.createDynamicsCompressor()

    this.reverb.buffer = this.createImpulse(ctx, 3.2, 2.8)
    this.dryBus.gain.value = .92
    this.wetBus.gain.value = .34
    this.output.gain.value = .0001

    this.compressor.threshold.value = -26
    this.compressor.knee.value = 20
    this.compressor.ratio.value = 2.5
    this.compressor.attack.value = .018
    this.compressor.release.value = .42

    this.dryBus.connect(this.output)
    this.reverb.connect(this.wetBus)
    this.wetBus.connect(this.output)
    this.output.connect(this.compressor)
    this.compressor.connect(ctx.destination)

    return ctx
  }

  private createImpulse(ctx: AudioContext, seconds: number, decay: number) {
    const length = Math.floor(ctx.sampleRate * seconds)
    const impulse = ctx.createBuffer(2, length, ctx.sampleRate)
    for (let channel = 0; channel < 2; channel += 1) {
      const data = impulse.getChannelData(channel)
      for (let i = 0; i < length; i += 1) {
        const envelope = Math.pow(1 - i / length, decay)
        data[i] = (Math.random() * 2 - 1) * envelope * (channel === 0 ? .82 : .76)
      }
    }
    return impulse
  }

  private route(node: AudioNode, wetAmount: number) {
    if (!this.context || !this.dryBus || !this.reverb) return
    node.connect(this.dryBus)
    const send = this.context.createGain()
    send.gain.value = wetAmount
    node.connect(send)
    send.connect(this.reverb)
  }

  async start(sound: Soundscape, volume: number) {
    const ctx = this.ensureContext()
    if (ctx.state === 'suspended') await ctx.resume()

    this.stopVoices()
    this.running = true
    this.chordIndex = 0
    if (this.wetBus) this.wetBus.gain.setTargetAtTime(sound.reverb, ctx.currentTime, .22)
    this.setVolume(volume)
    this.createAir(sound)
    this.playChord(sound)
    this.chordTimer = window.setInterval(() => this.playChord(sound), sound.chordSeconds * 1000)

    if (sound.sparkleNotes?.length && sound.sparkleEvery) {
      this.sparkleTimer = window.setInterval(() => this.playSparkle(sound), sound.sparkleEvery)
      window.setTimeout(() => {
        if (this.running) this.playSparkle(sound)
      }, Math.min(3200, sound.sparkleEvery * .55))
    }
  }

  setVolume(volume: number) {
    if (!this.context || !this.output) return
    const safe = Math.max(0, Math.min(1, volume))
    this.output.gain.cancelScheduledValues(this.context.currentTime)
    this.output.gain.setTargetAtTime(Math.max(.0001, safe * .43), this.context.currentTime, .14)
  }

  stop() {
    this.running = false
    if (this.context && this.output) {
      this.output.gain.cancelScheduledValues(this.context.currentTime)
      this.output.gain.setTargetAtTime(.0001, this.context.currentTime, .08)
    }
    this.stopVoices()
  }

  destroy() {
    this.stop()
    void this.context?.close()
    this.context = null
    this.output = null
    this.dryBus = null
    this.reverb = null
    this.wetBus = null
    this.compressor = null
  }

  private stopVoices() {
    if (this.chordTimer !== null) window.clearInterval(this.chordTimer)
    if (this.sparkleTimer !== null) window.clearInterval(this.sparkleTimer)
    this.chordTimer = null
    this.sparkleTimer = null

    const now = this.context?.currentTime ?? 0
    this.chordGains.forEach((gain) => {
      try {
        gain.gain.cancelScheduledValues(now)
        gain.gain.setTargetAtTime(.0001, now, .06)
      } catch { /* no-op */ }
    })
    ;[...this.chordSources, ...this.bedSources].forEach((source) => {
      try { source.stop(now + .22) } catch { /* source already stopped */ }
    })

    this.chordSources = []
    this.bedSources = []
    this.chordGains = []
  }

  private playChord(sound: Soundscape) {
    if (!this.running || !this.context || !this.output) return
    const ctx = this.context
    const now = ctx.currentTime
    const oldSources = [...this.chordSources]
    const oldGains = [...this.chordGains]

    oldGains.forEach((gain) => {
      gain.gain.cancelScheduledValues(now)
      gain.gain.setTargetAtTime(.0001, now, 1.25)
    })
    oldSources.forEach((source) => {
      try { source.stop(now + 4.4) } catch { /* already stopped */ }
    })

    this.chordSources = []
    this.chordGains = []
    const chord = sound.chords[this.chordIndex % sound.chords.length]
    this.chordIndex += 1

    chord.forEach((midi, noteIndex) => {
      const filter = ctx.createBiquadFilter()
      const panner = ctx.createStereoPanner()
      const gain = ctx.createGain()
      filter.type = 'lowpass'
      filter.frequency.value = sound.filterHz + noteIndex * 95
      filter.Q.value = .48
      panner.pan.value = Math.max(-.62, Math.min(.62, (noteIndex - (chord.length - 1) / 2) * .36))
      gain.gain.setValueAtTime(.0001, now)
      gain.gain.exponentialRampToValueAtTime(sound.padLevel / Math.max(1, chord.length / 3.5), now + 2.6 + noteIndex * .09)

      gain.connect(filter)
      filter.connect(panner)
      this.route(panner, sound.reverb * .72)
      this.chordGains.push(gain)

      ;[-sound.detune, sound.detune].forEach((detune, layer) => {
        const osc = ctx.createOscillator()
        osc.type = layer === 0 ? sound.waveform : 'sine'
        osc.frequency.value = midiToHz(midi)
        osc.detune.value = detune + (noteIndex - 1.5) * .8
        osc.connect(gain)
        osc.start(now + noteIndex * .04)
        this.chordSources.push(osc)
      })

      if (sound.movement > 0) {
        const lfo = ctx.createOscillator()
        const lfoDepth = ctx.createGain()
        lfo.type = 'sine'
        lfo.frequency.value = .045 + noteIndex * .008
        lfoDepth.gain.value = sound.movement
        lfo.connect(lfoDepth)
        lfoDepth.connect(filter.frequency)
        lfo.start(now)
        this.chordSources.push(lfo)
      }
    })

    if (sound.bassLevel > 0) {
      const root = chord[0] - 12
      const bass = ctx.createOscillator()
      const bassGain = ctx.createGain()
      const bassFilter = ctx.createBiquadFilter()
      bass.type = 'sine'
      bass.frequency.value = midiToHz(root)
      bassFilter.type = 'lowpass'
      bassFilter.frequency.value = 240
      bassFilter.Q.value = .35
      bassGain.gain.setValueAtTime(.0001, now)
      bassGain.gain.exponentialRampToValueAtTime(sound.bassLevel, now + 2.2)
      bass.connect(bassGain)
      bassGain.connect(bassFilter)
      this.route(bassFilter, sound.reverb * .18)
      bass.start(now)
      this.chordSources.push(bass)
      this.chordGains.push(bassGain)
    }
  }

  private createAir(sound: Soundscape) {
    if (!this.context || !this.dryBus || sound.noise <= 0) return
    const ctx = this.context
    const length = Math.floor(ctx.sampleRate * 4)
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    let brown = 0

    for (let i = 0; i < length; i += 1) {
      const white = Math.random() * 2 - 1
      brown = brown * .987 + white * .013
      data[i] = brown * 1.7 + white * .045
    }

    const source = ctx.createBufferSource()
    const filter = ctx.createBiquadFilter()
    const gain = ctx.createGain()
    const panner = ctx.createStereoPanner()
    source.buffer = buffer
    source.loop = true
    filter.type = 'lowpass'
    filter.frequency.value = sound.noiseFilterHz
    filter.Q.value = .3
    gain.gain.value = sound.noise
    panner.pan.value = -.08
    source.connect(filter)
    filter.connect(gain)
    gain.connect(panner)
    this.route(panner, sound.reverb * .48)

    const lfo = ctx.createOscillator()
    const lfoGain = ctx.createGain()
    lfo.type = 'sine'
    lfo.frequency.value = .07
    lfoGain.gain.value = sound.noise * .35
    lfo.connect(lfoGain)
    lfoGain.connect(gain.gain)

    source.start()
    lfo.start()
    this.bedSources.push(source, lfo)
  }

  private playSparkle(sound: Soundscape) {
    if (!this.running || !this.context || !sound.sparkleNotes?.length || !sound.sparkleLevel) return
    const ctx = this.context
    const now = ctx.currentTime
    const note = sound.sparkleNotes[Math.floor(Math.random() * sound.sparkleNotes.length)]
    const base = ctx.createOscillator()
    const overtone = ctx.createOscillator()
    const gain = ctx.createGain()
    const filter = ctx.createBiquadFilter()
    const panner = ctx.createStereoPanner()

    base.type = 'sine'
    overtone.type = sound.id === 'glass-signal' ? 'sine' : 'triangle'
    base.frequency.value = midiToHz(note)
    overtone.frequency.value = midiToHz(note) * (sound.id === 'glass-signal' ? 2.004 : 1.997)
    filter.type = 'lowpass'
    filter.frequency.value = sound.id === 'glass-signal' ? 5200 : 3200
    filter.Q.value = .4
    panner.pan.value = Math.random() * 1.1 - .55

    gain.gain.setValueAtTime(.0001, now)
    gain.gain.exponentialRampToValueAtTime(sound.sparkleLevel, now + .055)
    gain.gain.exponentialRampToValueAtTime(.0001, now + (sound.id === 'glass-signal' ? 4.2 : 3.2))

    base.connect(gain)
    overtone.connect(gain)
    gain.connect(filter)
    filter.connect(panner)
    this.route(panner, Math.min(.72, sound.reverb + .18))

    base.start(now)
    overtone.start(now)
    base.stop(now + 4.5)
    overtone.stop(now + 4.5)
    this.chordSources.push(base, overtone)
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
    return Number.isFinite(saved) && saved >= 0 && saved <= 1 ? saved : .3
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

          <p className="ambient-note">Musik dimulai setelah kamu menekan Play. Soundtrack dibuat langsung di browser dengan synth, stereo ambience, dan reverb ringan.</p>
          {error && <p className="ambient-error">{error}</p>}
        </section>
      )}
    </div>
  )
}