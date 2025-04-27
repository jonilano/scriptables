"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.adjustDateFrom = adjustDateFrom;
exports.fetchEntityState = fetchEntityState;
exports.fetchEntityStateHistory = fetchEntityStateHistory;
// based on https://github.com/lollokara/HA-Tiny-Graphs
const {
  ha,
  timeoutInterval,
  timestampOffset
} = importModule("./config.js"); // Define global Request type for compatibility (e.g., in Scriptable or custom env)
async function fetchEntityState(entityID) {
  async function tryFetch(url, timeout) {
    const req = new Request(`${url}/api/states/${entityID}`);
    req.timeoutInterval = timeout;
    req.headers = {
      "Authorization": `Bearer ${ha.token}`,
      "content-type": "application/json"
    };
    const result = await req.loadJSON();
    return result;
  }
  try {
    return await tryFetch(ha.internalUrl, timeoutInterval.internal);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    return await tryFetch(ha.externalUrl, timeoutInterval.external);
  }
}
async function fetchEntityStateHistory(entityID, startTime) {
  async function tryFetch(url, timeout) {
    const req = new Request(`${url}/api/history/period/${encodeURIComponent(startTime)}?filter_entity_id=${entityID}&minimal_response`);
    req.timeoutInterval = timeout;
    req.headers = {
      "Authorization": `Bearer ${ha.token}`,
      "content-type": "application/json"
    };
    return await req.loadJSON();
  }
  try {
    return await tryFetch(ha.internalUrl, timeoutInterval.internal);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    return await tryFetch(ha.externalUrl, timeoutInterval.external);
  }
}

// helper function
function adjustDateFrom(date, offset = {}) {
  const targetDate = new Date(date);

  // Use config values or provided values to adjust the date
  const finalOffset = {
    ...timestampOffset,
    ...offset
  };
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