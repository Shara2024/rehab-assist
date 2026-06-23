export function throttleRaf(intervalMs: number) {
  let last = 0;

  return function shouldRun(now = performance.now()) {
    if (now - last < intervalMs) return false;
    last = now;
    return true;
  };
}
