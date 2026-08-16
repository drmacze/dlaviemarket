import { useEffect, useRef, useState } from 'react'

type StepNote = number | null

type Soundscape = {
  id: string
  title: string
  subtitle: string
  genre: string
  bpm: number
  swing: number
  chords: number[][]
  waveform: OscillatorType
  chordLevel: number
  bassLevel: number
  leadLevel: number
  filterHz: number
  reverb: number
  bassPattern: StepNote[]
  arpPattern: StepNote[]
  kick: number[]
  snare: number[]
  hat: number[]
  openHat?: number[]
}

const SOUNDS: Soundscape[] = [
  {
    id: 'neon-pop',
    title: 'Neon Pop',
    subtitle: 'Synth-pop cerah · catchy & modern',
    genre: 'SYNTH POP',
    bpm: 116,
    swing: .035,
    chords: [[60, 64, 67, 71], [57, 60, 64, 69], [53, 57, 60, 64], [55, 59, 62, 67]],
    waveform: 'sawtooth', chordLevel: .026, bassLevel: .055, leadLevel: .018, filterHz: 2100, reverb: .22,
    bassPattern: [0, null, null, 0, 7, null, 0, null, 0, null, 12, null, 7, null, 0, null],
    arpPattern: [0, null, 7, null, 12, null, 7, null, 4, null, 12, null, 7, null, 16, null],
    kick: [0, 4, 8, 11, 12], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14], openHat: [7, 15],
  },
  {
    id: 'checkout-bounce',
    title: 'Checkout Bounce',
    subtitle: 'Chill pop · bounce ringan & groovy',
    genre: 'CHILL POP',
    bpm: 104,
    swing: .095,
    chords: [[57, 61, 64, 69], [52, 57, 60, 64], [54, 57, 61, 66], [55, 59, 62, 67]],
    waveform: 'triangle', chordLevel: .028, bassLevel: .062, leadLevel: .015, filterHz: 1750, reverb: .18,
    bassPattern: [0, null, 0, null, 7, null, null, 5, 0, null, 12, null, 7, null, 5, null],
    arpPattern: [null, 7, null, 12, null, 16, null, 12, null, 7, null, 14, null, 12, null, 7],
    kick: [0, 3, 8, 10, 14], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14], openHat: [6, 14],
  },
  {
    id: 'city-lights',
    title: 'City Lights',
    subtitle: 'City-pop electronic · bright night drive',
    genre: 'CITY POP',
    bpm: 120,
    swing: .055,
    chords: [[59, 63, 66, 71], [64, 68, 71, 76], [61, 64, 68, 73], [62, 66, 69, 74]],
    waveform: 'sawtooth', chordLevel: .023, bassLevel: .053, leadLevel: .021, filterHz: 2450, reverb: .25,
    bassPattern: [0, null, 7, null, 12, null, 7, 9, 0, null, 7, null, 12, null, 9, null],
    arpPattern: [12, null, 16, 19, null, 16, 12, null, 7, null, 12, 16, null, 19, 16, null],
    kick: [0, 4, 8, 12], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14], openHat: [7, 15],
  },
  {
    id: 'digital-funk',
    title: 'Digital Funk',
    subtitle: 'Future funk · bassy, glossy & fun',
    genre: 'FUTURE FUNK',
    bpm: 112,
    swing: .12,
    chords: [[55, 59, 62, 67], [60, 64, 67, 71], [57, 60, 64, 69], [62, 65, 69, 72]],
    waveform: 'square', chordLevel: .019, bassLevel: .072, leadLevel: .018, filterHz: 1950, reverb: .16,
    bassPattern: [0, null, 0, 7, null, 5, null, 7, 0, 12, null, 7, null, 5, 7, null],
    arpPattern: [null, 12, 7, null, 16, null, 12, 7, null, 19, null, 16, 12, null, 7, 12],
    kick: [0, 3, 6, 8, 11, 14], snare: [4, 12], hat: [0, 1, 2, 4, 6, 8, 9, 10, 12, 14], openHat: [7, 15],
  },
  {
    id: 'late-shift',
    title: 'Late Shift',
    subtitle: 'Indie electronic · santai tapi tetap jalan',
    genre: 'INDIE ELECTRONIC',
    bpm: 98,
    swing: .07,
    chords: [[52, 55, 59, 64], [48, 52, 55, 60], [50, 54, 57, 62], [55, 59, 62, 67]],
    waveform: 'triangle', chordLevel: .031, bassLevel: .05, leadLevel: .012, filterHz: 1550, reverb: .3,
    bassPattern: [0, null, null, 7, 0, null, 5, null, 0, null, 12, null, 7, null, 5, null],
    arpPattern: [null, 7, null, 12, null, 7, 4, null, null, 12, null, 16, null, 12, 7, null],
    kick: [0, 5, 8, 13], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14], openHat: [15],
  },
]

