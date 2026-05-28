import { Player } from "../../../../src/assets/player";

const ONE_UTILITY_MULTIPLIER = 4;
const TWO_UTILITIES_MULTIPLIER = 10;

export function calculateUtilityRent(
    owner: Player,
    diceRoll: number
): number {
    const multiplier = calculateUtilityMultiplier(owner);

    return diceRoll * multiplier;
}

export function calculateUtilityMultiplier(
    owner: Player
): number {
    const owned = owner.properties.filter(v => v.group === "Utilities" && !v.mortgaged).length;

    return owned === 2 ? TWO_UTILITIES_MULTIPLIER : ONE_UTILITY_MULTIPLIER;
}
