"use client";

import { useState } from "react";
import UrlHighlighter from "./UrlHighlighter";

// Enhanced Markdown renderer: headings, bold/italic/underline/strike, lists (bulleted/numbered),
// block quotes, checklists, code (inline/fenced), simple tables, images, spoilers, and mentions.
export default function MarkdownViewer({ text }: { text?: string }) {
  if (!text) return null;

  const blocks = text.split(/```[\r\n]?/);
  const out: React.ReactNode[] = [];

  blocks.forEach((block, idx) => {
    if (idx % 2 === 1) {
      out.push(
        <pre key={`code-${idx}`} className="bg-gray-900 text-gray-100 text-sm rounded p-3 overflow-x-auto">
          <code>{block}</code>
        </pre>
      );
      return;
    }

    const lines = block.split(/\r?\n/);

    let listItems: { text: string; ordered: boolean; checked?: boolean }[] = [];
    let inTable = false;
    let tableRows: string[][] = [];
    let emittedAny = false;
    let justEmittedHeading = false;

    const flushList = () => {
      if (!listItems.length) return;
      const ordered = listItems[0].ordered;
      const ListTag = ordered ? 'ol' : 'ul';
      out.push(
        <List key={`list-${idx}-${out.length}`} ordered={ordered} items={listItems} />
      );
      listItems = [];
      emittedAny = true;
      justEmittedHeading = false;
    };

    const flushTable = () => {
      if (!inTable || !tableRows.length) return;
      out.push(<Table key={`tbl-${idx}-${out.length}`} rows={tableRows} />);
      inTable = false;
      tableRows = [];
      emittedAny = true;
      justEmittedHeading = false;
    };

    lines.forEach((line, li) => {
      // table detection
      if (/\|/.test(line)) {
        const row = line.split(/\s*\|\s*/).filter((c, i, a) => !(i === 0 && c === "") && !(i === a.length - 1 && c === ""));
        if (row.length >= 2) {
          inTable = true;
          tableRows.push(row);
          return;
        }
      } else if (inTable) {
        flushTable();
      }

      const heading = line.match(/^(#{1,6})\s+(.*)$/);
      if (heading) {
        flushList();
        flushTable();
        const level = heading[1].length;
        const content = heading[2];
        const size = level === 1 ? 'text-xl' : level === 2 ? 'text-lg' : level === 3 ? 'text-base' : 'text-sm';
        out.push(
          <div key={`h-${idx}-${li}`} className={`font-semibold ${size}`}>{renderInline(content)}</div>
        );
        emittedAny = true;
        justEmittedHeading = true;
        return;
      }

      const blockquote = line.match(/^>\s?(.*)$/);
      if (blockquote) {
        flushList();
        flushTable();
        out.push(
          <div key={`bq-${idx}-${li}`} className="border-l-4 pl-3 text-sm text-gray-700 italic">{renderInline(blockquote[1])}</div>
        );
        emittedAny = true;
        justEmittedHeading = false;
        return;
      }

      const ol = line.match(/^\s*\d+\.\s+(.*)$/);
      const ul = line.match(/^\s*[-*+]\s+(.*)$/);
      const check = line.match(/^\s*-\s+\[( |x|X)\]\s+(.*)$/);

      const pushListItem = (ordered: boolean, text: string, checked?: boolean) => {
        if (listItems.length && listItems[0].ordered !== ordered) {
          flushList();
        }
        listItems.push({ text, ordered, checked });
      };

      if (check) {
        pushListItem(false, check[2], /x/i.test(check[1]));
        return;
      }
      if (ol) {
        pushListItem(true, ol[1]);
        return;
      }
      if (ul) {
        pushListItem(false, ul[1]);
        return;
      }

      // paragraph or blank
      flushList();
      flushTable();
      if (line.trim().length === 0) {
        if (!emittedAny) {
          return; // skip leading blank lines in a block
        }
        if (justEmittedHeading) {
          justEmittedHeading = false; // skip the first blank line right after a heading
          return;
        }
        out.push(<div key={`br-${idx}-${li}`} className="h-1" />);
      } else {
        out.push(<p key={`p-${idx}-${li}`} className="whitespace-pre-wrap text-sm">{renderInline(line)}</p>);
        emittedAny = true;
        justEmittedHeading = false;
      }
    });

    flushList();
    flushTable();
  });

  return <div className="space-y-1">{out}</div>;
}

function renderInline(src: string): React.ReactNode {
  // links [text](url)
  let text = src
    .replace(/\*\*(.*?)\*\*/g, (m, p1) => `§b§${p1}§/b§`)
    .replace(/\*(.*?)\*/g, (m, p1) => `§i§${p1}§/i§`)
    .replace(/__(.*?)__/g, (m, p1) => `§u§${p1}§/u§`)
    .replace(/~~(.*?)~~/g, (m, p1) => `§s§${p1}§/s§`)
    .replace(/\|\|(.*?)\|\|/g, (m, p1) => `§spoiler§${p1}§/spoiler§`)
    .replace(/!\[(.*?)\]\((.*?)\)/g, (m, p1, p2) => `§img§${p1}§${p2}§/img§`)
    .replace(/\[(.*?)\]\((.*?)\)/g, (m, p1, p2) => `§a§${p1}§${p2}§/a§`)
    .replace(/`([^`]+)`/g, (m, p1) => `§code§${p1}§/code§`);

  const parts = text.split(/(§(?:b|i|u|s|spoiler|a|code|img)§.*?§\/(?:b|i|u|s|spoiler|a|code|img)§)/);
  return (
    <>
      {parts.map((part, idx) => {
        const tagMatch = part.match(/^§(b|i|u|s|spoiler|a|code|img)§([\s\S]*?)§\/(\1)§$/);
        if (!tagMatch) {
          // mentions @word
          const mentionized = part.split(/(@[a-zA-Z0-9_]+)/g).map((seg, i) => (
            i % 2 === 1 ? <span key={`m-${idx}-${i}`} className="text-blue-600">{seg}</span> : <UrlHighlighter key={`t-${idx}-${i}`} text={seg} />
          ));
          return <span key={idx}>{mentionized}</span>;
        }
        const kind = tagMatch[1];
        const content = tagMatch[2];
        if (kind === 'b') return <strong key={idx}>{renderInline(content)}</strong>;
        if (kind === 'i') return <em key={idx}>{renderInline(content)}</em>;
        if (kind === 'u') return <span key={idx} className="underline">{renderInline(content)}</span>;
        if (kind === 's') return <span key={idx} className="line-through">{renderInline(content)}</span>;
        if (kind === 'code') return <code key={idx} className="bg-gray-100 text-gray-800 px-1 rounded text-[0.9em]">{content}</code>;
        if (kind === 'a') {
          const [label, href] = content.split('§');
          return <a key={idx} href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all">{label}</a>;
        }
        if (kind === 'spoiler') return <Spoiler key={idx} text={content} />;
        if (kind === 'img') {
          const [alt, src] = content.split('§');
          return (
            <a key={idx} href={src} target="_blank" rel="noopener noreferrer" className="inline-block align-middle">
              <img alt={alt} src={src} className="max-w-full max-h-64 w-auto rounded object-contain" />
            </a>
          );
        }
        return <span key={idx}>{content}</span>;
      })}
    </>
  );
}

function List({ ordered, items }: { ordered: boolean; items: { text: string; ordered: boolean; checked?: boolean }[] }) {
  const Tag: any = ordered ? 'ol' : 'ul';
  return (
    <Tag className={`${ordered ? 'list-decimal' : 'list-disc'} list-inside space-y-1`}>
      {items.map((it, i) => (
        <li key={i} className="text-sm">
          {typeof it.checked === 'boolean' ? (
            <span className="mr-2">{it.checked ? '☑' : '☐'}</span>
          ) : null}
          {renderInline(it.text)}
        </li>
      ))}
    </Tag>
  );
}

function Table({ rows }: { rows: string[][] }) {
  if (!rows.length) return null;
  const header = rows[0];
  let data = rows.slice(1);
  // If second row is separator like ---|---, drop it
  if (data.length && data[0].every(cell => /^-{3,}$/.test(cell.trim()))) {
    data = data.slice(1);
  }
  return (
    <div className="overflow-x-auto">
      <table className="text-sm border border-gray-200 rounded w-full">
        <thead className="bg-gray-50">
          <tr>
            {header.map((h, i) => (
              <th key={i} className="text-left px-2 py-1 border-b border-gray-200">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, r) => (
            <tr key={r} className="even:bg-gray-50/40">
              {row.map((c, i) => (
                <td key={i} className="px-2 py-1 border-b border-gray-100">{renderInline(c)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Spoiler({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span onClick={() => setOpen(o => !o)} className={`cursor-pointer px-1 rounded ${open ? '' : 'bg-gray-300 text-gray-300 hover:text-inherit hover:bg-transparent'}`}>{text}</span>
  );
}


