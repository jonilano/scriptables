import { fetchAllStates, fetchHistory } from "./lib/home-assistant";
import { generateChartData } from "./lib/chart-data";
// @ts-expect-error ignore
import Logger from "./lib/Logger.js";
import { createWidget } from "./lib/tiny-dashboard";

const logger = new Logger();

const dateFormatter = new DateFormatter();
dateFormatter.useShortTimeStyle();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SCRIPT_NAME = 'power-stat';

let chartDT: number[];
const sensorData: { [key: string]: string | undefined } = {};

const Sensors = [
  "sensor.energy_consumption_today",
  "sensor.power_consumption",
  "sensor.inverter_grid_power",
  "sensor.inverter_warning_code",
];

async function processData() {
  // Ensure sensorData is populated before proceeding
  await Promise.all(Sensors.map(async (sensor) => {
    const state = await fetchAllStates(sensor);
    sensorData[sensor] = state;
  }));

  logger.log("Sensor Data:");
  logger.log(sensorData);

  const history = await fetchHistory("sensor.power_consumption")
  logger.log("Stat history:");
  logger.log(history);

  chartDT = generateChartData(history);
  logger.exportLogs(false, undefined, true); 

  return exec();
}

async function exec() {
  const consumption = parseInt(sensorData["sensor.power_consumption"] || "0");
  const inverterPower = parseFloat(sensorData["sensor.inverter_grid_power"] || "0");
  const inverterWarningCode = parseFloat(sensorData["sensor.inverter_warning_code"] || "0");
  let theme: string;

  if (inverterWarningCode > 0 ) {
    theme = 'sin';
  } else {
    theme = inverterPower <= 0 ? 'pacific' : 'seablue'; 
  }

  const widget = createWidget({
    chartData: chartDT,
    subtitle1: `${sensorData["sensor.inverter_grid_power"]}W GRID | ${sensorData["sensor.energy_consumption_today"]}kWh TODAY`,
    subtitle2: `UPDATED: ${dateFormatter.string(new Date())}`,
    value: `${consumption}`,
    subValue: `W`,
    headerSymbol: 'bolt.fill',
    header: '  HOME POWER:'
  }, {
    dark: theme,
    light: theme
  });
  Script.setWidget(widget);
  return widget;
}

if (config.runsInApp) {
  const widget = await processData();
  await widget.presentSmall();
} else {
  await processData();
}

Script.complete();
