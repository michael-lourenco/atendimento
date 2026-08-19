import { Contact } from '@/core/entities/Contact';
import {
  contactPhoneOf,
  contactPickerLabel,
  filterContactsForPicker,
  findContactByPhone,
  newContactPhoneFromQuery,
  normalizeSchedulePhone,
} from './contact-picker';

const maria: Contact = {
  id: '5511888888888',
  name: 'Maria Santos',
  phone: '5511888888888',
  tags: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const joao: Contact = {
  id: '5511999999999',
  name: 'João Silva',
  phone: '5511999999999',
  tags: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('contact-picker', () => {
  it('filtra por nome e por pedaço do telefone', () => {
    expect(filterContactsForPicker([maria, joao], 'maria').map((item) => item.id)).toEqual([
      maria.id,
    ]);
    expect(filterContactsForPicker([maria, joao], '9999').map((item) => item.id)).toEqual([joao.id]);
  });

  it('normaliza DDD brasileiro com 55', () => {
    expect(normalizeSchedulePhone('(11) 98888-8888')).toBe('5511988888888');
    expect(normalizeSchedulePhone('5511988888888')).toBe('5511988888888');
  });

  it('oferece número novo só se ainda não estiver cadastrado', () => {
    expect(newContactPhoneFromQuery('11977776666', [maria, joao])).toBe('5511977776666');
    expect(newContactPhoneFromQuery('5511888888888', [maria, joao])).toBeNull();
    expect(newContactPhoneFromQuery('Maria', [maria, joao])).toBeNull();
  });

  it('rótulo usa nome quando não é o próprio número', () => {
    expect(contactPickerLabel(maria)).toBe('Maria Santos · 5511888888888');
    expect(findContactByPhone([maria], '11 88888-8888')?.id).toBe(maria.id);
  });

  it('usa o telefone do cadastro mesmo quando o id é outro', () => {
    const seeded: Contact = {
      id: '1',
      name: 'João Silva',
      phone: '5511999999999',
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(contactPhoneOf(seeded)).toBe('5511999999999');
    expect(findContactByPhone([seeded], '5511999999999')?.name).toBe('João Silva');
  });
});
