import { canRecordPtt, pickPttMimeType, pttFileFromBlobs } from './ptt-file';

describe('ptt-file', () => {
  it('sem MediaRecorder não quebra', () => {
    expect(canRecordPtt()).toBe(false);
    expect(pickPttMimeType()).toBe('');
  });

  it('monta File a partir dos blobs', () => {
    const file = pttFileFromBlobs([new Blob(['abc'], { type: 'audio/webm' })], 'audio/webm;codecs=opus');
    expect(file.name).toBe('ptt.webm');
    expect(file.type).toBe('audio/webm');
    expect(file.size).toBeGreaterThan(0);
  });

  it('ogg usa extensão ogg', () => {
    const file = pttFileFromBlobs([new Blob(['x'])], 'audio/ogg;codecs=opus');
    expect(file.name).toBe('ptt.ogg');
  });
});
