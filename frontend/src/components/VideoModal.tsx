import { useEffect } from "react";
import { Youtube, X } from "lucide-react";
import type { VideoType } from "@/layout/InfoSidePanel";

interface VideoModalProps {
  video: VideoType | null;
  onClose: () => void;
}

export default function VideoModal({ video, onClose }: VideoModalProps) {
  // Close on Esc + prevent background scroll when open
  useEffect(() => {
    if (!video) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [video, onClose]);

  if (!video) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Video modal: ${video.title}`}
    >
      <div
        className="relative w-full max-w-4xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gray-900 rounded-t-lg p-3 flex items-center justify-between">
          <h3 className="text-white font-medium flex items-center gap-2">
            <Youtube className="h-5 w-5 text-red-500" />
            <span className="truncate">{video.title}</span>
          </h3>

          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-800 transition-colors"
            aria-label="Close video"
            type="button"
          >
            <X className="h-5 w-5 text-gray-400 hover:text-white" />
          </button>
        </div>

        {/* Video */}
        <div className="relative bg-black rounded-b-lg overflow-hidden">
          <div className="relative pt-[56.25%]">
            {/* 16:9 */}
            <iframe
              className="absolute top-0 left-0 w-full h-full"
              src={`${video.url}?autoplay=1&rel=0`}
              title={video.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </div>
  );
}
