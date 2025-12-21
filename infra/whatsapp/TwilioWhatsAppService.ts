import { IWhatsAppService, SendMessageParams, WhatsAppMessageResponse, WhatsAppWebhookEntry } from '../../core/services/IWhatsAppService';
import { Message } from '../../core/entities/Message';

/**
 * Implementação do serviço WhatsApp usando Twilio como intermediário
 * 
 * Esta implementação usa a API do Twilio para enviar e receber mensagens WhatsApp
 * sem precisar se conectar diretamente à API oficial da Meta.
 * 
 * Vantagens:
 * - Setup mais simples (sem aprovação da Meta)
 * - API REST mais direta
 * - Boa documentação e suporte
 * 
 * Para usar:
 * 1. Crie uma conta no Twilio: https://www.twilio.com/
 * 2. Obtenha um número WhatsApp Business verificado
 * 3. Configure as variáveis de ambiente (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, etc.)
 * 4. Configure o webhook no Twilio Console apontando para: {NEXT_PUBLIC_APP_URL}/api/webhook/whatsapp
 */
export class TwilioWhatsAppService implements IWhatsAppService {
  private accountSid: string;
  private authToken: string;
  private whatsappNumber: string;
  private verifyToken: string;
  private twilioClient: any;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || '';
    this.verifyToken = process.env.TWILIO_VERIFY_TOKEN || process.env.WHATSAPP_VERIFY_TOKEN || '';

    // Inicializar cliente Twilio (lazy loading para evitar erro se não instalado)
    if (this.accountSid && this.authToken) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const twilio = require('twilio');
        this.twilioClient = twilio(this.accountSid, this.authToken);
      } catch (error) {
        console.warn('Twilio SDK não instalado. Execute: npm install twilio');
      }
    }
  }

  async sendMessage(params: SendMessageParams): Promise<WhatsAppMessageResponse> {
    if (!this.accountSid || !this.authToken || !this.whatsappNumber) {
      throw new Error('Credenciais Twilio não configuradas. Verifique as variáveis de ambiente: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER');
    }

    if (!this.twilioClient) {
      throw new Error('Cliente Twilio não inicializado. Instale o SDK: npm install twilio');
    }

    // Formatar número (Twilio espera formato E.164: +5511999999999)
    const toNumber = this.formatPhoneNumber(params.to);

    try {
      // Twilio não suporta templates da mesma forma que Meta
      // Para templates, você precisaria usar Twilio Studio ou criar templates customizados
      const message = await this.twilioClient.messages.create({
        from: `whatsapp:${this.whatsappNumber}`,
        to: `whatsapp:${toNumber}`,
        body: params.message,
      });

      return {
        messaging_product: 'whatsapp',
        contacts: [{
          input: toNumber,
          wa_id: toNumber,
        }],
        messages: [{
          id: message.sid,
        }],
      };
    } catch (error: any) {
      console.error('Erro ao enviar mensagem via Twilio:', error);
      throw new Error(`Erro ao enviar mensagem WhatsApp via Twilio: ${error.message}`);
    }
  }

  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    // Twilio usa validação diferente, mas mantemos compatibilidade com formato Meta
    // Para Twilio, a validação real é feita via assinatura da requisição
    if (mode === 'subscribe' && token === this.verifyToken) {
      return challenge;
    }
    return null;
  }

  async processWebhook(entry: WhatsAppWebhookEntry): Promise<Message[]> {
    const messages: Message[] = [];

    // Twilio envia webhooks em formato diferente da Meta
    // Este método precisa ser adaptado quando você configurar o webhook do Twilio
    // Por enquanto, mantemos compatibilidade com estrutura Meta
    
    for (const change of entry.changes) {
      const value = change.value;

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

      if (value.statuses) {
        for (const status of value.statuses) {
          console.log(`Status atualizado: ${status.id} -> ${status.status}`);
        }
      }
    }

    return messages;
  }

  /**
   * Formata número de telefone para formato E.164 (ex: +5511999999999)
   */
  private formatPhoneNumber(phone: string): string {
    // Remove caracteres não numéricos
    let cleaned = phone.replace(/\D/g, '');

    // Se não começar com código do país, adiciona 55 (Brasil)
    if (!cleaned.startsWith('55')) {
      cleaned = '55' + cleaned;
    }

    // Adiciona o + no início
    return '+' + cleaned;
  }
}




