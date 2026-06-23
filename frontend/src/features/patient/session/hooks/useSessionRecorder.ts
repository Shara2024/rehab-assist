import { useCallback, useRef, useState } from "react";
import { downloadBlob, getSupportedVideoMimeType } from "../utils/sessionVideo";

type RecorderStatus = "idle" | "recording" | "stopped" | "error";

type UseSessionRecorderReturn = {
  status: RecorderStatus;
  error: string | null;
  recordedBlob: Blob | null;
  recordedUrl: string | null;
  startRecording: (stream: MediaStream) => boolean;
  stopRecording: () => Promise<Blob | null>;
  resetRecording: () => void;
  downloadRecording: (filename?: string) => void;
};

export function useSessionRecorder(): UseSessionRecorderReturn {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);

  const resetRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;

    if (recorder && recorder.state !== "inactive") {
      recorder.ondataavailable = null;
      recorder.onerror = null;
      recorder.onstop = null;
      recorder.stop();
    }

    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }

    mediaRecorderRef.current = null;
    chunksRef.current = [];

    setRecordedBlob(null);
    setRecordedUrl(null);
    setError(null);
    setStatus("idle");
  }, [recordedUrl]);

  const startRecording = useCallback(
    (stream: MediaStream) => {
      try {
        if (!stream) {
          setError("No camera stream available for recording.");
          setStatus("error");
          return false;
        }

        if (mediaRecorderRef.current?.state === "recording") {
          return true;
        }

        const mimeType = getSupportedVideoMimeType();
        if (!mimeType) {
          setError("This browser does not support video recording.");
          setStatus("error");
          return false;
        }

        if (recordedUrl) {
          URL.revokeObjectURL(recordedUrl);
        }

        chunksRef.current = [];
        setRecordedBlob(null);
        setRecordedUrl(null);
        setError(null);

        const recorder = new MediaRecorder(stream, { mimeType });

        recorder.ondataavailable = (event: BlobEvent) => {
          if (event.data && event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };

        recorder.onerror = () => {
          setError("Video recording failed.");
          setStatus("error");
        };

        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: mimeType });
          const url = URL.createObjectURL(blob);

          setRecordedBlob(blob);
          setRecordedUrl(url);
          setStatus("stopped");
        };

        mediaRecorderRef.current = recorder;
        recorder.start();
        setStatus("recording");
        return true;
      } catch {
        setError("Unable to start session recording.");
        setStatus("error");
        return false;
      }
    },
    [recordedUrl],
  );

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;

      if (!recorder) {
        resolve(recordedBlob);
        return;
      }

      if (recorder.state === "inactive") {
        resolve(recordedBlob);
        return;
      }

      const handleStop = () => {
        recorder.removeEventListener("stop", handleStop);

        const finalBlob =
          chunksRef.current.length > 0
            ? new Blob(chunksRef.current, {
                type: recorder.mimeType || "video/webm",
              })
            : null;

        resolve(finalBlob);
      };

      recorder.addEventListener("stop", handleStop);
      recorder.stop();
    });
  }, [recordedBlob]);

  const downloadRecording = useCallback(
    (filename = "session_video.webm") => {
      if (!recordedBlob) return;
      downloadBlob(filename, recordedBlob);
    },
    [recordedBlob],
  );

  return {
    status,
    error,
    recordedBlob,
    recordedUrl,
    startRecording,
    stopRecording,
    resetRecording,
    downloadRecording,
  };
}
