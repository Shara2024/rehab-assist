import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ClipboardList, Camera, X, Play, CheckCircle2 } from "lucide-react";
import PoseOverlayCanvas from "@/features/mediapipe/components/PoseOverlayCanvas";
import { extractUpperBody } from "@/features/mediapipe/utils/upperBody";

import type { SessionStage } from "@/features/patient/session/types/sessionType";
import { useCamera } from "@/features/patient/session/hooks/useCamera";
import { useCountdown } from "@/features/patient/session/hooks/useCountdown";
import { useTimer } from "@/features/patient/session/hooks/useTimer";
import CameraView from "@/features/patient/session/components/CameraView";
import { CountdownOverlay } from "@/features/patient/session/components/CountdownOverlay";

import type { UpperBodyPoints, Side } from "@/features/rom/types/romTypes";
import ExerciseDialog from "@/components/shared/ExerciseDialog";
import type { ExerciseDetails } from "@/components/shared/ExerciseDialog";
import { computeShoulderRom } from "@/features/rom/utils/shoulderAbduction";
import { ShoulderAbductionRepCounter } from "@/features/rom/utils/repCounter";
import type {
  CompletedRep,
  RepPhase,
  SessionRomSummary,
} from "@/features/rom/types/repTypes";
import SessionReportModal from "@/features/patient/session/components/SessionReportModal";
import {
  downloadCsv,
  buildUpperBodyHeader,
  buildUpperBodyToRow,
  buildRepSummaryCsv,
  buildSessionSummaryCsv,
} from "@/features/patient/session/utils/sessionCSV";
import { validateShoulderAbductionPose } from "@/features/rom/utils/exerciseValidation";
import { useSessionRecorder } from "@/features/patient/session/hooks/useSessionRecorder";

const EXERCISES: Record<string, ExerciseDetails> = {
  "1": {
    id: "1",
    title: "Shoulder Abduction",
    bodyPart: "Upper limb",
    side: "right",
    imageUrl: "/image.png",
    steps: [
      "Sit upright facing the camera.",
      "Keep your back straight and shoulders relaxed.",
      "Hold a light weight (or no weight if instructed) in your hand.",
      "Keep your arm resting by your side with your palm facing inward.",
      "Slowly lift your arm straight out to the side until it is level with your shoulder.",
      "Hold for a moment, then slowly lower it back down.",
      "Return to starting position.",
    ],
    safetyTips: ["Stop if you feel pain.", "Move slowly and smoothly."],
  },
};

const DUMMY_SESSION_PLAN = {
  performingArm: "right" as Side,
  targetAngleDeg: 90,
  targetRepCount: 5,
};

const UI_COMMIT_INTERVAL_MS = 80;

function getMainFeedbackMessage(args: {
  shoulderVisibleEnough: boolean;
  currentAngleDeg: number | null;
  targetAngleDeg: number;
  repPhase: RepPhase;
  repCount: number;
  targetRepCount: number;
}) {
  const {
    shoulderVisibleEnough,
    currentAngleDeg,
    targetAngleDeg,
    repPhase,
    repCount,
    targetRepCount,
  } = args;

  if (!shoulderVisibleEnough) {
    return "Move closer and keep your full arm visible.";
  }
  if (repCount >= targetRepCount) {
    return "Great job. Session completed.";
  }
  if (repPhase === "AT_REST") {
    return `Start with your ${DUMMY_SESSION_PLAN.performingArm} arm relaxed by your side.`;
  }
  if (currentAngleDeg != null && currentAngleDeg >= targetAngleDeg) {
    return "Good. You reached the target. Lower with control.";
  }
  if (repPhase === "LIFTING") {
    return `Raise your ${DUMMY_SESSION_PLAN.performingArm} arm higher, and keep your back straight.`;
  }
  if (repPhase === "AT_TOP" || repPhase === "LOWERING") {
    return `Lower your ${DUMMY_SESSION_PLAN.performingArm} arm slowly and stay upright.`;
  }
  return "Move smoothly and keep your torso straight.";
}

