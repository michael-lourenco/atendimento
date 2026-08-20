import { HttpBodyError } from './parseJson';
import {
  chatWhatsAppWebhookSchema,
  createOperatorBodySchema,
  evolutionWebhookData,
  evolutionWebhookSchema,
  loginBodySchema,
  metaWebhookSchema,
  reactMessageBodySchema,
  readMessagesBodySchema,
  setOperatorRoleBodySchema,
} from './schemas';

describe('schemas HTTP', () => {
  it('login exige email e senha', () => {
    expect(loginBodySchema.safeParse({ email: 'a@b.com', password: 'x' }).success).toBe(true);
    expect(loginBodySchema.safeParse({ email: 'nao-email', password: 'x' }).success).toBe(false);
    expect(loginBodySchema.safeParse({ email: 'a@b.com', password: '' }).success).toBe(false);
  });

  it('operators POST/PATCH', () => {
    expect(
      createOperatorBodySchema.safeParse({
        email: 'ana@x.com',
        password: 'secret1',
        name: 'Ana',
      }).success
    ).toBe(true);
    expect(
      createOperatorBodySchema.safeParse({
        email: 'ana@x.com',
        password: '123',
        name: 'Ana',
      }).success
    ).toBe(false);
    expect(setOperatorRoleBodySchema.safeParse({ role: 'admin' }).success).toBe(true);
    expect(setOperatorRoleBodySchema.safeParse({ role: 'guest' }).success).toBe(false);
    expect(setOperatorRoleBodySchema.safeParse({ password: 'secret1' }).success).toBe(true);
    expect(setOperatorRoleBodySchema.safeParse({ password: '123' }).success).toBe(false);
    expect(setOperatorRoleBodySchema.safeParse({}).success).toBe(false);
  });

  it('Evolution aceita data ou body com key', () => {
    const withData = evolutionWebhookSchema.parse({ event: 'messages.upsert', data: { id: 1 } });
    expect(evolutionWebhookData(withData).data).toEqual({ id: 1 });
    const withKey = evolutionWebhookSchema.parse({ event: 'messages.upsert', key: { id: 'k' } });
    expect(evolutionWebhookData(withKey).event).toBe('messages.upsert');
    expect(() => evolutionWebhookData(evolutionWebhookSchema.parse({ event: 'ping' }))).toThrow(
      HttpBodyError
    );
  });

  it('chat-whatsapp exige event e data', () => {
    expect(chatWhatsAppWebhookSchema.safeParse({ event: 'status', data: {} }).success).toBe(true);
    expect(chatWhatsAppWebhookSchema.safeParse({ event: 'status' }).success).toBe(false);
  });

  it('Meta exige object de conta WhatsApp', () => {
    expect(
      metaWebhookSchema.safeParse({
        object: 'whatsapp_business_account',
        entry: [],
      }).success
    ).toBe(true);
    expect(metaWebhookSchema.safeParse({ object: 'instagram', entry: [] }).success).toBe(false);
  });

  it('reação exige messageId', () => {
    expect(reactMessageBodySchema.safeParse({ messageId: 'm1', emoji: '👍' }).success).toBe(true);
    expect(reactMessageBodySchema.safeParse({ messageId: '', emoji: '👍' }).success).toBe(false);
    expect(reactMessageBodySchema.safeParse({ messageId: 'm1', emoji: '' }).success).toBe(true);
  });

  it('visto exige conversationId', () => {
    expect(readMessagesBodySchema.safeParse({ conversationId: 'c1' }).success).toBe(true);
    expect(readMessagesBodySchema.safeParse({ conversationId: '' }).success).toBe(false);
    expect(readMessagesBodySchema.safeParse({}).success).toBe(false);
  });
});
