import { forwardRef, useEffect, useRef } from "react";

type Props = {
  stream: MediaStream | null;
  className?: string;
};

const CameraView = forwardRef<HTMLVideoElement, Props>(
  ({ stream, className }, forwardedRef) => {
    const localRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
      const video =
        typeof forwardedRef === "function"
          ? localRef.current
          : (forwardedRef?.current ?? localRef.current);

      if (!video) return;

      if (stream) {
        video.srcObject = stream;

        video.play().catch(() => {});
      } else {
        video.srcObject = null;
      }
    }, [stream, forwardedRef]);

    return (
      <video
        ref={(el) => {
          localRef.current = el;

          if (typeof forwardedRef === "function") forwardedRef(el);
          else if (forwardedRef) forwardedRef.current = el;
        }}
        autoPlay
        playsInline
        muted
        className={className}
      />
    );
  },
);

CameraView.displayName = "CameraView";
export default CameraView;


