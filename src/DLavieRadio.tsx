import { useEffect, useRef, useState } from 'react'

type Step = 0 | 1
type BassStep = number | null
type ArpStep = number | null

type RadioTrack = {
  id: string
  title: string
  genre: string
  bpm: number
  swing: number
  chords: number[][]
  kick: Step[]
  snare: Step[]
  hats: Step[]
  openHats: Step[]
  stabs: Step[]
  bass: BassStep[]
  arp: ArpStep[]
  padWave: OscillatorType
  bassWave: OscillatorType
  leadWave: OscillatorType
  filterHz: number
  reverb: number
}

const S = (value: string): Step[] => value.split('').map((char) => char === 'x' ? 1 : 0) as Step[]
const B = (...steps: BassStep[]) => steps
const A = (...steps: ArpStep[]) => steps

const TRACKS: RadioTrack[] = [
  {
    id: 'pagi-cerah',
    title: 'Pagi Cerah',
    genre: 'Pop',
    bpm: 118,
    swing: .035,
    chords: [[60,64,67,71],[57,60,64,69],[53,57,60,64],[55,59,62,67]],
    kick: S('x...x..xx...x.x.'),
    snare: S('....x.......x...'),
    hats: S('x.x.x.x.x.x.x.x.'),
    openHats: S('......x.......x.'),
    stabs: S('x...x...x...x...'),
    bass: B(0,null,null,7,0,null,7,null,0,null,null,7,0,null,5,7),
    arp: A(0,null,1,null,2,null,1,null,0,null,2,null,3,null,2,null),
    padWave: 'triangle', bassWave: 'sine', leadWave: 'square', filterHz: 2100, reverb: .18,
  },
  {
    id: 'jalan-malam',
    title: 'Jalan Malam',
    genre: 'Synth Pop',
    bpm: 104,
    swing: .08,
    chords: [[50,57,60,64],[46,53,57,62],[48,55,59,64],[45,52,57,60]],
    kick: S('x......x..x.....'),
    snare: S('....x.......x...'),
    hats: S('x.x...x.x.x...x.'),
    openHats: S('.........x......'),
    stabs: S('x.......x.......'),
    bass: B(0,null,null,null,0,null,7,null,0,null,5,null,0,null,null,7),
    arp: A(null,0,null,2,null,1,null,3,null,0,null,2,null,1,null,2),
    padWave: 'sawtooth', bassWave: 'triangle', leadWave: 'sine', filterHz: 1450, reverb: .34,
  },
  {
    id: 'akhir-pekan',
    title: 'Akhir Pekan',
    genre: 'Funk Pop',
    bpm: 112,
    swing: .15,
    chords: [[57,61,64,67],[55,59,62,66],[52,55,59,64],[54,57,61,64]],
    kick: S('x..x..x...x..x.x'),
    snare: S('....x......xx...'),
    hats: S('xxxxxxxxxxxxxxxx'),
    openHats: S('.......x.......x'),
    stabs: S('..x...x...x...x.'),
    bass: B(0,null,7,10,null,7,null,5,0,3,null,7,null,10,7,null),
    arp: A(null,1,null,2,3,null,2,null,null,1,2,null,3,null,1,null),
    padWave: 'square', bassWave: 'sawtooth', leadWave: 'triangle', filterHz: 2550, reverb: .12,
  },
  {
    id: 'kota-setelah-hujan',
    title: 'Kota Setelah Hujan',
    genre: 'House Pop',
    bpm: 124,
    swing: 0,
    chords: [[53,57,60,64],[55,59,62,67],[57,60,64,69],[52,55,59,64]],
    kick: S('x...x...x...x...'),
    snare: S('....x.......x...'),
    hats: S('..x...x...x...x.'),
    openHats: S('..x...x...x...x.'),
    stabs: S('..x...x...x...x.'),
    bass: B(0,null,7,null,0,null,7,null,0,null,10,null,0,null,7,null),
    arp: A(0,1,2,3,2,1,3,1,0,2,3,1,2,0,1,3),
    padWave: 'sawtooth', bassWave: 'sine', leadWave: 'square', filterHz: 3200, reverb: .26,
  },
  {
    id: 'santai-sore',
    title: 'Santai Sore',
    genre: 'R&B Pop',
    bpm: 92,
    swing: .22,
    chords: [[55,59,62,66],[52,55,59,64],[57,60,64,69],[50,54,57,62]],
    kick: S('x.....x...x.....'),
    snare: S('........x.......'),
    hats: S('..x...x...x...x.'),
    openHats: S('..............x.'),
    stabs: S('x.......x...x...'),
    bass: B(0,null,null,7,null,null,10,null,0,null,5,null,7,null,null,3),
    arp: A(null,null,0,null,null,2,null,1,null,null,3,null,2,null,null,1),
    padWave: 'triangle', bassWave: 'sine', leadWave: 'sine', filterHz: 1200, reverb: .38,
  },
]

