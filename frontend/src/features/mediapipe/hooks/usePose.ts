import { useEffect, useRef } from "react";
import { Pose } from "@mediapipe/pose";
import type { PoseResults, UsePoseOptions } from "../types/poseTypes";
import { cdnLocateFile } from "@/features/mediapipe/utils/cdnLocateFile";

type UsePoseArgs = {
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
  options: UsePoseOptions;
};

export function usePose({ videoRef, canvasRef, options }: UsePoseArgs) {
  const poseRef = useRef<Pose | null>(null);
  const rafRef = useRef<number | null>(null);

  // ── KEY FIX 1: Keep a stable ref to onResults so it never appears in the
  // effect dependency array. Without this, every render (caused by setState
  // in the callback) creates a new onResults function → new dependency →
  // effect tears down and rebuilds the Pose instance from scratch, including
  // re-downloading the WASM model. That's what was causing the full stall.
  const onResultsRef = useRef(options.onResults);
  useEffect(() => {
    onResultsRef.current = options.onResults;
  });

  // Stable refs for pose config — same idea, avoids rebuild on prop changes
  const configRef = useRef({
    modelComplexity: options.modelComplexity ?? 0,
    smoothLandmarks: options.smoothLandmarks ?? true,
    minDetectionConfidence: options.minDetectionConfidence ?? 0.5,
    minTrackingConfidence: options.minTrackingConfidence ?? 0.5,
    fps: options.fps ?? 30,
  });

  const { enabled } = options;

  useEffect(() => {
    if (!enabled) return;
    if (!videoRef?.current) return;
    if (!canvasRef?.current) return;

    const {
      modelComplexity,
      smoothLandmarks,
      minDetectionConfidence,
      minTrackingConfidence,
      fps,
    } = configRef.current;

    const pose = new Pose({
      locateFile: (file) => cdnLocateFile("pose", file),
    });

    pose.setOptions({
      modelComplexity,
      smoothLandmarks,
      enableSegmentation: false,
      smoothSegmentation: false,
      minDetectionConfidence,
      minTrackingConfidence,
    });

    // ── KEY FIX 2: Backpressure flag — never send a new frame while MediaPipe
    // is still processing the previous one. Without this, frames pile up in
    // the internal queue and lag grows continuously throughout the session.
    let processing = false;

    pose.onResults((results: PoseResults) => {
      // Mark processing done FIRST so the loop can send the next frame
      processing = false;

      const v = videoRef?.current;
      const c = canvasRef?.current;
      if (!v || !c) return;

      const vw = v.videoWidth || 0;
      const vh = v.videoHeight || 0;
      if (vw === 0 || vh === 0) return;

      // Resize canvas to match video once (cheap after first frame)
      if (c.width !== vw) c.width = vw;
      if (c.height !== vh) c.height = vh;

      // Always call through the ref — never the closure
      onResultsRef.current?.(results);
    });

    poseRef.current = pose;

    // ── KEY FIX 3: Compute the minimum interval once, outside the loop.
    // The previous throttleRaf() was called inside the loop body on every
    // RAF tick, creating a new closure and timestamp comparison each time.
    const frameIntervalMs = 1000 / fps;
    let lastSentAt = 0;
    let cancelled = false;

    const loop = async () => {
      if (cancelled) return;

      const v = videoRef?.current;

      if (
        v &&
        !processing &&
        v.readyState >= 2 &&
        v.videoWidth > 0 &&
        v.videoHeight > 0
      ) {
        const now = performance.now();
        if (now - lastSentAt >= frameIntervalMs) {
          lastSentAt = now;
          processing = true;
          try {
            await pose.send({ image: v });
          } catch {
            // Frame send failed (e.g. video paused mid-frame) — unblock
            processing = false;
          }
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      poseRef.current?.close();
      poseRef.current = null;
    };

    // ── Only rebuild when enabled/videoRef/canvasRef change — NOT on every
    // options change. Config and callback are read through stable refs above.
  }, [enabled, videoRef, canvasRef]); // eslint-disable-line react-hooks/exhaustive-deps
}
