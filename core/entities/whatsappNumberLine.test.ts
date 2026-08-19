import {
  lineNameOf,
  matchWhatsAppNumber,
  outgoingWhatsAppLine,
  slugWhatsAppInstanceName,
} from './whatsappNumberLine';
import { Conversation } from './Conversation';
import { WhatsAppNumber } from './WhatsAppNumber';

const comercial: WhatsAppNumber = {
  id: 'n1',
  name: 'Comercial',
  number: '5511999000001',
  status: 'active',
  provider: 'evolution',
  instanceName: 'comercial',
  createdAt: new Date('2026-08-19'),
};

const suporte: WhatsAppNumber = {
  id: 'n2',
  name: 'Suporte',
  number: '5511999000002',
  status: 'active',
  provider: 'evolution',
  instanceName: 'suporte',
  createdAt: new Date('2026-08-19'),
};

describe('whatsappNumberLine', () => {
  it('slug da instância', () => {
    expect(slugWhatsAppInstanceName('Comercial Atimo')).toBe('comercial-atimo');
  });

  it('liga pelo instanceName ou pelos dígitos', () => {
    expect(matchWhatsAppNumber([comercial, suporte], 'suporte')?.id).toBe('n2');
    expect(matchWhatsAppNumber([comercial, suporte], '5511999000001')?.id).toBe('n1');
  });

  it('envio usa a linha da conversa', () => {
    const conversation: Conversation = {
      id: '5511988887777',
      contactId: '5511988887777',
      contactName: 'Ana',
      contactPhone: '5511988887777',
      whatsappNumberId: 'n2',
      status: 'open',
      unreadCount: 0,
      lastActivity: new Date('2026-08-19'),
      createdAt: new Date('2026-08-19'),
      tags: [],
    };
    expect(outgoingWhatsAppLine(conversation, [comercial, suporte]).instanceName).toBe('suporte');
    expect(lineNameOf([comercial, suporte], conversation)).toBe('Suporte');
  });
});
