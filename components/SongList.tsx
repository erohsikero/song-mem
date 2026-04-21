"use client";

import Link from "next/link";
import { useState } from "react";

interface Song {
  id: string;
  originalName: string;
  durationSec: number;
  sizeBytes: number;
  createdAt: string;
  _count: { moments: number };
}

interface SongListProps {
  songs: Song[];
  onDelete?: (songId: string) => void;
}

function formatSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

function formatTime(s: number): string {
  if (s <= 0) return "--:--";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function SongList({ songs, onDelete }: SongListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, songId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (confirmId !== songId) {
      setConfirmId(songId);
      return;
    }

    setDeletingId(songId);
    setConfirmId(null);
    try {
      const res = await fetch(`/api/songs/${songId}`, { method: "DELETE" });
      if (res.ok) {
        onDelete?.(songId);
      }
    } catch {
      // Failed to delete
    } finally {
      setDeletingId(null);
    }
  };

  const handleCancelConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmId(null);
  };

  if (songs.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500">
        <p className="text-lg">No songs yet</p>
        <p className="text-sm mt-1">Upload an MP3 to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {songs.map((song) => (
        <Link
          key={song.id}
          href={`/song/${song.id}`}
          className="flex items-center gap-4 p-4 bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors group"
        >
          <div className="w-10 h-10 rounded-lg bg-violet-600/20 flex items-center justify-center text-violet-400 group-hover:bg-violet-600/30 transition-colors">
            ♪
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate">
              {song.originalName.replace(/\.mp3$/i, "")}
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              {formatTime(song.durationSec)} &middot; {formatSize(song.sizeBytes)}
              {song._count.moments > 0 && (
                <> &middot; {song._count.moments} moment{song._count.moments !== 1 ? "s" : ""}</>
              )}
            </p>
          </div>

          {/* Delete button */}
          {confirmId === song.id ? (
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={(e) => handleDelete(e, song.id)}
                disabled={deletingId === song.id}
                className="text-xs px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 text-white transition-colors"
              >
                {deletingId === song.id ? "..." : "Confirm"}
              </button>
              <button
                onClick={handleCancelConfirm}
                className="text-xs px-2.5 py-1 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => handleDelete(e, song.id)}
              className="text-zinc-600 hover:text-red-400 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
              title="Delete song"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          )}
        </Link>
      ))}
    </div>
  );
}
