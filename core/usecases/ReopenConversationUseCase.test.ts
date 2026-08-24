import { MockConversationRepository } from '../../infra/mocks/MockConversationRepository';
import { ReopenConversationUseCase } from './ReopenConversationUseCase';

describe('ReopenConversationUseCase', () => {
  it('reabre e solta o dono', async () => {
    const repo = new MockConversationRepository();
    const closed = await repo.getById('5');
    expect(closed?.status).toBe('closed');
    expect(closed?.assignedAgentId).toBe('2');

    const updated = await new ReopenConversationUseCase(repo).execute('5');
    expect(updated?.status).toBe('open');
    expect(updated?.assignedAgentId).toBeUndefined();
    expect(updated?.assignedAgentName).toBeUndefined();
  });
});
