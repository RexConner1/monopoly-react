export function normalizeHouseCount(
    count: 0 | 1 | 2 | 3 | 4 | "h"
): number {
    return count === "h" ? 5 : count;
}

export function findPropertyIndex(
    properties: any[],
    location: number
): number {
    return properties.findIndex(p => p.posistion === location);
}
