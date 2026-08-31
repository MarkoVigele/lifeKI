import { FIRST_LIGHT_COUNT, firstLightMatrix, firstLightParams } from './tutorial'
import { defaultParams, P, SPECIES_MAX } from './params'

export type PresetCategory = 'watch' | 'form' | 'society' | 'conflict' | 'weather'

export type Preset = {
  id: string
  name: string
  tag: string
  category: PresetCategory
  blurb: string
  count: number
  params: Float32Array
  matrix: Float32Array
}

export const PRESET_CATEGORIES: { id: PresetCategory; title: string; hint: string }[] = [
  { id: 'watch', title: 'Zuschauen', hint: 'Langsam und übersichtlich. Zum Verstehen.' },
  { id: 'form', title: 'Formen', hint: 'Kräfte zeichnen Zellen, Ketten, Ufer.' },
  { id: 'society', title: 'Gesellschaft', hint: 'Gefühle, Kultur, Masken.' },
  { id: 'conflict', title: 'Konflikt', hint: 'Jagd und Druck — härter, aber lebendig.' },
  { id: 'weather', title: 'Wetter', hint: 'Zeit, Zufall, Launen der Welt.' },
]

function scene(mut: (p: Float32Array) => void): Float32Array {
  const p = defaultParams()
  p[P.timeScale] = 0.56
  p[P.maxSpeed] = 1.15
  p[P.friction] = 0.9
  p[P.forceScale] = 0.36
  p[P.energyDrain] = 0.0003
  p[P.foodRate] = 0.66
  p[P.foodEnergy] = 0.32
  p[P.catastropheRate] = 0
  p[P.portalRate] = 0
  mut(p)
  return p
}

function mat(rows: number[][]): Float32Array {
  const out = new Float32Array(SPECIES_MAX * SPECIES_MAX)
  for (let i = 0; i < SPECIES_MAX; i++) {
    for (let j = 0; j < SPECIES_MAX; j++) {
      out[i * SPECIES_MAX + j] = rows[i]?.[j] ?? 0
    }
  }
  return out
}

