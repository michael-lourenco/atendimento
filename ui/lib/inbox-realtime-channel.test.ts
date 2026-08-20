import { createInboxRealtimeHub, InboxRealtimeChannel, InboxRealtimeClient } from './inbox-realtime-channel';

function fakeClient(state: { subscribed: boolean; onCount: number; removed: number }): InboxRealtimeClient {
  const channel: InboxRealtimeChannel = {
    on(_event, _filter, _callback) {
      if (state.subscribed) {
        throw new Error('cannot add postgres_changes callbacks after subscribe()');
      }
      state.onCount += 1;
      return channel;
    },
    subscribe() {
      state.subscribed = true;
      return channel;
    },
  };
  return {
    channel: () => channel,
    removeChannel: () => {
      state.removed += 1;
      state.subscribed = false;
    },
  };
}

describe('createInboxRealtimeHub', () => {
  it('dois ouvintes não registram callbacks depois do subscribe', () => {
    const state = { subscribed: false, onCount: 0, removed: 0 };
    const hub = createInboxRealtimeHub(() => fakeClient(state));
    const leaveA = hub.add(() => {});
    const leaveB = hub.add(() => {});
    expect(state.onCount).toBe(2);
    expect(state.subscribed).toBe(true);
    leaveA();
    leaveB();
  });

  it('avisa todos os ouvintes no mesmo evento', () => {
    const seen: string[] = [];
    let emit: (() => void) | null = null;
    const hub = createInboxRealtimeHub(() => {
      const channel: InboxRealtimeChannel = {
        on(_event, _filter, callback) {
          emit = callback;
          return channel;
        },
        subscribe() {
          return channel;
        },
      };
      return { channel: () => channel, removeChannel: () => {} };
    });
    hub.add(() => seen.push('a'));
    hub.add(() => seen.push('b'));
    emit?.();
    expect(seen).toEqual(['a', 'b']);
  });

  it('reativa o mesmo canal se o último ouvinte sai e volta no mesmo tick', () => {
    jest.useFakeTimers();
    const state = { subscribed: false, onCount: 0, removed: 0 };
    const hub = createInboxRealtimeHub(() => fakeClient(state));
    const leave = hub.add(() => {});
    leave();
    hub.add(() => {});
    jest.runAllTimers();
    expect(state.onCount).toBe(2);
    expect(state.removed).toBe(0);
    jest.useRealTimers();
  });
});
