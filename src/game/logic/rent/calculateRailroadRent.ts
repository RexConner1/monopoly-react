import { Player } from "../../../assets/player";

const RAILROAD_RENTS = [0, 25, 50, 100, 200];

export function calculateRailroadRent(owner: Player): number {
    const owned = owner.properties.filter(
        v => v.group === "Railroad" && !v.mortgaged
    ).length;

    return RAILROAD_RENTS[owned] ?? 0;
}
