import { ScheduledMessage } from '../../../core/entities/ScheduledMessage';
import { scheduleToRow } from './catalog';

const base: ScheduledMessage = {
  id: 's1',
  contact: '5511999999999',
  message: 'oi',
  scheduledDate: new Date('2026-08-20T12:00:00Z'),
  status: 'pending',
  createdAt: new Date('2026-08-20T11:00:00Z'),
};

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
