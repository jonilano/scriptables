import { SourceName, createSourceSymbol as createSourceSymbol } from "./lib/utils.symbol";
import { fetchEntityState, fetchEntityStateHistory, adjustDateFrom } from "./lib/home-assistant";
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
    "sensor.inverter_pv_power",
    "sensor.inverter_battery_power",
    "sensor.inverter_warning_code",
];

async function processData() {
    // Ensure sensorData is populated before proceeding
    await Promise.all(Sensors.map(async (sensor) => {
        const entityState = await fetchEntityState(sensor);
        if ("message" in entityState) {
            sensorData[sensor] = entityState.message;
        } else {
            sensorData[sensor] = entityState.state;
        }
    }));

    logger.log("Sensor Data:");
    logger.log(sensorData);

    const startTime = adjustDateFrom(new Date());
    const entityStateHistory = await fetchEntityStateHistory("sensor.power_consumption", startTime);

    logger.log("Stat history:");
    logger.log(entityStateHistory);

    chartDT = generateChartData(entityStateHistory);
    logger.exportLogs(false, undefined, true);

    return exec();
}

async function exec() {
    const consumption = parseInt(sensorData["sensor.power_consumption"] || "0");
    const acPower = parseFloat(sensorData["sensor.inverter_grid_power"] || "0");
    const pvPower = parseFloat(sensorData["sensor.inverter_pv_power"] || "0");
    const batteryPower = parseFloat(sensorData["sensor.inverter_battery_power"] || "0");
    const inverterWarningCode = parseFloat(sensorData["sensor.inverter_warning_code"] || "0");
    let theme: string;

    if (inverterWarningCode > 0) {
        theme = 'sin';
    } else {
        theme = acPower <= 0 ? 'pacific' : 'seablue';
    }

    const pvSymbol = createSourceSymbol({
        source: SourceName.PV,
        isSupplying: pvPower > 0
    });

    const acSymbol = createSourceSymbol({
        source: SourceName.AC,
        isSupplying: acPower > 0
    });

    const batterySymbol = createSourceSymbol({
        source: SourceName.Battery,
        isSupplying: batteryPower < 0
    });

    const widget = createWidget({
        chartData: chartDT,
        // subtitle1: `${sensorData["sensor.inverter_grid_power"]}W GRID | ${sensorData["sensor.energy_consumption_today"]}kWh TODAY`,
        subtitle1: `${sensorData["sensor.energy_consumption_today"]}kWh`,
        subtitle2: `${dateFormatter.string(new Date())}`,
        value: `${consumption}`,
        subValue: `W`,
        headerSymbol: 'bolt.fill',
        header: '  HOME POWER:',
        pvSymbol: pvSymbol,
        acSymbol: acSymbol,
        batterySymbol: batterySymbol,
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
