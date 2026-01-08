"use strict";

const {
  createSourceSymbol,
  SourceName
} = importModule("./lib/utils.symbol");
const {
  adjustDateFrom,
  fetchEntityState,
  fetchEntityStateHistory
} = importModule("./lib/home-assistant");
const {
  generateChartData
} = importModule("./lib/chart-data"); // @ts-expect-error ignore
const Logger = importModule("./lib/Logger.js");
const {
  createWidget
} = importModule("./lib/tiny-dashboard");
const CACHE_FILE = "ha-power-cache.json";
function saveCache(data) {
  const fm = FileManager.local();
  const path = fm.joinPath(fm.documentsDirectory(), CACHE_FILE);
  fm.writeString(path, JSON.stringify({
    ts: Date.now(),
    data
  }));
}
function loadCache() {
  const fm = FileManager.local();
  const path = fm.joinPath(fm.documentsDirectory(), CACHE_FILE);
  if (!fm.fileExists(path)) return null;
  try {
    return JSON.parse(fm.readString(path));
  } catch {
    return null;
  }
}
const logger = new Logger();
const dateFormatter = new DateFormatter();
dateFormatter.useShortTimeStyle();
let chartDT;
const sensorData = {};
const Sensors = ["sensor.energy_consumption_today", "sensor.power_consumption", "sensor.inverter_grid_power", "sensor.inverter_pv_power", "sensor.inverter_battery_power", "sensor.inverter_warning_code", "sensor.lxp_ba10300188_state_of_charge", "binary_sensor.inverter_solar_powering_home", "binary_sensor.inverter_grid_powering_home", "binary_sensor.inverter_battery_powering_home", "binary_sensor.inverter_solar_charging_battery", "binary_sensor.inverter_grid_charging_battery", "binary_sensor.inverter_exporting_to_grid"];
async function processData() {
  // Ensure sensorData is populated before proceeding
  await Promise.all(Sensors.map(async sensor => {
    const entityState = await fetchEntityState(sensor);
    if ("message" in entityState && entityState.message === "offline") {
      throw new Error("HA_OFFLINE");
    }
    sensorData[sensor] = "message" in entityState ? entityState.message : entityState.state;
    // const entityState = await fetchEntityState(sensor);
    // if ("message" in entityState) {
    //   sensorData[sensor] = entityState.message;
    // } else {
    //   sensorData[sensor] = entityState.state;
    // }
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
  const consumption = Number.parseInt(sensorData["sensor.power_consumption"] || "0");
  const acPower = Number.parseFloat(sensorData["sensor.inverter_grid_power"] || "0");
  const pvPower = Number.parseFloat(sensorData["sensor.inverter_pv_power"] || "0");
  const chargeLevel = Number.parseInt(sensorData["sensor.lxp_ba10300188_state_of_charge"] || "0");
  const batteryPower = Number.parseFloat(sensorData["sensor.inverter_battery_power"] || "0");
  const inverterWarningCode = Number.parseFloat(sensorData["sensor.inverter_warning_code"] || "0");
  let theme;
  const flags = {
    fault: sensorData["binary_sensor.inverter_fault"] === "on",
    solarHome: sensorData["binary_sensor.inverter_solar_powering_home"] === "on",
    gridHome: sensorData["binary_sensor.inverter_grid_powering_home"] === "on",
    battHome: sensorData["binary_sensor.inverter_battery_powering_home"] === "on",
    solarCharge: sensorData["binary_sensor.inverter_solar_charging_battery"] === "on",
    gridCharge: sensorData["binary_sensor.inverter_grid_charging_battery"] === "on",
    exporting: sensorData["binary_sensor.inverter_exporting_to_grid"] === "on"
  };
  const statusLines = [];
  if (flags.fault) {
    statusLines.push("🛑 Inverter Fault");
  } else {
    if (flags.solarHome) statusLines.push("☀ Solar Powering Home");
    if (flags.battHome) statusLines.push("🔋 Battery Powering Home");
    if (flags.gridHome) statusLines.push("🔌 Grid Powering Home");
    if (flags.solarCharge) statusLines.push("🔆 Solar Charging Battery");
    if (flags.gridCharge) statusLines.push("⚡ Grid Charging Battery");
    if (flags.exporting) statusLines.push("⚡ Exporting to Grid");

    // if (statusLines.length === 0) statusLines.push("😴 Idle / No Power Flow");
  }
  if (statusLines.length === 0) statusLines.push("😴 Idle / No Power Flow");
  const inverterStatusText = statusLines.join("\n");
  saveCache({
    consumption,
    inverterStatusText: statusLines,
    chartDT
  });
  if (inverterWarningCode > 0) {
    theme = "sin";
  } else {
    theme = acPower <= 0 ? "pacific" : "seablue";
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
    isSupplying: batteryPower < 0,
    isCharging: batteryPower > 0,
    chargeLevel: chargeLevel
  });
  const clockSymbol = createSourceSymbol({
    source: SourceName.Clock
  });
  const widget = createWidget({
    chartData: chartDT,
    // subtitle1: `${sensorData["sensor.energy_consumption_today"]}kWh`,
    subtitle1: inverterStatusText,
    subtitle2: `🟢 ${dateFormatter.string(new Date())}`,
    value: `${consumption}`,
    subValue: "W",
    headerSymbol: "bolt.fill",
    header: "  HOME POWER:",
    pvSymbol: pvSymbol,
    acSymbol: acSymbol,
    batterySymbol: batterySymbol,
    clockSymbol: clockSymbol
  }, {
    dark: theme,
    light: theme
  });
  Script.setWidget(widget);
  return widget;
}

// try {
//   if (config.runsInApp) {
//     const widget = await processData();
//     await widget.presentSmall();
//   } else {
//     await processData();
//   }
// } catch {
//   const w = new ListWidget();
//   w.backgroundColor = new Color("#1c1c1e");
//
//   const t = w.addText("Home Assistant");
//   t.font = Font.semiboldSystemFont(14);
//   t.textColor = Color.white();
//
//   w.addSpacer(6);
//
//   const s = w.addText("System Offline");
//   s.font = Font.boldSystemFont(16);
//   s.textColor = new Color("#ff453a");
//
//   Script.setWidget(w);
// }
// // if (config.runsInApp) {
// //   const widget = await processData();
// //   await widget.presentSmall();
// // } else {
// //   await processData();
// // }
//
// Script.complete();

try {
  if (config.runsInApp) {
    const widget = await processData();
    await widget.presentSmall();
  } else {
    await processData();
  }
} catch {
  const cache = loadCache();
  if (cache) {
    // const ageMin = Math.round((Date.now() - cache.ts) / 60000);
    const ageMin = cache.ts;
    const pvSymbol = createSourceSymbol({
      source: SourceName.PV,
      isSupplying: false
    });
    const acSymbol = createSourceSymbol({
      source: SourceName.AC,
      isSupplying: false
    });
    const batterySymbol = createSourceSymbol({
      source: SourceName.Battery,
      isSupplying: false
    });
    const clockSymbol = createSourceSymbol({
      source: SourceName.Clock
    });
    const widget = createWidget({
      chartData: cache.data.chartDT,
      subtitle1: cache.data.inverterStatusText.join("\n"),
      // subtitle2: `🕒 Cached ${ageMin} min ago`,
      subtitle2: `🟠 ${dateFormatter.string(new Date(ageMin))} (cached)`,
      value: `${cache.data.consumption}`,
      subValue: "W",
      headerSymbol: "bolt.fill",
      header: "  HOME POWER:",
      pvSymbol,
      acSymbol,
      batterySymbol,
      clockSymbol
    }, {
      dark: "pacific",
      light: "pacific"
    });
    Script.setWidget(widget);
    // Script.complete();
  }

  // true offline, no cache
  // const w = new ListWidget();
  // w.backgroundColor = new Color("#1c1c1e");
  //
  // const t = w.addText("🏠 Home Assistant");
  // t.font = Font.semiboldSystemFont(14);
  // t.textColor = Color.white();
  //
  // w.addSpacer(6);
  //
  // const s = w.addText("System Offline");
  // s.font = Font.boldSystemFont(16);
  // s.textColor = new Color("#ff453a");
  //
  // Script.setWidget(w);
}
Script.complete();