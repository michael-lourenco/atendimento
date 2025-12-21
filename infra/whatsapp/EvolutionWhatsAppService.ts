import { IWhatsAppService, SendMessageParams, WhatsAppMessageResponse, WhatsAppWebhookEntry } from '../../core/services/IWhatsAppService';
import { Message } from '../../core/entities/Message';
import axios, { AxiosInstance } from 'axios';

/**
 * Implementação do serviço WhatsApp usando Evolution API como intermediário
 * 
 * Evolution API é uma solução open-source que usa WhatsApp Web para enviar/receber mensagens.
 * Pode ser self-hosted ou usado via serviço hospedado.
 * 
 * Vantagens:
 * - Gratuito (se self-hosted)
 * - API REST simples e direta
 * - Suporte completo a mídia, grupos, etc.
 * - Muito popular no Brasil
 * 
 * Para usar:
 * 1. Instale Evolution API (Docker ou hospedado)
 * 2. Crie uma instância
 * 3. Configure as variáveis de ambiente
 * 4. Configure o webhook no Evolution API
 * 
 * Documentação: https://doc.evolution-api.com/
 */
export class EvolutionWhatsAppService implements IWhatsAppService {
  private baseUrl: string;
  private apiKey: string;
  private instanceName: string;
  private verifyToken: string;
  private axiosClient: AxiosInstance;

  constructor() {
    this.baseUrl = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
    this.apiKey = process.env.EVOLUTION_API_KEY || '';
    this.instanceName = process.env.EVOLUTION_INSTANCE_NAME || 'default';
    this.verifyToken = process.env.EVOLUTION_VERIFY_TOKEN || process.env.WHATSAPP_VERIFY_TOKEN || '';

    // Criar cliente axios com configuração padrão
    this.axiosClient = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'apikey': this.apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 segundos
    });
  }

  async sendMessage(params: SendMessageParams): Promise<WhatsAppMessageResponse> {
    if (!this.apiKey || !this.instanceName) {
      throw new Error('Credenciais Evolution API não configuradas. Verifique as variáveis de ambiente: EVOLUTION_API_KEY, EVOLUTION_INSTANCE_NAME');
    }

    // Formatar número (remover caracteres não numéricos e garantir formato internacional)
    const toNumber = this.formatPhoneNumber(params.to);

    try {
      // Evolution API - Enviar mensagem de texto
      const response = await this.axiosClient.post(
        `/message/sendText/${this.instanceName}`,
        {
          number: toNumber,
          text: params.message,
        }
      );

      // Evolution API retorna estrutura diferente, adaptamos para formato esperado
      const messageId = response.data?.key?.id || response.data?.messageId || `evolution_${Date.now()}`;

      return {
        messaging_product: 'whatsapp',
        contacts: [{
          input: toNumber,
          wa_id: toNumber,
        }],
        messages: [{
          id: messageId,
        }],
      };
    } catch (error: any) {
      console.error('Erro ao enviar mensagem via Evolution API:', error);
      
      const errorMessage = error.response?.data?.message || error.message || 'Erro desconhecido';
      throw new Error(`Erro ao enviar mensagem WhatsApp via Evolution API: ${errorMessage}`);
    }
  }

  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    // Evolution API não usa verificação no mesmo formato da Meta
    // Mas mantemos compatibilidade para não quebrar o webhook existente
    if (mode === 'subscribe' && token === this.verifyToken) {
      return challenge;
    }
    return null;
  }

  async processWebhook(entry: WhatsAppWebhookEntry): Promise<Message[]> {
    const messages: Message[] = [];

    // Evolution API envia webhooks em formato diferente da Meta
    // Este método precisa processar o formato do Evolution
    
    // Se o webhook vier no formato Evolution (diretamente como mensagem)
    // Precisamos adaptar para o formato esperado
    
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
   * Formata número de telefone para formato internacional (ex: 5511999999999)
   */
  private formatPhoneNumber(phone: string): string {
    // Remove caracteres não numéricos
    let cleaned = phone.replace(/\D/g, '');

    // Se não começar com código do país, adiciona 55 (Brasil)
    if (!cleaned.startsWith('55')) {
      cleaned = '55' + cleaned;
    }

    return cleaned;
  }

  /**
   * Método auxiliar para processar webhook no formato Evolution API
   * Evolution envia webhooks em formato diferente, então precisamos adaptar
   */
  async processEvolutionWebhook(evolutionPayload: any): Promise<Message[]> {
    const messages: Message[] = [];

    // Evolution API envia webhooks com estrutura:
    // {
    //   event: 'messages.upsert',
    //   instance: 'instance-name',
    //   data: {
    //     key: { id: '...', remoteJid: '...' },
    //     message: { ... },
    //     messageTimestamp: 1234567890
    //   }
    // }

    if (evolutionPayload.event === 'messages.upsert' && evolutionPayload.data) {
      const data = evolutionPayload.data;
      const message = data.message;
      const key = data.key;
      
      if (!message || !key) {
        return messages;
      }

      let content = '';
      let type: 'text' | 'image' | 'document' | 'audio' | 'video' = 'text';

      // Processar diferentes tipos de mensagem do Evolution
      if (message.conversation || message.extendedTextMessage) {
        content = message.conversation || message.extendedTextMessage?.text || '';
        type = 'text';
      } else if (message.imageMessage) {
        content = message.imageMessage.caption || 'Imagem recebida';
        type = 'image';
      } else if (message.audioMessage) {
        content = 'Áudio recebido';
        type = 'audio';
      } else if (message.videoMessage) {
        content = message.videoMessage.caption || 'Vídeo recebido';
        type = 'video';
      } else if (message.documentMessage) {
        content = message.documentMessage.caption || message.documentMessage.fileName || 'Documento recebido';
        type = 'document';
      }

      // Extrair número do remetente (remoteJid tem formato: 5511999999999@s.whatsapp.net)
      const from = key.remoteJid?.split('@')[0] || '';

      const messageEntity: Message = {
        id: key.id || `evolution_${Date.now()}`,
        from,
        to: this.instanceName,
        content,
        type,
        timestamp: new Date((data.messageTimestamp || Date.now()) * 1000),
        direction: 'incoming',
        status: 'delivered',
      };

      messages.push(messageEntity);
    }

    return messages;
  }
}




