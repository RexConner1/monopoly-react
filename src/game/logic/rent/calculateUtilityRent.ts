import { Player } from "../../../assets/player";
import { PlayerProperty } from "../../../assets/types";

const ONE_UTILITY_MULTIPLIER = 4;
const TWO_UTILITIES_MULTIPLIER = 10;

export function calculateUtilityRent(
    property: PlayerProperty,
    player: Player
): number {
    if (property.rent) {
        const utilityCount = player.properties.filter(
            (p: any) => p.group === "Utilities"
        ).length;

        const multiplier = utilityCount === 2 ? TWO_UTILITIES_MULTIPLIER : ONE_UTILITY_MULTIPLIER;
        return property.rent * multiplier
    }

    return 0;
}
