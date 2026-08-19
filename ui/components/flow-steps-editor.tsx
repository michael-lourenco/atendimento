'use client';

import { FlowStep } from '@/core/entities/Flow';
import { Department } from '@/core/entities/Department';
import { Button } from '@/ui/components/button';
import { Input } from '@/ui/components/input';
import { Label } from '@/ui/components/label';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { STEP_TYPE_LABELS, stepDisplayName } from '@/ui/lib/flow-step-copy';
import { addFlowStep, moveFlowStep, removeFlowStep, withStepType } from '@/ui/lib/flow-step-graph';
import { NextStepSelect, flowSelectClass } from '@/ui/components/flow-next-step-select';
import { FlowConditionFields } from '@/ui/components/flow-condition-fields';
import { FlowQuestionOptions } from '@/ui/components/flow-question-options';
import { FlowPathMap } from '@/ui/components/flow-path-map';
import { FlowWhatsAppPreview } from '@/ui/components/flow-whatsapp-preview';
import { flowStepToneBar } from '@/ui/lib/status-tone';

type FlowStepsEditorProps = {
  steps: FlowStep[];
  departments: Department[];
  onChange: (steps: FlowStep[]) => void;
};

const TYPES: FlowStep['type'][] = ['message', 'question', 'condition', 'action'];

export function FlowStepsEditor({ steps, departments, onChange }: FlowStepsEditorProps) {
  const activeDepartments = departments.filter((item) => item.isActive);

  const patch = (index: number, next: FlowStep) => {
    onChange(steps.map((step, i) => (i === index ? next : step)));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Passos do atendimento</Label>
        <Button type="button" variant="outline" size="sm" onClick={() => onChange(addFlowStep(steps))}>
          Adicionar passo
        </Button>
      </div>
      {steps.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum passo. Comece com uma mensagem de boas-vindas ou uma pergunta de triagem.
        </p>
      ) : (
        <>
          <FlowPathMap steps={steps} departments={activeDepartments} />
          <FlowWhatsAppPreview steps={steps} />
        </>
      )}
      {steps.map((step, index) => (
        <div key={step.id} className={`space-y-3 rounded-md border border-border border-l-4 p-3 ${flowStepToneBar[step.type]}`}>
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-foreground">
              {stepDisplayName(step, index, activeDepartments)}
            </p>
            <div className="flex shrink-0 gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label="Mover para cima"
                disabled={index === 0}
                onClick={() => onChange(moveFlowStep(steps, index, -1))}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label="Mover para baixo"
                disabled={index === steps.length - 1}
                onClick={() => onChange(moveFlowStep(steps, index, 1))}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Tipo</Label>
            <select
              className={flowSelectClass}
              value={step.type}
              aria-label="Tipo do passo"
              onChange={(event) => patch(index, withStepType(step, event.target.value as FlowStep['type']))}
            >
              {TYPES.map((type) => (
                <option key={type} value={type}>
                  {STEP_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>
          {step.type !== 'action' && step.type !== 'condition' ? (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                {step.type === 'question' ? 'Pergunta no WhatsApp' : 'Texto no WhatsApp'}
              </Label>
              <Input
                value={step.content}
                placeholder={
                  step.type === 'question'
                    ? 'Ex.: Como podemos ajudar?'
                    : 'Ex.: Olá! Bem-vindo ao atendimento.'
                }
                onChange={(event) => patch(index, { ...step, content: event.target.value })}
              />
            </div>
          ) : null}
          {step.type === 'question' ? (
            <FlowQuestionOptions
              steps={steps}
              index={index}
              departments={activeDepartments}
              onChangeSteps={onChange}
              onPatch={(next) => patch(index, next)}
            />
          ) : null}
          {step.type === 'action' ? (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Setor da conversa</Label>
              <select
                className={flowSelectClass}
                value={step.action?.departmentId ?? ''}
                aria-label="Setor da ação"
                onChange={(event) =>
                  patch(index, {
                    ...step,
                    action: { type: 'setDepartment', departmentId: event.target.value },
                  })
                }
              >
                <option value="">Escolha o setor…</option>
                {activeDepartments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          {step.type === 'condition' && step.condition ? (
            <FlowConditionFields
              step={step}
              steps={steps}
              departments={activeDepartments}
              onChange={(next) => patch(index, next)}
            />
          ) : (
            <NextStepSelect
              steps={steps}
              departments={activeDepartments}
              currentId={step.id}
              value={step.nextStepId ?? ''}
              label="Depois, ir para"
              onChange={(nextStepId) =>
                patch(index, { ...step, nextStepId: nextStepId || undefined })
              }
            />
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange(removeFlowStep(steps, index))}
          >
            Remover
          </Button>
        </div>
      ))}
    </div>
  );
}
