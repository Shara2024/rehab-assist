// import type { Side, UpperBodyPoints } from "../types/romTypes";

// type ExerciseValidity = {
//   isValidForCounting: boolean;
//   isFacingCamera: boolean;
//   isUpperBodyVisible: boolean;
//   isTrackedArmLateral: boolean;
//   isOtherArmResting: boolean;
//   isStartPose: boolean;
//   isEndPose: boolean;
//   message: string | null;
// };

// function abs(n: number) {
//   return Math.abs(n);
// }

// function getTrackedPoints(upperBody: UpperBodyPoints, side: Side) {
//   return side === "left"
//     ? {
//         shoulder: upperBody.left_shoulder,
//         elbow: upperBody.left_elbow,
//         wrist: upperBody.left_wrist,
//         otherShoulder: upperBody.right_shoulder,
//         otherElbow: upperBody.right_elbow,
//         otherWrist: upperBody.right_wrist,
//       }
//     : {
//         shoulder: upperBody.right_shoulder,
//         elbow: upperBody.right_elbow,
//         wrist: upperBody.right_wrist,
//         otherShoulder: upperBody.left_shoulder,
//         otherElbow: upperBody.left_elbow,
//         otherWrist: upperBody.left_wrist,
//       };
// }

// /**
//  * Front-facing heuristic:
//  * if shoulders collapse too much in image width, user is likely turned sideways.
//  */
// function isFacingCameraEnough(upperBody: UpperBodyPoints) {
//   const shoulderWidth = abs(
//     upperBody.right_shoulder.x - upperBody.left_shoulder.x,
//   );

//   return shoulderWidth >= 0.08;
// }

// /**
//  * Required upper-body points visible enough.
//  */
// function isUpperBodyVisibleEnough(upperBody: UpperBodyPoints) {
//   const pts = [
//     upperBody.hip_center,
//     upperBody.shoulder_center,
//     upperBody.left_shoulder,
//     upperBody.right_shoulder,
//     upperBody.left_elbow,
//     upperBody.right_elbow,
//     upperBody.left_wrist,
//     upperBody.right_wrist,
//   ];

//   return pts.every((p) => (p.visibility ?? 0) >= 0.5);
// }

// /**
//  * Tracked arm should move outward from the body, not across the chest.
//  * For a front-facing camera:
//  * - anatomical right arm abducting outward usually moves leftward in image (smaller x)
//  * - anatomical left arm abducting outward usually moves rightward in image (larger x)
//  */
// function isTrackedArmMovingLaterally(upperBody: UpperBodyPoints, side: Side) {
//   const { shoulder, elbow, wrist } = getTrackedPoints(upperBody, side);
//   const shoulderCenterX = upperBody.shoulder_center.x;
//   const lateralMargin = 0.01;

//   if (side === "right") {
//     return (
//       elbow.x <= shoulder.x + lateralMargin &&
//       wrist.x <= elbow.x + 0.03 &&
//       wrist.x <= shoulderCenterX + 0.02
//     );
//   }

//   return (
//     elbow.x >= shoulder.x - lateralMargin &&
//     wrist.x >= elbow.x - 0.03 &&
//     wrist.x >= shoulderCenterX - 0.02
//   );
// }

// /**
//  * Other arm should stay near rest, not lifting significantly.
//  */
// function isOtherArmRestingEnough(upperBody: UpperBodyPoints, side: Side) {
//   const { otherShoulder, otherElbow, otherWrist } = getTrackedPoints(
//     upperBody,
//     side,
//   );

//   const otherElbowLift = otherShoulder.y - otherElbow.y;
//   const otherWristLift = otherShoulder.y - otherWrist.y;

//   return otherElbowLift < 0.04 && otherWristLift < 0.02;
// }

// /**
//  * Arm by side start/end pose:
//  * - elbow below shoulder
//  * - wrist below elbow
//  * - elbow near shoulder x
//  * - wrist near elbow x
//  */
// function isArmAtSidePose(upperBody: UpperBodyPoints, side: Side) {
//   const { shoulder, elbow, wrist } = getTrackedPoints(upperBody, side);

//   const elbowBelowShoulder = elbow.y > shoulder.y + 0.04;
//   const wristBelowElbow = wrist.y > elbow.y - 0.01;

//   const elbowCloseToBody = abs(elbow.x - shoulder.x) < 0.08;
//   const wristCloseToElbow = abs(wrist.x - elbow.x) < 0.08;

