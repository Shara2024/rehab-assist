// import type {
//   Side,
//   UpperBodyPoints,
//   RomMetrics,
//   Point3D,
// } from "../types/romTypes";
// import { subtract, angleBetween } from "./vector";

// function elbowJointAngle(
//   shoulder: Point3D,
//   elbow: Point3D,
//   wrist: Point3D,
// ): number | null {
//   const upperArm = subtract(shoulder, elbow);
//   const forearm = subtract(wrist, elbow);
//   return angleBetween(upperArm, forearm);
// }

// function elbowFlexionAngle(
//   shoulder: Point3D,
//   elbow: Point3D,
//   wrist: Point3D,
// ): number | null {
//   const jointAngle = elbowJointAngle(shoulder, elbow, wrist);
//   if (jointAngle == null) return null;

//   // straight elbow ~ 0°
//   // bent elbow increases
//   return Math.max(0, 180 - jointAngle);
// }

// export function computeShoulderRom(
//   upperBody: UpperBodyPoints,
//   side: Side,
// ): RomMetrics {
//   const shoulder = side === "left" ? upperBody.LS : upperBody.RS;
//   const elbow = side === "left" ? upperBody.LE : upperBody.RE;
//   const wrist = side === "left" ? upperBody.LW : upperBody.RW;
//   const hipCenter = upperBody.MID_HIP;

//   const shoulderPointsOk =
//     Number.isFinite(hipCenter.x) &&
//     Number.isFinite(hipCenter.y) &&
//     Number.isFinite(hipCenter.z) &&
//     Number.isFinite(shoulder.x) &&
//     Number.isFinite(shoulder.y) &&
//     Number.isFinite(shoulder.z) &&
//     Number.isFinite(elbow.x) &&
//     Number.isFinite(elbow.y) &&
//     Number.isFinite(elbow.z);

//   const elbowPointsOk =
//     Number.isFinite(shoulder.x) &&
//     Number.isFinite(shoulder.y) &&
//     Number.isFinite(shoulder.z) &&
//     Number.isFinite(elbow.x) &&
//     Number.isFinite(elbow.y) &&
//     Number.isFinite(elbow.z) &&
//     Number.isFinite(wrist.x) &&
//     Number.isFinite(wrist.y) &&
//     Number.isFinite(wrist.z);

//   let shoulderAbductionDeg: number | null = null;
//   let elbowFlexionDeg: number | null = null;

//   if (shoulderPointsOk) {
//     // torso vector: shoulder -> mid hip
//     const torsoVector = subtract(hipCenter, shoulder);
//     const upperArmVector = subtract(elbow, shoulder);

//     const rawAngle = angleBetween(torsoVector, upperArmVector);
//     shoulderAbductionDeg = rawAngle == null ? null : Math.max(0, rawAngle);
//   }

//   if (elbowPointsOk) {
//     elbowFlexionDeg = elbowFlexionAngle(shoulder, elbow, wrist);
//   }

//   return {
//     side,
//     shoulderAbductionDeg,
//     elbowFlexionDeg,
//     shoulderVisibleEnough: shoulderPointsOk,
//     elbowVisibleEnough: elbowPointsOk,
//   };
// }

import type {
  Side,
  UpperBodyPoints,
  RomMetrics,
  Point3D,
} from "../types/romTypes";
import { subtract, angleBetween } from "./vector";

function elbowJointAngle(
  shoulder: Point3D,
  elbow: Point3D,
  wrist: Point3D,
): number | null {
  const upperArm = subtract(shoulder, elbow);
  const forearm = subtract(wrist, elbow);
  return angleBetween(upperArm, forearm);
}

function elbowFlexionAngle(
  shoulder: Point3D,
  elbow: Point3D,
  wrist: Point3D,
): number | null {
  const jointAngle = elbowJointAngle(shoulder, elbow, wrist);
  if (jointAngle == null) return null;

  // straight elbow ~ 0°
  // bent elbow increases
  return Math.max(0, 180 - jointAngle);
}

function isFinitePoint(p: Point3D): boolean {
  return Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z);
}

function clampAngle(angle: number): number {
  return Math.max(0, Math.min(180, angle));
}

export function computeShoulderRom(
  upperBody: UpperBodyPoints,
  side: Side,
): RomMetrics {
  const shoulder = side === "left" ? upperBody.LS : upperBody.RS;
  const elbow = side === "left" ? upperBody.LE : upperBody.RE;
  const wrist = side === "left" ? upperBody.LW : upperBody.RW;

  const midHip = upperBody.MID_HIP;
  const midShoulder = upperBody.MID_SHOULDER;

  const shoulderPointsOk =
    isFinitePoint(midHip) &&
    isFinitePoint(midShoulder) &&
    isFinitePoint(shoulder) &&
    isFinitePoint(elbow);

  const elbowPointsOk =
    isFinitePoint(shoulder) && isFinitePoint(elbow) && isFinitePoint(wrist);

  let shoulderAbductionDeg: number | null = null;
  let elbowFlexionDeg: number | null = null;

  if (shoulderPointsOk) {
    // central trunk axis: mid hip -> mid shoulder
    const trunkUpVector = subtract(midShoulder, midHip);

    // humerus axis: shoulder -> elbow
    const upperArmVector = subtract(elbow, shoulder);

    const rawAngle = angleBetween(trunkUpVector, upperArmVector);

    if (rawAngle != null) {
      // Convert to clinically readable abduction-like angle:
      // arm by side -> ~0°
      // arm at shoulder height -> ~90°
      // arm overhead -> ~180°
      shoulderAbductionDeg = clampAngle(180 - rawAngle);
    }
  }

  if (elbowPointsOk) {
    elbowFlexionDeg = elbowFlexionAngle(shoulder, elbow, wrist);
  }

  return {
    side,
    shoulderAbductionDeg,
    elbowFlexionDeg,
    shoulderVisibleEnough: shoulderPointsOk,
    elbowVisibleEnough: elbowPointsOk,
  };
}
