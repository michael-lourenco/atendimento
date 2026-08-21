'use client';

import { highlightQueryMatches } from '@/ui/lib/highlight-query';

type HighlightedTextProps = {
  text: string;
  query: string;
};

export function HighlightedText({ text, query }: HighlightedTextProps) {
  return (
    <span className="whitespace-pre-wrap break-words">
      {highlightQueryMatches(text, query).map((part, index) =>
        part.match ? (
          <mark
            key={`${index}-${part.text}`}
            className="rounded bg-amber-200/90 px-0.5 text-inherit dark:bg-amber-500/50"
          >
            {part.text}
          </mark>
        ) : (
          <span key={`${index}-${part.text}`}>{part.text}</span>
        )
      )}
    </span>
  );
}
