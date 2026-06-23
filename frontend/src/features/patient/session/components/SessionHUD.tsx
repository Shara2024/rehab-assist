import { Button } from "@/components/ui/button";

export function SessionHUD({
  onStop,
  stageLabel,
}: {
  onStop: () => void;
  stageLabel: string;
}) {
  return (
    <div className="absolute top-3 left-3 right-3 z-40 flex items-center justify-between">
      <div className="rounded-xl bg-black/40 text-white px-3 py-2 text-sm backdrop-blur-md">
        {stageLabel}
      </div>
      <Button variant="destructive" className="rounded-xl" onClick={onStop}>
        Stop
      </Button>
    </div>
  );
}
