import axios, { AxiosInstance } from 'axios';

/**
 * Serviço para integração com chat-whatsapp (backend na AWS)
 * 
 * Este serviço consome a API REST do chat-whatsapp que está rodando
 * na AWS e expõe QR Code, status e mensagens.
 */
export interface QRCodeResponse {
  qr: string | null;
  available: boolean;
  connected: boolean;
}

export interface StatusResponse {
  connected: boolean;
  qrAvailable: boolean;
  info: {
    wid: string | null;
    pushname: string | null;
    platform: string | null;
  } | null;
}

export interface WhatsAppMessage {
  id: string;
  from: string;
  to: string;
  content: string;
  type: string;
  direction: 'incoming' | 'outgoing';
  timestamp: string;
  status: string;
}

export interface MessagesResponse {
  messages: WhatsAppMessage[];
  total: number;
  limit: number;
  offset: number;
}

export class ChatWhatsAppService {
  private baseUrl: string;
  private axiosClient: AxiosInstance;

  constructor() {
    // URL do chat-whatsapp (pode ser localhost para dev ou URL da AWS para prod)
    this.baseUrl = process.env.CHAT_WHATSAPP_API_URL || 'http://localhost:3000';
    
    this.axiosClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Obtém o QR Code atual para conexão do WhatsApp
   * Tenta primeiro /api/qr (versão nova), depois /qr-data (versão antiga)
   */
  async getQRCode(): Promise<QRCodeResponse> {
    try {
      // Tenta primeiro o endpoint novo /api/qr
      try {
        console.log(`[ChatWhatsAppService] Tentando obter QR Code de: ${this.baseUrl}/api/qr`);
        const response = await this.axiosClient.get<QRCodeResponse>('/api/qr');
        return response.data;
      } catch (newEndpointError: any) {
        // Se falhar, tenta o endpoint antigo /qr-data
        if (newEndpointError.response?.status === 404 || newEndpointError.code === 'ECONNREFUSED') {
          console.log(`[ChatWhatsAppService] Endpoint /api/qr não encontrado, tentando /qr-data`);
          const oldResponse = await this.axiosClient.get<{ qr: string | null; available: boolean }>('/qr-data');
          
          // Lógica baseada no chat-whatsapp (server.js linha 730-732):
          // Quando conecta (evento 'ready'), o servidor faz:
          //   currentQR = null;
          //   qrGenerated = false;
          // Então: qr === null E available === false = conectado
          // Esta é a mesma lógica que o servidor usa para limpar o QR Code
          const isConnected = oldResponse.data.qr === null && !oldResponse.data.available;
          
          // Converte formato antigo para novo formato
          return {
            qr: oldResponse.data.qr,
            available: oldResponse.data.available,
            connected: isConnected
          };
        }
        throw newEndpointError;
      }
    } catch (error: any) {
      console.error('Erro ao obter QR Code:', error);
      console.error(`URL base: ${this.baseUrl}`);
      console.error(`Erro completo:`, error.response?.data || error.message);
      throw new Error(`Erro ao obter QR Code do chat-whatsapp: ${error.message || 'Connection failed'}`);
    }
  }

  /**
   * Obtém o status da conexão WhatsApp
   * Tenta primeiro /api/status (versão nova), depois combina /health e /qr-data (versão antiga)
   * 
   * Lógica baseada no chat-whatsapp:
   * - Quando conecta (evento 'ready'), o servidor faz:
   *   - clientReady = true
   *   - currentQR = null
   *   - qrGenerated = false
   */
  async getStatus(): Promise<StatusResponse> {
    try {
      // Tenta primeiro o endpoint novo /api/status
      try {
        const response = await this.axiosClient.get<StatusResponse>('/api/status');
        return response.data;
      } catch (newEndpointError: any) {
        // Se falhar, usa os endpoints antigos /health e /qr-data
        if (newEndpointError.response?.status === 404) {
          console.log(`[ChatWhatsAppService] Endpoint /api/status não encontrado, usando /health e /qr-data`);
          
          // Busca ambos os endpoints em paralelo
          const [healthResponse, qrDataResponse] = await Promise.all([
            this.axiosClient.get<{ status: string; qrAvailable: boolean; connected?: boolean }>('/health'),
            this.axiosClient.get<{ qr: string | null; available: boolean }>('/qr-data')
          ]);
          
          let isConnected = false;
          
          // Estratégia 1: Se /health tem o campo connected, usa ele (versão nova)
          if (healthResponse.data.connected !== undefined) {
            isConnected = healthResponse.data.connected;
            console.log(`[ChatWhatsAppService] Status do /health: connected=${isConnected}`);
          } else {
            // Estratégia 2: Usa a mesma lógica do chat-whatsapp
            // Quando conecta: currentQR = null E qrGenerated = false
            // Então: qr === null E available === false = conectado
            const qrIsNull = qrDataResponse.data.qr === null;
            const qrNotAvailable = !qrDataResponse.data.available;
            
            // Conectado quando: QR Code é null E não está disponível
            // (Isso é exatamente o que acontece no server.js linha 730-732 quando conecta)
            isConnected = qrIsNull && qrNotAvailable;
            
            console.log(`[ChatWhatsAppService] Status inferido do /qr-data: connected=${isConnected}`);
            console.log(`[ChatWhatsAppService] Detalhes: qr=${qrIsNull ? 'null' : 'presente'}, available=${qrDataResponse.data.available}`);
          }
          
          // Converte formato antigo para novo formato
          return {
            connected: isConnected,
            qrAvailable: healthResponse.data.qrAvailable || qrDataResponse.data.available,
            info: null // Não temos essa info no endpoint antigo
          };
        }
        throw newEndpointError;
      }
    } catch (error) {
      console.error('Erro ao obter status:', error);
      throw new Error('Erro ao obter status do chat-whatsapp');
    }
  }

  /**
   * Lista mensagens recentes
   * Tenta primeiro /api/messages (versão nova), se não existir retorna lista vazia
   */
  async getMessages(limit: number = 50, offset: number = 0): Promise<MessagesResponse> {
    try {
      const response = await this.axiosClient.get<MessagesResponse>('/api/messages', {
        params: { limit, offset },
      });
      return response.data;
    } catch (error: any) {
      // Se o endpoint não existir (404), retorna lista vazia
      if (error.response?.status === 404) {
        console.warn('[ChatWhatsAppService] Endpoint /api/messages não encontrado. Servidor precisa ser atualizado.');
        return {
          messages: [],
          total: 0,
          limit,
          offset
        };
      }
      console.error('Erro ao obter mensagens:', error);
      throw new Error('Erro ao obter mensagens do chat-whatsapp');
    }
  }

  /**
   * Obtém mensagens de um usuário específico
   */
  async getMessagesByUser(userId: string): Promise<{ messages: WhatsAppMessage[]; total: number }> {
    try {
      const response = await this.axiosClient.get<{ messages: WhatsAppMessage[]; total: number }>(
        `/api/messages/${userId}`
      );
      return response.data;
    } catch (error) {
      console.error('Erro ao obter mensagens do usuário:', error);
      throw new Error('Erro ao obter mensagens do usuário');
    }
  }

  /**
   * Envia uma mensagem via WhatsApp
   */
  async sendMessage(to: string, message: string): Promise<{ success: boolean; message: WhatsAppMessage }> {
    try {
      const response = await this.axiosClient.post<{ success: boolean; message: WhatsAppMessage }>(
        '/api/messages',
        { to, message }
      );
      return response.data;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw new Error('Erro ao enviar mensagem via chat-whatsapp');
    }
  }
}

