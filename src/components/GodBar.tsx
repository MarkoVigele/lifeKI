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
  dockOpen?: boolean
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
  dockOpen = false,
}: Props) {
  return (
    <div
      className={cn(
        'pointer-events-auto absolute z-20 transition-[opacity,transform] duration-300',
        dockOpen && 'max-md:pointer-events-none max-md:invisible max-md:opacity-0',
        dockOpen
          ? 'left-2 right-2 bottom-[max(0.5rem,env(safe-area-inset-bottom))] md:left-4 md:right-[376px] md:bottom-5 md:w-auto md:translate-x-0'
          : 'left-2 right-2 bottom-[max(0.5rem,env(safe-area-inset-bottom))] md:left-1/2 md:right-auto md:bottom-5 md:w-[min(96vw,920px)] md:-translate-x-1/2',
      )}
    >
      <div className="panel rounded-2xl px-2 py-1.5 md:rounded-3xl md:px-3 md:py-2.5">
        <div className="flex items-center gap-1 overflow-x-auto scroll-thin md:gap-2 md:pb-1">
          <button
            type="button"
            onClick={onPause}
            className="mr-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-zinc-200 hover:bg-white/10 md:mr-1 md:h-9 md:w-9"
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
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-[11px] tracking-wide md:h-9 md:w-auto md:gap-1.5 md:px-2.5',
                  active ? 'bg-teal-300/15 text-teal-100' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200',
                )}
              >
                <Icon size={16} className="md:h-3.5 md:w-3.5" />
                <span className="hidden md:inline">{t.label}</span>
              </button>
            )
          })}
        </div>
        {tool === 'emotion' ? (
          <label className="mt-1 flex min-h-11 items-center gap-2 px-1 text-[11px] text-zinc-400 md:hidden">
            Gefühl
            <select
              value={emotion}
              onChange={(e) => onEmotion(Number(e.target.value))}
              className="min-h-11 flex-1 rounded-lg border border-white/10 bg-black/40 px-2 text-zinc-200"
            >
              {EMO.map((name, i) => (
                <option key={name} value={i}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <div className="mt-2 hidden flex-wrap items-center gap-4 px-1 text-[10px] text-zinc-500 md:flex">
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
                className="min-h-11 rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-zinc-200 md:min-h-0"
              >
                {EMO.map((name, i) => (
                  <option key={name} value={i}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <p className="hidden w-full text-[10px] leading-snug text-zinc-600 md:block">
            {tool === 'observe'
              ? 'Ziehen zieht Wesen heran. Kurzer Klick öffnet den Geist. Mausrad: Radius.'
              : 'Gedrückt halten und ziehen — die Hand wirkt durchgehend. Mausrad ändert den Radius.'}
          </p>
        </div>
      </div>
    </div>
  )
}
