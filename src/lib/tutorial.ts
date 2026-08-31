import type { EngineStats } from './engine'
import type { ToolId } from '@/components/GodBar'
import { defaultParams, P, type ParamKey } from './params'

export const GUIDE_KEY = 'anima.guide.v1'
export const MAX_COMPLEXITY = 4

export type TutorialStep = {
  title: string
  lead: string
  body: string[]
  tryThis: string
  sliders: { key: ParamKey; effect: string }[]
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: 'Was hier überhaupt passiert',
    lead: 'Jedes Licht ist ein Lebewesen — kein Deko-Partikel.',
    body: [
      'lifeKI ist keine Punktwolke zum Anschauen. Jedes Licht hat Hunger, Laune, ein winziges Gehirn und Nachbarn, die es anziehen oder meiden.',
      'Die Farben sind Stämme. Die schwachen Punkte dazwischen sind Nahrung. Wenn zwei Lichter eine feine Linie teilen, haben sie sich verbündet.',
      'Wir starten absichtlich klein und langsam. So kannst du einzelne Wesen verfolgen, statt in einem Schwarm unterzugehen.',
    ],
    tryThis: 'Zieh mit gedrückter Taste über die Lichtung — die Lichter folgen der Hand. Ein kurzer Klick auf ein Wesen öffnet sein Innenleben.',
    sliders: [{ key: 'timeScale', effect: 'Zeitmaß — nach links = alles atmet langsamer. Gut zum Zuschauen.' }],
  },
  {
    title: 'Nahrung, Kräfte, deine Hand',
    lead: 'Sie suchen Futter. Du darfst eingreifen.',
    body: [
      'Die blassen Motes sind Essen. Hungrige Wesen steuern darauf zu. Ohne Nahrung werden sie dunkler und sterben irgendwann.',
      'Darunter liegen unsichtbare Kräfte: gleiche Farben mögen sich oft, fremde Farben stoßen sich ab oder jagen sich. Daraus entstehen Schwärme, Ringe, Jagd.',
      'Unten in der Leiste kannst du jetzt anziehen und Energie geben. Zieh mit gedrückter Taste über die Lichtung.',
    ],
    tryThis: 'Wähle „Energie geben“ und halte die Maus über eine hungrige, dunklere Gruppe. Sie sollte aufleben.',
    sliders: [
      { key: 'foodRate', effect: 'Nahrungsfluss — mehr Motes, weniger Stress. Weniger = härteres Leben.' },
      { key: 'forceScale', effect: 'Kräfte — wie heftig Anziehung und Abstoßung wirken. Hoch = dramatisches Gewimmel.' },
    ],
  },
  {
    title: 'Gefühle, Signale, Lügen',
    lead: 'Farbe ist nicht nur Stamm. Sie ist Stimmung.',
    body: [
      'Jedes Wesen trägt Antriebe: Neugier, Angst, Hunger, Zugehörigkeit, Spiel. Die mischen sich in die Farbe und ins Verhalten.',
      'Manche senden Ringe aus — eine primitive Sprache. Ein gebrochener, flackernder Ring kann eine Lüge sein: das Signal passt nicht zum inneren Zustand.',
      'Gefühle stecken an. Steht Empathie hoch, wird aus einer ängstlichen Ecke schnell eine ängstliche Welt.',
    ],
    tryThis: 'Öffne den Inspektor bei zwei benachbarten Lichtern. Sind ihre Balken ähnlich? Dann hat Empathie bereits gearbeitet.',
    sliders: [
      { key: 'empathyContagion', effect: 'Emotions-Ansteckung — wie leicht Stimmung überspringt.' },
      { key: 'lieTendency', effect: 'Lügen-Neigung — mehr falsche Signale, mehr Misstrauen.' },
    ],
  },
  {
    title: 'Geburt, Tod, nächste Generation',
    lead: 'Was überlebt, hinterlässt ein Echo.',
    body: [
      'Wer genug Energie hat, kann Nachkommen zeugen. Kinder erben ein leicht mutiertes Gehirn — und manchmal die Weisheit erfolgreicher Eltern.',
      'Nachbarn kopieren Erfolgreiche. Das ist Kultur: ein Verhalten wandert, ohne dass Gene fließen.',
      'Stirbt jemand Bemerkenswertes, bleibt ein Fossil. Du kannst es später wiederbeleben. Die Zahl „Gen.“ oben zählt, wie tief der Stammbaum schon reicht.',
    ],
    tryThis: 'Lass die Welt ein paar Minuten laufen. Steigt „Gen.“, hat sich schon eine Linie fortgepflanzt.',
    sliders: [
      { key: 'mutation', effect: 'Mutation — Kinder weichen stärker von den Eltern ab. Hoch = Überraschungen, auch schlechte.' },
      { key: 'cultureRate', effect: 'Kultur — wie schnell Erfolgreiche nachgeahmt werden.' },
    ],
  },
  {
    title: 'Du bist nicht nur Gast',
    lead: 'Presets sind andere Planeten. Die restlichen Regler sind Wetter.',
    body: [
      'Rechts unter Szenen liegen Welten in Kategorien: Zuschauen, Formen, Gesellschaft, Konflikt, Wetter. Zellen, Ketten oder Hatz ändern die Kräfte — nicht nur die Stimmung.',
      'Katastrophen, Portale, Gott-Laune und Chaos sind optional. Sie machen die Welt launisch — erst einschalten, wenn du das ruhige Leben verstanden hast.',
      'Dieses Tutorial bleibt über das Buch-Symbol erreichbar. Taste T. Du kannst jederzeit wieder auf die Erste Lichtung zurück.',
    ],
    tryThis: 'Wenn du soweit bist: „Alles zeigen“ und eine andere Welt wählen. Oder hierbleiben und nur zuschauen.',
    sliders: [
      { key: 'godMood', effect: 'Gott-Laune — plus = Spiel und Zugehörigkeit, minus = Furcht und Härte.' },
      { key: 'catastropheRate', effect: 'Katastrophen — Beben, Blüte, Pest. Selten halten, sonst wird es unlesbar.' },
    ],
  },
]

