import { IWhatsAppService, SendMessageParams, WhatsAppMessageResponse, WhatsAppWebhookEntry } from '../../core/services/IWhatsAppService';
import { Message } from '../../core/entities/Message';

export class WhatsAppService implements IWhatsAppService {
  private phoneNumberId: string;
  private accessToken: string;
  private apiVersion: string;
  private verifyToken: string;
  private baseUrl: string;

  constructor() {
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
    this.apiVersion = process.env.WHATSAPP_API_VERSION || 'v21.0';
    this.verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || '';
    this.baseUrl = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
  }

  async sendMessage(params: SendMessageParams): Promise<WhatsAppMessageResponse> {
    if (!this.phoneNumberId || !this.accessToken) {
      throw new Error('WhatsApp credentials não configuradas. Verifique as variáveis de ambiente.');
    }

    const payload: any = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: params.to.replace(/\D/g, ''), // Remove caracteres não numéricos
      type: params.type || 'text',
    };

    if (params.type === 'template' && params.templateName) {
      payload.template = {
        name: params.templateName,
        language: {
          code: 'pt_BR',
        },
      };

      if (params.templateParams && params.templateParams.length > 0) {
        payload.template.components = [
          {
            type: 'body',
            parameters: params.templateParams.map((param) => ({
              type: 'text',
              text: param,
            })),
          },
        ];
      }
    } else {
      payload.text = {
        body: params.message,
      };
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Erro ao enviar mensagem WhatsApp: ${response.status} - ${JSON.stringify(errorData)}`
        );
      }

      const data: WhatsAppMessageResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao enviar mensagem WhatsApp:', error);
      throw error;
    }
  }

  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    if (mode === 'subscribe' && token === this.verifyToken) {
      return challenge;
    }
    return null;
  }

  async processWebhook(entry: WhatsAppWebhookEntry): Promise<Message[]> {
    const messages: Message[] = [];

    for (const change of entry.changes) {
      const value = change.value;

      // Processar mensagens recebidas
      if (value.messages) {
        for (const msg of value.messages) {
          let content = '';
          let type: 'text' | 'image' | 'document' | 'audio' | 'video' = 'text';

          if (msg.text) {
            content = msg.text.body;
            type = 'text';
          } else if (msg.image) {
            content = msg.image.caption || 'Imagem recebida';
            type = 'image';
          } else if (msg.audio) {
            content = 'Áudio recebido';
            type = 'audio';
          } else if (msg.video) {
            content = msg.video.caption || 'Vídeo recebido';
            type = 'video';
          } else if (msg.document) {
            content = msg.document.caption || msg.document.filename || 'Documento recebido';
            type = 'document';
          }

          const message: Message = {
            id: msg.id,
            from: msg.from,
            to: value.metadata.phone_number_id,
            content,
            type,
            timestamp: new Date(parseInt(msg.timestamp) * 1000),
            direction: 'incoming',
            status: 'delivered',
          };

          messages.push(message);
        }
      }

      // Processar status de mensagens enviadas
      if (value.statuses) {
        for (const status of value.statuses) {
          // Aqui você pode atualizar o status de mensagens já salvas
          // Por enquanto, apenas logamos
          console.log(`Status atualizado: ${status.id} -> ${status.status}`);
        }
      }
    }

    return messages;
  }
}




