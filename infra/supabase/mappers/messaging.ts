import { Flow, FlowStep } from '../../../core/entities/Flow';
import { Message } from '../../../core/entities/Message';
import { FlowSession } from '../../../core/entities/FlowSession';
import { Conversation } from '../../../core/entities/Conversation';
import { InternalMessage } from '../../../core/entities/InternalMessage';
import { asDate, asStringArray } from '../crud';
import { reactionsFromUnknown } from '../../../core/entities/messageReaction';

export function flowFromRow(row: Record<string, unknown>): Flow {
  return {
    id: String(row.id),
    name: String(row.name),
    description: row.description ? String(row.description) : undefined,
    steps: (row.steps as FlowStep[]) || [],
    keywords: Array.isArray(row.keywords) ? (row.keywords as string[]) : [],
    isActive: Boolean(row.is_active),
    createdAt: asDate(row.created_at),
    updatedAt: asDate(row.updated_at),
  };
}

export function flowToRow(flow: Flow) {
  return {
    id: flow.id,
    name: flow.name,
    description: flow.description ?? null,
    steps: flow.steps,
    keywords: flow.keywords ?? [],
    is_active: flow.isActive,
    created_at: flow.createdAt.toISOString(),
    updated_at: flow.updatedAt.toISOString(),
  };
}

export function messageFromRow(row: Record<string, unknown>): Message {
  return {
    id: String(row.id),
    from: String(row.from_address),
    to: String(row.to_address),
    content: String(row.content ?? ''),
    type: row.type as Message['type'],
    timestamp: asDate(row.timestamp),
    flowId: row.flow_id ? String(row.flow_id) : undefined,
    stepId: row.step_id ? String(row.step_id) : undefined,
    direction: row.direction as Message['direction'],
    status: row.status as Message['status'],
    reactions: reactionsFromUnknown(row.reactions),
    quotedMessageId: row.quoted_message_id ? String(row.quoted_message_id) : undefined,
    quotedContent: row.quoted_content ? String(row.quoted_content) : undefined,
    quotedFrom: row.quoted_from ? String(row.quoted_from) : undefined,
  };
}

export function messageToRow(message: Message) {
  const row: Record<string, unknown> = {
    id: message.id,
    from_address: message.from,
    to_address: message.to,
    content: message.content,
    type: message.type,
    timestamp: message.timestamp.toISOString(),
    flow_id: message.flowId ?? null,
    step_id: message.stepId ?? null,
    direction: message.direction,
    status: message.status,
    reactions: message.reactions ?? [],
  };
  if (message.quotedMessageId) {
    row.quoted_message_id = message.quotedMessageId;
    row.quoted_content = message.quotedContent ?? null;
    row.quoted_from = message.quotedFrom ?? null;
  }
  return row;
}

export function sessionFromRow(row: Record<string, unknown>): FlowSession {
  return {
    contactId: String(row.contact_id),
    flowId: String(row.flow_id),
    currentStepId: row.current_step_id ? String(row.current_step_id) : null,
    paused: Boolean(row.paused),
    returnStack: Array.isArray(row.return_stack)
      ? (row.return_stack as FlowSession['returnStack'])
      : undefined,
    outsideHoursNotified: Boolean(row.outside_hours_notified),
    updatedAt: asDate(row.updated_at),
  };
}

function lastMessageFromRow(value: unknown): Conversation['lastMessage'] {
  if (!value || typeof value !== 'object') {
    return undefined;
  }
  const row = value as Record<string, unknown>;
  if (row.from_address != null || row.to_address != null) {
    return messageFromRow(row);
  }
  if (row.from != null || row.to != null) {
    return messageFromRow({
      ...row,
      from_address: row.from,
      to_address: row.to,
    });
  }
  return undefined;
}

export function conversationFromRow(row: Record<string, unknown>): Conversation {
  return {
    id: String(row.id),
    contactId: String(row.contact_id),
    contactName: String(row.contact_name),
    contactPhone: String(row.contact_phone),
    departmentId: row.department_id ? String(row.department_id) : undefined,
    departmentName: row.department_name ? String(row.department_name) : undefined,
    assignedAgentId: row.assigned_agent_id ? String(row.assigned_agent_id) : undefined,
    assignedAgentName: row.assigned_agent_name ? String(row.assigned_agent_name) : undefined,
    whatsappNumberId: row.whatsapp_number_id ? String(row.whatsapp_number_id) : undefined,
    status: row.status as Conversation['status'],
    unreadCount: Number(row.unread_count ?? 0),
    lastMessage: lastMessageFromRow(row.last_message),
    lastActivity: asDate(row.last_activity),
    createdAt: asDate(row.created_at),
    tags: asStringArray(row.tags),
    contactAvatarUrl: row.contact_avatar_url ? String(row.contact_avatar_url) : undefined,
    assignedAt: row.assigned_at ? asDate(row.assigned_at) : undefined,
    contactTypingAt: row.contact_typing_at ? asDate(row.contact_typing_at) : undefined,
  };
}

export function conversationToRow(conversation: Conversation) {
  const row: Record<string, unknown> = {
    id: conversation.id,
    contact_id: conversation.contactId,
    contact_name: conversation.contactName,
    contact_phone: conversation.contactPhone,
    department_id: conversation.departmentId ?? null,
    department_name: conversation.departmentName ?? null,
    assigned_agent_id: conversation.assignedAgentId ?? null,
    assigned_agent_name: conversation.assignedAgentName ?? null,
    status: conversation.status,
    unread_count: conversation.unreadCount,
    last_activity: conversation.lastActivity.toISOString(),
    created_at: conversation.createdAt.toISOString(),
    tags: conversation.tags,
  };
  if (conversation.lastMessage) {
    row.last_message = messageToRow(conversation.lastMessage);
  }
  if (conversation.whatsappNumberId) {
    row.whatsapp_number_id = conversation.whatsappNumberId;
  }
  if (conversation.contactAvatarUrl) {
    row.contact_avatar_url = conversation.contactAvatarUrl;
  }
  if (conversation.assignedAt) {
    row.assigned_at = conversation.assignedAt.toISOString();
  }
  row.contact_typing_at = conversation.contactTypingAt
    ? conversation.contactTypingAt.toISOString()
    : null;
  return row;
}

export function internalFromRow(row: Record<string, unknown>): InternalMessage {
  return {
    id: String(row.id),
    from: String(row.from_id),
    fromName: String(row.from_name),
    to: row.to_id ? String(row.to_id) : undefined,
    toName: row.to_name ? String(row.to_name) : undefined,
    conversationId: String(row.conversation_id),
    content: String(row.content),
    type: row.type as InternalMessage['type'],
    timestamp: asDate(row.timestamp),
    departmentId: row.department_id ? String(row.department_id) : undefined,
  };
}
