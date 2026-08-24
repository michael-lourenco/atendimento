# 02 — Domínio

## Entidades (`core/entities`)

| Entidade | Papel |
|----------|--------|
| `User` / `AuthUser` | Operador do painel (`admin` \| `user`) |
| `Flow` + `FlowStep` | Automação: `message` \| `question` \| `condition` \| `action` (`setDepartment`, `goToFlow` ou `handoff`). `canvasPosition` opcional (só o quadro). `delayMs` (0–8000 ms; inspetor do bloco Mensagem mostra 0–8 s via `msToSeconds` / `secondsToMs`; motor inalterado). Só no tipo `message`: `mediaUrl`/`mediaKind` (`image` \| `audio` \| `video` \| `document`) — URL `http(s)` pública (legado) **ou** path no Storage (`flows/{flowId}/{stepId}`). `document` = PDF. `Flow.keywords` opcional. `publishedSteps` opcional: o motor usa isso se existir; o editor edita `steps` até **Publicar** |
| `FlowSession` | Passo atual do contato no fluxo. `outsideHoursNotified`; `consumedIncomingAt`; `missStreak`; `mediaHintStepId` |
| `Message` | Mensagem WhatsApp (in/out, tipo, status). `reactions` opcional: um emoji por remetente. Citação opcional: `quotedMessageId`, `quotedContent`, `quotedFrom` |
| `Conversation` | Atendimento com contato, setor, agente, tags, status. `assignedAt` opcional (primeiro Assumir). `contactTypingAt` opcional (contato digitando no WhatsApp). Viewer do painel: `viewerAgentId` / `viewerAgentName` / `viewerAt` (quem tem a thread aberta; fresco ≤ 20s) |
| `Department` | Setor (cor, ativos, contagens) |
| `InternalMessage` | Nota da equipe na conversa |
| `Chatbot` | Bot cadastrado no painel. `flowId` = fluxo de **entrada** no WhatsApp (contato novo / sem sessão). `businessHours` opcional (expediente: dias parametrizáveis, horário por dia, fuso; `end` antes de `start` atravessa meia-noite). `behavior` opcional (`BotBehavior`: delay, digitando, inatividade) |
| `Agent` | Atendente (`online` \| `offline`) |
| `Contact` | Contato WhatsApp + etiquetas; `avatarUrl` opcional (foto no Storage, via `/api/contacts/{id}/avatar`) |
| `WhatsAppNumber` | Número/linha WhatsApp da **mesma** empresa. Na UI o rótulo é `name` (ex. Comercial); `instanceName` é identificador técnico (slug do nome se o admin não preencher). `behavior` opcional: ritmo desta linha. `flowId` opcional: fluxo de entrada desta linha. `businessHours` opcional: expediente desta linha. Sem override, vale o do chatbot ativo |
| `Tag` | Etiqueta (`color`, `contactsCount`) |
| `QuickReply` | `id`, `title`, `body` (texto; pode ser vazio se houver mídia), `mediaKind?` (`audio` \| `image` \| `video` \| `document`), `departmentId?` (setor opcional), `createdAt`. Catálogo da **empresa**. Sem dono por atendente |
| `ScheduledMessage` | Envio futuro (`pending` \| `sent` \| `failed`). `contact` = telefone; `conversationId` opcional = thread (mesma linha) |
| `Report` | Snapshot gerado no painel |
| `DashboardMetrics` | KPIs: totais, taxa de resposta, volume por setor, tempo médio até Assumir, tempo médio até 1ª resposta humana, conversas sem dono há `UNASSIGNED_QUEUE_MINUTES` (5) |

Novas entidades exigem interface de repositório em `core/repositories` e mock em `infra/mocks` **antes** da UI.

## Repositórios (portas)

- `IAuthRepository` — login, logout, usuário atual
- `IFlowRepository` — CRUD de fluxos
- `IFlowSessionRepository` — sessão por `contactId` (upsert); `contactId` = `Conversation.id` da thread; `listByFlowId` lista sessões daquele roteiro (impacto ao publicar)
- `IMessageRepository` — histórico da thread (mensagens daquela linha; ver invariante 3)
- `IMediaStorage` — cache de áudio/imagem/vídeo/documento (bucket `media`); paths `messages/{id}`, `contacts/{id}`, `quick-replies/{id}`, `flows/{flowId}/{stepId}`. `remove(path)` apaga o objeto (mídia de passo no DELETE)
- `IConversationRepository`, `IDepartmentRepository`, `IInternalMessageRepository`
- `IChatbotRepository`, `IAgentRepository`, `IContactRepository`, `IWhatsAppNumberRepository`, `ITagRepository`, `IScheduledMessageRepository`, `IReportRepository` — CRUD (`ICrudRepository`)
- `IQuickReplyRepository` = `ICrudRepository<QuickReply>` (padrão `ITagRepository`)

