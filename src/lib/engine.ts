import init, { Sim } from '../wasm/pkg/anima_core.js'
import wasmUrl from '../wasm/pkg/anima_core_bg.wasm?url'
import { INSPECT_LEN, MIND_STRIDE, RENDER_STRIDE, WEIGHTS } from './params'

export type Inspected = {
  index: number
  x: number
  y: number
  vx: number
  vy: number
  energy: number
  age: number
  health: number
  stress: number
  species: number
  generation: number
  bond: number
  signalHue: number
  signalAmp: number
  honesty: number
  dreaming: boolean
  lying: boolean
  fitness: number
  beauty: number
  id: number
  parentA: number
  parentB: number
  received: number
  emotions: number[]
  personality: number[]
  memReward: number
  idea: number
  weights: Float32Array
}

export type EngineStats = {
  tick: number
  day: number
  alive: number
  meanEnergy: number
  meanStress: number
  births: number
  deaths: number
  dreams: number
  lies: number
  alliances: number
  maxGen: number
  meanBeauty: number
  food: number
  fossils: number
  mood: number
  ideas: number
}

let wasmMemory: WebAssembly.Memory | null = null
let boot: Promise<void> | null = null

export function bootWasm(): Promise<void> {
  if (!boot) {
    boot = init({ module_or_path: wasmUrl }).then((out) => {
      wasmMemory = out.memory
    })
  }
  return boot
}

function view(ptr: number, len: number): Float32Array {
  if (!wasmMemory) return new Float32Array()
  return new Float32Array(wasmMemory.buffer, ptr, len)
}

export class Engine {
  sim: Sim
  lastStepMs = 0

  constructor(width: number, height: number, count: number, seed: number) {
    this.sim = new Sim(width, height, count, seed)
  }

  dispose() {
    this.sim.free()
  }

  step() {
    const t0 = performance.now()
    this.sim.step()
    this.lastStepMs = performance.now() - t0
  }

  setParticleLimit(n: number) {
    this.sim.set_particle_limit(n)
  }

  particleLimit(): number {
    return this.sim.particle_limit()
  }

  setParams(params: Float32Array) {
    this.sim.set_params(params)
  }

  setMatrix(matrix: Float32Array) {
    this.sim.set_matrix(matrix)
  }

  resize(w: number, h: number) {
    this.sim.resize(w, h)
  }

  render(): Float32Array {
    const n = this.sim.alive()
    return view(this.sim.render_ptr(), n * RENDER_STRIDE)
  }

  food(): Float32Array {
    return view(this.sim.food_ptr(), this.sim.food_count() * 3)
  }

  events(): Float32Array {
    return view(this.sim.events_ptr(), this.sim.event_count() * 5)
  }

  portals(): Float32Array {
    return view(this.sim.portals_ptr(), 8)
  }

  storm(): Float32Array {
    return view(this.sim.storm_ptr(), 6)
  }

  stats(): EngineStats {
    const s = view(this.sim.stats_ptr(), 16)
    return {
      tick: s[0],
      day: s[1],
      alive: s[2],
      meanEnergy: s[3],
      meanStress: s[4],
      births: s[5],
      deaths: s[6],
      dreams: s[7],
      lies: s[8],
      alliances: s[9],
      maxGen: s[10],
      meanBeauty: s[11],
      food: s[12],
      fossils: s[13],
      mood: s[14],
      ideas: s[15],
    }
  }

  bondOf(i: number): number {
    return this.sim.bond_of(i)
  }

  pick(x: number, y: number): number {
    return this.sim.pick(x, y)
  }

  findId(id: number): number {
    return this.sim.find_id(id)
  }

  inspectById(id: number): Inspected | null {
    const i = this.findId(id)
    return i >= 0 ? this.inspect(i) : null
  }

  inspect(i: number): Inspected | null {
    const out = new Float32Array(INSPECT_LEN)
    if (!this.sim.inspect_particle(i, out)) return null
    const weights = new Float32Array(WEIGHTS)
    this.sim.inspect_weights(i, weights)
    return {
      index: i,
      x: out[0],
      y: out[1],
      vx: out[2],
      vy: out[3],
      energy: out[4],
      age: out[5],
      health: out[6],
      stress: out[7],
      species: out[8],
      generation: out[9],
      bond: out[10],
      signalHue: out[11],
      signalAmp: out[12],
      honesty: out[13],
      dreaming: out[14] > 0.5,
      lying: out[15] > 0.5,
      fitness: out[16],
      beauty: out[17],
      id: out[18],
      parentA: out[19],
      parentB: out[20],
      received: out[21],
      emotions: Array.from(out.subarray(22, 29)),
      personality: Array.from(out.subarray(29, 35)),
      memReward: out[35],
      idea: out[36],
      weights,
    }
  }

  fossils(): { species: number; fitness: number; generation: number; hue: number }[] {
    const n = this.sim.fossil_count()
    const list = []
    const buf = new Float32Array(6)
    for (let i = 0; i < n; i++) {
      if (this.sim.fossil_info(i, buf)) {
        list.push({ species: buf[0], fitness: buf[1], generation: buf[2], hue: buf[3] })
      }
    }
    return list
  }

  snapshotMinds(max = 180): Float32Array {
    const buf = new Float32Array(max * MIND_STRIDE)
    const n = this.sim.snapshot_minds(max, buf)
    return buf.subarray(0, n * MIND_STRIDE)
  }

  injectMinds(data: ArrayLike<number>) {
    const src = Float32Array.from(data)
    for (let i = 0; i + MIND_STRIDE <= src.length; i += MIND_STRIDE) {
      this.sim.inject_mind(src.subarray(i, i + MIND_STRIDE))
    }
  }

  memoryBytes(): number {
    return wasmMemory?.buffer.byteLength ?? 0
  }
}
