import { Chatbot } from '@/core/entities/Chatbot';
import { Flow } from '@/core/entities/Flow';
import { WhatsAppNumber } from '@/core/entities/WhatsAppNumber';
import {
  CHATBOT_SCOPE_SWITCH_CONFIRM,
  chatbotDraftIsDirty,
  chatbotDraftSnapshot,
  chatbotScopeDraft,
} from './chatbot-draft';

const now = new Date(0);

const inicio: Flow = {
  id: 'inicio',
  name: 'Atendimento Inicial',
  isActive: true,
  steps: [],
  createdAt: now,
  updatedAt: now,
};

const bot: Chatbot = {
  id: 'bot-1',
  name: 'Atendimento',
  isActive: true,
  flowId: 'inicio',
  messagesCount: 0,
  createdAt: now,
  updatedAt: now,
};

const line: WhatsAppNumber = {
  id: 'line-1',
  name: 'Comercial',
  number: '5511999999999',
  status: 'active',
  provider: 'chat-whatsapp',
  createdAt: now,
};

describe('chatbotScopeDraft', () => {
  it('empresa usa o cadastro ativo', () => {
    const draft = chatbotScopeDraft('company', [bot], [line], [inicio]);
    expect(draft.scope).toBe('company');
    expect(draft.form.name).toBe('Atendimento');
    expect(draft.form.flowId).toBe('inicio');
    expect(draft.useCompanyFlow).toBe(true);
  });

  it('linha sem overlay herda fluxo, expediente e ritmo', () => {
    const draft = chatbotScopeDraft('line-1', [bot], [line], [inicio]);
    expect(draft.useCompanyFlow).toBe(true);
    expect(draft.useCompanyHours).toBe(true);
    expect(draft.useCompanyRhythm).toBe(true);
    expect(draft.form.flowId).toBe('inicio');
  });

  it('linha com fluxo próprio não herda o roteiro', () => {
    const draft = chatbotScopeDraft(
      'line-1',
      [bot],
      [{ ...line, flowId: 'faq' }],
      [inicio]
    );
    expect(draft.useCompanyFlow).toBe(false);
    expect(draft.form.flowId).toBe('faq');
  });
});

describe('chatbotDraftIsDirty', () => {
  it('sem snapshot ainda não é rascunho', () => {
    const draft = chatbotScopeDraft('company', [bot], [line], [inicio]);
    expect(chatbotDraftIsDirty('', draft)).toBe(false);
  });

  it('mudar o nome marca rascunho', () => {
    const draft = chatbotScopeDraft('company', [bot], [line], [inicio]);
    const saved = chatbotDraftSnapshot(draft);
    expect(chatbotDraftIsDirty(saved, draft)).toBe(false);
    expect(chatbotDraftIsDirty(saved, { ...draft, form: { ...draft.form, name: 'Outro' } })).toBe(
      true
    );
  });

  it('expediente padrão entra no snapshot da empresa', () => {
    const draft = chatbotScopeDraft('company', [bot], [line], [inicio]);
    expect(draft.form.hours.timezone).toBe('America/Sao_Paulo');
  });
});

describe('CHATBOT_SCOPE_SWITCH_CONFIRM', () => {
  it('pede confirmação ao trocar o Vale para', () => {
    expect(CHATBOT_SCOPE_SWITCH_CONFIRM).toContain('Vale para');
  });
});