Catálogos do painel usam `CatalogUseCase` (`list` / `save` / `delete`). Respostas rápidas: `QuickReplyCatalogUseCase`. Conversas: `GetAllConversationsUseCase` (lista o catálogo; a prévia `lastMessage` vem do snapshot na conversa). Se o snapshot estiver vazio, preenche a partir das mensagens da thread **em memória**. Padrão `execute()` / `execute(false)` **não** grava (inbox, contatos, agendamentos — o poll da inbox não pode POST na tabela a cada 8s). `execute(true)` tenta persistir a prévia; falha ao gravar **não** esconde a lista. Sem coluna `last_message` (PGRST204), o save **omite** o campo. O snapshot no banco nasce no upsert da mensagem (`UpsertConversationFromMessageUseCase`). `GetConversationByIdUseCase`, `AssignConversationUseCase` (grava `assignedAt` na primeira vez), `TransferConversationUseCase`, `CloseConversationUseCase`, `MarkConversationReadUseCase`, `SetConversationDepartmentUseCase`, `SetConversationTagsUseCase`, `TouchConversationViewerUseCase` (abre: grava viewer; fecha: limpa só se for o próprio; **não** mexe em `lastActivity` nem pausa o bot). Sem coluna `viewer_at` (PGRST204), o save **omite** os campos. Relatórios: `GetDashboardMetricsUseCase` (inclui SLA: `avgFirstHumanReplyMinutes` = média do 1º outgoing **sem** `flowId`/`stepId` após o 1º incoming da thread; `unassignedOlderThanMinutes` = conversas sem `assignedAgentId`, não `closed`, com `createdAt` há ≥ 5 min), `ReportCatalogUseCase`, `GenerateReportUseCase`. Schema do banco: `GetSchemaHealthUseCase` (admin) compara colunas esperadas; falha de probe **não** derruba o painel.

## Use cases existentes

Auth: `LoginUseCase`, `LogoutUseCase`, `GetCurrentUserUseCase` (agente `offline` encerra a sessão)  
Fluxos: `GetAllFlowsUseCase`, `GetFlowByIdUseCase`, `SaveFlowUseCase`, `PublishFlowUseCase`, `GetFlowPublishImpactUseCase` (sessões cujo passo some), `DeleteFlowUseCase` (apaga sessões daquele `flowId` e solta `chatbots.flowId` e `whatsapp_numbers.flowId` antes de remover o fluxo), `SaveFlowStepMediaUseCase` (grava bytes no Storage e `mediaUrl`/`mediaKind` no passo `message`), `GetFlowStepMediaUseCase` (lê o objeto para o GET do painel)  
Mensagens: `GetAllMessagesUseCase`, `GetMessagesByContactUseCase`  
WhatsApp: `SendWhatsAppMessageUseCase` (`quotedMessageId` opcional), `HandleIncomingWhatsAppMessageUseCase`, `UpsertConversationFromMessageUseCase`, `UpsertContactFromIncomingUseCase`, `SyncContactAvatarUseCase`, `SyncMissingContactAvatarsUseCase`, `SyncLiveWhatsAppNumberUseCase`, `UpdateMessageStatusUseCase`, `ApplyMessageReactionUseCase`, `SendMessageReactionUseCase`, `SendWhatsAppPresenceUseCase`, `ApplyContactTypingUseCase`  
Agendamentos: `ScheduledMessageCatalogUseCase`, `DispatchDueScheduledMessagesUseCase` (pendente com `scheduledDate <= agora` → envia, pausa a sessão da thread, marca `sent` ou `failed`)  
Respostas rápidas: `QuickReplyCatalogUseCase` (`list` / `save` / `delete`; padrão Tag)  
Motor: `ProcessIncomingFlowUseCase` (incoming texto → respostas do fluxo; ritmo e ciclo novo/conhecido), `DispatchIdleBotSessionsUseCase` (silêncio na pergunta)  
Atendimento humano: `PauseContactFlowUseCase`, `ResumeContactFlowUseCase`, `GetFlowSessionUseCase`  
Operadores: `EnsureOperatorAgentUseCase`, `CreateOperatorUseCase`, `SetOperatorRoleUseCase`, `SetOperatorPasswordUseCase`, `DeleteOperatorUseCase`, `ListOperatorsUseCase`  
Fila: `AssignConversationUseCase` (assumir → `waiting` + agente), `TransferConversationUseCase` (`transferred`), `CloseConversationUseCase` (`closed`), `MarkConversationReadUseCase` (`unreadCount: 0`), `SetConversationDepartmentUseCase` (`departmentId` / `departmentName`), `TouchConversationViewerUseCase` (quem está na thread)

## Respostas rápidas

Catálogo **da empresa** (esta stack): um banco, sem `company_id`, sem dono por atendente. `departmentId` opcional: vazio = todos os setores; preenchido = só aquele setor. Atendente (`user`) e admin **veem e editam** o mesmo catálogo (`list` / `save` / `delete`). O picker da thread mostra itens **sem setor** e os do **setor da conversa aberta**. Sem setor na conversa, só as globais.

```ts
{
  id: string;
  title: string; // rótulo curto na lista (ex. "Saudação")
  body: string;  // texto inserido no compositor (legenda se houver mídia); vazio se for só mídia
  mediaKind?: 'audio' | 'image' | 'video' | 'document'; // arquivo no Storage (`quick-replies/{id}`); `document` = PDF
  departmentId?: string; // setor opcional; vazio = todos
  createdAt: Date;
}
```

Porta `IQuickReplyRepository` = `ICrudRepository<QuickReply>`. Use case `QuickReplyCatalogUseCase` (`list` / `save` / `delete`), padrão `TagCatalogUseCase`. Mídia: `SaveQuickReplyMediaUseCase` grava bytes no `IMediaStorage` e `mediaKind` (`audio` \| `image` \| `video` \| `document`). PDF (`application/pdf`) vira `document`; outro documento (Word, zip, etc.) é recusado. Mock em `infra/mocks` com **2–3 frases de exemplo** (dev/test); campo no bag do ServiceLocator. Prod (Supabase) começa **vazio** — sem seed SQL de frases.

