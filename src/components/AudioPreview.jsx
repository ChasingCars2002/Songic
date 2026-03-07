import { useState, useRef, useEffect } from "react";

/**
 * Inline audio preview player for 30-second track previews.
 * Shows a play/pause button with a progress ring.
 */
export default function AudioPreview({ previewUrl }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  if (!previewUrl) return null;

  const updateProgress = () => {
    const audio = audioRef.current;
    if (audio && audio.duration) {
      setProgress(audio.currentTime / audio.duration);
    }
    if (isPlaying) {
      animRef.current = requestAnimationFrame(updateProgress);
    }
  };

  const toggle = (e) => {
    e.stopPropagation();

    if (!audioRef.current) {
      audioRef.current = new Audio(previewUrl);
      audioRef.current.volume = 0.5;
      audioRef.current.addEventListener("ended", () => {
        setIsPlaying(false);
        setProgress(0);
      });
    }

    if (isPlaying) {
      audioRef.current.pause();
      cancelAnimationFrame(animRef.current);
      setIsPlaying(false);
    } else {
      // Stop all other audio elements on the page
      document.querySelectorAll("audio").forEach((a) => {
        a.pause();
        a.currentTime = 0;
      });
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
      animRef.current = requestAnimationFrame(updateProgress);
    }
  };

  const circumference = 2 * Math.PI * 18;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <button
      onClick={toggle}
      className="relative w-10 h-10 shrink-0 cursor-pointer group"
      title={isPlaying ? "Pause preview" : "Play 30s preview"}
      aria-label={isPlaying ? "Pause preview" : "Play 30 second preview"}
    >
      {/* Progress ring */}
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 40 40">
        <circle
          cx="20"
          cy="20"
          r="18"
          fill="none"
          stroke="#252532"
          strokeWidth="2"
        />
        <circle
          cx="20"
          cy="20"
          r="18"
          fill="none"
          stroke="url(#previewGrad)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-100"
        />
        <defs>
          <linearGradient id="previewGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff2d78" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
      </svg>

      {/* Play/Pause icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        {isPlaying ? (
          <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4 ml-0.5">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </div>
    </button>
  );
}
