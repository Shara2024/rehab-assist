import { useRef } from "react";
import type { NormalizedLandmark } from "@mediapipe/pose";
import type { UsePoseOptions } from "@/features/mediapipe/types/poseTypes";
import { usePose } from "@/features/mediapipe/hooks/usePose";
import type { Side } from "@/features/rom/types/romTypes";

type Props = {
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  enabled: boolean;
  onResults?: UsePoseOptions["onResults"];
  className?: string;
  trackedSide?: Side;
  currentAngleDeg?: number | null;
  targetAngleDeg?: number;
  targetReached?: boolean;
};

const IDX = {
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
} as const;

const ALL_INDICES = Object.values(IDX);

const UPPER_BODY_CONNECTIONS: [number, number][] = [
  [IDX.LEFT_HIP, IDX.RIGHT_HIP],
  [IDX.LEFT_HIP, IDX.LEFT_SHOULDER],
  [IDX.RIGHT_HIP, IDX.RIGHT_SHOULDER],
  [IDX.LEFT_SHOULDER, IDX.RIGHT_SHOULDER],
  [IDX.LEFT_SHOULDER, IDX.LEFT_ELBOW],
  [IDX.LEFT_ELBOW, IDX.LEFT_WRIST],
  [IDX.RIGHT_SHOULDER, IDX.RIGHT_ELBOW],
  [IDX.RIGHT_ELBOW, IDX.RIGHT_WRIST],
];

const TRACKED_JOINTS: Record<Side, [number, number, number]> = {
  left: [IDX.LEFT_SHOULDER, IDX.LEFT_ELBOW, IDX.LEFT_WRIST],
  right: [IDX.RIGHT_SHOULDER, IDX.RIGHT_ELBOW, IDX.RIGHT_WRIST],
};

// ── EMA smoother ─────────────────────────────────────────────────────────────
// Alpha controls how much weight the newest raw frame gets vs the running average.
//   0.1 = very smooth, sluggish to real movement
//   0.35 = smooth with good responsiveness  ← sweet spot for physio tracking
//   0.7 = nearly raw, minimal smoothing
//
// Two-layer stabilisation: MediaPipe's own smoothLandmarks=true runs first
// inside the model, then our EMA runs on the already-smoothed output.
// The result is visually stable without noticeable lag on slow shoulder movements.
const EMA_ALPHA = 0.35;

type SmoothedLM = { x: number; y: number; z: number; visibility: number };
type SmoothedMap = Map<number, SmoothedLM>;

function applyEma(
  prev: SmoothedMap,
  raw: NormalizedLandmark[],
  indices: readonly number[],
): SmoothedMap {
  // Mutate in place — avoids allocating a new Map every frame
  for (const idx of indices) {
    const r = raw[idx];
    if (!r) continue;

    const p = prev.get(idx);
    if (!p) {
      prev.set(idx, {
        x: r.x,
        y: r.y,
        z: r.z,
        visibility: r.visibility ?? 0,
      });
    } else {
      const a = EMA_ALPHA;
      const b = 1 - a;
      p.x = a * r.x + b * p.x;
      p.y = a * r.y + b * p.y;
      p.z = a * r.z + b * p.z;
      p.visibility = a * (r.visibility ?? 0) + b * p.visibility;
    }
  }
  return prev;
}

function toCanvas(lm: SmoothedLM, w: number, h: number) {
  return { x: lm.x * w, y: lm.y * h };
}

