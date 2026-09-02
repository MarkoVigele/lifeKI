import type { EngineStats } from '@/lib/engine'
import { COMPLEXITY_LABEL, liveCaption } from '@/lib/tutorial'
import { formatNum } from '@/lib/utils'

type Props = {
  stats: EngineStats | null
  fps: number
  stepMs: number
  memoryMb: number
  paused: boolean
  presetName: string
  dockOpen: boolean
  onToggleDock: () => void
  onOpenTutorial: () => void
  complexity: number
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[9px] uppercase tracking-[0.16em] text-zinc-500">{label}</div>
      <div className="truncate font-mono text-[12px] tabular-nums text-zinc-200">{value}</div>
    </div>
  )
}

export function Hud({
  stats,
  fps,
  stepMs,
  memoryMb,
  paused,
  presetName,
  dockOpen,
  onToggleDock,
  onOpenTutorial,
  complexity,
}: Props) {
  const day = stats?.day ?? 0
  const hour = Math.floor(day * 24)
  const phase = day < 0.25 ? 'Nacht' : day < 0.5 ? 'Morgengrauen' : day < 0.75 ? 'Tag' : 'Dämmerung'
  const simple = complexity < 2

  return (
    <div className="pointer-events-none absolute left-3 top-[max(0.75rem,env(safe-area-inset-top))] z-20 w-[min(calc(100vw-5rem),280px)] md:w-[min(calc(100vw-1.5rem),320px)]">
      <div className="mb-2.5 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="font-serif text-[26px] italic leading-none tracking-tight text-zinc-100">lifeKI</div>
          <div className="mt-1 truncate text-[11px] tracking-[0.16em] text-zinc-500 uppercase">
            {presetName}
            {paused ? ' · gehalten' : ''}
          </div>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <button
            type="button"
            onClick={onOpenTutorial}
            className="pointer-events-auto min-h-11 rounded-full border border-teal-300/25 bg-teal-300/10 px-3 text-[11px] tracking-[0.14em] text-teal-100 hover:bg-teal-300/18 md:min-h-0 md:px-2.5 md:py-1 md:text-[10px]"
          >
            Hilfe
          </button>
          <button
            type="button"
            onClick={onToggleDock}
            className="pointer-events-auto min-h-11 rounded-full border border-white/10 bg-black/40 px-3 text-[11px] tracking-[0.14em] text-teal-200/90 hover:bg-white/8 md:hidden"
          >
            {dockOpen ? 'Zu' : 'Gesetze'}
          </button>
        </div>
      </div>
      <div className="panel pointer-events-auto w-full rounded-2xl px-3.5 py-3">
        <p className="mb-2.5 h-[3.6rem] overflow-hidden text-[12px] leading-5 text-zinc-300">{liveCaption(stats)}</p>
        {simple ? (
          <div className="grid grid-cols-3 gap-x-3 gap-y-2">
            <Cell label="Leben" value={stats ? String(Math.round(stats.alive)) : '—'} />
            <Cell label="Ebene" value={COMPLEXITY_LABEL[complexity]} />
            <Cell label="Zeit" value={phase} />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-x-3 gap-y-2">
            <Cell label="Leben" value={stats ? String(Math.round(stats.alive)) : '—'} />
            <Cell label="Gen." value={stats ? String(Math.round(stats.maxGen)) : '—'} />
            <Cell label="FPS" value={fps.toFixed(0)} />
            <Cell label="Träume" value={stats ? String(Math.round(stats.dreams)) : '—'} />
            <Cell label="Lügen" value={stats ? String(Math.round(stats.lies)) : '—'} />
            <Cell label="Ideen" value={stats ? String(Math.round(stats.ideas)) : '—'} />
            <Cell label="Schritt" value={`${formatNum(stepMs, 1)} ms`} />
            <Cell label="WASM" value={`${formatNum(memoryMb, 1)} MB`} />
            <Cell label="Zeit" value={`${phase.slice(0, 5)} ${String(hour).padStart(2, '0')}h`} />
          </div>
        )}
      </div>
    </div>
  )
}
