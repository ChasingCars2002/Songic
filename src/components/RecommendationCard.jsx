import { useState } from "react";
import AudioPreview from "./AudioPreview";

/**
 * A single recommendation card displaying album art, track info,
 * audio preview, and the crucial "I already listen to that" button.
 */
export default function RecommendationCard({
  track,
  index,
  onKnowIt,
  isReplacing,
}) {
  const [imageLoaded, setImageLoaded] = useState(false);

  if (!track) return null;

  const formatDuration = (ms) => {
    if (!ms) return "";
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className="relative border rounded-2xl overflow-hidden transition-all duration-300 hover:border-[rgba(255,45,120,0.3)] group"
      style={{
        background: "rgba(26,26,36,0.8)",
        borderColor: isReplacing ? "rgba(168,85,247,0.5)" : "#252532",
        animation: `fadeInUp 0.4s ease-out ${index * 0.08}s both`,
      }}
    >
      {/* Replacing overlay */}
      {isReplacing && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[rgba(17,17,24,0.85)] backdrop-blur-sm rounded-2xl">
          <div className="flex items-center gap-3">
            <div
              className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "#a855f7", borderTopColor: "transparent" }}
            />
            <span className="text-sm text-gray-300">Finding something new...</span>
          </div>
        </div>
      )}

      <div className="flex gap-4 p-4">
        {/* Album Art */}
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-xl overflow-hidden bg-[#252532]">
          {track.albumArt && (
            <img
              src={track.albumArt}
              alt={`${track.album} album art`}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
              onLoad={() => setImageLoaded(true)}
              loading="lazy"
            />
          )}
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="1.5" className="w-8 h-8">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            </div>
          )}

          {/* Play button overlay on album art */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
            <AudioPreview previewUrl={track.previewUrl} />
          </div>
        </div>

        {/* Track Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-white text-base truncate">
              {track.title}
            </h3>
            <p className="text-sm text-gray-400 truncate">{track.artist}</p>
            <div className="flex items-center gap-2 mt-1">
              {track.genre && (
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(168,85,247,0.12)",
                    color: "#a855f7",
                  }}
                >
                  {track.genre}
                </span>
              )}
              {track.durationMs > 0 && (
                <span className="text-[10px] text-gray-600">
                  {formatDuration(track.durationMs)}
                </span>
              )}
            </div>
          </div>

          {/* Mobile preview button */}
          <div className="sm:hidden mt-2">
            {track.previewUrl && <AudioPreview previewUrl={track.previewUrl} />}
          </div>
        </div>

        {/* Desktop preview button */}
        <div className="hidden sm:flex items-center">
          {track.previewUrl && <AudioPreview previewUrl={track.previewUrl} />}
        </div>
      </div>

      {/* "I already listen to that" button */}
      <button
        onClick={() => onKnowIt(track)}
        disabled={isReplacing}
        className="w-full py-3 px-4 text-sm font-medium transition-all duration-200 cursor-pointer border-t flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          borderColor: "#252532",
          color: "#9ca3af",
          background: "rgba(26,26,36,0.4)",
        }}
        onMouseEnter={(e) => {
          if (!isReplacing) {
            e.currentTarget.style.background = "rgba(255,45,120,0.08)";
            e.currentTarget.style.color = "#ff2d78";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(26,26,36,0.4)";
          e.currentTarget.style.color = "#9ca3af";
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
          <path d="M9 12l2 2 4-4" />
          <circle cx="12" cy="12" r="10" />
        </svg>
        I already listen to that
      </button>
    </div>
  );
}
