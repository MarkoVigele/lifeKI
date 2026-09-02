export const SHEET_STAGES = ['closed', 'mid', 'high'] as const
export type DockStage = (typeof SHEET_STAGES)[number]

/** Finger must move at least this far (px) before pointerup commits one stage. */
export const SHEET_SNAP = 40

export type SheetMetrics = {
  peek: number
  mid: number
  high: number
}

export function sheetMetrics(viewportWidth: number): SheetMetrics {
  const vw = Math.max(1, viewportWidth)
  return {
    peek: 44,
    mid: Math.min(168, Math.round(vw * 0.44)),
    high: Math.min(300, Math.round(vw * 0.82)),
  }
}

/** How many pixels of the high-width sheet sit off-screen to the right. */
export function sheetHidden(stage: DockStage, m: SheetMetrics): number {
  if (stage === 'closed') return m.high - m.peek
  if (stage === 'mid') return m.high - m.mid
  return 0
}

export function stepSheet(stage: DockStage, dir: -1 | 1): DockStage {
  const i = SHEET_STAGES.indexOf(stage)
  return SHEET_STAGES[Math.max(0, Math.min(SHEET_STAGES.length - 1, i + dir))]
}

/**
 * One snap per swipe. Negative dx = inward (left) on a right sheet = more open.
 * A long drag still only steps one stage — the next swipe is required for high.
 */
export function snapSheetStage(stage: DockStage, dx: number, threshold = SHEET_SNAP): DockStage {
  if (dx <= -threshold) return stepSheet(stage, 1)
  if (dx >= threshold) return stepSheet(stage, -1)
  return stage
}

/** Follow the finger, but never past the neighboring stage (no jump closed→high). */
export function dragHidden(stage: DockStage, dx: number, m: SheetMetrics): number {
  const base = sheetHidden(stage, m)
  if (dx < 0) {
    const inward = sheetHidden(stepSheet(stage, 1), m)
    return Math.min(base, Math.max(inward, base + dx))
  }
  if (dx > 0) {
    const outward = sheetHidden(stepSheet(stage, -1), m)
    return Math.max(base, Math.min(outward, base + dx))
  }
  return base
}
