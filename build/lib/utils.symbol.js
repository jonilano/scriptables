"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SourceName = void 0;
exports.createSourceSymbol = createSourceSymbol;
let SourceName = exports.SourceName = /*#__PURE__*/function (SourceName) {
  SourceName["PV"] = "PV";
  SourceName["AC"] = "AC";
  SourceName["Battery"] = "Battery";
  return SourceName;
}({});
function createSourceSymbol({
  source,
  isSupplying = false,
  isCharging = false,
  chargeLevel = 0,
  eps = false
}) {
  let symbolName = "";
  switch (source) {
    case "PV":
      symbolName = isSupplying ? "sun.max.fill" : "sun.max.trianglebadge.exclamationmark";
      break;
    case "AC":
      if (eps) {
        symbolName = "bolt.trianglebadge.exclamationmark";
      } else {
        symbolName = isSupplying ? "alternatingcurrent" : "minus";
      }
      break;
    case "Battery":
      symbolName = "batteryblock";
      symbolName += isSupplying ? ".fill" : "";
      if (isCharging) {
        symbolName = `bolt.${symbolName}`;
        symbolName = chargeLevel === 100 ? `${symbolName}.fill` : symbolName;
      }
      break;
    default:
      console.error("Unknown source");
  }
  return SFSymbol.named(symbolName);
}