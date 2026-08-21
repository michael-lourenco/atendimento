'use client';

import { useState } from 'react';
import { isPlayableMediaType } from '@/core/services/IMediaStorage';
import { ImageLightbox } from '@/ui/components/image-lightbox';
import { HighlightedText } from '@/ui/components/highlighted-text';

type MessageMediaProps = {
  id: string;
  type: string;
  content: string;
  highlightQuery?: string;
};

export function MessageMedia({ id, type, content, highlightQuery = '' }: MessageMediaProps) {
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const src = `/api/messages/${encodeURIComponent(id)}/media`;
  const alt = content || 'Imagem';

  if (!isPlayableMediaType(type) || failed) {
    return <HighlightedText text={content || '-'} query={highlightQuery} />;
  }

  if (type === 'image') {
    return (
      <div className="space-y-1">
        <button
          type="button"
          className="block max-w-xs text-left"
          aria-label="Ampliar imagem"
          onClick={(event) => {
            event.stopPropagation();
            setOpen(true);
          }}
        >
          <img
            src={src}
            alt={alt}
            className="max-h-48 max-w-xs cursor-zoom-in rounded border border-border object-contain"
            onError={() => setFailed(true)}
          />
        </button>
        {content && content !== 'Imagem recebida' ? (
          <p className="text-xs text-muted-foreground">{content}</p>
        ) : null}
        {open ? <ImageLightbox src={src} alt={alt} onClose={() => setOpen(false)} /> : null}
      </div>
    );
  }

  if (type === 'audio') {
    return (
      <audio controls src={src} className="w-56" onError={() => setFailed(true)}>
        Seu navegador não reproduz áudio.
      </audio>
    );
  }

  if (type === 'video') {
    return (
      <video
        controls
        src={src}
        className="max-h-48 max-w-xs rounded border border-border"
        onError={() => setFailed(true)}
      >
        Seu navegador não reproduz vídeo.
      </video>
    );
  }

  return (
    <a href={src} target="_blank" rel="noreferrer" className="text-primary underline">
      {content || 'Baixar arquivo'}
    </a>
  );
}
