"use client";

export default function ResourceModal({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: React.ReactNode; }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-lg rounded shadow-xl">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div className="font-semibold">{title}</div>
            <button onClick={onClose} className="text-sm text-gray-600 hover:text-black">Close</button>
          </div>
          <div className="p-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}


