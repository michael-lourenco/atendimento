import { FlowSession } from '../entities/FlowSession';
import { queuePlace, queuePlaceLine } from '../entities/queuePlace';
import { resolveBotBehavior } from '../entities/botBehavior';
import { matchWhatsAppNumber } from '../entities/whatsappNumberLine';
import { IConversationRepository } from '../repositories/IConversationRepository';
import { IDepartmentRepository } from '../repositories/IDepartmentRepository';
import { IChatbotRepository } from '../repositories/IChatbotRepository';
import { IFlowSessionRepository } from '../repositories/IFlowSessionRepository';
import { IWhatsAppNumberRepository } from '../repositories/IWhatsAppNumberRepository';
import { SendWhatsAppMessageUseCase } from './SendWhatsAppMessageUseCase';
import { SetConversationDepartmentUseCase } from './SetConversationDepartmentUseCase';
import { runExclusive } from '../engine/runExclusive';

export async function notifyClosedHours(input: {
  phone: string;
  sessionKey: string;
  session: FlowSession | null;
  closedMessage: string;
  now: Date;
  entryFlowId?: string;
  sendMessage: SendWhatsAppMessageUseCase;
  saveSession: (session: FlowSession) => Promise<void>;
}): Promise<void> {
  if (input.session?.outsideHoursNotified) {
    return;
  }
  const text = input.closedMessage.trim();
  if (text) {
    await input.sendMessage.execute({
      to: input.phone,
      message: text,
      conversationId: input.sessionKey,
    });
  }
  await input.saveSession({
    contactId: input.sessionKey,
    flowId: input.session?.flowId ?? input.entryFlowId ?? 'inicio',
    currentStepId: null,
    paused: false,
    outsideHoursNotified: true,
    updatedAt: input.now,
  });
}

export async function appendQueuePlace(
  replies: { content: string }[],
  sessionKey: string,
  conversations: IConversationRepository | null
): Promise<void> {
  if (!conversations || replies.length === 0) {
    return;
  }
  const [all, current] = await Promise.all([
    conversations.getAll(),
    conversations.getById(sessionKey),
  ]);
  if (!current) {
    return;
  }
  const last = replies[replies.length - 1];
  last.content = `${last.content} ${queuePlaceLine(queuePlace(all, current))}`.trim();
}

export async function applyFlowDepartment(input: {
  contactId: string;
  departmentId: string;
  setDepartment: SetConversationDepartmentUseCase | null;
  departments: IDepartmentRepository | null;
}): Promise<void> {
  if (!input.setDepartment || !input.departments) {
    return;
  }
  const department = await input.departments.getById(input.departmentId);
  if (!department?.isActive) {
    return;
  }
  await input.setDepartment.execute({
    conversationId: input.contactId,
    departmentId: department.id,
    departmentName: department.name,
  });
}

export async function hintIncomingMedia(input: {
  sessionKey: string;
  phone: string;
  instanceName?: string;
  sessions: IFlowSessionRepository;
  chatbots: IChatbotRepository | null;
  numbers: IWhatsAppNumberRepository | null;
  sendMessage: SendWhatsAppMessageUseCase;
}): Promise<void> {
  await runExclusive(input.sessionKey, async () => {
    const session = await input.sessions.getByContactId(input.sessionKey);
    if (!session?.currentStepId || session.paused) {
      return;
    }
    if (session.mediaHintStepId === session.currentStepId) {
      return;
    }
    const bots = input.chatbots ? await input.chatbots.getAll() : null;
    const lineCatalog = input.numbers ? await input.numbers.getAll() : [];
    const line = matchWhatsAppNumber(lineCatalog, input.instanceName);
    const text = resolveBotBehavior(bots, line?.behavior).mediaHintMessage.trim();
    if (!text) {
      return;
    }
    await input.sendMessage.execute({
      to: input.phone,
      message: text,
      conversationId: input.sessionKey,
      instanceName: input.instanceName,
    });
    await input.sessions.save({
      ...session,
      mediaHintStepId: session.currentStepId,
      updatedAt: new Date(),
    });
  });
}
