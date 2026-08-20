export type InboxRealtimeChannel = {
  on: (
    event: 'postgres_changes',
    filter: { event: string; schema: string; table: string },
    callback: () => void
  ) => InboxRealtimeChannel;
  subscribe: () => InboxRealtimeChannel;
};

export type InboxRealtimeClient = {
  channel: (name: string) => InboxRealtimeChannel;
  removeChannel: (channel: InboxRealtimeChannel) => void | Promise<unknown>;
};

const CHANNEL_NAME = 'inbox-live';

export function createInboxRealtimeHub(createClient: () => InboxRealtimeClient) {
  const listeners = new Set<() => void>();
  let client: InboxRealtimeClient | null = null;
  let channel: InboxRealtimeChannel | null = null;
  let teardown: ReturnType<typeof setTimeout> | null = null;

  function fanout() {
    listeners.forEach((listener) => listener());
  }

  function ensureChannel() {
    if (teardown) {
      clearTimeout(teardown);
      teardown = null;
    }
    if (channel) {
      return;
    }
    client = createClient();
    channel = client
      .channel(CHANNEL_NAME)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, fanout)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, fanout)
      .subscribe();
  }

  return {
    add(listener: () => void) {
      listeners.add(listener);
      ensureChannel();
      return () => {
        listeners.delete(listener);
        if (listeners.size > 0 || !client || !channel) {
          return;
        }
        const heldClient = client;
        const heldChannel = channel;
        teardown = setTimeout(() => {
          teardown = null;
          if (listeners.size > 0) {
            return;
          }
          void heldClient.removeChannel(heldChannel);
          if (channel === heldChannel) {
            channel = null;
            client = null;
          }
        }, 0);
      };
    },
  };
}
