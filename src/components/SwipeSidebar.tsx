import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { HANDLE, nearestStage, wideWidth, widthOf, type DockStage } from '@/lib/sheetSnap'

export type { DockStage }

export function SwipeSidebar({
  open,
  onOpen,
  onClose,
  children,
}: {
  open: boolean
  onOpen: () => void
  onClose: () => void
  children: ReactNode
}) {
  const [vw, setVw] = useState(() => (typeof window === 'undefined' ? 390 : window.innerWidth))
  const [expanded, setExpanded] = useState<'peek' | 'wide'>('peek')
  const [dragging, setDragging] = useState(false)
  const [live, setLive] = useState(HANDLE)
  const startX = useRef(0)
  const startW = useRef(HANDLE)
  const liveRef = useRef(HANDLE)
  const moved = useRef(0)
  const draggingRef = useRef(false)

  useEffect(() => {
    const onResize = () => setVw(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    if (dragging) return
    const stage: DockStage = open ? expanded : 'closed'
    const w = widthOf(stage, vw)
    liveRef.current = w
    setLive(w)
  }, [open, expanded, vw, dragging])

  useEffect(() => {
    if (!open) setExpanded('peek')
  }, [open])

  const applyStage = (next: DockStage) => {
    if (next === 'closed') {
      setExpanded('peek')
      onClose()
    } else {
      setExpanded(next)
      onOpen()
    }
  }

  const down = (e: PointerEvent<HTMLElement>) => {
    startX.current = e.clientX
    startW.current = liveRef.current
    moved.current = 0
    draggingRef.current = true
    setDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const move = (e: PointerEvent<HTMLElement>) => {
    if (!draggingRef.current) return
    const dx = startX.current - e.clientX
    moved.current = Math.max(moved.current, Math.abs(e.clientX - startX.current))
    const next = Math.min(wideWidth(vw), Math.max(HANDLE, startW.current + dx))
    liveRef.current = next
    setLive(next)
  }

  const finish = () => {
    if (!draggingRef.current) return
    draggingRef.current = false
    setDragging(false)
    applyStage(nearestStage(liveRef.current, vw))
  }

  const collapsed = !open && !dragging
  const stage: DockStage = open ? expanded : 'closed'

  return (
    <div
      className="pointer-events-auto absolute top-0 right-0 z-30 h-[calc(100dvh-4.5rem)] pt-[max(0.35rem,env(safe-area-inset-top))] md:hidden"
      data-dock-stage={stage}
      data-dock-width={live}
      style={{
        width: live,
        transition: dragging ? 'none' : 'width 200ms ease',
      }}
    >
      <div className="relative h-full min-w-0 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 z-20 flex w-7 items-center justify-center"
          style={{ touchAction: 'none' }}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={finish}
          onPointerCancel={finish}
          role="separator"
          aria-label={
            stage === 'wide'
              ? 'Nach rechts wischen zum Verkleinern'
              : stage === 'peek'
                ? 'Nach links wischen zum Verbreitern'
                : 'Nach links wischen für Gesetze'
          }
        >
          {collapsed ? (
            <span className="sr-only">Gesetze</span>
          ) : (
            <span className="h-11 w-1 rounded-full bg-white/30" />
          )}
        </div>
        {collapsed ? (
          <div className="flex h-full items-center">
            <div className="flex h-16 w-7 items-center justify-center rounded-l-xl border border-r-0 border-white/10 bg-black/55 text-teal-100/80">
              <SlidersHorizontal size={16} />
            </div>
          </div>
        ) : (
          <div className="h-full min-w-0 overflow-hidden">{children}</div>
        )}
      </div>
    </div>
  )
}
