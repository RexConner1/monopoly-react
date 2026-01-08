import { Player } from "../../../assets/player";
import { PlayerProperty, Property } from "../../../assets/types";
import { calculatePropertyRent } from "./calculatePropertyRent";
import { calculateRailroadRent } from "./calculateRailroadRent";
import { calculateUtilityRent } from "./calculateUtilityRent";

export function calculateDisplayedRent(
    property: PlayerProperty,
    player: Player
): number {
    if (property.group === "Railroad") {
        return calculateRailroadRent(player);
    }

    if (property.group === "Utilities") {
        return calculateUtilityRent(property, player);
    }

    return 0;
}

export function calculateRent(
    propAttributes: Property,
    property: PlayerProperty,
    player: Player
): number {
    const special = calculateDisplayedRent(property, player);

    if (!special) {
        return calculatePropertyRent(propAttributes, property);
    }

    return special;
}
