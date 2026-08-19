import { Flow, FlowStep } from '../../../core/entities/Flow';
import { Message } from '../../../core/entities/Message';
import { FlowSession } from '../../../core/entities/FlowSession';
import { Conversation } from '../../../core/entities/Conversation';
import { InternalMessage } from '../../../core/entities/InternalMessage';
import { asDate, asStringArray } from '../crud';

export function flowFromRow(row: Record<string, unknown>): Flow {
  return {
    id: String(row.id),
    name: String(row.name),
    description: row.description ? String(row.description) : undefined,
    steps: (row.steps as FlowStep[]) || [],
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
  };
}

export function messageToRow(message: Message) {
  return {
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
  };
}

export function sessionFromRow(row: Record<string, unknown>): FlowSession {
  return {
    contactId: String(row.contact_id),
    flowId: String(row.flow_id),
    currentStepId: row.current_step_id ? String(row.current_step_id) : null,
    paused: Boolean(row.paused),
    updatedAt: asDate(row.updated_at),
  };
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
    lastActivity: asDate(row.last_activity),
    createdAt: asDate(row.created_at),
    tags: asStringArray(row.tags),
  };
}

export function conversationToRow(conversation: Conversation) {
  return {
    id: conversation.id,
    contact_id: conversation.contactId,
    contact_name: conversation.contactName,
    contact_phone: conversation.contactPhone,
    department_id: conversation.departmentId ?? null,
    department_name: conversation.departmentName ?? null,
    assigned_agent_id: conversation.assignedAgentId ?? null,
    assigned_agent_name: conversation.assignedAgentName ?? null,
    whatsapp_number_id: conversation.whatsappNumberId ?? null,
    status: conversation.status,
    unread_count: conversation.unreadCount,
    last_activity: conversation.lastActivity.toISOString(),
    created_at: conversation.createdAt.toISOString(),
    tags: conversation.tags,
  };
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
