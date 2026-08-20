import {
  applyMessageReaction,
  coalesceMessageList,
  groupMessageReactions,
  nextMessageReactions,
  reactionTogglesOff,
  reactionsFromUnknown,
} from './messageReaction';
import { Message } from './Message';

describe('messageReaction', () => {
  it('um emoji por remetente; vazio remove', () => {
    const first = applyMessageReaction([], '5511', '👍');
    const replaced = applyMessageReaction(first, '5511', '❤️');
    expect(replaced).toEqual([{ emoji: '❤️', from: '5511' }]);
    expect(applyMessageReaction(replaced, '5511', '')).toEqual([]);
  });

  it('agrupa chips e marca a da linha', () => {
    const chips = groupMessageReactions(
      [
        { emoji: '👍', from: '5511' },
        { emoji: '👍', from: 'comercial' },
      ],
      'comercial'
    );
    expect(chips).toEqual([{ emoji: '👍', count: 2, mine: true }]);
  });

  it('mesmo emoji da linha liga o toggle', () => {
    expect(reactionTogglesOff([{ emoji: '😂', from: 'bot' }], 'bot', '😂')).toBe(true);
    expect(reactionTogglesOff([{ emoji: '😂', from: 'bot' }], 'bot', '👍')).toBe(false);
  });

  it('reload sem reactions no banco não apaga o chip da tela', () => {
    const previous: Message[] = [
      {
        id: 'm1',
        from: '5511',
        to: 'comercial',
        content: 'oi',
        type: 'text',
        timestamp: new Date('2026-08-20T12:00:00Z'),
        direction: 'incoming',
        status: 'delivered',
        reactions: [{ emoji: '👍', from: 'comercial' }],
      },
    ];
    const loaded = [{ ...previous[0], reactions: undefined }];
    expect(coalesceMessageList(loaded, previous)[0].reactions).toEqual([
      { emoji: '👍', from: 'comercial' },
    ]);
  });

  it('nextMessageReactions aplica ou tira o da linha', () => {
    const message = {
      direction: 'incoming' as const,
      from: '5511',
      to: 'comercial',
      reactions: undefined as Message['reactions'],
    };
    const added = nextMessageReactions(message, '👍');
    expect(added).toEqual([{ emoji: '👍', from: 'comercial' }]);
    expect(nextMessageReactions({ ...message, reactions: added }, '👍')).toEqual([]);
  });

  it('reactionsFromUnknown lê jsonb ou string', () => {
    expect(reactionsFromUnknown([{ emoji: '🔥', from: '5511' }])).toEqual([
      { emoji: '🔥', from: '5511' },
    ]);
    expect(reactionsFromUnknown('[{"emoji":"🔥","from":"5511"}]')).toEqual([
      { emoji: '🔥', from: '5511' },
    ]);
    expect(reactionsFromUnknown(null)).toBeUndefined();
  });
});
