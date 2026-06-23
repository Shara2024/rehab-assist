export function CountdownOverlay({
  value,
  show,
}: {
  value: number;
  show: boolean;
}) {
  if (!show) return null;

  return (
    <div className="absolute inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm">
      <div className="text-center">
        <div className="text-6xl font-semibold text-white tabular-nums">
          {value}
        </div>
        <p className="mt-2 text-sm text-white/80">Starting in {value}…</p>
      </div>
    </div>
  );
}
