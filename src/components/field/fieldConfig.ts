export type FieldType = 'SSL-EL' | 'SSL' | 'treino'

export interface FieldGeometry {
  fieldW: number
  fieldH: number
  playW: number
  playH: number
  goalW: number
  goalH: number
  defenseW: number
  defenseH: number
  centerCircleR: number
  centerDotR: number
  lineThicknessMm: number
  cornerArcR: number
  aspectRatio: number
}

export const FIELD_GEOMETRIES: Record<FieldType, FieldGeometry> = {
  'SSL-EL': {
    fieldW: 5500, fieldH: 4000,
    playW: 5500 * 0.8182, playH: 4000 * 0.75,
    goalW: 5500 * 0.0582, goalH: 4000 * 0.20,
    defenseW: 5500 * 0.0844, defenseH: 4000 * 0.3638,
    centerCircleR: (5500 * 0.15) / 2,
    centerDotR: (5500 * 0.15) * 0.025,
    lineThicknessMm: 20,
    cornerArcR: 0,
    aspectRatio: 5500 / 4000,
  },
  'SSL': {
    fieldW: 10400, fieldH: 7400,
    playW: 10400 * 0.8653, playH: 7400 * 0.8108,
    goalW: 10400 * 0.05, goalH: 7400 * 0.1351,
    defenseW: 10400 * 0.0961, defenseH: 7400 * 0.2702,
    centerCircleR: (10400 * 0.12) / 2,
    centerDotR: (10400 * 0.12) * 0.025,
    lineThicknessMm: 20,
    cornerArcR: 0,
    aspectRatio: 10400 / 7400,
  },
  'treino': {
    fieldW: 1530, fieldH: 1330,
    playW: 1530 * 0.70, playH: 1330 * 0.60,
    goalW: 1530 * 0.06, goalH: 1330 * 0.15,
    defenseW: 1530 * 0.065, defenseH: 1330 * 0.25,
    centerCircleR: (1530 * 0.10) / 2,
    centerDotR: (1530 * 0.10) * 0.025,
    lineThicknessMm: 10,
    cornerArcR: 0,
    aspectRatio: 1530 / 1330,
  },
}

// Physical SSL robots are ~180mm diameter; we render slightly larger for
// visibility/readability (matches the old CSS version's prominence).
export const ROBOT_RADIUS_MM = 180
export const ROBOT_RING_WIDTH_MM = 36
export const ROBOT_LABEL_FONT_MM = 260
export const ROBOT_LABEL_STROKE_MM = 24
export const BALL_RADIUS_MM = 55

export const TRAJECTORY_STYLE = {
  widthMm: 60,
  dashMm: 180,
  gapMm: 90,
  opacity: 0.9,
}

// Position smoothing: fraction of the gap to the target that sprites close
// each 60fps frame. 0.35 → ~95% of a jump covered in ~7 frames (~115ms).
// Hides socket jitter without introducing visible lag on real motion.
export const SMOOTH_ALPHA_POS = 0.35
export const SMOOTH_ALPHA_ROT = 0.4

// Trajectories are planned paths, not live motion — no need to redraw
// them at 60fps. This caps redraws to every N ms.
export const TRAJECTORY_REDRAW_INTERVAL_MS = 100

export interface FieldPalette {
  fieldBg: number
  fieldBgInner: number
  lineColor: number
  goalColor: number
  borderColor: number
  yellowTeam: number
  blueTeam: number
  yellowTrail: number
  blueTrail: number
  unknownTrail: number
  ballBase: number
  ballHighlight: number
  robotBody: number
  robotHighlight: number
  textColor: number
  textStroke: number
}

function cssVar(name: string, fallback: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}

export function parseColor(input: string): number {
  const s = input.trim()
  if (s.startsWith('#')) {
    let hex = s.slice(1)
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('')
    if (hex.length >= 6) return parseInt(hex.slice(0, 6), 16)
    return 0
  }
  const m = s.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i)
  if (m) return (parseInt(m[1]) << 16) | (parseInt(m[2]) << 8) | parseInt(m[3])
  return 0
}

export function loadPalette(fieldType: FieldType): FieldPalette {
  let fieldBg: number, fieldBgInner: number, lineColor: number, goalColor: number, borderColor: number
  if (fieldType === 'SSL') {
    fieldBgInner = 0x0b2d1a; fieldBg = 0x062011
    lineColor = 0xffffff; goalColor = 0xffffff; borderColor = 0xffffff
  } else if (fieldType === 'SSL-EL') {
    fieldBgInner = 0x222e5c; fieldBg = 0x050a1a
    lineColor = 0xffffff; goalColor = 0xffffff; borderColor = 0xffffff
  } else {
    fieldBgInner = parseColor(cssVar('--fundo-terciario', '#222'))
    fieldBg = fieldBgInner
    lineColor = parseColor(cssVar('--cor-aviso', '#f0c000'))
    goalColor = parseColor(cssVar('--cor-borda', '#444'))
    borderColor = parseColor(cssVar('--cor-aviso', '#f0c000'))
  }

  return {
    fieldBg, fieldBgInner, lineColor, goalColor, borderColor,
    yellowTeam: parseColor(cssVar('--time-amarelo', '#ffc107')),
    blueTeam: parseColor(cssVar('--time-azul', '#1e88e5')),
    yellowTrail: parseColor(cssVar('--time-amarelo', '#ffc107')),
    blueTrail: parseColor(cssVar('--time-azul', '#1e88e5')),
    unknownTrail: 0xdbe9e8,
    ballBase: 0xe65100,
    ballHighlight: 0xffc107,
    robotBody: 0x1a1a1a,
    robotHighlight: 0xffffff,
    textColor: 0xffffff,
    textStroke: 0x000000,
  }
}
