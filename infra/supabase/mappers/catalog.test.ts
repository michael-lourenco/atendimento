import { Chatbot } from '../../../core/entities/Chatbot';
import { QuickReply } from '../../../core/entities/QuickReply';
import { ScheduledMessage } from '../../../core/entities/ScheduledMessage';
import { WhatsAppNumber } from '../../../core/entities/WhatsAppNumber';
import {
  chatbotFromRow,
  chatbotToRow,
  numberFromRow,
  numberToRow,
  quickReplyFromRow,
  quickReplyToRow,
  scheduleToRow,
} from './catalog';

const base: ScheduledMessage = {
  id: 's1',
  contact: '5511999999999',
  message: 'oi',
  scheduledDate: new Date('2026-08-20T12:00:00Z'),
  status: 'pending',
  createdAt: new Date('2026-08-20T11:00:00Z'),
};

describe('quickReplyToRow', () => {
  const reply: QuickReply = {
    id: 'qr-1',
    title: 'Saudação',
    body: 'Olá',
    createdAt: new Date('2026-08-20T12:00:00Z'),
  };

  it('manda media_kind null sem áudio', () => {
    expect(quickReplyToRow(reply).media_kind).toBeNull();
  });

  it('manda audio quando houver', () => {
    expect(quickReplyToRow({ ...reply, mediaKind: 'audio' }).media_kind).toBe('audio');
  });

  it('manda image, video e document', () => {
    expect(quickReplyToRow({ ...reply, mediaKind: 'image' }).media_kind).toBe('image');
    expect(quickReplyToRow({ ...reply, mediaKind: 'video' }).media_kind).toBe('video');
    expect(quickReplyToRow({ ...reply, mediaKind: 'document' }).media_kind).toBe('document');
  });

  it('lê media_kind do banco', () => {
    expect(
      quickReplyFromRow({
        id: 'qr-1',
        title: 'Saudação',
        body: '',
        media_kind: 'audio',
        created_at: '2026-08-20T12:00:00Z',
      }).mediaKind
    ).toBe('audio');
    expect(
      quickReplyFromRow({
        id: 'qr-1',
        title: 'Foto',
        body: '',
        media_kind: 'image',
        created_at: '2026-08-20T12:00:00Z',
      }).mediaKind
    ).toBe('image');
  });

  it('manda e lê department_id', () => {
    expect(quickReplyToRow({ ...reply, departmentId: '1' }).department_id).toBe('1');
    expect(quickReplyToRow(reply).department_id).toBeNull();
    expect(
      quickReplyFromRow({
        id: 'qr-1',
        title: 'Saudação',
        body: 'Olá',
        department_id: '1',
        created_at: '2026-08-20T12:00:00Z',
      }).departmentId
    ).toBe('1');
  });
});

describe('scheduleToRow', () => {
  it('não manda conversation_id sem thread (evita PGRST204)', () => {
    expect(scheduleToRow(base)).not.toHaveProperty('conversation_id');
  });

  it('manda conversation_id quando o agendamento nasce no chat', () => {
    expect(scheduleToRow({ ...base, conversationId: '5511999999999:n1' }).conversation_id).toBe(
      '5511999999999:n1'
    );
  });
});

describe('chatbotToRow', () => {
  const bot: Chatbot = {
    id: '1',
    name: 'Bot',
    isActive: true,
    messagesCount: 0,
    createdAt: new Date('2026-08-20T12:00:00Z'),
    updatedAt: new Date('2026-08-20T12:00:00Z'),
  };

  it('não manda behavior sem valor (evita PGRST204)', () => {
    expect(chatbotToRow(bot)).not.toHaveProperty('behavior');
  });

  it('manda e lê behavior', () => {
    const withBehavior = { ...bot, behavior: { replyDelayMs: 200, idleContactMinutes: 0 } };
    expect(chatbotToRow(withBehavior).behavior).toEqual({
      replyDelayMs: 200,
      idleContactMinutes: 0,
    });
    expect(
      chatbotFromRow({
        id: '1',
        name: 'Bot',
        is_active: true,
        messages_count: 0,
        behavior: { replyDelayMs: 200 },
        created_at: '2026-08-20T12:00:00Z',
        updated_at: '2026-08-20T12:00:00Z',
      }).behavior
    ).toEqual({ replyDelayMs: 200 });
  });
});

describe('numberToRow', () => {
  const line: WhatsAppNumber = {
    id: 'n1',
    name: 'Comercial',
    number: '5511',
    status: 'active',
    provider: 'evolution',
    createdAt: new Date('2026-08-20T12:00:00Z'),
  };

  it('manda behavior null para voltar ao ritmo da empresa', () => {
    expect(numberToRow(line).behavior).toBeNull();
  });

  it('lê behavior da linha', () => {
    expect(
      numberFromRow({
        id: 'n1',
        name: 'Comercial',
        number: '5511',
        status: 'active',
        provider: 'evolution',
        behavior: { idleContactMinutes: 0 },
        created_at: '2026-08-20T12:00:00Z',
      }).behavior
    ).toEqual({ idleContactMinutes: 0 });
  });

  it('manda e lê flow_id da linha', () => {
    expect(numberToRow({ ...line, flowId: 'faq' }).flow_id).toBe('faq');
    expect(
      numberFromRow({
        id: 'n1',
        name: 'Comercial',
        number: '5511',
        status: 'active',
        provider: 'evolution',
        flow_id: 'faq',
        created_at: '2026-08-20T12:00:00Z',
      }).flowId
    ).toBe('faq');
  });

  it('manda e lê business_hours da linha', () => {
    const hours = {
      enabled: false,
      timezone: 'UTC',
      days: [] as number[],
      start: '08:00',
      end: '18:00',
      closedMessage: '',
    };
    expect(numberToRow({ ...line, businessHours: hours }).business_hours).toEqual(hours);
    expect(numberToRow(line).business_hours).toBeNull();
    expect(
      numberFromRow({
        id: 'n1',
        name: 'Comercial',
        number: '5511',
        status: 'active',
        provider: 'evolution',
        business_hours: hours,
        created_at: '2026-08-20T12:00:00Z',
      }).businessHours
    ).toEqual(hours);
  });
});
