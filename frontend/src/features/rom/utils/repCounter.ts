// import type { RomMetrics } from "../types/romTypes";
// import type {
//   CompletedRep,
//   RepDetectorConfig,
//   RepFrameResult,
//   RepPhase,
// } from "../types/repTypes";

// const DEFAULT_CONFIG: RepDetectorConfig = {
//   restEnterDeg: 25, // arm considered back near side
//   restExitDeg: 32, // hysteresis so noise doesn't bounce state
//   minExcursionDeg: 35, // must rise enough above rest to count as a real rep
//   peakDropDeg: 8, // drop from peak required to confirm peak reached
//   minRepDurationMs: 700, // reject twitch/noise
//   maxRepDurationMs: 8000, // reject stalled / broken tracking rep
//   targetAngleDeg: 90, // can be changed later per patient / therapist
// };

// type InternalState = {
//   phase: RepPhase;
//   repCount: number;
//   repStartMs: number | null;
//   peakAtMs: number | null;
//   peakDeg: number | null;
//   lastCompletedRep: CompletedRep | null;
// };

// export class ShoulderAbductionRepCounter {
//   private config: RepDetectorConfig;
//   private state: InternalState;

//   constructor(config?: Partial<RepDetectorConfig>) {
//     this.config = {
//       ...DEFAULT_CONFIG,
//       ...config,
//     };

//     this.state = this.buildInitialState();
//   }

//   private buildInitialState(): InternalState {
//     return {
//       phase: "AT_REST",
//       repCount: 0,
//       repStartMs: null,
//       peakAtMs: null,
//       peakDeg: null,
//       lastCompletedRep: null,
//     };
//   }

//   reset() {
//     this.state = this.buildInitialState();
//   }

//   getRepCount() {
//     return this.state.repCount;
//   }

//   getPhase() {
//     return this.state.phase;
//   }

//   getCurrentPeakDeg() {
//     return this.state.peakDeg;
//   }

//   getLastCompletedRep() {
//     return this.state.lastCompletedRep;
//   }

//   update(rom: RomMetrics | null, timestampMs: number): RepFrameResult {
//     // Hard gate on shoulder visibility. If tracking is trash, do not fake logic.
//     if (
//       !rom ||
//       !rom.shoulderVisibleEnough ||
//       rom.shoulderAbductionDeg == null
//     ) {
//       this.state.phase = "NO_TRACK";
//       return this.frameResult(false);
//     }

//     const angle = rom.shoulderAbductionDeg;
//     const {
//       restEnterDeg,
//       restExitDeg,
//       minExcursionDeg,
//       peakDropDeg,
//       minRepDurationMs,
//       maxRepDurationMs,
//       targetAngleDeg,
//     } = this.config;

//     let justCounted = false;

//     switch (this.state.phase) {
//       case "NO_TRACK": {
//         // Recovered tracking: decide whether user is at rest or already mid-lift.
//         if (angle <= restEnterDeg) {
//           this.state.phase = "AT_REST";
//         } else {
//           this.state.phase = "LIFTING";
//           this.state.repStartMs = timestampMs;
//           this.state.peakAtMs = timestampMs;
//           this.state.peakDeg = angle;
//         }
//         break;
//       }

//       case "AT_REST": {
//         // Start rep only after clearly leaving rest.
//         if (angle >= restExitDeg) {
//           this.state.phase = "LIFTING";
//           this.state.repStartMs = timestampMs;
//           this.state.peakAtMs = timestampMs;
//           this.state.peakDeg = angle;
//         }
//         break;
//       }

//       case "LIFTING": {
//         if (this.state.peakDeg == null || angle > this.state.peakDeg) {
//           this.state.peakDeg = angle;
//           this.state.peakAtMs = timestampMs;
//         }

//         const excursion =
//           this.state.peakDeg != null ? this.state.peakDeg - restEnterDeg : 0;

//         // Confirm top only when there was a meaningful lift and then a clear drop.
//         if (
//           excursion >= minExcursionDeg &&
//           this.state.peakDeg != null &&
//           angle <= this.state.peakDeg - peakDropDeg
//         ) {
//           this.state.phase = "AT_TOP";
//         }

//         // Abort fake rep if user drifted back down without enough excursion.
//         if (angle <= restEnterDeg && excursion < minExcursionDeg) {
//           this.abortCurrentRep();
//           this.state.phase = "AT_REST";
//         }
//         break;
//       }

//       case "AT_TOP": {
//         // Once top is confirmed, next meaningful downward trend becomes lowering.
//         if (
//           this.state.peakDeg != null &&
//           angle <= this.state.peakDeg - peakDropDeg
//         ) {
//           this.state.phase = "LOWERING";
//         }
//         break;
//       }

