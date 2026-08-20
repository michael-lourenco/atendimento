import { DispatchDueScheduledMessagesUseCase } from '@/core/usecases/DispatchDueScheduledMessagesUseCase';
import { PauseContactFlowUseCase } from '@/core/usecases/PauseContactFlowUseCase';
import { SendWhatsAppMessageUseCase } from '@/core/usecases/SendWhatsAppMessageUseCase';
import { UpsertContactFromIncomingUseCase } from '@/core/usecases/UpsertContactFromIncomingUseCase';
import { UpsertConversationFromMessageUseCase } from '@/core/usecases/UpsertConversationFromMessageUseCase';
import { serverLocator } from '@/infra/adapters/serverLocator';

let inFlight: Promise<{ sent: string[]; failed: string[] }> | null = null;

export function runDispatchDueScheduledMessages() {
  if (inFlight) {
    return inFlight;
  }
  const locator = serverLocator;
  const repos = locator.getRepos();
  const upsert = new UpsertConversationFromMessageUseCase(
    repos.conversation,
    repos.contact,
    repos.whatsAppNumber
  );
  const upsertContact = new UpsertContactFromIncomingUseCase(repos.contact);
  const send = new SendWhatsAppMessageUseCase(
    locator.getWhatsAppService(),
    repos.message,
    upsert,
    upsertContact,
    locator.getMediaStorage(),
    repos.conversation,
    repos.whatsAppNumber
  );
  const pause = new PauseContactFlowUseCase(repos.flowSession, repos.flow);
  inFlight = new DispatchDueScheduledMessagesUseCase(repos.scheduledMessage, send, pause)
    .execute()
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}
