import { queueToneOf, onOffTone } from './status-tone';

describe('status-tone', () => {
  it('pinta a fila: entrada, esperando e finalizado', () => {
    expect(queueToneOf({ status: 'open' })).toBe('incoming');
    expect(queueToneOf({ status: 'open', assignedAgentId: 'a1' })).toBe('waiting');
    expect(queueToneOf({ status: 'waiting', assignedAgentId: 'a1' })).toBe('waiting');
    expect(queueToneOf({ status: 'transferred', assignedAgentId: 'a2' })).toBe('waiting');
    expect(queueToneOf({ status: 'closed' })).toBe('closed');
  });

  it('ligado é sucesso e desligado é mudo', () => {
    expect(onOffTone(true)).toBe('success');
    expect(onOffTone(false)).toBe('muted');
  });
});
