import {
  Brain,
  Eye,
  Flame,
  Heart,
  Magnet,
  Pause,
  Play,
  SlidersHorizontal,
  Sparkles,
  Spline,
  SunMedium,
  Unplug,
  Wind,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export const TOOLS = [
  { id: 'observe', label: 'Beobachten', icon: Eye },
  { id: 'attract', label: 'Anziehen', icon: Magnet },
  { id: 'repel', label: 'Abstoßen', icon: Wind },
  { id: 'give', label: 'Energie geben', icon: SunMedium },
  { id: 'take', label: 'Energie nehmen', icon: Flame },
  { id: 'emotion', label: 'Emotion injizieren', icon: Heart },
  { id: 'mutate', label: 'Mutieren', icon: Sparkles },
  { id: 'enlighten', label: 'Erleuchten', icon: Brain },
  { id: 'ally', label: 'Allianz erzwingen', icon: Spline },
  { id: 'break', label: 'Allianz brechen', icon: Unplug },
  { id: 'freeze', label: 'Cluster frieren', icon: Pause },
  { id: 'storm', label: 'Katastrophe', icon: Zap },
] as const

export type ToolId = (typeof TOOLS)[number]['id']

export const TOOL_WASM: Record<Exclude<ToolId, 'observe'>, number> = {
  attract: 0,
  repel: 1,
  give: 2,
  take: 3,
  emotion: 4,
  mutate: 5,
  enlighten: 6,
  ally: 7,
  break: 8,
  freeze: 9,
  storm: 10,
}

type Props = {
  tool: ToolId
  onTool: (t: ToolId) => void
  paused: boolean
  onPause: () => void
  emotion: number
  onEmotion: (e: number) => void
  brush: number
  onBrush: (n: number) => void
  strength: number
  onStrength: (n: number) => void
  allowed: readonly ToolId[]
  dockOpen: boolean
  onToggleDock: () => void
}

const EMO = ['Neugier', 'Angst', 'Aggression', 'Zugehörig', 'Hunger', 'Spiel', 'Dominanz']

export function GodBar({
  tool,
  onTool,
  paused,
  onPause,
  emotion,
  onEmotion,
  brush,
  onBrush,
  strength,
  onStrength,
  allowed,
  dockOpen,
  onToggleDock,
}: Props) {
  return (
    <nav
      className={cn(
        'pointer-events-auto absolute z-40 px-2',
        dockOpen
          ? 'inset-x-0 bottom-0 md:left-4 md:right-[400px] md:w-auto md:max-w-[calc(100%-400px)] md:translate-x-0 md:px-0 md:bottom-3'
          : 'inset-x-0 bottom-0 md:left-1/2 md:right-auto md:w-[min(96vw,720px)] md:-translate-x-1/2 md:px-0 md:bottom-3',
      )}
      style={{ paddingBottom: 'max(0.4rem, env(safe-area-inset-bottom))' }}
    >
      <div className="panel flex h-11 flex-nowrap items-center gap-1 overflow-x-auto scroll-thin rounded-2xl px-1.5 md:h-11">
        <button
          type="button"
          onClick={onPause}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/5 text-zinc-200 hover:bg-white/10"
          aria-label={paused ? 'Fortsetzen' : 'Pause'}
        >
          {paused ? <Play size={18} /> : <Pause size={18} />}
        </button>
        {TOOLS.filter((t) => allowed.includes(t.id)).map((t) => {
          const Icon = t.icon
          const active = tool === t.id
          return (
            <button
              key={t.id}
              type="button"
              title={t.label}
              aria-label={t.label}
              onClick={() => onTool(t.id)}
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                active ? 'bg-teal-300/18 text-teal-100' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200',
              )}
            >
              <Icon size={18} />
            </button>
          )
        })}
        <label className="ml-1 flex min-w-[4.75rem] shrink-0 items-center gap-1.5 pr-0.5 text-[10px] tracking-wide text-zinc-500 uppercase">
          <span className="hidden sm:inline">Radius</span>
          <input
            className="anima-slider h-11 w-[4.5rem]"
            type="range"
            min={18}
            max={160}
            value={brush}
            aria-label="Pinselradius"
            onChange={(e) => onBrush(Number(e.target.value))}
          />
        </label>
        <label className="flex min-w-[4.75rem] shrink-0 items-center gap-1.5 pr-1 text-[10px] tracking-wide text-zinc-500 uppercase">
          <span className="hidden sm:inline">Stärke</span>
          <input
            className="anima-slider h-11 w-[4.5rem]"
            type="range"
            min={0.25}
            max={3}
            step={0.05}
            value={strength}
            aria-label="Pinselstärke"
            onChange={(e) => onStrength(Number(e.target.value))}
          />
        </label>
        {tool === 'emotion' ? (
          <select
            value={emotion}
            aria-label="Gefühl"
            onChange={(e) => onEmotion(Number(e.target.value))}
            className="h-11 max-w-[7.5rem] shrink-0 rounded-xl border border-white/10 bg-black/40 px-2 text-[11px] text-zinc-200"
          >
            {EMO.map((name, i) => (
              <option key={name} value={i}>
                {name}
              </option>
            ))}
          </select>
        ) : null}
        <button
          type="button"
          title="Gesetze"
          aria-label="Gesetze"
          aria-pressed={dockOpen}
          onClick={onToggleDock}
          className={cn(
            'ml-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
            dockOpen ? 'bg-teal-300/18 text-teal-100' : 'text-zinc-300 hover:bg-white/8',
          )}
        >
          <SlidersHorizontal size={18} />
        </button>
      </div>
    </nav>
  )
}
