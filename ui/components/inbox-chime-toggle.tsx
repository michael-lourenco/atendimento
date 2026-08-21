'use client';

import { useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/ui/components/button';
import { INBOX_CHIME_MUTE_KEY, isInboxChimeMuted } from '@/ui/lib/inbox-notify';

export function InboxChimeToggle() {
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    try {
      setMuted(isInboxChimeMuted(window.localStorage.getItem(INBOX_CHIME_MUTE_KEY)));
    } catch {
      setMuted(false);
    }
  }, []);

  const toggle = () => {
    const next = !muted;
    setMuted(next);
    try {
      window.localStorage.setItem(INBOX_CHIME_MUTE_KEY, next ? '1' : '0');
    } catch {
      /* ignore */
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={toggle}
      aria-label={muted ? 'Ativar avisos sonoros' : 'Silenciar avisos sonoros'}
      aria-pressed={muted}
      title={muted ? 'Avisos silenciados' : 'Avisos ligados'}
    >
      {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
    </Button>
  );
}
