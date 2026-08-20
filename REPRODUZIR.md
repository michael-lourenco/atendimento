# Como reproduzir o chatbot-atimo em outro computador

Guia para subir **uma cópia isolada** do sistema (uma empresa = um app + um Supabase + um WhatsApp). Contas novas, zero dados da instalação anterior.

---

## Resposta direta: o número precisa ser WhatsApp Business?

**Não.** No caminho padrão deste projeto (**Evolution API**), um **WhatsApp comum (pessoal)** já funciona. O app **WhatsApp Business** (o verde da Meta no celular) também funciona.

Isso vale porque a Evolution liga o número **como o WhatsApp Web**: você escaneia um QR no painel e a sessão fica no computador. Não é a API oficial da Meta.

| Caminho | Tipo de número | O que precisa |
|---------|----------------|---------------|
| **Evolution (recomendado neste repo)** | Pessoal **ou** Business no celular | Celular com WhatsApp instalado, internet, QR |
| **Meta Cloud API** (`WHATSAPP_PROVIDER=meta`) | Número **aprovado** na WhatsApp Business Platform | Conta Meta Business, app no Meta for Developers, número verificado na Cloud API (não é o WhatsApp Web) |
| **Twilio** | Número Twilio habilitado para WhatsApp | Conta Twilio + sandbox ou número aprovado |

**Resumo:** para copiar este projeto em outro PC, use Evolution e um chip normal. WhatsApp Business Cloud API só entra se você escolher o provedor `meta`.

Cuidados com Evolution (API não oficial): o celular precisa permanecer online de vez em quando; não use o mesmo número em dezenas de WhatsApp Web ao mesmo tempo; volume agressivo pode levar a bloqueio pela Meta. Para operação oficial em escala, o caminho é Meta Cloud API.

---

## 1. O que você precisa ter (máquina)

Um computador capaz de rodar Docker + Node. O desenvolvimento atual usa **Windows + WSL2**, mas **macOS** e **Linux** também servem.

- **Windows 10/11** (ou macOS / Linux)
- **WSL2** (só no Windows) — Ubuntu 22.04 ou 24.04
- **Docker Desktop** — com integração WSL ligada (Settings → Resources → WSL Integration)
- **Git**
- **Node.js 20 LTS** (Next.js 15 pede no mínimo 18.18; use 20)
- **npm** (vem com o Node)
- Navegador (Chrome ou Edge)
- **8 GB de RAM** no mínimo (12 GB melhor): o Docker sobe Evolution + Postgres + Redis, e o Next.js roda à parte
- Portas livres: **3000** (painel) e **8080** (Evolution)

Não precisa instalar Postgres do produto na máquina: o banco da aplicação é o **Supabase na nuvem**. O Postgres do Docker é **só da Evolution**.

---

## 2. Contas e e-mail

Você vai criar contas em serviços. Use **um e-mail** (Gmail funciona bem) para todas.

| Serviço | Para quê | Plano mínimo |
|---------|----------|--------------|
| **E-mail** (Gmail ou similar) | Criar as contas e receber confirmação / “esqueci a senha” | Grátis |
| **GitHub** | Guardar o código e clonar no outro PC | Grátis |
| **Supabase** | Banco Postgres, login dos operadores, Storage de mídia, Realtime da inbox | Plano Free |

Opcional, só se **não** for usar Evolution:

- **Meta for Developers** + WhatsApp Business Platform → provedor `meta`
- **Twilio** → provedor `twilio`

Não precisa de AWS, Firebase, Cloudflare nem segundo banco.

---

## 3. Criar as contas (ordem)

### 3.1 E-mail

1. Tenha um Gmail (ou outro) acessível neste computador.
2. Anote o endereço. Ele será o **primeiro admin** do painel.

### 3.2 GitHub

