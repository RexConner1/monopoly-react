import { Player } from "../../assets/player";

export function calculateDisplayedRent(
    property: any,
    player: Player
): number {
    if (property.group === "Railroad") {
        const railroadCount = player.properties.filter(
            (p: any) =>
                p.group === "Railroad" &&
                (p.morgage === undefined || p.morgage === false)
        ).length;

        const rents = [0, 25, 50, 100, 200];
        return rents[railroadCount] ?? 0;
    }

    if (property.group === "Utilities" && property.rent) {
        const utilityCount = player.properties.filter(
            (p: any) => p.group === "Utilities"
        ).length;

        const multiplier = utilityCount === 2 ? 10 : 4;
        return property.rent * multiplier;
    }

    if (property.count === 0) return property.rent ?? 0;

    return 0;
}
