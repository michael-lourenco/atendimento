# 04 — Dashboard e UI

## Shell

- Login: `/login` (Supabase Auth na Fase 4; sem lista de usuários de teste). Se faltar env, a dica cita só `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` — **nunca** `SUPABASE_SERVICE_ROLE_KEY`. Link **Esqueci a senha** dispara o e-mail de redefinição do Auth (cliente anon). Sem rota nova; sem citar `service_role`
- Home `/` e login autenticado → `/dashboard/conversations`; senão → `/login`
- Layout dashboard: sidebar **expansível** (nomes visíveis; pode recolher para ícones) + header com marca, **tela atual**, selo de conexão WhatsApp + tema claro/escuro. **Tema claro** próximo do WhatsApp Web: verde `#00A884`, fundo `#F0F2F5`, área do chat `#EFEAE2`, bolha outgoing `#D9FDD3` (tokens em `app/globals.css`). O escuro permanece o tema atual.
- **Selo WhatsApp:** uma linha (ou nenhuma) → Conectado / Desconectado. Várias linhas cadastradas → **“N de M linhas”** (N conectadas, M no catálogo). Vermelho se alguma ou todas estiverem caídas; verde só se todas as cadastradas estiverem abertas. Clique → `/dashboard/whatsapp`. No mobile o selo **permanece visível** (pode ser só o número N/M ou o ícone). Fonte: `GET /api/chat-whatsapp/status` **sem** `instance` (`instances[]`) a cada 8s **e** catálogo de Números em **cache de 60s** (não `GET whatsapp_numbers` a cada poll). Chip e banner compartilham o mesmo poll (`WhatsAppStatusProvider`). Linguagem de atendimento: “linha”, não jargão do provedor
- Itens do menu: `ui/lib/sidebar-nav.ts` (`sidebarGroups` / `sidebarGroupsForRole`), renderizados em `ui/components/sidebar.tsx`
- Grupos: **Atendimento** (Conversas, Contatos, **Respostas rápidas**, **Agendamentos**; admin também vê WhatsApp e Relatórios) e **Configuração** (só admin: Fluxos, Agentes, Setores, Números, Etiquetas)
- `ui/lib/sidebar-nav.ts`: atendente (`role: user`) vê Conversas, Contatos, Respostas rápidas (`/dashboard/quick-replies`) **e** Agendamentos (`/dashboard/schedules`). `isAdminPath` **não** inclui essas duas rotas
- Atendente (`role: user`) que abre URL de admin é redirecionado para Conversas
- Header mostra selo Admin quando `role === admin`
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
| `/dashboard/conversations` | inbox: lista + chat (`?conversation=`); Assumir/Transferir/Setor/Finalizar no topo do chat | conversa + agentes + departamentos + usuário |
| `/dashboard/whatsapp` | QR + status **por linha** (`?instance=`); atalho para Conversas | BFF `/api/chat-whatsapp/qr` e `/status` |
| `/dashboard/departments` | catálogo setor | `IDepartmentRepository` |
| `/dashboard/internal-chat` | redireciona para Conversas | — |
| `/dashboard/chatbots` | catálogo | `IChatbotRepository` |
| `/dashboard/agents` | operadores + agentes (só admin) | `CreateOperatorUseCase` + `IAgentRepository` |
| `/dashboard/contacts` | catálogo | `IContactRepository` |
| `/dashboard/numbers` | catálogo de **linhas** (nome visível; `instanceName` gerado) + status por linha | `IWhatsAppNumberRepository` + `/api/chat-whatsapp/status` |
| `/dashboard/tags` | catálogo | `ITagRepository` |
| `/dashboard/quick-replies` | catálogo **funcional** da empresa (atendente e admin; **não** `adminOnly`) | `QuickReplyCatalogUseCase` / `IQuickReplyRepository` |
| `/dashboard/schedules` | catálogo **funcional** da empresa (atendente e admin; **não** `adminOnly`) + picker + disparo na hora | `IScheduledMessageRepository` + `ContactCatalogUseCase` + cron / `POST /api/schedules/dispatch` |
| `/dashboard/reports` | métricas + lista/gerar | mensagens/conversas + `IReportRepository` |

