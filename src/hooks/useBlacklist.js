import { useState, useCallback } from "react";

/**
 * Hook to manage the "I already listen to that" blacklist.
 * Tracks blacklisted track IDs and artist names for the current session.
 *
 * @returns {{ blacklistedIds, blacklistedArtists, addToBlacklist, isBlacklisted, clearBlacklist }}
 */
export function useBlacklist() {
  const [blacklistedIds, setBlacklistedIds] = useState(new Set());
  const [blacklistedArtists, setBlacklistedArtists] = useState(new Set());

  const addToBlacklist = useCallback((track) => {
    setBlacklistedIds((prev) => {
      const next = new Set(prev);
      next.add(track.id);
      return next;
    });
    setBlacklistedArtists((prev) => {
      const next = new Set(prev);
      next.add(track.artist.toLowerCase());
      return next;
    });
  }, []);

  const isBlacklisted = useCallback(
    (track) => {
      return (
        blacklistedIds.has(track.id) ||
        blacklistedArtists.has(track.artist.toLowerCase())
      );
    },
    [blacklistedIds, blacklistedArtists]
  );

  const clearBlacklist = useCallback(() => {
    setBlacklistedIds(new Set());
    setBlacklistedArtists(new Set());
  }, []);

  return {
    blacklistedIds,
    blacklistedArtists,
    addToBlacklist,
    isBlacklisted,
    clearBlacklist,
  };
}