Picker (só cliente): campo **Filtrar** casa `title` e `body` (sem rota nova). Mídia: enquanto o `GET` baixa, o item mostra **Enviando…**; falha do arquivo ou do envio **não** fecha o painel (mensagem “Não foi possível enviar a mídia”). Atalho no compositor focado: `/` com o campo vazio, ou `Ctrl`/`⌘`+`/`, abre o picker e foca o filtro; `Escape` fecha; `Enter` no filtro escolhe o primeiro resultado visível. `/` na inbox continua focando a busca da lista só se o foco **não** estiver em `input`/`textarea`. Texto: inserir no compositor é só cliente (mesmo helper de posição do cursor que o emoji); o envio permanece `POST /api/messages/send`. Mídia: o picker **envia** o arquivo pelo mesmo POST multipart (não cola no campo; `body` vai como legenda). Ícone no item: microfone (áudio), imagem, vídeo ou documento. Cadastro: upload de imagem, vídeo, áudio ou PDF **ou** o mesmo PTT do compositor (segurar o microfone; soltar anexa o áudio ao formulário, **não** manda WhatsApp nem presence; deslizar para cima cancela, igual ao chat). Título obrigatório; precisa de `body` **ou** mídia. Sem rota HTTP de CRUD; mídia em `GET`/`PUT`/`DELETE /api/quick-replies/{id}/media`. PDF (`application/pdf`) permitido; outro tipo de documento recusado.

## Invariantes

