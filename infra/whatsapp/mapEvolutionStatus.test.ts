import { isEvolutionInboxEvent, mapEvolutionStatusUpdates } from './mapEvolutionStatus';

describe('mapEvolutionStatusUpdates', () => {
  it('lê messages.update com status em texto', () => {
    expect(
      mapEvolutionStatusUpdates({
        event: 'MESSAGES_UPDATE',
        data: { keyId: 'abc', status: 'READ' },
      })
    ).toEqual([{ id: 'abc', status: 'read' }]);
  });

  it('lê ack numérico no key', () => {
    expect(
      mapEvolutionStatusUpdates({
        event: 'messages.update',
        data: { key: { id: 'wamid-1' }, status: 3 },
      })
    ).toEqual([{ id: 'wamid-1', status: 'delivered' }]);
  });

  it('ignora upsert', () => {
    expect(
      mapEvolutionStatusUpdates({
        event: 'messages.upsert',
        data: { key: { id: 'x' }, status: 'READ' },
      })
    ).toEqual([]);
  });

  it('só upsert e update entram no inbox do webhook', () => {
    expect(isEvolutionInboxEvent('MESSAGES_UPSERT')).toBe(true);
    expect(isEvolutionInboxEvent('messages.update')).toBe(true);
    expect(isEvolutionInboxEvent('messages.reaction')).toBe(true);
    expect(isEvolutionInboxEvent('CONNECTION_UPDATE')).toBe(false);
    expect(isEvolutionInboxEvent('presence.update')).toBe(false);
  });
});