Catálogo = `list` / `save` / `delete` via `CatalogUseCase` (subclasses no locator). Páginas **não** importam `infra/mocks`.

**Fluxos:** o formulário edita os passos em linguagem de atendimento (Mensagem, Pergunta, Condição, Definir setor). O `id` do passo e o `nextStepId` **não** são digitados: o próximo passo (e os ramos “se sim / se não” da condição) são escolhidos na lista dos outros passos. Novo passo liga o anterior, se ele ainda não tiver destino. Na **Condição**, as opções da pergunta que alimenta o passo aparecem como botões; clicar grava o texto e `equals`. Na **Pergunta**, cada opção tem um destino (setor, mensagem ou encerrar; setor homônimo é o padrão) e “Criar caminhos das opções” gera a cadeia + os passos de destino. Não duplica opção que já tem condição. Um **mapa** compacto lista Depois / Se sim / Se não. `action` + setor = `setDepartment`. Prévia **Como o cliente vê**: bolhas com o que o motor envia no primeiro “oi” (`previewFlowOpening`). Na lista, o fluxo que `resolveActiveFlow` escolher ganha o selo WhatsApp. Empty state com ação de criar.

**Caso de sucesso (seed):** o fluxo `inicio` / Atendimento Inicial tria Comercial, Demonstração e Cliente (`setDepartment` 1/2/3) até o humano assumir. A saudação fala em nome do **Michael** (não Atimo). Agentes: Michael (Comercial) e Atendente (Demonstração). Fonte: `core/entities/atendimentoInicialFlow.ts` + migrations `003_sales_intake_seed.sql` e `009_welcome_michael.sql`. Só um fluxo ativo no WhatsApp.

## Relatórios

- KPIs: `GetDashboardMetricsUseCase` calcula a partir de mensagens e conversas mock (totais reais da sessão). Sem percentuais inventados; tendência omitida até haver histórico.
- “Gerar relatório” grava um `Report` com snapshot do período atual.
- “Baixar” no cliente gera um **CSV** (`blob`) com colunas em português (título, tipo, período, gerado em). Substitui o JSON como formato do botão. Sem S3.

## Transferência

`TransferConversationUseCase`: define `assignedAgentId` / `assignedAgentName` e `status: transferred`. A conversa **não some**: vai para a aba **Esperando**. Destino = agente escolhido no seletor (`AgentCatalogUseCase.list()`), filtrado pelo setor da conversa quando houver. Sem agente selecionado, não transfere. Se o agente destino tem setor, a conversa herda esse setor.

**Abrir** uma conversa: `/dashboard/conversations?conversation=<id>` (lista à esquerda, chat à direita). `?contact=<telefone>` antigo ainda funciona: abre a thread **mais recente** daquele telefone. Zera não lidas; se isso falhar, o chat **ainda** carrega as mensagens. `/dashboard/messages?contact=` redireciona para essa inbox (mesma resolução de thread). Ações (Assumir, Transferir, Setor, Finalizar) ficam no **topo do chat**, não na lista. Pause/resume/Assumir usam o **id da conversa**, não só o telefone.

**Minhas conversas:** toogle padrão ligado. Entrada lista todas sem dono. Esperando e Finalizados listam só as do operador (`assignmentFromOperator`). **Ver o time** desliga o filtro. Sem sessão, mostra todas.

**Setor:** seletor **na thread** (`SetConversationDepartmentUseCase`). A lista mostra o nome/cor do setor. Incoming WhatsApp entra sem setor. Filtro da lista: Todos / Sem setor / cada departamento. Padrão = setor do agente do operador. Com um setor escolhido, Entrada ainda mostra conversas sem setor.

**Linha:** seletor **Todas as linhas** + cada número cadastrado (`name` da linha), **junto do filtro de setor**. Esconde conversas de outras linhas (`whatsappNumberId`). Padrão = todas. **Uma thread por contato + linha:** a mesma pessoa em Comercial e em Suporte aparece **duas vezes** na lista (ids diferentes, mesmo telefone), cada item com o **nome da linha**. Seleção da lista é pelo `id` da conversa.