export default function PoseOverlayCanvas({
  videoRef,
  enabled,
  onResults,
  className,
  trackedSide = "right",
  targetAngleDeg,
  targetReached = false,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  // Persists smoothed landmark positions across frames — mutated in place
  const smoothedRef = useRef<SmoothedMap>(new Map());

  usePose({
    videoRef,
    canvasRef,
    options: {
      enabled,
      fps: 15, // lower processing FPS to save CPU, since shoulder movements are slow. Test 20 FPS to find the sweet spot for smoothness vs CPU load.
      modelComplexity: 1,
      smoothLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
      onResults: (results) => {
        const canvas = canvasRef.current;
        if (!canvas) {
          onResults?.(results);
          return;
        }

        // Lazily cache 2d context once
        if (!ctxRef.current) {
          ctxRef.current =
            canvas.getContext("2d", { willReadFrequently: false }) ?? null;
        }
        const ctx = ctxRef.current;
        if (!ctx) {
          onResults?.(results);
          return;
        }

        const { width: cw, height: ch } = canvas;
        ctx.clearRect(0, 0, cw, ch);

        const raw = results.poseLandmarks;
        if (raw) {
          // Apply EMA to get stabilised positions
          applyEma(smoothedRef.current, raw, ALL_INDICES);
          const lms = smoothedRef.current;

          ctx.lineCap = "round";
          ctx.lineJoin = "round";

          // ── 1. Background skeleton — all upper-body joints, clearly visible ──
          ctx.save();

          // Bone connectors
          ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
          ctx.lineWidth = 5;
          for (const [a, b] of UPPER_BODY_CONNECTIONS) {
            const pa = lms.get(a);
            const pb = lms.get(b);
            if (!pa || !pb) continue;
            const ca = toCanvas(pa, cw, ch);
            const cb = toCanvas(pb, cw, ch);
            ctx.beginPath();
            ctx.moveTo(ca.x, ca.y);
            ctx.lineTo(cb.x, cb.y);
            ctx.stroke();
          }

          // Joint dots
          for (const idx of ALL_INDICES) {
            const lm = lms.get(idx);
            if (!lm) continue;
            const p = toCanvas(lm, cw, ch);

            // White ring
            ctx.beginPath();
            ctx.fillStyle = "rgba(255,255,255,0.9)";
            ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
            ctx.fill();

            // Teal inner dot
            ctx.beginPath();
            ctx.fillStyle = "rgba(20,184,166,0.85)";
            ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore();

          // ── 2. Tracked arm — bright, thick, with glow pass ──
          const [si, ei, wi] = TRACKED_JOINTS[trackedSide];
          const shoulder = lms.get(si);
          const elbow = lms.get(ei);
          const wrist = lms.get(wi);

          if (shoulder && elbow && wrist) {
            const s = toCanvas(shoulder, cw, ch);
            const e = toCanvas(elbow, cw, ch);
            const w = toCanvas(wrist, cw, ch);

            const armColor = targetReached ? "#22c55e" : "#facc15";
            const glowColor = targetReached
              ? "rgba(34,197,94,0.22)"
              : "rgba(250,204,21,0.22)";

            ctx.save();
            ctx.lineCap = "round";
            ctx.lineJoin = "round";

            // Glow pass — wide, soft, same path
            ctx.lineWidth = 22;
            ctx.strokeStyle = glowColor;
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(e.x, e.y);
            ctx.lineTo(w.x, w.y);
            ctx.stroke();

            // Main stroke
            ctx.lineWidth = 11;
            ctx.strokeStyle = armColor;
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(e.x, e.y);
            ctx.lineTo(w.x, w.y);
            ctx.stroke();

            // Joint circles: white outer ring + coloured fill
            for (const p of [s, e, w]) {
              ctx.beginPath();
              ctx.fillStyle = "#ffffff";
              ctx.arc(p.x, p.y, 14, 0, Math.PI * 2);
              ctx.fill();

              ctx.beginPath();
              ctx.fillStyle = armColor;
              ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
              ctx.fill();
            }

            ctx.restore();
          }

          // ── 3. Target badge ──
          if (targetAngleDeg != null) {
            ctx.save();
            const bx = 16,
              by = 16,
              bw = 152,
              bh = 38;
            ctx.beginPath();
            ctx.roundRect(bx, by, bw, bh, 10);
            ctx.fillStyle = "rgba(255,255,255,0.92)";
            ctx.fill();
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = "#14b8a6";
            ctx.stroke();
            ctx.fillStyle = "#0f172a";
            ctx.font = "bold 15px sans-serif";
            ctx.textBaseline = "middle";
            ctx.fillText(
              `Target: ${targetAngleDeg}°`,
              bx + 13,
              by + bh / 2 + 1,
            );
            ctx.restore();
          }
        }

        // Forward to parent — ROM calc + rep counting happens here
        onResults?.(results);
      },
    },
  });

  return (
    <canvas
      ref={canvasRef}
      className={className ?? "absolute inset-0 w-full h-full"}
    />
  );
}
