"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface Moment {
  id: string;
  timestampSec: number;
  prompt: string;
  imagePath: string;
}

type RepeatMode = "off" | "all" | "one";

interface AudioPlayerProps {
  songId: string;
  songTitle: string;
  moments: Moment[];
  onTimeUpdate: (time: number) => void;
  onDurationLoaded: (duration: number) => void;
  onSongEnded?: (repeatMode: RepeatMode) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
  audioRef: React.RefObject<HTMLAudioElement>;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function AudioPlayer({
  songId,
  songTitle,
  moments,
  onTimeUpdate,
  onDurationLoaded,
  onSongEnded,
  onNext,
  onPrevious,
  hasNext = false,
  hasPrevious = false,
  audioRef,
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("repeatMode") as RepeatMode) || "off";
    }
    return "off";
  });
  const progressBarRef = useRef<HTMLDivElement>(null);
  const repeatModeRef = useRef<RepeatMode>(repeatMode);
  repeatModeRef.current = repeatMode;

  const cycleRepeatMode = () => {
    setRepeatMode((prev) => {
      const next = prev === "off" ? "all" : prev === "all" ? "one" : "off";
      localStorage.setItem("repeatMode", next);
      return next;
    });
  };

  // Auto-play when navigated here via repeat-all
  useEffect(() => {
    const shouldAutoPlay = localStorage.getItem("autoPlayNext") === "true";
    if (shouldAutoPlay && audioRef.current) {
      localStorage.removeItem("autoPlayNext");
      const play = () => {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      };
      // If metadata already loaded, play now; otherwise wait for it
      if (audioRef.current.readyState >= 1) {
        play();
      } else {
        const onReady = () => {
          play();
          audioRef.current.removeEventListener("loadedmetadata", onReady);
        };
        audioRef.current.addEventListener("loadedmetadata", onReady);
      }
    }
  }, [audioRef]);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      const t = audioRef.current.currentTime;
      setCurrentTime(t);
      onTimeUpdate(t);
    }
  }, [onTimeUpdate, audioRef]);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      const dur = audioRef.current.duration;
      setDuration(dur);
      onDurationLoaded(dur);
    }
  }, [onDurationLoaded, audioRef]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !audioRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    const time = pct * duration;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
    onTimeUpdate(time);
  };

  const seekToTime = (time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
    onTimeUpdate(time);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    const handleEnded = () => {
      const mode = repeatModeRef.current;
      if (mode === "one") {
        audio.currentTime = 0;
        audio.play();
      } else if (mode === "all") {
        setIsPlaying(false);
        onSongEnded?.("all");
      } else {
        setIsPlaying(false);
      }
    };
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [handleTimeUpdate, handleLoadedMetadata, audioRef, onSongEnded]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="backdrop-blur-xl bg-white/10 border-t border-white/10 px-6 py-4">
      <audio ref={audioRef} src={`/api/songs/${songId}/audio`} preload="metadata" />

      {/* Progress bar */}
      <div
        ref={progressBarRef}
        onClick={handleProgressClick}
        className="relative h-1.5 bg-white/15 rounded-full cursor-pointer mb-4 group hover:h-2 transition-all"
      >
        {/* Filled progress */}
        <div
          className="absolute top-0 left-0 h-full bg-white/80 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
        {/* Playhead dot */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `${progress}%`, transform: `translateX(-50%) translateY(-50%)` }}
        />
        {/* Moment markers */}
        {duration > 0 &&
          moments.map((m) => (
            <button
              key={m.id}
              onClick={(e) => {
                e.stopPropagation();
                seekToTime(m.timestampSec);
              }}
              className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-amber-400/90 hover:bg-amber-300 hover:scale-150 transition-all z-10"
              style={{
                left: `${(m.timestampSec / duration) * 100}%`,
                transform: `translateX(-50%) translateY(-50%)`,
              }}
              title={`${formatTime(m.timestampSec)}: ${m.prompt}`}
            />
          ))}
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Previous */}
          <button
            onClick={onPrevious}
            disabled={!hasPrevious}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 transition-all text-white flex-shrink-0"
            title="Previous song"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
            </svg>
          </button>

          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all text-white text-lg flex-shrink-0"
          >
            {isPlaying ? "⏸" : "▶"}
          </button>

          {/* Next */}
          <button
            onClick={onNext}
            disabled={!hasNext}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 transition-all text-white flex-shrink-0"
            title="Next song"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-white text-sm font-medium truncate">{songTitle}</h2>
          <div className="flex gap-2 text-xs text-white/50">
            <span>{formatTime(currentTime)}</span>
            <span>/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Repeat button — cycles: off → all → one */}
        <button
          onClick={cycleRepeatMode}
          className={`relative w-9 h-9 flex items-center justify-center rounded-full transition-all flex-shrink-0 ${
            repeatMode === "off"
              ? "bg-white/10 text-white/40 hover:bg-white/15"
              : "bg-white/20 text-white hover:bg-white/30"
          }`}
          title={
            repeatMode === "off"
              ? "Repeat off"
              : repeatMode === "all"
              ? "Repeat all"
              : "Repeat one"
          }
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="17 1 21 5 17 9" />
            <path d="M3 11V9a4 4 0 0 1 4-4h14" />
            <polyline points="7 23 3 19 7 15" />
            <path d="M21 13v2a4 4 0 0 1-4 4H3" />
          </svg>
          {repeatMode === "one" && (
            <span className="absolute -top-0.5 -right-0.5 text-[9px] font-bold bg-white text-black w-3.5 h-3.5 rounded-full flex items-center justify-center">
              1
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
