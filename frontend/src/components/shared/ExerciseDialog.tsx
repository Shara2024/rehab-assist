import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export type ExerciseDetails = {
  id: string;
  title: string;
  bodyPart?: string;
  side?: "left" | "right";
  imageUrl?: string;
  steps: string[];
  safetyTips?: string[];
};

type ExerciseDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercise?: ExerciseDetails | null;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
};

export default function ExerciseDialog({
  open,
  onOpenChange,
  exercise,
}: ExerciseDialogProps) {
  if (!exercise) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 sm:max-w-2xl max-h-[80vh] overflow-auto">
        {/* Header */}
        <DialogHeader className="p-6 pb-3 sticky top-0 bg-background z-10">
          <DialogTitle className="text-xl">{exercise.title}</DialogTitle>
          <DialogDescription>
            {exercise.bodyPart
              ? `Target: ${exercise.bodyPart}`
              : "Exercise details"}
          </DialogDescription>
        </DialogHeader>

        {/* Content */}
        <div className="px-6 pb-4 space-y-4">
          {exercise.imageUrl && (
            <div className="overflow-hidden rounded-xl border bg-muted/20">
              <img
                src={exercise.imageUrl}
                alt={exercise.title}
                className="w-full h-auto object-contain"
              />
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm font-medium">Steps</p>
            <ol className="list-decimal pl-5 text-sm space-y-1 text-muted-foreground">
              {exercise.steps.map((s, idx) => (
                <li key={idx}>{s}</li>
              ))}
            </ol>
          </div>

          {exercise.safetyTips?.length ? (
            <div className="rounded-xl border bg-muted/30 p-3">
              <p className="text-sm font-medium">Safety</p>
              <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                {exercise.safetyTips.map((t, idx) => (
                  <li key={idx}>• {t}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        {/* Sticky footer */}
        <DialogFooter className="sticky bottom-0 border-t bg-background px-6 py-4 z-10">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
