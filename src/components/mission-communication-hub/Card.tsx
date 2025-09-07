"use client";

export default function Card({ title, subtitle, tags, actions, children }: { title?: string; subtitle?: string; tags?: string[]; actions?: React.ReactNode; children?: React.ReactNode; }) {
  return (
    <div className="p-4 border rounded bg-white">
      {(title || subtitle) && (
        <div className="mb-2">
          {title && <div className="font-medium">{title}</div>}
          {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
        </div>
      )}
      {tags && (
        <div className="flex gap-2 flex-wrap mb-3">
          {tags.map(t => (
            <span key={t} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded border border-gray-200">{t}</span>
          ))}
        </div>
      )}
      {children}
      {actions && (
        <div className="mt-3 flex items-center gap-2">{actions}</div>
      )}
    </div>
  );
}


