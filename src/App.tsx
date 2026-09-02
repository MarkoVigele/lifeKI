import { useCallback, useEffect, useRef, useState } from 'react'
import { ControlDock } from '@/components/ControlDock'
import { GodBar, TOOL_WASM, type ToolId } from '@/components/GodBar'
import { Hud } from '@/components/Hud'
import { Inspector } from '@/components/Inspector'
import { Tutorial } from '@/components/Tutorial'
import { bootWasm, Engine, type EngineStats, type Inspected } from '@/lib/engine'
import { defaultParams, DEFAULT_MATRIX, type ParamKey } from '@/lib/params'
import { PRESETS } from '@/lib/presets'
import { exportSlot, importSlot, loadSlots, persistSlots, writeAutosave, type SaveSlot } from '@/lib/saves'
import { COMPLEXITY_TOOLS, FIRST_LIGHT_COUNT, loadGuide, saveGuide } from '@/lib/tutorial'
import { Renderer, type RenderFps, type VisualSettings } from '@/render/renderer'

const VIS_KEY = 'lifeki.visual.v1'

/** Simulation clock: constant 60 Hz, independent of display / touch / render cap. */
const SIM_HZ = 60
const SIM_MS = 1000 / SIM_HZ
const MAX_SIM_STEPS = 5

const DEFAULT_VISUAL: VisualSettings = {
  trails: 0.66,
  glow: 0.72,
  grain: 0.16,
  alliances: true,
  signals: true,
  biomes: true,
  beautyMode: false,
  renderFps: 60,
}

function parseRenderFps(value: unknown): RenderFps {
  if (value === 30 || value === 60 || value === 120 || value === 'auto') return value
  return 60
}

function loadVisual(): VisualSettings {
  try {
    const raw = localStorage.getItem(VIS_KEY)
    if (!raw) return { ...DEFAULT_VISUAL }
    const data = JSON.parse(raw) as Partial<VisualSettings>
    return { ...DEFAULT_VISUAL, ...data, renderFps: parseRenderFps(data.renderFps) }
  } catch {
    return { ...DEFAULT_VISUAL }
  }
}