//       case "LOWERING": {
//         // If user rises again before returning to rest, update the peak and go back up.
//         if (this.state.peakDeg == null || angle > this.state.peakDeg) {
//           this.state.peakDeg = angle;
//           this.state.peakAtMs = timestampMs;
//           this.state.phase = "LIFTING";
//           break;
//         }

//         // Count rep only after sufficient return toward rest.
//         if (angle <= restEnterDeg) {
//           const startedAtMs = this.state.repStartMs;
//           const peakAtMs = this.state.peakAtMs;
//           const peakDeg = this.state.peakDeg;

//           if (startedAtMs != null && peakAtMs != null && peakDeg != null) {
//             const durationMs = timestampMs - startedAtMs;
//             const excursion = peakDeg - restEnterDeg;

//             const validDuration =
//               durationMs >= minRepDurationMs && durationMs <= maxRepDurationMs;

//             const validExcursion = excursion >= minExcursionDeg;

//             if (validDuration && validExcursion) {
//               this.state.repCount += 1;
//               justCounted = true;

//               this.state.lastCompletedRep = {
//                 repNumber: this.state.repCount,
//                 peakAbductionDeg: peakDeg,
//                 startedAtMs,
//                 peakAtMs,
//                 endedAtMs: timestampMs,
//                 durationMs,
//                 targetMet: peakDeg >= targetAngleDeg,
//                 visibilityScore: rom.visibilityScore,
//               };
//             }
//           }

//           this.abortCurrentRep();
//           this.state.phase = "AT_REST";
//         }

//         // Kill broken reps that drag on forever.
//         if (
//           this.state.repStartMs != null &&
//           timestampMs - this.state.repStartMs > maxRepDurationMs
//         ) {
//           this.abortCurrentRep();
//           this.state.phase = angle <= restEnterDeg ? "AT_REST" : "LIFTING";
//         }

//         break;
//       }

//       default:
//         break;
//     }

//     return this.frameResult(justCounted);
//   }

//   private abortCurrentRep() {
//     this.state.repStartMs = null;
//     this.state.peakAtMs = null;
//     this.state.peakDeg = null;
//   }

//   private frameResult(justCounted: boolean): RepFrameResult {
//     return {
//       phase: this.state.phase,
//       repCount: this.state.repCount,
//       justCounted,
//       currentPeakDeg: this.state.peakDeg,
//       lastCompletedRep: this.state.lastCompletedRep,
//     };
//   }
// }


import type { RomMetrics } from "../types/romTypes";
import type {
  CompletedRep,
  RepDetectorConfig,
  RepFrameResult,
  RepPhase,
  SessionRomSummary,
} from "../types/repTypes";

const DEFAULT_CONFIG: RepDetectorConfig = {
  restEnterDeg: 25,
  restExitDeg: 32,
  minExcursionDeg: 35,
  peakDropDeg: 8,
  minRepDurationMs: 700,
  maxRepDurationMs: 8000,
  targetAngleDeg: 90,
};

type InternalState = {
  phase: RepPhase;
  repCount: number;
  repStartMs: number | null;
  peakAtMs: number | null;
  peakDeg: number | null;
  lastCompletedRep: CompletedRep | null;
};

export class ShoulderAbductionRepCounter {
  private config: RepDetectorConfig;
  private state: InternalState;
  private completedReps: CompletedRep[];

