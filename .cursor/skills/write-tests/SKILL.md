---
name: write-tests
description: Writes Jest/Testing Library tests for chatbot-atimo use cases and routes using port fakes. Never runs the suite. Use when adding tests, coverage, or QA for domain and API changes.
---

# Escrever testes (não rodar)

Leia `specs/06-testing.md`.

## Regras

- Fake das portas em memória. Sem Graph API, Twilio, Evolution, AWS.
- Preferir testes de `execute()` dos use cases.
- Se Jest ainda não estiver no `package.json`, entregue os arquivos e **pergunte** antes de adicionar dependências de test runner.
- **Proibido:** `npm test`, `yarn test`, `npx jest`, `npx playwright`, `next build` como verificação.

## Encerramento

Listar para o usuário, por exemplo:

```text
# quando o runner existir
npx jest core/usecases/SaveFlowUseCase.test.ts
```

Não execute o comando.
