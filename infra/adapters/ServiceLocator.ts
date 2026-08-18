import { RepositoryBag, createMockRepositoryBag } from './createMockRepositoryBag';
import { isPublicSupabaseConfigured, isTestEnv } from '../supabase/env';
import { createBrowserSupabase } from '../supabase/browserClient';
import { createSupabaseDataBag } from '../supabase/createSupabaseDataBag';
import { SupabaseAuthRepository } from '../supabase/SupabaseAuthRepository';

function createBag(): RepositoryBag {
  if (isTestEnv()) {
    return createMockRepositoryBag();
  }
  if (isPublicSupabaseConfigured()) {
    return createSupabaseDataBag(createBrowserSupabase(), new SupabaseAuthRepository());
  }
  return createMockRepositoryBag();
}

class ServiceLocator {
  private repos: RepositoryBag | null = null;

  private getRepos(): RepositoryBag {
    if (!this.repos) {
      this.repos = createBag();
    }
    return this.repos;
  }

  getFlowRepository() {
    return this.getRepos().flow;
  }
  getMessageRepository() {
    return this.getRepos().message;
  }
  getAuthRepository() {
    return this.getRepos().auth;
  }
  getFlowSessionRepository() {
    return this.getRepos().flowSession;
  }
  getConversationRepository() {
    return this.getRepos().conversation;
  }
  getDepartmentRepository() {
    return this.getRepos().department;
  }
  getInternalMessageRepository() {
    return this.getRepos().internalMessage;
  }
  getChatbotRepository() {
    return this.getRepos().chatbot;
  }
  getAgentRepository() {
    return this.getRepos().agent;
  }
  getContactRepository() {
    return this.getRepos().contact;
  }
  getWhatsAppNumberRepository() {
    return this.getRepos().whatsAppNumber;
  }
  getTagRepository() {
    return this.getRepos().tag;
  }
  getScheduledMessageRepository() {
    return this.getRepos().scheduledMessage;
  }
  getReportRepository() {
    return this.getRepos().report;
  }
}

export const serviceLocator = new ServiceLocator();