const TRACK_KEY = 'dlavie-radio-track-v2'
const VOLUME_KEY = 'dlavie-ambient-volume'
const midiToHz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12)

class RadioEngine {
  private context: AudioContext | null = null
  private output: GainNode | null = null
  private dry: GainNode | null = null
  private wet: GainNode | null = null
  private reverb: ConvolverNode | null = null
  private compressor: DynamicsCompressorNode | null = null
  private timer: number | null = null
  private nextStepTime = 0
  private step = 0
  private bar = 0
  private running = false

  private ensureContext() {
    if (this.context) return this.context
    const Ctx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) throw new Error('Web Audio tidak tersedia.')
    const ctx = new Ctx()
    const output = ctx.createGain()
    const dry = ctx.createGain()
    const wet = ctx.createGain()
    const reverb = ctx.createConvolver()
    const compressor = ctx.createDynamicsCompressor()

    reverb.buffer = this.makeImpulse(ctx, 2.1)
    dry.gain.value = .92
    wet.gain.value = .2
    output.gain.value = .0001
    compressor.threshold.value = -18
    compressor.knee.value = 12
    compressor.ratio.value = 3.5
    compressor.attack.value = .005
    compressor.release.value = .18

    dry.connect(output)
    reverb.connect(wet)
    wet.connect(output)
    output.connect(compressor)
    compressor.connect(ctx.destination)