1. Mensagem incoming/outgoing tem `direction` e `status` válidos (`pending` \| `sent` \| `delivered` \| `read` \| `failed`). Outgoing: relógio = saindo; um tique cinza = no servidor; dois cinza = no celular do contato; dois azuis = lida. Incoming não mostra tiques. Evolution `messages.update` / `MESSAGES_UPDATE` atualiza o ack (`UpdateMessageStatusUseCase`) sem rebaixar lida/entregue e **não** dispara o fluxo. Se o id for o `lastMessage` da conversa, o snapshot da prévia da inbox também avança o `status` (tiques na lista). **Reação** (`Message.reactions`: `{ emoji, from }[]`): um emoji por remetente (`from` = telefone do contato ou `instanceName` da linha). Emoji vazio remove a reação daquela pessoa. Não cria bolha; não dispara o fluxo; não incrementa não lidas; não muda `lastActivity`; não pausa o bot. Reupsert da mesma mensagem no webhook **preserva** reações já gravadas. Painel envia via `SendMessageReactionUseCase` (Evolution ou Meta); o mesmo emoji da linha tira a reação. A thread **mostra o chip na hora** (otimista); um reload sem `reactions` no banco **não apaga** o que já está na tela. **Citação:** `quotedMessageId` = id da bolha respondida; `quotedContent` = prévia (até 200 chars); `quotedFrom` = telefone/instância do autor citado. Incoming Evolution lê `contextInfo` (`stanzaId` + `quotedMessage`); Meta lê `context.id`. Envio pelo painel manda `quotedMessageId`; o use case carrega o alvo e passa `quoted` ao provedor. Sem alvo, envia sem citar. Não dispara o fluxo. **Digitando:** `Conversation.contactTypingAt`. TTL 12s na UI (`conversationIsTyping`). Presence Evolution `composing`/`recording` grava agora; `paused`/`available` zera. Operador no compositor: `POST /api/messages/presence` (`composing` ao digitar; `recording` enquanto segura o PTT). Twilio não envia presence nesta versão. **PTT:** campo vazio no compositor mostra microfone no lugar de Enviar. Segurar grava (`MediaRecorder`); soltar envia o áudio pelo mesmo `POST /api/messages/send` multipart (`file`). Deslizar para cima (≈72 px) e soltar **cancela** (não envia). Sem `MediaRecorder`/microfone, o microfone some (fica o Enviar). Sem lib extra. **Visto:** abrir a thread zera `unreadCount` e, no provedor, marca incoming ainda não `read` (`MarkWhatsAppMessagesReadUseCase` → `IWhatsAppService.markMessagesRead`). Incoming **não** mostra tiques no painel; o contato vê tiques azuis no WhatsApp. Falha do provedor **não** esconde o chat (retry no poll). **Busca da inbox:** o termo casa nome, telefone, setor, agente **ou** o texto de qualquer mensagem da thread (prévia `lastMessage` ou corpus `GetAllMessagesUseCase` quando o campo não está vazio). `/dashboard/messages` filtra o histórico pelo mesmo critério de conteúdo.
2. Só fluxo `isActive` entra no motor.
3. Conversa: status `open` \| `closed` \| `waiting` \| `transferred`. Toda `Message` persistida cria/atualiza `Conversation` e `Contact`. Contato continua um cadastro por telefone (`id`/`phone` = telefone, `name` = `pushName` do WhatsApp quando houver). **Uma thread por contato + linha:** `Conversation.id` = `conversationThreadId(phone, whatsappNumberId)` → `{digitosDoTelefone}` se não houver linha; `{digitos}:{lineId}` se houver. A conversa guarda `whatsappNumberId` da linha que recebeu/enviou (`matchWhatsAppNumber` pelo `instanceName` ou dígitos em `to`/`from`, via `lineHintFromMessage`). Upsert: mensagem na linha A atualiza só a thread A; a mesma pessoa na linha B cria outra conversa (outro `id`, mesmo `contactPhone`). **Legado:** conversa com `id` = telefone e já com `whatsappNumberId` continua sendo a thread daquela linha — não duplicar. Só cria `phone:lineId` quando o telefone já tem thread em **outra** linha. Reply e agendamento saem pela mesma instância da thread. Mensagens da thread: só as daquela linha (`lineHintFromMessage` vs `instanceName`/número da linha); não misturar Comercial e Suporte. Filtro da inbox por linha esconde conversas com outro `whatsappNumberId`. Uma empresa, vários atendentes, vários números em paralelo — sem `company_id`. Não sobrescrever nome real por número. Incoming em conversa `closed` reabre para `open` (mantém o agente) e incrementa `unreadCount`. Conversa nova **não** ganha setor no upsert. Passo `action` `setDepartment` no fluxo grava o setor **da conversa da thread** (`Conversation.id`) no mesmo turno (antes da fila) — não numa conversa “só telefone” se já existir thread composta. `SetConversationDepartmentUseCase` grava `departmentId` / `departmentName` (id vazio remove o setor). **Assumir** usa o id da conversa (não só o telefone): grava `assignedAgentId` / `assignedAgentName` e `status: waiting` (aba Esperando); se a conversa não tem setor e o agente do operador tem, copia o setor. Todo perfil de login **nasce como agente** (`id` e e-mail iguais; `EnsureOperatorAgentUseCase` e trigger `handle_new_user`). **E-mail de agente único** (case-insensitive, `trim`): uma linha em `agents` por e-mail. `CreateOperatorUseCase` recusa (409) se o e-mail já existir em agentes ou operadores. `EnsureOperatorAgentUseCase` não cria segundo cadastro se o e-mail já existir (mesmo com outro id). `AgentCatalogUseCase.save` recusa outro id com o mesmo e-mail. O trigger `handle_new_user` não insere agente se o e-mail já existir. `assignmentFromOperator` liga por **id**, senão e-mail (`linked`). O primeiro perfil no banco é `admin`; os seguintes, `user`. Só o admin cria atendentes, troca papel, **redefine senha** (`SetOperatorPasswordUseCase`, mín. 6), **exclui operador** e edita Configuração. Não rebaixa nem exclui o último admin. `DeleteOperatorUseCase` apaga login (Auth) + perfil + agente daquele e-mail. Não dá para excluir a si mesmo se for o único admin — nesse caso a tela só desativa (offline). **Transferir** usa um agente do catálogo e `status: transferred`; se o destino tem setor, a conversa passa a esse setor. **Finalizar** grava `status: closed`. Abrir a thread (`?conversation=<id>`; `?contact=` legado abre a thread mais recente daquele telefone) zera `unreadCount` (`MarkConversationReadUseCase`) e marca incoming da linha como lidas no WhatsApp (`MarkWhatsAppMessagesReadUseCase` / `POST /api/messages/read`); não altera `lastActivity`. Enquanto a thread estiver aberta, o poll também zera e reenvia o visto só das incoming ainda não `read`. Fila: **Entrada** é de todos (sem dono). **Esperando** e **Finalizados** filtram por padrão as do operador (`assignedAgentId` = mesmo id do Assumir); toogle **Ver o time** mostra as dos outros. Sem usuário logado, não filtra. Filtro de setor (padrão = setor do agente do operador, senão todos): em Entrada, um setor específico ainda inclui conversas sem setor; em Esperando/Finalizados, só o setor escolhido. Transferir lista agentes **online** (`status` ≠ `offline`) do mesmo setor da conversa; se nenhum, lista todos os online. Agent `offline` não entra no painel: `LoginUseCase` e `GetCurrentUserUseCase` recusam (depois do Auth) e encerram a sessão. Foto do contato: `SyncContactAvatarUseCase` baixa a imagem (Evolution) para o bucket `media` em `contacts/{id}` na primeira incoming sem foto **e** no recálculo da inbox (`SyncMissingContactAvatarsUseCase`, lote; `POST /api/contacts/avatars/sync`). A lista usa `Conversation.contactAvatarUrl` (cópia do `Contact.avatarUrl`); sem foto, a inicial. Se o contato já tem foto e a thread não, o recálculo só copia o href — sem chamar o provedor.
4. Auth **mock (Fases 1–3):** senha irrelevante; `admin@example.com` / `user@example.com`. Auth **Supabase (Fase 4):** senha real; papel em `profiles`; sem usuários de teste na UI; **Esqueci a senha** = e-mail do Auth (anon), sem rota nova — ver `08-supabase.md`.
5. Use case não chama Axios/Meta/Twilio direto — só `IWhatsAppService`.
6. Uma sessão por `contactId` da `FlowSession`. Esse `contactId` é o mesmo `Conversation.id` (chave da thread), não o telefone isolado. Duas linhas = duas sessões. Pause/resume/Assumir usam o id da conversa. Sem fluxo ativo: incoming é persistida e **nenhuma** resposta automática é enviada.
7. No máximo 20 passos por turno (ciclo).
8. Envio pelo painel (`POST /api/messages/send`) **pausa** a sessão da thread (`paused: true`), **exceto** quando a conversa estava `closed`: aí `ReopenConversationUseCase` reabre, solta o dono e `ResumeContactFlowUseCase` (ciclo novo, bot pode falar na próxima incoming). Com `conversationId`, essa conversa; sem ele, a conversa do telefone (a mais recente se houver várias). Texto ou mídia. Mídia outgoing é cacheada em `IMediaStorage` (`messages/{id}`). Enquanto pausado, incoming é persistida e o motor **não** responde — **exceto** reabertura de conversa `closed` (incoming: mantém agente; ver ciclo novo/conhecido). `ResumeContactFlowUseCase` volta `paused: false` e zera `currentStepId`. Respostas automáticas do motor **não** pausam.
9. Agendamento `pending` com `scheduledDate <= agora` é enviado pelo mesmo `SendWhatsAppMessageUseCase` (`to` = telefone do contato). Com `conversationId`, o envio e o pause usam **essa** thread (mesma linha). Sem `conversationId`, resolve pela conversa do telefone (a mais recente se houver várias). Sucesso → `sent` e pausa a sessão; falha do provedor ou texto vazio → `failed`. Futuro permanece `pending`. O disparo **não** depende do painel: cron in-process a cada 60s em `next dev` / `next start` (exceto Vercel serverless); na Vercel, `GET /api/schedules/dispatch` via `vercel.json`. O mesmo tick também roda `DispatchIdleBotSessionsUseCase`. Salvar no painel ainda dispara agendamentos na hora.
10. **Um turno de motor por vez por thread.** Chave do lock = `FlowSession.contactId` = `Conversation.id` (não o telefone isolado). Duas linhas = dois locks. No máximo um `ProcessIncomingFlowUseCase` em execução para essa chave; incoming concorrente da mesma thread **espera** e entra **depois**, já com a sessão gravada pelo turno anterior. Não: vários turnos “sem sessão” em paralelo (abertura/menu duplicados). Threads distintas podem rodar em paralelo. Persistência da `Message` incoming **não** espera o lock. Sem porta nova em `core`. Sem lock distribuído (Redis) nesta versão. Depois do debounce, o turno marca `consumedIncomingAt` com o timestamp do último incoming usado. Turno seguinte cuja mensagem é **mais antiga ou igual** a esse marco **não** dispara resposta (o burst já foi o texto da vez).
11. **Três falhas seguidas na mesma pergunta** (`BotBehavior.missHandoffAfter`, padrão 3; 0 = desliga): o motor faz `handoff` (pausa, texto “Vou te passar para uma pessoa da equipe.”, setor da conversa se houver). `missStreak` na sessão; opção ou palavra-chave zera.
12. **Mídia com pergunta à espera:** persiste. Se houver **legenda** (texto não vazio), o motor trata a legenda como incoming texto (avança opção/`miss`/atalho). Sem legenda: não avança; envia uma vez `mediaHintMessage`. `mediaHintStepId` evita repetir no mesmo passo.
13. **Rascunho vs publicado:** o editor grava `Flow.steps`. O motor e o fluxo de entrada usam `publishedSteps` se houver; senão `steps` (legado). A **primeira** gravação de um fluxo sem `publishedSteps` copia `steps` para lá. Gravações seguintes **não** mudam o publicado. **Publicar** copia `steps` → `publishedSteps` só se `flowHealthIssues` estiver vazio. Se houver sessões cuja `currentStepId` **não** está nos passos novos, o painel pede confirmação (“N conversas estão em passos que vão sumir”). Escolher fluxo de entrada (chatbot ou linha) **recusa** se o roteiro que o motor usaria tiver problema de saúde.
14. **Reabrir finalizada no painel:** a thread é a mesma (`Conversation.id`). Composer **não** trava em `closed`. Envio do atendente reabre `open`, **solta o dono** (volta à Entrada), despausa a sessão e zera `currentStepId` (ciclo conhecido: próxima incoming do contato = menu, sem Olá). Não cria segunda conversa no mesmo contato+linha. Incoming em `closed` continua reabrindo e **mantém** o agente (`03`).
15. **Atalho humano:** incoming cujo texto casa `matchesHumanHandoff` (`humano`, `atendente`, `falar com humano`; `0` só igualzinho) → `handoff` imediato (pausa, `DEFAULT_MISS_HANDOFF`), mesmo no meio da pergunta. Não entra em outro fluxo por palavra-chave nesse turno.
16. **Passo órfão:** `currentStepId` que não existe no roteiro que o motor usa (`publishedSteps`/`steps`) → mesma regra de conhecido (só a primeira `question`, sem reabrir Olá; o texto deste turno **não** vale como resposta).

