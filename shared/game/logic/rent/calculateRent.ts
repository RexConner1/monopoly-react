import { Player } from "../../../../src/assets/player";
import { Property } from "../../../../shared/types/property";
import { PlayerProperty } from "../../../../src/assets/types";
import { calculateRailroadRent } from "./calculateRailroadRent";
import { calculateStreetRent } from "./calculateStreetRent";
import { calculateUtilityRent } from "./calculateUtilityRent";

export function calculateRent(
    property: Property,
    owner: Player,
    prp: PlayerProperty,
    diceRoll?: number
): number {
    switch (property.group) {
        case "Utilities":
            return calculateUtilityRent(owner, diceRoll ?? 0);

        case "Railroad":
            return calculateRailroadRent(owner);

        default:
            return calculateStreetRent(property, prp.count);
    }
}
