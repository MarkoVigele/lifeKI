import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { HANDLE, nearestStage, peekWidth, wideWidth, widthOf } from './sheetSnap.ts'

describe('lumina widths', () => {
  it('uses 28px closed, ~43vw peek, ~72vw wide on a phone', () => {
    assert.equal(widthOf('closed', 390), HANDLE)
    assert.equal(widthOf('peek', 390), peekWidth(390))
    assert.equal(widthOf('wide', 390), wideWidth(390))
    assert.equal(peekWidth(390), Math.round(390 * 0.43))
    assert.equal(wideWidth(390), Math.round(Math.min(390 * 0.72, 382)))
    assert.ok(peekWidth(390) < wideWidth(390))
  })
})

describe('nearestStage', () => {
  const vw = 390
  const peek = peekWidth(vw)
  const wide = wideWidth(vw)

  it('snaps a first drag-left from the handle to peek, not wide', () => {
    assert.equal(nearestStage(HANDLE, vw), 'closed')
    assert.equal(nearestStage(HANDLE + 80, vw), 'peek')
    assert.equal(nearestStage(peek, vw), 'peek')
    assert.ok(nearestStage(peek + 20, vw) !== 'wide')
  })

  it('needs a second drag past the peek/wide midpoint to go wide', () => {
    assert.equal(nearestStage((peek + wide) / 2 - 1, vw), 'peek')
    assert.equal(nearestStage(wide, vw), 'wide')
    assert.equal(nearestStage(peek + 80, vw), 'wide')
  })

  it('steps down on drag-right', () => {
    assert.equal(nearestStage(wide - 80, vw), 'peek')
    assert.equal(nearestStage(HANDLE + 10, vw), 'closed')
  })
})
