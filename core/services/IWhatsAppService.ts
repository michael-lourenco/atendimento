import { Message } from '../entities/Message';

export interface WhatsAppMessageResponse {
  messaging_product: string;
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string;
  }>;
}

export interface SendMessageParams {
  to: string;
  message: string;
  type?: 'text' | 'template';
  templateName?: string;
  templateParams?: string[];
}

export interface WhatsAppWebhookEntry {
  id: string;
  changes: Array<{
    value: {
      messaging_product: string;
      metadata: {
        display_phone_number: string;
        phone_number_id: string;
      };
      contacts?: Array<{
        profile: {
          name: string;
        };
        wa_id: string;
      }>;
      messages?: Array<{
        from: string;
        id: string;
        timestamp: string;
        type: string;
        text?: {
          body: string;
        };
        image?: {
          caption?: string;
          mime_type: string;
          sha256: string;
          id: string;
        };
        audio?: {
          mime_type: string;
          sha256: string;
          id: string;
        };
        video?: {
          caption?: string;
          mime_type: string;
          sha256: string;
          id: string;
        };
        document?: {
          caption?: string;
          filename: string;
          sha256: string;
          mime_type: string;
          id: string;
        };
        context?: {
          from: string;
          id: string;
        };
      }>;
      statuses?: Array<{
        id: string;
        status: 'sent' | 'delivered' | 'read' | 'failed';
        timestamp: string;
        recipient_id: string;
      }>;
    };
  }>;
}

export interface IWhatsAppService {
  /**
   * Envia uma mensagem via WhatsApp
   */
  sendMessage(params: SendMessageParams): Promise<WhatsAppMessageResponse>;

  /**
   * Verifica a assinatura do webhook (usado para verificação inicial)
   */
  verifyWebhook(mode: string, token: string, challenge: string): string | null;

  /**
   * Processa uma mensagem recebida do webhook
   */
  processWebhook(entry: WhatsAppWebhookEntry): Promise<Message[]>;
}




