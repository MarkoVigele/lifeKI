import {
  Brain,
  Eye,
  Flame,
  Heart,
  Magnet,
  Pause,
  Play,
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
}: Props) {
  return (
    <div className="pointer-events-auto absolute bottom-3 left-1/2 z-20 w-[min(96vw,920px)] -translate-x-1/2 md:bottom-5">
      <div className="panel rounded-3xl px-3 py-2.5">
        <div className="flex items-center gap-2 overflow-x-auto scroll-thin pb-1">
          <button
            type="button"
            onClick={onPause}
            className="mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-zinc-200 hover:bg-white/10"
            aria-label={paused ? 'Fortsetzen' : 'Pause'}
          >
            {paused ? <Play size={16} /> : <Pause size={16} />}
          </button>
          {TOOLS.filter((t) => allowed.includes(t.id)).map((t) => {
            const Icon = t.icon
            const active = tool === t.id
            return (
              <button
                key={t.id}
                type="button"
                title={t.label}
                onClick={() => onTool(t.id)}
                className={cn(
                  'flex h-9 shrink-0 items-center gap-1.5 rounded-2xl px-2.5 text-[11px] tracking-wide',
                  active ? 'bg-teal-300/15 text-teal-100' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200',
                )}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            )
          })}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-4 px-1 text-[10px] text-zinc-500">
          <label className="flex min-w-[140px] flex-1 items-center gap-2">
            Radius
            <input
              className="anima-slider"
              type="range"
              min={18}
              max={160}
              value={brush}
              onChange={(e) => onBrush(Number(e.target.value))}
            />
          </label>
          <label className="flex min-w-[140px] flex-1 items-center gap-2">
            Stärke
            <input
              className="anima-slider"
              type="range"
              min={0.2}
              max={2.8}
              step={0.05}
              value={strength}
              onChange={(e) => onStrength(Number(e.target.value))}
            />
          </label>
          {tool === 'emotion' ? (
            <label className="flex items-center gap-2">
              Gefühl
              <select
                value={emotion}
                onChange={(e) => onEmotion(Number(e.target.value))}
                className="rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-zinc-200"
              >
                {EMO.map((name, i) => (
                  <option key={name} value={i}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <p className="w-full text-[10px] leading-snug text-zinc-600">
            {tool === 'observe'
              ? 'Ziehen zieht Wesen heran. Kurzer Klick öffnet den Geist. Mausrad: Radius.'
              : 'Gedrückt halten und ziehen — die Hand wirkt durchgehend. Mausrad ändert den Radius.'}
          </p>
        </div>
      </div>
    </div>
  )
}
