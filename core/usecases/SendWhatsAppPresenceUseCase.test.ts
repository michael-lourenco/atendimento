import { IWhatsAppService, SendPresenceParams } from '../services/IWhatsAppService';
import { SendWhatsAppPresenceUseCase } from './SendWhatsAppPresenceUseCase';

describe('SendWhatsAppPresenceUseCase', () => {
  it('no-op se o serviço não tiver sendPresence', async () => {
    const whatsApp = {
      async sendMessage() {
        throw new Error('não');
      },
    } as unknown as IWhatsAppService;
    await expect(
      new SendWhatsAppPresenceUseCase(whatsApp).execute({ to: '5511', presence: 'composing' })
    ).resolves.toBeUndefined();
  });

  it('envia composing', async () => {
    const sent: SendPresenceParams[] = [];
    const whatsApp = {
      sendPresence: async (params: SendPresenceParams) => {
        sent.push(params);
      },
    } as unknown as IWhatsAppService;
    await new SendWhatsAppPresenceUseCase(whatsApp).execute({
      to: '5511',
      presence: 'composing',
      instanceName: 'comercial',
    });
    expect(sent[0]).toMatchObject({ to: '5511', presence: 'composing', instanceName: 'comercial' });
  });

  it('recording usa delay maior', async () => {
    const sent: SendPresenceParams[] = [];
    const whatsApp = {
      sendPresence: async (params: SendPresenceParams) => {
        sent.push(params);
      },
    } as unknown as IWhatsAppService;
    await new SendWhatsAppPresenceUseCase(whatsApp).execute({
      to: '5511',
      presence: 'recording',
    });
    expect(sent[0]).toMatchObject({ presence: 'recording', delayMs: 25000 });
  });
});