1. Acesse [https://github.com](https://github.com) e crie a conta com esse e-mail.
2. Confirme o e-mail.
3. Crie um repositório **privado** (ex.: `chatbot-atimo`).
4. No computador **origem**, na pasta do projeto:

```bash
git init
git add .
git commit -m "Cópia inicial do chatbot-atimo"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/chatbot-atimo.git
git push -u origin main
```

Não commite `.env` nem `.env.local` (já devem estar no `.gitignore`).

### 3.3 Supabase

1. Acesse [https://supabase.com](https://supabase.com) e entre com GitHub ou o mesmo e-mail.
2. **New project**
   - Nome: qualquer (ex. `chatbot-atimo`)
   - Senha do banco: gere uma forte e **guarde** (não é a senha do painel)
   - Região: a mais perto (ex. South America / São Paulo, se existir)
3. Espere o projeto ficar **Active**.
4. Anote (Project Settings → API):
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY` (secreta; só servidor; nunca no browser)

Um projeto Supabase = uma empresa. Não reutilize o projeto antigo se a ideia é contas e dados novos.

---

## 4. Clonar e instalar no computador novo

No WSL (ou no terminal do Mac/Linux):

```bash
sudo apt update
sudo apt install -y git
# Node 20 (exemplo com nvm):
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
# feche e abra o terminal, depois:
nvm install 20
nvm use 20

git clone https://github.com/SEU_USUARIO/chatbot-atimo.git
cd chatbot-atimo
npm install
```

Confirme Docker:

```bash
docker --version
docker compose version
```

---

## 5. Banco: rodar as migrations no Supabase novo

No dashboard do projeto: **SQL Editor**.

Rode **um arquivo por vez**, nesta ordem, copiando o conteúdo de `infra/supabase/migrations/`:

1. `001_init.sql` — tabelas, RLS, bucket `media`
2. `002_flow_session_paused.sql`
3. `003_sales_intake_seed.sql` — setores, etiquetas, fluxo de triagem
4. `004_operator_agent.sql` — primeiro usuário vira admin
5. `005_whatsapp_lines.sql`
6. `006_conversation_thread.sql`
7. `007_quick_replies.sql`
8. `008_miss_returns_to_menu.sql`
9. `009_welcome_michael.sql`
10. `010_schedule_conversation.sql`
11. `011_conversation_last_message.sql`
12. `012_unique_agent_email.sql`
13. `013_contact_avatar.sql`
14. `014_flow_option_number_hint.sql`
15. `015_flow_delete_cascade.sql`
16. `016_split_intake_flows.sql`
17. `017_flow_editor_session.sql`
18. `018_intake_sales_copy.sql`
19. `019_inbox_hours_queue.sql` — expediente, fila, Realtime
20. `020_message_reactions.sql`

Se pular alguma, o painel quebra (erros `PGRST204` = coluna que a API espera e o banco não tem).

Não edite schema só pelo Table Editor. O código espera exatamente essas migrations.

### 5.1 Auth (login do painel)

Em **Authentication**:

1. **Providers → Email** ligado.
2. Para o primeiro usuário local: em **Users → Add user**
   - e-mail = o Gmail
   - senha = a que você vai usar em `/login`
   - marque **Auto Confirm User** (senão o login falha até confirmar o e-mail)
3. Esse primeiro perfil vira **admin** (trigger da migration `004`).
4. **URL Configuration**
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/**` e `http://localhost:3000/login`

“Esqueci a senha” só funciona se o projeto Supabase puder enviar e-mail (no Free às vezes é limitado; o Add user com senha já basta para o primeiro acesso).

Não existe tela de cadastro público. Operadores extras nascem em **Agentes** no painel, depois que o admin entrou.

---

## 6. Arquivo de ambiente

Na raiz do repo:

```bash
cp .env.example .env.local
```

Preencha (exemplo Evolution local):

```
WHATSAPP_PROVIDER=evolution
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=local-evolution-key
EVOLUTION_INSTANCE_NAME=default
NEXT_PUBLIC_APP_URL=http://localhost:3000

NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
CRON_SECRET=uma-string-longa-aleatoria
```

- `SUPABASE_SERVICE_ROLE_KEY` **nunca** começa com `NEXT_PUBLIC_`.
- Sem as três variáveis Supabase, o app cai em **mocks** (dados fake, não é o sistema real).
- `CRON_SECRET` protege o disparo de agendamentos (`/api/schedules/dispatch`). Qualquer string forte serve em local.

Não sobrescreva um `.env` que já exista sem conferir.

---

## 7. Subir a Evolution (WhatsApp) e o painel

Dois processos: Docker (Evolution) e Node (Next.js).

```bash
# na raiz do repo
docker compose up -d
npm run dev
```

Espere:

- Evolution: [http://localhost:8080](http://localhost:8080) (manager da API)
- Painel: [http://localhost:3000](http://localhost:3000) → redireciona para `/login`

Login com o e-mail/senha do usuário criado no Supabase. Destino: `/dashboard/conversations`.

---

## 8. Ligar o WhatsApp (QR)

1. No painel (admin): **Números** → crie uma linha (ex. nome `Comercial`). O sistema gera o `instanceName`.
2. Abra **WhatsApp** no menu (ou o selo no header) → `/dashboard/whatsapp`.
3. Selecione a linha. Aparece o **QR**.
4. No celular: WhatsApp (ou WhatsApp Business) → **Aparelhos conectados** → **Conectar um aparelho** → aponte a câmera.
5. O selo do header deve ir para **Conectado**.

A instância na Evolution também pode ser criada pelo painel (`POST` de instância aponta o webhook para `http://localhost:3000/api/webhook/evolution`). Em Docker, a Evolution chama o Next no host via `host.docker.internal:3000`.

Teste: de **outro** número, mande um “oi” para o chip conectado. Deve nascer conversa na inbox e o fluxo `inicio` deve responder.

---

## 9. Checklist: “está rodando”

- [ ] `npm run dev` abre `/login`
- [ ] Login com o usuário criado no Supabase
- [ ] Fluxos `inicio`, `sistema`, `demo`, `cliente`, `comercial` aparecem em **Fluxos**
- [ ] Docker: containers `chatbot-atimo-evolution`, `...-pg`, `...-redis` healthy
- [ ] QR lido, selo Conectado
- [ ] Mensagem de teste aparece em **Conversas**
- [ ] Envio pelo painel chega no celular

---

## 10. Stack (o que cada peça é)

| Camada | Tecnologia | Onde roda |
|--------|------------|-----------|
| Painel e API | Next.js 15, React 18, TypeScript, Tailwind | `npm run dev` na máquina |
| Domínio | use cases em `core/` | mesmo processo Node |
| WhatsApp (padrão) | Evolution API | Docker na porta 8080 |
| Sessão WhatsApp da Evolution | Postgres 15 + Redis 7 | Docker (não é o banco do produto) |
| Banco do produto | Supabase Postgres | nuvem |
| Login | Supabase Auth | nuvem |
| Mídia (foto, áudio, etc.) | bucket `media` no Supabase Storage | nuvem |
| Inbox ao vivo | Supabase Realtime | nuvem |

Provedores WhatsApp no código (`WHATSAPP_PROVIDER`): `evolution` | `meta` | `twilio`.

---

## 11. Se for Meta ou Twilio em vez de Evolution

Pule o `docker compose` da Evolution. Preencha as env da spec `03-whatsapp.md`.

**Meta:** número na Cloud API, token, `WHATSAPP_PHONE_NUMBER_ID`, webhook público (`GET/POST /api/webhook/whatsapp`). Local precisa de túnel (ex. ngrok) porque a Meta não alcança `localhost`. Número **pessoal no app** não entra neste modo.

**Twilio:** SID, token, número WhatsApp da Twilio, webhook. O número do seu chip pessoal não é o da Twilio.

Para reproduzir **este** repositório do jeito que está no `.env.example`, fique em Evolution.

---

## 12. Produção (outro passo, não obrigatório para “rodar no PC”)

Local já é o sistema completo. Para internet:

- Host do Next (Vercel, VPS, etc.) com as mesmas env
- `NEXT_PUBLIC_APP_URL` = URL pública HTTPS
- Webhook Evolution apontando para essa URL (`/api/webhook/evolution`)
- Site URL do Auth = a URL pública
- Cron (Vercel Cron ou crontab) chamando `/api/schedules/dispatch` com `Authorization: Bearer CRON_SECRET`

Cada empresa nova = **novo** projeto Supabase + **nova** cópia do app + **nova** sessão WhatsApp. Não é multi-tenant.

---

## 13. Problemas comuns

| Sintoma | Causa típica |
|---------|----------------|
| Login não entra / dica de env na tela | Faltou `NEXT_PUBLIC_SUPABASE_URL` ou anon key no `.env.local`; reinicie o `npm run dev` |
| `PGRST204` / coluna não existe | Migration pulada (em especial 010, 011, 017, 019, 020) |
| Painel com dados “de mentira” | Env Supabase vazia → mocks |
| QR não aparece | Docker Evolution fora; `EVOLUTION_API_KEY` diferente da do compose; linha sem `instanceName` |
| Mensagem no celular, nada no painel | Webhook: Evolution precisa alcançar `host.docker.internal:3000`; Next tem que estar no ar |
| Usuário criado mas login recusa | E-mail não confirmado no Auth; ou agente `offline` |
| “Esqueci a senha” não chega | SMTP do projeto Free / Site URL errada |

---

## Ordem mental (uma página)

1. E-mail → GitHub → repositório com o código  
2. Projeto **novo** no Supabase → copiar URL + anon + service_role  
3. SQL Editor: migrations **001 → 020**  
4. Auth: criar o primeiro usuário (auto confirm)  
5. Clonar, `npm install`, `.env.local`  
6. `docker compose up -d` + `npm run dev`  
7. Login → criar linha → QR com WhatsApp **comum ou Business**  
8. Mandar mensagem de outro chip e ver a inbox