const TRACK_KEY = 'dlavie-ambient-track'
const VOLUME_KEY = 'dlavie-ambient-volume'
const midiToHz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12)

class RadioEngine {
  private context: AudioContext | null = null
  private output: GainNode | null = null
  private dry: GainNode | null = null
  private wet: GainNode | null = null
  private reverb: ConvolverNode | null = null
  private compressor: DynamicsCompressorNode | null = null
  private scheduler: number | null = null
  private current: Soundscape | null = null
  private nextStepTime = 0
  private step = 0
  private chordIndex = 0
  private running = false
  private noiseBuffer: AudioBuffer | null = null

  private ensureContext() {
    if (this.context) return this.context
    const Ctx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) throw new Error('Web Audio tidak didukung di browser ini.')

    this.context = new Ctx()
    const ctx = this.context
    this.output = ctx.createGain()
    this.dry = ctx.createGain()
    this.wet = ctx.createGain()
    this.reverb = ctx.createConvolver()
    this.compressor = ctx.createDynamicsCompressor()

    this.output.gain.value = .0001
    this.dry.gain.value = .92
    this.wet.gain.value = .22
    this.reverb.buffer = this.createImpulse(ctx, 2.25, 2.5)
    this.noiseBuffer = this.createNoiseBuffer(ctx)

    this.compressor.threshold.value = -21
    this.compressor.knee.value = 18
    this.compressor.ratio.value = 3.2
    this.compressor.attack.value = .008
    this.compressor.release.value = .23

