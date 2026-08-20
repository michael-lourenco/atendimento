import { QuickReply } from '../../core/entities/QuickReply';
import { IQuickReplyRepository } from '../../core/repositories/IQuickReplyRepository';
import { INTAKE_DEPARTMENT_COMERCIAL } from '../../core/entities/atendimentoInicialFlow';
import { createInMemoryCrud } from './inMemoryCrud';

const seed: QuickReply[] = [
  {
    id: 'qr-saudacao',
    title: 'Saudação',
    body: 'Olá! Sou da equipe de atendimento. Como posso ajudar?',
    createdAt: new Date('2026-01-01'),
  },
  {
    id: 'qr-aguardar',
    title: 'Aguardar',
    body: 'Um momento, por favor. Já verifico e te retorno.',
    createdAt: new Date('2026-01-01'),
  },
  {
    id: 'qr-encerrar',
    title: 'Encerrar',
    body: 'Foi um prazer atender. Qualquer coisa, é só chamar.',
    departmentId: INTAKE_DEPARTMENT_COMERCIAL,
    createdAt: new Date('2026-01-01'),
  },
];

export const mockQuickReplyRepository: IQuickReplyRepository = createInMemoryCrud(seed);
