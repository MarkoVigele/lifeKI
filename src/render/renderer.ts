import type { Engine } from '@/lib/engine'
import { hsvCss, hsvToRgb } from '@/lib/utils'
import { RENDER_STRIDE } from '@/lib/params'

export type VisualSettings = {
  trails: number
  glow: number
  grain: number
  alliances: boolean
  signals: boolean
  biomes: boolean
  beautyMode: boolean
}

type Burst = { x: number; y: number; hue: number; mag: number; kind: number; age: number; life: number }

export class Renderer {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  private grain: HTMLCanvasElement
  private bursts: Burst[] = []
  private dens = new Uint16Array(0)
  private densCols = 0
  private densRows = 0
  private crowd = new Float32Array(0)
  private dpr = 1
  private w = 1
  private h = 1
  private cssW = 1
  private cssH = 1
  private frame = 0
  selected = -1
  observer = true

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true })
    if (!ctx) throw new Error('Canvas 2D fehlt')
    this.ctx = ctx
    this.grain = document.createElement('canvas')
    this.grain.width = 128
    this.grain.height = 128
    this.paintGrain()
  }

  private paintGrain() {
    const g = this.grain.getContext('2d')
    if (!g) return
    const img = g.createImageData(128, 128)
    for (let i = 0; i < img.data.length; i += 4) {
      const n = 80 + Math.random() * 140
      img.data[i] = n
      img.data[i + 1] = n
      img.data[i + 2] = n
      img.data[i + 3] = 28
    }
    g.putImageData(img, 0, 0)
  }

  resize(cssW: number, cssH: number, count = 0) {
    this.cssW = cssW
    this.cssH = cssH
    const cap = count > 1100 ? 1 : count > 650 ? 1.25 : 2
    this.dpr = Math.min(window.devicePixelRatio || 1, cap)
    this.w = Math.max(1, Math.floor(cssW * this.dpr))
    this.h = Math.max(1, Math.floor(cssH * this.dpr))
    this.canvas.width = this.w
    this.canvas.height = this.h
    this.canvas.style.width = `${cssW}px`
    this.canvas.style.height = `${cssH}px`
  }

  worldFromEvent(ev: PointerEvent, worldW: number, worldH: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect()
    return {
      x: ((ev.clientX - rect.left) / rect.width) * worldW,
      y: ((ev.clientY - rect.top) / rect.height) * worldH,
    }
  }

  ingestEvents(events: Float32Array) {
    const room = 48
    for (let i = 0; i + 4 < events.length; i += 5) {
      this.bursts.push({
        kind: events[i],
        x: events[i + 1],
        y: events[i + 2],
        hue: events[i + 3],
        mag: events[i + 4],
        age: 0,
        life: 14 + events[i + 4] * 12,
      })
    }
    if (this.bursts.length > room) this.bursts.splice(0, this.bursts.length - room)
  }

  draw(engine: Engine, visual: VisualSettings, day: number, worldW: number, worldH: number) {
    const ctx = this.ctx
    const { w, h, dpr } = this
    const sx = w / worldW
    const sy = h / worldH
    const render = engine.render()
    const n = render.length / RENDER_STRIDE
    const heavy = n > 700
    const packed = n > 1400

    const wantDpr = packed ? 1 : heavy ? 1.25 : Math.min(window.devicePixelRatio || 1, 2)
    if (Math.abs(wantDpr - this.dpr) > 0.2) {
      this.resize(this.cssW, this.cssH, n)
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0)
    this.frame += 1
    const trail = visual.trails
    const fade = Math.min(0.72, 0.18 + (1 - trail) ** 1.1 * 0.5)
    ctx.fillStyle = `rgba(1,1,3,${fade.toFixed(3)})`
    ctx.fillRect(0, 0, w, h)
    if (trail < 0.12 && this.frame % 8 === 0) {
      ctx.fillStyle = 'rgba(1,1,3,0.55)'
      ctx.fillRect(0, 0, w, h)
    }

    const portals = engine.portals()
    if (portals[4] > 0 && !packed) {
      this.drawPortal(portals[0] * sx, portals[1] * sy, day)
      this.drawPortal(portals[2] * sx, portals[3] * sy, day + 0.5)
    }

    const storm = engine.storm()
    if (storm[3] > 0) {
      const t = storm[2] / storm[3]
      ctx.beginPath()
      ctx.arc(storm[0] * sx, storm[1] * sy, storm[5] * sx * (0.35 + t * 0.7), 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(255,120,90,${(0.22 * (1 - t)).toFixed(3)})`
      ctx.lineWidth = 2 * dpr
      ctx.stroke()
    }

    const food = engine.food()
    const foodCap = packed ? 70 : heavy ? 110 : food.length
    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = 'rgba(210, 230, 180, 0.28)'
    const step = food.length > foodCap ? Math.ceil(food.length / foodCap) : 1
    for (let i = 0; i + 2 < food.length; i += 3 * step) {
      const s = (1.1 + food[i + 2] * 1.2) * dpr
      ctx.fillRect(food[i] * sx, food[i + 1] * sy, s, s)
    }

    const cell = 26
    const cols = Math.max(1, Math.ceil(worldW / cell))
    const rows = Math.max(1, Math.ceil(worldH / cell))
    this.ensureDensity(cols, rows)
    const dens = this.dens
    if (this.crowd.length < n) this.crowd = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      const o = i * RENDER_STRIDE
      const cx = Math.min(cols - 1, Math.max(0, Math.floor(render[o] / cell)))
      const cy = Math.min(rows - 1, Math.max(0, Math.floor(render[o + 1] / cell)))
      dens[cy * cols + cx]++
    }
    for (let i = 0; i < n; i++) {
      this.crowd[i] = this.crowdAt(render[i * RENDER_STRIDE], render[i * RENDER_STRIDE + 1], cell, cols, rows)
    }

    if (visual.alliances && !heavy) {
      ctx.globalCompositeOperation = 'lighter'
      ctx.lineWidth = 0.7 * dpr
      let bonds = 0
      for (let i = 0; i < n && bonds < 80; i++) {
        if ((render[i * RENDER_STRIDE + 7] & 4) === 0) continue
        const j = engine.bondOf(i)
        if (j <= i || j >= n) continue
        ctx.strokeStyle = hsvCss(render[i * RENDER_STRIDE + 2], 0.35, 0.7, 0.1)
        ctx.beginPath()
        ctx.moveTo(render[i * RENDER_STRIDE] * sx, render[i * RENDER_STRIDE + 1] * sy)
        ctx.lineTo(render[j * RENDER_STRIDE] * sx, render[j * RENDER_STRIDE + 1] * sy)
        ctx.stroke()
        bonds++
      }
    }

    ctx.globalCompositeOperation = 'source-over'
    const glow = visual.glow
    const glowOn = glow > 0.02
    const marks = !packed
    for (let i = 0; i < n; i++) {
      const o = i * RENDER_STRIDE
      const crowd = this.crowd[i]
      const hue = render[o + 2]
      const sat = render[o + 3]
      const val = render[o + 4]
      const size = render[o + 5] * dpr * (0.88 + glow * 0.14)
      const flags = render[o + 7]
      const x = render[o] * sx
      const y = render[o + 1] * sy
      const [r, g, b] = hsvToRgb(hue, Math.min(1, sat + crowd * 0.08), Math.min(1, val + (visual.beautyMode ? 0.12 : 0)))
      const cr = Math.round(r * 255)
      const cg = Math.round(g * 255)
      const cb = Math.round(b * 255)

      if (glowOn) {
        const hush = crowd * crowd
        const a = glow * (0.2 + (1 - hush) * 0.16) * Math.min(1, val + 0.2)
        if (a > 0.03) {
          const glowR = size * (1.55 + glow * 1.7) * (1 - hush * 0.55)
          ctx.fillStyle = `rgba(${cr},${cg},${cb},${a.toFixed(3)})`
          ctx.beginPath()
          ctx.arc(x, y, glowR, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      const coreR = Math.max(1.15 * dpr, size * (0.32 + crowd * 0.12))
      ctx.fillStyle = `rgba(${cr},${cg},${cb},${(0.78 + val * 0.22).toFixed(3)})`
      if (packed && glow < 0.35) {
        const s = Math.max(1.5, coreR * 1.45)
        ctx.fillRect(x - s * 0.5, y - s * 0.5, s, s)
      } else {
        ctx.beginPath()
        ctx.arc(x, y, coreR, 0, Math.PI * 2)
        ctx.fill()
      }

      if (marks && (flags & 2) !== 0 && crowd < 0.7) {
        ctx.strokeStyle = 'rgba(255,80,110,0.45)'
        ctx.lineWidth = 0.7 * dpr
        ctx.beginPath()
        ctx.arc(x, y, coreR * 1.5, 0.2, 2.2)
        ctx.stroke()
      }
    }

    if (this.selected >= 0 && this.selected < n) {
      const o = this.selected * RENDER_STRIDE
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'
      ctx.lineWidth = 1.2 * dpr
      ctx.beginPath()
      ctx.arc(render[o] * sx, render[o + 1] * sy, render[o + 5] * dpr * 3.2, 0, Math.PI * 2)
      ctx.stroke()
    }

    if (!packed) {
      this.bursts = this.bursts.filter((b) => {
        b.age += 1
        const t = b.age / b.life
        ctx.beginPath()
        ctx.arc(b.x * sx, b.y * sy, (6 + t * 22 * b.mag) * dpr, 0, Math.PI * 2)
        ctx.strokeStyle = hsvCss(b.hue, 0.45, 0.9, (1 - t) * 0.28)
        ctx.lineWidth = (1.2 - t) * dpr
        ctx.stroke()
        return b.age < b.life
      })
    } else {
      this.bursts.length = 0
    }

    if (visual.grain > 0.01 && !heavy) {
      ctx.globalAlpha = visual.grain * 0.18
      ctx.fillStyle = ctx.createPattern(this.grain, 'repeat') ?? 'transparent'
      ctx.fillRect(0, 0, w, h)
      ctx.globalAlpha = 1
    }
  }

  private ensureDensity(cols: number, rows: number) {
    if (this.densCols !== cols || this.densRows !== rows || this.dens.length !== cols * rows) {
      this.densCols = cols
      this.densRows = rows
      this.dens = new Uint16Array(cols * rows)
      return
    }
    this.dens.fill(0)
  }

  private crowdAt(x: number, y: number, cell: number, cols: number, rows: number) {
    const cx = Math.min(cols - 1, Math.max(0, Math.floor(x / cell)))
    const cy = Math.min(rows - 1, Math.max(0, Math.floor(y / cell)))
    let sum = 0
    for (let oy = -1; oy <= 1; oy++) {
      for (let ox = -1; ox <= 1; ox++) {
        const xx = (cx + ox + cols) % cols
        const yy = (cy + oy + rows) % rows
        sum += this.dens[yy * cols + xx]
      }
    }
    return Math.min(1, Math.max(0, (sum - 3) / 20))
  }

  private drawPortal(x: number, y: number, phase: number) {
    const ctx = this.ctx
    const dpr = this.dpr
    ctx.globalCompositeOperation = 'lighter'
    for (let k = 0; k < 2; k++) {
      ctx.beginPath()
      ctx.ellipse(x, y, (10 + k * 7 + Math.sin(phase * 20 + k) * 2) * dpr, (16 + k * 5) * dpr, phase * 3 + k, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(160, 140, 255, ${0.16 - k * 0.04})`
      ctx.lineWidth = 1.1 * dpr
      ctx.stroke()
    }
    ctx.globalCompositeOperation = 'source-over'
  }
}