export const COMPLEXITY_TOOLS: ToolId[][] = [
  ['observe', 'attract', 'repel', 'give'],
  ['observe', 'attract', 'repel', 'give', 'take'],
  ['observe', 'attract', 'give', 'repel', 'take'],
  ['observe', 'attract', 'give', 'repel', 'take', 'emotion', 'mutate', 'enlighten'],
  [
    'observe',
    'attract',
    'repel',
    'give',
    'take',
    'emotion',
    'mutate',
    'enlighten',
    'ally',
    'break',
    'freeze',
    'storm',
  ],
]

export const COMPLEXITY_SLIDERS: ParamKey[][] = [
  ['timeScale'],
  ['timeScale', 'foodRate', 'forceScale'],
  ['timeScale', 'foodRate', 'forceScale', 'empathyContagion', 'lieTendency'],
  ['timeScale', 'foodRate', 'forceScale', 'empathyContagion', 'lieTendency', 'mutation', 'cultureRate', 'godMood'],
  [],
]

export const COMPLEXITY_PRESETS: string[][] = [
  ['firstlight'],
  ['firstlight'],
  ['firstlight', 'cells', 'flock', 'dreamers'],
  ['firstlight', 'cells', 'flock', 'dreamers', 'shores', 'pairs', 'snakes', 'hunt', 'culture'],
  [],
]

export const COMPLEXITY_LABEL = ['Zuschauen', 'Eingreifen', 'Gefühle', 'Generationen', 'Alles']

export function firstLightParams(): Float32Array {
  const p = defaultParams()
  p[P.timeScale] = 0.5
  p[P.maxSpeed] = 0.95
  p[P.forceScale] = 0.3
  p[P.friction] = 0.91
  p[P.foodRate] = 0.78
  p[P.foodEnergy] = 0.34
  p[P.energyDrain] = 0.00024
  p[P.combat] = 0.04
  p[P.altruism] = 0.45
  p[P.lieTendency] = 0.03
  p[P.dreamFreq] = 0.1
  p[P.chaos] = 0.02
  p[P.catastropheRate] = 0
  p[P.portalRate] = 0
  p[P.speciesCount] = 3
  p[P.nnInfluence] = 0.4
  p[P.godMood] = 0.2
  p[P.daySpeed] = 0.002
  return p
}

export function firstLightMatrix(): Float32Array {
  return new Float32Array([
    0.48, 0.12, -0.08, 0, 0, 0, 0.1, 0.46, 0.14, 0, 0, 0, -0.06, 0.16, 0.5, 0, 0, 0, 0, 0, 0, 0.4, 0, 0, 0, 0, 0, 0,
    0.4, 0, 0, 0, 0, 0, 0, 0.4,
  ])
}

export const FIRST_LIGHT_COUNT = 88

export function liveCaption(stats: EngineStats | null): string {
  if (!stats) return 'Die Lichtung erwacht.'
  const n = stats.alive
  if (n < 28) return 'Wenige Lichter noch. Die Lichtung ist dünn — jedes Wesen ist lesbar.'
  if (stats.meanStress > 0.55) return 'Unruhe: viele sind hungrig oder ängstlich. Dunklere Lichter brauchen Nahrung.'
  if (stats.dreams > 8 && stats.meanEnergy > 0.5) return 'Ruhephasen. Einige träumen — ihre Netze verschieben sich leise.'
  if (stats.alliances > 6) return 'Es bilden sich Bänder. Allianzen halten ein paar Wesen zusammen.'
  if (stats.maxGen >= 2) return `Generation ${Math.round(stats.maxGen)} ist da. Kinder tragen schon etwas von den Eltern.`
  if (stats.lies > 4) return 'Falsche Signale unterwegs. Nicht jeder Ring meint, was er zeigt.'
  if (stats.meanEnergy < 0.35) return 'Die Reserve sinkt. Mehr Nahrungsfluss — oder du fütterst mit der Hand.'
  return 'Sie suchen, meiden, folgen. Folge einem einzelnen Licht, dann ergibt der Rest Sinn.'
}

export function loadGuide(): { seen: boolean; complexity: number } {
  try {
    const raw = localStorage.getItem(GUIDE_KEY)
    if (!raw) return { seen: false, complexity: 0 }
    const data = JSON.parse(raw) as { seen?: boolean; complexity?: number }
    return {
      seen: Boolean(data.seen),
      complexity: Math.min(MAX_COMPLEXITY, Math.max(0, Number(data.complexity) || 0)),
    }
  } catch {
    return { seen: false, complexity: 0 }
  }
}

export function saveGuide(seen: boolean, complexity: number) {
  localStorage.setItem(GUIDE_KEY, JSON.stringify({ seen, complexity }))
}
