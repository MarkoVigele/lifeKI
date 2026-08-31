export const PARAM_COUNT = 36
export const SPECIES_MAX = 6
export const WEIGHTS = 16 * 12 + 12 + 12 * 8 + 8
export const MIND_STRIDE = 8 + 6 + WEIGHTS
export const INSPECT_LEN = 48
export const RENDER_STRIDE = 8

export const P = {
  timeScale: 0,
  friction: 1,
  maxSpeed: 2,
  perception: 3,
  repulsion: 4,
  forceScale: 5,
  energyDrain: 6,
  foodRate: 7,
  foodEnergy: 8,
  reproCost: 9,
  reproThreshold: 10,
  mutation: 11,
  dreamIntensity: 12,
  dreamFreq: 13,
  lieTendency: 14,
  liePenalty: 15,
  cultureRate: 16,
  wisdomInherit: 17,
  chaos: 18,
  beautySelect: 19,
  empathyRadius: 20,
  empathyContagion: 21,
  memoryDecay: 22,
  signalComplexity: 23,
  mutationPoetry: 24,
  godMood: 25,
  hebbian: 26,
  daySpeed: 27,
  nnInfluence: 28,
  speciesCount: 29,
  sexualRepro: 30,
  altruism: 31,
  portalRate: 32,
  catastropheRate: 33,
  maxAge: 34,
  combat: 35,
} as const

export type ParamKey = keyof typeof P

export type SliderDef = {
  key: ParamKey
  label: string
  hint: string
  min: number
  max: number
  step: number
  format?: (v: number) => string
}

export const PARAM_GROUPS: { id: string; title: string; sliders: SliderDef[] }[] = [
  {
    id: 'world',
    title: 'Welt & Partikel',
    sliders: [
      { key: 'timeScale', label: 'Zeitmaß', hint: 'Atem der Welt. 0 friert alles ein.', min: 0, max: 2.4, step: 0.01 },
      { key: 'friction', label: 'Reibung', hint: 'Wie klebrig der Äther ist.', min: 0.62, max: 0.96, step: 0.01 },
      { key: 'maxSpeed', label: 'Höchstgeschwindigkeit', hint: 'Ob sie gleiten oder hetzen.', min: 0.6, max: 5.2, step: 0.05 },
      { key: 'perception', label: 'Wahrnehmungsradius', hint: 'Wie weit ein Geist reicht.', min: 22, max: 120, step: 1, format: (v) => v.toFixed(0) },
      { key: 'repulsion', label: 'Körperliche Abstoßung', hint: 'Kurzer Abstand, der Zusammenstöße verhindert.', min: 6, max: 32, step: 0.5 },
      { key: 'forceScale', label: 'Kräfte-Skala', hint: 'Stärke der klassischen Particle-Life-Matrix.', min: 0.05, max: 1.6, step: 0.01 },
      { key: 'speciesCount', label: 'Artenzahl', hint: 'Farben und Stämme in der Matrix.', min: 2, max: 6, step: 1, format: (v) => v.toFixed(0) },
    ],
  },
  {
    id: 'nets',
    title: 'Neuronale Netze',
    sliders: [
      { key: 'nnInfluence', label: 'Netz-Einfluss', hint: 'Wie stark das innere Netz die Kräfte überstimmt.', min: 0, max: 1.4, step: 0.01 },
      { key: 'hebbian', label: 'Hebbsches Lernen', hint: 'Was belohnt wird, verdrahtet sich.', min: 0, max: 0.6, step: 0.01 },
      { key: 'memoryDecay', label: 'Vergessenskurve', hint: 'Wie schnell Belohnungen verblassen.', min: 0, max: 0.3, step: 0.005 },
      { key: 'dreamIntensity', label: 'Traum-Intensität', hint: 'Wie tief Replay die Gewichte verschiebt.', min: 0, max: 1, step: 0.01 },
      { key: 'dreamFreq', label: 'Traum-Häufigkeit', hint: 'Wie oft stille Geister zu träumen wagen.', min: 0, max: 0.6, step: 0.01 },
      { key: 'chaos', label: 'Chaos-Injection', hint: 'Plötzliche Ideen, die ganze Cluster anstecken.', min: 0, max: 0.5, step: 0.005 },
    ],
  },
  {
    id: 'emotion',
    title: 'Emotionen & Antriebe',
    sliders: [
      { key: 'empathyRadius', label: 'Empathie-Radius', hint: 'In welchem Kreis Gefühle überspringen.', min: 8, max: 110, step: 1, format: (v) => v.toFixed(0) },
      { key: 'empathyContagion', label: 'Emotions-Ansteckung', hint: 'Wie porös die Grenzen zwischen Innenwelten sind.', min: 0, max: 0.45, step: 0.005 },
      { key: 'godMood', label: 'Gott-Laune', hint: 'Globale Stimmung: Furcht oder Spiel.', min: -1, max: 1, step: 0.01 },
    ],
  },
  {
    id: 'evo',
    title: 'Evolution',
    sliders: [
      { key: 'energyDrain', label: 'Energieverlust', hint: 'Der Preis, am Leben zu bleiben.', min: 0, max: 0.0024, step: 0.00002, format: (v) => v.toFixed(4) },
      { key: 'foodRate', label: 'Nahrungsfluss', hint: 'Wie großzügig die Welt speist.', min: 0, max: 1.2, step: 0.01 },
      { key: 'foodEnergy', label: 'Nährwert', hint: 'Was eine Mote wert ist.', min: 0.05, max: 0.7, step: 0.01 },
      { key: 'reproThreshold', label: 'Fortpflanzungs-Schwelle', hint: 'Energie, bevor neues Leben möglich ist.', min: 0.45, max: 1.1, step: 0.01 },
      { key: 'reproCost', label: 'Geburtskosten', hint: 'Was Eltern an die Nächste geben.', min: 0.12, max: 0.7, step: 0.01 },
      { key: 'sexualRepro', label: 'Sexuelle Fortpflanzung', hint: 'Mischung zweier Geister statt Klon.', min: 0, max: 1, step: 0.01 },
      { key: 'mutation', label: 'Mutationsrate', hint: 'Grundrauschen der Vererbung.', min: 0, max: 0.4, step: 0.005 },
      { key: 'mutationPoetry', label: 'Mutations-Poesie', hint: 'Wie extrem und lyrisch Sprünge ausfallen dürfen.', min: 0, max: 1, step: 0.01 },
      { key: 'wisdomInherit', label: 'Weisheits-Vererbung', hint: 'Wie treu Kinder den erfolgreichen Eltern folgen.', min: 0, max: 1, step: 0.01 },
      { key: 'beautySelect', label: 'Schönheits-Selektion', hint: 'Belohnt Harmonie, Glätte, Zugehörigkeit.', min: 0, max: 1, step: 0.01 },
      { key: 'altruism', label: 'Altruismus', hint: 'Ob Reiche den Hungernden geben.', min: 0, max: 1, step: 0.01 },
      { key: 'combat', label: 'Kampf / Parasitismus', hint: 'Energie-Diebstahl zwischen Arten.', min: 0, max: 1, step: 0.01 },
      { key: 'maxAge', label: 'Maximales Alter', hint: 'Wann selbst die Weisen vergehen.', min: 400, max: 6000, step: 20, format: (v) => v.toFixed(0) },
    ],
  },
  {
    id: 'talk',
    title: 'Kommunikation',
    sliders: [
      { key: 'signalComplexity', label: 'Signal-Komplexität', hint: 'Reichtum der farbigen Sprache.', min: 0, max: 1.2, step: 0.01 },
      { key: 'lieTendency', label: 'Lügen-Neigung', hint: 'Falsche Signale als Strategie.', min: 0, max: 0.8, step: 0.01 },
      { key: 'liePenalty', label: 'Entdeckungs-Strafe', hint: 'Was Lügen kostet, wenn sie auffliegen.', min: 0, max: 0.8, step: 0.01 },
      { key: 'cultureRate', label: 'Kultur-Übertragung', hint: 'Nachahmen erfolgreicher Nachbarn.', min: 0, max: 0.4, step: 0.005 },
    ],
  },
  {
    id: 'env',
    title: 'Umwelt',
    sliders: [
      { key: 'daySpeed', label: 'Tageslänge', hint: 'Wie schnell Nacht in Spiel und Furcht kippt.', min: 0, max: 0.02, step: 0.0002, format: (v) => v.toFixed(4) },
      { key: 'portalRate', label: 'Dimensionsrisse', hint: 'Wie oft sich Portale neu knüpfen.', min: 0, max: 0.3, step: 0.005 },
      { key: 'catastropheRate', label: 'Katastrophen', hint: 'Beben, Blüte, Pest, Dürre — von selbst.', min: 0, max: 0.25, step: 0.005 },
    ],
  },
]

