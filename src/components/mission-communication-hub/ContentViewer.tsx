"use client";

import UrlHighlighter from "./UrlHighlighter";

export default function ContentViewer({ content }: { content?: string }) {
  return (
    <div className="text-sm text-gray-800 whitespace-pre-wrap">
      <UrlHighlighter text={content || "(No content)"} />
    </div>
  );
}


