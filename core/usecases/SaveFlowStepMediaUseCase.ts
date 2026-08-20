import { Flow, FlowStep, FlowStepMediaKind } from '../entities/Flow';
import { IFlowRepository } from '../repositories/IFlowRepository';
import {
  IMediaStorage,
  MAX_OUTGOING_MEDIA_BYTES,
  StoredMedia,
  flowStepMediaPath,
  mediaKindFromMime,
} from '../services/IMediaStorage';

export class InvalidFlowStepMediaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidFlowStepMediaError';
  }
}

function isMessageStep(step: FlowStep | undefined): step is FlowStep {
  return step?.type === 'message';
}

function withStepMedia(
  flow: Flow,
  stepId: string,
  mediaUrl: string | undefined,
  mediaKind: FlowStepMediaKind | undefined
): Flow {
  return {
    ...flow,
    updatedAt: new Date(),
    steps: flow.steps.map((step) =>
      step.id === stepId ? { ...step, mediaUrl, mediaKind } : step
    ),
  };
}

export class SaveFlowStepMediaUseCase {
  constructor(
    private flows: IFlowRepository,
    private storage: IMediaStorage | null = null
  ) {}

  async execute(
    flowId: string,
    stepId: string,
    media: StoredMedia | null
  ): Promise<Flow | null> {
    const flow = await this.flows.getById(flowId.trim());
    const step = flow?.steps.find((item) => item.id === stepId.trim());
    if (!flow || !isMessageStep(step)) {
      return null;
    }
    const path = flowStepMediaPath(flow.id, step.id);
    if (!media) {
      if (this.storage) {
        await this.storage.remove(path);
      }
      const cleared = withStepMedia(flow, step.id, undefined, undefined);
      await this.flows.save(cleared);
      return cleared;
    }
    if (media.bytes.byteLength > MAX_OUTGOING_MEDIA_BYTES) {
      throw new InvalidFlowStepMediaError('Arquivo maior que 16 MB');
    }
    const kind = mediaKindFromMime(media.mimeType);
    if (kind !== 'image' && kind !== 'audio') {
      throw new InvalidFlowStepMediaError('Só é permitido imagem ou áudio');
    }
    if (!this.storage) {
      throw new InvalidFlowStepMediaError('Storage de mídia indisponível');
    }
    await this.storage.save(path, media);
    const updated = withStepMedia(flow, step.id, path, kind);
    await this.flows.save(updated);
    return updated;
  }
}
