# 02 — Domínio

## Entidades (`core/entities`)

| Entidade | Papel |
|----------|--------|
| `User` / `AuthUser` | Operador do painel (`admin` \| `user`) |
| `Flow` + `FlowStep` | Automação: `message` \| `question` \| `condition` \| `action` (`setDepartment`, `goToFlow` ou `handoff`). `canvasPosition` opcional (só o quadro). `delayMs` (0–8000) e `mediaUrl`/`mediaKind` (`image` \| `audio`) na mensagem. `Flow.keywords` opcional (entrada por atalho) |
| `FlowSession` | Passo atual do contato no fluxo. `outsideHoursNotified` evita repetir o aviso de expediente |
| `Message` | Mensagem WhatsApp (in/out, tipo, status). `reactions` opcional: um emoji por remetente |
| `Conversation` | Atendimento com contato, setor, agente, tags, status. `assignedAt` opcional (primeiro Assumir) |
| `Department` | Setor (cor, ativos, contagens) |
| `InternalMessage` | Nota da equipe na conversa |
| `Chatbot` | Bot cadastrado no painel (pode apontar `flowId`). `businessHours` opcional (expediente do WhatsApp) |
| `Agent` | Atendente (`online` \| `offline`) |
| `Contact` | Contato WhatsApp + etiquetas; `avatarUrl` opcional (foto no Storage, via `/api/contacts/{id}/avatar`) |
| `WhatsAppNumber` | Número/linha WhatsApp da **mesma** empresa. Na UI o rótulo é `name` (ex. Comercial); `instanceName` é identificador técnico (slug do nome se o admin não preencher) |
| `Tag` | Etiqueta (`color`, `contactsCount`) |
| `QuickReply` | `id`, `title` (rótulo curto, ex. “Saudação”), `body` (texto enviado; Unicode, pode ter emoji), `createdAt`. Catálogo da **empresa** (esta stack). Sem atalho de teclado. Sem dono por atendente. Sem respostas por setor nesta versão |
| `ScheduledMessage` | Envio futuro (`pending` \| `sent` \| `failed`). `contact` = telefone; `conversationId` opcional = thread (mesma linha) |
| `Report` | Snapshot gerado no painel |
| `DashboardMetrics` | KPIs calculados: totais, taxa de resposta, volume por setor, tempo médio até Assumir |

Novas entidades exigem interface de repositório em `core/repositories` e mock em `infra/mocks` **antes** da UI.

## Repositórios (portas)

- `IAuthRepository` — login, logout, usuário atual
- `IFlowRepository` — CRUD de fluxos
- `IFlowSessionRepository` — sessão por `contactId` (upsert); `contactId` = `Conversation.id` da thread
- `IMessageRepository` — histórico da thread (mensagens daquela linha; ver invariante 3)
- `IMediaStorage` — cache de áudio/imagem/vídeo/documento (bucket `media`); path `messages/{id}`
- `IConversationRepository`, `IDepartmentRepository`, `IInternalMessageRepository`
- `IChatbotRepository`, `IAgentRepository`, `IContactRepository`, `IWhatsAppNumberRepository`, `ITagRepository`, `IScheduledMessageRepository`, `IReportRepository` — CRUD (`ICrudRepository`)
- `IQuickReplyRepository` = `ICrudRepository<QuickReply>` (padrão `ITagRepository`)

Catálogos do painel usam `CatalogUseCase` (`list` / `save` / `delete`). Respostas rápidas: `QuickReplyCatalogUseCase`. Conversas: `GetAllConversationsUseCase` (lista o catálogo; a prévia `lastMessage` vem do snapshot na conversa). Se o snapshot estiver vazio, preenche a partir das mensagens da thread e tenta gravar — falha ao gravar **não** esconde a lista (hidrata em memória). Sem coluna `last_message` (PGRST204), o save **omite** o campo. `GetConversationByIdUseCase`, `AssignConversationUseCase` (grava `assignedAt` na primeira vez), `TransferConversationUseCase`, `CloseConversationUseCase`, `MarkConversationReadUseCase`, `SetConversationDepartmentUseCase`, `SetConversationTagsUseCase`. Relatórios: `GetDashboardMetricsUseCase`, `ReportCatalogUseCase`, `GenerateReportUseCase`.

## Use cases existentes

