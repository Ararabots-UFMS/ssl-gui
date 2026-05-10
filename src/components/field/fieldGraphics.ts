import { Graphics } from 'pixi.js'
import type { FieldGeometry, FieldPalette } from './fieldConfig'

export function drawField(g: Graphics, geo: FieldGeometry, pal: FieldPalette): void {
  g.clear()

  const t = geo.lineThicknessMm
  const halfPW = geo.playW / 2
  const halfPH = geo.playH / 2

  g.rect(-geo.fieldW / 2, -geo.fieldH / 2, geo.fieldW, geo.fieldH)
   .fill({ color: pal.fieldBgInner })

  g.rect(-geo.fieldW / 2, -geo.fieldH / 2, geo.fieldW, geo.fieldH)
   .stroke({ color: pal.borderColor, width: t * 2, alignment: 0.5 })

  g.rect(-halfPW, -halfPH, geo.playW, geo.playH)
   .stroke({ color: pal.lineColor, width: t })

  g.moveTo(0, -halfPH).lineTo(0, halfPH)
   .stroke({ color: pal.lineColor, width: t })

  g.moveTo(-halfPW, 0).lineTo(halfPW, 0)
   .stroke({ color: pal.lineColor, width: t })

  g.circle(0, 0, geo.centerCircleR)
   .stroke({ color: pal.lineColor, width: t })

  if (geo.centerDotR > 0) {
    g.circle(0, 0, geo.centerDotR).fill({ color: pal.lineColor })
  }

  const goalHalfH = geo.goalH / 2
  g.rect(-halfPW - geo.goalW, -goalHalfH, geo.goalW, geo.goalH)
   .fill({ color: pal.goalColor, alpha: 0.06 })
   .stroke({ color: pal.goalColor, width: t })
  g.rect(halfPW, -goalHalfH, geo.goalW, geo.goalH)
   .fill({ color: pal.goalColor, alpha: 0.06 })
   .stroke({ color: pal.goalColor, width: t })

  const defHalfH = geo.defenseH / 2
  g.rect(-halfPW, -defHalfH, geo.defenseW, geo.defenseH)
   .stroke({ color: pal.lineColor, width: t })
  g.rect(halfPW - geo.defenseW, -defHalfH, geo.defenseW, geo.defenseH)
   .stroke({ color: pal.lineColor, width: t })
}
