import { FlowStep } from '../entities/Flow';
import { isValidFlowStepMediaUrl } from '../services/IMediaStorage';
import { trueStepIdForOption } from './flowOptionPaths';
import { listQuestionOptions } from './questionOptions';
import { visibleFlowSteps } from './visibleFlowSteps';

export type FlowHealthIssue = {
  stepId?: string;
  message: string;
};

function pointedStepIds(steps: FlowStep[]): Set<string> {
  const visible = new Set(visibleFlowSteps(steps).map(({ step }) => step.id));
  const pointed = new Set<string>();
  const add = (id?: string) => {
    if (id && visible.has(id)) {
      pointed.add(id);
    }
  };

  for (const { step } of visibleFlowSteps(steps)) {
    if (step.type === 'question') {
      const options = listQuestionOptions(step);
      if (options.length > 0) {
        for (const option of options) {
          add(trueStepIdForOption(steps, step, option));
        }
        continue;
      }
    }
    if (step.type === 'condition' && step.condition) {
      add(step.condition.trueStepId);
      add(step.condition.falseStepId);
      continue;
    }
    if (step.action?.type === 'handoff') {
      continue;
    }
    add(step.nextStepId);
  }

  return pointed;
}

export function flowHealthIssues(
  steps: FlowStep[],
  flows: { id: string; isActive?: boolean }[] = []
): FlowHealthIssue[] {
  const issues: FlowHealthIssue[] = [];
  const visible = visibleFlowSteps(steps);
  const ids = new Set(steps.map((step) => step.id));
  const pointed = pointedStepIds(steps);
  const startId = steps[0]?.id;

  for (const { step } of visible) {
    if (startId && step.id !== startId && !pointed.has(step.id) && visible.length > 1) {
      issues.push({ stepId: step.id, message: 'Bloco solto (nada liga até aqui)' });
    }
    if (step.type === 'question') {
      const options = listQuestionOptions(step);
      if (options.length === 0) {
        issues.push({ stepId: step.id, message: 'Pergunta sem opções' });
      }
      for (const option of options) {
        const target = trueStepIdForOption(steps, step, option);
        if (!target || !ids.has(target)) {
          issues.push({ stepId: step.id, message: `Opção “${option}” sem destino` });
        }
      }
      continue;
    }
    if (step.action?.type === 'goToFlow') {
      const flowId = step.action.flowId.trim();
      if (!flowId) {
        issues.push({ stepId: step.id, message: 'Ir para fluxo sem destino' });
      } else {
        const target = flows.find((item) => item.id === flowId);
        if (!target || target.isActive === false) {
          issues.push({ stepId: step.id, message: 'Fluxo destino inativo ou inexistente' });
        }
      }
      continue;
    }
    if (step.action?.type === 'setDepartment') {
      if (!step.action.departmentId.trim()) {
        issues.push({ stepId: step.id, message: 'Definir setor sem setor' });
      }
      continue;
    }
    if (step.type === 'message') {
      if (!step.content.trim() && !step.mediaUrl?.trim()) {
        issues.push({ stepId: step.id, message: 'Mensagem sem texto nem mídia' });
      }
      if (step.mediaUrl?.trim() && !isValidFlowStepMediaUrl(step.mediaUrl)) {
        issues.push({ stepId: step.id, message: 'URL de mídia inválida' });
      }
    }
  }

  return issues;
}

export function issuesForStep(issues: FlowHealthIssue[], stepId: string): FlowHealthIssue[] {
  return issues.filter((issue) => issue.stepId === stepId);
}
