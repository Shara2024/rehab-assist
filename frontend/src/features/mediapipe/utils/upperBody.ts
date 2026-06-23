import type { NormalizedLandmark } from "@mediapipe/pose";
import type { Point3D, UpperBodyPoints } from "@/features/rom/types/romTypes";

const IDX = {
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
} as const;

function toPoint(lm: NormalizedLandmark | undefined): Point3D | null {
  if (!lm) return null;

  return {
    x: lm.x,
    y: lm.y,
    z: lm.z,
  };
}

function midpoint(a: Point3D, b: Point3D): Point3D {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    z: (a.z + b.z) / 2,
  };
}

export function extractUpperBody(
  lms: NormalizedLandmark[] | undefined,
): UpperBodyPoints | null {
  if (!lms) return null;

  const LS = toPoint(lms[IDX.LEFT_SHOULDER]);
  const RS = toPoint(lms[IDX.RIGHT_SHOULDER]);
  const LE = toPoint(lms[IDX.LEFT_ELBOW]);
  const RE = toPoint(lms[IDX.RIGHT_ELBOW]);
  const LW = toPoint(lms[IDX.LEFT_WRIST]);
  const RW = toPoint(lms[IDX.RIGHT_WRIST]);
  const LH = toPoint(lms[IDX.LEFT_HIP]);
  const RH = toPoint(lms[IDX.RIGHT_HIP]);

  if (!LS || !RS || !LE || !RE || !LW || !RW || !LH || !RH) {
    return null;
  }

  const MID_HIP = midpoint(LH, RH);
  const MID_SHOULDER = midpoint(LS, RS);

  return {
    LS,
    RS,
    LE,
    RE,
    LW,
    RW,
    LH,
    RH,
    MID_HIP,
    MID_SHOULDER,
  };
}