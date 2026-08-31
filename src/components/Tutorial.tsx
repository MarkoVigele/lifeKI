import { TUTORIAL_STEPS } from '@/lib/tutorial'
import { cn } from '@/lib/utils'

type Props = {
  open: boolean
  step: number
  complexity: number
  onStep: (n: number) => void
  onClose: () => void
  onComplexity: (n: number) => void
}

export function Tutorial({ open, step, complexity, onStep, onClose, onComplexity }: Props) {
  if (!open) return null
  const page = TUTORIAL_STEPS[step]
  const last = step === TUTORIAL_STEPS.length - 1
  const unlocksTo = Math.min(4, step + 1)

  return (
    <div className="pointer-events-auto absolute top-[188px] right-3 z-40 w-[min(94vw,400px)] max-h-[min(62vh,620px)] overflow-y-auto scroll-thin md:right-[min(24px,calc(100vw-420px))]">
      <div className="panel rounded-3xl p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] tracking-[0.2em] text-teal-200/80 uppercase">
              Anleitung {step + 1} / {TUTORIAL_STEPS.length}
            </div>
            <h2 className="font-serif text-2xl italic leading-tight text-zinc-50">{page.title}</h2>
          </div>
          <button type="button" onClick={onClose} className="text-[11px] text-zinc-500 hover:text-zinc-200">
            schließen
          </button>
        </div>
        <p className="mb-3 text-[13px] leading-relaxed text-zinc-200">{page.lead}</p>
        <div className="space-y-2 text-[12px] leading-relaxed text-zinc-400">
          {page.body.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
        <div className="mt-3 rounded-2xl bg-teal-300/8 px-3 py-2.5 text-[12px] leading-relaxed text-teal-100/90">
          <span className="text-[9px] tracking-[0.16em] text-teal-200/70 uppercase">Versuch</span>
          <div className="mt-1">{page.tryThis}</div>
        </div>
        {page.sliders.length > 0 ? (
          <div className="mt-3 space-y-1.5">
            <div className="text-[9px] tracking-[0.16em] text-zinc-500 uppercase">Was die Regler tun</div>
            {page.sliders.map((s) => (
              <p key={s.key} className="text-[11px] leading-snug text-zinc-400">
                {s.effect}
              </p>
            ))}
          </div>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={step === 0}
            onClick={() => onStep(step - 1)}
            className="rounded-xl bg-white/6 px-3 py-1.5 text-[11px] text-zinc-300 disabled:opacity-30"
          >
            Zurück
          </button>
          <button
            type="button"
            onClick={() => (last ? onClose() : onStep(step + 1))}
            className="rounded-xl bg-teal-300/15 px-3 py-1.5 text-[11px] text-teal-100"
          >
            {last ? 'Fertig' : 'Weiter'}
          </button>
          {complexity < unlocksTo ? (
            <button
              type="button"
              onClick={() => onComplexity(unlocksTo)}
              className={cn('rounded-xl px-3 py-1.5 text-[11px] text-amber-100', 'bg-amber-300/12')}
            >
              Nächste Ebene freischalten
            </button>
          ) : null}
        </div>
        <p className="mt-3 text-[10px] text-zinc-600">
          Taste T öffnet diese Anleitung wieder. Du musst nicht alles auf einmal verstehen.
        </p>
      </div>
    </div>
  )
}
