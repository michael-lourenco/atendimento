# 00 — Visão do produto

## Nome

**chatbot-atimo** (UI: “Chatbot Atendimento”).

## O que é

Plataforma de **atendimento via WhatsApp**: chatbot + central humana. O cliente fala no WhatsApp; a equipe opera no painel (setores, transferências, fluxos, relatórios).

## Público

Operadores e administradores de times de atendimento (suporte, vendas, financeiro) **de uma empresa**.

## Implantação (não é multi-tenant)

Cada empresa recebe um sistema **completo e isolado na infra dela**:

- 1 app Next.js
- 1 projeto Supabase (Postgres + Auth + Storage)
- 1 provedor WhatsApp (Evolution / Meta / Twilio) com instância própria

Empresa XYZ não vê dados nem config da HZJ. Isolamento = **cópia da stack**, não `company_id` no banco. Replicar para outra empresa = novo host + novo projeto Supabase + env + migrations (`08-supabase.md`).

## Problema

Atender muitos contatos no WhatsApp com triagem, automação e histórico, sem depender só do WhatsApp Web.

## Capacidades alvo

- Receber e enviar mensagens (texto e mídia)
- Triagem por **setores** e **atendentes**
- **Chatbots** e **fluxos** (o roteiro no WhatsApp é o fluxo)
- **Contatos**, **etiquetas**, **respostas rápidas** (catálogo da empresa), **vários números**, **agendamentos**
- **Notas da equipe** na conversa
- **Relatórios** de volume e atendimento
- Conexão WhatsApp via provedor configurável (`WHATSAPP_PROVIDER`)

## Fora de escopo (por enquanto)

- App mobile nativo
- Canais além de WhatsApp (Instagram, e-mail, etc.)
- Billing / cobrança de créditos
- **SaaS multi-tenant** (várias empresas no mesmo app/banco; RLS por `company_id`)
- Persistência alternativa (Firestore, D1): o alvo é **Supabase** — `08-supabase.md`. Sem R2/Cloudflare Storage nesta fase.

## Estado atual

Fases 1–5 feitas. Inbox: citação, digitando, PTT, rascunho, próxima da fila, lightbox. Bot: expediente, delay/digitando, ciclo novo vs conhecido (thread+contato), idle só na pergunta, reabertura com menu conhecido.

**Fase 5 (produção):** validação Zod na borda HTTP, `x-request-id`, logs sanitizados, dica de login só com URL + anon. Uma empresa = uma stack (`08-supabase.md`).

## Fonte de verdade

Este diretório `specs/`, `AGENTS.md`, `.cursor/rules/` e `.cursor/skills/` **substituem** `CHATBOT_DOCUMENTACAO.md` e `step-by-step/` para decisões de produto e implementação. Em conflito, prevalecem as specs.
