export default function KeyValue({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-gray-600">{k}</span>
      <span className="text-sm font-medium">{v}</span>
    </div>
  );
} 