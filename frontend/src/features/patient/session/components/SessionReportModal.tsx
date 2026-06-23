import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import type {
  CompletedRep,
  SessionRomSummary,
} from "@/features/rom/types/repTypes";

type Props = {
  open: boolean;
  repSummary: CompletedRep[];
  sessionSummary: SessionRomSummary | null;
  onClose: () => void;
  onDownloadAll: () => void;
};

export default function SessionReportModal({
  open,
  repSummary,
  sessionSummary,
  onClose,
  onDownloadAll,
}: Props) {
  if (!open || !sessionSummary) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="w-full max-w-5xl max-h-[90vh] overflow-auto rounded-3xl bg-white shadow-2xl border border-slate-200">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Session performance report
            </h2>
            <p className="text-slate-600">
              Review your repetitions and overall performance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={onDownloadAll}
              className="bg-teal-600 hover:bg-teal-700 text-black flex items-center gap-2"
            >
              <Download className="size-4" />
              Download CSVs
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid md:grid-cols-4 gap-4">
            {[
              {
                label: "Completed reps",
                value: sessionSummary.totalRepsCompleted,
              },
              {
                label: "Target reps",
                value: sessionSummary.targetReps,
              },
              {
                label: "Average peak ROM",
                value:
                  sessionSummary.averagePeakAbductionDeg != null
                    ? `${sessionSummary.averagePeakAbductionDeg.toFixed(1)}°`
                    : "--",
              },
              {
                label: "Best peak ROM",
                value:
                  sessionSummary.bestPeakAbductionDeg != null
                    ? `${sessionSummary.bestPeakAbductionDeg.toFixed(1)}°`
                    : "--",
              },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <p className="text-sm text-slate-500">{label}</p>
                <p className="text-3xl font-bold text-slate-900">{value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200 p-5">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Overall session summary
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-slate-700">
              <div className="rounded-xl bg-slate-50 p-4">
                <p>
                  Reps meeting target angle:{" "}
                  <span className="font-semibold">
                    {sessionSummary.repsMeetingTarget}
                  </span>
                </p>
                <p className="mt-2">
                  Target achievement:{" "}
                  <span className="font-semibold">
                    {sessionSummary.targetAchievementPercent.toFixed(1)}%
                  </span>
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p>
                  Average rep duration:{" "}
                  <span className="font-semibold">
                    {sessionSummary.averageRepDurationMs != null
                      ? `${(sessionSummary.averageRepDurationMs / 1000).toFixed(2)} s`
                      : "--"}
                  </span>
                </p>
                <p className="mt-2">
                  Session duration:{" "}
                  <span className="font-semibold">
                    {(sessionSummary.sessionDurationMs / 1000).toFixed(1)} s
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-5">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Repetition-wise performance
            </h3>
            {repSummary.length === 0 ? (
              <p className="text-slate-600">No repetitions were recorded.</p>
            ) : (
              <div className="overflow-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-500">
                      <th className="py-3 pr-4">Rep</th>
                      <th className="py-3 pr-4">Peak ROM</th>
                      <th className="py-3 pr-4">Target met</th>
                      <th className="py-3 pr-4">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {repSummary.map((rep) => (
                      <tr
                        key={rep.repNumber}
                        className="border-b border-slate-100"
                      >
                        <td className="py-3 pr-4 font-medium text-slate-900">
                          {rep.repNumber}
                        </td>
                        <td className="py-3 pr-4 text-slate-700">
                          {rep.peakAbductionDeg.toFixed(1)}°
                        </td>
                        <td className="py-3 pr-4 text-slate-700">
                          {rep.targetMet ? "Yes" : "No"}
                        </td>
                        <td className="py-3 pr-4 text-slate-700">
                          {(rep.durationMs / 1000).toFixed(2)} s
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
