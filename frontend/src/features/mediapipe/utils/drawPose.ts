import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { POSE_CONNECTIONS } from "@mediapipe/pose";
import type { NormalizedLandmarkList } from "@mediapipe/pose";

type DrawPoseArgs = {
  ctx: CanvasRenderingContext2D;
  landmarks: NormalizedLandmarkList;
};

export function drawPose({ ctx, landmarks }: DrawPoseArgs) {
  // Connectors first, then points
  drawConnectors(ctx, landmarks, POSE_CONNECTIONS);
  drawLandmarks(ctx, landmarks);
}
