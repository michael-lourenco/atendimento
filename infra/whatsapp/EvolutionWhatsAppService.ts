import { IWhatsAppService, SendMessageParams, WhatsAppMessageResponse, WhatsAppWebhookEntry } from '../../core/services/IWhatsAppService';
import { Message } from '../../core/entities/Message';
import axios, { AxiosInstance } from 'axios';
import { mapEvolutionIncomingMessages } from './mapEvolutionIncoming';
import { parseEvolutionMediaResponse, DownloadedMedia } from './evolutionMedia';
import { StoredMedia } from '../../core/services/IMediaStorage';
import { evolutionSendEnvelope, sendEvolutionMedia } from './evolutionSendMedia';

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
      timeout: 30000,
    });
  }

  async sendMessage(params: SendMessageParams): Promise<WhatsAppMessageResponse> {
    const instanceName = params.instanceName?.trim() || this.instanceName;
    if (!this.apiKey || !instanceName) {
      throw new Error('Credenciais Evolution API não configuradas. Verifique as variáveis de ambiente: EVOLUTION_API_KEY, EVOLUTION_INSTANCE_NAME');
    }

    const toNumber = this.formatPhoneNumber(params.to);

    try {
      if (params.media) {
        return await sendEvolutionMedia(this.axiosClient, instanceName, toNumber, params);
      }

      const response = await this.axiosClient.post(`/message/sendText/${instanceName}`, {
        number: toNumber,
        text: params.message,
      });
      return evolutionSendEnvelope(toNumber, response.data);
    } catch (error: any) {
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
    const instanceName =
      typeof evolutionPayload?.instance === 'string' && evolutionPayload.instance.trim()
        ? evolutionPayload.instance.trim()
        : this.instanceName;
    const messages = mapEvolutionIncomingMessages(evolutionPayload, instanceName);
    for (const message of messages) {
      if (!message.contactName) {
        message.contactName = await this.lookupPushName(message.from, instanceName);
      }
    }
    return messages;
  }

  async downloadMedia(input: {
    messageId: string;
    webhookItem?: Record<string, unknown>;
    convertToMp4?: boolean;
    remoteJid?: string;
    fromMe?: boolean;
    instanceName?: string;
  }): Promise<DownloadedMedia | null> {
    const instanceName = input.instanceName?.trim() || this.instanceName;
    if (!this.apiKey || !instanceName) {
      return null;
    }
    try {
      const response = await this.axiosClient.post(
        `/chat/getBase64FromMediaMessage/${instanceName}`,
        {
          message:
            input.webhookItem ?? {
              key: {
                id: input.messageId,
                remoteJid: input.remoteJid,
                fromMe: Boolean(input.fromMe),
              },
            },
          convertToMp4: Boolean(input.convertToMp4),
        },
        { timeout: 120000 }
      );
      return parseEvolutionMediaResponse(response.data);
    } catch {
      return null;
    }
  }

  async fetchProfilePicture(phone: string, instanceName?: string): Promise<StoredMedia | null> {
    const instance = instanceName?.trim() || this.instanceName;
    const number = phone.replace(/\D/g, '');
    if (!this.apiKey || !instance || !number) {
      return null;
    }
    try {
      const response = await this.axiosClient.post(`/chat/fetchProfilePictureUrl/${instance}`, {
        number,
      });
      const body = response.data ?? {};
      const url =
        body.profilePictureUrl ||
        body.picture ||
        body.url ||
        body.wuid ||
        body.data?.profilePictureUrl;
      if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
        return null;
      }
      const image = await axios.get<ArrayBuffer>(url, {
        responseType: 'arraybuffer',
        timeout: 15000,
      });
      const rawType = String(image.headers['content-type'] ?? '').split(';')[0];
      const mimeType = rawType.startsWith('image/') ? rawType : 'image/jpeg';
      return { bytes: new Uint8Array(image.data), mimeType };
    } catch {
      return null;
    }
  }

  private async lookupPushName(phone: string, instanceName = this.instanceName): Promise<string | undefined> {
    if (!this.apiKey || !phone) {
      return undefined;
    }
    try {
      const response = await this.axiosClient.post(`/chat/fetchProfile/${instanceName}`, {
        number: phone,
      });
      const body = response.data ?? {};
      const name = body.name || body.pushName || body.pushname || body.numberName;
      return typeof name === 'string' && name.trim() ? name.trim() : undefined;
    } catch {
      return undefined;
    }
  }
}





