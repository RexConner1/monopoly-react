import { Player } from "../../../assets/player";

const ONE_UTILITY_MULTIPLIER = 4;
const TWO_UTILITIES_MULTIPLIER = 10;

export function calculateUtilityRent(
    owner: Player,
    diceRoll: number
): number {
    const owned = owner.properties.filter(v => v.group === "Utilities").length;

    const multiplier = owned === 2 ? TWO_UTILITIES_MULTIPLIER : ONE_UTILITY_MULTIPLIER;

    return diceRoll * multiplier;
}
