import { assertNoOutgoingMedia } from './IWhatsAppService';
import {
  contactAvatarApiHref,
  contactAvatarPath,
  flowStepMediaApiHref,
  flowStepMediaPath,
  mediaKindFromMime,
  quickReplyMediaApiHref,
  quickReplyMediaPath,
} from './IMediaStorage';
import { MockMediaStorage } from '../../infra/mocks/MockMediaStorage';

describe('mediaKindFromMime', () => {
  it('classifica image/audio/video/document', () => {
    expect(mediaKindFromMime('image/png')).toBe('image');
    expect(mediaKindFromMime('audio/ogg; codecs=opus')).toBe('audio');
    expect(mediaKindFromMime('video/mp4')).toBe('video');
    expect(mediaKindFromMime('application/pdf')).toBe('document');
  });
});

describe('contactAvatarPath', () => {
  it('href da foto no painel', () => {
    expect(contactAvatarPath('5511999')).toBe('contacts/5511999');
    expect(contactAvatarApiHref('5511999')).toBe('/api/contacts/5511999/avatar');
  });
});

describe('quickReplyMediaPath', () => {
  it('href do áudio no painel', () => {
    expect(quickReplyMediaPath('qr-1')).toBe('quick-replies/qr-1');
    expect(quickReplyMediaApiHref('qr-1')).toBe('/api/quick-replies/qr-1/media');
  });
});

describe('flowStepMediaPath', () => {
  it('href da mídia do passo no painel', () => {
    expect(flowStepMediaPath('inicio', 'welcome')).toBe('flows/inicio/welcome');
    expect(flowStepMediaApiHref('inicio', 'welcome')).toBe(
      '/api/flows/inicio/steps/welcome/media'
    );
  });
});

describe('IMediaStorage.remove', () => {
  it('apaga o objeto', async () => {
    const storage = new MockMediaStorage();
    await storage.save('flows/inicio/welcome', {
      bytes: new Uint8Array([1]),
      mimeType: 'image/png',
    });
    await storage.remove('flows/inicio/welcome');
    expect(await storage.get('flows/inicio/welcome')).toBeNull();
  });
});

describe('assertNoOutgoingMedia', () => {
  it('bloqueia mídia fora da Evolution', () => {
    expect(() =>
      assertNoOutgoingMedia({
        to: '1',
        message: '',
        media: { mimeType: 'image/jpeg', fileName: 'a.jpg', bytes: new Uint8Array([1]) },
      })
    ).toThrow(/Evolution/);
  });
});