    this.dry.connect(this.output)
    this.reverb.connect(this.wet)
    this.wet.connect(this.output)
    this.output.connect(this.compressor)
    this.compressor.connect(ctx.destination)
    return ctx
  }

  private createImpulse(ctx: AudioContext, seconds: number, decay: number) {
    const length = Math.floor(ctx.sampleRate * seconds)
    const buffer = ctx.createBuffer(2, length, ctx.sampleRate)
    for (let channel = 0; channel < 2; channel += 1) {
      const data = buffer.getChannelData(channel)
      for (let i = 0; i < length; i += 1) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay) * .72
      }
    }
    return buffer
  }

  private createNoiseBuffer(ctx: AudioContext) {
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * .5), ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1
    return buffer
  }

  private route(node: AudioNode, wetAmount = .2) {
    if (!this.context || !this.dry || !this.reverb) return
    node.connect(this.dry)
    const send = this.context.createGain()
    send.gain.value = wetAmount
    node.connect(send)
    send.connect(this.reverb)
  }

  async start(sound: Soundscape, volume: number) {
    const ctx = this.ensureContext()
    if (ctx.state === 'suspended') await ctx.resume()
    this.stop(false)
    this.current = sound
    this.running = true
    this.step = 0
    this.chordIndex = 0
    this.nextStepTime = ctx.currentTime + .055
    if (this.wet) this.wet.gain.setTargetAtTime(sound.reverb, ctx.currentTime, .08)
    this.setVolume(volume)
    this.scheduler = window.setInterval(() => this.scheduleAhead(), 24)
    this.scheduleAhead()
  }

  setVolume(volume: number) {
    if (!this.context || !this.output) return
    const safe = Math.max(0, Math.min(1, volume))
    this.output.gain.cancelScheduledValues(this.context.currentTime)
    this.output.gain.setTargetAtTime(Math.max(.0001, safe * .52), this.context.currentTime, .08)
  }

  stop(fade = true) {
    this.running = false
    if (this.scheduler !== null) window.clearInterval(this.scheduler)
    this.scheduler = null
    if (fade && this.context && this.output) {
      this.output.gain.cancelScheduledValues(this.context.currentTime)
      this.output.gain.setTargetAtTime(.0001, this.context.currentTime, .05)
    }
  }

  destroy() {
    this.stop()
    void this.context?.close()
    this.context = null
    this.output = null
    this.dry = null
    this.wet = null
    this.reverb = null
    this.compressor = null
  }

  private scheduleAhead() {
    if (!this.running || !this.context || !this.current) return
    const ctx = this.context
    while (this.nextStepTime < ctx.currentTime + .14) {
      this.scheduleStep(this.current, this.step, this.nextStepTime)
      const base = 60 / this.current.bpm / 4
      const swing = this.current.swing * base
      this.nextStepTime += base + (this.step % 2 ? swing : -swing)
      this.step = (this.step + 1) % 16
    }
  }

  private scheduleStep(sound: Soundscape, step: number, time: number) {
    const chord = sound.chords[this.chordIndex % sound.chords.length]
    if (step === 0) {
      this.scheduleChord(sound, chord, time)
      this.chordIndex = (this.chordIndex + 1) % sound.chords.length
    }

    if (sound.kick.includes(step)) this.scheduleKick(time, sound.id === 'digital-funk' ? .12 : .105)
    if (sound.snare.includes(step)) this.scheduleSnare(time, sound.id === 'city-lights' ? .075 : .065)
    if (sound.hat.includes(step)) this.scheduleHat(time, false, sound.id === 'digital-funk' ? .032 : .026)
    if (sound.openHat?.includes(step)) this.scheduleHat(time, true, .026)

    const bassOffset = sound.bassPattern[step]
    if (bassOffset !== null) this.scheduleBass(chord[0] - 12 + bassOffset, time, sound)

    const arpOffset = sound.arpPattern[step]
    if (arpOffset !== null) this.scheduleLead(chord[0] + 12 + arpOffset, time, sound)
  }

  private scheduleKick(time: number, level: number) {
    if (!this.context) return
    const ctx = this.context
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(145, time)
    osc.frequency.exponentialRampToValueAtTime(47, time + .12)
    gain.gain.setValueAtTime(.0001, time)
    gain.gain.exponentialRampToValueAtTime(level, time + .006)
    gain.gain.exponentialRampToValueAtTime(.0001, time + .2)
    osc.connect(gain)
    this.route(gain, .025)
    osc.start(time)
    osc.stop(time + .22)
  }

  private scheduleSnare(time: number, level: number) {
    if (!this.context || !this.noiseBuffer) return
    const ctx = this.context
    const noise = ctx.createBufferSource()
    const noiseFilter = ctx.createBiquadFilter()
    const noiseGain = ctx.createGain()
    noise.buffer = this.noiseBuffer
    noiseFilter.type = 'highpass'
    noiseFilter.frequency.value = 1450
    noiseGain.gain.setValueAtTime(level, time)
    noiseGain.gain.exponentialRampToValueAtTime(.0001, time + .13)
    noise.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    this.route(noiseGain, .18)
    noise.start(time)
    noise.stop(time + .15)

    const tone = ctx.createOscillator()
    const toneGain = ctx.createGain()
    tone.type = 'triangle'
    tone.frequency.value = 185
    toneGain.gain.setValueAtTime(level * .34, time)
    toneGain.gain.exponentialRampToValueAtTime(.0001, time + .09)
    tone.connect(toneGain)
    this.route(toneGain, .08)
    tone.start(time)
    tone.stop(time + .11)
  }

  private scheduleHat(time: number, open: boolean, level: number) {
    if (!this.context || !this.noiseBuffer) return
    const ctx = this.context
    const noise = ctx.createBufferSource()
    const filter = ctx.createBiquadFilter()
    const gain = ctx.createGain()
    noise.buffer = this.noiseBuffer
    filter.type = 'highpass'
    filter.frequency.value = open ? 6200 : 7600
    gain.gain.setValueAtTime(level, time)
    gain.gain.exponentialRampToValueAtTime(.0001, time + (open ? .22 : .045))
    noise.connect(filter)
    filter.connect(gain)
    this.route(gain, open ? .11 : .025)
    noise.start(time)
    noise.stop(time + (open ? .24 : .06))
  }

  private scheduleBass(midi: number, time: number, sound: Soundscape) {
    if (!this.context) return
    const ctx = this.context
    const osc = ctx.createOscillator()
    const sub = ctx.createOscillator()
    const filter = ctx.createBiquadFilter()
    const gain = ctx.createGain()
    osc.type = sound.id === 'digital-funk' ? 'square' : 'sawtooth'
    sub.type = 'sine'
    osc.frequency.value = midiToHz(midi)
    sub.frequency.value = midiToHz(midi - 12)
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(sound.id === 'digital-funk' ? 620 : 520, time)
    filter.frequency.exponentialRampToValueAtTime(240, time + .22)
    filter.Q.value = 1.2
    gain.gain.setValueAtTime(.0001, time)
    gain.gain.exponentialRampToValueAtTime(sound.bassLevel, time + .012)
    gain.gain.exponentialRampToValueAtTime(.0001, time + .28)
    osc.connect(gain)
    sub.connect(gain)
    gain.connect(filter)
    this.route(filter, .035)
    osc.start(time)
    sub.start(time)
    osc.stop(time + .31)
    sub.stop(time + .31)
  }

  private scheduleLead(midi: number, time: number, sound: Soundscape) {
    if (!this.context) return
    const ctx = this.context
    const osc = ctx.createOscillator()
    const filter = ctx.createBiquadFilter()
    const gain = ctx.createGain()
    const pan = ctx.createStereoPanner()
    osc.type = sound.id === 'city-lights' ? 'sawtooth' : 'triangle'
    osc.frequency.value = midiToHz(midi)
    filter.type = 'lowpass'
    filter.frequency.value = sound.filterHz + 900
    filter.Q.value = .65
    pan.pan.value = ((midi % 5) - 2) * .16
    gain.gain.setValueAtTime(.0001, time)
    gain.gain.exponentialRampToValueAtTime(sound.leadLevel, time + .014)
    gain.gain.exponentialRampToValueAtTime(.0001, time + .18)
    osc.connect(gain)
    gain.connect(filter)
    filter.connect(pan)
    this.route(pan, Math.min(.5, sound.reverb + .12))
    osc.start(time)
    osc.stop(time + .22)
  }

  private scheduleChord(sound: Soundscape, chord: number[], time: number) {
    if (!this.context) return
    const ctx = this.context
    const measure = 60 / sound.bpm * 4

    chord.forEach((midi, index) => {
      const osc = ctx.createOscillator()
      const filter = ctx.createBiquadFilter()
      const gain = ctx.createGain()
      const pan = ctx.createStereoPanner()
      osc.type = sound.waveform
      osc.frequency.value = midiToHz(midi)
      osc.detune.value = (index - 1.5) * 3.5
      filter.type = 'lowpass'
      filter.frequency.value = sound.filterHz
      filter.Q.value = .65
      pan.pan.value = (index - 1.5) * .22
      gain.gain.setValueAtTime(.0001, time)
      gain.gain.exponentialRampToValueAtTime(sound.chordLevel / chord.length * 3.4, time + .055)
      gain.gain.setTargetAtTime(sound.chordLevel / chord.length * 1.25, time + .17, .16)
      gain.gain.exponentialRampToValueAtTime(.0001, time + Math.max(.48, measure - .08))
      osc.connect(gain)
      gain.connect(filter)
      filter.connect(pan)
      this.route(pan, sound.reverb)
      osc.start(time)
      osc.stop(time + measure)
    })
  }
}

