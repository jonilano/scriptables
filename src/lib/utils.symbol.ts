export enum SourceName {
    PV = "PV",
    AC = "AC",
    Battery = "Battery"
}

export interface SourceState {
    source: SourceName,
    isSupplying?: boolean,
    isCharging?: boolean,
    chargeLevel?: number,
    eps?: boolean
}

export function createSourceSymbol({ source, isSupplying = false, isCharging = false, chargeLevel = 0, eps = false }: SourceState): SFSymbol {
    let symbolName = "";
    switch (source) {
        case "PV":
            symbolName = isSupplying
                ? "sun.max.fill"
                : "sun.max.trianglebadge.exclamationmark";
            break;
        case "AC":
            if (eps) {
                symbolName = "bolt.trianglebadge.exclamationmark";
            } else {
                symbolName = isSupplying
                    ? "alternatingcurrent"
                    : "minus";
            }
            break;
        case "Battery":
            symbolName = "batteryblock";
            symbolName += isSupplying || chargeLevel === 100 ? ".fill" : "";
            if (isCharging) {
                symbolName = "bolt." + symbolName;
                symbolName += chargeLevel === 100 ? ".fill" : "";
            }
            break;
        default:
            console.error("Unknown source");
    }
    return SFSymbol.named(symbolName);
}
