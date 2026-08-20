import {
  BusinessHours,
  businessWindows,
  isWithinBusinessHours,
  setWeekdayClock,
  setWeekdayOpen,
} from './businessHours';

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

  it('sábado com horário próprio', () => {
    const saturday: BusinessHours = {
      ...hours,
      days: [6],
      start: '09:00',
      end: '13:00',
      windows: [{ weekday: 6, start: '09:00', end: '13:00' }],
    };
    expect(isWithinBusinessHours(saturday, new Date('2026-08-15T12:00:00Z'))).toBe(true);
    expect(isWithinBusinessHours(saturday, new Date('2026-08-15T14:00:00Z'))).toBe(false);
    expect(isWithinBusinessHours(saturday, new Date('2026-08-19T12:00:00Z'))).toBe(false);
  });

  it('legado days+start+end sem windows', () => {
    const legacy: BusinessHours = {
      enabled: true,
      timezone: 'UTC',
      days: [6],
      start: '09:00',
      end: '13:00',
      closedMessage: 'Fechado',
    };
    expect(isWithinBusinessHours(legacy, new Date('2026-08-15T12:00:00Z'))).toBe(true);
    expect(isWithinBusinessHours(legacy, new Date('2026-08-19T12:00:00Z'))).toBe(false);
  });

  it('windows vazio ignora days legado', () => {
    expect(
      isWithinBusinessHours(
        { ...hours, windows: [] },
        new Date('2026-08-19T12:00:00Z')
      )
    ).toBe(false);
  });

  it('turno 22h–6h atravessa meia-noite', () => {
    const night: BusinessHours = {
      ...hours,
      days: [5],
      start: '22:00',
      end: '06:00',
      windows: [{ weekday: 5, start: '22:00', end: '06:00' }],
    };
    expect(isWithinBusinessHours(night, new Date('2026-08-21T23:00:00Z'))).toBe(true);
    expect(isWithinBusinessHours(night, new Date('2026-08-21T21:00:00Z'))).toBe(false);
    expect(isWithinBusinessHours(night, new Date('2026-08-22T05:00:00Z'))).toBe(true);
    expect(isWithinBusinessHours(night, new Date('2026-08-22T06:00:00Z'))).toBe(false);
    expect(isWithinBusinessHours(night, new Date('2026-08-22T23:00:00Z'))).toBe(false);
  });

  it('manhã só abre se o dia anterior atravessou meia-noite', () => {
    const saturdayNight: BusinessHours = {
      ...hours,
      days: [6],
      start: '22:00',
      end: '06:00',
      windows: [{ weekday: 6, start: '22:00', end: '06:00' }],
    };
    expect(isWithinBusinessHours(saturdayNight, new Date('2026-08-22T05:00:00Z'))).toBe(false);
    expect(isWithinBusinessHours(saturdayNight, new Date('2026-08-22T23:00:00Z'))).toBe(true);
    expect(isWithinBusinessHours(saturdayNight, new Date('2026-08-23T05:00:00Z'))).toBe(true);
  });
});

describe('setWeekdayOpen e setWeekdayClock', () => {
  it('abre todos os dias com horário copiado', () => {
    let next = hours;
    for (const weekday of [0, 1, 2, 3, 4, 5, 6]) {
      next = setWeekdayOpen(next, weekday, true);
    }
    expect(businessWindows(next).map((item) => item.weekday)).toEqual([1, 2, 3, 4, 5, 6, 0]);
  });

  it('muda só o horário de um dia', () => {
    const next = setWeekdayClock(hours, 6, 'start', '09:00');
    const saturday = businessWindows(next).find((item) => item.weekday === 6);
    const monday = businessWindows(next).find((item) => item.weekday === 1);
    expect(saturday).toEqual({ weekday: 6, start: '09:00', end: '18:00' });
    expect(monday?.start).toBe('08:00');
  });
});
