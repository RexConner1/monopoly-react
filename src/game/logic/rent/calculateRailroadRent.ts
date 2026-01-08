import { Player } from "../../../assets/player";

const RAILROAD_RENTS = [0, 25, 50, 100, 200];

export function calculateRailroadRent(
    player: Player
): number {
    const railroadCount = player.properties.filter(
        (p) =>
            p.group === "Railroad" &&
            (p.morgage === undefined || p.morgage === false)
    ).length;

    return RAILROAD_RENTS[railroadCount] ?? 0;
}
