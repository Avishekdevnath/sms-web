"use client";

type ChannelItem = {
  _id: string;
  name: string;
  type: "mentor-messaging" | "group-discussion";
  lastMessageAt?: string;
};

export default function ChannelList({ channels, onSelect, showType = true }: { channels: ChannelItem[]; onSelect?: (id: string) => void; showType?: boolean; }) {
  return (
    <div className="space-y-2">
      {channels.map(ch => (
        <button key={ch._id} onClick={() => onSelect?.(ch._id)}
          className="w-full text-left p-3 border rounded hover:bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="font-medium">{ch.name}</div>
            {showType && <div className="text-xs text-gray-500">{ch.type}</div>}
          </div>
          {ch.lastMessageAt && (
            <div className="text-xs text-gray-500 mt-1">Last: {new Date(ch.lastMessageAt).toLocaleString()}</div>
          )}
        </button>
      ))}
      {channels.length === 0 && (
        <div className="text-sm text-gray-500">No channels yet.</div>
      )}
    </div>
  );
}


