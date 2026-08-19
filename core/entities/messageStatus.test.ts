import { evolutionAckToStatus, mergeMessageStatus, whatsappTickKind } from './messageStatus';

describe('messageStatus', () => {
  it('mapeia ack da Evolution para o tique do WhatsApp', () => {
    expect(evolutionAckToStatus(1)).toBe('pending');
    expect(evolutionAckToStatus(2)).toBe('sent');
    expect(evolutionAckToStatus(3)).toBe('delivered');
    expect(evolutionAckToStatus(4)).toBe('read');
    expect(evolutionAckToStatus(5)).toBe('read');
    expect(evolutionAckToStatus('SERVER_ACK')).toBe('sent');
    expect(evolutionAckToStatus('DELIVERY_ACK')).toBe('delivered');
    expect(evolutionAckToStatus('READ')).toBe('read');
  });

  it('não rebaixa entregue/lida', () => {
    expect(mergeMessageStatus('read', 'sent')).toBe('read');
    expect(mergeMessageStatus('delivered', 'sent')).toBe('delivered');
    expect(mergeMessageStatus('sent', 'delivered')).toBe('delivered');
    expect(mergeMessageStatus('pending', 'sent')).toBe('sent');
  });

  it('tiques só na mensagem de saída', () => {
    expect(whatsappTickKind({ direction: 'incoming', status: 'read' })).toBeNull();
    expect(whatsappTickKind({ direction: 'outgoing', status: 'pending' })).toBe('clock');
    expect(whatsappTickKind({ direction: 'outgoing', status: 'sent' })).toBe('sent');
    expect(whatsappTickKind({ direction: 'outgoing', status: 'delivered' })).toBe('delivered');
    expect(whatsappTickKind({ direction: 'outgoing', status: 'read' })).toBe('read');
  });
});
