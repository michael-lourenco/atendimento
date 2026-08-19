import { Agent } from './Agent';
import { agentEmailTaken, findAgentByEmail, normalizeAgentEmail } from './uniqueAgentEmail';

const now = new Date('2026-08-19');

const agent = (overrides: Partial<Agent> = {}): Agent => ({
  id: '1',
  name: 'Michael',
  email: 'devmichaellourenco@gmail.com',
  status: 'online',
  conversationsCount: 0,
  responseTime: '—',
  createdAt: now,
  ...overrides,
});

describe('uniqueAgentEmail', () => {
  it('normaliza trim e minúsculas', () => {
    expect(normalizeAgentEmail('  DevMichaelLourenco@gmail.com  ')).toBe(
      'devmichaellourenco@gmail.com'
    );
  });

  it('acha pelo e-mail ignorando maiúsculas', () => {
    expect(findAgentByEmail([agent()], 'DEVMICHAELLOURENCO@gmail.com')?.id).toBe('1');
  });

  it('e-mail ocupado por outro id', () => {
    expect(agentEmailTaken([agent()], 'devmichaellourenco@gmail.com')).toBe(true);
    expect(agentEmailTaken([agent()], 'devmichaellourenco@gmail.com', '1')).toBe(false);
    expect(agentEmailTaken([agent()], 'devmichaellourenco@gmail.com', 'outro')).toBe(true);
  });
});
