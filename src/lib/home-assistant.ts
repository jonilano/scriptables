// based on https://github.com/lollokara/HA-Tiny-Graphs
import { ha } from './config.js';

// Define global Request type for compatibility (e.g., in Scriptable or custom env)
declare class Request {
  constructor(url: string);
  headers: Record<string, string>;
  timeoutInterval: number;
  loadJSON<T = unknown>(): Promise<T>;
}

interface HassState {
  state: string;
  [key: string]: string | undefined;
}

interface HassHistoryState {
  entity_id: string;
  state: string;
  last_changed: string;
  last_updated: string;
  [key: string]: unknown;
}

type HassHistoryResponse = HassHistoryState[][];

export async function fetchAllStates(entityID: string): Promise<string | undefined> {
  try {
    const req = new Request(`${ha.internalUrl}/api/states/${entityID}`);
    req.timeoutInterval = 6;
    req.headers = {
      "Authorization": `Bearer ${ha.token}`,
      "content-type": "application/json"
    };
    const data: HassState = await req.loadJSON();
    return data.state;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    const req = new Request(`${ha.externalUrl}/api/states/${entityID}`);
    req.timeoutInterval = 3;
    req.headers = {
      "Authorization": `Bearer ${ha.token}`,
      "content-type": "application/json"
    };
    const data: HassState = await req.loadJSON();
    return data.state;
  }
}

export async function fetchHistory(entityID: string): Promise<HassHistoryResponse> {
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
    return await req.loadJSON<HassHistoryResponse>();
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    const req = new Request(`${ha.externalUrl}/api/history/period/${encodeURIComponent(ts)}?filter_entity_id=${entityID}&minimal_response`);
    req.timeoutInterval = 3;
    req.headers = {
      "Authorization": `Bearer ${ha.token}`,
      "content-type": "application/json"
    };
    return await req.loadJSON<HassHistoryResponse>();
  }
}
