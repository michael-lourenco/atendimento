import { Department } from '../../../core/entities/Department';
import { Chatbot } from '../../../core/entities/Chatbot';
import { Agent, AgentStatus } from '../../../core/entities/Agent';
import { Contact } from '../../../core/entities/Contact';
import { WhatsAppNumber, WhatsAppNumberStatus } from '../../../core/entities/WhatsAppNumber';
import { Tag } from '../../../core/entities/Tag';
import { QuickReply } from '../../../core/entities/QuickReply';
import { ScheduledMessage, ScheduleStatus } from '../../../core/entities/ScheduledMessage';
import { Report, ReportType } from '../../../core/entities/Report';
import { asDate, asStringArray } from '../crud';

export function departmentFromRow(row: Record<string, unknown>): Department {
  return {
    id: String(row.id),
    name: String(row.name),
    description: row.description ? String(row.description) : undefined,
    color: String(row.color),
    isActive: Boolean(row.is_active),
    agentsCount: Number(row.agents_count ?? 0),
    conversationsCount: Number(row.conversations_count ?? 0),
    createdAt: asDate(row.created_at),
    updatedAt: asDate(row.updated_at),
  };
}

export function departmentToRow(department: Department) {
  return {
    id: department.id,
    name: department.name,
    description: department.description ?? null,
    color: department.color,
    is_active: department.isActive,
    agents_count: department.agentsCount,
    conversations_count: department.conversationsCount,
    created_at: department.createdAt.toISOString(),
    updated_at: department.updatedAt.toISOString(),
  };
}

export function chatbotFromRow(row: Record<string, unknown>): Chatbot {
  return {
    id: String(row.id),
    name: String(row.name),
    description: row.description ? String(row.description) : undefined,
    isActive: Boolean(row.is_active),
    flowId: row.flow_id ? String(row.flow_id) : undefined,
    messagesCount: Number(row.messages_count ?? 0),
    businessHours:
      row.business_hours && typeof row.business_hours === 'object'
        ? (row.business_hours as Chatbot['businessHours'])
        : undefined,
    behavior:
      row.behavior && typeof row.behavior === 'object'
        ? (row.behavior as Chatbot['behavior'])
        : undefined,
    createdAt: asDate(row.created_at),
    updatedAt: asDate(row.updated_at),
  };
}

export function chatbotToRow(chatbot: Chatbot) {
  const row: Record<string, unknown> = {
    id: chatbot.id,
    name: chatbot.name,
    description: chatbot.description ?? null,
    is_active: chatbot.isActive,
    flow_id: chatbot.flowId ?? null,
    messages_count: chatbot.messagesCount,
    created_at: chatbot.createdAt.toISOString(),
    updated_at: chatbot.updatedAt.toISOString(),
  };
  if (chatbot.businessHours) {
    row.business_hours = chatbot.businessHours;
  }
  if (chatbot.behavior) {
    row.behavior = chatbot.behavior;
  }
  return row;
}

export function agentFromRow(row: Record<string, unknown>): Agent {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    status: row.status as AgentStatus,
    departmentId: row.department_id ? String(row.department_id) : undefined,
    conversationsCount: Number(row.conversations_count ?? 0),
    responseTime: String(row.response_time ?? '—'),
    createdAt: asDate(row.created_at),
  };
}

export function agentToRow(agent: Agent) {
  return {
    id: agent.id,
    name: agent.name,
    email: agent.email,
    status: agent.status,
    department_id: agent.departmentId ?? null,
    conversations_count: agent.conversationsCount,
    response_time: agent.responseTime,
    created_at: agent.createdAt.toISOString(),
  };
}

export function contactFromRow(row: Record<string, unknown>): Contact {
  return {
    id: String(row.id),
    name: String(row.name),
    phone: String(row.phone),
    email: row.email ? String(row.email) : undefined,
    tags: asStringArray(row.tags),
    avatarUrl: row.avatar_url ? String(row.avatar_url) : undefined,
    createdAt: asDate(row.created_at),
    updatedAt: asDate(row.updated_at),
  };
}

