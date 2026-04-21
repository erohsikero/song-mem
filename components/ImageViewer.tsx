"use client";

interface ImageViewerProps {
  imagePath: string | null;
  prompt: string | null;
  timestampSec: number | null;
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function ImageViewer({
  imagePath,
  prompt,
  timestampSec,
}: ImageViewerProps) {
  if (!imagePath) {
    return (
      <div className="bg-zinc-900 rounded-xl aspect-square flex items-center justify-center">
        <p className="text-zinc-600 text-sm text-center px-8">
          Play a song and create your first memory moment
        </p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 rounded-xl overflow-hidden">
      <div className="aspect-square relative">
        <img
          src={`/api/generated/${imagePath.replace("/generated/", "")}`}
          alt={prompt || "Generated image"}
          className="w-full h-full object-cover"
        />
      </div>
      {prompt && (
        <div className="p-3 space-y-1">
          {timestampSec != null && (
            <span className="text-xs text-violet-400 font-mono">
              {formatTime(timestampSec)}
            </span>
          )}
          <p className="text-sm text-zinc-300">{prompt}</p>
        </div>
      )}
    </div>
  );
}
