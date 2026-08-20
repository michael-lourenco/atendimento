import { SupabaseClient } from '@supabase/supabase-js';
import { RepositoryBag } from '../adapters/createMockRepositoryBag';
import { IAuthRepository } from '../../core/repositories/IAuthRepository';
import { IFlowRepository } from '../../core/repositories/IFlowRepository';
import { IMessageRepository } from '../../core/repositories/IMessageRepository';
import { IFlowSessionRepository } from '../../core/repositories/IFlowSessionRepository';
import { IConversationRepository } from '../../core/repositories/IConversationRepository';
import { IInternalMessageRepository } from '../../core/repositories/IInternalMessageRepository';
import { createSupabaseCrud, upsertOmittingMissingColumns } from './crud';
import {
  agentFromRow,
  agentToRow,
  chatbotFromRow,
  chatbotToRow,
  contactFromRow,
  contactToRow,
  conversationFromRow,
  conversationToRow,
  departmentFromRow,
  departmentToRow,
  flowFromRow,
  flowToRow,
  internalFromRow,
  messageFromRow,
  messageToRow,
  numberFromRow,
  numberToRow,
  reportFromRow,
  reportToRow,
  scheduleFromRow,
  scheduleToRow,
  sessionFromRow,
  tagFromRow,
  tagToRow,
  quickReplyFromRow,
  quickReplyToRow,
} from './mappers';
import { Flow } from '../../core/entities/Flow';
import { Chatbot } from '../../core/entities/Chatbot';
import { Message } from '../../core/entities/Message';
import { FlowSession } from '../../core/entities/FlowSession';
import { Conversation } from '../../core/entities/Conversation';
import { InternalMessage } from '../../core/entities/InternalMessage';

function createFlowRepository(client: SupabaseClient): IFlowRepository {
  const crud = createSupabaseCrud<Flow>(client, 'flows', flowFromRow, flowToRow);
  const save = (flow: Flow) =>
    upsertOmittingMissingColumns(client, 'flows', flowToRow(flow), ['keywords']);
  return {
    getAll: () => crud.getAll(),
    getById: (id) => crud.getById(id),
    save,
    delete: (id) => crud.delete(id),
    update: save,
  };
}

function createMessageRepository(client: SupabaseClient): IMessageRepository {
  return {
    async getAll() {
      const { data, error } = await client.from('messages').select('*');
      if (error) throw error;
      return (data ?? []).map((row) => messageFromRow(row as Record<string, unknown>));
    },
    async getById(id: string) {
      const { data, error } = await client.from('messages').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data ? messageFromRow(data as Record<string, unknown>) : null;
    },
    async getByContact(contactId: string) {
      const [fromRes, toRes] = await Promise.all([
        client.from('messages').select('*').eq('from_address', contactId),
        client.from('messages').select('*').eq('to_address', contactId),
      ]);
      if (fromRes.error) throw fromRes.error;
      if (toRes.error) throw toRes.error;
      const byId = new Map<string, Message>();
      for (const row of [...(fromRes.data ?? []), ...(toRes.data ?? [])]) {
        const mapped = messageFromRow(row as Record<string, unknown>);
        byId.set(mapped.id, mapped);
      }
      return [...byId.values()].sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
      );
    },
    async save(message: Message) {
      await upsertOmittingMissingColumns(client, 'messages', messageToRow(message), ['reactions']);
    },
    async delete(id: string) {
      const { error } = await client.from('messages').delete().eq('id', id);
      if (error) throw error;
    },
  };
}

function createSessionRepository(client: SupabaseClient): IFlowSessionRepository {
  return {
    async getByContactId(contactId: string) {
      const { data, error } = await client
        .from('flow_sessions')
        .select('*')
        .eq('contact_id', contactId)
        .maybeSingle();
      if (error) throw error;
      return data ? sessionFromRow(data as Record<string, unknown>) : null;
    },
    async save(session: FlowSession) {
      await upsertOmittingMissingColumns(
        client,
        'flow_sessions',
        {
          contact_id: session.contactId,
          flow_id: session.flowId,
          current_step_id: session.currentStepId,
          paused: session.paused,
          return_stack: session.returnStack ?? [],
          outside_hours_notified: session.outsideHoursNotified ?? false,
          updated_at: session.updatedAt.toISOString(),
        },
        ['return_stack', 'outside_hours_notified']
      );
    },
    async deleteByFlowId(flowId: string) {
      const { error } = await client.from('flow_sessions').delete().eq('flow_id', flowId);
      if (error) throw error;
    },
  };
}