    this.context = ctx
    this.output = output
    this.dry = dry
    this.wet = wet
    this.reverb = reverb
    this.compressor = compressor
    return ctx
  }

  private makeImpulse(ctx: AudioContext, seconds: number) {
    const length = Math.floor(ctx.sampleRate * seconds)
    const buffer = ctx.createBuffer(2, length, ctx.sampleRate)
    for (let c = 0; c < 2; c += 1) {
      const data = buffer.getChannelData(c)
      for (let i = 0; i < length; i += 1) {
        const env = Math.pow(1 - i / length, 2.7)
        data[i] = (Math.random() * 2 - 1) * env * .65
      }
    }
    return buffer
  }

  private route(node: AudioNode, send = .15) {
    if (!this.context || !this.dry || !this.reverb) return
    node.connect(this.dry)
    const gain = this.context.createGain()
    gain.gain.value = send
    node.connect(gain)
    gain.connect(this.reverb)
  }

  async start(track: RadioTrack, volume: number) {
    const ctx = this.ensureContext()
    if (ctx.state === 'suspended') await ctx.resume()
    this.stopScheduler()
    this.running = true
    this.step = 0
    this.bar = 0
    this.nextStepTime = ctx.currentTime + .06
    if (this.wet) this.wet.gain.setTargetAtTime(track.reverb, ctx.currentTime, .1)
    this.setVolume(volume)
    this.timer = window.setInterval(() => this.scheduler(track), 25)
    this.scheduler(track)
  }

  setVolume(value: number) {
    if (!this.context || !this.output) return
    const volume = Math.max(0, Math.min(1, value))
    this.output.gain.setTargetAtTime(Math.max(.0001, volume * .52), this.context.currentTime, .07)
  }

  stop() {
    this.running = false
    this.stopScheduler()
    if (this.context && this.output) this.output.gain.setTargetAtTime(.0001, this.context.currentTime, .04)
  }

  destroy() {
    this.stop()
    void this.context?.close()
    this.context = null
  }

  private stopScheduler() {
    if (this.timer !== null) window.clearInterval(this.timer)
    this.timer = null
  }

  private scheduler(track: RadioTrack) {
    if (!this.running || !this.context) return
    const ctx = this.context
    const stepDuration = (60 / track.bpm) / 4
    while (this.nextStepTime < ctx.currentTime + .12) {
      const swingDelay = this.step % 2 === 1 ? stepDuration * track.swing : 0
      this.scheduleStep(track, this.step, this.nextStepTime + swingDelay)
      this.nextStepTime += stepDuration
      this.step += 1
      if (this.step >= 16) {
        this.step = 0
        this.bar = (this.bar + 1) % track.chords.length
      }
    }
  }

  private scheduleStep(track: RadioTrack, step: number, time: number) {
    const chord = track.chords[this.bar % track.chords.length]
    if (track.kick[step]) this.kick(time, track.id === 'kota-setelah-hujan' ? .9 : .72)
    if (track.snare[step]) this.snare(time, track.id === 'akhir-pekan' ? .72 : .58)
    if (track.hats[step]) this.hat(time, step % 4 === 0 ? .17 : .1, false)
    if (track.openHats[step]) this.hat(time, .12, true)
    if (track.stabs[step]) this.chordStab(chord, time, track)

    const bassOffset = track.bass[step]
    if (bassOffset !== null) this.bass(chord[0] - 12 + bassOffset, time, track)

    const arpIndex = track.arp[step]
    if (arpIndex !== null) this.arp(chord[arpIndex % chord.length] + 12, time, track)
  }

  private kick(time: number, level: number) {
    if (!this.context) return
    const ctx = this.context
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(150, time)
    osc.frequency.exponentialRampToValueAtTime(47, time + .11)
    gain.gain.setValueAtTime(level, time)
    gain.gain.exponentialRampToValueAtTime(.0001, time + .28)
    osc.connect(gain)
    this.route(gain, .015)
    osc.start(time)
    osc.stop(time + .3)
  }

  private snare(time: number, level: number) {
    if (!this.context) return
    const ctx = this.context
    const length = Math.floor(ctx.sampleRate * .18)
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1
    const noise = ctx.createBufferSource()
    const filter = ctx.createBiquadFilter()
    const gain = ctx.createGain()
    noise.buffer = buffer
    filter.type = 'highpass'
    filter.frequency.value = 1350
    gain.gain.setValueAtTime(level, time)
    gain.gain.exponentialRampToValueAtTime(.0001, time + .16)
    noise.connect(filter)
    filter.connect(gain)
    this.route(gain, .2)
    noise.start(time)
  }

  private hat(time: number, level: number, open: boolean) {
    if (!this.context) return
    const ctx = this.context
    const length = Math.floor(ctx.sampleRate * (open ? .22 : .055))
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1
    const source = ctx.createBufferSource()
    const filter = ctx.createBiquadFilter()
    const gain = ctx.createGain()
    filter.type = 'highpass'
    filter.frequency.value = open ? 6200 : 7600
    gain.gain.setValueAtTime(level, time)
    gain.gain.exponentialRampToValueAtTime(.0001, time + (open ? .2 : .05))
    source.buffer = buffer
    source.connect(filter)
    filter.connect(gain)
    this.route(gain, open ? .22 : .05)
    source.start(time)
  }

  private bass(midi: number, time: number, track: RadioTrack) {
    if (!this.context) return
    const ctx = this.context
    const osc = ctx.createOscillator()
    const filter = ctx.createBiquadFilter()
    const gain = ctx.createGain()
    osc.type = track.bassWave
    osc.frequency.value = midiToHz(midi)
    filter.type = 'lowpass'
    filter.frequency.value = track.id === 'akhir-pekan' ? 520 : 320
    filter.Q.value = .7
    gain.gain.setValueAtTime(.0001, time)
    gain.gain.exponentialRampToValueAtTime(track.id === 'akhir-pekan' ? .12 : .095, time + .018)
    gain.gain.exponentialRampToValueAtTime(.0001, time + (track.id === 'santai-sore' ? .42 : .24))
    osc.connect(filter)
    filter.connect(gain)
    this.route(gain, .035)
    osc.start(time)
    osc.stop(time + .48)
  }

  private chordStab(chord: number[], time: number, track: RadioTrack) {
    if (!this.context) return
    const ctx = this.context
    chord.slice(0, 4).forEach((note, index) => {
      const osc = ctx.createOscillator()
      const filter = ctx.createBiquadFilter()
      const gain = ctx.createGain()
      const pan = ctx.createStereoPanner()
      osc.type = track.padWave
      osc.frequency.value = midiToHz(note)
      osc.detune.value = (index - 1.5) * 2.5
      filter.type = 'lowpass'
      filter.frequency.value = track.filterHz
      filter.Q.value = .8
      pan.pan.value = (index - 1.5) * .22
      gain.gain.setValueAtTime(.0001, time)
      gain.gain.exponentialRampToValueAtTime(track.id === 'kota-setelah-hujan' ? .038 : .03, time + .018)
      gain.gain.exponentialRampToValueAtTime(.0001, time + (track.id === 'jalan-malam' ? .82 : .32))
      osc.connect(filter)
      filter.connect(gain)
      gain.connect(pan)
      this.route(pan, track.reverb)
      osc.start(time)
      osc.stop(time + .9)
    })
  }

  private arp(midi: number, time: number, track: RadioTrack) {
    if (!this.context) return
    const ctx = this.context
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const filter = ctx.createBiquadFilter()
    const pan = ctx.createStereoPanner()
    osc.type = track.leadWave
    osc.frequency.value = midiToHz(midi)
    filter.type = 'lowpass'
    filter.frequency.value = track.id === 'kota-setelah-hujan' ? 5200 : 3600
    pan.pan.value = ((this.step % 4) - 1.5) * .22
    gain.gain.setValueAtTime(.0001, time)
    gain.gain.exponentialRampToValueAtTime(track.id === 'pagi-cerah' ? .035 : .024, time + .008)
    gain.gain.exponentialRampToValueAtTime(.0001, time + .12)
    osc.connect(filter)
    filter.connect(gain)
    gain.connect(pan)
    this.route(pan, track.reverb + .08)
    osc.start(time)
    osc.stop(time + .15)
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

export default function DLavieRadio() {
  const engine = useRef<RadioEngine | null>(null)
  const [open, setOpen] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [trackIndex, setTrackIndex] = useState(() => {
    const saved = localStorage.getItem(TRACK_KEY)
    const index = TRACKS.findIndex((track) => track.id === saved)
    return index >= 0 ? index : 0
  })
  const [volume, setVolume] = useState(() => {
    const saved = Number(localStorage.getItem(VOLUME_KEY))
    return Number.isFinite(saved) && saved >= 0 && saved <= 1 ? saved : .32
  })
  const [error, setError] = useState('')
  const track = TRACKS[trackIndex]

  useEffect(() => {
    engine.current = new RadioEngine()
    return () => engine.current?.destroy()
  }, [])

  useEffect(() => {
    localStorage.setItem(TRACK_KEY, track.id)
    localStorage.setItem(VOLUME_KEY, String(volume))
    engine.current?.setVolume(volume)
  }, [track.id, volume])

  const start = async (index = trackIndex) => {
    try {
      setError('')
      await engine.current?.start(TRACKS[index], volume)
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
    } else void start()
  }

  const chooseTrack = (index: number) => {
    setTrackIndex(index)
    if (playing) void start(index)
  }

  const shiftTrack = (direction: number) => {
    const index = (trackIndex + direction + TRACKS.length) % TRACKS.length
    chooseTrack(index)
  }

  return (
    <div className={`ambient-player${open ? ' open' : ''}`}>
      <button className="ambient-trigger" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label="Buka DLavie Radio">
        <MusicIcon playing={playing} />
        <span><small>Radio</small><strong>{track.title}</strong></span>
      </button>

      {open && (
        <section className="ambient-panel" aria-label="DLavie Radio">
          <header>
            <div><small>DLavie Radio</small><strong>Pilih musik</strong></div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Tutup pemutar">×</button>
          </header>

          <div className="ambient-now">
            <MusicIcon playing={playing} />
            <div><small>{playing ? 'Sedang diputar' : 'Siap diputar'}</small><strong>{track.title}</strong><span>{track.genre} · {track.bpm} BPM</span></div>
          </div>

          <div className="ambient-controls">
            <button type="button" onClick={() => shiftTrack(-1)} aria-label="Track sebelumnya">‹</button>
            <button className="ambient-play" type="button" onClick={toggle} aria-label={playing ? 'Jeda musik' : 'Putar musik'}><PlayIcon playing={playing} /></button>
            <button type="button" onClick={() => shiftTrack(1)} aria-label="Track berikutnya">›</button>
          </div>

          <div className="ambient-track-list">
            {TRACKS.map((item, index) => (
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

          <p className="ambient-note">Setiap track punya beat, bassline, chord, tempo, dan pola ritme yang berbeda.</p>
          {error && <p className="ambient-error">{error}</p>}
        </section>
      )}
    </div>
  )
}
