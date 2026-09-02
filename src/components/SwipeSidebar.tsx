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
  const startX = useRef<number | null>(null)
  const dxRef = useRef(0)
  const stageRef = useRef(stage)
  const onStageRef = useRef(onStage)
  const listeners = useRef<{
    move: (e: PointerEvent) => void
    up: () => void
    touchMove: (e: TouchEvent) => void
    touchEnd: () => void
  } | null>(null)
  const [dx, setDx] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [vw, setVw] = useState(() => (typeof window === 'undefined' ? 390 : window.innerWidth))
  stageRef.current = stage
  onStageRef.current = onStage

  useEffect(() => {
    const onResize = () => setVw(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      detach()
    }
  }, [])

  const detach = () => {
    const L = listeners.current
    if (!L) return
    window.removeEventListener('pointermove', L.move)
    window.removeEventListener('pointerup', L.up)
    window.removeEventListener('touchmove', L.touchMove)
    window.removeEventListener('touchend', L.touchEnd)
    listeners.current = null
  }

  const finish = () => {
    if (startX.current == null) {
      detach()
      return
    }
    const movedX = dxRef.current
    const next = snapSheetStage(stageRef.current, movedX)
    startX.current = null
    dxRef.current = 0
    detach()
    setDragging(false)
    setDx(0)
    if (next !== stageRef.current) onStageRef.current(next)
  }

  const track = (clientX: number) => {
    if (startX.current == null) return
    const rawX = clientX - startX.current
    dxRef.current = rawX
    setDx(rawX)
  }

  const attach = () => {
    detach()
    const move = (e: PointerEvent) => track(e.clientX)
    const up = () => finish()
    const touchMove = (e: TouchEvent) => {
      if (!e.touches[0]) return
      e.preventDefault()
      track(e.touches[0].clientX)
    }
    const touchEnd = () => finish()
    listeners.current = { move, up, touchMove, touchEnd }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('touchmove', touchMove, { passive: false })
    window.addEventListener('touchend', touchEnd)
  }

  const down = (e: ReactPointerEvent<HTMLDivElement>) => {
    startX.current = e.clientX
    dxRef.current = 0
    setDx(0)
    setDragging(true)
    attach()
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* some WebViews refuse capture; window listeners still run */
    }
    e.preventDefault()
    e.stopPropagation()
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
        className="absolute inset-y-0 left-0 z-20 flex w-10 flex-col items-center justify-center"
        style={{ touchAction: 'none' }}
        onPointerDown={down}
        role="separator"
        aria-label={
          stage === 'high'
            ? 'Nach rechts wischen zum Verkleinern'
            : stage === 'mid'
              ? 'Nach links wischen zum Verbreitern'
              : 'Nach links wischen für Gesetze'
        }
      >
        <span className="h-10 w-1 rounded-full bg-white/40" />
        {stage === 'closed' ? (
          <span className="mt-2 text-teal-100/80">
            <SlidersHorizontal size={16} />
          </span>
        ) : null}
      </div>
      <div
        className="flex h-full min-h-0 w-full min-w-0 flex-col pl-5"
        aria-hidden={!open}
        style={{ pointerEvents: open ? 'auto' : 'none' }}
      >
        {children}
      </div>
    </div>
  )
}
