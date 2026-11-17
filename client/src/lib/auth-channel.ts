// Keeps auth state in sync across tabs. BroadcastChannel delivers a message to
// every other same-origin tab listening on the channel (never to the sender).

export type AuthMessage = { type: 'login' } | { type: 'logout' };

const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('expense-tracker:auth');

export function broadcastAuth(message: AuthMessage) {
  channel?.postMessage(message);
}

/** Subscribes to auth events from other tabs. Returns an unsubscribe function. */
export function onAuthMessage(handler: (message: AuthMessage) => void) {
  if (!channel) return () => {};
  const listener = (event: MessageEvent<AuthMessage>) => handler(event.data);
  channel.addEventListener('message', listener);
  return () => channel.removeEventListener('message', listener);
}
