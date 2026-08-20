'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { FlowEditorScreen } from '@/ui/components/flow-editor-screen';

export default function EditFlowPage() {
  const params = useParams();
  const search = useSearchParams();
  return (
    <FlowEditorScreen
      flowId={String(params.flowId)}
      fromFlowId={search.get('from')}
    />
  );
}
