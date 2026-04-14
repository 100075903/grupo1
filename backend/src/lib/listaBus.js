/**
 * In-memory SSE bus for real-time lista updates.
 * Maps listaId → Set of active SSE response objects.
 */
const clients = new Map();

export function subscribe(listaId, res) {
  if (!clients.has(listaId)) clients.set(listaId, new Set());
  clients.get(listaId).add(res);
}

export function unsubscribe(listaId, res) {
  clients.get(listaId)?.delete(res);
}

export function publish(listaId, eventName, data) {
  const subs = clients.get(listaId);
  if (!subs || subs.size === 0) return;
  const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of subs) {
    try { res.write(payload); } catch { subs.delete(res); }
  }
}