A lista de Conversas **atualiza a cada 8s** (`DASHBOARD_POLL_MS`): só as conversas no poll; agentes, setores, linhas e operador entram na **primeira carga**. O chat aberto recarrega mensagens a cada 8s; o catálogo de linhas usa o cache de 60s. Primeira carga: **esqueleto** (linhas cinza), não o texto “Carregando...”. Polls seguintes não repetem o esqueleto. Contagens das abas vêm dos dados novos. Se o total de não lidas ou uma conversa nova aparecer no poll, toca um aviso sonoro curto (Web Audio; falha de autoplay é ignorada). **Não** usa Notification API do browser. Com não lidas, enquanto a tela de Conversas estiver aberta, `document.title` fica `(N) Conversas` (ou o título da tela com o prefixo `(N)`). Se a aba tem conversas mas o filtro (setor, **linha**, minhas, busca) esconde todas ou parte, um aviso com **Ver todas** mostra quantas ficaram de fora (o cálculo inclui o filtro de linha). Lista vazia de verdade: texto de primeiro uso (conectar WhatsApp) ou “nenhuma nesta aba”.

Inbox: lista compacta (nome, **prévia da última mensagem** no estilo WhatsApp, **nome da linha**, setor, não lidas). Texto: o `content` (outgoing com prefixo **Você:**). Se a prévia for **sua** (outgoing), os **tiques** daquela mensagem ficam **à esquerda** da prévia (mesmo `MessageStatusTicks` do chat: relógio / um cinza / dois cinza / dois azuis). Mídia sem legenda útil: **Foto** / **Áudio** / **Vídeo** / **Documento**. A prévia sai do snapshot `Conversation.lastMessage` (coluna `conversations.last_message`). Ack (`UpdateMessageStatusUseCase`) atualiza o `status` do snapshot quando o id é o da última mensagem. Sem snapshot e sem mensagem, “Sem mensagens”. Busca da lista: placeholder **“Nome ou telefone”**. Chat: cabeçalho com **nome do contato** + telefone + linha; fundo da thread `chat`; bolhas incoming `bubble-in` (branco no claro), outgoing `bubble-out` (verde-menta no claro); horário no estilo da lista (hoje = hora; outro dia = data). Mensagens da thread: **só as daquela linha** (`lineHintFromMessage` vs `instanceName`/número); não misturar Comercial e Suporte. Mensagem **enviada** mostra tiques estilo WhatsApp (relógio / um cinza / dois cinza / dois azuis). Outgoing com status `failed` oferece **Reenviar** (mesmo `POST /api/messages/send` com o texto e o `conversationId` da thread). Compositor: placeholder “Mensagem”; botão abre painel compacto de **emojis Unicode** (grupos: sorrisos, gestos, objetos, símbolos); clicar insere na posição do cursor. **Ao lado** de emoji/anexo, outro botão abre painel compacto das **respostas rápidas** cadastradas (`title` + prévia do `body`); clicar **insere o `body` na posição do cursor** (mesmo helper do emoji). Link **Gerenciar** no painel aponta para `/dashboard/quick-replies`. Envio continua texto Unicode via `POST /api/messages/send` — **sem rota HTTP nova**. Sem lib extra. Sem atalho de teclado nesta versão. Sem lib de sticker/GIF. **Enter** envia; **Shift+Enter** quebra linha. No mobile, com conversa aberta, a lista some e o chat oferece voltar; **Esc** volta para a lista.

**Atalhos (Conversas):** Enter envia; Shift+Enter nova linha; `/` foca a busca da lista se o foco **não** estiver em `input`/`textarea`; Esc no mobile com conversa aberta volta para a lista.

**Notas da equipe:** na thread (`TeamNotes`), com o usuário logado (`GetCurrentUserUseCase`). Não misturam com o WhatsApp do cliente. Sem atendente logado, só leitura.

**Conexão WhatsApp:** selo no header (ver Shell). Em Conversas, se **nenhuma** linha estiver aberta, um aviso com atalho para `/dashboard/whatsapp`. A tela WhatsApp é só conexão (QR + status **por linha** + ir para Conversas); **não** tem segunda lista de mensagens. Seletor e textos usam o **nome da linha**, não o identificador técnico. **Não** unificar com `/dashboard/numbers` (continuam duas telas). Mídia reproduz na inbox e em `/dashboard/messages`.