Auth: `LoginUseCase`, `LogoutUseCase`, `GetCurrentUserUseCase` (agente `offline` encerra a sessão)  
Fluxos: `GetAllFlowsUseCase`, `GetFlowByIdUseCase`, `SaveFlowUseCase`, `DeleteFlowUseCase` (apaga sessões daquele `flowId` e solta `chatbots.flowId` antes de remover o fluxo)  
Mensagens: `GetAllMessagesUseCase`, `GetMessagesByContactUseCase`  
WhatsApp: `SendWhatsAppMessageUseCase`, `HandleIncomingWhatsAppMessageUseCase`, `UpsertConversationFromMessageUseCase`, `UpsertContactFromIncomingUseCase`, `SyncContactAvatarUseCase`, `SyncMissingContactAvatarsUseCase`, `SyncLiveWhatsAppNumberUseCase`, `UpdateMessageStatusUseCase`, `ApplyMessageReactionUseCase`, `SendMessageReactionUseCase`  
Agendamentos: `ScheduledMessageCatalogUseCase`, `DispatchDueScheduledMessagesUseCase` (pendente com `scheduledDate <= agora` → envia, pausa a sessão da thread, marca `sent` ou `failed`)  
Respostas rápidas: `QuickReplyCatalogUseCase` (`list` / `save` / `delete`; padrão Tag)  
Motor: `ProcessIncomingFlowUseCase` (incoming texto → respostas do fluxo)  
Atendimento humano: `PauseContactFlowUseCase`, `ResumeContactFlowUseCase`, `GetFlowSessionUseCase`  
Operadores: `EnsureOperatorAgentUseCase`, `CreateOperatorUseCase`, `SetOperatorRoleUseCase`, `SetOperatorPasswordUseCase`, `DeleteOperatorUseCase`, `ListOperatorsUseCase`  
Fila: `AssignConversationUseCase` (assumir → `waiting` + agente), `TransferConversationUseCase` (`transferred`), `CloseConversationUseCase` (`closed`), `MarkConversationReadUseCase` (`unreadCount: 0`), `SetConversationDepartmentUseCase` (`departmentId` / `departmentName`)

## Respostas rápidas

Catálogo **da empresa** (esta stack): um banco, sem `company_id`, sem dono por atendente, sem respostas por setor nesta versão. Atendente (`user`) e admin **veem e editam** o mesmo catálogo (`list` / `save` / `delete`).

```ts
{
  id: string;
  title: string; // rótulo curto na lista (ex. "Saudação")
  body: string;  // texto inserido no compositor e enviado
  createdAt: Date;
}
```

Porta `IQuickReplyRepository` = `ICrudRepository<QuickReply>`. Use case `QuickReplyCatalogUseCase` (`list` / `save` / `delete`), padrão `TagCatalogUseCase`. Mock em `infra/mocks` com **2–3 frases de exemplo** (dev/test); campo no bag do ServiceLocator. Prod (Supabase) começa **vazio** — sem seed SQL de frases.

Sem atalho de teclado nesta versão. Inserir no compositor é só cliente (mesmo helper de posição do cursor que o emoji); o envio permanece `POST /api/messages/send` com o texto — sem rota HTTP nova.

## Invariantes

