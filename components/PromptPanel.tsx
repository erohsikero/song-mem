"use client";

import { useState } from "react";

interface PromptPanelProps {
  songId: string;
  currentTime: number;
  disabled: boolean;
  onMomentCreated: () => void;
}

export default function PromptPanel({
  songId,
  currentTime,
  disabled,
  onMomentCreated,
}: PromptPanelProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/moments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          songId,
          timestampSec: Math.round(currentTime * 10) / 10,
          prompt: prompt.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate image");
      }

      setPrompt("");
      onMomentCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-white/50 uppercase tracking-wider">Create a Memory</h3>
        <span className="text-xs text-white/60 font-mono">
          @ {formatTime(currentTime)}
        </span>
      </div>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe the image you see in this moment..."
        className="w-full bg-white/10 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-white/30 transition-colors"
        rows={2}
        disabled={loading || disabled}
      />

      {error && (
        <p className="text-red-400 text-xs">{error}</p>
      )}

      <button
        onClick={handleGenerate}
        disabled={!prompt.trim() || loading || disabled}
        className="w-full py-2 rounded-lg bg-white/20 hover:bg-white/30 disabled:bg-white/5 disabled:text-white/30 text-white text-sm font-medium transition-colors"
      >
        {loading
          ? "Generating..."
          : "Generate Image for This Moment"}
      </button>
    </div>
  );
}
