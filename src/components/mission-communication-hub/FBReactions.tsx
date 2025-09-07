"use client";

import { useEffect, useRef, useState } from "react";

export type FBReaction = "ok" | "like" | "love" | "sad" | "wow";

const EMOJI: Record<FBReaction, string> = {
  ok: "✅",
  like: "👍",
  love: "❤️",
  sad: "😢",
  wow: "😮",
};

export default function FBReactions({ value, onChange, counts }: { value: FBReaction | null; onChange: (r: FBReaction | null) => void; counts?: Partial<Record<FBReaction, number>>; }) {
  const keys: FBReaction[] = ["ok", "like", "love", "wow", "sad"];
  const activeEmoji = value ? EMOJI[value] : "🙂";
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
      >
        <span className="mr-1" aria-hidden>{activeEmoji}</span>
        React
      </button>

      {open && (
        <div className="absolute left-0 mt-2 flex bg-white border border-gray-200 rounded shadow-lg p-2 z-10">
          {keys.map((k) => {
            const selected = value === k;
            const c = counts?.[k] ?? 0;
            return (
              <button
                key={k}
                type="button"
                onClick={() => {
                  onChange(selected ? null : k);
                  setOpen(false);
                }}
                className={`mx-1 px-3 py-1.5 text-sm rounded border transition-colors ${selected ? 'bg-black text-white border-black' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                title={k}
              >
                <span className="mr-1" aria-hidden>{EMOJI[k]}</span>
                <span className="capitalize mr-1">{k}</span>
                {c > 0 && <span className={`text-xs ${selected ? 'text-white/80' : 'text-gray-500'}`}>({c})</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}