1. Mensagem incoming/outgoing tem `direction` e `status` válidos (`pending` \| `sent` \| `delivered` \| `read` \| `failed`). Outgoing: relógio = saindo; um tique cinza = no servidor; dois cinza = no celular do contato; dois azuis = lida. Incoming não mostra tiques. Evolution `messages.update` / `MESSAGES_UPDATE` atualiza o ack (`UpdateMessageStatusUseCase`) sem rebaixar lida/entregue e **não** dispara o fluxo. Se o id for o `lastMessage` da conversa, o snapshot da prévia da inbox também avança o `status` (tiques na lista). **Reação** (`Message.reactions`: `{ emoji, from }[]`): um emoji por remetente (`from` = telefone do contato ou `instanceName` da linha). Emoji vazio remove a reação daquela pessoa. Não cria bolha; não dispara o fluxo; não incrementa não lidas; não muda `lastActivity`; não pausa o bot. Reupsert da mesma mensagem no webhook **preserva** reações já gravadas. Painel envia via `SendMessageReactionUseCase` (Evolution ou Meta); o mesmo emoji da linha tira a reação. A thread **mostra o chip na hora** (otimista); um reload sem `reactions` no banco **não apaga** o que já está na tela.
2. Só fluxo `isActive` entra no motor.
3. Conversa: status `open` \| `closed` \| `waiting` \| `transferred`. Toda `Message` persistida cria/atualiza `Conversation` e `Contact`. Contato continua um cadastro por telefone (`id`/`phone` = telefone, `name` = `pushName` do WhatsApp quando houver). **Uma thread por contato + linha:** `Conversation.id` = `conversationThreadId(phone, whatsappNumberId)` → `{digitosDoTelefone}` se não houver linha; `{digitos}:{lineId}` se houver. A conversa guarda `whatsappNumberId` da linha que recebeu/enviou (`matchWhatsAppNumber` pelo `instanceName` ou dígitos em `to`/`from`, via `lineHintFromMessage`). Upsert: mensagem na linha A atualiza só a thread A; a mesma pessoa na linha B cria outra conversa (outro `id`, mesmo `contactPhone`). **Legado:** conversa com `id` = telefone e já com `whatsappNumberId` continua sendo a thread daquela linha — não duplicar. Só cria `phone:lineId` quando o telefone já tem thread em **outra** linha. Reply e agendamento saem pela mesma instância da thread. Mensagens da thread: só as daquela linha (`lineHintFromMessage` vs `instanceName`/número da linha); não misturar Comercial e Suporte. Filtro da inbox por linha esconde conversas com outro `whatsappNumberId`. Uma empresa, vários atendentes, vários números em paralelo — sem `company_id`. Não sobrescrever nome real por número. Incoming em conversa `closed` reabre para `open` (mantém o agente) e incrementa `unreadCount`. Conversa nova **não** ganha setor no upsert. Passo `action` `setDepartment` no fluxo grava o setor **da conversa da thread** (`Conversation.id`) no mesmo turno (antes da fila) — não numa conversa “só telefone” se já existir thread composta. `SetConversationDepartmentUseCase` grava `departmentId` / `departmentName` (id vazio remove o setor). **Assumir** usa o id da conversa (não só o telefone): grava `assignedAgentId` / `assignedAgentName` e `status: waiting` (aba Esperando); se a conversa não tem setor e o agente do operador tem, copia o setor. Todo perfil de login **nasce como agente** (`id` e e-mail iguais; `EnsureOperatorAgentUseCase` e trigger `handle_new_user`). **E-mail de agente único** (case-insensitive, `trim`): uma linha em `agents` por e-mail. `CreateOperatorUseCase` recusa (409) se o e-mail já existir em agentes ou operadores. `EnsureOperatorAgentUseCase` não cria segundo cadastro se o e-mail já existir (mesmo com outro id). `AgentCatalogUseCase.save` recusa outro id com o mesmo e-mail. O trigger `handle_new_user` não insere agente se o e-mail já existir. `assignmentFromOperator` liga por **id**, senão e-mail (`linked`). O primeiro perfil no banco é `admin`; os seguintes, `user`. Só o admin cria atendentes, troca papel, **redefine senha** (`SetOperatorPasswordUseCase`, mín. 6), **exclui operador** e edita Configuração. Não rebaixa nem exclui o último admin. `DeleteOperatorUseCase` apaga login (Auth) + perfil + agente daquele e-mail. Não dá para excluir a si mesmo se for o único admin — nesse caso a tela só desativa (offline). **Transferir** usa um agente do catálogo e `status: transferred`; se o destino tem setor, a conversa passa a esse setor. **Finalizar** grava `status: closed`. Abrir a thread (`?conversation=<id>`; `?contact=` legado abre a thread mais recente daquele telefone) zera `unreadCount` (`MarkConversationReadUseCase`); não altera `lastActivity`. Enquanto a thread estiver aberta, o poll também zera (operador está vendo). Fila: **Entrada** é de todos (sem dono). **Esperando** e **Finalizados** filtram por padrão as do operador (`assignedAgentId` = mesmo id do Assumir); toogle **Ver o time** mostra as dos outros. Sem usuário logado, não filtra. Filtro de setor (padrão = setor do agente do operador, senão todos): em Entrada, um setor específico ainda inclui conversas sem setor; em Esperando/Finalizados, só o setor escolhido. Transferir lista agentes **online** (`status` ≠ `offline`) do mesmo setor da conversa; se nenhum, lista todos os online. Agent `offline` não entra no painel: `LoginUseCase` e `GetCurrentUserUseCase` recusam (depois do Auth) e encerram a sessão. Foto do contato: `SyncContactAvatarUseCase` baixa a imagem (Evolution) para o bucket `media` em `contacts/{id}` na primeira incoming sem foto **e** no recálculo da inbox (`SyncMissingContactAvatarsUseCase`, lote; `POST /api/contacts/avatars/sync`). A lista usa `Conversation.contactAvatarUrl` (cópia do `Contact.avatarUrl`); sem foto, a inicial. Se o contato já tem foto e a thread não, o recálculo só copia o href — sem chamar o provedor.
4. Auth **mock (Fases 1–3):** senha irrelevante; `admin@example.com` / `user@example.com`. Auth **Supabase (Fase 4):** senha real; papel em `profiles`; sem usuários de teste na UI; **Esqueci a senha** = e-mail do Auth (anon), sem rota nova — ver `08-supabase.md`.
5. Use case não chama Axios/Meta/Twilio direto — só `IWhatsAppService`.
6. Uma sessão por `contactId` da `FlowSession`. Esse `contactId` é o mesmo `Conversation.id` (chave da thread), não o telefone isolado. Duas linhas = duas sessões. Pause/resume/Assumir usam o id da conversa. Sem fluxo ativo: incoming é persistida e **nenhuma** resposta automática é enviada.
7. No máximo 20 passos por turno (ciclo).
8. Envio pelo painel (`POST /api/messages/send`) **pausa** a sessão da thread (`paused: true`): com `conversationId`, essa conversa; sem ele, a conversa do telefone (a mais recente se houver várias). Texto ou mídia (imagem/áudio/vídeo/documento). Mídia outgoing é cacheada em `IMediaStorage` (`messages/{id}`). Enquanto pausado, incoming é persistida e o motor **não** responde. `ResumeContactFlowUseCase` volta `paused: false` e zera `currentStepId` (próxima mensagem mostra só a primeira `question`, sem a abertura) na sessão daquela thread. Respostas automáticas do motor **não** pausam.
9. Agendamento `pending` com `scheduledDate <= agora` é enviado pelo mesmo `SendWhatsAppMessageUseCase` (`to` = telefone do contato). Com `conversationId`, o envio e o pause usam **essa** thread (mesma linha). Sem `conversationId`, resolve pela conversa do telefone (a mais recente se houver várias). Sucesso → `sent` e pausa a sessão; falha do provedor ou texto vazio → `failed`. Futuro permanece `pending`. O disparo **não** depende do painel: cron in-process a cada 60s em `next dev` / `next start` (exceto Vercel serverless); na Vercel, `GET /api/schedules/dispatch` via `vercel.json`. Salvar no painel ainda dispara na hora.

