import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Activity, ClipboardList } from "lucide-react";

import ExerciseDialog from "@/components/shared/ExerciseDialog";
import type { ExerciseDetails } from "@/components/shared/ExerciseDialog";

type TodaySession = {
  id: string;
  exerciseId: string;
  title: string;
  bodyPart: string;
  reps: number;
  sets: number;
  progress: number; // 0-100
  status: "pending" | "in-progress" | "completed";
};

const mockToday: TodaySession = {
  id: "session-today",
  exerciseId: "1",
  title: "Shoulder Abduction",
  bodyPart: "Upper limb",
  reps: 10,
  sets: 3,
  progress: 0,
  status: "pending",
};

export default function PatientDashboardModule() {
  const [exerciseOpen, setExerciseOpen] = useState(false);

  const statusVariant =
    mockToday.status === "completed"
      ? "default"
      : mockToday.status === "in-progress"
        ? "secondary"
        : "outline";

  const sessionUrl = `/patient/session?exerciseId=${mockToday.exerciseId}`;

  // Mock exercise details (replace with API later)
  const exercise: ExerciseDetails = useMemo(
    () => ({
      id: mockToday.exerciseId,
      title: mockToday.title,
      bodyPart: mockToday.bodyPart,
      imageUrl: "/public/image.png",
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
    }),
    [],
  );

  return (
    <div className="flex flex-col gap-6 mt-6">
      <Card className="rounded-2xl border-muted/40 shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Activity className="size-5 text-primary" />
            </div>

            <div>
              <CardTitle className="text-base">{mockToday.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {mockToday.bodyPart} · {mockToday.reps} reps · {mockToday.sets}{" "}
                sets
              </p>
            </div>
          </div>

          <Badge variant={statusVariant}>{mockToday.status}</Badge>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Progress value={mockToday.progress} />
            <p className="text-xs text-muted-foreground">
              {mockToday.progress}% completed today
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild className="rounded-xl w-full sm:w-auto">
              <Link to={sessionUrl}>Open session</Link>
            </Button>

            <Button
              variant="outline"
              className="rounded-xl w-full sm:w-auto"
              onClick={() => setExerciseOpen(true)}
            >
              <ClipboardList className="mr-2 size-4" />
              Exercise Guide
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Popup dialog */}
      <ExerciseDialog
        open={exerciseOpen}
        onOpenChange={setExerciseOpen}
        exercise={exercise}
      />
    </div>
  );
}
