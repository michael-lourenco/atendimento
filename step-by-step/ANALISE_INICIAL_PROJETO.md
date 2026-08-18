# Análise inicial do projeto — 18/08/2026

## Contexto
Primeira conversa desta sessão. Objetivo: ler o repositório e explicar do que o projeto se trata, sem alterar código de negócio.

## O que foi feito
- Mapeamento da estrutura (`app/`, `core/`, `infra/`, `ui/`, `step-by-step/`).
- Leitura de `package.json`, `CHATBOT_DOCUMENTACAO.md`, `CONFIGURACAO_WHATSAPP.md`, entidades, `ServiceLocator`, login, dashboard e integrações WhatsApp.
- Conclusão: plataforma de atendimento via WhatsApp (chatbot + painel), ainda na fase de frontend com backend mockado, com integrações reais de WhatsApp parcialmente implementadas.

## Arquivos e pastas relevantes

| Caminho | Função |
|---------|--------|
| `app/` | Rotas Next.js (login, dashboard, APIs/webhooks) |
| `core/` | Domínio: entidades, casos de uso, interfaces |
| `infra/mocks/` | Repositórios em memória (auth, fluxos, mensagens, conversas) |
| `infra/whatsapp/` | Adaptadores Meta, Twilio, Evolution e chat-whatsapp (AWS) |
| `infra/adapters/ServiceLocator.ts` | Injeta mocks e escolhe o provedor WhatsApp |
| `ui/` | Componentes visuais (sidebar, cards, tema) |
| `CHATBOT_DOCUMENTACAO.md` | Visão do produto final e da Fase 1 |

## Estado
Análise concluída. Nenhuma alteração de código de aplicação.
