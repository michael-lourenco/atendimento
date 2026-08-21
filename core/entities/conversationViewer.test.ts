import { conversationViewerName } from './conversationViewer';

const now = new Date('2026-08-20T12:00:00Z');

describe('conversationViewerName', () => {
  it('mostra o outro agente se viewerAt estiver fresco', () => {
    expect(
      conversationViewerName(
        {
          viewerAgentId: 'a2',
          viewerAgentName: 'Maria',
          viewerAt: new Date('2026-08-20T11:59:50Z'),
        },
        'a1',
        now
      )
    ).toBe('Maria');
  });

  it('esconde o próprio viewer e o heartbeat velho', () => {
    expect(
      conversationViewerName(
        {
          viewerAgentId: 'a1',
          viewerAgentName: 'João',
          viewerAt: new Date('2026-08-20T11:59:50Z'),
        },
        'a1',
        now
      )
    ).toBeNull();
    expect(
      conversationViewerName(
        {
          viewerAgentId: 'a2',
          viewerAgentName: 'Maria',
          viewerAt: new Date('2026-08-20T11:59:30Z'),
        },
        'a1',
        now
      )
    ).toBeNull();
  });
});
