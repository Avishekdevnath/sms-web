"use client";

import type { FBReaction } from "./FBReactions";

const EMOJI: Record<FBReaction, string> = {
  ok: "✅",
  like: "👍",
  love: "❤️",
  sad: "😢",
  wow: "😮",
};

export default function FBReactionRow({ value, counts, onChange }: { value: FBReaction | null; counts?: Partial<Record<FBReaction, number>>; onChange: (r: FBReaction | null) => void; }) {
  const keys: FBReaction[] = ["ok", "like", "love", "wow", "sad"];
  return (
    <div className="flex items-center gap-2">
      {keys.map((k) => {
        const selected = value === k;
        const c = counts?.[k] ?? 0;
        return (
          <button
            key={k}
            type="button"
            onClick={() => onChange(selected ? null : k)}
            className={`px-2 py-1 text-sm rounded border transition-colors ${selected ? 'bg-black text-white border-black' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            title={k}
          >
            <span className="mr-1" aria-hidden>{EMOJI[k]}</span>
            {c > 0 && <span className={`text-xs ${selected ? 'text-white/80' : 'text-gray-500'}`}>{c}</span>}
          </button>
        );
      })}
    </div>
  );
}


