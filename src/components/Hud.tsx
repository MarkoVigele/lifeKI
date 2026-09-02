import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import type { EngineStats } from '@/lib/engine'
import { cn, formatNum } from '@/lib/utils'

type Props = {
  stats: EngineStats | null
  fps: number
  stepMs: number
  memoryMb: number
  paused: boolean
  presetName: string
  onOpenTutorial: () => void
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
  const shown = Math.min(60, Math.max(0, fps))

  return (
    <div className="pointer-events-none absolute left-2 top-[max(0.3rem,env(safe-area-inset-top))] z-20">
      <button
        type="button"
        className="pointer-events-auto flex min-h-8 flex-col items-start justify-center rounded-md px-1.5 py-1 text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? 'Übersicht schließen' : 'Übersicht öffnen'}
      >
        <span className="inline-flex items-center gap-0.5 font-mono text-[10px] tabular-nums text-white/50">
          {shown.toFixed(0)} fps
          <ChevronDown
            className={cn('size-2.5 text-white/35 transition-transform', open && 'rotate-180')}
            aria-hidden
          />
        </span>
        {open ? (
          <span className="mt-1 grid gap-0.5 font-mono text-[10px] leading-snug text-white/48">
            <span>
              {stats ? Math.round(stats.alive) : '—'} leben · {formatNum(memoryMb, 1)} MB
            </span>
            <span>
              {formatNum(stepMs, 1)} ms
              {paused ? ' · gehalten' : ''}
            </span>
            <span className="max-w-[11rem] truncate text-white/32">{presetName}</span>
          </span>
        ) : null}
      </button>
      {open ? (
        <button
          type="button"
          onClick={onOpenTutorial}
          className="pointer-events-auto mt-0.5 px-1.5 font-mono text-[10px] tracking-wide text-teal-100/65"
        >
          Hilfe
        </button>
      ) : null}
    </div>
  )
}
