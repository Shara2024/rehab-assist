export type RepPhase =
  | "NO_TRACK"
  | "AT_REST"
  | "LIFTING"
  | "AT_TOP"
  | "LOWERING";

export type CompletedRep = {
  repNumber: number;
  peakAbductionDeg: number;
  startedAtMs: number;
  peakAtMs: number;
  endedAtMs: number;
  durationMs: number;
  targetMet: boolean;
  visibilityScore: number;
};

export type RepDetectorConfig = {
  restEnterDeg: number;
  restExitDeg: number;
  minExcursionDeg: number;
  peakDropDeg: number;
  minRepDurationMs: number;
  maxRepDurationMs: number;
  targetAngleDeg: number;
};

export type RepFrameResult = {
  phase: RepPhase;
  repCount: number;
  justCounted: boolean;
  currentPeakDeg: number | null;
  lastCompletedRep: CompletedRep | null;
};

export type SessionRomSummary = {
  totalRepsCompleted: number;
  targetReps: number;
  targetAngleDeg: number;
  repsMeetingTarget: number;
  targetAchievementPercent: number;
  averagePeakAbductionDeg: number | null;
  bestPeakAbductionDeg: number | null;
  averageRepDurationMs: number | null;
  sessionDurationMs: number;
};