function createConversationRepository(client: SupabaseClient): IConversationRepository {
  const map = (rows: Record<string, unknown>[] | null) =>
    (rows ?? []).map((row) => conversationFromRow(row));

  return {
    async getAll() {
      const { data, error } = await client
        .from('conversations')
        .select('*')
        .order('last_activity', { ascending: false });
      if (error) throw error;
      return map(data as Record<string, unknown>[]);
    },
    async getById(id: string) {
      const { data, error } = await client.from('conversations').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data ? conversationFromRow(data as Record<string, unknown>) : null;
    },
    async getByDepartment(departmentId: string) {
      const { data, error } = await client
        .from('conversations')
        .select('*')
        .eq('department_id', departmentId);
      if (error) throw error;
      return map(data as Record<string, unknown>[]);
    },
    async getByAgent(agentId: string) {
      const { data, error } = await client
        .from('conversations')
        .select('*')
        .eq('assigned_agent_id', agentId);
      if (error) throw error;
      return map(data as Record<string, unknown>[]);
    },
    async save(conversation: Conversation) {
      await upsertOmittingMissingColumns(
        client,
        'conversations',
        conversationToRow(conversation),
        ['last_message', 'contact_avatar_url', 'assigned_at']
      );
    },
    async delete(id: string) {
      const { error } = await client.from('conversations').delete().eq('id', id);
      if (error) throw error;
    },
  };
}

function createInternalMessageRepository(client: SupabaseClient): IInternalMessageRepository {
  return {
    async getByConversation(conversationId: string) {
      const { data, error } = await client
        .from('internal_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((row) => internalFromRow(row as Record<string, unknown>));
    },
    async save(message: InternalMessage) {
      const { error } = await client.from('internal_messages').insert({
        id: message.id,
        from_id: message.from,
        from_name: message.fromName,
        to_id: message.to ?? null,
        to_name: message.toName ?? null,
        conversation_id: message.conversationId,
        content: message.content,
        type: message.type,
        timestamp: message.timestamp.toISOString(),
        department_id: message.departmentId ?? null,
      });
      if (error) throw error;
    },
  };
}

function createChatbotRepository(client: SupabaseClient) {
  const crud = createSupabaseCrud<Chatbot>(client, 'chatbots', chatbotFromRow, chatbotToRow);
  const save = (chatbot: Chatbot) =>
    upsertOmittingMissingColumns(client, 'chatbots', chatbotToRow(chatbot), ['business_hours']);
  return {
    getAll: () => crud.getAll(),
    getById: (id: string) => crud.getById(id),
    save,
    delete: (id: string) => crud.delete(id),
  };
}

export function createSupabaseDataBag(
  client: SupabaseClient,
  auth: IAuthRepository
): Omit<RepositoryBag, 'auth'> & { auth: IAuthRepository } {
  return {
    auth,
    flow: createFlowRepository(client),
    message: createMessageRepository(client),
    flowSession: createSessionRepository(client),
    conversation: createConversationRepository(client),
    department: createSupabaseCrud(client, 'departments', departmentFromRow, departmentToRow),
    internalMessage: createInternalMessageRepository(client),
    chatbot: createChatbotRepository(client),
    agent: createSupabaseCrud(client, 'agents', agentFromRow, agentToRow),
    contact: createSupabaseCrud(client, 'contacts', contactFromRow, contactToRow),
    whatsAppNumber: createSupabaseCrud(client, 'whatsapp_numbers', numberFromRow, numberToRow),
    tag: createSupabaseCrud(client, 'tags', tagFromRow, tagToRow),
    quickReply: createSupabaseCrud(client, 'quick_replies', quickReplyFromRow, quickReplyToRow),
    scheduledMessage: createSupabaseCrud(client, 'scheduled_messages', scheduleFromRow, scheduleToRow),
    report: createSupabaseCrud(client, 'reports', reportFromRow, reportToRow),
  };
}
