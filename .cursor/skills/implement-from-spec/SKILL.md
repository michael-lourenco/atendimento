---
name: implement-from-spec
description: Implements chatbot-atimo features by reading specs first, updating them when behavior changes, then coding. Use when adding or changing product behavior, APIs, dashboard modules, WhatsApp flows, or domain rules.
---

# Implementar a partir da spec

## Passos

1. Identificar specs em `specs/` (`00`–`08`: visão, arquitetura, domínio, WhatsApp, dashboard, API, testes, roadmap, Supabase).
2. Se o pedido muda comportamento: **editar a spec antes** do código.
3. Escolher a skill específica se existir (`add-use-case`, `add-whatsapp-provider`, `add-dashboard-module`, `connect-flow-engine`, `persist-with-supabase`, `write-tests`).
4. Implementar a menor mudança nas camadas certas (`core` → `infra` → `app`/`ui`).
5. Escrever testes se a spec `06` exigir cobertura; **não executar** a suíte.
6. Não criar arquivos em `step-by-step/`.

## Definition of done

- Spec alinhada ao código
- Sem rotas/provedores/entidades fora da spec
- Comando de teste informado ao usuário, não rodado
