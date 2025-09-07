"use client";

export type FBReaction = "ok" | "like" | "love" | "sad" | "wow";

const EMOJI: Record<FBReaction, string> = {
  ok: "✅",
  like: "👍",
  love: "❤️",
  sad: "😢",
  wow: "😮",
};

export default function MessageReactions({ value, counts, onChange }: { value: FBReaction | null; counts: Record<FBReaction, number>; onChange: (r: FBReaction | null) => void; }) {
  const keys: FBReaction[] = ["ok", "like", "love", "wow", "sad"];
  return (
    <div className="mt-1">
      {/* Existing counts */}
      <div className="flex items-center gap-1 mb-1">
        {keys.map((k) => (
          counts[k] > 0 ? (
            <span key={k} className={`inline-flex items-center px-2 py-0.5 text-xs rounded border ${value === k ? 'bg-black text-white border-black' : 'border-gray-300 text-gray-700'}`}>
              <span className="mr-1" aria-hidden>{EMOJI[k]}</span>
              <span>{counts[k]}</span>
            </span>
          ) : null
        ))}
      </div>
      {/* Picker (visible on hover from parent .group) */}
      <div className="hidden group-hover:flex items-center gap-1">
        {keys.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => onChange(value === k ? null : k)}
            className={`px-2 py-1 text-xs rounded border transition-colors ${value === k ? 'bg-black text-white border-black' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            title={k}
          >
            <span className="mr-1" aria-hidden>{EMOJI[k]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}


