import type {
  CompletedRep,
  RepPhase,
  SessionRomSummary,
} from "@/features/rom/types/repTypes";
import type {
  RomMetrics,
  UpperBodyPoints,
} from "@/features/rom/types/romTypes";

const REDUCED_NAMES = [
  "LS",
  "RS",
  "LE",
  "RE",
  "LW",
  "RW",
  "LH",
  "RH",
  "MID_HIP",
  "MID_SHOULDER",
] as const;

export function downloadCsv(filename: string, csvText: string) {
  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function buildUpperBodyHeader() {
  const cols: string[] = [
    "timestamp_ms",
    "frame",
    "shoulder_abduction_deg",
    "elbow_flexion_deg",
    "rep_count",
    "rep_phase",
    "rep_current_peak_deg",
    "target_angle_deg",
    "target_reached_now",
  ];

  REDUCED_NAMES.forEach((j) => {
    cols.push(`${j}_x`, `${j}_y`, `${j}_z`);
  });

  return cols.join(",");
}

export function buildUpperBodyToRow(
  ts: number,
  frame: number,
  ub: UpperBodyPoints,
  rom: RomMetrics | null,
  repCount: number,
  repPhase: RepPhase,
  repCurrentPeakDeg: number | null,
  targetAngleDeg: number,
  targetReachedNow: boolean,
) {
  const cols: (string | number)[] = [
    ts,
    frame,
    rom?.shoulderAbductionDeg != null
      ? rom.shoulderAbductionDeg.toFixed(2)
      : "",
    rom?.elbowFlexionDeg != null ? rom.elbowFlexionDeg.toFixed(2) : "",
    repCount,
    repPhase,
    repCurrentPeakDeg != null ? repCurrentPeakDeg.toFixed(2) : "",
    targetAngleDeg,
    targetReachedNow ? 1 : 0,
  ];

  for (const key of REDUCED_NAMES) {
    const p = ub[key];
    cols.push(p?.x ?? "", p?.y ?? "", p?.z ?? "");
  }

  return cols.join(",");
}

export function buildRepSummaryCsv(reps: CompletedRep[]) {
  const header = [
    "rep_number",
    "peak_abduction_deg",
    "target_met",
    "duration_ms",
    "started_at_ms",
    "peak_at_ms",
    "ended_at_ms",
  ].join(",");

  const rows = reps.map((r) =>
    [
      r.repNumber,
      r.peakAbductionDeg.toFixed(2),
      r.targetMet ? 1 : 0,
      r.durationMs,
      r.startedAtMs,
      r.peakAtMs,
      r.endedAtMs,
    ].join(","),
  );

  return [header, ...rows].join("\n");
}

export function buildSessionSummaryCsv(summary: SessionRomSummary) {
  const header = [
    "total_reps_completed",
    "target_reps",
    "target_angle_deg",
    "reps_meeting_target",
    "target_achievement_percent",
    "average_peak_abduction_deg",
    "best_peak_abduction_deg",
    "average_rep_duration_ms",
    "session_duration_ms",
  ].join(",");

  const row = [
    summary.totalRepsCompleted,
    summary.targetReps,
    summary.targetAngleDeg,
    summary.repsMeetingTarget,
    summary.targetAchievementPercent.toFixed(2),
    summary.averagePeakAbductionDeg != null
      ? summary.averagePeakAbductionDeg.toFixed(2)
      : "",
    summary.bestPeakAbductionDeg != null
      ? summary.bestPeakAbductionDeg.toFixed(2)
      : "",
    summary.averageRepDurationMs != null
      ? summary.averageRepDurationMs.toFixed(2)
      : "",
    summary.sessionDurationMs,
  ].join(",");

  return [header, row].join("\n");
}