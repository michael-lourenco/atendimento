# 00 — Visão do produto

## Nome

**chatbot-atimo** (UI: “Chatbot Atendimento”).

## O que é

Plataforma de **atendimento via WhatsApp**: chatbot + central humana. O cliente fala no WhatsApp; a equipe opera no painel (setores, transferências, fluxos, relatórios).

## Público

Operadores e administradores de times de atendimento (suporte, vendas, financeiro).

## Problema

Atender muitos contatos no WhatsApp com triagem, automação e histórico, sem depender só do WhatsApp Web.

## Capacidades alvo

- Receber e enviar mensagens (texto e mídia)
- Triagem por **setores** e **atendentes**
- **Chatbots** e **fluxos** (mensagem, pergunta, condição, ação)
- **Contatos**, **etiquetas**, **vários números**, **agendamentos**
- **Chat interno** entre a equipe
- **Relatórios** de volume e atendimento
- Conexão WhatsApp via provedor configurável (`WHATSAPP_PROVIDER`)

## Fora de escopo (por enquanto)

- App mobile nativo
- Canais além de WhatsApp (Instagram, e-mail, etc.)
- Billing / cobrança de créditos
- Persistência: **Supabase** (Postgres + Auth + Storage) — ver `08-supabase.md`. Sem Firestore/D1.

## Estado atual

Fases 1–3 feitas (mocks + motor de fluxos + dashboard via use cases). Fase 4 (Supabase) especificada, ainda não no código.

## Fonte de verdade

Este diretório `specs/`, `AGENTS.md`, `.cursor/rules/` e `.cursor/skills/` **substituem** `CHATBOT_DOCUMENTACAO.md` e `step-by-step/` para decisões de produto e implementação. Em conflito, prevalecem as specs.