  constructor(config?: Partial<RepDetectorConfig>) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };

    this.state = this.buildInitialState();
    this.completedReps = [];
  }

  private buildInitialState(): InternalState {
    return {
      phase: "AT_REST",
      repCount: 0,
      repStartMs: null,
      peakAtMs: null,
      peakDeg: null,
      lastCompletedRep: null,
    };
  }

  reset() {
    this.state = this.buildInitialState();
    this.completedReps = [];
  }

  getRepCount() {
    return this.state.repCount;
  }

  getPhase() {
    return this.state.phase;
  }

  getCurrentPeakDeg() {
    return this.state.peakDeg;
  }

  getLastCompletedRep() {
    return this.state.lastCompletedRep;
  }

  getCompletedReps() {
    return [...this.completedReps];
  }

  getSessionSummary(
    targetReps: number,
    sessionDurationMs: number,
  ): SessionRomSummary {
    const reps = this.completedReps;

    if (!reps.length) {
      return {
        totalRepsCompleted: 0,
        targetReps,
        targetAngleDeg: this.config.targetAngleDeg,
        repsMeetingTarget: 0,
        targetAchievementPercent: 0,
        averagePeakAbductionDeg: null,
        bestPeakAbductionDeg: null,
        averageRepDurationMs: null,
        sessionDurationMs,
      };
    }

    const peaks = reps.map((r) => r.peakAbductionDeg);
    const durations = reps.map((r) => r.durationMs);
    const repsMeetingTarget = reps.filter((r) => r.targetMet).length;

    return {
      totalRepsCompleted: reps.length,
      targetReps,
      targetAngleDeg: this.config.targetAngleDeg,
      repsMeetingTarget,
      targetAchievementPercent: (repsMeetingTarget / reps.length) * 100,
      averagePeakAbductionDeg: peaks.reduce((a, b) => a + b, 0) / peaks.length,
      bestPeakAbductionDeg: Math.max(...peaks),
      averageRepDurationMs:
        durations.reduce((a, b) => a + b, 0) / durations.length,
      sessionDurationMs,
    };
  }

  update(rom: RomMetrics | null, timestampMs: number): RepFrameResult {
    if (
      !rom ||
      !rom.shoulderVisibleEnough ||
      rom.shoulderAbductionDeg == null
    ) {
      this.state.phase = "NO_TRACK";
      return this.frameResult(false);
    }

    const angle = rom.shoulderAbductionDeg;
    const {
      restEnterDeg,
      restExitDeg,
      minExcursionDeg,
      peakDropDeg,
      minRepDurationMs,
      maxRepDurationMs,
      targetAngleDeg,
    } = this.config;

    let justCounted = false;

    switch (this.state.phase) {
      case "NO_TRACK": {
        if (angle <= restEnterDeg) {
          this.state.phase = "AT_REST";
        } else {
          this.state.phase = "LIFTING";
          this.state.repStartMs = timestampMs;
          this.state.peakAtMs = timestampMs;
          this.state.peakDeg = angle;
        }
        break;
      }

      case "AT_REST": {
        if (angle >= restExitDeg) {
          this.state.phase = "LIFTING";
          this.state.repStartMs = timestampMs;
          this.state.peakAtMs = timestampMs;
          this.state.peakDeg = angle;
        }
        break;
      }

      case "LIFTING": {
        if (this.state.peakDeg == null || angle > this.state.peakDeg) {
          this.state.peakDeg = angle;
          this.state.peakAtMs = timestampMs;
        }

        const excursion =
          this.state.peakDeg != null ? this.state.peakDeg - restEnterDeg : 0;

        if (
          excursion >= minExcursionDeg &&
          this.state.peakDeg != null &&
          angle <= this.state.peakDeg - peakDropDeg
        ) {
          this.state.phase = "AT_TOP";
        }

        if (angle <= restEnterDeg && excursion < minExcursionDeg) {
          this.abortCurrentRep();
          this.state.phase = "AT_REST";
        }
        break;
      }

      case "AT_TOP": {
        if (
          this.state.peakDeg != null &&
          angle <= this.state.peakDeg - peakDropDeg
        ) {
          this.state.phase = "LOWERING";
        }
        break;
      }

      case "LOWERING": {
        if (this.state.peakDeg == null || angle > this.state.peakDeg) {
          this.state.peakDeg = angle;
          this.state.peakAtMs = timestampMs;
          this.state.phase = "LIFTING";
          break;
        }

        if (angle <= restEnterDeg) {
          const startedAtMs = this.state.repStartMs;
          const peakAtMs = this.state.peakAtMs;
          const peakDeg = this.state.peakDeg;

          if (startedAtMs != null && peakAtMs != null && peakDeg != null) {
            const durationMs = timestampMs - startedAtMs;
            const excursion = peakDeg - restEnterDeg;

            const validDuration =
              durationMs >= minRepDurationMs && durationMs <= maxRepDurationMs;

            const validExcursion = excursion >= minExcursionDeg;

            if (validDuration && validExcursion) {
              this.state.repCount += 1;
              justCounted = true;

              const completedRep: CompletedRep = {
                repNumber: this.state.repCount,
                peakAbductionDeg: peakDeg,
                startedAtMs,
                peakAtMs,
                endedAtMs: timestampMs,
                durationMs,
                targetMet: peakDeg >= targetAngleDeg,
                visibilityScore: rom.visibilityScore,
              };

              this.state.lastCompletedRep = completedRep;
              this.completedReps.push(completedRep);
            }
          }

          this.abortCurrentRep();
          this.state.phase = "AT_REST";
        }

        if (
          this.state.repStartMs != null &&
          timestampMs - this.state.repStartMs > maxRepDurationMs
        ) {
          this.abortCurrentRep();
          this.state.phase = angle <= restEnterDeg ? "AT_REST" : "LIFTING";
        }

        break;
      }

      default:
        break;
    }

    return this.frameResult(justCounted);
  }

  private abortCurrentRep() {
    this.state.repStartMs = null;
    this.state.peakAtMs = null;
    this.state.peakDeg = null;
  }

  private frameResult(justCounted: boolean): RepFrameResult {
    return {
      phase: this.state.phase,
      repCount: this.state.repCount,
      justCounted,
      currentPeakDeg: this.state.peakDeg,
      lastCompletedRep: this.state.lastCompletedRep,
    };
  }
}
