# 01 — Arquitetura

## Stack

| Área | Tecnologia |
|------|------------|
| App | Next.js 15 (App Router), React 18, TypeScript strict |
| UI | Tailwind + componentes em `ui/` (estilo shadcn/Radix). Editor de fluxos: quadro `@xyflow/react` |
| HTTP | Route Handlers em `app/api/**` |
| Alias | `@/*` → raiz do projeto (`tsconfig.json`) |
| Composição | `infra/adapters/ServiceLocator.ts` + `createMockRepositoryBag.ts` |

Persistência alvo: **Supabase** (Postgres + Auth + Storage). Spec: `08-supabase.md`.  
**Não** Firestore, Firebase Auth, D1 nem Cloudflare como Auth. **Não** R2 nem Cloudflare Storage nesta fase. Não introduzir outro banco sem atualizar esta spec e a `08`.

Validação de body HTTP: **Zod** (já em `package.json`). Sem porta nova em `core`.

## Implantação (uma empresa por stack)

Não é multi-tenant. Cada empresa = 1 Next.js + 1 projeto Supabase + 1 instância de provedor WhatsApp na infra dela. Sem `company_id`. Isolamento entre empresas é por cópia da stack (`00-vision.md`, `08-supabase.md`).

## Camadas

```
app/          → rotas, páginas, Route Handlers (entrada HTTP/UI)
ui/           → componentes e tema (sem regras de negócio)
core/         → entidades, portas, use cases, engine puro (fluxos)
infra/        → mocks (fallback sem env / testes), supabase, ServiceLocator, adaptadores WhatsApp
infra/http/   → borda HTTP: request id, log sanitizado, schemas Zod (sem regra de domínio)
```

`core/engine/` contém funções puras (sem repositório, sem WhatsApp). I/O fica nos use cases.

### Borda HTTP (`infra/http`) — Fase 5

Helpers da borda, usados pelos Route Handlers. **Não** são portas de `core`.

| Peça | Contrato |
|------|----------|
| Request id | Todo response de `/api/**` leva `x-request-id`: valor incoming se `<= 128` chars; senão UUID gerado |
| Log sanitizado | Erros de servidor, só na borda HTTP (`logApiError`): `[requestId] mensagem: detalhe`. Sem token, apikey, `service_role`, JWT, `Authorization`, senha, cookie, body de mídia/base64, nem `error.response.data` completo. Sem stack no JSON. Webhooks não logam payload completo nem QR. Painel **não** usa `console.*` para falhas (a tela mostra a mensagem). `core`/provedores não logam status de mensagem, QR nem objeto de erro cru. Falha esperada (cache de mídia, presence, fluxo inativo) **não** loga |
| Schemas Zod | POST/PATCH com JSON em `app/api/**` validam o body na borda. Inválido → `400 { error: string }`. Sem vazar stack. GET sem body não usa Zod |

Detalhe das rotas: `05-api.md`.

### Regras de dependência

- `core` **não** importa `app`, `ui` nem implementações concretas de `infra`.
- Use cases dependem só de **interfaces** (`IFlowRepository`, `IQuickReplyRepository`, `IWhatsAppService`, etc.). Construtor **sem** default de `serviceLocator`.
- Páginas e APIs chamam **use cases**, não repositórios concretos. No client, a fábrica `infra/adapters/clientUseCases.ts` injeta o `ServiceLocator`. No servidor, `serverLocator` injeta o bag (service_role) e o `SupabaseServerAuthRepository`.
- Troca mock → real: só `ServiceLocator` / `serverLocator`.

## Composition root

- **Client (painel):** `infra/adapters/ServiceLocator.ts` escolhe mock vs Supabase browser; `clientUseCases` monta os use cases.
- **Servidor (API/webhooks):** `infra/adapters/serverLocator.ts` — bag service_role + `SupabaseServerAuthRepository` (cookie para sessão, service_role para Auth admin). Rotas `/api/auth/*` e `/api/operators*` chamam `LoginUseCase`, `LogoutUseCase`, `GetCurrentUserUseCase`, `ListOperatorsUseCase`, `CreateOperatorUseCase`, `SetOperatorRoleUseCase`, `SetOperatorPasswordUseCase`, `DeleteOperatorUseCase`.

Validação de fluxo do editor (`flowHealthIssues`) vive em `core/engine/`. `IWhatsAppService.downloadMedia?` evita `instanceof` na rota de mídia.

## Ambientes

| Env | Dados | Auth | WhatsApp |
|-----|--------|------|----------|
| dev | Supabase se env preenchido; senão mocks | Supabase Auth se env; senão mock | provedor via `.env.local` |
| test | fakes em memória | fake de `IAuthRepository` | sem I/O real |
| prod | Supabase do **projeto desta empresa** | Supabase Auth + RLS (sem `company_id`) | provedor/instância desta empresa |

Não simular dados em prod. Mocks só em `infra/mocks` e testes.

`instrumentation.ts` sobe o cron de agendamentos no runtime Node (não Edge, não `next build`, não Vercel).

## Tamanho de código

Arquivo ≤ 300 linhas; funções curtas e com uma responsabilidade. Dividir ao ultrapassar.
