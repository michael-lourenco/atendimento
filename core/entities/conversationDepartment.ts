import { Agent } from './Agent';
import { Department } from './Department';

export type QueueTab = 'incoming' | 'waiting' | 'closed';
export type DepartmentFilter = 'all' | 'none' | string;

export function matchesDepartmentFilter(
  conversation: { departmentId?: string },
  tab: QueueTab,
  departmentFilter: DepartmentFilter
): boolean {
  if (departmentFilter === 'all') {
    return true;
  }
  if (departmentFilter === 'none') {
    return !conversation.departmentId;
  }
  if (tab === 'incoming') {
    return !conversation.departmentId || conversation.departmentId === departmentFilter;
  }
  return conversation.departmentId === departmentFilter;
}

export function agentsForDepartment(agents: Agent[], departmentId?: string): Agent[] {
  if (!departmentId) {
    return agents;
  }
  const same = agents.filter((agent) => agent.departmentId === departmentId);
  return same.length > 0 ? same : agents;
}

export function departmentNameOf(departments: Department[], departmentId?: string): string {
  if (!departmentId) {
    return '';
  }
  return departments.find((item) => item.id === departmentId)?.name ?? '';
}