function MusicIcon({ playing }: { playing: boolean }) {
  return <span className={`ambient-eq${playing ? ' playing' : ''}`} aria-hidden="true"><i /><i /><i /></span>
}

function PlayIcon({ playing }: { playing: boolean }) {
  return playing
    ? <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
    : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7Z"/></svg>
}

export default function AmbientPlayer() {
  const engine = useRef<RadioEngine | null>(null)
  const [open, setOpen] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [trackIndex, setTrackIndex] = useState(() => {
    const saved = localStorage.getItem(TRACK_KEY)
    const index = SOUNDS.findIndex((sound) => sound.id === saved)
    return index >= 0 ? index : 0
  })
  const [volume, setVolume] = useState(() => {
    const saved = Number(localStorage.getItem(VOLUME_KEY))
    return Number.isFinite(saved) && saved >= 0 && saved <= 1 ? saved : .28
  })
  const [error, setError] = useState('')
  const sound = SOUNDS[trackIndex]

  useEffect(() => {
    engine.current = new RadioEngine()
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
    } else {
      void start()
    }
  }

  const chooseTrack = (index: number) => {
    setTrackIndex(index)
    if (playing) void start(index)
  }

  const shiftTrack = (direction: number) => {
    chooseTrack((trackIndex + direction + SOUNDS.length) % SOUNDS.length)
  }

  return (
    <div className={`ambient-player${open ? ' open' : ''}`}>
      <button className="ambient-trigger" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label="Buka DLavie Radio">
        <MusicIcon playing={playing} />
        <span><small>DLavie Radio</small><strong>{sound.title}</strong></span>
      </button>

      {open && (
        <section className="ambient-panel" aria-label="DLavie Radio">
          <header>
            <div><small>DLavie Radio</small><strong>Musik buat nemenin browsing</strong></div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Tutup pemutar">×</button>
          </header>

          <div className="ambient-now">
            <MusicIcon playing={playing} />
            <div>
              <small>{playing ? `${sound.genre} · ${sound.bpm} BPM` : 'Siap diputar'}</small>
              <strong>{sound.title}</strong>
              <span>{sound.subtitle}</span>
            </div>
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
                <span><strong>{item.title}</strong><small>{item.genre} · {item.bpm} BPM</small></span>
                {index === trackIndex && <b>{playing ? 'PLAY' : 'SELECTED'}</b>}
              </button>
            ))}
          </div>

          <label className="ambient-volume">
            <span>Volume <b>{Math.round(volume * 100)}%</b></span>
            <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(event) => setVolume(Number(event.target.value))} />
          </label>

          <p className="ambient-note">Semua track dibuat original di browser. Musik baru mulai setelah kamu menekan Play.</p>
          {error && <p className="ambient-error">{error}</p>}
        </section>
      )}
    </div>
  )
}