## Ciclo novo / conhecido / reabertura

`resolveFlowAudience`: **conhecido** só se a thread **desta linha já existia** antes desta mensagem **e** o contato **já estava** no catálogo. Não vale “acabou de criar o Contact no mesmo turno” (todo incoming cria contato). Cadastro no painel sem nenhuma conversa nesta linha = **novo** (triagem com Olá).

- **Novo:** primeira mensagem que **cria** a thread nesta linha → abertura completa (Olá + menu). Só **uma** vez por thread: o lock (invariante 10) impede que um burst de 3 textos todos vejam “sem sessão”.
- **Conhecido:** thread já existia + contato no catálogo. Se o bot **não** está à espera de uma `question` (`currentStepId` null ou sem sessão), pula o Olá e vai à **primeira pergunta** (menu). Se já há pergunta à espera, o texto é a resposta (não reinicia o menu).
- **Burst na mesma thread:** o primeiro turno (debounce + `consumedIncomingAt`) responde **uma vez** com o último texto. Incoming já cobertos por esse marco não geram `miss` extra. Se chegar texto **depois** do turno, com pergunta à espera e fora das opções → `miss` + `menu` sem Olá. Três `miss` seguidos → invariante 11.
- **Reabertura:** incoming em conversa `closed` (o upsert reabre). Se conhecido, o bot **volta** mesmo com sessão `paused`: des pausa, zera `currentStepId`, manda o menu de conhecido (sem Olá). Com humano em conversa **aberta** (`paused`, não closed), o bot continua calado; **finalizar é só o atendente**.

