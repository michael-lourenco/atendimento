export function isIncomingTab(conversation: { status: string; assignedAgentId?: string }): boolean {
  return conversation.status === 'open' && !conversation.assignedAgentId;
}

export function isWaitingTab(conversation: { status: string; assignedAgentId?: string }): boolean {
  return (
    conversation.status === 'waiting' ||
    conversation.status === 'transferred' ||
    (conversation.status === 'open' && Boolean(conversation.assignedAgentId))
  );
}

export function isClosedTab(conversation: { status: string }): boolean {
  return conversation.status === 'closed';
}
