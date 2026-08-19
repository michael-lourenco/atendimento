# 02 — Domínio

## Entidades (`core/entities`)

| Entidade | Papel |
|----------|--------|
| `User` / `AuthUser` | Operador do painel (`admin` \| `user`) |
| `Flow` + `FlowStep` | Automação: `message` \| `question` \| `condition` \| `action` |
| `FlowSession` | Passo atual do contato no fluxo |
| `Message` | Mensagem WhatsApp (in/out, tipo, status) |
| `Conversation` | Atendimento com contato, setor, agente, tags, status |
| `Department` | Setor (cor, ativos, contagens) |
| `InternalMessage` | Nota da equipe na conversa |
| `Chatbot` | Bot cadastrado no painel (pode apontar `flowId`) |
| `Agent` | Atendente (`online` \| `offline`) |
| `Contact` | Contato WhatsApp + etiquetas |
| `WhatsAppNumber` | Número conectado |
| `Tag` | Etiqueta (`color`, `contactsCount`) |
| `ScheduledMessage` | Envio futuro (`pending` \| `sent` \| `failed`) |
| `Report` | Snapshot gerado no painel |
| `DashboardMetrics` | KPIs calculados (não hardcoded) |

Novas entidades exigem interface de repositório em `core/repositories` e mock em `infra/mocks` **antes** da UI.

## Repositórios (portas)

- `IAuthRepository` — login, logout, usuário atual
- `IFlowRepository` — CRUD de fluxos
- `IFlowSessionRepository` — sessão por `contactId` (upsert)
- `IMessageRepository` — histórico por contato
- `IMediaStorage` — cache de áudio/imagem/vídeo/documento (bucket `media`); path `messages/{id}`
- `IConversationRepository`, `IDepartmentRepository`, `IInternalMessageRepository`
- `IChatbotRepository`, `IAgentRepository`, `IContactRepository`, `IWhatsAppNumberRepository`, `ITagRepository`, `IScheduledMessageRepository`, `IReportRepository` — CRUD (`ICrudRepository`)

Catálogos do painel usam `CatalogUseCase` (`list` / `save` / `delete`). Conversas: `GetAllConversationsUseCase`, `GetConversationByIdUseCase`, `AssignConversationUseCase`, `TransferConversationUseCase`, `CloseConversationUseCase`, `MarkConversationReadUseCase`, `SetConversationDepartmentUseCase`. Relatórios: `GetDashboardMetricsUseCase`, `ReportCatalogUseCase`, `GenerateReportUseCase`.

## Use cases existentes

Auth: `LoginUseCase`, `LogoutUseCase`, `GetCurrentUserUseCase`  
Fluxos: `GetAllFlowsUseCase`, `GetFlowByIdUseCase`, `SaveFlowUseCase`, `DeleteFlowUseCase`  
Mensagens: `GetAllMessagesUseCase`, `GetMessagesByContactUseCase`  
WhatsApp: `SendWhatsAppMessageUseCase`, `HandleIncomingWhatsAppMessageUseCase`, `UpsertConversationFromMessageUseCase`, `UpsertContactFromIncomingUseCase`, `SyncLiveWhatsAppNumberUseCase`, `UpdateMessageStatusUseCase`  
Agendamentos: `ScheduledMessageCatalogUseCase`, `DispatchDueScheduledMessagesUseCase` (pendente com `scheduledDate <= agora` → envia, pausa o fluxo, marca `sent` ou `failed`)  
Motor: `ProcessIncomingFlowUseCase` (incoming texto → respostas do fluxo)  
Atendimento humano: `PauseContactFlowUseCase`, `ResumeContactFlowUseCase`, `GetFlowSessionUseCase`  
Fila: `AssignConversationUseCase` (assumir → `waiting` + agente), `TransferConversationUseCase` (`transferred`), `CloseConversationUseCase` (`closed`), `MarkConversationReadUseCase` (`unreadCount: 0`), `SetConversationDepartmentUseCase` (`departmentId` / `departmentName`)

## Invariantes

