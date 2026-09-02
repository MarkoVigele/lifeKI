import { useState } from 'react'
import type { EngineStats } from '@/lib/engine'
import { formatNum } from '@/lib/utils'

type Props = {
  stats: EngineStats | null
  fps: number
  stepMs: number
  memoryMb: number
  paused: boolean
  presetName: string
  onOpenTutorial: () => void
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[9px] uppercase tracking-[0.14em] text-zinc-500">{label}</div>
      <div className="truncate font-mono text-[11px] tabular-nums text-zinc-200">{value}</div>
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
  onOpenTutorial,
}: Props) {
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Übersicht"
        aria-label="Übersicht öffnen"
        className="pointer-events-auto absolute left-3 top-[max(0.4rem,env(safe-area-inset-top))] z-20 font-mono text-[11px] tabular-nums text-white/40 hover:text-white/65"
      >
        {fps.toFixed(0)}
      </button>
    )
  }

  return (
    <div className="pointer-events-auto absolute left-3 top-[max(0.4rem,env(safe-area-inset-top))] z-20 w-[min(calc(100vw-1.5rem),196px)]">
      <div className="panel rounded-xl px-2.5 py-2">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="truncate text-[10px] tracking-[0.14em] text-zinc-500 uppercase">
            {presetName}
            {paused ? ' · gehalten' : ''}
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="shrink-0 rounded-md px-1.5 py-0.5 text-[11px] text-zinc-300 hover:text-zinc-50"
            aria-label="Übersicht schließen"
          >
            zu
          </button>
        </div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
          <Cell label="Leben" value={stats ? String(Math.round(stats.alive)) : '—'} />
          <Cell label="FPS" value={fps.toFixed(0)} />
          <Cell label="Speicher" value={`${formatNum(memoryMb, 1)} MB`} />
          <Cell label="Schritt" value={`${formatNum(stepMs, 1)} ms`} />
        </div>
        <button
          type="button"
          onClick={onOpenTutorial}
          className="mt-2 min-h-8 w-full rounded-lg border border-teal-300/20 bg-teal-300/8 text-[11px] tracking-[0.12em] text-teal-100 hover:bg-teal-300/14"
        >
          Hilfe
        </button>
      </div>
    </div>
  )
}
