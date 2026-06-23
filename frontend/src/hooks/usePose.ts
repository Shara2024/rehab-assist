import { useEffect, useRef } from "react";
import { Pose } from "@mediapipe/pose";
import { drawLandmarks, drawConnectors } from "@mediapipe/drawing_utils";
import type { Results } from "@mediapipe/pose";

interface UsePoseProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  enabled: boolean;
  onResults?: (results: Results) => void;
}

export function usePose({
  videoRef,
  canvasRef,
  enabled,
  onResults,
}: UsePoseProps) {
  const poseRef = useRef<Pose | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (!videoRef.current || !canvasRef.current) return;

    const pose = new Pose({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    pose.onResults((results: Results) => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      canvas.width = videoRef.current!.videoWidth;
      canvas.height = videoRef.current!.videoHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (results.poseLandmarks) {
        drawConnectors(ctx, results.poseLandmarks, Pose.POSE_CONNECTIONS);
        drawLandmarks(ctx, results.poseLandmarks);
      }

      onResults?.(results);
    });

    poseRef.current = pose;

    let animationId: number;

    const detect = async () => {
      if (!videoRef.current) return;

      await pose.send({ image: videoRef.current });
      animationId = requestAnimationFrame(detect);
    };

    detect();

    return () => {
      cancelAnimationFrame(animationId);
      pose.close();
    };
  }, [enabled, videoRef, canvasRef, onResults]);
}