//   return (
//     elbowBelowShoulder &&
//     wristBelowElbow &&
//     elbowCloseToBody &&
//     wristCloseToElbow
//   );
// }

// export function validateShoulderAbductionPose(
//   upperBody: UpperBodyPoints,
//   side: Side,
// ): ExerciseValidity {
//   const visible = isUpperBodyVisibleEnough(upperBody);
//   if (!visible) {
//     return {
//       isValidForCounting: false,
//       isFacingCamera: false,
//       isUpperBodyVisible: false,
//       isTrackedArmLateral: false,
//       isOtherArmResting: false,
//       isStartPose: false,
//       isEndPose: false,
//       message: "Keep your full upper body visible.",
//     };
//   }

//   const facing = isFacingCameraEnough(upperBody);
//   if (!facing) {
//     return {
//       isValidForCounting: false,
//       isFacingCamera: false,
//       isUpperBodyVisible: true,
//       isTrackedArmLateral: false,
//       isOtherArmResting: false,
//       isStartPose: false,
//       isEndPose: false,
//       message: "Face the camera directly.",
//     };
//   }

//   const lateral = isTrackedArmMovingLaterally(upperBody, side);
//   if (!lateral) {
//     return {
//       isValidForCounting: false,
//       isFacingCamera: true,
//       isUpperBodyVisible: true,
//       isTrackedArmLateral: false,
//       isOtherArmResting: false,
//       isStartPose: false,
//       isEndPose: false,
//       message: "Lift your arm out to the side, not across your body.",
//     };
//   }

//   const otherResting = isOtherArmRestingEnough(upperBody, side);
//   if (!otherResting) {
//     return {
//       isValidForCounting: false,
//       isFacingCamera: true,
//       isUpperBodyVisible: true,
//       isTrackedArmLateral: true,
//       isOtherArmResting: false,
//       isStartPose: false,
//       isEndPose: false,
//       message: "Move only one arm at a time.",
//     };
//   }

//   const atSide = isArmAtSidePose(upperBody, side);

//   return {
//     isValidForCounting: true,
//     isFacingCamera: true,
//     isUpperBodyVisible: true,
//     isTrackedArmLateral: true,
//     isOtherArmResting: true,
//     isStartPose: atSide,
//     isEndPose: atSide,
//     message: null,
//   };
// }



import type { Side, UpperBodyPoints } from "../types/romTypes";

type ExerciseValidity = {
  isValidForCounting: boolean;
  isFacingCamera: boolean;
  isUpperBodyVisible: boolean;
  isTrackedArmLateral: boolean;
  isOtherArmResting: boolean;
  isStartPose: boolean;
  isEndPose: boolean;
  message: string | null;
};

function abs(n: number) {
  return Math.abs(n);
}

function getTrackedPoints(upperBody: UpperBodyPoints, side: Side) {
  return side === "left"
    ? {
        shoulder: upperBody.LS,
        elbow: upperBody.LE,
        wrist: upperBody.LW,
        otherShoulder: upperBody.RS,
        otherElbow: upperBody.RE,
        otherWrist: upperBody.RW,
      }
    : {
        shoulder: upperBody.RS,
        elbow: upperBody.RE,
        wrist: upperBody.RW,
        otherShoulder: upperBody.LS,
        otherElbow: upperBody.LE,
        otherWrist: upperBody.LW,
      };
}

/**
 * Front-facing heuristic:
 * if shoulders collapse too much in image width, user is likely turned sideways.
 */
function isFacingCameraEnough(upperBody: UpperBodyPoints) {
  const shoulderWidth = abs(upperBody.RS.x - upperBody.LS.x);
  return shoulderWidth >= 0.08;
}

/**
 * Since visibility was removed, this now just checks the required points exist.
 * With your current typed pipeline, if upperBody exists, these points should exist too.
 */
function isUpperBodyVisibleEnough(upperBody: UpperBodyPoints) {
  const pts = [
    upperBody.MID_HIP,
    upperBody.MID_SHOULDER,
    upperBody.LS,
    upperBody.RS,
    upperBody.LE,
    upperBody.RE,
    upperBody.LW,
    upperBody.RW,
    upperBody.LH,
    upperBody.RH,
  ];

  return pts.every(
    (p) =>
      p != null &&
      Number.isFinite(p.x) &&
      Number.isFinite(p.y) &&
      Number.isFinite(p.z),
  );
}

