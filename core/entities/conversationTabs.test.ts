import { isIncomingTab, isWaitingTab } from './conversationTabs';

describe('conversationTabs', () => {
  it('conversa transferida fica em Esperando, não some da Entrada só', () => {
    const transferred = { status: 'transferred', assignedAgentId: '2' };
    expect(isIncomingTab(transferred)).toBe(false);
    expect(isWaitingTab(transferred)).toBe(true);
  });

  it('conversa waiting com agente fica em Esperando', () => {
    const waiting = { status: 'waiting', assignedAgentId: '1' };
    expect(isIncomingTab(waiting)).toBe(false);
    expect(isWaitingTab(waiting)).toBe(true);
  });
});
