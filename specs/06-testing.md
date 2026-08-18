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

- `core/engine/planFlowTurn.test.ts` — primeira sessão, `nextStepId`, `condition` true/false
- `core/usecases/ProcessIncomingFlowUseCase.test.ts` — envio via fake + persistência de sessão
- `core/usecases/CatalogUseCase.test.ts` — list/save/delete
- `core/usecases/TransferConversationUseCase.test.ts` — status transferred
- `core/usecases/LoginUseCase.test.ts` — porta de auth (senha obrigatória)
- `core/usecases/UpsertConversationFromMessageUseCase.test.ts` — cria conversa; ensure não infla não lidas
- `core/usecases/UpsertContactFromIncomingUseCase.test.ts` — nome do WhatsApp no catálogo de contatos
- `core/entities/conversationTabs.test.ts` — transferida aparece em Esperando
- `infra/whatsapp/mapEvolutionIncoming.test.ts` — pushName; MESSAGES_UPSERT; ignora grupo/fromMe; tipo imagem
- `infra/whatsapp/evolutionMedia.test.ts` — parse base64; hydrate grava no storage fake

## Próximos

1. CRUD de `SaveFlowUseCase` / `DeleteFlowUseCase`
2. `SendWhatsAppMessageUseCase` — persiste outgoing e não chama Meta de verdade
3. `HandleIncomingWhatsAppMessageUseCase` — persiste incoming

## Convenções

- Arquivos `*.test.ts` / `*.test.tsx` ao lado do sujeito ou em `tests/`
- Sem dados de prod; fakes em memória
- Nomes em português ou inglês, consistentes com o arquivo testado
- Após escrever testes, **listar os comandos** para o usuário rodar; não rodá-los
