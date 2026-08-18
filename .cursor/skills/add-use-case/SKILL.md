---
name: add-use-case
description: Adds a core use case with port, mock, and constructor injection/ServiceLocator for chatbot-atimo. Use when creating or changing use cases, entities, or repositories in core/.
---

# Novo use case

Leia `specs/02-domain.md` e `specs/01-architecture.md`.

## Ordem

1. Entidade em `core/entities` (se ainda não existir).
2. Porta em `core/repositories` ou `core/services`.
3. Mock em `infra/mocks` implementando a porta.
4. Classe `SomethingUseCase` em `core/usecases` com `execute(...)`.
5. Registrar no `ServiceLocator` só se for nova porta compartilhada.
6. UI ou Route Handler chama o use case, não o mock.

## Forma

```ts
export class SaveFlowUseCase {
  constructor(private flows: IFlowRepository = serviceLocator.getFlowRepository()) {}
  async execute(flow: Flow): Promise<void> {
    await this.flows.save(flow);
  }
}
```

Sem Axios, sem `fetch` a Graph API, sem import de `app/` ou `ui/`.

Arquivo único por use case. Se passar de ~150 linhas, extrair política para função/domínio puro.
