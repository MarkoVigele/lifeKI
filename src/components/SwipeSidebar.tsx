import { useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const SNAP = 40
const TAP = 8

export type DockStage = 'narrow' | 'wide'

export function SwipeSidebar({
  stage,
  onExpand,
  onCollapse,
  onClose,
  children,
}: {
  stage: DockStage
  onExpand: () => void
  onCollapse: () => void
  onClose: () => void
  children: ReactNode
}) {
  const startX = useRef<number | null>(null)
  const dxRef = useRef(0)
  const [dx, setDx] = useState(0)
  const [dragging, setDragging] = useState(false)

  const reset = () => {
    startX.current = null
    dxRef.current = 0
    setDragging(false)
    setDx(0)
  }

  const finish = () => {
    const moved = dxRef.current
    reset()
    if (Math.abs(moved) < TAP) {
      if (stage === 'wide') onCollapse()
      else onExpand()
      return
    }
    if (stage === 'wide') {
      if (moved > SNAP) onCollapse()
    } else if (moved > SNAP) onClose()
    else if (moved < -SNAP) onExpand()
  }

  const down = (e: PointerEvent<HTMLDivElement>) => {
    startX.current = e.clientX
    dxRef.current = 0
    setDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
    e.stopPropagation()
  }

  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (startX.current == null) return
    const raw = e.clientX - startX.current
    if (stage === 'narrow' && raw < -SNAP) {
      reset()
      onExpand()
      return
    }
    if (stage === 'wide' && raw > SNAP) {
      reset()
      onCollapse()
      return
    }
    dxRef.current = raw
    setDx(raw)
  }

  const closeShift = Math.max(0, dx)
  const expandPx = stage === 'narrow' ? Math.min(-Math.min(0, dx), 130) : 0
  const width =
    stage === 'wide'
      ? 'min(300px, 82vw)'
      : expandPx > 0
        ? `min(300px, calc(44vw + ${expandPx}px))`
        : 'min(168px, 44vw)'

  return (
    <div
      className="relative flex h-full min-h-0 flex-col"
      style={{
        width,
        transform: `translateX(${closeShift}px)`,
        transition: dragging ? 'none' : 'transform 180ms ease, width 180ms ease',
      }}
    >
      <div
        className="absolute inset-y-0 left-0 z-20 flex w-11 touch-none flex-col items-center justify-center"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={finish}
        onPointerCancel={finish}
        role="separator"
        aria-label={stage === 'wide' ? 'Schmaler wischen' : 'Breiter wischen'}
      >
        <span className="h-10 w-1 rounded-full bg-white/40" />
        <span className="mt-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/45 text-zinc-200">
          {stage === 'wide' ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </span>
      </div>
      <div className="flex h-full min-h-0 w-full flex-col pl-6">{children}</div>
    </div>
  )
}
