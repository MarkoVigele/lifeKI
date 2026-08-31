import { formatNum } from '@/lib/utils'

type Props = {
  label: string
  hint?: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  format?: (v: number) => string
}

export function SliderField({ label, hint, value, min, max, step, onChange, format }: Props) {
  return (
    <label className="group block py-1.5">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <span className="text-[11px] tracking-wide text-zinc-400 transition-colors group-hover:text-zinc-200">
          {label}
        </span>
        <span className="font-mono text-[10px] text-teal-200/85">{format ? format(value) : formatNum(value)}</span>
      </div>
      <input
        className="anima-slider"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {hint ? <p className="mt-0.5 text-[10px] leading-snug text-zinc-600">{hint}</p> : null}
    </label>
  )
}
