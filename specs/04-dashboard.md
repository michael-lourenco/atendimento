# 04 — Dashboard e UI

## Shell

- Login: `/login` (Supabase Auth na Fase 4; sem lista de usuários de teste)
- Home `/` e login autenticado → `/dashboard/conversations`; senão → `/login`
- Layout dashboard: sidebar **expansível** (nomes visíveis; pode recolher para ícones) + header com marca, **tela atual**, selo de conexão WhatsApp + tema claro/escuro
- Itens do menu: `ui/lib/sidebar-nav.ts` (`sidebarGroups`), renderizados em `ui/components/sidebar.tsx`
- Grupos: **Atendimento** (Conversas, WhatsApp, Contatos, Relatórios) e **Configuração** (Fluxos, Agentes, Setores, Números, Etiquetas, Agendamentos)
- Sem **Chat interno** no menu: notas da equipe ficam **na conversa**. `/dashboard/internal-chat` redireciona para Conversas
- Sem **Chatbots** no menu: o roteiro é **Fluxos**. `/dashboard/chatbots` permanece por URL
- WhatsApp (QR/conexão) fica junto de Conversas, não no fim do menu
- Exclusão no catálogo: diálogo na UI (Confirmar/Cancelar), sem `confirm()` nativo do browser

## Módulos (Fase 3)

Todas as rotas abaixo são **funcionais** (use case + mock). Nenhuma é vitrine.

| Rota | Use cases | Persistência Fase 3 |
|------|-----------|---------------------|
| `/dashboard/flows` | `GetAll` / `Save` / `Delete` Flow; editor de passos (`action` pode definir setor) | `IFlowRepository` + departamentos |
| `/dashboard/messages` | histórico geral (sem thread) | mensagens |
| `/dashboard/conversations` | inbox: lista + chat (`?contact=`); Assumir/Transferir/Setor/Finalizar no topo do chat | conversa + agentes + departamentos + usuário |
| `/dashboard/whatsapp` | QR + status da conexão; atalho para Conversas | BFF `/api/chat-whatsapp/qr` e `/status` |
| `/dashboard/departments` | catálogo setor | `IDepartmentRepository` |
| `/dashboard/internal-chat` | redireciona para Conversas | — |
| `/dashboard/chatbots` | catálogo | `IChatbotRepository` |
| `/dashboard/agents` | catálogo | `IAgentRepository` |
| `/dashboard/contacts` | catálogo | `IContactRepository` |
| `/dashboard/numbers` | catálogo + sessão ao vivo (`SyncLiveWhatsAppNumberUseCase`) | `IWhatsAppNumberRepository` + `/api/chat-whatsapp/status` |
| `/dashboard/tags` | catálogo | `ITagRepository` |
| `/dashboard/schedules` | catálogo | `IScheduledMessageRepository` |
| `/dashboard/reports` | métricas + lista/gerar | mensagens/conversas + `IReportRepository` |

Catálogo = `list` / `save` / `delete` via `CatalogUseCase` (subclasses no locator). Páginas **não** importam `infra/mocks`.

**Fluxos:** o formulário edita os passos em linguagem de atendimento (Mensagem, Pergunta, Condição, Definir setor). O `id` do passo e o `nextStepId` **não** são digitados: o próximo passo (e os ramos “se sim / se não” da condição) são escolhidos na lista dos outros passos. Novo passo liga o anterior, se ele ainda não tiver destino. Na **Condição**, as opções da pergunta que alimenta o passo aparecem como botões; clicar grava o texto e `equals`. Na **Pergunta**, cada opção tem um destino (setor, mensagem ou encerrar; setor homônimo é o padrão) e “Criar caminhos das opções” gera a cadeia + os passos de destino. Não duplica opção que já tem condição. Um **mapa** compacto lista Depois / Se sim / Se não. `action` + setor = `setDepartment`.

## Relatórios

- KPIs: `GetDashboardMetricsUseCase` calcula a partir de mensagens e conversas mock (totais reais da sessão). Sem percentuais inventados; tendência omitida até haver histórico.
- “Gerar relatório” grava um `Report` com snapshot do período atual.
- “Baixar” no cliente gera um JSON (`blob`); sem S3.

## Transferência

`TransferConversationUseCase`: define `assignedAgentId` / `assignedAgentName` e `status: transferred`. A conversa **não some**: vai para a aba **Esperando**. Destino = agente escolhido no seletor (`AgentCatalogUseCase.list()`), filtrado pelo setor da conversa quando houver. Sem agente selecionado, não transfere. Se o agente destino tem setor, a conversa herda esse setor.

