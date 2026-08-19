import { isIncomingTab, isWaitingTab, matchesMineFilter } from './conversationTabs';

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

  it('minhas: Entrada não filtra dono; Esperando/Finalizados sim', () => {
    const mine = { assignedAgentId: '1' };
    const other = { assignedAgentId: '2' };
    expect(matchesMineFilter(mine, 'incoming', true, '1')).toBe(true);
    expect(matchesMineFilter(other, 'incoming', true, '1')).toBe(true);
    expect(matchesMineFilter(mine, 'waiting', true, '1')).toBe(true);
    expect(matchesMineFilter(other, 'waiting', true, '1')).toBe(false);
    expect(matchesMineFilter(other, 'waiting', false, '1')).toBe(true);
    expect(matchesMineFilter(other, 'closed', true, '1')).toBe(false);
    expect(matchesMineFilter(other, 'waiting', true, undefined)).toBe(true);
  });
});
