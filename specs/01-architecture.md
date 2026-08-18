# 01 — Arquitetura

## Stack

| Área | Tecnologia |
|------|------------|
| App | Next.js 15 (App Router), React 18, TypeScript strict |
| UI | Tailwind + componentes em `ui/` (estilo shadcn/Radix) |
| HTTP | Route Handlers em `app/api/**` |
| Alias | `@/*` → raiz do projeto (`tsconfig.json`) |
| Composição | `infra/adapters/ServiceLocator.ts` + `createMockRepositoryBag.ts` |

Persistência alvo: **Supabase** (Postgres + Auth + Storage). Spec: `08-supabase.md`.  
**Não** Firestore, Firebase Auth, D1 nem Cloudflare como Auth. R2 só como storage de mídia futuro, se necessário. Não introduzir outro banco sem atualizar esta spec e a `08`.

## Camadas

```
app/          → rotas, páginas, Route Handlers (entrada HTTP/UI)
ui/           → componentes e tema (sem regras de negócio)
core/         → entidades, portas, use cases, engine puro (fluxos)
infra/        → mocks (fallback sem env / testes), supabase, ServiceLocator, adaptadores WhatsApp
```

`core/engine/` contém funções puras (sem repositório, sem WhatsApp). I/O fica nos use cases.

### Regras de dependência

- `core` **não** importa `app`, `ui` nem implementações concretas de `infra` (exceto que use cases hoje usam `serviceLocator` — ver débito abaixo).
- Use cases dependem de **interfaces** (`IFlowRepository`, `IWhatsAppService`, etc.).
- Páginas e APIs chamam **use cases**, não repositórios concretos.
- Troca mock → real: só `ServiceLocator` (ou composition root futuro).

## Débito conhecido

Use cases importam `serviceLocator` de `infra`. Aceitável na Fase 1. Ao persistir de verdade, injetar dependências no construtor e restringir o locator à borda (`app/`).

## Ambientes

| Env | Dados | Auth | WhatsApp |
|-----|--------|------|----------|
| dev | Supabase se env preenchido; senão mocks | Supabase Auth se env; senão mock | provedor via `.env.local` |
| test | fakes em memória | fake de `IAuthRepository` | sem I/O real |
| prod | Supabase | Supabase Auth + RLS | provedor no host |

Não simular dados em prod. Mocks só em `infra/mocks` e testes.

## Tamanho de código

Arquivo ≤ 300 linhas; funções curtas e com uma responsabilidade. Dividir ao ultrapassar.
