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
- `core/engine/resolveQuestionChoice.test.ts` — `1` / `1.` viram a primeira opção; texto livre permanece
- `core/usecases/ProcessIncomingFlowUseCase.test.ts` — envio via fake + persistência de sessão; pausado não responde; action grava setor da thread; duas linhas = duas sessões
- `core/usecases/ProcessIncomingFlowUseCase.hours.test.ts` — fora do expediente só avisa; `handoff` acrescenta posição na fila
- `core/usecases/PauseContactFlowUseCase.test.ts` — pausa e retoma sessão da thread (`contactId` = `Conversation.id`)
- `core/usecases/DeleteFlowUseCase.test.ts` — excluir fluxo remove sessões daquele roteiro e solta chatbot
- `core/usecases/TransferConversationUseCase.test.ts` — status transferred
- `core/usecases/AssignConversationUseCase.test.ts` — assumir (waiting) e finalizar (closed)
- `core/usecases/MarkConversationReadUseCase.test.ts` — zera unreadCount
- `core/usecases/MarkWhatsAppMessagesReadUseCase.test.ts` — envia ids incoming; no-op sem `markMessagesRead`; conversa inexistente
- `infra/whatsapp/evolutionMarkMessagesRead.test.ts` — payload `readMessages`
- `ui/lib/ptt-file.test.ts` — arquivo a partir dos blobs; sem MediaRecorder o PTT não quebra
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
- `core/entities/conversationInbox.test.ts` — nome de exibição; inicial do avatar; href da foto; prévia texto / Você: / Foto / Áudio; Sem mensagens só sem lastMessage; outgoing da lista tem tiques à esquerda; digitando cobre a prévia
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
- `core/entities/businessHours.test.ts` — fora do expediente; dentro no fuso
- `core/entities/queuePlace.test.ts` — posição na fila do mesmo setor
- `core/usecases/GetDashboardMetricsUseCase.test.ts` — totais; volume por setor; média até Assumir; 1ª resposta humana; fila sem dono ≥ 5 min
- `core/entities/slaMetrics.test.ts` — fila sem dono ≥ 5 min
- `core/entities/quotedPreview.test.ts` — corta em 200 chars
- `core/usecases/GetSchemaHealthUseCase.test.ts` — probe marca coluna ausente
- `infra/whatsapp/mapEvolutionPresence.test.ts` — composing/paused; ignora grupo
- `core/usecases/ApplyContactTypingUseCase.test.ts` — grava `contactTypingAt`; paused zera
- `core/usecases/SendWhatsAppPresenceUseCase.test.ts` — no-op se o serviço não tiver `sendPresence`
- `ui/lib/messages-matching-query.test.ts` — busca na conversa filtra pelo texto
- `infra/whatsapp/mapEvolutionIncoming.test.ts` — pushName; MESSAGES_UPSERT; ignora grupo/fromMe; tipo imagem
- `infra/whatsapp/evolutionMedia.test.ts` — parse base64; hydrate grava no storage fake
- `core/usecases/SendWhatsAppMessageUseCase.test.ts` — persiste outgoing; mídia vai ao storage fake; `quotedMessageId` quando o alvo existe
- `core/services/IMediaStorage.test.ts` — tipo pelo MIME; Meta/Twilio recusam mídia; path de áudio de resposta rápida
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
- `ui/lib/flow-health.test.ts` — bloco solto; pergunta sem opção; goToFlow vazio
- `core/engine/matchFlowByKeyword.test.ts` — atalho de outro fluxo ativo
- `core/engine/planFlowTurn.test.ts` — também `returnStack`, `handoff`, keyword
- `core/entities/whatsappNumberLive.test.ts` — lista de Números inclui a sessão ao vivo (wid)
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
- `core/entities/inboxFilterHint.test.ts` — quantas a aba tem vs o filtro; busca casa conteúdo da thread
- `core/engine/previewFlowOpening.test.ts` — primeiro “oi” vira bolhas da prévia (opções numeradas); salto `goToFlow`
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
- `core/entities/QuickReply.test.ts` — lista ordenada pelo título; prévia Áudio; válido com texto ou áudio
- `core/usecases/SaveQuickReplyMediaUseCase.test.ts` — grava áudio; recusa não-áudio; id inexistente
- `ui/lib/catalog-persist-error.test.ts` — PGRST205 vira aviso de migration; PGRST204 em flows cita 017; `quick_replies` cita 022; 23503 ao excluir fluxo
- `ui/lib/catalog-load-phase.test.ts` — enquanto carrega não é empty state
- `ui/lib/sidebar-nav.test.ts` — atendente vê Conversas, Contatos, `/dashboard/quick-replies` **e** `/dashboard/schedules`; `isAdminPath` dessas duas é false; admin vê Configuração. Sem Testing Library obrigatório para esta feature
- `ui/lib/inbox-href.test.ts` — Contatos: uma thread → `?conversation=`; nenhuma → `?contact=`; várias → `?contact=` (o menu escolhe o id)
- `ui/lib/catalog-saved.test.ts` — aviso Salvo some depois do TTL
- `infra/schedules/cronAuth.test.ts` — Bearer `CRON_SECRET`
- `infra/schedules/shouldStartInProcessScheduleCron.test.ts` — não sobe em test / build / Vercel
- `infra/supabase/missingColumn.test.ts` — PGRST204 de `last_message` é coluna ausente; `conversation_id` de agendamento também
- `infra/supabase/mappers/catalog.test.ts` — `scheduleToRow` só manda `conversation_id` se houver thread; `quickReplyToRow` manda `media_kind`
- `infra/supabase/mappers/messaging.test.ts` — `conversationToRow` só manda `last_message` se houver snapshot
- `infra/supabase/mappers/messaging.test.ts` — `messageToRow` grava `reactions` (vazio se ainda não houver)
- `infra/http/apiLog.test.ts` — formato `[requestId] mensagem: detalhe`; não inclui token, apikey, service_role, JWT, Authorization, base64, nem `error.response.data` completo
- `infra/http/schemas.test.ts` — login; operators POST/PATCH (papel e/ou senha); Evolution `data` ou `key`; chat-whatsapp `{ event, data }`; Meta `object` + `entry`; `POST /api/messages/read` exige `conversationId`
- `app/api/messages/send/parseSendRequest.test.ts` — JSON (Zod) e multipart; máx. 16 MB; JSON inválido → 400; `conversationId` opcional (JSON e multipart)
- `core/entities/inboxFilterHint.test.ts` — filtro de linha esconde as outras; “Ver todas” via hiddenCount
- `ui/lib/inbox-notify.test.ts` — `document.title` `(N) Conversas` com não lidas
- `ui/lib/whatsapp-chip.test.ts` — uma linha = conectado/desconectado; várias = N de M (vermelho se alguma caiu)
- `ui/lib/ttl-list-cache.test.ts` — cache de lista: coalescing + invalidate
- `core/entities/reportCsv.test.ts` — Baixar gera CSV com colunas em português

## Próximos

1. CRUD de `SaveFlowUseCase` / `DeleteFlowUseCase`
2. `HandleIncomingWhatsAppMessageUseCase` — persiste incoming

## Convenções

- Arquivos `*.test.ts` / `*.test.tsx` ao lado do sujeito ou em `tests/`
- Sem dados de prod; fakes em memória
- Nomes em português ou inglês, consistentes com o arquivo testado
- Após escrever testes, **listar os comandos** para o usuário rodar; não rodá-los
