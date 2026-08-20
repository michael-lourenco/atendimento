---
name: connect-flow-engine
description: Wires incoming WhatsApp messages to Flow steps and automated replies. Use when implementing the chatbot engine, FlowSession, HandleIncomingWhatsAppMessageUseCase, or auto-replies.
---

# Motor de fluxos

Leia `specs/02-domain.md`. Não implementar atalhos que ignorem sessão.

## Alvo

1. Entidade `FlowSession` (`contactId`, `flowId`, `currentStepId`, `updatedAt`) + porta + mock.
2. Em `HandleIncomingWhatsAppMessageUseCase`, após `save` da incoming:
   - carregar ou criar sessão
   - obter `Flow` ativo
   - interpretar `FlowStep` (`message` | `question` | `condition` | `action`)
   - responder com `SendWhatsAppMessageUseCase`
   - persistir o próximo `currentStepId`
3. `condition`: `equals` | `contains` | `greaterThan` | `lessThan` nos campos da spec; ramos `trueStepId` / `falseStepId`.
4. Sem fluxo ativo: não enviar texto inventado; logar e sair. Entrada: `flowId` da linha, senão do chatbot ativo, se o fluxo existir e estiver ativo; senão `id === "inicio"`, senão nome `"Atendimento Inicial"`, senão o primeiro ativo (`specs/02-domain.md`).

## Testes a escrever (não executar)

- Avanço `nextStepId`
- Ramo true/false da condition
- Primeira mensagem cria sessão

Atualizar `02-domain.md` se o default (`inicio`) ou o formato da sessão mudarem.