**Números (Linhas):** `/dashboard/numbers` lista o catálogo. Campo visível principal = **nome da linha** (ex. Comercial). `instanceName` é gerado automaticamente a partir do nome (`slugWhatsAppInstanceName`) se o admin não preencher; na tela de cadastro **não** é o campo principal (avançado/oculto ou só o valor gerado). Vários números da **mesma** empresa conectam em paralelo: cada um tem QR em `/dashboard/whatsapp?instance=` (ainda por linha). A sessão ao vivo daquela linha atualiza o cadastro (`SyncLiveWhatsAppNumberUseCase`). Sem sessão e sem catálogo: CTA para WhatsApp. Inbox mostra o nome da linha (`whatsappNumberId`).

Com `?conversation=` (ou `?contact=` legado) na inbox, o chat mostra a thread daquela conversa (bolhas in/out, mídia **só da linha**) e compositor: texto, **emoji**, **respostas rápidas** e **anexo**. Enviar chama `POST /api/messages/send` com `conversationId` opcional da thread aberta (escolhe a linha) e pausa o bot **dessa** sessão. Sem `conversationId`, o send resolve pela conversa do telefone (a mais recente se houver várias). Ações da conversa:

- **Assumir** — botão em destaque; se já for o atendente, mostra “Com você” (desabilitado); pausa o chatbot; copia o setor do agente se a conversa ainda não tiver.
- **Transferir** — menu com agentes do mesmo setor (ou todos, se a conversa não tiver setor / não houver agente nesse setor); clicar no nome transfere.
- **Setor** — selo com a cor do departamento; abre menu para trocar (vazio = sem setor).
- **Finalizar** — pede confirmação (“Confirmar” / “Cancelar”) e grava `status: closed`.
- **Agendar** — no chat: data/hora + texto. Contato e linha já são os da thread (`ScheduledMessage.conversationId` = `Conversation.id`; `contact` = telefone). Lista os agendamentos **dessa conversa** (e os do mesmo telefone sem `conversationId`). Mesmo catálogo e disparo que `/dashboard/schedules` (cron + `POST /api/schedules/dispatch`). Sem rota HTTP nova.

Enquanto o fluxo estiver pausado, a tela indica e oferece **Retomar chatbot** (sessão da thread aberta). Sem `?conversation=` e sem `?contact=` resolvido, o painel direito pede para selecionar uma conversa.

**Mídia** em Conversas e em `/dashboard/messages`: `image` → `<img>`, `audio` → player, `video` → player, `document` → download. Fonte: `/api/messages/{id}/media` (cookie da sessão). Sem mídia: mostra `content` (ex.: “Áudio recebido”). Envio pelo painel usa o mesmo GET após gravar o arquivo no Storage.

**Contatos**: `ContactCatalogUseCase.list()` preenche o catálogo a partir das mensagens já persistidas (telefone + nome quando houver). **Conversar:** se o telefone tem **uma** thread, abre `/dashboard/conversations?conversation=<id>`. Se tem **várias** (mesmo contato em mais de uma linha), o botão abre um menu com o **nome da linha**; cada item abre a thread daquela linha (`?conversation=`). Sem thread ainda, cai no `?contact=<telefone>` (inbox resolve a mais recente, se houver). `threadsForContactPhone` / `inboxHrefForContactThreads`.

**Agentes (admin):** cada login já é um agente (`id` = perfil). O admin cadastra atendente com e-mail, senha, papel e setor (`CreateOperatorUseCase`). **E-mail único:** não dá para cadastrar dois atendentes com o mesmo e-mail (maiúsculas/minúsculas irrelevantes); o formulário mostra “Este e-mail já está cadastrado”. Pode promover/rebaixar (`SetOperatorRoleUseCase`), menos o último admin. **Excluir:** agente sem login some do catálogo; agente com login some de Auth + perfil + catálogo (`DeleteOperatorUseCase`), menos o último admin (esse só **Desativar** / offline). Empty state com “Novo atendente”.

