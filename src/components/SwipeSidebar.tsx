import { useRef, useState, type PointerEvent, type ReactNode } from 'react'

const SNAP = 56

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
    const next = stage === 'wide' ? Math.max(0, raw) : raw
    dxRef.current = next
    setDx(next)
  }

  const closeShift = Math.max(0, dx)
  const expandPx = stage === 'narrow' ? Math.min(-Math.min(0, dx), 120) : 0
  const width =
    stage === 'wide'
      ? 'min(288px, 80vw)'
      : expandPx > 0
        ? `min(288px, calc(48vw + ${expandPx}px))`
        : 'min(176px, 48vw)'

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
        className="absolute inset-y-0 left-0 z-20 flex w-7 touch-none items-center justify-center"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={finish}
        onPointerCancel={finish}
        role="separator"
        aria-label="Zur Seite wischen"
      >
        <span className="h-11 w-1 rounded-full bg-white/30" />
      </div>
      <div className="flex h-full min-h-0 w-full flex-col">{children}</div>
    </div>
  )
}
