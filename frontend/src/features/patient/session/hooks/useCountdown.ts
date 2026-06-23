import { useEffect, useState } from "react";

export function useCountdown(initial = 5) {
  const [value, setValue] = useState(initial);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    if (value <= 0) return;

    const t = window.setTimeout(() => setValue((v) => v - 1), 1000);
    return () => window.clearTimeout(t);
  }, [running, value]);

  const start = () => {
    setValue(initial);
    setRunning(true);
  };

  const reset = () => {
    setRunning(false);
    setValue(initial);
  };

  return { value, running, start, reset, setRunning };
}
