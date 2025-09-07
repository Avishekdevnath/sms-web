type TypingEvent = { channelKey: string; user: string; typing: boolean; ts: number };

class TypingBus {
  private listeners: Map<string, Set<(ev: TypingEvent) => void>> = new Map();

  subscribe(channelKey: string, handler: (ev: TypingEvent) => void): () => void {
    const key = channelKey;
    if (!this.listeners.has(key)) this.listeners.set(key, new Set());
    const set = this.listeners.get(key)!;
    set.add(handler);
    return () => {
      try { set.delete(handler); } catch {}
    };
  }

  emit(ev: TypingEvent) {
    const set = this.listeners.get(ev.channelKey);
    if (!set) return;
    for (const fn of set) {
      try { fn(ev); } catch {}
    }
  }
}

export const typingBus = new TypingBus();





