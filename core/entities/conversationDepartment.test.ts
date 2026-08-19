import {
  agentsForDepartment,
  matchesDepartmentFilter,
} from './conversationDepartment';
import { Agent } from './Agent';

const now = new Date('2026-08-18T15:00:00Z');

function agent(id: string, departmentId?: string): Agent {
  return {
    id,
    name: id,
    email: `${id}@example.com`,
    status: 'online',
    departmentId,
    conversationsCount: 0,
    responseTime: '',
    createdAt: now,
  };
}

describe('matchesDepartmentFilter', () => {
  it('todos passa qualquer conversa', () => {
    expect(matchesDepartmentFilter({}, 'incoming', 'all')).toBe(true);
    expect(matchesDepartmentFilter({ departmentId: '1' }, 'waiting', 'all')).toBe(true);
  });

  it('sem setor só pega conversa sem departmentId', () => {
    expect(matchesDepartmentFilter({}, 'incoming', 'none')).toBe(true);
    expect(matchesDepartmentFilter({ departmentId: '1' }, 'incoming', 'none')).toBe(false);
  });

  it('Entrada com setor inclui sem setor e o setor escolhido', () => {
    expect(matchesDepartmentFilter({}, 'incoming', '1')).toBe(true);
    expect(matchesDepartmentFilter({ departmentId: '1' }, 'incoming', '1')).toBe(true);
    expect(matchesDepartmentFilter({ departmentId: '2' }, 'incoming', '1')).toBe(false);
  });

  it('Esperando/Finalizados só o setor escolhido', () => {
    expect(matchesDepartmentFilter({}, 'waiting', '1')).toBe(false);
    expect(matchesDepartmentFilter({ departmentId: '1' }, 'waiting', '1')).toBe(true);
    expect(matchesDepartmentFilter({ departmentId: '1' }, 'closed', '2')).toBe(false);
  });
});

describe('agentsForDepartment', () => {
  const agents = [agent('1', 'vendas'), agent('2', 'suporte'), agent('3')];

  it('sem setor da conversa lista todos', () => {
    expect(agentsForDepartment(agents, undefined).map((item) => item.id)).toEqual(['1', '2', '3']);
  });

  it('com setor lista só os do mesmo', () => {
    expect(agentsForDepartment(agents, 'vendas').map((item) => item.id)).toEqual(['1']);
  });

  it('se ninguém no setor, lista todos', () => {
    expect(agentsForDepartment(agents, 'financeiro').map((item) => item.id)).toEqual(['1', '2', '3']);
  });
});
