---
name: add-dashboard-module
description: Adds or upgrades a dashboard page from hardcoded vitrine to use-case-backed UI, including sidebar. Use when editing app/dashboard, sidebar, login, or ui/components.
---

# Módulo de dashboard

Leia `specs/04-dashboard.md`. Atualize a tabela de rotas (funcional vs vitrine).

## De vitrine → funcional

1. Domínio + porta + mock + use case (`add-use-case`).
2. Página em `app/dashboard/<modulo>/page.tsx` consome o use case.
3. Item em `sidebarItems` (`ui/components/sidebar.tsx`) se for seção nova.
4. Remover arrays literais de negócio da página.

## UI

- Reutilizar `Card`, `Table`, `Button`, `Badge`, `Tabs` em `ui/components`.
- Tema via classes `bg-background`, `text-foreground`, `border-border`.
- `'use client'` apenas com estado/efeitos.
- Sem import de `infra/whatsapp/*` na página.

## Não fazer

Não marcar relatórios/chatbots/agentes como prontos se ainda forem hardcoded.
