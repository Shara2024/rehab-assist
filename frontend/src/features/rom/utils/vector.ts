import type { Point3D } from "../types/romTypes";

export function subtract(a: Point3D, b: Point3D) {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
    z: a.z - b.z,
  };
}

export function dot(
  a: { x: number; y: number; z: number },
  b: { x: number; y: number; z: number },
) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function magnitude(v: { x: number; y: number; z: number }) {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

export function angleBetween(
  a: { x: number; y: number; z: number },
  b: { x: number; y: number; z: number },
) {
  const magA = magnitude(a);
  const magB = magnitude(b);

  if (magA === 0 || magB === 0) return null;

  const cos = dot(a, b) / (magA * magB);
  const clamped = Math.max(-1, Math.min(1, cos));
  return (Math.acos(clamped) * 180) / Math.PI;
}