## BotBehavior (`Chatbot.behavior`)

Padrão da empresa no chatbot **ativo** (a tela `/dashboard/chatbots`). Só um ativo: ao gravar `isActive: true`, os outros passam a inativos. Sem catálogo de bots no motor (testes), delays = 0. A tela mostra delays em **segundos** (grava milissegundos). Não exibe `messagesCount` (o campo existe, mas o motor não incrementa). **Por linha:** `WhatsAppNumber.behavior` opcional sobrepõe o ritmo da empresa. `WhatsAppNumber.flowId` opcional sobrepõe o fluxo de entrada. `WhatsAppNumber.businessHours` opcional sobrepõe o expediente (`enabled: false` nesta linha = atende fora do horário da empresa). Sem override, vale o da empresa.

| Campo | Padrão | Efeito |
|-------|--------|--------|
| `replyDelayMs` | 1000 (0–5000) | Espera depois do incoming antes da 1ª mensagem (tela: segundos) |
| `bubbleDelayMs` | 500 (0–8000) | Entre mensagens se o passo não tiver `delayMs` (tela: segundos) |
| `sendComposing` | true | Presence `composing` no delay (Evolution). `SendWhatsAppPresenceUseCase`: falha do provedor é no-op |
| `waitWhileTyping` | true | Não envia enquanto `contactTypingAt` estiver fresco (`typingIdleMs`) |
| `typingIdleMs` | 1500 (0–5000) | Margem depois que o composing parou; teto extra 8s |
| `inboundDebounceMs` | 800 (0–3000) | Espera antes da 1ª resposta **deste** turno (composing/lote). Não dispara um segundo motor em paralelo. O último incoming do debounce vale; o marco `consumedIncomingAt` descarta as extras já vistas (invariante 10). |
| `idleContactMinutes` | 30 (0 = desliga) | Só com bot à espera de `question` e `paused: false` |
| `idleCloseMessage` | texto de encerramento | Envia, `CloseConversationUseCase`, sessão `paused` |
| `missHandoffAfter` | 3 (0–10; 0 = desliga) | Falhas seguidas na pergunta → handoff |
| `mediaHintMessage` | texto | Aviso único quando chega mídia com pergunta à espera |

Inatividade **não** corre com humano (`paused`). O cron de agendamentos dispara o idle.

## FlowSession

```ts
{
  contactId: string; // = Conversation.id (thread: telefone ou telefone:lineId)
  flowId: string;
  currentStepId: string | null; // passo aguardando resposta; null = encerrado (próxima msg: só a 1ª question, sem Olá)
  paused: boolean; // true = operador assumiu ou passo handoff; motor não responde
  returnStack?: { flowId: string; resumeStepId: string | null }[]; // pilha de goToFlow
  consumedIncomingAt?: Date;
  missStreak?: number;
  mediaHintStepId?: string;
  updatedAt: Date;
}
```

Uma sessão por thread. O mesmo telefone em duas linhas WhatsApp = duas `FlowSession` (dois `contactId`). Pause, resume e Assumir recebem o id da conversa, não só o telefone.

## Mídia no passo `message`

Só `FlowStep.type === "message"`. `mediaKind`: `image` \| `audio` \| `video` \| `document`. PDF (`application/pdf`) vira `document`; outro documento (Word, zip, etc.) é recusado. Máx. 16 MB (`MAX_OUTGOING_MEDIA_BYTES`, igual ao send e às respostas rápidas).

`mediaUrl` guarda **uma** destas formas:

1. URL pública `http(s)` — legado; o motor faz `fetch` como hoje.
2. Path interno no bucket `media`: `flows/{flowId}/{stepId}` — depois de anexar arquivo no painel.

Helpers na porta já existente `IMediaStorage` (sem porta nova): `flowStepMediaPath(flowId, stepId)` e `flowStepMediaApiHref(flowId, stepId)` → `/api/flows/{flowId}/steps/{stepId}/media`. O painel reproduz pelo GET autenticado (cookie). O motor **não** chama essa URL no browser: no servidor, `loadFlowStepMedia` lê o Storage com `IMediaStorage.get` (`service_role`).

`loadFlowStepMedia(url, kind)` (helper usado por `ProcessIncomingFlowUseCase`):

- `https?:` → `fetch` público (legado). Falha, vazio ou > 16 MB → null.
- Path `flows/{flowId}/{stepId}` **ou** href da API `/api/flows/{flowId}/steps/{stepId}/media` → `IMediaStorage.get` no servidor. Ausente → null.
- Outro valor → null (o passo ainda pode enviar `content`).

Upload **não** cria fluxo nem passo: o `flowId` e o `stepId` precisam já existir no fluxo gravado. PUT/DELETE atualizam o passo (`mediaUrl` = path do Storage, `mediaKind` pelo MIME) via `SaveFlowUseCase` / repositório já existente. Remover mídia: limpa `mediaUrl`/`mediaKind` e apaga o objeto no Storage (`IMediaStorage.remove`). Sem entidade nova.

`flowHealth`: passo `message` sem texto nem `mediaUrl` continua inválido. `mediaUrl` válido = `http(s)` **ou** path/href de Storage acima; outro valor → “URL de mídia inválida”.

## Motor de fluxos (Fase 2)

