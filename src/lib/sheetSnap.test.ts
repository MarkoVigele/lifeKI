import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  dragHidden,
  sheetHidden,
  sheetMetrics,
  snapSheetStage,
  stepSheet,
} from './sheetSnap.ts'

describe('snapSheetStage', () => {
  it('stays put on a tap or short drag', () => {
    assert.equal(snapSheetStage('closed', 0), 'closed')
    assert.equal(snapSheetStage('mid', 12), 'mid')
    assert.equal(snapSheetStage('high', -12), 'high')
    assert.equal(snapSheetStage('mid', -39), 'mid')
  })

  it('opens one stage per inward swipe and never skips to high', () => {
    assert.equal(snapSheetStage('closed', -40), 'mid')
    assert.equal(snapSheetStage('closed', -400), 'mid')
    assert.equal(snapSheetStage('mid', -40), 'high')
    assert.equal(snapSheetStage('mid', -400), 'high')
    assert.equal(snapSheetStage('high', -80), 'high')
  })

  it('closes one stage per outward swipe', () => {
    assert.equal(snapSheetStage('high', 40), 'mid')
    assert.equal(snapSheetStage('high', 400), 'mid')
    assert.equal(snapSheetStage('mid', 40), 'closed')
    assert.equal(snapSheetStage('mid', 400), 'closed')
    assert.equal(snapSheetStage('closed', 80), 'closed')
  })
})

describe('sheet reveal', () => {
  const m = sheetMetrics(390)

  it('uses peek / ~44vw / ~82vw on a phone', () => {
    assert.equal(m.peek, 28)
    assert.equal(m.mid, Math.min(168, Math.round(390 * 0.44)))
    assert.equal(m.high, Math.min(300, Math.round(390 * 0.82)))
    assert.ok(m.mid < m.high)
    assert.equal(sheetHidden('closed', m), m.high - m.peek)
    assert.equal(sheetHidden('mid', m), m.high - m.mid)
    assert.equal(sheetHidden('high', m), 0)
  })

  it('clamps drag to the next stage only', () => {
    const fromClosed = dragHidden('closed', -400, m)
    assert.equal(fromClosed, sheetHidden('mid', m))
    assert.ok(fromClosed > 0)

    const fromMidIn = dragHidden('mid', -400, m)
    assert.equal(fromMidIn, 0)

    const fromHighOut = dragHidden('high', 400, m)
    assert.equal(fromHighOut, sheetHidden('mid', m))
  })

  it('steps neighboring stages', () => {
    assert.equal(stepSheet('closed', 1), 'mid')
    assert.equal(stepSheet('mid', 1), 'high')
    assert.equal(stepSheet('high', 1), 'high')
    assert.equal(stepSheet('high', -1), 'mid')
    assert.equal(stepSheet('mid', -1), 'closed')
    assert.equal(stepSheet('closed', -1), 'closed')
  })
})
