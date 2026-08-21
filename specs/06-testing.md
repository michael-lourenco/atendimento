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

- `core/engine/planFlowTurn.test.ts` — primeira sessão, `nextStepId`, `condition` true/false (texto ou **número** da opção), `setDepartment`, `goToFlow`; sessão encerrada não reenvia a abertura
- `core/engine/resolveActiveFlow.test.ts` — `flowId` do chatbot ativo na entrada; overlay da linha; sessão em andamento não troca; inativo cai no `inicio`
- `core/engine/resolveQuestionChoice.test.ts` — `1` / `1.` viram a primeira opção; texto livre permanece
- `core/usecases/ProcessIncomingFlowUseCase.test.ts` — envio via fake + persistência de sessão; pausado não responde; action grava setor da thread; duas linhas = duas sessões; entrada pelo `flowId` do chatbot ou da linha
- `core/usecases/ProcessIncomingFlowUseCase.hours.test.ts` — fora do expediente só avisa; overlay da linha; `handoff` acrescenta posição na fila
- `core/usecases/PauseContactFlowUseCase.test.ts` — pausa e retoma sessão da thread (`contactId` = `Conversation.id`); sem sessão cria no fluxo de entrada do chatbot
- `core/usecases/DeleteFlowUseCase.test.ts` — excluir fluxo remove sessões daquele roteiro e solta chatbot e linha
- `core/usecases/TransferConversationUseCase.test.ts` — status transferred
- `core/usecases/AssignConversationUseCase.test.ts` — assumir (waiting) e finalizar (closed)
- `core/usecases/MarkConversationReadUseCase.test.ts` — zera unreadCount
- `core/usecases/MarkWhatsAppMessagesReadUseCase.test.ts` — envia ids incoming; no-op sem `markMessagesRead`; conversa inexistente
- `infra/whatsapp/evolutionMarkMessagesRead.test.ts` — payload `readMessages`
- `ui/lib/ptt-file.test.ts` — arquivo a partir dos blobs; sem MediaRecorder o PTT não quebra
- `ui/lib/ptt-slide-cancel.test.ts` — deslizar para cima além do limiar cancela o PTT
- `ui/lib/quick-reply-picker-keys.test.ts` — `/` com campo vazio e `Ctrl`/`⌘`+`/` abrem o picker
- `ui/lib/quick-reply-audio.test.ts` — cadastro recusa arquivo que não é áudio
- `core/usecases/LoginUseCase.test.ts` — porta de auth (senha obrigatória); agente `offline` recusa
- `core/usecases/GetCurrentUserUseCase.test.ts` — agente `offline` faz logout
- `core/usecases/GetAllConversationsUseCase.test.ts` — lista o catálogo; com snapshot não relê mensagens; `execute(true)` preenche e grava a prévia; se gravar falhar ainda devolve a prévia; padrão / `execute(false)` hidrata e não grava
- `core/usecases/UpsertConversationFromMessageUseCase.test.ts` — cria conversa; ensure não infla não lidas; **duas linhas = duas conversas** (mesmo telefone, ids `{digitos}:{lineA}` e `{digitos}:{lineB}`, mesmo `contactPhone`); **legado não duplica** (`id` = telefone já com `whatsappNumberId` daquela linha permanece; só cria `phone:lineId` se o telefone já tem thread em **outra** linha)
- `core/usecases/UpsertContactFromIncomingUseCase.test.ts` — nome do WhatsApp no catálogo de contatos
- `core/usecases/SyncContactAvatarUseCase.test.ts` — grava foto no storage; não refaz se já houver `avatarUrl`; falha do provedor não quebra
- `core/entities/contactAvatarBackfill.test.ts` — threads sem foto; um alvo por telefone; lote
- `core/usecases/SyncMissingContactAvatarsUseCase.test.ts` — copia href já existente; busca só quem ainda não tem; respeita o lote
- `core/entities/conversationTabs.test.ts` — transferida em Esperando; filtro minhas
- `core/entities/conversationInbox.test.ts` — nome de exibição; inicial do avatar; href da foto; prévia texto / Você: / Foto / Áudio; Sem mensagens só sem lastMessage; outgoing da lista tem tiques à esquerda; digitando cobre a prévia; outgoing `failed` = `conversationPreviewFailed`
- `core/usecases/UpdateMessageStatusUseCase.test.ts` — avança sent→delivered; se o id é o lastMessage da conversa, atualiza o snapshot
- `core/entities/messageReaction.test.ts` — um emoji por remetente; vazio remove; agrupa chips; reload sem `reactions` não apaga o chip da tela
- `core/usecases/ApplyMessageReactionUseCase.test.ts` — grava no alvo; alvo inexistente retorna null
- `core/usecases/SendMessageReactionUseCase.test.ts` — envia e persiste; mesmo emoji da linha remove
- `infra/whatsapp/mapEvolutionIncoming.test.ts` — `reactionMessage` não vira bolha; mapeia alvo + emoji; `contextInfo` vira citação
- `core/entities/lastMessageForConversation.test.ts` — última mensagem da thread (telefone + linha); ack atualiza o snapshot da prévia; busca pelo texto
- `core/entities/conversationThread.test.ts` — `conversationThreadId`; legado vs outra linha; `?contact=` abre a mais recente; `threadsForContactPhone` ordena pela atividade; mensagens filtradas por linha
- `core/entities/whatsappNumberLine.test.ts` — liga instância/dígitos ao cadastro; linha de envio da conversa; `lineNameOf` usa o `name` do catálogo
- `core/entities/conversationDepartment.test.ts` — filtro de setor; agentes do mesmo setor; transferência só online
- `core/usecases/SetConversationDepartmentUseCase.test.ts` — grava e remove setor na conversa da thread (`id`); não grava numa conversa “só telefone” se já existir thread composta
- `core/usecases/SetConversationTagsUseCase.test.ts` — grava tags da thread
- `core/entities/businessHours.test.ts` — fora do expediente; dentro no fuso; sábado com horário próprio; legado `days`+`start`/`end`; turno 22h–6h atravessa meia-noite; overlay da linha
- `core/entities/queuePlace.test.ts` — posição na fila do mesmo setor
- `core/usecases/GetDashboardMetricsUseCase.test.ts` — totais; volume por setor; média até Assumir; 1ª resposta humana; fila sem dono ≥ 5 min
- `core/entities/slaMetrics.test.ts` — fila sem dono ≥ 5 min; `queueWaitLabel` (há X min / sem dono)
- `core/entities/quotedPreview.test.ts` — corta em 200 chars
- `core/usecases/GetSchemaHealthUseCase.test.ts` — probe marca coluna ausente
- `infra/whatsapp/mapEvolutionPresence.test.ts` — composing/paused; ignora grupo
- `core/usecases/ApplyContactTypingUseCase.test.ts` — grava `contactTypingAt`; paused zera
- `core/usecases/SendWhatsAppPresenceUseCase.test.ts` — no-op se o serviço não tiver `sendPresence`; falha do provedor não rejeita
- `ui/lib/composer-presence.test.ts` — `paused` só depois de `composing`/`recording`
- `infra/whatsapp/mapEvolutionIncoming.test.ts` — pushName; MESSAGES_UPSERT; ignora grupo/fromMe; tipo imagem
- `infra/whatsapp/evolutionMedia.test.ts` — parse base64; hydrate grava no storage fake
- `core/usecases/SendWhatsAppMessageUseCase.test.ts` — persiste outgoing; mídia vai ao storage fake; `quotedMessageId` quando o alvo existe
- `core/services/IMediaStorage.test.ts` — tipo pelo MIME; Meta/Twilio recusam mídia; path de áudio de resposta rápida; `flowStepMediaPath` / `flowStepMediaApiHref`; `remove` apaga o objeto
- `infra/whatsapp/evolutionSendMedia.test.ts` — sendMedia vs sendWhatsAppAudio
- `app/api/messages/send/parseSendRequest.test.ts` — JSON e multipart; máx. 16 MB; `conversationId` opcional
- `ui/lib/flow-step-graph.test.ts` — ligar próximo passo ao adicionar; limpar refs ao remover; opções da pergunta na condição
- `ui/lib/flow-option-paths.test.ts` — cadeia de condições; destinos setor/mensagem/fluxo; chave estável das opções
- `ui/lib/flow-step-outline.test.ts` — condições da pergunta não são blocos soltos; destino da opção em texto
- `ui/lib/flow-step-copy.test.ts` — rótulo do passo sem expor id; resumo com o bloco recolhido
- `ui/lib/conversation-thread-body.test.ts` — abrir conversa: carregando até a busca; vazio só sem mensagens; lista quando há mensagens
- `ui/lib/inbox-realtime-channel.test.ts` — lista e thread compartilham o canal; não registra `postgres_changes` depois do `subscribe`
- `ui/lib/flow-path-map.test.ts` — ligações Depois / Se sim / Se não
- `ui/lib/flow-canvas-graph.test.ts` — nós sem condições da pergunta; setas next/opção; `canvasPosition`; ligar/desligar handle
- `core/engine/flowHealth.test.ts` — bloco solto; pergunta sem opção; goToFlow vazio; path/href de Storage válido; valor solto inválido
- `core/engine/matchFlowByKeyword.test.ts` — atalho de outro fluxo ativo
- `core/engine/planFlowTurn.test.ts` — também `returnStack`, `handoff`, keyword
- `core/entities/whatsappNumberLive.test.ts` — lista de Números inclui a sessão ao vivo (wid); sync preserva `behavior`, `flowId` e `businessHours` da linha
- `core/usecases/SyncLiveWhatsAppNumberUseCase.test.ts` — primeira conexão grava; poll igual não regrava
- `ui/lib/status-tone.test.ts` — fila entrada/esperando/finalizado; ligado/desligado
- `ui/lib/contact-picker.test.ts` — busca nome/telefone; número novo; prefixo 55
- `core/entities/messageStatus.test.ts` — ack Evolution → tiques; não rebaixa lida
- `core/usecases/UpdateMessageStatusUseCase.test.ts` — avança sent→delivered; lastMessage da conversa acompanha o ack
- `infra/whatsapp/mapEvolutionStatus.test.ts` — MESSAGES_UPDATE
- `core/entities/dueScheduledMessages.test.ts` — só pending com hora já passada
- `core/usecases/DispatchDueScheduledMessagesUseCase.test.ts` — vencido envia; futuro não; vazio/provedor → failed; com `conversationId` o send/pause usam a thread
- `core/entities/schedulesForConversation.test.ts` — lista da thread: `conversationId` bate; sem id, mesmo telefone
- `core/entities/scheduleOutgoingLine.test.ts` — coluna Linha: `conversationId` fixa a thread; sem id, a mais recente do telefone
- `core/entities/atendimentoInicialFlow.test.ts` — menu no `inicio`; saltos `goToFlow`; contratar e demo pausam (`handoff`); FAQ do cliente pergunta se ainda precisa de alguém; opção inválida → miss + menu sem saudação; **número** da opção no menu
- `core/entities/inboxFilterHint.test.ts` — quantas a aba tem vs o filtro; busca casa conteúdo da thread; `nextIncomingQueueConversation` (próxima da Entrada; última; vazia)
- `ui/lib/composer-draft.test.ts` — grava/lê/apaga rascunho por `conversationId`; vazio remove; teto de 8000 chars; store padrão é `localStorage`
- `core/engine/previewFlowOpening.test.ts` — primeiro “oi” vira `FlowReply[]` (opções numeradas); salto `goToFlow`; mídia no passo Mensagem; `known` começa na pergunta (sem Olá); `previewFlowTurn` deixa `currentStepId` na pergunta; `simulateFlowIncoming` após `handoff` não responde; depois do `goToFlow` a opção seguinte continua no destino (não reabre o fluxo do editor)
- `ui/lib/flow-sim-canvas.test.ts` — quadro da simulação troca para os passos do destino e fica somente leitura
- `core/entities/assignmentFromOperator.test.ts` — e-mail liga agente; senão linked false
- `core/entities/operatorRole.test.ts` — admin; último admin não rebaixa nem exclui
- `core/entities/uniqueAgentEmail.test.ts` — e-mail de agente único (trim + lower); ignora o próprio id
- `core/usecases/EnsureOperatorAgentUseCase.test.ts` — cria agente com o id do perfil; e-mail já existente (outro id) não duplica
- `core/usecases/CreateOperatorUseCase.test.ts` — só admin cria; senha curta falha; segundo cadastro com o mesmo e-mail → 409
- `core/entities/agentStatus.test.ts` — não desativa a si nem o último admin online
- `core/usecases/AgentCatalogUseCase.test.ts` — save recusa outro id com o mesmo e-mail; recusa desativar a si ou o último admin online
- `core/usecases/DeleteOperatorUseCase.test.ts` — exclui login + agente; bloqueia último admin
- `core/usecases/SetOperatorRoleUseCase.test.ts` — promove; bloqueia último admin
- `core/usecases/SetOperatorPasswordUseCase.test.ts` — só admin; senha curta falha; id inexistente 404
- `ui/lib/emoji.test.ts` — insere emoji na posição do cursor e substitui a seleção; o mesmo helper insere `body` de resposta rápida (texto Unicode, inclusive com emoji)
- `core/entities/QuickReply.test.ts` — lista ordenada pelo título; prévia Áudio; válido com texto ou áudio; picker “Envia áudio”; filtro por título/texto; visível no setor da conversa
- `core/entities/flowAudience.test.ts` — conhecido exige thread + contato prévios; cadastro sem thread é novo
- `core/entities/flowAudienceSession.test.ts` — menu conhecido usa o `flowId` de entrada do chatbot
- `core/entities/botBehavior.test.ts` — tetos de delay; merge com padrão; segundos ↔ ms; overlay da linha
- `core/entities/chatbotActive.test.ts` — um ativo; cadastro da empresa = o ativo (senão o primeiro); `resolveEntryFlowId` prefere a linha
- `core/usecases/ChatbotCatalogUseCase.test.ts` — gravar ativo desativa os outros
- `core/usecases/DispatchIdleBotSessionsUseCase.test.ts` — fecha na pergunta parada; não fecha se `paused`; idle 0 na linha não fecha
- `core/usecases/ProcessIncomingFlowUseCase.test.ts` — conhecido/reabertura pulam o Olá
- `ui/lib/catalog-persist-error.test.ts` — PGRST205 vira aviso de migration; PGRST204 em flows cita 017; `quick_replies` cita 022 (`media_kind`) e 023 (`department_id`); `chatbots` cita 024 (`behavior`); `whatsapp_numbers` cita 025 (`behavior`), 026 (`flow_id`) ou 027 (`business_hours`); 23503 ao excluir fluxo
- `ui/lib/catalog-load-phase.test.ts` — enquanto carrega não é empty state
- `ui/lib/sidebar-nav.test.ts` — atendente vê Conversas, Contatos, `/dashboard/quick-replies` **e** `/dashboard/schedules`; `isAdminPath` dessas duas é false; admin vê Configuração incluindo `/dashboard/chatbots` com título **Chatbot**. Sem Testing Library obrigatório para esta feature
- `ui/lib/inbox-href.test.ts` — Contatos: uma thread → `?conversation=`; nenhuma → `?contact=`; várias → `?contact=` (o menu escolhe o id)
- `ui/lib/catalog-saved.test.ts` — aviso Salvo some depois do TTL
- `infra/schedules/cronAuth.test.ts` — Bearer `CRON_SECRET`
- `infra/schedules/shouldStartInProcessScheduleCron.test.ts` — não sobe em test / build / Vercel
- `infra/supabase/missingColumn.test.ts` — PGRST204 de `last_message` é coluna ausente; `conversation_id` de agendamento também
- `infra/supabase/mappers/catalog.test.ts` — `scheduleToRow` só manda `conversation_id` se houver thread; `quickReplyToRow` manda `media_kind` e `department_id`; `numberToRow` manda `behavior`, `flow_id` e `business_hours`
- `infra/supabase/mappers/messaging.test.ts` — `conversationToRow` só manda `last_message` se houver snapshot
- `infra/supabase/mappers/messaging.test.ts` — `messageToRow` grava `reactions` (vazio se ainda não houver)
- `infra/http/apiLog.test.ts` — formato `[requestId] mensagem` ou `[requestId] mensagem: detalhe`; não inclui token, apikey, `service_role`, JWT, Authorization, senha, cookie, base64, nem `error.response.data` completo
- `infra/http/schemas.test.ts` — login; operators POST/PATCH (papel e/ou senha); Evolution `data` ou `key`; chat-whatsapp `{ event, data }`; Meta `object` + `entry`; `POST /api/messages/read` exige `conversationId`
- `app/api/messages/send/parseSendRequest.test.ts` — JSON (Zod) e multipart; máx. 16 MB; JSON inválido → 400; `conversationId` opcional (JSON e multipart)
- `core/entities/inboxFilterHint.test.ts` — filtro de linha esconde as outras; “Ver todas” via hiddenCount
- `ui/lib/inbox-notify.test.ts` — `document.title` `(N) Conversas` com não lidas; primeiro chime do dia; `isInboxChimeMuted`
- `ui/lib/whatsapp-line-href.test.ts` — `whatsappConnectHref` com e sem instância
- `ui/lib/messages-matching-query.test.ts` — busca na conversa filtra pelo texto; `highlightQueryMatches` marca o trecho
- `core/entities/reportCsv.test.ts` — Baixar gera CSV com colunas em português; `reportDownloadFilename` usa tipo + data
- `ui/lib/catalog-filter.test.ts` — `catalogMatchesQuery` casa nome
- `ui/lib/dashboard-setup.test.ts` — checklist omite passos já feitos
- `ui/lib/flow-canvas-history.test.ts` — desfazer até 10 estados
- `ui/lib/whatsapp-chip.test.ts` — uma linha = conectado/desconectado; várias = N de M (vermelho se alguma caiu)
- `ui/lib/ttl-list-cache.test.ts` — cache de lista: coalescing + invalidate
- `core/usecases/SaveFlowStepMediaUseCase.test.ts` — grava imagem ou áudio; recusa vídeo/documento e > 16 MB; fluxo/passo inexistente ou tipo ≠ `message` → null; `media: null` limpa campos e remove do storage
- `core/usecases/GetFlowStepMediaUseCase.test.ts` — lê o path; ausente → null
- `core/usecases/loadFlowStepMedia.test.ts` — `http(s)` continua; path `flows/{flowId}/{stepId}` e href da API leem `IMediaStorage`; outro valor → null
- `app/api/flows/[flowId]/steps/[stepId]/media/route.test.ts` — 401/404/400/200 com storage fake; sem Supabase real
- `ui/lib/flow-health-list.test.ts` — item com `stepId` é clicável; sem `stepId` não é
- `ui/lib/flow-step-delay.test.ts` — pausa do bloco Mensagem em segundos 0–8; persiste `delayMs` 0–8000
- `ui/lib/entry-flow-href.test.ts` — com `flowId` → `/dashboard/flows/{flowId}` (“Editar este fluxo”); sem fluxo → `/dashboard/flows` (“Abrir Fluxos”)
- `ui/lib/chatbot-draft.test.ts` — snapshot do Vale para; dirty se o formulário mudou; troca sem rascunho não é dirty
- `ui/lib/flow-step-media.test.ts` — `flowStepMediaPreviewSrc` usa GET autenticado no path do Storage e URL `http(s)` pública
- `ui/lib/flow-keywords.test.ts` — Enter/vírgula/colar vira chips; trim; vazio e duplicata (case) ignorados; remover por índice
- `core/entities/historyThread.test.ts` — clique no Histórico abre a thread da linha; senão `?contact=`
- `ui/lib/history-href.test.ts` — href da linha do Histórico
- `ui/lib/inbox-keyboard.test.ts` — j/k/setas movem; Enter abre; Esc volta
- `core/entities/conversationViewer.test.ts` — selo só se outro agente e `viewerAt` fresco
- `core/usecases/TouchConversationViewerUseCase.test.ts` — grava viewer; limpa só o próprio; não mexe em lastActivity

## Próximos

1. CRUD de `SaveFlowUseCase` / `DeleteFlowUseCase`
2. `HandleIncomingWhatsAppMessageUseCase` — persiste incoming

## Convenções

- Arquivos `*.test.ts` / `*.test.tsx` ao lado do sujeito ou em `tests/`
- Sem dados de prod; fakes em memória
- Nomes em português ou inglês, consistentes com o arquivo testado
- Após escrever testes, **listar os comandos** para o usuário rodar; não rodá-los