## FlowSession

```ts
{
  contactId: string; // = Conversation.id (thread: telefone ou telefone:lineId)
  flowId: string;
  currentStepId: string | null; // passo aguardando resposta; null = encerrado (próxima msg: só a 1ª question, sem Olá)
  paused: boolean; // true = operador assumiu ou passo handoff; motor não responde
  returnStack?: { flowId: string; resumeStepId: string | null }[]; // pilha de goToFlow
  updatedAt: Date;
}
```

Uma sessão por thread. O mesmo telefone em duas linhas WhatsApp = duas `FlowSession` (dois `contactId`). Pause, resume e Assumir recebem o id da conversa, não só o telefone.

## Motor de fluxos (Fase 2)

Planejamento puro em `core/engine` (`planFlowTurn`, `evaluateCondition`, `resolveActiveFlow`). I/O no use case: persistir sessão e enviar via `SendWhatsAppMessageUseCase`.

### Resolver fluxo

1. Se há sessão e o `flowId` ainda existe e está ativo → esse fluxo.
2. Senão, entre os ativos: `id === "inicio"`, senão nome `"Atendimento Inicial"`, senão o primeiro ativo.
3. Senão → log, sem resposta.

### Turno (`planFlowTurn`)

- **Sem sessão (primeiro contato):** começa no primeiro passo do fluxo (ex. saudação “Olá”). A mensagem do usuário só dispara o fluxo; o texto alimenta `condition` encontradas **antes** de uma `question` no mesmo turno.
- **Sessão existe e `currentStepId` null** (já houve atendimento neste fluxo): **não** reenvia as mensagens iniciais. Começa na primeira `question` (só o enunciado e as opções).
- **`currentStepId` em `question`:** o texto é a resposta; se for só o **número** da opção (`1`, `2`, `1.`, `2)`), o motor troca pelo texto daquela linha (1 = primeira opção) e segue `nextStepId` (não reenvia a pergunta). Número inexistente ou texto livre: usa o que a pessoa digitou. Se **não** bater com uma opção (número ou texto igual) e o texto coincidir com `keywords` de outro fluxo ativo, entra nesse fluxo no primeiro passo e zera a pilha.
- **`message`:** envia `content` se não vazio; se `mediaUrl` http(s) e `mediaKind` `image`/`audio`, tenta enviar a mídia (URL inválida = só o texto). `delayMs` (0–8000, padrão 0) pausa **antes** deste envio. Segue `nextStepId`.
- **`action`:** `setDepartment` grava o setor da thread se o id existir e estiver ativo e **não** envia `content`. `goToFlow` para fluxo **ativo** ainda não visitado **por salto** neste turno: continua no primeiro passo do destino no mesmo turno. Se o passo de salto tiver `nextStepId` (“Ao voltar”), empilha origem e retoma esse passo quando o destino acaba. Sem “Ao voltar”, a sessão permanece no destino. Destino inativo/inexistente/ciclo A→B→A → não salta; segue `nextStepId` se o salto falhar. `goToFlow` **não** envia `content`. Novos contatos entram em `inicio` (selo WhatsApp), salvo palavra-chave. `handoff` envia `content` se houver, grava setor se `departmentId` ativo, `paused: true` e **para**. Sem esses tipos, a action se comporta como `message`.
- **Palavra-chave (sem pergunta à espera, ou texto que não é opção):** `contains`/`equals` case-insensitive contra `Flow.keywords` de um fluxo ativo **diferente** do atual → primeiro passo desse fluxo, pilha vazia.
- **`question`:** envia `content`; se houver `options`, concatena uma linha `N. opção` (1-based) por item; grava `currentStepId` nessa pergunta e **para**.
- **`condition`:** `field` suportado: `content` (texto incoming do turno, **já resolvido** para o texto da opção se a pessoa digitou o número). Outro `field` → ramo `false`. Operadores: `equals` e `contains` (trim, case-insensitive); `greaterThan` / `lessThan` numéricos (`Number`); `NaN` → `false`. Segue `trueStepId` ou `falseStepId`.
- Passo ou `nextStepId` inexistente → encerra (`currentStepId` null). A próxima mensagem **não** reenvia a abertura: só a primeira `question`. No fluxo `inicio`, o passo `miss` (“Não peguei…”) aponta para `menu` no mesmo turno, para reapresentar as opções sem a saudação. Ramos do menu usam `goToFlow` para `sistema`, `demo`, `cliente` e `comercial` (`salesIntakeFlows`). Comercial, demo e ajuda do cliente usam `handoff` (setor + bot pausa).
- `question` não valida se a resposta está em `options`. Número da opção só mapeia quando o texto é **só** o número (com `.` ou `)` opcional).

