"use client";

import { useState, useEffect, useRef } from "react";
import SongList from "@/components/SongList";

export default function HomePage() {
  const [songs, setSongs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchSongs = async () => {
    const res = await fetch("/api/songs");
    const data = await res.json();
    setSongs(data);
  };

  useEffect(() => {
    fetchSongs();
  }, []);

  const uploadFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".mp3")) {
      setError("Only MP3 files are supported");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/songs/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      await fetchSongs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-white">Memory Music Player</h1>
        <p className="text-zinc-400 mt-2">
          Create AI-generated visual memories tied to moments in your music
        </p>
      </div>

      {/* Upload zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors mb-8 ${
          dragActive
            ? "border-violet-500 bg-violet-500/10"
            : "border-zinc-700 hover:border-zinc-500"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".mp3,audio/mpeg"
          onChange={handleFileChange}
          className="hidden"
        />
        {uploading ? (
          <p className="text-violet-400">Uploading...</p>
        ) : (
          <>
            <p className="text-zinc-300 text-lg">
              Drop an MP3 here or click to upload
            </p>
            <p className="text-zinc-500 text-sm mt-1">Max 50MB</p>
          </>
        )}
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 mb-6">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Song list */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Your Songs</h2>
        <SongList songs={songs} onDelete={() => fetchSongs()} />
      </div>
    </main>
  );
}
