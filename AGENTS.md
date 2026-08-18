# AGENTS.md

Fonte de orquestração do chatbot-atimo. Specs em `specs/` são a verdade de produto. Skills em `.cursor/skills/` são o como. Rules em `.cursor/rules/` são restrições permanentes. Subagents em `.cursor/agents/` são papéis isolados.

## Fluxo obrigatório

```
ler specs relevantes → atualizar spec se o comportamento mudar →
implementar (skill adequada) → escrever testes se couber → PARAR
```

O usuário executa os testes. O agente não roda `npm test`, `yarn test`, Jest, Playwright nem build só para validar.

Não criar nem atualizar `step-by-step/`. Não usar `CHATBOT_DOCUMENTACAO.md` para decidir comportamento novo.

## Papéis

| Papel | Quando | Subagent |
|-------|--------|----------|
| Spec Guardian | Nova feature, mudança de contrato, dúvida de escopo | `spec-guardian` |
| Architect | Novas pastas, portas, provedores, persistência | `architect` |
| Domain Engineer | Entidades, use cases, motor de fluxos | `domain-engineer` |
| WhatsApp Engineer | Provedores, webhooks, envio, QR | `whatsapp-engineer` |
| Dashboard Engineer | Páginas, sidebar, componentes UI | `dashboard-engineer` |
| QA Engineer | Planejar/escrever testes (não executar) | `qa-engineer` |

Delegar ao subagent quando a tarefa for claramente daquele recorte. Tarefas pequenas (typo, ajuste local) o agente principal resolve, ainda lendo a spec.

## Skills

- `implement-from-spec` — qualquer mudança de comportamento
- `add-use-case` — novo caso de uso
- `add-whatsapp-provider` — novo `IWhatsAppService`
- `add-dashboard-module` — tela nova ou sair de vitrine
- `connect-flow-engine` — incoming → fluxo → resposta
- `persist-with-supabase` — Fase 4: Postgres + Auth
- `write-tests` — criar testes e listar o comando para o usuário

## Idioma

Responder ao usuário em português. Código: identificadores em inglês (já existentes); comentários curtos em PT só se esclarecerem regra de negócio.
