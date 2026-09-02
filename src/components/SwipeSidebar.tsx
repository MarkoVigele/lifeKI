import { useRef, useState, type PointerEvent, type ReactNode } from 'react'

const SNAP = 48

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
  const stageRef = useRef(stage)
  const [dx, setDx] = useState(0)
  const [dragging, setDragging] = useState(false)
  stageRef.current = stage

  const reset = () => {
    startX.current = null
    dxRef.current = 0
    setDragging(false)
    setDx(0)
  }

  const finish = () => {
    if (startX.current == null) return
    const movedX = dxRef.current
    const st = stageRef.current
    reset()

    if (Math.abs(movedX) < SNAP) return

    if (st === 'wide' && movedX > SNAP) onCollapse()
    else if (st === 'narrow' && movedX > SNAP) onClose()
    else if (st === 'narrow' && movedX < -SNAP) onExpand()
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
    const rawX = e.clientX - startX.current
    dxRef.current = rawX
    setDx(rawX)
  }

  const closeShift = Math.max(0, dx)
  const expandPx = stage === 'narrow' ? Math.min(-Math.min(0, dx), 140) : 0
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
        transition: dragging ? 'none' : 'transform 200ms ease, width 200ms ease',
      }}
    >
      <div
        className="absolute inset-y-0 left-0 z-20 flex w-9 touch-pan-x flex-col items-center justify-center"
        style={{ touchAction: 'pan-x' }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={finish}
        onPointerCancel={finish}
        onClick={(e) => e.preventDefault()}
        role="separator"
        aria-label={stage === 'wide' ? 'Nach rechts wischen zum Verkleinern' : 'Nach links wischen zum Verbreitern'}
      >
        <span className="h-10 w-1 rounded-full bg-white/40" />
      </div>
      <div className="flex h-full min-h-0 w-full min-w-0 flex-col pl-5">{children}</div>
    </div>
  )
}
