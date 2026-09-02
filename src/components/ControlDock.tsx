import { useMemo, useState, type ReactNode } from 'react'
import { ChevronDown, Download, Star, Trash2, Upload } from 'lucide-react'
import { SliderField } from './SliderField'
import { PARAM_GROUPS, type ParamKey } from '@/lib/params'
import { PRESET_CATEGORIES, PRESETS } from '@/lib/presets'
import { COMPLEXITY_LABEL, COMPLEXITY_PRESETS, COMPLEXITY_SLIDERS, MAX_COMPLEXITY } from '@/lib/tutorial'
import { SLOT_COUNT, type SaveSlot } from '@/lib/saves'
import { cn } from '@/lib/utils'
import type { VisualSettings } from '@/render/renderer'

type Fossil = { species: number; fitness: number; generation: number; hue: number }

type Props = {
  open: boolean
  onToggle: () => void
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
  onToggle,
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
  const [openId, setOpenId] = useState('guide')
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

  return (
    <>
      {!open ? (
        <button
          type="button"
          onClick={onToggle}
          className="pointer-events-auto fixed top-[38%] right-0 z-30 flex min-h-11 items-center rounded-l-2xl border border-r-0 border-teal-300/30 bg-teal-300/15 px-3 text-[11px] tracking-[0.18em] text-teal-100 uppercase md:hidden"
        >
          Gesetze
        </button>
      ) : null}
    <aside
      className={cn(
        'pointer-events-auto z-30 flex flex-col transition-transform duration-300',
        'fixed left-0 right-0 top-auto bottom-0 h-[45svh] max-h-[45svh] overflow-hidden',
        open ? 'translate-y-0' : 'translate-y-full max-md:pointer-events-none',
        'md:absolute md:left-auto md:right-0 md:top-0 md:bottom-0 md:max-h-none md:h-full',
        open ? 'md:translate-x-0 md:translate-y-0' : 'md:translate-x-[calc(100%-18px)] md:translate-y-0',
      )}
    >
      {open ? (
        <button
          type="button"
          onClick={onToggle}
          className="absolute top-5 left-0 z-10 hidden min-h-11 -translate-x-full items-center rounded-l-2xl border border-r-0 border-white/10 bg-black/70 px-2 text-[10px] tracking-[0.18em] text-teal-100 uppercase md:flex"
        >
          Zu
        </button>
      ) : (
        <button
          type="button"
          onClick={onToggle}
          className="absolute top-5 left-0 z-10 hidden min-h-11 -translate-x-full items-center rounded-l-2xl border border-r-0 border-teal-300/30 bg-teal-300/15 px-2 text-[10px] tracking-[0.18em] text-teal-100 uppercase md:flex"
        >
          Gesetze
        </button>
      )}
      <div className="panel flex h-full min-h-0 w-full flex-col overflow-hidden rounded-t-3xl border-x-0 border-b-0 pb-[env(safe-area-inset-bottom)] md:w-[360px] md:rounded-none md:rounded-l-3xl md:border-x md:border-y-0 md:border-r-0 md:pb-0">
        <div className="sticky top-0 z-10 shrink-0 border-b border-white/6 bg-[rgba(8,9,14,0.92)] px-4 py-3 md:static md:bg-transparent md:py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="font-serif text-xl italic">Instrumente</div>
            <button
              type="button"
              onClick={onToggle}
              className="min-h-11 min-w-11 rounded-xl px-3 text-[13px] text-zinc-200 hover:text-zinc-50 md:min-h-8 md:min-w-0 md:px-2 md:text-[11px] md:text-zinc-500 md:hover:text-zinc-200"
            >
              <span className="md:hidden">Fertig</span>
              <span className="hidden md:inline">einklappen</span>
            </button>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
            Ebene {COMPLEXITY_LABEL[complexity]}. Die Anleitung erklärt jeden Regler, bevor er erscheint.
          </p>
          <button
            type="button"
            onClick={onNewWorld}
            className="mt-3 min-h-11 w-full rounded-2xl bg-teal-300/12 px-3 py-2 text-[12px] text-teal-100 hover:bg-teal-300/18 md:min-h-0"
          >
            Neue Welt aus diesen Gesetzen
          </button>
        </div>
        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-3 py-2">
          <Section id="guide" title="Ebene" openId={openId} setOpenId={setOpenId}>
            <div className="flex flex-wrap gap-1.5 pb-1">
              {COMPLEXITY_LABEL.map((label, i) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => onComplexity(i)}
                  className={cn(
                    'min-h-11 rounded-full px-3 text-[12px] md:min-h-0 md:px-2.5 md:py-1 md:text-[10px]',
                    complexity === i ? 'bg-teal-300/18 text-teal-100' : 'bg-white/5 text-zinc-500 hover:text-zinc-300',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </Section>
          <Section id="presets" title="Szenen" openId={openId} setOpenId={setOpenId}>
            <div className="space-y-4">
              {PRESET_CATEGORIES.map((cat) => {
                const items = presets.filter((p) => p.category === cat.id)
                if (items.length === 0) return null
                return (
                  <div key={cat.id}>
                    <div className="mb-1.5 px-0.5">
                      <div className="text-[10px] tracking-[0.18em] text-teal-200/70 uppercase">{cat.title}</div>
                      <p className="mt-0.5 text-[10px] leading-snug text-zinc-600">{cat.hint}</p>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {items.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => onPreset(p.id)}
                          className={cn(
                            'min-h-11 rounded-2xl border px-3 py-2 text-left md:min-h-0',
                            presetId === p.id
                              ? 'border-teal-300/30 bg-teal-300/8'
                              : 'border-white/6 bg-white/3 hover:bg-white/6',
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[13px] text-zinc-100">{p.name}</span>
                            <span className="text-[9px] tracking-wider text-zinc-500 uppercase">{p.tag}</span>
                          </div>
                          <p className="mt-1 text-[10px] leading-snug text-zinc-500">{p.blurb}</p>
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
    <div className="border-b border-white/6 py-1">
      <button
        type="button"
        onClick={() => setOpenId(open ? '' : id)}
        className="flex min-h-11 w-full items-center justify-between py-2 text-left text-[12px] tracking-wide text-zinc-300 md:min-h-0"
      >
        {title}
        <ChevronDown size={14} className={cn('text-zinc-500 transition-transform', open && 'rotate-180')} />
      </button>
      {open ? <div className="pb-3">{children}</div> : null}
    </div>
  )
}

function Toggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-11 w-full items-center justify-between py-1.5 text-[11px] text-zinc-400 md:min-h-0">
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