1. Mensagem incoming/outgoing tem `direction` e `status` válidos (`pending` \| `sent` \| `delivered` \| `read` \| `failed`). Outgoing: relógio = saindo; um tique cinza = no servidor; dois cinza = no celular do contato; dois azuis = lida. Incoming não mostra tiques. Evolution `messages.update` / `MESSAGES_UPDATE` atualiza o ack (`UpdateMessageStatusUseCase`) sem rebaixar lida/entregue e **não** dispara o fluxo.
2. Só fluxo `isActive` entra no motor.
3. Conversa: status `open` \| `closed` \| `waiting` \| `transferred`. Toda `Message` persistida cria/atualiza `Conversation` (`id` = telefone) e `Contact` (`id`/`phone` = telefone, `name` = `pushName` do WhatsApp quando houver). Não sobrescrever nome real por número. Incoming em conversa `closed` reabre para `open` (mantém o agente) e incrementa `unreadCount`. Conversa nova **não** ganha setor no upsert. Passo `action` `setDepartment` no fluxo grava o setor no mesmo turno (antes da fila). `SetConversationDepartmentUseCase` grava `departmentId` / `departmentName` (id vazio remove o setor). **Assumir** grava `assignedAgentId` / `assignedAgentName` e `status: waiting` (aba Esperando); se a conversa não tem setor e o agente do operador tem, copia o setor. **Transferir** usa um agente do catálogo e `status: transferred`; se o destino tem setor, a conversa passa a esse setor. **Finalizar** grava `status: closed`. Abrir a thread (`?contact=`) zera `unreadCount` (`MarkConversationReadUseCase`); não altera `lastActivity`. Enquanto a thread estiver aberta, o poll também zera (operador está vendo). Fila: **Entrada** é de todos (sem dono). **Esperando** e **Finalizados** filtram por padrão as do operador (`assignedAgentId` = mesmo id do Assumir); toogle **Ver o time** mostra as dos outros. Sem usuário logado, não filtra. Filtro de setor (padrão = setor do agente do operador, senão todos): em Entrada, um setor específico ainda inclui conversas sem setor; em Esperando/Finalizados, só o setor escolhido. Transferir lista agentes do mesmo setor da conversa; se nenhum, lista todos.
4. Auth **mock (Fases 1–3):** senha irrelevante; `admin@example.com` / `user@example.com`. Auth **Supabase (Fase 4):** senha real; papel em `profiles`; sem usuários de teste na UI — ver `08-supabase.md`.
5. Use case não chama Axios/Meta/Twilio direto — só `IWhatsAppService`.
6. Uma sessão por `contactId`. Sem fluxo ativo: incoming é persistida e **nenhuma** resposta automática é enviada.
7. No máximo 20 passos por turno (ciclo).
8. Envio pelo painel (`POST /api/messages/send`) **pausa** a sessão (`paused: true`). Texto ou mídia (imagem/áudio/vídeo/documento). Mídia outgoing é cacheada em `IMediaStorage` (`messages/{id}`). Enquanto pausado, incoming é persistida e o motor **não** responde. `ResumeContactFlowUseCase` volta `paused: false` e zera `currentStepId` (próxima mensagem recomeça o fluxo). Respostas automáticas do motor **não** pausam.
9. Agendamento `pending` com `scheduledDate <= agora` é enviado pelo mesmo `SendWhatsAppMessageUseCase` (`to` = telefone do contato). Sucesso → `sent` e pausa o fluxo; falha do provedor ou texto vazio → `failed`. Futuro permanece `pending`. O disparo **não** depende do painel: cron in-process a cada 60s em `next dev` / `next start` (exceto Vercel serverless); na Vercel, `GET /api/schedules/dispatch` via `vercel.json`. Salvar no painel ainda dispara na hora.

## FlowSession

```ts
{
  contactId: string;
  flowId: string;
  currentStepId: string | null; // passo aguardando resposta; null = fluxo encerrado / próxima msg recomeça
  paused: boolean; // true = operador assumiu; motor não responde
  updatedAt: Date;
}
```

## Motor de fluxos (Fase 2)

Planejamento puro em `core/engine` (`planFlowTurn`, `evaluateCondition`, `resolveActiveFlow`). I/O no use case: persistir sessão e enviar via `SendWhatsAppMessageUseCase`.

### Resolver fluxo

1. Se há sessão e o `flowId` ainda existe e está ativo → esse fluxo.
2. Senão, entre os ativos: `id === "inicio"`, senão nome `"Atendimento Inicial"`, senão o primeiro ativo.
3. Senão → log, sem resposta.

### Turno (`planFlowTurn`)

- **Sem sessão ou `currentStepId` null:** começa no primeiro passo do fluxo. A mensagem do usuário só dispara o fluxo; o texto alimenta `condition` encontradas **antes** de uma `question` no mesmo turno.
- **`currentStepId` em `question`:** o texto é a resposta; o motor segue `nextStepId` (não reenvia a pergunta).
- **`message`:** envia `content` se não vazio; segue `nextStepId`.
- **`action`:** se `action.type === "setDepartment"` e `action.departmentId` existe no catálogo e está ativo, grava o setor da conversa (`SetConversationDepartmentUseCase`) e **não** envia `content` no WhatsApp. Sem `setDepartment`, comporta-se como `message`. Segue `nextStepId`.
- **`question`:** envia `content`; se houver `options`, concatena uma linha `- opção` por item; grava `currentStepId` nessa pergunta e **para**.
- **`condition`:** `field` suportado: `content` (texto incoming do turno). Outro `field` → ramo `false`. Operadores: `equals` e `contains` (trim, case-insensitive); `greaterThan` / `lessThan` numéricos (`Number`); `NaN` → `false`. Segue `trueStepId` ou `falseStepId`.
- Passo ou `nextStepId` inexistente → encerra (`currentStepId` null). Próxima mensagem recomeça o fluxo resolvido.
- `question` não valida se a resposta está em `options`.

Entrada do motor: só incoming `type === "text"` com conteúdo não vazio. Mídia: persiste, não avança fluxo. Sessão `paused`: persiste, não avança fluxo. Áudio/imagem/vídeo/documento são reproduzíveis no painel via `GET /api/messages/{id}/media` (cache no Storage; se faltar, a Evolution entrega o base64 pelo `id` da mensagem).

## Testes obrigatórios (escrever; usuário executa)

- Primeira mensagem cria sessão e envia passos até a primeira `question`.
- Resposta avança `nextStepId`.
- `condition` ramos true e false.
- `action` `setDepartment` grava o setor da conversa.
- Sessão `paused` não dispara resposta automática.
- `PauseContactFlowUseCase` marca pausa; `ResumeContactFlowUseCase` recomeça o fluxo.
- `AssignConversationUseCase` coloca em Esperando; `CloseConversationUseCase` fecha.
- `MarkConversationReadUseCase` zera `unreadCount`.
- Fila “minhas”: Esperando/Finalizados com `assignedAgentId` do operador; Entrada sem filtro de dono.
