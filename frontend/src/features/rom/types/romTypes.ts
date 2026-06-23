// export type Side = "left" | "right";

// export type Point3D = {
//   x: number;
//   y: number;
//   z: number;
//   visibility?: number;
// };

// export type UpperBodyPoints = {
//   hip_center: Point3D;
//   shoulder_center: Point3D;
//   left_shoulder: Point3D;
//   right_shoulder: Point3D;
//   left_elbow: Point3D;
//   right_elbow: Point3D;
//   left_wrist: Point3D;
//   right_wrist: Point3D;
// };

// export type RomMetrics = {
//   side: Side;
//   shoulderAbductionDeg: number | null;
//   elbowFlexionDeg: number | null;
//   shoulderVisibleEnough: boolean;
//   elbowVisibleEnough: boolean;
//   visibilityScore: number;
// };

export type Side = "left" | "right";

export type Point3D = {
  x: number;
  y: number;
  z: number;
};

export type UpperBodyPoints = {
  LS: Point3D;
  RS: Point3D;
  LE: Point3D;
  RE: Point3D;
  LW: Point3D;
  RW: Point3D;
  LH: Point3D;
  RH: Point3D;
  MID_HIP: Point3D;
  MID_SHOULDER: Point3D;
};

export type RomMetrics = {
  side: Side;
  shoulderAbductionDeg: number | null;
  elbowFlexionDeg: number | null;
  shoulderVisibleEnough: boolean;
  elbowVisibleEnough: boolean;
};