**Respostas rápidas:** `/dashboard/quick-replies` é **funcional**. Item no grupo **Atendimento**, **sem** `adminOnly`: atendente e admin veem. `isAdminPath` **não** inclui essa rota (atendente que abre a URL permanece nela). Página: lista `title` + prévia do `body`; criar/editar (`title` + texto/`body`); excluir com diálogo Confirmar/Cancelar; empty state com “Nova resposta”. Falha ao listar/salvar/excluir (ex. tabela ausente, `PGRST205`) aparece na página. Catálogo da empresa (`QuickReplyCatalogUseCase` / `IQuickReplyRepository`). Sem rota HTTP de catálogo: a página chama o use case no client (como Etiquetas). Precisa da migration `007_quick_replies.sql`.

**Agendamentos:** `/dashboard/schedules` é **funcional** no grupo **Atendimento**, **sem** `adminOnly`: atendente e admin veem. `isAdminPath` **não** inclui essa rota. O campo Contato **não** é texto livre. Busca no catálogo (nome ou telefone). Clicar escolhe o contato. Se o número com DDD (10 ou 11 dígitos) não existir, a lista oferece “Adicionar número”; nome opcional; grava no catálogo (`UpsertContactFromIncomingUseCase`) ao salvar. Telefone com 10–11 dígitos (sem 55) ganha prefixo `55`. A tabela mostra nome · telefone quando houver cadastro **e a linha** do envio (`scheduleOutgoingLineName`: com `conversationId`, a thread daquela linha; sem ele, a conversa mais recente do telefone — o mesmo critério do disparo). Agendar **na conversa** grava o mesmo `ScheduledMessage` com `conversationId` da thread (envio pela mesma linha).

Salvar um agendamento chama `POST /api/schedules/dispatch` na hora (no-op se a data ainda é futura). O vencido sai pelo **cron** (processo Next a cada 60s, ou `GET /api/schedules/dispatch` na Vercel), mesmo com o painel fechado. A tabela recarrega a cada `DASHBOARD_POLL_MS`: `pending` → `sent` / `failed`. WhatsApp precisa estar conectado; falha do provedor marca `failed`.

**Cores de estado** (não substituem a cor cadastrada do setor/etiqueta): Entrada = âmbar (precisa pegar); Esperando = azul; Finalizado / inativo / offline = cinza; Conectado / online / ativo = verde; WhatsApp caído = vermelho; chatbot pausado = âmbar. Passos do fluxo: mensagem azul, pergunta âmbar, condição violeta, definir setor verde. Mapa: Se sim verde, Se não âmbar. Classes em `ui/lib/status-tone.ts`. Sem arco-íris no menu: só um ponto no grupo Atendimento vs Configuração.

## Regras de UI

- Componentes em `ui/components`; páginas em `app/`
- `'use client'` quando há estado/hooks
- Sem Axios de provedor WhatsApp nas páginas
- Tema via `ThemeContext`; não quebrar `Providers`
- Novo item de menu: `sidebarGroups` em `ui/lib/sidebar-nav.ts` **e** esta spec
- Copy do painel em linguagem de atendimento (“linha”, “número”). Sem jargão de provedor na UI
- **Carga de listas:** primeira visita mostra **esqueleto** (`CatalogListSkeleton` / inbox `InboxSkeleton`), nunca o empty state. Só depois da resposta: lista ou “nenhum …”. Reload após salvar não volta o esqueleto. Poll (Conversas, Mensagens, Agendamentos) também não.
- **Confirmação ao salvar:** depois de gravar um catálogo (fluxo, etiqueta, resposta rápida, contato, setor, número, agente, chatbot, agendamento), a página mostra aviso **Salvo** (~3,5s) e o formulário some. Sem lib de toast.

## Fora de escopo (esta melhoria)

- Respostas rápidas **por atendente** ou **por setor** (o catálogo é da empresa)
- Templates da Cloud API
- Wizard de onboarding completo
- Presença online/offline persistida
- Unificar as rotas Números e WhatsApp (continuam duas telas)
- Notification API do browser
- Lib de sticker/GIF
- Multi-tenant / `company_id`
