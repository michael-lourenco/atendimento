# 06 — Testes

## Política de execução

O agente **escreve** testes. O agente **não executa** testes (`npm test`, `yarn test`, `npx jest`, `npx playwright`, etc.). O usuário roda a suíte manualmente.

Não iniciar `next dev` / `next build` só para “validar” a menos que o usuário peça.

## Ferramentas alvo

Runner: Jest + `ts-jest` (`npm test`). Testing Library só quando houver teste de componente.

- Use cases e `core/engine`: unitário com fakes das portas (não Axios, **não** Supabase real)
- Não chamar o projeto Supabase em `npm test`
- Componentes: Testing Library só para comportamento, não snapshot de layout inteiro
- Route Handlers: testes de contrato (status + shape) com `IWhatsAppService` fake

## Cobertura atual

- `core/engine/planFlowTurn.test.ts` — primeira sessão, `nextStepId`, `condition` true/false, `setDepartment`
- `core/usecases/ProcessIncomingFlowUseCase.test.ts` — envio via fake + persistência de sessão; pausado não responde; action grava setor
- `core/usecases/PauseContactFlowUseCase.test.ts` — pausa e retoma sessão
- `core/usecases/CatalogUseCase.test.ts` — list/save/delete
- `core/usecases/TransferConversationUseCase.test.ts` — status transferred
- `core/usecases/AssignConversationUseCase.test.ts` — assumir (waiting) e finalizar (closed)
- `core/usecases/MarkConversationReadUseCase.test.ts` — zera unreadCount
- `core/usecases/LoginUseCase.test.ts` — porta de auth (senha obrigatória)
- `core/usecases/UpsertConversationFromMessageUseCase.test.ts` — cria conversa; ensure não infla não lidas
- `core/usecases/UpsertContactFromIncomingUseCase.test.ts` — nome do WhatsApp no catálogo de contatos
- `core/entities/conversationTabs.test.ts` — transferida em Esperando; filtro minhas
- `core/entities/conversationInbox.test.ts` — nome de exibição e prévia da última mensagem
- `core/entities/conversationDepartment.test.ts` — filtro de setor; agentes do mesmo setor
- `core/usecases/SetConversationDepartmentUseCase.test.ts` — grava e remove setor
- `infra/whatsapp/mapEvolutionIncoming.test.ts` — pushName; MESSAGES_UPSERT; ignora grupo/fromMe; tipo imagem
- `infra/whatsapp/evolutionMedia.test.ts` — parse base64; hydrate grava no storage fake
- `core/usecases/SendWhatsAppMessageUseCase.test.ts` — persiste outgoing; mídia vai ao storage fake
- `core/services/IMediaStorage.test.ts` — tipo pelo MIME; Meta/Twilio recusam mídia
- `infra/whatsapp/evolutionSendMedia.test.ts` — sendMedia vs sendWhatsAppAudio
- `app/api/messages/send/parseSendRequest.test.ts` — JSON e multipart; máx. 16 MB
- `ui/lib/flow-step-graph.test.ts` — ligar próximo passo ao adicionar; limpar refs ao remover; opções da pergunta na condição
- `ui/lib/flow-option-paths.test.ts` — cadeia de condições; destinos setor/mensagem
- `ui/lib/flow-step-copy.test.ts` — rótulo do passo sem expor id
- `ui/lib/inbox-notify.test.ts` — som só após a primeira carga, se não lidas sobem
- `ui/lib/flow-path-map.test.ts` — ligações Depois / Se sim / Se não
- `core/entities/whatsappNumberLive.test.ts` — lista de Números inclui a sessão ao vivo (wid)
- `core/usecases/SyncLiveWhatsAppNumberUseCase.test.ts` — primeira conexão grava; poll igual não regrava
- `ui/lib/status-tone.test.ts` — fila entrada/esperando/finalizado; ligado/desligado
- `ui/lib/contact-picker.test.ts` — busca nome/telefone; número novo; prefixo 55
- `core/entities/messageStatus.test.ts` — ack Evolution → tiques; não rebaixa lida
- `core/usecases/UpdateMessageStatusUseCase.test.ts` — avança sent→delivered
- `infra/whatsapp/mapEvolutionStatus.test.ts` — MESSAGES_UPDATE
- `core/entities/dueScheduledMessages.test.ts` — só pending com hora já passada
- `core/usecases/DispatchDueScheduledMessagesUseCase.test.ts` — vencido envia; futuro não; vazio/provedor → failed
- `infra/schedules/cronAuth.test.ts` — Bearer `CRON_SECRET`
- `infra/schedules/shouldStartInProcessScheduleCron.test.ts` — não sobe em test / build / Vercel

## Próximos

1. CRUD de `SaveFlowUseCase` / `DeleteFlowUseCase`
2. `HandleIncomingWhatsAppMessageUseCase` — persiste incoming

## Convenções

- Arquivos `*.test.ts` / `*.test.tsx` ao lado do sujeito ou em `tests/`
- Sem dados de prod; fakes em memória
- Nomes em português ou inglês, consistentes com o arquivo testado
- Após escrever testes, **listar os comandos** para o usuário rodar; não rodá-los
