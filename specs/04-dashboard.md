# 04 — Dashboard e UI

## Shell

- Login: `/login` (Supabase Auth na Fase 4; sem lista de usuários de teste)
- Home `/` redireciona: autenticado → `/dashboard/flows`; senão → `/login`
- Layout dashboard: sidebar ícones + header “Chatbot Atendimento” + tema claro/escuro
- Itens do menu: `ui/components/sidebar.tsx` (`sidebarItems`)

## Módulos (Fase 3)

Todas as rotas abaixo são **funcionais** (use case + mock). Nenhuma é vitrine.

| Rota | Use cases | Persistência Fase 3 |
|------|-----------|---------------------|
| `/dashboard/flows` | `GetAll` / `Save` / `Delete` Flow | `IFlowRepository` |
| `/dashboard/messages` | listagem geral; com `?contact=` thread + envio + Assumir/Transferir/Finalizar | mensagens + conversa + agentes |
| `/dashboard/conversations` | listar + transferir (seletor de agentes) + abrir | `IConversationRepository` + `IAgentRepository` |
| `/dashboard/whatsapp` | QR/status + mensagens com player de mídia | BFF `/api/chat-whatsapp/*` (Evolution se `WHATSAPP_PROVIDER=evolution`) |
| `/dashboard/departments` | catálogo setor | `IDepartmentRepository` |
| `/dashboard/internal-chat` | conversas + notas internas | conversa + `IInternalMessageRepository` |
| `/dashboard/chatbots` | catálogo | `IChatbotRepository` |
| `/dashboard/agents` | catálogo | `IAgentRepository` |
| `/dashboard/contacts` | catálogo | `IContactRepository` |
| `/dashboard/numbers` | catálogo | `IWhatsAppNumberRepository` |
| `/dashboard/tags` | catálogo | `ITagRepository` |
| `/dashboard/schedules` | catálogo | `IScheduledMessageRepository` |
| `/dashboard/reports` | métricas + lista/gerar | mensagens/conversas + `IReportRepository` |

Catálogo = `list` / `save` / `delete` via `CatalogUseCase` (subclasses no locator). Páginas **não** importam `infra/mocks`.

## Relatórios

- KPIs: `GetDashboardMetricsUseCase` calcula a partir de mensagens e conversas mock (totais reais da sessão). Sem percentuais inventados; tendência omitida até haver histórico.
- “Gerar relatório” grava um `Report` com snapshot do período atual.
- “Baixar” no cliente gera um JSON (`blob`); sem S3.

## Transferência

`TransferConversationUseCase`: define `assignedAgentId` / `assignedAgentName` e `status: transferred`. A conversa **não some**: vai para a aba **Esperando**. Destino = agente escolhido no seletor (`AgentCatalogUseCase.list()`). Sem agente selecionado, não transfere.

**Abrir** em conversas navega para `/dashboard/messages?contact=<telefone>`.

Com `?contact=`, Mensagens mostra **thread** (bolhas in/out, mídia) e campo de texto. Enviar chama `POST /api/messages/send` (`to` = telefone) e pausa o bot. Ações da conversa:

- **Assumir** — operador logado (casa `Agent.email` com o usuário; senão usa `User.id` / `User.name`); `status: waiting`; pausa o chatbot.
- **Transferir** — seletor com agentes cadastrados.
- **Finalizar** — `status: closed`.

Enquanto o fluxo estiver pausado, a tela indica e oferece **Retomar chatbot**. Sem `?contact=`, permanece a tabela geral.

**Mídia** em Mensagens e na aba de mensagens de `/dashboard/whatsapp`: `image` → `<img>`, `audio` → player, `video` → player, `document` → download. Fonte: `/api/messages/{id}/media` (cookie da sessão). Sem mídia: mostra `content` (ex.: “Áudio recebido”).

**Contatos**: `ContactCatalogUseCase.list()` preenche o catálogo a partir das mensagens já persistidas (telefone + nome quando houver).

## Regras de UI

- Componentes em `ui/components`; páginas em `app/`
- `'use client'` quando há estado/hooks
- Sem Axios de provedor WhatsApp nas páginas
- Tema via `ThemeContext`; não quebrar `Providers`
- Novo item de menu: `sidebarItems` **e** esta spec
