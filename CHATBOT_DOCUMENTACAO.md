# 📘 Documentação do Projeto Chatbot WhatsApp

## 📍 Conteúdo
- [Projeto Final](#-projeto-final--chatbot-de-atendimento-via-whatsapp)
- [Fase 1 Mockada](#-fase-1--frontend-com-backend-mockado)


# 🧭 PROJETO FINAL — Chatbot de Atendimento via WhatsApp

## 🏗️ Visão Geral da Arquitetura

```
frontend/
├── app/
│   ├── dashboard/
│   └── api/
│       ├── webhook/
│       ├── reply/
│       ├── files/
│       └── auth/
├── core/
│   ├── entities/
│   ├── usecases/
│   ├── repositories/
│   ├── services/
│   └── utils/
├── infra/
│   ├── firebase/
│   ├── aws/
│   └── whatsapp/
├── ui/
│   ├── components/
│   └── hooks/
├── config/
└── tests/
```

## 🧩 Tecnologias-Chave

| Área | Tecnologia |
|------|-------------|
| Framework | Next.js 15 |
| Banco | Firebase Firestore |
| Auth | Firebase Auth |
| Storage | AWS S3 |
| UI | Tailwind + shadcn/ui |
| Integração | Meta Cloud API (WhatsApp) |
| Deploy | Vercel + AWS Lambda |

## 🧱 Casos de Uso Principais

- HandleIncomingMessage
- SendMessage
- UploadFile
- AuthenticateAdmin
- ManageFlow

## 🧩 Padrões SOLID

| Princípio | Aplicação |
|------------|------------|
| SRP | Cada classe com uma única responsabilidade |
| OCP | Use interfaces para repos e serviços |
| DIP | Casos de uso dependem de abstrações |

## 🧠 Passos de Desenvolvimento

- Semana 1: Setup (Firebase, AWS, Next.js)
- Semana 2: Webhook e lógica de fluxos
- Semana 3: Painel admin e testes
- Semana 4: Deploy e monitoramento

## 🧰 Dependências

```
npm install firebase aws-sdk @aws-sdk/client-s3 axios zod tailwindcss @shadcn/ui
npm install eslint prettier jest @testing-library/react @testing-library/jest-dom --save-dev
```


---


# 🧭 FASE 1 — FRONTEND COM BACKEND MOCKADO

## 🧩 Estrutura do Projeto

```
frontend/
├── app/
│   ├── dashboard/
│   └── login/
├── core/
│   ├── entities/
│   ├── repositories/
│   ├── usecases/
│   └── types/
├── infra/
│   ├── mocks/
│   └── adapters/
├── ui/
│   ├── components/
│   └── hooks/
├── config/
└── tests/
```

## 🧠 Conceito de Mocks com Abstração

Interfaces no `core/` e mocks em `infra/mocks/`.  
Troca futura simples via `ServiceLocator`.

### Exemplo de Interface

```ts
export interface IFlowRepository {
  getAll(): Promise<Flow[]>;
  getById(id: string): Promise<Flow | null>;
  save(flow: Flow): Promise<void>;
  delete(id: string): Promise<void>;
}
```

### Exemplo de Mock

```ts
export class MockFlowRepository implements IFlowRepository {
  private flows: Flow[] = [
    { id: "inicio", name: "Atendimento Inicial", steps: [] }
  ];

  async getAll() { return this.flows; }
  async getById(id: string) { return this.flows.find(f => f.id === id) || null; }
  async save(flow: Flow) { this.flows.push(flow); }
  async delete(id: string) { this.flows = this.flows.filter(f => f.id !== id); }
}
```

## 🧱 UI Real com Dados Mockados

Páginas principais:
- `/login` (mock auth)
- `/dashboard/flows` (CRUD de fluxos mockados)
- `/dashboard/messages` (histórico mockado)

## 🧪 Testes

- Testar use cases com Jest
- Testar componentes com Testing Library

## 🧭 Roadmap Mockado

| Semana | Tarefas |
|--------|----------|
| 1 | Estrutura + entidades + mocks |
| 2 | Layout base + hooks |
| 3 | Fluxos completos com mocks |
| 4 | Preparar troca para backends reais |
