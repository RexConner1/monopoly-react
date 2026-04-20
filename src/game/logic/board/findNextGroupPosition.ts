import { Property } from "../../../assets/property";

export function findNextGroupPosition({
    properties,
    groupId,
    currentPosition,
}: {
    properties: Property[];
    groupId: string;
    currentPosition: number;
}): number | null {
    if (!groupId) return null;

    const group = groupId === "utility" ? "Utilities"
        : groupId === "railroad" ? "Railroad"
        : null;

    if (!group) return null;

    const positions = properties
        .filter((v) => v.group === group)
        .map((v) => v.position)
        .sort((a, b) => a - b);

    if (positions.length === 0) return null;

    // find next greater position
    for (const pos of positions) {
        if (pos > currentPosition) {
            return pos;
        }
    }

    // wrap around
    return positions[0];
}
