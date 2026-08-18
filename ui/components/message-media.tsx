'use client';

import { useState } from 'react';
import { isPlayableMediaType } from '@/core/services/IMediaStorage';

type MessageMediaProps = {
  id: string;
  type: string;
  content: string;
};

export function MessageMedia({ id, type, content }: MessageMediaProps) {
  const [failed, setFailed] = useState(false);
  const src = `/api/messages/${encodeURIComponent(id)}/media`;

  if (!isPlayableMediaType(type) || failed) {
    return <span className="whitespace-pre-wrap">{content || '-'}</span>;
  }

  if (type === 'image') {
    return (
      <div className="space-y-1">
        <img
          src={src}
          alt={content || 'Imagem'}
          className="max-h-48 max-w-xs rounded border border-border object-contain"
          onError={() => setFailed(true)}
        />
        {content && content !== 'Imagem recebida' ? (
          <p className="text-xs text-muted-foreground">{content}</p>
        ) : null}
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
