'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Conversation } from '@/core/entities/Conversation';
import { threadsForContactPhone } from '@/core/entities/conversationThread';
import { WhatsAppNumber } from '@/core/entities/WhatsAppNumber';
import { lineNameOf } from '@/core/entities/whatsappNumberLine';
import { ActionMenu, ActionMenuItem } from '@/ui/components/action-menu';
import { buttonVariants } from '@/ui/components/button';
import { inboxHrefForContactThreads, inboxHrefForConversation } from '@/ui/lib/inbox-href';
import { cn } from '@/ui/lib/utils';

type ContactTalkLinkProps = {
  phone: string;
  conversations: Conversation[];
  numbers: WhatsAppNumber[];
};

export function ContactTalkLink({ phone, conversations, numbers }: ContactTalkLinkProps) {
  const router = useRouter();
  const threads = threadsForContactPhone(conversations, phone);
  if (threads.length <= 1) {
    return (
      <Link
        href={inboxHrefForContactThreads(phone, threads)}
        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
      >
        Conversar
      </Link>
    );
  }

  return (
    <ActionMenu label="Conversar" ariaLabel="Escolher linha da conversa">
      {(close) =>
        threads.map((thread) => (
          <ActionMenuItem
            key={thread.id}
            onClick={() => {
              router.push(inboxHrefForConversation(thread.id));
              close();
            }}
          >
            {lineNameOf(numbers, thread) || 'Linha'}
          </ActionMenuItem>
        ))
      }
    </ActionMenu>
  );
}
