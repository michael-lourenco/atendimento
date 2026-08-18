import 'server-only';

import { createMockRepositoryBag, RepositoryBag } from './createMockRepositoryBag';
import { isPublicSupabaseConfigured, isTestEnv } from '../supabase/env';
import { createServiceRoleClient, isServiceRoleConfigured } from '../supabase/serviceRoleClient';
import { createSupabaseDataBag } from '../supabase/createSupabaseDataBag';
import { mockAuthRepository } from '../mocks/MockAuthRepository';
import { mockMediaStorage } from '../mocks/MockMediaStorage';
import { createWhatsAppServiceFromEnv } from '../whatsapp/createFromEnv';
import { HandleIncomingWhatsAppMessageUseCase } from '../../core/usecases/HandleIncomingWhatsAppMessageUseCase';
import { ProcessIncomingFlowUseCase } from '../../core/usecases/ProcessIncomingFlowUseCase';
import { SendWhatsAppMessageUseCase } from '../../core/usecases/SendWhatsAppMessageUseCase';
import { UpsertConversationFromMessageUseCase } from '../../core/usecases/UpsertConversationFromMessageUseCase';
import { UpsertContactFromIncomingUseCase } from '../../core/usecases/UpsertContactFromIncomingUseCase';
import { IWhatsAppService } from '../../core/services/IWhatsAppService';
import { IMediaStorage } from '../../core/services/IMediaStorage';
import { SupabaseMediaStorage } from '../supabase/SupabaseMediaStorage';

class ServerLocator {
  private repos: RepositoryBag | null = null;
  private whatsApp: IWhatsAppService | null = null;
  private media: IMediaStorage | null = null;

  getRepos(): RepositoryBag {
    if (!this.repos) {
      if (!isTestEnv() && isPublicSupabaseConfigured() && isServiceRoleConfigured()) {
        this.repos = createSupabaseDataBag(createServiceRoleClient(), mockAuthRepository);
      } else {
        this.repos = createMockRepositoryBag();
      }
    }
    return this.repos;
  }

  getMediaStorage(): IMediaStorage {
    if (!this.media) {
      if (!isTestEnv() && isPublicSupabaseConfigured() && isServiceRoleConfigured()) {
        this.media = new SupabaseMediaStorage(createServiceRoleClient());
      } else {
        this.media = mockMediaStorage;
      }
    }
    return this.media;
  }

  getWhatsAppService(): IWhatsAppService {
    if (!this.whatsApp) {
      this.whatsApp = createWhatsAppServiceFromEnv();
    }
    return this.whatsApp;
  }

  createIncomingHandler(): HandleIncomingWhatsAppMessageUseCase {
    const repos = this.getRepos();
    const whatsApp = this.getWhatsAppService();
    const upsertContact = new UpsertContactFromIncomingUseCase(repos.contact);
    const upsert = new UpsertConversationFromMessageUseCase(repos.conversation, repos.contact);
    const send = new SendWhatsAppMessageUseCase(whatsApp, repos.message, upsert, upsertContact);
    const flow = new ProcessIncomingFlowUseCase(repos.flow, repos.flowSession, send);
    return new HandleIncomingWhatsAppMessageUseCase(
      whatsApp,
      repos.message,
      flow,
      upsert,
      upsertContact
    );
  }
}

export const serverLocator = new ServerLocator();
