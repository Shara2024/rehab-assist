import type { Point3D } from "../types/romTypes";

export function averageVisibility(points: Point3D[]) {
  if (!points.length) return 0;
  const total = points.reduce((sum, p) => sum + (p.visibility ?? 0), 0);
  return total / points.length;
}

export function isVisibleEnough(points: Point3D[], minVisibility = 0.5) {
  return points.every((p) => (p.visibility ?? 0) >= minVisibility);
}
