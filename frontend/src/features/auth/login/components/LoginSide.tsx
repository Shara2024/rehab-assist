import { Activity, Camera, HeartPulse } from "lucide-react";

export function LoginSide() {
  return (
    <div className="relative hidden lg:block p-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background" />
      <div className="absolute inset-0 opacity-40 [background:radial-gradient(circle_at_30%_30%,hsl(var(--primary))_0%,transparent_55%)]" />

      <div className="relative h-full p-10 flex flex-col justify-between">
        <div className="flex items-center gap-2">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Activity className="size-5" />
          </div>
          <div>
            <div className="font-semibold text-lg">RehabAssist</div>
            <div className="text-sm text-muted-foreground">
              Home rehabilitation support
            </div>
          </div>
        </div>

        <div className="max-w">
          <h1 className="text-3xl font-semibold leading-tight word-break">
            Safer home sessions with <br />
            real-time guidance.
          </h1>

          <div className="mt-6 grid gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Camera className="size-4 text-muted-foreground" />
              <span>Webcam-based sessions</span>
            </div>
            <div className="flex items-center gap-2">
              <HeartPulse className="size-4 text-muted-foreground" />
              <span>Therapist-reviewed progress</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          {/* Tip: good lighting + keep your upper body fully in frame. */}
        </div>
      </div>
    </div>
  );
}