Planejamento puro em `core/engine` (`planFlowTurn`, `evaluateCondition`, `resolveActiveFlow`). I/O no use case: persistir sessão e enviar via `SendWhatsAppMessageUseCase`. Disparo do use case: **serializado por thread** (invariante 10) — mutex/fila in-process na chave `Conversation.id`. O turno só começa depois de obter o lock; ao terminar, persiste a sessão **antes** de soltar o lock. Incoming da mesma thread que chegou no meio da execução espera e então lê essa sessão (não reabre como “novo”).

Critério objetivo (mesmo burst, contato novo, fluxo `inicio`): três textos em sequência (“Oie”, “Td bem?”, “Vai ter aula amanhã mesmo? Onde vai ser?”) → **uma** saudação e **um** menu (último texto no debounce; extras com `consumedIncomingAt` não respondem). Falha: abertura 2× ou menu 3× de “novo”.

`previewFlowOpening` / `previewFlowTurn` (só o painel): devolve `FlowReply[]` / o plano do primeiro turno (`oi`); `audience` `new` (sessão null) ou `known` (`sessionForKnownMenu`). Inclui `mediaUrl`/`mediaKind` quando o passo Mensagem tem mídia. `simulateFlowIncoming` é o turno seguinte no simulador: sessão `paused` (handoff) **não** gera resposta (`shouldSkipPausedSession`). O fluxo do turno é o da sessão (`resolveActiveFlow` com `sessionFlowId`), não o do editor aberto; o catálogo leva os passos não salvos do fluxo em edição (`overlayEditorOnCatalog`). Depois de um `goToFlow`, a opção seguinte continua no destino. Motor de envio inalterado.

### Resolver fluxo

1. Se há sessão e o `flowId` ainda existe e está ativo → esse fluxo.
2. Senão, o `flowId` da **linha** (`WhatsAppNumber.flowId`), se esse fluxo existir e estiver ativo.
3. Senão, o `flowId` do chatbot **ativo**, se esse fluxo existir e estiver ativo.
4. Senão, entre os ativos: `id === "inicio"`, senão nome `"Atendimento Inicial"`, senão o primeiro ativo.
5. Senão → log, sem resposta.

### Turno (`planFlowTurn`)

- **Sem sessão / novo nesta linha:** começa no primeiro passo (saudação “Olá”). A mensagem do usuário só dispara o fluxo; o texto alimenta `condition` encontradas **antes** de uma `question` no mesmo turno.
- **Conhecido sem pergunta à espera / reabertura:** **não** reenvia as mensagens iniciais. Começa na primeira `question`.
- **Sessão existe e `currentStepId` null** (já houve atendimento neste fluxo): **não** reenvia as mensagens iniciais. Começa na primeira `question` (só o enunciado e as opções).
- **`currentStepId` em `question`:** o texto é a resposta; se for só o **número** da opção (`1`, `2`, `1.`, `2)`), o motor troca pelo texto daquela linha (1 = primeira opção) e segue `nextStepId` (não reenvia a pergunta). Número inexistente ou texto livre: usa o que a pessoa digitou. Se **não** bater com uma opção (número ou texto igual) e o texto coincidir com `keywords` de outro fluxo ativo, entra nesse fluxo no primeiro passo e zera a pilha.
- **`message`:** envia `content` se não vazio; se houver `mediaUrl` e `mediaKind` `image`/`audio`/`video`/`document`, tenta enviar a mídia (`loadFlowStepMedia`; falha = só o texto). `delayMs` (0–8000, padrão 0) pausa **antes** deste envio. Segue `nextStepId`. Sem mídia em `question` / `action` / `condition`.
- **`action`:** `setDepartment` grava o setor da thread se o id existir e estiver ativo e **não** envia `content`. `goToFlow` para fluxo **ativo** ainda não visitado **por salto** neste turno: continua no primeiro passo do destino no mesmo turno. Se o passo de salto tiver `nextStepId` (“Ao voltar”), empilha origem e retoma esse passo quando o destino acaba. Sem “Ao voltar”, a sessão permanece no destino. Destino inativo/inexistente/ciclo A→B→A → não salta; segue `nextStepId` se o salto falhar. `goToFlow` **não** envia `content`. Novos contatos entram no fluxo de entrada da **linha** (`WhatsAppNumber.flowId`) ou, se a linha herda, no `flowId` do chatbot ativo (selo WhatsApp); se vazio ou inativo, cai no `inicio`. Salvo palavra-chave. `handoff` envia `content` se houver, grava setor se `departmentId` ativo, `paused: true` e **para**. Sem esses tipos, a action se comporta como `message`.
- **Palavra-chave (sem pergunta à espera, ou texto que não é opção):** `contains`/`equals` case-insensitive contra `Flow.keywords` de um fluxo ativo **diferente** do atual → primeiro passo desse fluxo, pilha vazia.
- **`question`:** envia `content`; se houver `options`, concatena uma linha `N. opção` (1-based) por item; grava `currentStepId` nessa pergunta e **para**.
- **`condition`:** `field` suportado: `content` (texto incoming do turno, **já resolvido** para o texto da opção se a pessoa digitou o número). Outro `field` → ramo `false`. Operadores: `equals` e `contains` (trim, case-insensitive); `greaterThan` / `lessThan` numéricos (`Number`); `NaN` → `false`. Segue `trueStepId` ou `falseStepId`.
- Passo ou `nextStepId` inexistente → encerra (`currentStepId` null). A próxima mensagem **não** reenvia a abertura: só a primeira `question`. **Exceção:** `currentStepId` da sessão apontando para passo que não existe no roteiro do motor → invariante 16 (menu conhecido neste turno). No fluxo `inicio`, o passo `miss` (“Não peguei…”) aponta para `menu` no mesmo turno. Ramos do menu usam `goToFlow` para `sistema`, `demo`, `cliente` e `comercial`. Comercial, demo e ajuda do cliente usam `handoff`.
- `question` não valida se a resposta está em `options`. Número da opção só mapeia quando o texto é **só** o número (com `.` ou `)` opcional).
- Atalho humano (invariante 15) **vence** opção e palavra-chave neste turno.

