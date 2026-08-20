import { BusinessHours, isWithinBusinessHours } from './businessHours';

const hours: BusinessHours = {
  enabled: true,
  timezone: 'UTC',
  days: [1, 2, 3, 4, 5],
  start: '08:00',
  end: '18:00',
  closedMessage: 'Fechado',
};

describe('isWithinBusinessHours', () => {
  it('dentro do expediente em dia útil', () => {
    expect(isWithinBusinessHours(hours, new Date('2026-08-19T12:00:00Z'))).toBe(true);
  });

  it('fora no fim de semana', () => {
    expect(isWithinBusinessHours(hours, new Date('2026-08-16T12:00:00Z'))).toBe(false);
  });

  it('desligado sempre deixa passar', () => {
    expect(
      isWithinBusinessHours({ ...hours, enabled: false }, new Date('2026-08-16T12:00:00Z'))
    ).toBe(true);
  });
});
