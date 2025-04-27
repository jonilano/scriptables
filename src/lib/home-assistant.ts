// based on https://github.com/lollokara/HA-Tiny-Graphs
import type { EntityState, EntityStateHistory, EntityNotFound } from './home-assistant.types';
import { ha, timeoutInterval, timestampOffset } from './config.js';

// Define global Request type for compatibility (e.g., in Scriptable or custom env)
declare class Request {
  constructor(url: string);
  headers: Record<string, string>;
  timeoutInterval: number;
  loadJSON<T = unknown>(): Promise<T>;
}

export async function fetchEntityState(entityID: string): Promise<EntityState | EntityNotFound> {
  async function tryFetch(url: string, timeout: number): Promise<EntityState | EntityNotFound> {
    const req = new Request(`${url}/api/states/${entityID}`);
    req.timeoutInterval = timeout;
    req.headers = {
      "Authorization": `Bearer ${ha.token}`,
      "content-type": "application/json"
    };
    const result = await req.loadJSON<EntityState | EntityNotFound>();
    return result;
  }

  try {
    return await tryFetch(ha.internalUrl, timeoutInterval.internal);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    return await tryFetch(ha.externalUrl, timeoutInterval.external);
  }
}

export async function fetchEntityStateHistory(entityID: string, startTime: string): Promise<EntityStateHistory> {
  async function tryFetch(url: string, timeout: number): Promise<EntityStateHistory> {
    const req = new Request(`${url}/api/history/period/${encodeURIComponent(startTime)}?filter_entity_id=${entityID}&minimal_response`);
    req.timeoutInterval = timeout;
    req.headers = {
      "Authorization": `Bearer ${ha.token}`,
      "content-type": "application/json"
    };
    return await req.loadJSON<EntityStateHistory>();
  }

  try {
    return await tryFetch(ha.internalUrl, timeoutInterval.internal);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    return await tryFetch(ha.externalUrl, timeoutInterval.external);
  }
}

// helper function
export function adjustDateFrom(date: Date, offset: { days?: number; hours?: number; minutes?: number; seconds?: number } = {}): string {
  const targetDate = new Date(date);

  // Use config values or provided values to adjust the date
  const finalOffset = { ...timestampOffset, ...offset };

  if (finalOffset.days) {
    targetDate.setDate(targetDate.getDate() - finalOffset.days);
  }

  if (finalOffset.hours) {
    targetDate.setHours(targetDate.getHours() - finalOffset.hours);
  }

  if (finalOffset.minutes) {
    targetDate.setMinutes(targetDate.getMinutes() - finalOffset.minutes);
  }

  if (finalOffset.seconds) {
    targetDate.setSeconds(targetDate.getSeconds() - finalOffset.seconds);
  }

  return targetDate.toISOString();
}