**Abrir** uma conversa permanece em `/dashboard/conversations?contact=<telefone>` (lista à esquerda, chat à direita). Zera não lidas. `/dashboard/messages?contact=` redireciona para essa inbox. Ações (Assumir, Transferir, Setor, Finalizar) ficam no **topo do chat**, não na lista.

**Minhas conversas:** toogle padrão ligado. Entrada lista todas sem dono. Esperando e Finalizados listam só as do operador (`assignmentFromOperator`). **Ver o time** desliga o filtro. Sem sessão, mostra todas.

**Setor:** seletor **na thread** (`SetConversationDepartmentUseCase`). A lista mostra o nome/cor do setor. Incoming WhatsApp entra sem setor. Filtro da lista: Todos / Sem setor / cada departamento. Padrão = setor do agente do operador. Com um setor escolhido, Entrada ainda mostra conversas sem setor.

A lista de Conversas **atualiza a cada 8s** (`DASHBOARD_POLL_MS`). O spinner “Carregando...” só na primeira carga. Contagens das abas vêm dos dados novos. Se o total de não lidas ou uma conversa nova aparecer no poll, toca um aviso sonoro curto (Web Audio; falha de autoplay é ignorada).

Inbox: lista compacta (nome, prévia da última mensagem, setor, não lidas). Chat: cabeçalho com **nome do contato** + telefone; bolhas incoming em `muted`, outgoing em `accent`; horário no estilo da lista (hoje = hora; outro dia = data). Compositor: placeholder “Mensagem”. No mobile, com conversa aberta, a lista some e o chat oferece voltar.

**Notas da equipe:** na thread (`TeamNotes`), com o usuário logado (`GetCurrentUserUseCase`). Não misturam com o WhatsApp do cliente. Sem atendente logado, só leitura.

**Conexão WhatsApp:** o header do painel mostra Conectado / Desconectado (poll em `/api/chat-whatsapp/status`). Em Conversas, se estiver desconectado, um aviso com atalho para `/dashboard/whatsapp`. A tela WhatsApp é só conexão (QR + status + ir para Conversas); **não** tem segunda lista de mensagens. Mídia reproduz na inbox e em `/dashboard/messages`.

**Números:** `/dashboard/numbers` lista o catálogo `whatsapp_numbers` **e** a sessão ao vivo (`connected`, `info.wid`, `info.pushname`). Conectar pelo QR da Evolution **aparece** na lista mesmo com o catálogo vazio. Na primeira conexão com `wid`, `SyncLiveWhatsAppNumberUseCase` grava o número no catálogo (id `live-{dígitos}`); polls seguintes não regravam se nome/número/status/provedor estão iguais. Falha no status **não** apaga o cadastro. Sem sessão e sem catálogo: CTA para `/dashboard/whatsapp`. Número vindo da sessão (`live-*`) não se remove pelo catálogo — o atalho vai para a tela WhatsApp.

Com `?contact=` na inbox, o chat mostra thread (bolhas in/out, mídia) e compositor: texto e **anexo**. Enviar chama `POST /api/messages/send` e pausa o bot. Ações da conversa:

- **Assumir** — botão em destaque; se já for o atendente, mostra “Com você” (desabilitado); pausa o chatbot; copia o setor do agente se a conversa ainda não tiver.
- **Transferir** — menu com agentes do mesmo setor (ou todos, se a conversa não tiver setor / não houver agente nesse setor); clicar no nome transfere.
- **Setor** — selo com a cor do departamento; abre menu para trocar (vazio = sem setor).
- **Finalizar** — pede confirmação (“Confirmar” / “Cancelar”) e grava `status: closed`.

Enquanto o fluxo estiver pausado, a tela indica e oferece **Retomar chatbot**. Sem `?contact=`, o painel direito pede para selecionar uma conversa.

**Mídia** em Conversas e em `/dashboard/messages`: `image` → `<img>`, `audio` → player, `video` → player, `document` → download. Fonte: `/api/messages/{id}/media` (cookie da sessão). Sem mídia: mostra `content` (ex.: “Áudio recebido”). Envio pelo painel usa o mesmo GET após gravar o arquivo no Storage.

**Contatos**: `ContactCatalogUseCase.list()` preenche o catálogo a partir das mensagens já persistidas (telefone + nome quando houver).

## Regras de UI

- Componentes em `ui/components`; páginas em `app/`
- `'use client'` quando há estado/hooks
- Sem Axios de provedor WhatsApp nas páginas
- Tema via `ThemeContext`; não quebrar `Providers`
- Novo item de menu: `sidebarGroups` em `ui/lib/sidebar-nav.ts` **e** esta spec
