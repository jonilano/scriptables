"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.generateChartData = generateChartData;
// based on https://github.com/lollokara/HA-Tiny-Graphs

function generateChartData(data) {
  const relevantData = data[0].filter(entry => {
    const timestamp = new Date(entry.last_changed).getTime();
    return Date.now() - timestamp <= 7_300_000; // Two hours
  });
  relevantData.sort((a, b) => new Date(a.last_changed).getTime() - new Date(b.last_changed).getTime());
  for (let i = 0; i < relevantData.length; i++) {
    if ((relevantData[i].state === null || relevantData[i].state === "") && i > 0 && i < relevantData.length - 1) {
      const prevState = relevantData[i - 1]?.state;
      const nextState = relevantData[i + 1]?.state;
      if (prevState != null && nextState != null) {
        const prevValue = Number.parseFloat(prevState);
        const nextValue = Number.parseFloat(nextState);
        relevantData[i].state = ((prevValue + nextValue) / 2).toString();
      }
    }
  }
  const chartData = [];
  const windowSize = 500;
  const interval = 7_200_000 / windowSize;
  let currentIndex = relevantData.length - 1;
  let currentIntervalEnd = Date.now();
  let currentIntervalStart = currentIntervalEnd - interval;
  for (let i = 0; i < windowSize; i++) {
    let totalWeight = 0;
    let weightedSum = 0;
    while (currentIndex >= 0) {
      const entry = relevantData[currentIndex];
      const timestamp = new Date(entry.last_changed).getTime();
      if (timestamp >= currentIntervalStart && timestamp < currentIntervalEnd) {
        const stateValue = entry.state;
        if (stateValue != null && stateValue !== "") {
          const timeDifference = currentIntervalEnd - timestamp;
          const weight = Math.max(0, Math.min(1, 1 - timeDifference / interval));
          totalWeight += weight;
          weightedSum += Number.parseFloat(stateValue) * weight;
        }
        currentIndex--;
      } else {
        break;
      }
    }
    if (totalWeight > 0) {
      chartData.unshift(Math.round(weightedSum / totalWeight));
    } else {
      chartData.unshift(0);
    }
    currentIntervalEnd = currentIntervalStart;
    currentIntervalStart -= interval;
  }
  return fillNullValues(chartData);
}
function fillNullValues(chartData) {
  for (let i = 0; i < chartData.length; i++) {
    if (!chartData[i]) {
      let leftIndex = i - 1;
      let rightIndex = i + 1;
      let leftValue = 0;
      let rightValue = 0;
      while (leftIndex >= 0) {
        if (chartData[leftIndex]) {
          leftValue = chartData[leftIndex];
          break;
        }
        leftIndex--;
      }
      while (rightIndex < chartData.length) {
        if (chartData[rightIndex]) {
          rightValue = chartData[rightIndex];
          break;
        }
        rightIndex++;
      }
      if (leftValue && rightValue) {
        chartData[i] = Math.round((leftValue + rightValue) / 2);
      } else if (leftValue) {
        chartData[i] = leftValue;
      } else if (rightValue) {
        chartData[i] = rightValue;
      }
    }
  }
  return chartData;
}