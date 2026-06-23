import { useCallback, useEffect, useRef, useState } from "react";

export function useCamera() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const activeRef = useRef(false);

  const start = useCallback(async () => {
    setError(null);
    activeRef.current = true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: "user",
          frameRate: { ideal: 30 },
        },
        audio: false,
      });
      if (!activeRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      setStream(stream);
    } catch (error) {
      console.error("Error accessing webcam:", error);
      setError("Camera permission denied or camera not available.");
    }
  }, []);

  const stop = useCallback(() => {
    activeRef.current = false;
    setStream((prev) => {
      prev?.getTracks().forEach((t) => t.stop());
      return null;
    });
  }, []);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  return { stream, error, start, stop };
}
