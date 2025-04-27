"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fetchAllStates = fetchAllStates;
exports.fetchHistory = fetchHistory;
// based on https://github.com/lollokara/HA-Tiny-Graphs
const {
  ha
} = importModule("./config.js"); // Define global Request type for compatibility (e.g., in Scriptable or custom env)
async function fetchAllStates(entityID) {
  try {
    const req = new Request(`${ha.internalUrl}/api/states/${entityID}`);
    req.timeoutInterval = 6;
    req.headers = {
      "Authorization": `Bearer ${ha.token}`,
      "content-type": "application/json"
    };
    const data = await req.loadJSON();
    return data.state;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    const req = new Request(`${ha.externalUrl}/api/states/${entityID}`);
    req.timeoutInterval = 3;
    req.headers = {
      "Authorization": `Bearer ${ha.token}`,
      "content-type": "application/json"
    };
    const data = await req.loadJSON();
    return data.state;
  }
}
async function fetchHistory(entityID) {
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
    return await req.loadJSON();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    const req = new Request(`${ha.externalUrl}/api/history/period/${encodeURIComponent(ts)}?filter_entity_id=${entityID}&minimal_response`);
    req.timeoutInterval = 3;
    req.headers = {
      "Authorization": `Bearer ${ha.token}`,
      "content-type": "application/json"
    };
    return await req.loadJSON();
  }
}