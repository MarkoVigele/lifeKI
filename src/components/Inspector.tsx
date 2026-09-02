import { useEffect, useRef } from 'react'
import type { Inspected } from '@/lib/engine'
import { EMO_LABELS, PERS_LABELS } from '@/lib/params'
import { formatNum, hsvCss } from '@/lib/utils'

type Props = {
  data: Inspected | null
  onClose: () => void
}

export function Inspector({ data, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !data) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const w = canvas.width
    const h = canvas.height
    ctx.clearRect(0, 0, w, h)
    const layers = [16, 12, 8]
    const xs = [36, w / 2, w - 36]
    const nodes: { x: number; y: number }[][] = layers.map((n, li) =>
      Array.from({ length: n }, (_, i) => ({
        x: xs[li],
        y: 16 + ((h - 32) * (i + 0.5)) / n,
      })),
    )
    const weights = data.weights
    ctx.globalAlpha = 0.55
    for (let h = 0; h < 12; h++) {
      for (let i = 0; i < 16; i++) {
        const wt = weights[h * 16 + i]
        ctx.strokeStyle = wt > 0 ? 'rgba(94,234,212,0.35)' : 'rgba(251,113,133,0.32)'
        ctx.lineWidth = Math.min(1.8, 0.25 + Math.abs(wt) * 0.7)
        ctx.beginPath()
        ctx.moveTo(nodes[0][i].x, nodes[0][i].y)
        ctx.lineTo(nodes[1][h].x, nodes[1][h].y)
        ctx.stroke()
      }
    }
    const ho0 = 16 * 12 + 12
    for (let o = 0; o < 8; o++) {
      for (let h = 0; h < 12; h++) {
        const wt = weights[ho0 + o * 12 + h]
        ctx.strokeStyle = wt > 0 ? 'rgba(196,181,253,0.35)' : 'rgba(251,191,36,0.28)'
        ctx.lineWidth = Math.min(1.8, 0.25 + Math.abs(wt) * 0.7)
        ctx.beginPath()
        ctx.moveTo(nodes[1][h].x, nodes[1][h].y)
        ctx.lineTo(nodes[2][o].x, nodes[2][o].y)
        ctx.stroke()
      }
    }
    ctx.globalAlpha = 1
    nodes.forEach((col, li) => {
      col.forEach((n) => {
        ctx.beginPath()
        ctx.arc(n.x, n.y, li === 1 ? 3.2 : 2.6, 0, Math.PI * 2)
        ctx.fillStyle = li === 2 ? '#f5d0c5' : li === 1 ? '#5eead4' : '#c4b5fd'
        ctx.fill()
      })
    })
  }, [data])

  if (!data) return null

  return (
    <div className="pointer-events-auto absolute top-[max(5.5rem,calc(env(safe-area-inset-top)+4.75rem))] left-3 z-40 w-[min(68vw,240px)] max-h-[min(32svh,260px)] overflow-y-auto scroll-thin md:top-[168px] md:w-[min(92vw,340px)] md:max-h-[min(58vh,560px)]">
      <div className="panel rounded-2xl p-3 md:rounded-3xl md:p-3.5">
        <div className="mb-2 flex items-start justify-between gap-3">
          <div>
            <div className="font-serif text-lg italic">Geist #{Math.round(data.id)}</div>
            <div className="text-[11px] text-zinc-500">
              Art {Math.round(data.species)} · Gen {Math.round(data.generation)}
              {data.dreaming ? ' · träumt' : ''}
              {data.lying ? ' · lügt' : ''}
              {data.bond >= 0 ? ' · verbündet' : ''}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 shrink-0 rounded-xl bg-white/8 px-3 text-[12px] text-zinc-200 hover:text-zinc-50 md:min-h-0 md:bg-transparent md:px-0 md:text-[11px] md:text-zinc-500 md:hover:text-zinc-200"
          >
            Schließen
          </button>
        </div>
        <div className="mb-3 grid grid-cols-4 gap-2 text-[10px]">
          <Stat k="Energie" v={formatNum(data.energy)} />
          <Stat k="Stress" v={formatNum(data.stress)} />
          <Stat k="Schönheit" v={formatNum(data.beauty)} />
          <Stat k="Alter" v={data.age.toFixed(0)} />
        </div>
        <div className="mb-3 space-y-1">
          {data.emotions.map((v, i) => (
            <Bar key={EMO_LABELS[i]} label={EMO_LABELS[i]} value={v} color={hsvCss(i / 7, 0.45, 0.85)} />
          ))}
        </div>
        <div className="mb-3 grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-zinc-400">
          {data.personality.map((v, i) => (
            <div key={PERS_LABELS[i]} className="flex justify-between">
              <span>{PERS_LABELS[i]}</span>
              <span className="font-mono text-zinc-200">{formatNum(v)}</span>
            </div>
          ))}
        </div>
        <canvas ref={canvasRef} width={332} height={150} className="w-full rounded-2xl bg-black/30" />
        <p className="mt-2 text-[10px] leading-relaxed text-zinc-600">
          Eltern {Math.round(data.parentA) || '—'} / {Math.round(data.parentB) || '—'} · Ehrlichkeit{' '}
          {formatNum(data.honesty)} · Erinnerungslohn {formatNum(data.memReward)}
        </p>
      </div>
    </div>
  )
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl bg-white/4 px-2 py-1.5">
      <div className="text-[9px] uppercase tracking-wider text-zinc-500">{k}</div>
      <div className="font-mono text-zinc-100">{v}</div>
    </div>
  )
}

function Bar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-24 text-[10px] text-zinc-500">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/6">
        <div className="h-full rounded-full" style={{ width: `${Math.round(value * 100)}%`, background: color }} />
      </div>
    </div>
  )
}