export function contactToRow(contact: Contact) {
  const row: Record<string, unknown> = {
    id: contact.id,
    name: contact.name,
    phone: contact.phone,
    email: contact.email ?? null,
    tags: contact.tags,
    created_at: contact.createdAt.toISOString(),
    updated_at: contact.updatedAt.toISOString(),
  };
  if (contact.avatarUrl) {
    row.avatar_url = contact.avatarUrl;
  }
  return row;
}

export function numberFromRow(row: Record<string, unknown>): WhatsAppNumber {
  return {
    id: String(row.id),
    name: String(row.name),
    number: String(row.number),
    status: row.status as WhatsAppNumberStatus,
    provider: String(row.provider),
    instanceName: row.instance_name ? String(row.instance_name) : undefined,
    behavior:
      row.behavior && typeof row.behavior === 'object'
        ? (row.behavior as WhatsAppNumber['behavior'])
        : undefined,
    flowId: row.flow_id ? String(row.flow_id) : undefined,
    businessHours:
      row.business_hours && typeof row.business_hours === 'object'
        ? (row.business_hours as WhatsAppNumber['businessHours'])
        : undefined,
    createdAt: asDate(row.created_at),
  };
}

export function numberToRow(number: WhatsAppNumber) {
  return {
    id: number.id,
    name: number.name,
    number: number.number,
    status: number.status,
    provider: number.provider,
    instance_name: number.instanceName ?? null,
    behavior: number.behavior ?? null,
    flow_id: number.flowId ?? null,
    business_hours: number.businessHours ?? null,
    created_at: number.createdAt.toISOString(),
  };
}

export function tagFromRow(row: Record<string, unknown>): Tag {
  return {
    id: String(row.id),
    name: String(row.name),
    color: String(row.color),
    contactsCount: Number(row.contacts_count ?? 0),
    createdAt: asDate(row.created_at),
  };
}

export function tagToRow(tag: Tag) {
  return {
    id: tag.id,
    name: tag.name,
    color: tag.color,
    contacts_count: tag.contactsCount,
    created_at: tag.createdAt.toISOString(),
  };
}

export function quickReplyFromRow(row: Record<string, unknown>): QuickReply {
  return {
    id: String(row.id),
    title: String(row.title),
    body: String(row.body ?? ''),
    mediaKind: row.media_kind === 'audio' ? 'audio' : undefined,
    departmentId: row.department_id ? String(row.department_id) : undefined,
    createdAt: asDate(row.created_at),
  };
}

export function quickReplyToRow(reply: QuickReply) {
  return {
    id: reply.id,
    title: reply.title,
    body: reply.body,
    media_kind: reply.mediaKind === 'audio' ? 'audio' : null,
    department_id: reply.departmentId ?? null,
    created_at: reply.createdAt.toISOString(),
  };
}

export function scheduleFromRow(row: Record<string, unknown>): ScheduledMessage {
  const conversationId = row.conversation_id ? String(row.conversation_id) : '';
  return {
    id: String(row.id),
    contact: String(row.contact),
    message: String(row.message),
    scheduledDate: asDate(row.scheduled_date),
    status: row.status as ScheduleStatus,
    createdAt: asDate(row.created_at),
    conversationId: conversationId || undefined,
  };
}

export function scheduleToRow(schedule: ScheduledMessage) {
  const row: Record<string, unknown> = {
    id: schedule.id,
    contact: schedule.contact,
    message: schedule.message,
    scheduled_date: schedule.scheduledDate.toISOString(),
    status: schedule.status,
    created_at: schedule.createdAt.toISOString(),
  };
  if (schedule.conversationId) {
    row.conversation_id = schedule.conversationId;
  }
  return row;
}

export function reportFromRow(row: Record<string, unknown>): Report {
  return {
    id: String(row.id),
    title: String(row.title),
    type: row.type as ReportType,
    period: String(row.period),
    createdAt: asDate(row.created_at),
  };
}

export function reportToRow(report: Report) {
  return {
    id: report.id,
    title: report.title,
    type: report.type,
    period: report.period,
    created_at: report.createdAt.toISOString(),
  };
}
