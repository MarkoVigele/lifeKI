import { useMemo, useState, type ReactNode } from 'react'
import { ChevronDown, Download, Star, Trash2, Upload } from 'lucide-react'
import { SwipeSidebar } from './SwipeSidebar'
import { SliderField } from './SliderField'
import { PARAM_GROUPS, type ParamKey } from '@/lib/params'
import { PRESET_CATEGORIES, PRESETS } from '@/lib/presets'
import { COMPLEXITY_PRESETS, COMPLEXITY_SLIDERS, MAX_COMPLEXITY, MODE_LABELS, MODE_LEVELS, modeFromComplexity } from '@/lib/tutorial'
import { SLOT_COUNT, type SaveSlot } from '@/lib/saves'
import { cn } from '@/lib/utils'
import {
  PARTICLE_CAP_MAX,
  PARTICLE_CAP_MIN,
  type RenderFps,
  type VisualSettings,
} from '@/render/renderer'

const RENDER_FPS_OPTIONS: { value: RenderFps; label: string }[] = [
  { value: 30, label: '30' },
  { value: 60, label: '60' },
  { value: 120, label: '120' },
  { value: 'auto', label: 'Automatisch' },
]

type Fossil = { species: number; fitness: number; generation: number; hue: number }

type Props = {
  open: boolean
  onOpen: () => void
  onClose: () => void
  params: Float32Array
  onParam: (key: ParamKey, value: number) => void
  count: number
  onCount: (n: number) => void
  visual: VisualSettings
  onVisual: (v: VisualSettings) => void
  presetId: string
  onPreset: (id: string) => void
  onNewWorld: () => void
  slots: (SaveSlot | null)[]
  onSave: (i: number, name: string) => void
  onLoad: (i: number) => void
  onFavorite: (i: number) => void
  onClear: (i: number) => void
  onExport: (i: number) => void
  onImport: (text: string) => void
  fossils: Fossil[]
  onRevive: (i: number) => void
  complexity: number
  onComplexity: (n: number) => void
}

