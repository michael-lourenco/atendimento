'use client';

import { FlowStep } from '@/core/entities/Flow';
import { Department } from '@/core/entities/Department';
import { Button } from '@/ui/components/button';
import { Label } from '@/ui/components/label';
import { flowSelectClass } from '@/ui/components/flow-next-step-select';

type FlowStepActionFieldsProps = {
  step: FlowStep;
  departments: Department[];
  jumpTargets: { id: string; name: string }[];
  onPatch: (next: FlowStep) => void;
  onOpenFlow?: (flowId: string) => void;
};

function actionKind(step: FlowStep): 'setDepartment' | 'goToFlow' | 'handoff' {
  if (step.action?.type === 'goToFlow') {
    return 'goToFlow';
  }
  if (step.action?.type === 'handoff') {
    return 'handoff';
  }
  return 'setDepartment';
}

export function FlowStepActionFields({
  step,
  departments,
  jumpTargets,
  onPatch,
  onOpenFlow,
}: FlowStepActionFieldsProps) {
  const kind = actionKind(step);
  const departmentId =
    step.action?.type === 'setDepartment' || step.action?.type === 'handoff'
      ? step.action.departmentId ?? ''
      : '';
  const flowId = step.action?.type === 'goToFlow' ? step.action.flowId : '';

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Esta ação</Label>
        <select
          className={flowSelectClass}
          value={kind}
          aria-label="Tipo da ação"
          onChange={(event) => {
            const value = event.target.value;
            if (value === 'goToFlow') {
              onPatch({ ...step, action: { type: 'goToFlow', flowId: '' } });
              return;
            }
            if (value === 'handoff') {
              onPatch({ ...step, action: { type: 'handoff', departmentId: '' } });
              return;
            }
            onPatch({ ...step, action: { type: 'setDepartment', departmentId: '' } });
          }}
        >
          <option value="setDepartment">Definir setor</option>
          <option value="goToFlow">Ir para outro fluxo</option>
          <option value="handoff">Passar para atendente</option>
        </select>
      </div>
      {kind === 'goToFlow' ? (
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Fluxo destino</Label>
          <select
            className={flowSelectClass}
            value={flowId}
            aria-label="Fluxo destino"
            onChange={(event) =>
              onPatch({ ...step, action: { type: 'goToFlow', flowId: event.target.value } })
            }
          >
            <option value="">Escolha o fluxo…</option>
            {jumpTargets.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          {flowId ? (
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenFlow?.(flowId)}>
              Abrir esse fluxo
            </Button>
          ) : null}
          <p className="text-xs text-muted-foreground">
            Ligue “Ao voltar” no quadro para retomar este roteiro quando o destino acabar.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">
            {kind === 'handoff' ? 'Setor (opcional)' : 'Setor da conversa'}
          </Label>
          <select
            className={flowSelectClass}
            value={departmentId}
            aria-label="Setor da ação"
            onChange={(event) =>
              onPatch({
                ...step,
                action:
                  kind === 'handoff'
                    ? { type: 'handoff', departmentId: event.target.value }
                    : { type: 'setDepartment', departmentId: event.target.value },
              })
            }
          >
            <option value="">{kind === 'handoff' ? 'Sem setor' : 'Escolha o setor…'}</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
