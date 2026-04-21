"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AudioPlayer from "@/components/AudioPlayer";
import PromptPanel from "@/components/PromptPanel";
import MomentCard from "@/components/MomentCard";

interface Moment {
  id: string;
  timestampSec: number;
  prompt: string;
  imagePath: string;
  createdAt: string;
}

interface Song {
  id: string;
  originalName: string;
  durationSec: number;
  moments: Moment[];
}

export default function SongPage() {
  const params = useParams();
  const router = useRouter();
  const songId = params.id as string;

  const [song, setSong] = useState<Song | null>(null);
  const [moments, setMoments] = useState<Moment[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeMoment, setActiveMoment] = useState<Moment | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPanel, setShowPanel] = useState(false);
  const [regenerateOnPlay, setRegenerateOnPlay] = useState(false);
  const [regenProgress, setRegenProgress] = useState<{ done: number; total: number } | null>(null);
  const [allSongIds, setAllSongIds] = useState<string[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null!);
  const lastShownMomentId = useRef<string | null>(null);
  const regenResults = useRef<Map<string, string>>(new Map());

  // Fetch all song IDs for prev/next navigation
  useEffect(() => {
    fetch("/api/songs")
      .then((res) => res.json())
      .then((songs: { id: string }[]) => setAllSongIds(songs.map((s) => s.id)))
      .catch(() => {});
  }, []);

  const currentIndex = allSongIds.indexOf(songId);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < allSongIds.length - 1;

  const goToSong = useCallback(
    (id: string) => {
      localStorage.setItem("autoPlayNext", "true");
      router.push(`/song/${id}`);
    },
    [router]
  );

  const handlePrevious = useCallback(() => {
    if (hasPrevious) goToSong(allSongIds[currentIndex - 1]);
  }, [hasPrevious, allSongIds, currentIndex, goToSong]);

  const handleNext = useCallback(() => {
    if (hasNext) goToSong(allSongIds[currentIndex + 1]);
  }, [hasNext, allSongIds, currentIndex, goToSong]);

  const fetchSong = useCallback(async () => {
    try {
      const res = await fetch(`/api/songs/${songId}`);
      if (!res.ok) throw new Error("Failed to load song");
      const data = await res.json();
      setSong(data);
      const sortedMoments = (data.moments || []).sort(
        (a: Moment, b: Moment) => a.timestampSec - b.timestampSec
      );
      setMoments(sortedMoments);
      // Set first image as cover immediately
      if (sortedMoments.length > 0 && !activeMoment) {
        setActiveMoment(sortedMoments[0]);
        lastShownMomentId.current = sortedMoments[0].id;
      }
    } catch {
      // Song not found
    } finally {
      setLoading(false);
    }
  }, [songId]);

  useEffect(() => {
    fetchSong();
  }, [fetchSong]);

  // Regenerate ALL moments in parallel in the background
  const regenerateAllMoments = useCallback(async (momentsToRegen: Moment[]) => {
    if (momentsToRegen.length === 0) return;
    regenResults.current.clear();
    setRegenProgress({ done: 0, total: momentsToRegen.length });

    let done = 0;
    const promises = momentsToRegen.map(async (moment) => {
      try {
        const res = await fetch("/api/moments/regenerate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ momentId: moment.id }),
        });
        if (!res.ok) return;
        const updated = await res.json();
        regenResults.current.set(updated.id, updated.imagePath);
        // Update moment in local state immediately so it's ready
        setMoments((prev) =>
          prev.map((m) => (m.id === updated.id ? { ...m, imagePath: updated.imagePath } : m))
        );
        // If this moment is currently displayed, swap the image now
        setActiveMoment((prev) =>
          prev && prev.id === updated.id ? { ...prev, imagePath: updated.imagePath as string } : prev
        );
      } catch {
        // Silently fail for this moment
      } finally {
        done++;
        setRegenProgress({ done, total: momentsToRegen.length });
      }
    });

    await Promise.all(promises);
    // Clear progress after a short delay so user sees completion
    setTimeout(() => setRegenProgress(null), 1500);
  }, []);

  // Time synchronization: first image shows from start, then each image shows until the next one
  const handleTimeUpdate = useCallback(
    (time: number) => {
      setCurrentTime(time);

      if (moments.length === 0) return;

      let candidate: Moment | null = null;
      for (let i = moments.length - 1; i >= 0; i--) {
        if (moments[i].timestampSec <= time + 0.75) {
          candidate = moments[i];
          break;
        }
      }

      // If before the first moment, show the first image as cover
      if (!candidate && moments.length > 0) {
        candidate = moments[0];
      }

      if (candidate && candidate.id !== lastShownMomentId.current) {
        setActiveMoment(candidate);
        lastShownMomentId.current = candidate.id;
      }
    },
    [moments]
  );

  const handleDurationLoaded = async (duration: number) => {
    if (song && song.durationSec === 0 && duration > 0) {
      await fetch(`/api/songs/${songId}/duration`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durationSec: duration }),
      });
    }
  };

  const toggleRegenerateOnPlay = () => {
    setRegenerateOnPlay((prev) => {
      const next = !prev;
      if (next && moments.length > 0) {
        regenerateAllMoments(moments);
      }
      if (!next) {
        setRegenProgress(null);
      }
      return next;
    });
  };

  const handleMomentCreated = () => {
    fetchSong();
  };

  // Repeat All: navigate to next song in library and auto-play
  const handleSongEnded = useCallback(async (repeatMode: string) => {
    if (repeatMode !== "all") return;
    try {
      const res = await fetch("/api/songs");
      if (!res.ok) return;
      const songs = await res.json();
      if (songs.length <= 1) {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play();
        }
        return;
      }
      const currentIndex = songs.findIndex((s: { id: string }) => s.id === songId);
      const nextIndex = (currentIndex + 1) % songs.length;
      localStorage.setItem("autoPlayNext", "true");
      router.push(`/song/${songs[nextIndex].id}`);
    } catch {
      // Failed to fetch songs, do nothing
    }
  }, [songId, router]);

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
      handleTimeUpdate(time);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-black">
        <p className="text-zinc-400">Song not found</p>
        <Link href="/" className="text-violet-400 hover:text-violet-300">
          &larr; Back to library
        </Link>
      </div>
    );
  }

  const backgroundImage = activeMoment
    ? `/api/generated/${activeMoment.imagePath.replace("/generated/", "")}`
    : null;

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Full-screen background image */}
      {backgroundImage && (
        <div className="absolute inset-0 transition-opacity duration-700">
          <img
            src={backgroundImage}
            alt={activeMoment?.prompt || ""}
            className="w-full h-full object-cover"
          />
          {/* Dark gradient overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/50" />
        </div>
      )}

      {/* No image placeholder */}
      {!backgroundImage && (
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center">
          <p className="text-zinc-600 text-lg">
            Play the song and create your first memory moment
          </p>
        </div>
      )}

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 flex items-center justify-between">
        <Link
          href="/"
          className="text-sm text-white/70 hover:text-white transition-colors backdrop-blur-sm bg-white/10 px-3 py-1.5 rounded-full"
        >
          &larr; Library
        </Link>
        <button
          onClick={() => setShowPanel(!showPanel)}
          className="text-sm text-white/70 hover:text-white transition-colors backdrop-blur-sm bg-white/10 px-3 py-1.5 rounded-full"
        >
          {showPanel ? "Hide Panel" : "Create Memory"}
        </button>
      </div>

      {/* Regenerating progress indicator */}
      {regenProgress && (
        <div className="absolute top-16 left-0 right-0 z-10 flex justify-center pointer-events-none">
          <div className="backdrop-blur-md bg-black/40 rounded-xl px-5 py-2.5 flex items-center gap-3">
            {regenProgress.done < regenProgress.total && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            <p className="text-white/80 text-sm text-center">
              {regenProgress.done < regenProgress.total
                ? `Regenerating images... ${regenProgress.done}/${regenProgress.total}`
                : `All ${regenProgress.total} images regenerated`}
            </p>
          </div>
        </div>
      )}

      {/* Side panel for creating moments + gallery */}
      {showPanel && (
        <div className="absolute top-14 right-4 bottom-28 z-20 w-80 flex flex-col gap-3 overflow-hidden">
          <div className="backdrop-blur-xl bg-black/50 rounded-xl border border-white/10">
            <PromptPanel
              songId={song.id}
              currentTime={currentTime}
              disabled={false}
              onMomentCreated={handleMomentCreated}
            />
            {/* Regenerate on play toggle */}
            <div className="px-4 pb-4 pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <div
                  onClick={toggleRegenerateOnPlay}
                  className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${
                    regenerateOnPlay ? "bg-amber-500" : "bg-white/15"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      regenerateOnPlay ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </div>
                <span className="text-xs text-white/60 group-hover:text-white/80 transition-colors select-none">
                  Regenerate images on play
                </span>
              </label>
            </div>
          </div>

          {moments.length > 0 && (
            <div className="flex-1 overflow-y-auto backdrop-blur-xl bg-black/50 rounded-xl border border-white/10 p-3 space-y-2">
              <h3 className="text-xs font-medium text-white/50 uppercase tracking-wider">
                Moments ({moments.length})
              </h3>
              {moments.map((m) => (
                <MomentCard
                  key={m.id}
                  moment={m}
                  isActive={activeMoment?.id === m.id}
                  onSeek={handleSeek}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Transparent audio player at bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <AudioPlayer
          songId={song.id}
          songTitle={song.originalName.replace(/\.mp3$/i, "")}
          moments={moments}
          onTimeUpdate={handleTimeUpdate}
          onDurationLoaded={handleDurationLoaded}
          onSongEnded={handleSongEnded}
          onNext={handleNext}
          onPrevious={handlePrevious}
          hasNext={hasNext}
          hasPrevious={hasPrevious}
          audioRef={audioRef}
        />
      </div>
    </div>
  );
}
