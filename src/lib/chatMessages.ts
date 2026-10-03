import type { ChatMessage } from "@/lib/chatApi";

/**
 * Puts a server message into the list (QA-034):
 * - ignores it if a message with the same id is already there (realtime +
 *   insert response both deliver our own message),
 * - otherwise replaces the oldest pending message of the same author with
 *   the same text (so our optimistic bubble turns into the real one),
 * - otherwise appends it. The list stays sorted by created_at.
 */
export const mergeServerMessage = (list: ChatMessage[], msg: ChatMessage): ChatMessage[] => {
  if (list.some((m) => m.id === msg.id)) return list;
  const pendingIdx = list.findIndex(
    (m) => m.pending && m.user_id === msg.user_id && m.body === msg.body,
  );
  if (pendingIdx !== -1) {
    const next = [...list];
    // keep the author we already rendered for the optimistic bubble
    next[pendingIdx] = { ...msg, author: msg.author ?? list[pendingIdx].author };
    return next;
  }
  return [...list, msg].sort((a, b) => a.created_at.localeCompare(b.created_at));
};

/** Optimistic bubble shown immediately after pressing send. */
export const makePendingMessage = (
  activityId: string,
  userId: string,
  body: string,
  author: ChatMessage["author"],
  now = new Date(),
): ChatMessage => {
  const clientId = `pending-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    id: clientId,
    clientId,
    activity_id: activityId,
    user_id: userId,
    body,
    created_at: now.toISOString(),
    author,
    pending: true,
  };
};

/** Marks an optimistic message as failed (or pending again for a retry). */
export const setPendingState = (
  list: ChatMessage[],
  clientId: string,
  state: { pending: boolean; failed: boolean },
): ChatMessage[] => list.map((m) => (m.clientId === clientId ? { ...m, ...state } : m));

/** Removes an optimistic message once its server row is in the list. */
export const resolvePending = (
  list: ChatMessage[],
  clientId: string,
  saved: ChatMessage,
): ChatMessage[] => {
  const withoutPending = list.filter((m) => m.clientId !== clientId || m.id === saved.id);
  return mergeServerMessage(withoutPending, saved);
};
