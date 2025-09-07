"use client";

type ReactionKey = "ok" | "love" | "cry" | "haha" | "bulb";

const REACTION_TO_EMOJI: Record<ReactionKey, string> = {
  ok: "👍",
  love: "❤️",
  cry: "😢",
  haha: "😂",
  bulb: "💡",
};

export default function ReactionBar({ value, onChange, disabled = false, counts }: { value?: ReactionKey | null; onChange: (r: ReactionKey | null) => void; disabled?: boolean; counts?: Partial<Record<ReactionKey, number>>; }) {
  const keys: ReactionKey[] = ["ok", "love", "cry", "haha", "bulb"];
  return (
    <div className="flex items-center gap-2">
      {keys.map((k) => {
        const active = value === k;
        const c = counts?.[k] ?? 0;
        return (
          <button
            key={k}
            type="button"
            disabled={disabled}
            onClick={() => onChange(active ? null : k)}
            className={`px-3 py-1.5 text-sm rounded border transition-colors ${active ? 'bg-black text-white border-black' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            title={k}
          >
            <span className="mr-1" aria-hidden>{REACTION_TO_EMOJI[k]}</span>
            <span className="capitalize mr-1">{k}</span>
            {c > 0 && <span className={`text-xs ${active ? 'text-white/80' : 'text-gray-500'}`}>({c})</span>}
          </button>
        );
      })}
    </div>
  );
}


