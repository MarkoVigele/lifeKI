import { defaultParams, DEFAULT_MATRIX, MIND_STRIDE, PARAM_COUNT } from './params'

const KEY = 'anima.saves.v1'
const AUTOSAVE = 'anima.autosave.v1'
export const SLOT_COUNT = 10

export type SaveSlot = {
  id: number
  name: string
  favorite: boolean
  updatedAt: number
  presetId?: string
  count: number
  seed: number
  params: number[]
  matrix: number[]
  minds: number[]
  fossils: number
}

export type SaveFile = {
  version: 1
  slots: (SaveSlot | null)[]
}

function emptySlots(): (SaveSlot | null)[] {
  return Array.from({ length: SLOT_COUNT }, () => null)
}

export function loadSlots(): (SaveSlot | null)[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptySlots()
    const parsed = JSON.parse(raw) as SaveFile
    const slots = emptySlots()
    parsed.slots?.forEach((s, i) => {
      if (i < SLOT_COUNT) slots[i] = s
    })
    return slots
  } catch {
    return emptySlots()
  }
}

export function persistSlots(slots: (SaveSlot | null)[]): void {
  localStorage.setItem(KEY, JSON.stringify({ version: 1, slots }))
}

export function writeAutosave(slot: SaveSlot): void {
  localStorage.setItem(AUTOSAVE, JSON.stringify(slot))
}

export function readAutosave(): SaveSlot | null {
  try {
    const raw = localStorage.getItem(AUTOSAVE)
    return raw ? (JSON.parse(raw) as SaveSlot) : null
  } catch {
    return null
  }
}

export function exportSlot(slot: SaveSlot): string {
  return JSON.stringify({ anima: 1, slot }, null, 2)
}

export function importSlot(text: string): SaveSlot {
  const data = JSON.parse(text) as { slot?: SaveSlot; params?: number[] }
  const slot = data.slot ?? (data as SaveSlot)
  if (!slot.params || slot.params.length < 8) {
    throw new Error('Unbekanntes Speicherformat')
  }
  return {
    id: slot.id ?? 0,
    name: slot.name || 'Import',
    favorite: Boolean(slot.favorite),
    updatedAt: Date.now(),
    presetId: slot.presetId,
    count: slot.count ?? 800,
    seed: slot.seed ?? Date.now(),
    params: Array.from({ length: PARAM_COUNT }, (_, i) => slot.params[i] ?? defaultParams()[i]),
    matrix: Array.from({ length: 36 }, (_, i) => slot.matrix?.[i] ?? DEFAULT_MATRIX[i]),
    minds: Array.isArray(slot.minds) ? slot.minds : [],
    fossils: slot.fossils ?? 0,
  }
}

export function mindsToArray(src: Float32Array, count: number): number[] {
  return Array.from(src.subarray(0, count * MIND_STRIDE))
}