Entrada do motor: só incoming `type === "text"` com conteúdo não vazio. Mídia: persiste, não avança fluxo. Sessão `paused`: persiste, não avança fluxo. **Expediente:** o chatbot ativo com `businessHours.enabled` fora do horário (fuso e dias) envia `closedMessage` e **não** avança o fluxo; sessão `outsideHoursNotified`. Sem sessão pausada. Na volta ao horário, se só houve o aviso (`currentStepId` null), a próxima mensagem começa o fluxo do zero. **Fila:** após `handoff`, o bot acrescenta “Você é o N na fila” (`queuePlace`: mesmo setor, sem atendente, não finalizada). Áudio/imagem/vídeo/documento são reproduzíveis no painel via `GET /api/messages/{id}/media` (cache no Storage; se faltar, a Evolution entrega o base64 pelo `id` da mensagem).

## Testes obrigatórios (escrever; usuário executa)

- Primeira mensagem cria sessão e envia passos até a primeira `question`.
- Sessão existente com `currentStepId` null não reenvia a abertura (só a primeira `question`).
- No fluxo `inicio`, texto fora do menu envia `miss` e o `menu` no mesmo turno (sem “Olá”).
- Resposta avança `nextStepId`.
- `condition` ramos true e false (texto da opção ou **número** `1`/`2`/`1.`).
- `action` `setDepartment` grava o setor da conversa da thread (`id`).
- `action` `goToFlow` troca a sessão para o fluxo destino no mesmo turno; destino inativo não salta; ao acabar o destino, retoma a origem (`returnStack`).
- `action` `handoff` pausa a sessão (e grava setor se houver) e informa a posição na fila.
- Fora do expediente o bot só avisa e não avança o fluxo; na volta, a abertura volta.
- Palavra-chave de outro fluxo ativo inicia esse roteiro.
- Sessão `paused` não dispara resposta automática.
- `PauseContactFlowUseCase` / `ResumeContactFlowUseCase` atuam na sessão cujo `contactId` é o id da conversa.
- Duas linhas WhatsApp = duas conversas e duas sessões; legado (`id` = telefone) não duplica.
- `AssignConversationUseCase` coloca em Esperando; `CloseConversationUseCase` fecha.
- `MarkConversationReadUseCase` zera `unreadCount`.
- Fila “minhas”: Esperando/Finalizados com `assignedAgentId` do operador; Entrada sem filtro de dono.
