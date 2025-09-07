"use client";

export default function UrlHighlighter({ text, linkClassName = "text-blue-600 underline" }: { text: string; linkClassName?: string }) {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s)]+)|(www\.[^\s)]+)/gi;
  const parts = text.split(urlRegex);
  return (
    <>
      {parts.map((part, idx) => {
        if (!part) return null;
        const isUrl = /^(https?:\/\/|www\.)/i.test(part);
        if (!isUrl) return <span key={idx}>{part}</span>;
        const href = part.startsWith('http') ? part : `http://${part}`;
        return (
          <a key={idx} href={href} target="_blank" rel="noopener noreferrer" className={`${linkClassName} break-all`}>
            {part}
          </a>
        );
      })}
    </>
  );
}