function saveVisual(v: VisualSettings) {
  localStorage.setItem(VIS_KEY, JSON.stringify(v))
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<Engine | null>(null)
  const rendererRef = useRef<Renderer | null>(null)
  const paramsRef = useRef(defaultParams())
  const matrixRef = useRef(new Float32Array(DEFAULT_MATRIX))
  const visualRef = useRef<VisualSettings>(loadVisual())
  const pausedRef = useRef(false)
  const toolRef = useRef<ToolId>('attract')
  const brushRef = useRef(72)
  const strengthRef = useRef(1.35)
  const emotionRef = useRef(0)
  const pointerRef = useRef({
    down: false,
    x: 0,
    y: 0,
    clientX: 0,
    clientY: 0,
    visible: false,
    startX: 0,
    startY: 0,
    dragged: false,
  })
  const brushCursorRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef(-1)
  const selectedIdRef = useRef(-1)
  const countRef = useRef(FIRST_LIGHT_COUNT)
  const seedRef = useRef(Date.now())
  const presetIdRef = useRef('firstlight')
  const rafRef = useRef(0)

  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paused, setPaused] = useState(false)
  const [tool, setTool] = useState<ToolId>('attract')
  const [emotion, setEmotion] = useState(0)
  const [brush, setBrush] = useState(72)
  const [strength, setStrength] = useState(1.35)
  const [params, setParams] = useState(() => defaultParams())
  const [count, setCount] = useState(FIRST_LIGHT_COUNT)
  const [visual, setVisual] = useState<VisualSettings>(() => loadVisual())
  const [presetId, setPresetId] = useState('firstlight')
  const [dockOpen, setDockOpen] = useState(false)
  const [tutorialOpen, setTutorialOpen] = useState(() => !loadGuide().seen)
  const [tutorialStep, setTutorialStep] = useState(0)
  const [complexity, setComplexity] = useState(() => loadGuide().complexity)
  const [stats, setStats] = useState<EngineStats | null>(null)
  const [fps, setFps] = useState(0)
  const [inspected, setInspected] = useState<Inspected | null>(null)
  const [slots, setSlots] = useState<(SaveSlot | null)[]>(() => loadSlots())
  const [fossils, setFossils] = useState<{ species: number; fitness: number; generation: number; hue: number }[]>([])
  const [stepMs, setStepMs] = useState(0)
  const [memoryMb, setMemoryMb] = useState(0)
  const overlaysRef = useRef({ dock: false, tutorial: false, inspector: false })
  const complexityRef = useRef(complexity)
  const onPointerRef = useRef<(ev: PointerEvent) => void>(() => {})
  complexityRef.current = complexity

  overlaysRef.current = { dock: dockOpen, tutorial: tutorialOpen, inspector: inspected != null }

  const dismissOverlays = useCallback(() => {
    const o = overlaysRef.current
    if (o.dock) setDockOpen(false)
    if (o.tutorial) {
      setTutorialOpen(false)
      saveGuide(true, complexityRef.current)
    }
    if (o.inspector) {
      selectedRef.current = -1
      selectedIdRef.current = -1
      setInspected(null)
    }
  }, [])

  const worldSize = useCallback(() => {
    return { w: window.innerWidth, h: window.innerHeight }
  }, [])

  const createWorld = useCallback(
    (nextCount: number, seed: number, inject?: ArrayLike<number>) => {
      const prev = engineRef.current
      prev?.dispose()
      const { w, h } = worldSize()
      const spawn = inject && inject.length > 0 ? 48 : nextCount
      const engine = new Engine(w, h, spawn, seed)
      engine.setParams(paramsRef.current)
      engine.setMatrix(matrixRef.current)
      if (inject && inject.length > 0) engine.injectMinds(inject)
      engineRef.current = engine
      seedRef.current = seed
      selectedRef.current = -1
      selectedIdRef.current = -1
      setInspected(null)
    },
    [worldSize],
  )

  useEffect(() => {
    let dead = false
    void (async () => {
      try {
        await bootWasm()
        if (dead) return
        const canvas = canvasRef.current
        if (!canvas) throw new Error('Canvas fehlt')
        const renderer = new Renderer(canvas)
        rendererRef.current = renderer
        const { w, h } = worldSize()
        const first = PRESETS.find((p) => p.id === 'firstlight') ?? PRESETS[0]
        renderer.resize(w, h, first.count)
        paramsRef.current = new Float32Array(first.params)
        matrixRef.current = new Float32Array(first.matrix)
        countRef.current = first.count
        setParams(new Float32Array(first.params))
        setCount(first.count)
        createWorld(first.count, Date.now())
        setReady(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'WASM konnte nicht starten')
      }
    })()
    return () => {
      dead = true
    }
  }, [createWorld, worldSize])

  useEffect(() => {
    const onResize = () => {
      const { w, h } = worldSize()
      rendererRef.current?.resize(w, h, countRef.current)
      engineRef.current?.resize(w, h)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [worldSize])

  useEffect(() => {
    let frames = 0
    let last = performance.now()
    let simAcc = 0
    let renderAcc = 0
    let fpsAt = last
    let hud = 0
    const applyIfHeld = () => {
      const held = pointerRef.current
      if (held.down && held.dragged && isContinuous(toolRef.current)) {
        applyHeldTool(held.x, held.y)
      }
    }
    const tick = (now: number) => {
      rafRef.current = requestAnimationFrame(tick)
      const elapsed = Math.min(80, now - last)
      last = now
      const engine = engineRef.current
      const renderer = rendererRef.current
      if (!engine || !renderer) return

      if (pausedRef.current) {
        simAcc += elapsed
        if (simAcc >= SIM_MS) {
          applyIfHeld()
          simAcc = 0
        }
      } else {
        simAcc += elapsed
        let steps = 0
        while (simAcc >= SIM_MS && steps < MAX_SIM_STEPS) {
          applyIfHeld()
          engine.setParams(paramsRef.current)
          engine.step()
          renderer.ingestEvents(engine.events())
          simAcc -= SIM_MS
          steps++
        }
      }

      renderAcc += elapsed
      const cap = visualRef.current.renderFps
      const renderMs = cap === 'auto' ? 0 : 1000 / cap
      const shouldDraw = cap === 'auto' || renderAcc >= renderMs
      if (shouldDraw) {
        if (renderMs > 0) renderAcc %= renderMs
        else renderAcc = 0
        const { w, h } = worldSize()
        if (selectedIdRef.current >= 0) {
          selectedRef.current = engine.findId(selectedIdRef.current)
        }
        renderer.selected = selectedRef.current
        renderer.observer = toolRef.current === 'observe'
        renderer.draw(engine, visualRef.current, engine.stats().day, engine.sim.width() || w, engine.sim.height() || h)
        frames += 1
      }
      placeBrushCursor()
      if (now - fpsAt >= 500) {
        setFps(Math.round((frames * 1000) / (now - fpsAt)))
        frames = 0
        fpsAt = now
      }
      if (now - hud > 180) {
        hud = now
        setStats(engine.stats())
        setStepMs(engine.lastStepMs)
        setMemoryMb(engine.memoryBytes() / 1048576)
        if (selectedIdRef.current >= 0) {
          const live = engine.inspectById(selectedIdRef.current)
          if (live) setInspected(live)
        }
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [worldSize])

  useEffect(() => {
    const id = window.setInterval(() => {
      const engine = engineRef.current
      if (!engine) return
      const minds = engine.snapshotMinds(160)
      writeAutosave({
        id: -1,
        name: 'Autosave',
        favorite: false,
        updatedAt: Date.now(),
        presetId: presetIdRef.current,
        count: countRef.current,
        seed: seedRef.current,
        params: Array.from(paramsRef.current),
        matrix: Array.from(matrixRef.current),
        minds: Array.from(minds),
        fossils: engine.sim.fossil_count(),
      })
      setFossils(engine.fossils())
    }, 20000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.code === 'Space') {
        e.preventDefault()
        setPaused((p) => {
          pausedRef.current = !p
          return !p
        })
      }
      if (e.key === 'd' || e.key === 'D') {
        if (window.matchMedia('(min-width: 768px)').matches) {
          setDockOpen((v) => !v)
        } else {
          setDockOpen(false)
        }
      }
      if (e.key === 't' || e.key === 'T') setTutorialOpen((v) => !v)
      if (e.key === 'f' || e.key === 'F') {
        setVisual((v) => {
          const next = { ...v, beautyMode: !v.beautyMode }
          visualRef.current = next
          saveVisual(next)
          return next
        })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const placeBrushCursor = () => {
    const el = brushCursorRef.current
    const canvas = canvasRef.current
    if (!el || !canvas) return
    const ptr = pointerRef.current
    if (!ptr.visible) {
      el.style.opacity = '0'
      return
    }
    const engine = engineRef.current
    const worldW = engine?.sim.width() || canvas.clientWidth
    const r = brushRef.current * (canvas.clientWidth / Math.max(1, worldW))
    el.style.width = `${r * 2}px`
    el.style.height = `${r * 2}px`
    el.style.transform = `translate(${ptr.clientX - r}px, ${ptr.clientY - r}px)`
    el.style.opacity = ptr.down ? '0.85' : '0.45'
  }

  const inspectAt = (x: number, y: number) => {
    const engine = engineRef.current
    if (!engine) return
    const i = engine.pick(x, y)
    if (i < 0) return
    const view = engine.inspect(i)
    if (!view) return
    selectedRef.current = i
    selectedIdRef.current = view.id
    rendererRef.current && (rendererRef.current.selected = i)
    setInspected(view)
  }

  const applyHeldTool = (x: number, y: number) => {
    const engine = engineRef.current
    if (!engine) return
    const t = toolRef.current === 'observe' ? 'attract' : toolRef.current
    const wasmTool = TOOL_WASM[t]
    const aux = t === 'emotion' ? emotionRef.current : t === 'storm' ? 1 : 0
    engine.sim.apply_tool(wasmTool, x, y, brushRef.current, strengthRef.current, aux)
  }

  const isContinuous = (t: ToolId) =>
    t === 'attract' ||
    t === 'repel' ||
    t === 'give' ||
    t === 'take' ||
    t === 'emotion' ||
    t === 'mutate' ||
    t === 'enlighten' ||
    t === 'freeze' ||
    t === 'observe'

  const onPointer = (ev: PointerEvent) => {
    const renderer = rendererRef.current
    const engine = engineRef.current
    if (!renderer || !engine) return
    const pos = renderer.worldFromEvent(ev, engine.sim.width(), engine.sim.height())
    const ptr = pointerRef.current
    ptr.x = pos.x
    ptr.y = pos.y
    ptr.clientX = ev.clientX
    ptr.clientY = ev.clientY
    ptr.visible = ev.type !== 'pointerleave' && ev.type !== 'pointercancel'
    placeBrushCursor()
    if (ev.type === 'pointerdown') {
      const mobile = window.matchMedia('(max-width: 767px)').matches
      const o = overlaysRef.current
      if (mobile && (o.dock || o.tutorial || o.inspector)) {
        ev.preventDefault()
        dismissOverlays()
        return
      }
      ptr.down = true
      ptr.dragged = false
      ptr.startX = pos.x
      ptr.startY = pos.y
      canvasRef.current?.setPointerCapture(ev.pointerId)
    } else if (ev.type === 'pointermove' && ptr.down) {
      const dist = Math.hypot(pos.x - ptr.startX, pos.y - ptr.startY)
      if (dist > 7 && !ptr.dragged) {
        ptr.dragged = true
        if (!isContinuous(toolRef.current)) applyHeldTool(pos.x, pos.y)
      }
    } else if (ev.type === 'pointerup' || ev.type === 'pointercancel') {
      if (ptr.down && !ptr.dragged) {
        if (toolRef.current === 'observe') inspectAt(pos.x, pos.y)
        else applyHeldTool(pos.x, pos.y)
      }
      ptr.down = false
      ptr.dragged = false
    } else if (ev.type === 'pointerleave' && !ptr.down) {
      ptr.visible = false
    }
  }
  onPointerRef.current = onPointer

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const down = (e: PointerEvent) => onPointerRef.current(e)
    const move = (e: PointerEvent) => onPointerRef.current(e)
    const up = (e: PointerEvent) => onPointerRef.current(e)
    const wheel = (e: WheelEvent) => {
      e.preventDefault()
      const next = Math.min(160, Math.max(18, brushRef.current + (e.deltaY > 0 ? -8 : 8)))
      brushRef.current = next
      setBrush(next)
    }
    canvas.addEventListener('pointerdown', down)
    canvas.addEventListener('pointermove', move)
    canvas.addEventListener('pointerup', up)
    canvas.addEventListener('pointercancel', up)
    canvas.addEventListener('pointerleave', up)
    canvas.addEventListener('wheel', wheel, { passive: false })
    return () => {
      canvas.removeEventListener('pointerdown', down)
      canvas.removeEventListener('pointermove', move)
      canvas.removeEventListener('pointerup', up)
      canvas.removeEventListener('pointercancel', up)
      canvas.removeEventListener('pointerleave', up)
      canvas.removeEventListener('wheel', wheel)
    }
  }, [ready])

  const onParam = (key: ParamKey, value: number) => {
    const idx: Record<ParamKey, number> = {
      timeScale: 0,
      friction: 1,
      maxSpeed: 2,
      perception: 3,
      repulsion: 4,
      forceScale: 5,
      energyDrain: 6,
      foodRate: 7,
      foodEnergy: 8,
      reproCost: 9,
      reproThreshold: 10,
      mutation: 11,
      dreamIntensity: 12,
      dreamFreq: 13,
      lieTendency: 14,
      liePenalty: 15,
      cultureRate: 16,
      wisdomInherit: 17,
      chaos: 18,
      beautySelect: 19,
      empathyRadius: 20,
      empathyContagion: 21,
      memoryDecay: 22,
      signalComplexity: 23,
      mutationPoetry: 24,
      godMood: 25,
      hebbian: 26,
      daySpeed: 27,
      nnInfluence: 28,
      speciesCount: 29,
      sexualRepro: 30,
      altruism: 31,
      portalRate: 32,
      catastropheRate: 33,
      maxAge: 34,
      combat: 35,
    }
    const next = new Float32Array(paramsRef.current)
    next[idx[key]] = value
    paramsRef.current = next
    setParams(next)
    engineRef.current?.setParams(next)
  }

  const applyPreset = (id: string) => {
    const preset = PRESETS.find((p) => p.id === id)
    if (!preset) return
    paramsRef.current = new Float32Array(preset.params)
    matrixRef.current = new Float32Array(preset.matrix)
    countRef.current = preset.count
    presetIdRef.current = id
    setParams(new Float32Array(preset.params))
    setCount(preset.count)
    setPresetId(id)
    createWorld(preset.count, Date.now())
  }

  const collectSlot = (i: number, name: string): SaveSlot => {
    const engine = engineRef.current
    const minds = engine?.snapshotMinds(160) ?? new Float32Array()
    return {
      id: i,
      name,
      favorite: slots[i]?.favorite ?? false,
      updatedAt: Date.now(),
      presetId: presetIdRef.current,
      count: countRef.current,
      seed: seedRef.current,
      params: Array.from(paramsRef.current),
      matrix: Array.from(matrixRef.current),
      minds: Array.from(minds),
      fossils: engine?.sim.fossil_count() ?? 0,
    }
  }

  const restoreSlot = (slot: SaveSlot) => {
    paramsRef.current = Float32Array.from(slot.params)
    matrixRef.current = Float32Array.from(slot.matrix)
    countRef.current = slot.count
    presetIdRef.current = slot.presetId ?? 'custom'
    setParams(Float32Array.from(slot.params))
    setCount(slot.count)
    setPresetId(slot.presetId ?? 'custom')
    createWorld(Math.max(80, slot.count), slot.seed, slot.minds)
  }

  const currentPreset = PRESETS.find((p) => p.id === presetId)?.name ?? 'Eigene Gesetze'

  return (
    <div className="relative h-full w-full bg-[#010103]">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none" />
      <div
        ref={brushCursorRef}
        className="pointer-events-none fixed top-0 left-0 z-10 rounded-full border border-white/25 opacity-0"
      />

      {!ready && !error ? (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#010103]">
          <div className="text-center">
            <div className="font-serif text-4xl italic">lifeKI</div>
            <p className="mt-3 text-[12px] tracking-[0.25em] text-zinc-500 uppercase">Die Welt atmet auf</p>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#010103] p-6 text-center">
          <div>
            <div className="font-serif text-3xl italic">Die Welt blieb dunkel</div>
            <p className="mt-3 max-w-md text-sm text-rose-200/80">{error}</p>
          </div>
        </div>
      ) : null}

      {ready ? (
        <>
          <Hud
            stats={stats}
            fps={fps}
            stepMs={stepMs}
            memoryMb={memoryMb}
            paused={paused}
            presetName={currentPreset}
            onOpenTutorial={() => setTutorialOpen(true)}
          />
          <Tutorial
            open={tutorialOpen}
            step={tutorialStep}
            dockOpen={dockOpen}
            onStep={setTutorialStep}
            onClose={() => {
              setTutorialOpen(false)
              saveGuide(true, complexity)
            }}
          />
          <Inspector
            data={inspected}
            onClose={() => {
              selectedRef.current = -1
              selectedIdRef.current = -1
              setInspected(null)
            }}
          />
          <GodBar
            tool={tool}
            onTool={(t) => {
              toolRef.current = t
              setTool(t)
            }}
            paused={paused}
            onPause={() => {
              pausedRef.current = !pausedRef.current
              setPaused(pausedRef.current)
            }}
            emotion={emotion}
            onEmotion={(e) => {
              emotionRef.current = e
              setEmotion(e)
            }}
            brush={brush}
            onBrush={(n) => {
              brushRef.current = n
              setBrush(n)
            }}
            strength={strength}
            onStrength={(n) => {
              strengthRef.current = n
              setStrength(n)
            }}
            allowed={COMPLEXITY_TOOLS[complexity]}
            dockOpen={dockOpen}
            onToggleDock={() => setDockOpen((v) => !v)}
          />
          <ControlDock
            open={dockOpen}
            onOpen={() => setDockOpen(true)}
            onClose={() => setDockOpen(false)}
            params={params}
            onParam={onParam}
            count={count}
            onCount={(n) => {
              countRef.current = n
              setCount(n)
            }}
            visual={visual}
            onVisual={(v) => {
              visualRef.current = v
              setVisual(v)
              saveVisual(v)
            }}
            presetId={presetId}
            onPreset={applyPreset}
            onNewWorld={() => createWorld(countRef.current, Date.now())}
            slots={slots}
            onSave={(i, name) => {
              const next = [...slots]
              next[i] = collectSlot(i, name)
              setSlots(next)
              persistSlots(next)
            }}
            onLoad={(i) => {
              const slot = slots[i]
              if (slot) restoreSlot(slot)
            }}
            onFavorite={(i) => {
              const next = [...slots]
              if (next[i]) next[i] = { ...next[i]!, favorite: !next[i]!.favorite }
              setSlots(next)
              persistSlots(next)
            }}
            onClear={(i) => {
              const next = [...slots]
              next[i] = null
              setSlots(next)
              persistSlots(next)
            }}
            onExport={(i) => {
              const slot = slots[i]
              if (!slot) return
              const blob = new Blob([exportSlot(slot)], { type: 'application/json' })
              const a = document.createElement('a')
              a.href = URL.createObjectURL(blob)
              a.download = `${slot.name || 'lifeKI'}.json`
              a.click()
            }}
            onImport={(text) => {
              try {
                const slot = importSlot(text)
                const next = [...slots]
                const empty = next.findIndex((s) => !s)
                next[empty >= 0 ? empty : 0] = { ...slot, id: empty >= 0 ? empty : 0 }
                setSlots(next)
                persistSlots(next)
                restoreSlot(slot)
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Import fehlgeschlagen')
                window.setTimeout(() => setError(null), 2400)
              }
            }}
            complexity={complexity}
            onComplexity={(n) => {
              setComplexity(n)
              saveGuide(true, n)
              const allowed = COMPLEXITY_TOOLS[n]
              if (!allowed.includes(toolRef.current)) {
                toolRef.current = 'observe'
                setTool('observe')
              }
            }}
            fossils={fossils}
            onRevive={(i) => {
              const engine = engineRef.current
              if (!engine) return
              engine.sim.revive_fossil(i, engine.sim.width() * 0.5, engine.sim.height() * 0.5)
              setFossils(engine.fossils())
            }}
          />
        </>
      ) : null}

    </div>
  )
}