/**
 * Tracked arm should move outward from the body, not across the chest.
 * For a front-facing camera:
 * - anatomical right arm abducting outward usually moves leftward in image (smaller x)
 * - anatomical left arm abducting outward usually moves rightward in image (larger x)
 */
function isTrackedArmMovingLaterally(upperBody: UpperBodyPoints, side: Side) {
  const { shoulder, elbow, wrist } = getTrackedPoints(upperBody, side);
  const shoulderCenterX = upperBody.MID_SHOULDER.x;
  const lateralMargin = 0.01;

  if (side === "right") {
    return (
      elbow.x <= shoulder.x + lateralMargin &&
      wrist.x <= elbow.x + 0.03 &&
      wrist.x <= shoulderCenterX + 0.02
    );
  }

  return (
    elbow.x >= shoulder.x - lateralMargin &&
    wrist.x >= elbow.x - 0.03 &&
    wrist.x >= shoulderCenterX - 0.02
  );
}

/**
 * Other arm should stay near rest, not lifting significantly.
 */
function isOtherArmRestingEnough(upperBody: UpperBodyPoints, side: Side) {
  const { otherShoulder, otherElbow, otherWrist } = getTrackedPoints(
    upperBody,
    side,
  );

  const otherElbowLift = otherShoulder.y - otherElbow.y;
  const otherWristLift = otherShoulder.y - otherWrist.y;

  return otherElbowLift < 0.04 && otherWristLift < 0.02;
}

/**
 * Arm by side start/end pose:
 * - elbow below shoulder
 * - wrist below elbow
 * - elbow near shoulder x
 * - wrist near elbow x
 */
function isArmAtSidePose(upperBody: UpperBodyPoints, side: Side) {
  const { shoulder, elbow, wrist } = getTrackedPoints(upperBody, side);

  const elbowBelowShoulder = elbow.y > shoulder.y + 0.04;
  const wristBelowElbow = wrist.y > elbow.y - 0.01;

  const elbowCloseToBody = abs(elbow.x - shoulder.x) < 0.08;
  const wristCloseToElbow = abs(wrist.x - elbow.x) < 0.08;

  return (
    elbowBelowShoulder &&
    wristBelowElbow &&
    elbowCloseToBody &&
    wristCloseToElbow
  );
}

export function validateShoulderAbductionPose(
  upperBody: UpperBodyPoints,
  side: Side,
): ExerciseValidity {
  const visible = isUpperBodyVisibleEnough(upperBody);
  if (!visible) {
    return {
      isValidForCounting: false,
      isFacingCamera: false,
      isUpperBodyVisible: false,
      isTrackedArmLateral: false,
      isOtherArmResting: false,
      isStartPose: false,
      isEndPose: false,
      message: "Keep your full upper body visible.",
    };
  }

  const facing = isFacingCameraEnough(upperBody);
  if (!facing) {
    return {
      isValidForCounting: false,
      isFacingCamera: false,
      isUpperBodyVisible: true,
      isTrackedArmLateral: false,
      isOtherArmResting: false,
      isStartPose: false,
      isEndPose: false,
      message: "Face the camera directly.",
    };
  }

  const lateral = isTrackedArmMovingLaterally(upperBody, side);
  if (!lateral) {
    return {
      isValidForCounting: false,
      isFacingCamera: true,
      isUpperBodyVisible: true,
      isTrackedArmLateral: false,
      isOtherArmResting: false,
      isStartPose: false,
      isEndPose: false,
      message: "Lift your arm out to the side, not across your body.",
    };
  }

  const otherResting = isOtherArmRestingEnough(upperBody, side);
  if (!otherResting) {
    return {
      isValidForCounting: false,
      isFacingCamera: true,
      isUpperBodyVisible: true,
      isTrackedArmLateral: true,
      isOtherArmResting: false,
      isStartPose: false,
      isEndPose: false,
      message: "Move only one arm at a time.",
    };
  }

  const atSide = isArmAtSidePose(upperBody, side);

  return {
    isValidForCounting: true,
    isFacingCamera: true,
    isUpperBodyVisible: true,
    isTrackedArmLateral: true,
    isOtherArmResting: true,
    isStartPose: atSide,
    isEndPose: atSide,
    message: null,
  };
}