Entrada do motor: incoming `type === "text"` com conteúdo, **ou** mídia com **legenda** não vazia, avançam o roteiro. Mídia sem legenda: invariante 12. Sessão `paused` em conversa **aberta**: persiste, não avança. Reabertura de `closed` (conhecido): despausa e mostra o menu. **Ritmo:** `BotBehavior` do chatbot ativo, com overlay da linha se houver (`WhatsAppNumber.behavior`). **Expediente:** `businessHours` da **linha**, se houver; senão o do chatbot ativo. Com `enabled` fora do horário envia `closedMessage` e **não** avança o fluxo; sessão `outsideHoursNotified`. Cada dia da semana pode estar fechado ou ter `start`/`end` próprios (`windows`). Se `end` for **antes** de `start` (ex. 22:00–06:00), o turno começa nesse dia e termina no seguinte; o dia seguinte não precisa estar marcado. `start` igual a `end` = o dia todo. Cadastro antigo só com `days` + `start`/`end` continua válido. Sem sessão pausada. Na volta ao horário, se só houve o aviso (`currentStepId` null), a próxima mensagem começa o fluxo do zero. **Fila:** após `handoff`, o bot acrescenta “Você é o N na fila” (`queuePlace`: mesmo setor, sem atendente, não finalizada). Áudio/imagem/vídeo/documento são reproduzíveis no painel via `GET /api/messages/{id}/media` (cache no Storage; se faltar, a Evolution entrega o base64 pelo `id` da mensagem).

## Testes obrigatórios (escrever; usuário executa)

- Primeira mensagem cria sessão e envia passos até a primeira `question`.
- Sem sessão, a entrada é o `flowId` da linha ou o do chatbot ativo (senão `inicio`).
- Sessão existente com `currentStepId` null não reenvia a abertura (só a primeira `question`).
- No fluxo `inicio`, texto fora do menu envia `miss` e o `menu` no mesmo turno (sem “Olá”).
- **Lock por thread:** três incoming texto **concorrentes** na mesma `Conversation.id` com sessão ainda inexistente → uma abertura + um menu; as duas seguintes, já com sessão na pergunta, `miss` + `menu` (sem Olá). Duas threads distintas podem responder em paralelo.
- Resposta avança `nextStepId`.
- `condition` ramos true e false (texto da opção ou **número** `1`/`2`/`1.`).
- `action` `setDepartment` grava o setor da conversa da thread (`id`).
- `action` `goToFlow` troca a sessão para o fluxo destino no mesmo turno; destino inativo não salta; ao acabar o destino, retoma a origem (`returnStack`).
- `action` `handoff` pausa a sessão (e grava setor se houver) e informa a posição na fila.
- Fora do expediente o bot só avisa e não avança o fluxo; na volta, a abertura volta.
- Palavra-chave de outro fluxo ativo inicia esse roteiro.
- Sessão `paused` em conversa aberta não dispara resposta automática; reabertura conhecida dispara o menu
- `resolveFlowAudience` — conhecido = thread já existia nesta linha e contato já no catálogo
- `DispatchIdleBotSessionsUseCase` — silêncio na pergunta fecha; `paused` (humano) não fecha
- `PauseContactFlowUseCase` / `ResumeContactFlowUseCase` atuam na sessão cujo `contactId` é o id da conversa.
- Duas linhas WhatsApp = duas conversas e duas sessões; legado (`id` = telefone) não duplica.
- `AssignConversationUseCase` coloca em Esperando; `CloseConversationUseCase` fecha.
- `MarkConversationReadUseCase` zera `unreadCount`.
- `MarkWhatsAppMessagesReadUseCase` envia ids incoming ainda não `read`; no-op sem `markMessagesRead`; conversa inexistente não chama o provedor.
- Busca da inbox casa nome **ou** conteúdo da thread.
- `SaveQuickReplyMediaUseCase` grava áudio, imagem, vídeo ou PDF; recusa outro documento e arquivo > 16 MB; resposta inexistente retorna null.
- `GetQuickReplyMediaUseCase` lê o objeto no path `quick-replies/{id}`; sem `mediaKind` ou arquivo ausente → null.
- `SaveFlowStepMediaUseCase` grava imagem, áudio, vídeo ou PDF no path `flows/{flowId}/{stepId}`; recusa outro documento e arquivo > 16 MB; fluxo ou passo inexistente (ou passo que não é `message`) retorna null; `media: null` limpa `mediaUrl`/`mediaKind` e chama `IMediaStorage.remove`.
- `GetFlowStepMediaUseCase` lê o objeto no path; ausente → null.
- `loadFlowStepMedia` aceita URL `http(s)` pública **e** path/href de mídia do Storage; outro valor → null (só o texto).
- Fila “minhas”: Esperando/Finalizados com `assignedAgentId` do operador; Entrada sem filtro de dono.
