import { WhatsAppNumber } from '../../core/entities/WhatsAppNumber';
import { IWhatsAppNumberRepository } from '../../core/repositories/IWhatsAppNumberRepository';
import { createInMemoryCrud } from './inMemoryCrud';

const seed: WhatsAppNumber[] = [
  {
    id: '1',
    number: '5511999999999',
    name: 'Número Principal',
    status: 'active',
    provider: 'WhatsApp Business API',
    instanceName: 'principal',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    number: '5511888888888',
    name: 'Número Secundário',
    status: 'active',
    provider: 'WhatsApp Business API',
    instanceName: 'secundario',
    createdAt: new Date('2024-01-05'),
  },
];

export const mockWhatsAppNumberRepository: IWhatsAppNumberRepository = createInMemoryCrud(seed);
