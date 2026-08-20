'use client';

import { useEffect, useRef, useState } from 'react';
import {
  PTT_MAX_MS,
  PTT_MIN_MS,
  canRecordPtt,
  pickPttMimeType,
  pttFileFromBlobs,
} from '@/ui/lib/ptt-file';

export function usePttRecorder() {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAt = useRef(0);
  const sessionRef = useRef(0);
  const [recording, setRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(canRecordPtt());
  }, []);

  const releaseStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
    chunksRef.current = [];
    startedAt.current = 0;
    setRecording(false);
    setElapsedMs(0);
  };

  useEffect(() => {
    if (!recording) {
      return;
    }
    const timer = setInterval(() => {
      setElapsedMs(Date.now() - startedAt.current);
    }, 200);
    return () => clearInterval(timer);
  }, [recording]);

  const start = async (): Promise<boolean> => {
    if (recording || !canRecordPtt()) {
      return false;
    }
    const session = sessionRef.current + 1;
    sessionRef.current = session;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    if (sessionRef.current !== session) {
      stream.getTracks().forEach((track) => track.stop());
      return false;
    }
    streamRef.current = stream;
    const mimeType = pickPttMimeType();
    const recorder = mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream);
    chunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };
    recorder.start();
    recorderRef.current = recorder;
    startedAt.current = Date.now();
    setElapsedMs(0);
    setRecording(true);
    return true;
  };

  const stop = (): Promise<File | null> => {
    sessionRef.current += 1;
    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        releaseStream();
        resolve(null);
        return;
      }
      const duration = Date.now() - startedAt.current;
      recorder.onstop = () => {
        const file =
          duration >= PTT_MIN_MS ? pttFileFromBlobs(chunksRef.current, recorder.mimeType) : null;
        releaseStream();
        resolve(file);
      };
      recorder.stop();
    });
  };

  const cancel = () => {
    sessionRef.current += 1;
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = () => releaseStream();
      recorder.stop();
      return;
    }
    releaseStream();
  };

  return {
    recording,
    elapsedMs: Math.min(elapsedMs, PTT_MAX_MS),
    start,
    stop,
    cancel,
    supported,
  };
}
