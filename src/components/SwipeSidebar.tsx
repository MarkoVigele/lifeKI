import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import {
  dragHidden,
  sheetHidden,
  sheetMetrics,
  snapSheetStage,
  type DockStage,
} from '@/lib/sheetSnap'

export type { DockStage }

export function SwipeSidebar({
  stage,
  onStage,
  children,
}: {
  stage: DockStage
  onStage: (stage: DockStage) => void
  children: ReactNode
}) {
  const stageRef = useRef(stage)
  const onStageRef = useRef(onStage)
  const [dx, setDx] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [vw, setVw] = useState(() => (typeof window === 'undefined' ? 390 : window.innerWidth))
  stageRef.current = stage
  onStageRef.current = onStage

  useEffect(() => {
    const onResize = () => setVw(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.stopPropagation()
    const startX = event.clientX
    let offset = 0
    setDx(0)
    setDragging(true)
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      /* capture optional; window listeners still run */
    }

    const onMove = (moveEvent: PointerEvent) => {
      offset = moveEvent.clientX - startX
      setDx(offset)
    }

    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      setDragging(false)
      setDx(0)
      const next = snapSheetStage(stageRef.current, offset)
      if (next !== stageRef.current) onStageRef.current(next)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }

  const m = sheetMetrics(vw)
  const hidden = dragging ? dragHidden(stage, dx, m) : sheetHidden(stage, m)
  const open = stage !== 'closed'

  return (
    <div
      className="relative h-full min-h-0"
      data-dock-stage={stage}
      style={{
        width: m.high,
        transform: `translateX(${hidden}px)`,
        transition: dragging ? 'none' : 'transform 200ms ease',
      }}
    >
      <div
        className="absolute inset-y-0 left-0 z-20 flex w-11 flex-col items-center justify-center"
        style={{ touchAction: 'none' }}
        onPointerDown={onPointerDown}
        role="separator"
        aria-label={
          stage === 'high'
            ? 'Nach rechts wischen zum Verkleinern'
            : stage === 'mid'
              ? 'Nach links wischen zum Verbreitern'
              : 'Nach links wischen für Gesetze'
        }
      >
        <span
          className={
            open
              ? 'flex h-16 w-8 flex-col items-center justify-center'
              : 'flex h-16 w-11 flex-col items-center justify-center rounded-l-xl border border-r-0 border-white/10 bg-black/55'
          }
        >
          <span className="h-10 w-1 rounded-full bg-white/40" />
          {open ? null : (
            <span className="mt-1.5 text-teal-100/80">
              <SlidersHorizontal size={16} />
            </span>
          )}
        </span>
      </div>
      <div
        className="flex h-full min-h-0 w-full min-w-0 flex-col pl-6"
        aria-hidden={!open}
        style={{ pointerEvents: open ? 'auto' : 'none' }}
      >
        {children}
      </div>
    </div>
  )
}