export const PRESETS: Preset[] = [
  {
    id: 'firstlight',
    name: 'Erste Lichtung',
    tag: 'Anfang',
    category: 'watch',
    blurb: 'Wenige Wesen, langsam, viel Nahrung. Zum Verstehen gedacht.',
    count: FIRST_LIGHT_COUNT,
    params: firstLightParams(),
    matrix: firstLightMatrix(),
  },
  {
    id: 'dreamers',
    name: 'Träumer-Kolonie',
    tag: 'Nacht',
    category: 'watch',
    blurb: 'Langsam, still, innenreich. Netze verändern sich im Schlaf.',
    count: 220,
    params: scene((p) => {
      p[P.speciesCount] = 2
      p[P.timeScale] = 0.48
      p[P.dreamFreq] = 0.5
      p[P.dreamIntensity] = 0.8
      p[P.nnInfluence] = 0.72
      p[P.forceScale] = 0.24
      p[P.repulsion] = 18
      p[P.maxSpeed] = 0.95
      p[P.daySpeed] = 0.0014
      p[P.chaos] = 0.1
      p[P.mutationPoetry] = 0.62
      p[P.foodRate] = 0.7
      p[P.combat] = 0.02
    }),
    matrix: mat([
      [0.34, 0.08],
      [0.1, 0.32],
    ]),
  },
  {
    id: 'cells',
    name: 'Zellen',
    tag: 'Form',
    category: 'form',
    blurb: 'Starke Selbstanziehung, fremde Farben weichen. Runde Kolonien mit sichtbarem Rand.',
    count: 360,
    params: scene((p) => {
      p[P.speciesCount] = 3
      p[P.forceScale] = 0.46
      p[P.repulsion] = 18
      p[P.perception] = 52
      p[P.maxSpeed] = 1.05
      p[P.nnInfluence] = 0.18
      p[P.combat] = 0.04
      p[P.altruism] = 0.32
      p[P.foodRate] = 0.64
    }),
    matrix: mat([
      [0.78, -0.38, -0.34],
      [-0.36, 0.76, -0.32],
      [-0.32, -0.36, 0.8],
    ]),
  },
  {
    id: 'flock',
    name: 'Herde',
    tag: 'Weich',
    category: 'form',
    blurb: 'Ein lockerer Schwarm. Zugehörigkeit hält, Abstoßung verhindert den Klumpen.',
    count: 320,
    params: scene((p) => {
      p[P.speciesCount] = 2
      p[P.forceScale] = 0.32
      p[P.repulsion] = 20
      p[P.perception] = 66
      p[P.maxSpeed] = 1.1
      p[P.empathyContagion] = 0.18
      p[P.empathyRadius] = 68
      p[P.nnInfluence] = 0.28
      p[P.altruism] = 0.5
      p[P.combat] = 0.02
      p[P.beautySelect] = 0.42
      p[P.foodRate] = 0.68
    }),
    matrix: mat([
      [0.4, 0.26],
      [0.28, 0.38],
    ]),
  },
  {
    id: 'shores',
    name: 'Zwei Ufer',
    tag: 'Grenze',
    category: 'form',
    blurb: 'Zwei Stämme, die sich nicht mischen. Territorien mit einer scharfen Naht.',
    count: 380,
    params: scene((p) => {
      p[P.speciesCount] = 2
      p[P.forceScale] = 0.48
      p[P.repulsion] = 16
      p[P.perception] = 54
      p[P.maxSpeed] = 1.12
      p[P.nnInfluence] = 0.16
      p[P.combat] = 0.08
      p[P.altruism] = 0.1
      p[P.empathyContagion] = 0.03
      p[P.foodRate] = 0.62
    }),
    matrix: mat([
      [0.7, -0.64],
      [-0.62, 0.72],
    ]),
  },
  {
    id: 'pairs',
    name: 'Paare',
    tag: 'Tanz',
    category: 'form',
    blurb: 'Zwei Farben suchen einander. Es entstehen Zweier, die umeinander kreisen.',
    count: 280,
    params: scene((p) => {
      p[P.speciesCount] = 3
      p[P.forceScale] = 0.46
      p[P.repulsion] = 15
      p[P.perception] = 58
      p[P.maxSpeed] = 1.18
      p[P.friction] = 0.88
      p[P.nnInfluence] = 0.18
      p[P.sexualRepro] = 0.85
      p[P.combat] = 0.04
      p[P.foodRate] = 0.66
    }),
    matrix: mat([
      [-0.14, 0.8, -0.1],
      [0.78, -0.12, -0.08],
      [-0.06, -0.08, 0.44],
    ]),
  },
  {
    id: 'snakes',
    name: 'Ketten',
    tag: 'Fluss',
    category: 'form',
    blurb: 'Jede Art folgt der nächsten und meidet die vorige. Wandernde Linien, manchmal Ringe.',
    count: 400,
    params: scene((p) => {
      p[P.speciesCount] = 3
      p[P.forceScale] = 0.5
      p[P.repulsion] = 13
      p[P.perception] = 62
      p[P.maxSpeed] = 1.28
      p[P.friction] = 0.87
      p[P.nnInfluence] = 0.14
      p[P.combat] = 0.05
      p[P.foodRate] = 0.64
    }),
    matrix: mat([
      [0.06, 0.8, -0.38],
      [-0.36, 0.05, 0.82],
      [0.78, -0.4, 0.06],
    ]),
  },
  {
    id: 'nuclei',
    name: 'Kerne',
    tag: 'Atom',
    category: 'form',
    blurb: 'Dichte Kerne, eine Hülle drumherum, ein paar freie Wanderer.',
    count: 360,
    params: scene((p) => {
      p[P.speciesCount] = 3
      p[P.forceScale] = 0.42
      p[P.repulsion] = 17
      p[P.perception] = 56
      p[P.maxSpeed] = 1.08
      p[P.nnInfluence] = 0.16
      p[P.combat] = 0.03
      p[P.foodRate] = 0.64
    }),
    matrix: mat([
      [0.82, 0.1, -0.2],
      [0.86, 0.2, 0.05],
      [-0.06, 0.34, 0.12],
    ]),
  },
  {
    id: 'mosaic',
    name: 'Mosaik',
    tag: 'Farben',
    category: 'form',
    blurb: 'Vier Stämme. Nachbarn dürfen sich streifen, Gegensätze stoßen sich ab.',
    count: 440,
    params: scene((p) => {
      p[P.speciesCount] = 4
      p[P.forceScale] = 0.4
      p[P.repulsion] = 16
      p[P.perception] = 52
      p[P.maxSpeed] = 1.1
      p[P.nnInfluence] = 0.16
      p[P.combat] = 0.06
      p[P.foodRate] = 0.64
    }),
    matrix: mat([
      [0.66, 0.14, -0.42, 0.1],
      [0.12, 0.68, 0.12, -0.44],
      [-0.4, 0.14, 0.66, 0.12],
      [0.1, -0.42, 0.12, 0.7],
    ]),
  },
  {
    id: 'utopia',
    name: 'Friedliche Utopie',
    tag: 'Sanft',
    category: 'society',
    blurb: 'Offene Dörfer. Allianzen halten, Träume sind häufig, Kampf fast aus.',
    count: 380,
    params: scene((p) => {
      p[P.speciesCount] = 4
      p[P.combat] = 0.02
      p[P.altruism] = 0.7
      p[P.empathyContagion] = 0.16
      p[P.empathyRadius] = 62
      p[P.lieTendency] = 0.02
      p[P.dreamFreq] = 0.24
      p[P.godMood] = 0.4
      p[P.beautySelect] = 0.6
      p[P.foodRate] = 0.7
      p[P.forceScale] = 0.3
      p[P.repulsion] = 17
      p[P.maxSpeed] = 1.02
      p[P.nnInfluence] = 0.28
    }),
    matrix: mat([
      [0.48, 0.16, 0.1, 0.12],
      [0.14, 0.46, 0.14, 0.1],
      [0.1, 0.12, 0.5, 0.14],
      [0.12, 0.1, 0.14, 0.46],
    ]),
  },
  {
    id: 'empaths',
    name: 'Schwarm der Empathen',
    tag: 'Wir',
    category: 'society',
    blurb: 'Gefühle sind ansteckend. Der Schwarm atmet beinahe gemeinsam — ohne zu verkleben.',
    count: 400,
    params: scene((p) => {
      p[P.speciesCount] = 3
      p[P.empathyRadius] = 82
      p[P.empathyContagion] = 0.3
      p[P.signalComplexity] = 0.82
      p[P.nnInfluence] = 0.32
      p[P.forceScale] = 0.3
      p[P.repulsion] = 19
      p[P.maxSpeed] = 1.08
      p[P.beautySelect] = 0.5
      p[P.altruism] = 0.44
      p[P.combat] = 0.03
      p[P.foodRate] = 0.68
    }),
    matrix: mat([
      [0.36, 0.2, 0.16],
      [0.18, 0.38, 0.18],
      [0.16, 0.18, 0.34],
    ]),
  },
  {
    id: 'liars',
    name: 'Lügner-Gesellschaft',
    tag: 'Maske',
    category: 'society',
    blurb: 'Signale lügen. Entdeckung ist teuer, Täuschung trotzdem lohnend.',
    count: 340,
    params: scene((p) => {
      p[P.speciesCount] = 3
      p[P.lieTendency] = 0.52
      p[P.liePenalty] = 0.36
      p[P.signalComplexity] = 1.0
      p[P.cultureRate] = 0.12
      p[P.combat] = 0.22
      p[P.empathyContagion] = 0.05
      p[P.forceScale] = 0.36
      p[P.repulsion] = 15
      p[P.maxSpeed] = 1.18
      p[P.nnInfluence] = 0.48
      p[P.foodRate] = 0.6
    }),
    matrix: mat([
      [0.3, 0.38, -0.24],
      [0.34, 0.22, 0.28],
      [-0.16, 0.42, 0.2],
    ]),
  },
  {
    id: 'culture',
    name: 'Kulturelle Hochkultur',
    tag: 'Erbe',
    category: 'society',
    blurb: 'Weisheit, sexuelle Mischung, Nachahmung. Generationen stapeln sich.',
    count: 340,
    params: scene((p) => {
      p[P.speciesCount] = 3
      p[P.cultureRate] = 0.26
      p[P.wisdomInherit] = 0.86
      p[P.sexualRepro] = 0.9
      p[P.mutation] = 0.045
      p[P.hebbian] = 0.2
      p[P.altruism] = 0.42
      p[P.beautySelect] = 0.48
      p[P.maxAge] = 3800
      p[P.forceScale] = 0.32
      p[P.repulsion] = 16
      p[P.maxSpeed] = 1.05
      p[P.combat] = 0.05
      p[P.foodRate] = 0.68
    }),
    matrix: mat([
      [0.46, 0.12, 0.16],
      [0.14, 0.48, 0.1],
      [0.14, 0.08, 0.44],
    ]),
  },
  {
    id: 'hunt',
    name: 'Hatz',
    tag: 'Jagd',
    category: 'conflict',
    blurb: 'Eine Herde flieht, eine Art jagt. Klar lesbar: Wer folgt, wer weicht.',
    count: 380,
    params: scene((p) => {
      p[P.speciesCount] = 2
      p[P.forceScale] = 0.5
      p[P.repulsion] = 14
      p[P.perception] = 68
      p[P.maxSpeed] = 1.38
      p[P.friction] = 0.87
      p[P.nnInfluence] = 0.24
      p[P.combat] = 0.38
      p[P.altruism] = 0.08
      p[P.foodRate] = 0.52
      p[P.energyDrain] = 0.0004
      p[P.lieTendency] = 0.04
    }),
    matrix: mat([
      [0.54, -0.7],
      [0.84, -0.18],
    ]),
  },
  {
    id: 'arena',
    name: 'Gnadenlose Arena',
    tag: 'Hart',
    category: 'conflict',
    blurb: 'Drei Arten im Kreis: jede jagt eine, flieht vor einer. Spannung, kein Massensterben.',
    count: 420,
    params: scene((p) => {
      p[P.speciesCount] = 3
      p[P.combat] = 0.48
      p[P.altruism] = 0.06
      p[P.foodRate] = 0.5
      p[P.energyDrain] = 0.00042
      p[P.lieTendency] = 0.12
      p[P.godMood] = -0.22
      p[P.forceScale] = 0.48
      p[P.repulsion] = 14
      p[P.maxSpeed] = 1.4
      p[P.perception] = 64
      p[P.dreamFreq] = 0.04
      p[P.nnInfluence] = 0.26
    }),
    matrix: mat([
      [0.16, 0.74, -0.5],
      [-0.48, 0.14, 0.76],
      [0.72, -0.5, 0.16],
    ]),
  },
  {
    id: 'parasites',
    name: 'Parasiten-Blüte',
    tag: 'Köder',
    category: 'conflict',
    blurb: 'Wirte ballen sich. Schmarotzer kleben an ihnen — die Herde bleibt trotzdem stehen.',
    count: 360,
    params: scene((p) => {
      p[P.speciesCount] = 2
      p[P.combat] = 0.42
      p[P.lieTendency] = 0.3
      p[P.altruism] = 0.14
      p[P.signalComplexity] = 0.78
      p[P.foodRate] = 0.54
      p[P.energyDrain] = 0.00038
      p[P.forceScale] = 0.4
      p[P.repulsion] = 15
      p[P.maxSpeed] = 1.2
      p[P.nnInfluence] = 0.32
    }),
    matrix: mat([
      [0.52, -0.24],
      [0.8, 0.12],
    ]),
  },
  {
    id: 'fossils',
    name: 'Nacht der Fossilien',
    tag: 'Echo',
    category: 'weather',
    blurb: 'Kürzeres Leben, spürbare Selektion. Wer fällt, hinterlässt ein Fossil — die Lichtung bleibt hell.',
    count: 300,
    params: scene((p) => {
      p[P.speciesCount] = 3
      p[P.maxAge] = 1400
      p[P.energyDrain] = 0.0004
      p[P.reproThreshold] = 0.74
      p[P.beautySelect] = 0.5
      p[P.wisdomInherit] = 0.68
      p[P.foodRate] = 0.58
      p[P.forceScale] = 0.34
      p[P.repulsion] = 16
      p[P.maxSpeed] = 1.08
      p[P.combat] = 0.14
    }),
    matrix: mat([
      [0.4, -0.18, 0.24],
      [0.2, 0.38, -0.2],
      [-0.14, 0.28, 0.36],
    ]),
  },
  {
    id: 'soup',
    name: 'Chaotische Ursuppe',
    tag: 'Roh',
    category: 'weather',
    blurb: 'Wilde Matrix, hohe Mutation. Formen entstehen und zerfallen — ohne die Welt zu leeren.',
    count: 480,
    params: scene((p) => {
      p[P.speciesCount] = 4
      p[P.timeScale] = 0.62
      p[P.mutation] = 0.16
      p[P.mutationPoetry] = 0.8
      p[P.chaos] = 0.24
      p[P.foodRate] = 0.72
      p[P.forceScale] = 0.52
      p[P.repulsion] = 13
      p[P.maxSpeed] = 1.32
      p[P.nnInfluence] = 0.22
      p[P.reproThreshold] = 0.66
    }),
    matrix: mat([
      [0.1, 0.7, -0.52, 0.42],
      [-0.48, 0.14, 0.64, -0.34],
      [0.6, -0.44, 0.08, 0.48],
      [-0.24, 0.5, -0.4, 0.12],
    ]),
  },
  {
    id: 'godmood',
    name: 'Göttliche Laune',
    tag: 'Wetter',
    category: 'weather',
    blurb: 'Portale und seltenes Wetter. Die Welt hat Launen, die Lichtung bleibt bewohnt.',
    count: 360,
    params: scene((p) => {
      p[P.speciesCount] = 3
      p[P.godMood] = 0.1
      p[P.portalRate] = 0.12
      p[P.catastropheRate] = 0.06
      p[P.daySpeed] = 0.007
      p[P.chaos] = 0.12
      p[P.dreamFreq] = 0.16
      p[P.forceScale] = 0.34
      p[P.repulsion] = 15
      p[P.maxSpeed] = 1.12
      p[P.foodRate] = 0.64
    }),
    matrix: mat([
      [0.34, 0.28, -0.22],
      [-0.18, 0.28, 0.34],
      [0.3, -0.22, 0.26],
    ]),
  },
]
