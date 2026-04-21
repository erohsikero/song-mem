"use client";

interface MomentCardProps {
  moment: {
    id: string;
    timestampSec: number;
    prompt: string;
    imagePath: string;
  };
  isActive: boolean;
  onSeek: (time: number) => void;
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function MomentCard({ moment, isActive, onSeek }: MomentCardProps) {
  return (
    <button
      onClick={() => onSeek(moment.timestampSec)}
      className={`flex gap-2.5 p-2 rounded-lg text-left transition-all w-full ${
        isActive
          ? "bg-white/20 ring-1 ring-white/30"
          : "bg-white/5 hover:bg-white/10"
      }`}
    >
      <img
        src={`/api/generated/${moment.imagePath.replace("/generated/", "")}`}
        alt={moment.prompt}
        className="w-12 h-12 rounded-md object-cover flex-shrink-0"
      />
      <div className="min-w-0 flex-1">
        <span className="text-xs text-white/50 font-mono">
          {formatTime(moment.timestampSec)}
        </span>
        <p className="text-xs text-white/70 line-clamp-2 mt-0.5">
          {moment.prompt}
        </p>
      </div>
    </button>
  );
}
