'use client';

import { useState } from 'react';
import { conversationAvatarLetter } from '@/core/entities/conversationInbox';
import { cn } from '@/ui/lib/utils';

type ConversationAvatarProps = {
  name: string;
  photoUrl?: string;
  className?: string;
};

export function ConversationAvatar({ name, photoUrl, className }: ConversationAvatarProps) {
  const [failed, setFailed] = useState(false);
  const showPhoto = Boolean(photoUrl) && !failed;

  return (
    <div
      className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/90 text-sm font-semibold text-primary-foreground',
        className
      )}
      aria-hidden
    >
      {showPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        conversationAvatarLetter(name)
      )}
    </div>
  );
}
