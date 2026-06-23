import type { Results } from "@mediapipe/pose";

export type PoseResults = Results;

export type UsePoseOptions = {
  enabled: boolean;
  modelComplexity?: 0 | 1 | 2;
  smoothLandmarks?: boolean;
  minDetectionConfidence?: number;
  minTrackingConfidence?: number;
  fps?: number; // processing FPS (not camera FPS)
  onResults?: (results: PoseResults) => void;
};