export function ControlDock({
  open,
  onOpen,
  onClose,
  params,
  onParam,
  count,
  onCount,
  visual,
  onVisual,
  presetId,
  onPreset,
  onNewWorld,
  slots,
  onSave,
  onLoad,
  onFavorite,
  onClear,
  onExport,
  onImport,
  fossils,
  onRevive,
  complexity,
  onComplexity,
}: Props) {
  const [openId, setOpenId] = useState('')
  const mode = modeFromComplexity(complexity)
  const full = complexity >= MAX_COMPLEXITY
  const allowedSliders = COMPLEXITY_SLIDERS[complexity] ?? []
  const allowedPresets = COMPLEXITY_PRESETS[complexity] ?? []
  const groups = useMemo(() => {
    if (full) return PARAM_GROUPS
    return PARAM_GROUPS.map((g) => ({
      ...g,
      sliders: g.sliders.filter((s) => allowedSliders.includes(s.key)),
    })).filter((g) => g.sliders.length > 0)
  }, [allowedSliders, full])
  const presets = full ? PRESETS : PRESETS.filter((p) => allowedPresets.includes(p.id))
  const renderFields = () => (
    <>
        <div className="shrink-0 border-b border-white/6 px-2.5 py-2 md:px-3 md:py-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[13px] tracking-[0.14em] text-zinc-200 uppercase">Gesetze</div>
            <button
              type="button"
              onClick={onClose}
              className="min-h-9 min-w-9 rounded-lg px-2 text-[12px] text-zinc-200 hover:text-zinc-50 md:min-h-7 md:min-w-0 md:text-[11px] md:text-zinc-500 md:hover:text-zinc-200"
            >
              <span className="md:hidden">Fertig</span>
              <span className="hidden md:inline">einklappen</span>
            </button>
          </div>
          <div
            className="mt-1.5 grid grid-cols-3 gap-0.5 rounded-lg bg-white/6 p-0.5"
            role="tablist"
            aria-label="Modus"
          >
            {MODE_LABELS.map((label, i) => {
              const active = mode === i
              return (
                <button
                  key={label}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onComplexity(MODE_LEVELS[i])}
                  className={cn(
                    'min-h-8 rounded-md px-0 text-[8px] leading-tight tracking-wide md:min-h-7 md:px-0.5 md:text-[11px]',
                    active ? 'bg-teal-300/18 text-teal-100' : 'text-zinc-500 hover:text-zinc-300',
                  )}
                >
                  {label}
                </button>
              )
            })}
          </div>
          <button
            type="button"
            onClick={onNewWorld}
            className="mt-1.5 min-h-8 w-full rounded-lg bg-teal-300/12 px-2 text-[11px] text-teal-100 hover:bg-teal-300/18 md:min-h-7"
          >
            Neue Welt
          </button>
        </div>
        <div className="dock-scroll scroll-thin px-2.5 py-1 md:px-3">
          <Section id="presets" title="Szenen" openId={openId} setOpenId={setOpenId}>
            <div className="space-y-2">
              {PRESET_CATEGORIES.map((cat) => {
                const items = presets.filter((p) => p.category === cat.id)
                if (items.length === 0) return null
                return (
                  <div key={cat.id}>
                    <div className="mb-1 px-0.5">
                      <div className="truncate text-[9px] tracking-[0.16em] text-teal-200/70 uppercase">{cat.title}</div>
                      <p className="mt-0.5 hidden truncate text-[9px] leading-snug text-zinc-600 md:block">{cat.hint}</p>
                    </div>
                    <div className="grid grid-cols-1 gap-1">
                      {items.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => onPreset(p.id)}
                          className={cn(
                            'min-w-0 overflow-hidden rounded-xl border px-2 py-1.5 text-left',
                            presetId === p.id
                              ? 'border-teal-300/30 bg-teal-300/8'
                              : 'border-white/6 bg-white/3 hover:bg-white/6',
                          )}
                        >
                          <div className="flex min-w-0 items-center justify-between gap-1.5">
                            <span className="min-w-0 truncate text-[11px] leading-tight text-zinc-100">{p.name}</span>
                            <span className="shrink-0 text-[8px] tracking-wider text-zinc-500 uppercase">{p.tag}</span>
                          </div>
                          <p className="mt-0.5 truncate text-[9px] leading-tight text-zinc-500">{p.blurb}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </Section>

          {complexity >= 1 ? (
          <Section id="pop" title="Population" openId={openId} setOpenId={setOpenId}>
            <SliderField
              label="Lebewesen (neue Welt)"
              hint="Wirkt beim nächsten Erschaffen. Fang klein an — unter 150 bleibt jedes Licht lesbar."
              value={count}
              min={40}
              max={full ? 2800 : 400}
              step={10}
              format={(v) => v.toFixed(0)}
              onChange={onCount}
            />
          </Section>
          ) : null}

          {groups.map((g) => (
            <Section key={g.id} id={g.id} title={g.title} openId={openId} setOpenId={setOpenId}>
              {g.sliders.map((s) => (
                <SliderField
                  key={s.key}
                  label={s.label}
                  hint={s.hint}
                  min={s.min}
                  max={s.max}
                  step={s.step}
                  value={params[indexOf(s.key)]}
                  format={s.format}
                  onChange={(v) => onParam(s.key, v)}
                />
              ))}
            </Section>
          ))}

          <Section id="vis" title="Visualisierung" openId={openId} setOpenId={setOpenId}>
            <div className="mb-1.5 py-0.5">
              <div className="mb-0.5 text-[10px] leading-tight tracking-wide text-zinc-400">Bildrate</div>
              <p className="mb-1 hidden text-[10px] leading-snug text-zinc-600 md:block">
                Nur das Bild. Die Welt läuft fest mit 60 Schritten pro Sekunde — unabhängig vom Display und von Berührung.
              </p>
              <div className="grid grid-cols-2 gap-0.5 rounded-lg bg-white/6 p-0.5" role="radiogroup" aria-label="Bildrate">
                {RENDER_FPS_OPTIONS.map((opt) => {
                  const active = visual.renderFps === opt.value
                  return (
                    <button
                      key={String(opt.value)}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      title={opt.label}
                      onClick={() => onVisual({ ...visual, renderFps: opt.value })}
                      className={cn(
                        'min-h-8 rounded-md px-1 text-[10px] leading-tight md:min-h-7 md:text-[11px]',
                        active ? 'bg-teal-300/18 text-teal-100' : 'text-zinc-500 hover:text-zinc-300',
                      )}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>
            <SliderField
              label="Teilchen-Limit"
              hint="Keine neuen Geburten über diesem Wert. Wer schon lebt, bleibt, bis es stirbt. Auf dem Handy lieber niedrig halten."
              value={visual.particleCap}
              min={PARTICLE_CAP_MIN}
              max={PARTICLE_CAP_MAX}
              step={50}
              format={(v) => v.toFixed(0)}
              onChange={(v) => onVisual({ ...visual, particleCap: Math.round(v) })}
            />
            <SliderField
              label="Spuren"
              hint="Kurzer Schweif hinter jedem Licht. Links = fast keins, rechts = länger — sie verblassen immer."
              value={visual.trails}
              min={0}
              max={1}
              step={0.01}
              format={(v) => `${Math.round(v * 100)}%`}
              onChange={(v) => onVisual({ ...visual, trails: v })}
            />
            <SliderField
              label="Glow"
              hint="Leuchthof um jedes Wesen. In dichten Gruppen wird er leiser, aber bleibt einstellbar."
              value={visual.glow}
              min={0}
              max={1.6}
              step={0.01}
              format={(v) => `${Math.round(v * 100)}%`}
              onChange={(v) => onVisual({ ...visual, glow: v })}
            />
            <SliderField
              label="Filmkorn"
              hint="Feines Rauschen über dem Bild."
              value={visual.grain}
              min={0}
              max={1}
              step={0.01}
              format={(v) => `${Math.round(v * 100)}%`}
              onChange={(v) => onVisual({ ...visual, grain: v })}
            />
            <Toggle
              label="Allianzen zeigen"
              on={visual.alliances}
              onClick={() => onVisual({ ...visual, alliances: !visual.alliances })}
            />
            <Toggle
              label="Signale zeigen"
              on={visual.signals}
              onClick={() => onVisual({ ...visual, signals: !visual.signals })}
            />
            <Toggle label="Biome tönen" on={visual.biomes} onClick={() => onVisual({ ...visual, biomes: !visual.biomes })} />
            <Toggle
              label="Schönheits-Modus"
              on={visual.beautyMode}
              onClick={() => onVisual({ ...visual, beautyMode: !visual.beautyMode })}
            />
          </Section>

          {complexity >= 3 ? (
          <>
          <Section id="fossils" title="Fossilien" openId={openId} setOpenId={setOpenId}>
            {fossils.length === 0 ? (
              <p className="py-2 text-[11px] text-zinc-600">Noch keine ausgestorbenen Geister von Rang.</p>
            ) : (
              fossils.map((f, i) => (
                <button
                  key={`${f.generation}-${i}`}
                  type="button"
                  onClick={() => onRevive(i)}
                  className="mb-1.5 flex min-h-11 w-full items-center justify-between rounded-xl bg-white/4 px-2.5 py-2 text-left hover:bg-white/8 md:min-h-0"
                >
                  <span className="text-[11px] text-zinc-300">
                    Art {Math.round(f.species)} · Gen {Math.round(f.generation)}
                  </span>
                  <span className="font-mono text-[10px] text-teal-200">{f.fitness.toFixed(2)}</span>
                </button>
              ))
            )}
          </Section>

          <Section id="saves" title="Speicher" openId={openId} setOpenId={setOpenId}>
            <SavePanel
              slots={slots}
              onSave={onSave}
              onLoad={onLoad}
              onFavorite={onFavorite}
              onClear={onClear}
              onExport={onExport}
              onImport={onImport}
            />
          </Section>
          </>
          ) : null}
        </div>
    </>
  )

  return (
    <>
      <SwipeSidebar open={open} onOpen={onOpen} onClose={onClose}>
        <div className="panel flex h-full min-h-0 w-full flex-col rounded-l-2xl border-y-0 border-r-0">
          {renderFields()}
        </div>
      </SwipeSidebar>

      <aside
        className={cn(
          'pointer-events-auto absolute top-0 right-0 z-30 hidden h-full min-h-0 w-[360px] flex-col transition-transform duration-300 md:flex',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="panel flex h-full min-h-0 w-full flex-col rounded-none rounded-l-3xl border-y-0 border-r-0">
          {renderFields()}
        </div>
      </aside>
    </>
  )
}

function indexOf(key: ParamKey): number {
  const map: Record<ParamKey, number> = {
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
  return map[key]
}

function Section({
  id,
  title,
  openId,
  setOpenId,
  children,
}: {
  id: string
  title: string
  openId: string
  setOpenId: (id: string) => void
  children: ReactNode
}) {
  const open = openId === id
  return (
    <div className="border-b border-white/6">
      <button
        type="button"
        onClick={() => setOpenId(open ? '' : id)}
        className={cn(
          'flex min-h-8 w-full items-center justify-between py-1 text-left text-[11px] tracking-wide text-zinc-300 md:min-h-0',
          open && 'sticky top-0 z-10 bg-[rgba(8,9,14,0.94)] backdrop-blur-md',
        )}
      >
        {title}
        <span className="flex shrink-0 items-center gap-1 text-zinc-500">
          {open ? <span className="text-[10px] tracking-wide text-zinc-300 uppercase">Zu</span> : null}
          <ChevronDown size={13} className={cn('transition-transform', open && 'rotate-180')} />
        </span>
      </button>
      {open ? <div className="pb-1.5">{children}</div> : null}
    </div>
  )
}

function Toggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-7 w-full items-center justify-between py-0.5 text-[10px] text-zinc-400 md:min-h-0">
      {label}
      <span className={cn('h-4 w-7 rounded-full', on ? 'bg-teal-300/70' : 'bg-white/10')}>
        <span className={cn('block h-4 w-4 rounded-full bg-white transition-transform', on ? 'translate-x-3' : 'translate-x-0')} />
      </span>
    </button>
  )
}

function SavePanel({
  slots,
  onSave,
  onLoad,
  onFavorite,
  onClear,
  onExport,
  onImport,
}: {
  slots: (SaveSlot | null)[]
  onSave: (i: number, name: string) => void
  onLoad: (i: number) => void
  onFavorite: (i: number) => void
  onClear: (i: number) => void
  onExport: (i: number) => void
  onImport: (text: string) => void
}) {
  return (
    <div className="space-y-2">
      {Array.from({ length: SLOT_COUNT }, (_, i) => {
        const s = slots[i]
        return (
          <div key={i} className="rounded-2xl border border-white/6 p-2.5">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="font-mono text-[10px] text-zinc-500">Slot {i + 1}</span>
              {s ? (
                <button type="button" onClick={() => onFavorite(i)} className={cn('flex min-h-11 min-w-11 items-center justify-center md:min-h-0 md:min-w-0', s.favorite ? 'text-amber-300' : 'text-zinc-600')}>
                  <Star size={12} />
                </button>
              ) : null}
            </div>
            <input
              defaultValue={s?.name ?? ''}
              placeholder="unbenannt"
              className="mb-2 w-full rounded-lg border border-white/8 bg-black/30 px-2 py-1 text-[12px] text-zinc-100 outline-none"
              onBlur={(e) => {
                if (s) onSave(i, e.target.value || s.name)
              }}
            />
            <div className="flex flex-wrap gap-1.5">
              <button type="button" className="min-h-11 rounded-lg bg-white/8 px-3 text-[12px] md:min-h-0 md:px-2 md:py-1 md:text-[10px]" onClick={() => onSave(i, s?.name || `Welt ${i + 1}`)}>
                Speichern
              </button>
              <button
                type="button"
                className="min-h-11 rounded-lg bg-white/8 px-3 text-[12px] disabled:opacity-30 md:min-h-0 md:px-2 md:py-1 md:text-[10px]"
                disabled={!s}
                onClick={() => onLoad(i)}
              >
                Laden
              </button>
              <button type="button" className="flex min-h-11 min-w-11 items-center justify-center rounded-lg bg-white/8 text-zinc-400 disabled:opacity-30 md:min-h-0 md:min-w-0 md:p-1" disabled={!s} onClick={() => onExport(i)}>
                <Download size={12} />
              </button>
              <button type="button" className="flex min-h-11 min-w-11 items-center justify-center rounded-lg bg-white/8 text-zinc-400 disabled:opacity-30 md:min-h-0 md:min-w-0 md:p-1" disabled={!s} onClick={() => onClear(i)}>
                <Trash2 size={12} />
              </button>
            </div>
            {s ? (
              <p className="mt-1 text-[9px] text-zinc-600">{new Date(s.updatedAt).toLocaleString('de')}</p>
            ) : null}
          </div>
        )
      })}
      <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-white/10 px-2 py-2 text-[11px] text-zinc-500 md:min-h-0">
        <Upload size={12} /> Import JSON
        <input
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (!file) return
            void file.text().then(onImport)
            e.target.value = ''
          }}
        />
      </label>
    </div>
  )
}