type PatientReportState = {
  open: boolean;
  repSummary: CompletedRep[];
  sessionSummary: SessionRomSummary | null;
  liveCsvText: string;
  repCsvText: string;
  sessionCsvText: string;
  videoBlob: Blob | null;
};

type LiveSnapshot = {
  shoulderVisible: boolean;
  currentAngle: number | null;
  repCount: number;
  repPhase: RepPhase;
  targetReached: boolean;
};

export default function PatientSessionModule() {
  const [searchParams] = useSearchParams();
  const exerciseId = searchParams.get("exerciseId") ?? "1";
  const exercise = EXERCISES[exerciseId] ?? EXERCISES["1"];

  const [stage, setStage] = useState<SessionStage>("SETUP");
  const [accepted, setAccepted] = useState(false);
  const [exerciseOpen, setExerciseOpen] = useState(false);

  const [reportState, setReportState] = useState<PatientReportState>({
    open: false,
    repSummary: [],
    sessionSummary: null,
    liveCsvText: "",
    repCsvText: "",
    sessionCsvText: "",
    videoBlob: null,
  });

  const displayAngleRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const sessionStartedAtRef = useRef<number | null>(null);
  const sessionEndedRef = useRef(false);

  const trackedSide: Side = DUMMY_SESSION_PLAN.performingArm;

  const [shoulderVisibleUi, setShoulderVisibleUi] = useState(false);
  const [repCountUi, setRepCountUi] = useState(0);
  const [repPhaseUi, setRepPhaseUi] = useState<RepPhase>("AT_REST");
  const [currentAngleUi, setCurrentAngleUi] = useState<number | null>(null);
  const [targetReachedUi, setTargetReachedUi] = useState(false);
  const [formMessageUi, setFormMessageUi] = useState<string | null>(null);

  const liveRef = useRef<LiveSnapshot>({
    shoulderVisible: false,
    currentAngle: null,
    repCount: 0,
    repPhase: "AT_REST",
    targetReached: false,
  });
  const lastCommitAtRef = useRef(0);
  const lastPhaseRef = useRef<RepPhase>("AT_REST");
  const lastRepCountRef = useRef(0);

  const repCounterRef = useRef(
    new ShoulderAbductionRepCounter({
      restEnterDeg: 28,
      restExitDeg: 30,
      minExcursionDeg: 15,
      peakDropDeg: 8,
      minRepDurationMs: 700,
      maxRepDurationMs: 8000,
      targetAngleDeg: DUMMY_SESSION_PLAN.targetAngleDeg,
    }),
  );

  const csvRowsRef = useRef<string[]>([]);
  const frameRef = useRef(0);
  const recordingRef = useRef(false);

  const timer = useTimer();
  const { stream, error, start: startCamera, stop: stopCamera } = useCamera();
  const {
    error: recorderError,
    startRecording,
    stopRecording,
    resetRecording,
    downloadRecording,
  } = useSessionRecorder();

  const {
    value: countdown,
    running,
    start: startCountdown,
    setRunning,
    reset,
  } = useCountdown(5);

  const commitUi = useCallback((nextFormMessage?: string | null) => {
    const s = liveRef.current;

    const nextDisplayAngle = s.currentAngle;
    if (nextDisplayAngle != null) {
      if (displayAngleRef.current == null) {
        displayAngleRef.current = nextDisplayAngle;
      } else {
        displayAngleRef.current =
          displayAngleRef.current * 0.7 + nextDisplayAngle * 0.3;
      }
    } else {
      displayAngleRef.current = null;
    }

    setShoulderVisibleUi(s.shoulderVisible);
    setCurrentAngleUi(displayAngleRef.current);
    setRepCountUi(s.repCount);
    setRepPhaseUi(s.repPhase);
    setTargetReachedUi(s.targetReached);
    setFormMessageUi(nextFormMessage ?? null);
  }, []);

  const resetLiveState = useCallback(() => {
    liveRef.current = {
      shoulderVisible: false,
      currentAngle: null,
      repCount: 0,
      repPhase: "AT_REST",
      targetReached: false,
    };
    lastCommitAtRef.current = 0;
    lastPhaseRef.current = "AT_REST";
    lastRepCountRef.current = 0;
    displayAngleRef.current = null;

    setShoulderVisibleUi(false);
    setCurrentAngleUi(null);
    setRepCountUi(0);
    setRepPhaseUi("AT_REST");
    setTargetReachedUi(false);
    setFormMessageUi(null);
  }, []);

  const finalizeSession = useCallback((videoBlob: Blob | null) => {
    const sessionDurationMs = sessionStartedAtRef.current
      ? Date.now() - sessionStartedAtRef.current
      : 0;

    const completedReps = repCounterRef.current.getCompletedReps();
    const sessionSummary = repCounterRef.current.getSessionSummary(
      DUMMY_SESSION_PLAN.targetRepCount,
      sessionDurationMs,
    );

    setReportState({
      open: true,
      repSummary: completedReps,
      sessionSummary,
      liveCsvText: csvRowsRef.current.join("\n"),
      repCsvText: buildRepSummaryCsv(completedReps),
      sessionCsvText: buildSessionSummaryCsv(sessionSummary),
      videoBlob,
    });
  }, []);

  const endSession = useCallback(async () => {
    if (sessionEndedRef.current) return;
    sessionEndedRef.current = true;
    recordingRef.current = false;

    const videoBlob = await stopRecording();

    stopCamera();
    reset();
    timer.reset();
    finalizeSession(videoBlob);
    setStage("SETUP");
    setAccepted(false);

    resetLiveState();
  }, [
    finalizeSession,
    reset,
    resetLiveState,
    stopCamera,
    stopRecording,
    timer,
  ]);

  const beginLiveSession = useCallback(() => {
    resetRecording();

    csvRowsRef.current = [buildUpperBodyHeader()];
    frameRef.current = 0;
    recordingRef.current = true;
    sessionEndedRef.current = false;
    sessionStartedAtRef.current = Date.now();

    repCounterRef.current.reset();
    resetLiveState();

    setRunning(false);
    setStage("LIVE");
    timer.start();

    if (stream) {
      startRecording(stream);
    }
  }, [
    resetLiveState,
    resetRecording,
    setRunning,
    startRecording,
    stream,
    timer,
  ]);

  const mainFeedbackMessage = useMemo(() => {
    if (formMessageUi) return formMessageUi;

    return getMainFeedbackMessage({
      shoulderVisibleEnough: shoulderVisibleUi,
      currentAngleDeg: currentAngleUi,
      targetAngleDeg: DUMMY_SESSION_PLAN.targetAngleDeg,
      repPhase: repPhaseUi,
      repCount: repCountUi,
      targetRepCount: DUMMY_SESSION_PLAN.targetRepCount,
    });
  }, [
    formMessageUi,
    shoulderVisibleUi,
    currentAngleUi,
    repPhaseUi,
    repCountUi,
  ]);

  const handleOpenCamera = async () => {
    if (stream) return;
    await startCamera();
  };

  const handleStartExercise = () => {
    if (!accepted || !stream) return;
    setStage("COUNTDOWN");
    startCountdown();
  };

  useEffect(() => {
    if (!running) return;
    if (countdown > 0) return;
    if (stage !== "COUNTDOWN") return;

    const id = window.setTimeout(() => {
      beginLiveSession();
    }, 0);

    return () => window.clearTimeout(id);
  }, [beginLiveSession, countdown, running, stage]);

  const handleDownloadAll = () => {
    if (reportState.liveCsvText) {
      downloadCsv("S01_Joint_Positions.csv", reportState.liveCsvText);
    }
    // if (reportState.repCsvText) {
    //   downloadCsv("rom_rep_summary.csv", reportState.repCsvText);
    // }
    // if (reportState.sessionCsvText) {
    //   downloadCsv("rom_session_summary.csv", reportState.sessionCsvText);
    // }
    if (reportState.videoBlob) {
      downloadRecording("s01_video.webm");
    }
  };

  if (stage === "COUNTDOWN" || stage === "LIVE") {
    const romPercent = Math.min(
      100,
      ((currentAngleUi ?? 0) / DUMMY_SESSION_PLAN.targetAngleDeg) * 100,
    );

    return (
      <div className="fixed inset-0 bg-black z-50">
        <div className="absolute inset-0">
          <div className="relative w-full h-full">
            <CameraView
              ref={videoRef}
              stream={stream}
              className="absolute inset-0 w-full h-full object-cover"
            />

            <PoseOverlayCanvas
              videoRef={videoRef}
              enabled={stage === "LIVE"}
              className="absolute inset-0 w-full h-full pointer-events-none"
              trackedSide={trackedSide}
              targetAngleDeg={DUMMY_SESSION_PLAN.targetAngleDeg}
              targetReached={targetReachedUi}
              onResults={(results) => {
                if (!recordingRef.current) return;

                const lms = results?.poseLandmarks;
                if (!lms) return;

                const ub = extractUpperBody(lms);
                if (!ub) {
                  liveRef.current = {
                    shoulderVisible: false,
                    currentAngle: null,
                    repCount: repCounterRef.current.getRepCount(),
                    repPhase: "NO_TRACK",
                    targetReached: false,
                  };

                  const now = performance.now();
                  if (now - lastCommitAtRef.current >= UI_COMMIT_INTERVAL_MS) {
                    lastCommitAtRef.current = now;
                    commitUi("Keep your full upper body visible.");
                  }
                  return;
                }

                const upperBody = ub as UpperBodyPoints;
                const validity = validateShoulderAbductionPose(
                  upperBody,
                  trackedSide,
                );

                if (!validity.isValidForCounting) {
                  liveRef.current = {
                    shoulderVisible: validity.isUpperBodyVisible,
                    currentAngle: null,
                    repCount: repCounterRef.current.getRepCount(),
                    repPhase: "NO_TRACK",
                    targetReached: false,
                  };

                  const now = performance.now();
                  if (now - lastCommitAtRef.current >= UI_COMMIT_INTERVAL_MS) {
                    lastCommitAtRef.current = now;
                    commitUi(validity.message ?? "Adjust your position.");
                  }
                  return;
                }

                const rom = computeShoulderRom(upperBody, trackedSide);
                const currentAngle = rom.shoulderAbductionDeg ?? null;

                const ts = Date.now();
                const frame = frameRef.current++;
                const repResult = repCounterRef.current.update(rom, ts);

                const targetReached =
                  currentAngle != null &&
                  currentAngle >= DUMMY_SESSION_PLAN.targetAngleDeg;

                liveRef.current = {
                  shoulderVisible: true,
                  currentAngle,
                  repCount: repResult.repCount,
                  repPhase: repResult.phase,
                  targetReached,
                };

                csvRowsRef.current.push(
                  buildUpperBodyToRow(
                    ts,
                    frame,
                    upperBody,
                    rom,
                    repResult.repCount,
                    repResult.phase,
                    repResult.currentPeakDeg,
                    DUMMY_SESSION_PLAN.targetAngleDeg,
                    targetReached,
                  ),
                );

                const now = performance.now();
                const phaseChanged = repResult.phase !== lastPhaseRef.current;
                const repCountChanged =
                  repResult.repCount !== lastRepCountRef.current;
                const intervalElapsed =
                  now - lastCommitAtRef.current >= UI_COMMIT_INTERVAL_MS;

                if (
                  repResult.justCounted ||
                  repCountChanged ||
                  phaseChanged ||
                  intervalElapsed
                ) {
                  lastCommitAtRef.current = now;
                  lastPhaseRef.current = repResult.phase;
                  lastRepCountRef.current = repResult.repCount;
                  commitUi(null);
                }

                if (
                  repResult.repCount >= DUMMY_SESSION_PLAN.targetRepCount &&
                  !sessionEndedRef.current
                ) {
                  void endSession();
                }
              }}
            />
          </div>
        </div>

        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 py-4 bg-gradient-to-b from-black/70 to-transparent z-10">
          <div className="flex items-center gap-3">
            {stage === "LIVE" && (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
            )}
            <span className="text-white text-3xl font-bold tabular-nums tracking-wide">
              {timer.formatted}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setExerciseOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 text-black text-sm backdrop-blur transition"
            >
              <ClipboardList className="size-4" />
              Guide
            </button>
            <button
              onClick={() => {
                void endSession();
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-400/90 hover:bg-red-400 text-black text-sm backdrop-blur transition"
            >
              <X className="size-4" />
              End
            </button>
          </div>
        </div>

        {stage === "LIVE" && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-3 z-10">
            <span
              className="text-white/40 text-[10px] tracking-widest mb-1"
              style={{
                writingMode: "vertical-rl",
                transform: "rotate(180deg)",
              }}
            >
              REPS
            </span>

            {Array.from(
              { length: DUMMY_SESSION_PLAN.targetRepCount },
              (_, i) => DUMMY_SESSION_PLAN.targetRepCount - i,
            ).map((repNum) => {
              const isDone = repNum <= repCountUi;
              const isCurrent = repNum === repCountUi + 1;
              return (
                <div
                  key={repNum}
                  className={`flex items-center justify-center rounded-full font-bold transition-all duration-300 select-none
                    ${
                      isDone
                        ? "w-12 h-12 bg-teal-900 border-2 border-teal-600 text-teal-300 text-base"
                        : isCurrent
                          ? "w-14 h-14 bg-teal-600 border-[3px] border-teal-300 text-white text-lg shadow-[0_0_0_7px_rgba(20,184,166,0.22)]"
                          : "w-12 h-12 border-2 border-white/20 text-white/25 text-base bg-white/5"
                    }`}
                >
                  {repNum}
                </div>
              );
            })}

            <span className="text-white/40 text-[11px] mt-1 tabular-nums">
              {repCountUi}/{DUMMY_SESSION_PLAN.targetRepCount}
            </span>
          </div>
        )}

        {stage === "LIVE" && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 z-10">
            <span className="text-white/50 text-[11px] tracking-widest uppercase">
              ROM
            </span>
            <span className="text-white text-5xl font-bold tabular-nums leading-none mt-1">
              {currentAngleUi != null ? `${Math.round(currentAngleUi)}°` : "--"}
            </span>
            <div className="w-px h-4 bg-white/20 my-1" />
            <div className="mt-3 w-2 h-24 bg-white/10 rounded-full overflow-hidden relative">
              <div
                className="absolute bottom-0 left-0 right-0 bg-teal-500 rounded-full transition-all duration-150"
                style={{ height: `${romPercent}%` }}
              />
            </div>
            <span className="text-white/40 text-[11px] mt-1 tabular-nums">
              {Math.round(romPercent)}%
            </span>
          </div>
        )}

        {stage === "LIVE" && (
          <div className="absolute bottom-7 left-24 right-24 z-10">
            <div className="rounded-[22px] border-4 border-teal-400 bg-white px-8 py-5 shadow-[0_0_32px_rgba(20,184,166,0.45)]">
              <p className="text-center text-[22px] md:text-[26px] font-semibold text-slate-900 leading-snug">
                {mainFeedbackMessage}
              </p>
            </div>
          </div>
        )}

        <CountdownOverlay value={countdown} show={stage === "COUNTDOWN"} />

        <ExerciseDialog
          open={exerciseOpen}
          onOpenChange={setExerciseOpen}
          exercise={exercise}
        />
      </div>
    );
  }

  return (
    <div className="bg-slate-50 font-sans flex-1 min-h-0 flex flex-col overflow-hidden">
      <div className="border-b border-slate-200 bg-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">
            {exercise.title}
          </h1>
        </div>
        <Button
          onClick={() => setExerciseOpen(true)}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-2 transition bg-white"
        >
          <ClipboardList className="size-4" />
          Exercise guide
        </Button>
      </div>

      <div className="mx-auto px-6 py-8 grid lg:grid-cols-[1fr_2fr] gap-6 items-start flex-1 min-h-0">
        <div className="space-y-4 h-full overflow-auto pr-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-teal-50 text-teal-700 text-xs font-semibold">
                  1
                </span>
                <span className="text-sm font-medium text-slate-800">
                  Position your camera
                </span>
              </div>

              {stream ? (
                <span className="text-xs text-teal-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="size-3.5" /> Active
                </span>
              ) : (
                <Button
                  onClick={handleOpenCamera}
                  className="flex items-center gap-1 text-sm bg-teal-600 hover:bg-teal-700 text-black px-4 py-1.5 rounded-lg transition font-medium animate-pulse"
                >
                  <Camera className="size-3" />
                  Open camera
                </Button>
              )}
            </div>

            <div className="px-5 py-4 grid grid-cols-2 gap-2">
              {[
                "Stay in a well-lit environment",
                "Keep upper body fully visible",
                "Sit upright facing the camera",
                "Maintain a comfortable distance",
              ].map((tip) => (
                <div
                  key={tip}
                  className="flex items-start gap-2 text-xs text-slate-500 bg-slate-50 rounded-lg p-2.5"
                >
                  <span className="mt-0.5 w-1 h-1 rounded-full bg-teal-400 flex-shrink-0" />
                  {tip}
                </div>
              ))}
            </div>

            {stream && (
              <div className="px-5 pb-4 flex justify-end">
                <Button
                  onClick={stopCamera}
                  className="text-xs text-slate-400 hover:text-red-500 transition"
                >
                  Close camera
                </Button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4">
            <div className="flex items-center gap-3 mb-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-teal-50 text-teal-700 text-xs font-semibold">
                2
              </span>
              <span className="text-sm font-medium text-slate-800">
                Confirm you're ready
              </span>
            </div>

            <button
              onClick={() => setAccepted((v) => !v)}
              className="flex items-start gap-3 w-full text-left group"
            >
              <span
                className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border transition flex items-center justify-center ${
                  accepted
                    ? "bg-teal-600 border-teal-600"
                    : "border-slate-300 group-hover:border-teal-400 bg-white"
                }`}
              >
                {accepted && (
                  <svg
                    viewBox="0 0 10 8"
                    fill="none"
                    className="w-2.5 h-2.5"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1 3.5L3.8 6.5L9 1"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              <span className="text-sm text-slate-600 leading-relaxed">
                I have read and understood the setup instructions, and my camera
                is properly positioned.
              </span>
            </button>
          </div>

          <Button
            disabled={!accepted || !stream}
            onClick={handleStartExercise}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition
              bg-teal-600 text-black hover:bg-teal-700
              disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-teal-600"
          >
            <Play className="size-4 fill-black" />
            Begin session
          </Button>

          {error && (
            <Alert variant="destructive" className="rounded-xl">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {recorderError && (
            <Alert variant="destructive" className="rounded-xl">
              <AlertDescription>{recorderError}</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Preview</span>
            {stream && (
              <span className="flex items-center gap-1.5 text-xs text-teal-600 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                Live
              </span>
            )}
          </div>

          <div className="flex-1 w-full bg-slate-900 min-h-0">
            {stream ? (
              <CameraView
                stream={stream}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-500">
                <Camera className="size-8 opacity-30" />
                <span className="text-xs">Camera not active</span>
              </div>
            )}
          </div>

          <div className="px-4 py-3 bg-teal-50 border-t border-teal-100">
            <p className="text-xs text-teal-700 text-center">
              Ensure your full upper body is visible before starting
            </p>
          </div>
        </div>
      </div>

      {reportState.open && reportState.sessionSummary && (
        <SessionReportModal
          open={reportState.open}
          repSummary={reportState.repSummary}
          sessionSummary={reportState.sessionSummary}
          onClose={() => setReportState((prev) => ({ ...prev, open: false }))}
          onDownloadAll={handleDownloadAll}
        />
      )}

      <ExerciseDialog
        open={exerciseOpen}
        onOpenChange={setExerciseOpen}
        exercise={exercise}
      />
    </div>
  );
}
