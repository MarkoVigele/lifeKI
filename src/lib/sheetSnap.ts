export const HANDLE = 28
export const PEEK = 0.43
export const WIDE = 0.72
export const TAP = 10

export type DockStage = 'closed' | 'peek' | 'wide'

export function peekWidth(vw: number) {
  return Math.round(Math.max(1, vw) * PEEK)
}

export function wideWidth(vw: number) {
  const v = Math.max(1, vw)
  return Math.round(Math.min(v * WIDE, v - 8))
}

export function widthOf(stage: DockStage, vw: number) {
  if (stage === 'closed') return HANDLE
  if (stage === 'peek') return peekWidth(vw)
  return wideWidth(vw)
}

/** Midpoints between closed / peek / wide — Lumina snap. */
export function nearestStage(width: number, vw: number): DockStage {
  const peek = peekWidth(vw)
  const wide = wideWidth(vw)
  if (width < peek / 2) return 'closed'
  if (width < (peek + wide) / 2) return 'peek'
  return 'wide'
}

/** Tap on the handle: jump to wide. Drag: nearest width snap. */
export function releaseStage(
  _current: DockStage,
  moved: number,
  liveWidth: number,
  vw: number,
  tap = TAP,
): DockStage {
  if (moved < tap) return 'wide'
  return nearestStage(liveWidth, vw)
}
