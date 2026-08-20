import { z } from 'zod';
import { HttpBodyError } from './parseJson';

export const loginBodySchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Email e senha obrigatórios'),
});

export const createOperatorBodySchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha mínima de 6 caracteres'),
  name: z.string().trim().min(1, 'Nome e e-mail obrigatórios'),
  role: z.enum(['admin', 'user']).optional(),
  departmentId: z.string().optional(),
});

export const patchOperatorBodySchema = z
  .object({
    role: z.enum(['admin', 'user'], { errorMap: () => ({ message: 'Papel inválido' }) }).optional(),
    password: z.string().min(6, 'Senha mínima de 6 caracteres').optional(),
  })
  .refine((value) => value.role !== undefined || Boolean(value.password), {
    message: 'Informe papel ou senha',
  });

export const setOperatorRoleBodySchema = patchOperatorBodySchema;

export const sendMessageJsonSchema = z
  .object({
    to: z.string().trim().min(1, 'Campo obrigatório: to'),
    message: z.string(),
    type: z.enum(['text', 'template']).optional(),
    templateName: z.string().optional(),
    templateParams: z.array(z.string()).optional(),
    conversationId: z.string().trim().min(1).optional(),
    quotedMessageId: z.string().trim().min(1).optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.message.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Campos obrigatórios: to, message' });
    }
    if (value.type === 'template' && !value.templateName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'templateName é obrigatório quando type é "template"',
      });
    }
  });

export const reactMessageBodySchema = z.object({
  messageId: z.string().trim().min(1, 'Campo obrigatório: messageId'),
  emoji: z.string().max(16),
});

export const presenceBodySchema = z.object({
  to: z.string().trim().min(1, 'Campo obrigatório: to'),
  presence: z.enum(['composing', 'recording', 'paused'], {
    errorMap: () => ({ message: 'presence inválido' }),
  }),
  conversationId: z.string().trim().min(1).optional(),
});

export const readMessagesBodySchema = z.object({
  conversationId: z.string().trim().min(1, 'Campo obrigatório: conversationId'),
});

export const evolutionWebhookSchema = z
  .object({
    event: z.string().min(1, 'Formato de webhook inválido'),
    data: z.unknown().optional(),
    instance: z.string().optional(),
  })
  .passthrough();

export function evolutionWebhookData(
  body: z.infer<typeof evolutionWebhookSchema>
): { event: string; data: unknown; instance?: string } {
  const data = body.data ?? ('key' in body && body.key != null ? body : null);
  if (data == null) {
    throw new HttpBodyError('Formato de webhook inválido');
  }
  return { event: body.event, data, instance: body.instance };
}

export const ensureInstanceBodySchema = z.object({
  instanceName: z.string().trim().min(1, 'Instância obrigatória'),
});

export const chatWhatsAppWebhookSchema = z.object({
  event: z.string().min(1, 'Formato de webhook inválido'),
  data: z.unknown(),
});

export const metaWebhookSchema = z
  .object({
    object: z.literal('whatsapp_business_account', {
      errorMap: () => ({ message: 'Objeto inválido' }),
    }),
    entry: z.array(z.unknown()).optional(),
  })
  .passthrough();
