// based on https://github.com/lollokara/HA-Tiny-Graphs
import type { EntityState, EntityStateHistory, EntityNotFound } from './home-assistant.types';
import { ha } from './config.js';

// Define global Request type for compatibility (e.g., in Scriptable or custom env)
declare class Request {
  constructor(url: string);
  headers: Record<string, string>;
  timeoutInterval: number;
  loadJSON<T = unknown>(): Promise<T>;
}

export async function fetchEntityState(entityID: string): Promise<EntityState | EntityNotFound> {
  try {
    const req = new Request(`${ha.internalUrl}/api/states/${entityID}`);
    req.timeoutInterval = 6;
    req.headers = {
      "Authorization": `Bearer ${ha.token}`,
      "content-type": "application/json"
    };
    return await req.loadJSON<EntityState | EntityNotFound>();
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    const req = new Request(`${ha.externalUrl}/api/states/${entityID}`);
    req.timeoutInterval = 3;
    req.headers = {
      "Authorization": `Bearer ${ha.token}`,
      "content-type": "application/json"
    };
    return await req.loadJSON<EntityState | EntityNotFound>();
  }
}

export async function fetchEntityStateHistory(entityID: string): Promise<EntityStateHistory> {
  const now = new Date();
  now.setHours(now.getHours() - 2);
  const ts = now.toISOString();

  try {
    const req = new Request(`${ha.internalUrl}/api/history/period/${encodeURIComponent(ts)}?filter_entity_id=${entityID}&minimal_response`);
    req.timeoutInterval = 6;
    req.headers = {
      "Authorization": `Bearer ${ha.token}`,
      "content-type": "application/json"
    };
    return await req.loadJSON<EntityStateHistory>();
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    const req = new Request(`${ha.externalUrl}/api/history/period/${encodeURIComponent(ts)}?filter_entity_id=${entityID}&minimal_response`);
    req.timeoutInterval = 3;
    req.headers = {
      "Authorization": `Bearer ${ha.token}`,
      "content-type": "application/json"
    };
    return await req.loadJSON<EntityStateHistory>();
  }
}
