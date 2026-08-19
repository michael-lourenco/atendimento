import { assignmentFromOperator } from './assignmentFromOperator';
import { Agent } from './Agent';

const now = new Date('2026-08-19');

const agent = (overrides: Partial<Agent> = {}): Agent => ({
  id: '1',
  name: 'Michael',
  email: 'michael@atimo.local',
  status: 'online',
  departmentId: '1',
  conversationsCount: 0,
  responseTime: '—',
  createdAt: now,
  ...overrides,
});

describe('assignmentFromOperator', () => {
  it('liga pelo id do perfil', () => {
    expect(
      assignmentFromOperator({ id: '1', email: 'outro@x.com', name: 'Eu' }, [agent()])
    ).toEqual({
      agentId: '1',
      agentName: 'Michael',
      departmentId: '1',
      linked: true,
    });
  });

  it('liga pelo e-mail e marca linked', () => {
    expect(
      assignmentFromOperator(
        { id: 'uuid', email: 'michael@atimo.local', name: 'Admin' },
        [agent()]
      )
    ).toEqual({
      agentId: '1',
      agentName: 'Michael',
      departmentId: '1',
      linked: true,
    });
  });

  it('sem cadastro usa o login e linked false', () => {
    expect(
      assignmentFromOperator({ id: 'uuid', email: 'eu@firma.com', name: 'Eu' }, [agent()])
    ).toEqual({
      agentId: 'uuid',
      agentName: 'Eu',
      linked: false,
    });
  });
});