export function defaultParams(): Float32Array {
  const p = new Float32Array(PARAM_COUNT)
  p[P.timeScale] = 0.62
  p[P.friction] = 0.89
  p[P.maxSpeed] = 1.35
  p[P.perception] = 58
  p[P.repulsion] = 15
  p[P.forceScale] = 0.4
  p[P.energyDrain] = 0.00036
  p[P.foodRate] = 0.58
  p[P.foodEnergy] = 0.3
  p[P.reproCost] = 0.38
  p[P.reproThreshold] = 0.78
  p[P.mutation] = 0.08
  p[P.dreamIntensity] = 0.35
  p[P.dreamFreq] = 0.12
  p[P.lieTendency] = 0.08
  p[P.liePenalty] = 0.18
  p[P.cultureRate] = 0.04
  p[P.wisdomInherit] = 0.55
  p[P.chaos] = 0.06
  p[P.beautySelect] = 0.25
  p[P.empathyRadius] = 42
  p[P.empathyContagion] = 0.08
  p[P.memoryDecay] = 0.04
  p[P.signalComplexity] = 0.65
  p[P.mutationPoetry] = 0.3
  p[P.godMood] = 0
  p[P.hebbian] = 0.12
  p[P.daySpeed] = 0.0035
  p[P.nnInfluence] = 0.55
  p[P.speciesCount] = 6
  p[P.sexualRepro] = 0.55
  p[P.altruism] = 0.2
  p[P.portalRate] = 0.04
  p[P.catastropheRate] = 0.03
  p[P.maxAge] = 2400
  p[P.combat] = 0.25
  return p
}

export const EMO_LABELS = ['Neugier', 'Angst', 'Aggression', 'Zugehörigkeit', 'Hunger', 'Spiel', 'Dominanz']
export const PERS_LABELS = ['Offenheit', 'Vorsicht', 'Wildheit', 'Loyalität', 'Gier', 'Laune']

export const DEFAULT_MATRIX = new Float32Array([
  0.35, -0.25, 0.55, -0.15, 0.1, -0.4, 0.4, 0.3, -0.45, 0.2, -0.1, 0.15, -0.2, 0.6, 0.25, -0.35, 0.45, -0.1, 0.15,
  -0.3, 0.2, 0.5, -0.45, 0.25, -0.35, 0.1, -0.2, 0.55, 0.2, 0.4, 0.25, -0.15, 0.1, -0.25, 0.35, 0.45,
])
