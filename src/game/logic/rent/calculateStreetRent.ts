import { Property } from "../../../assets/property";

export function calculateStreetRent(
    property: Property,
    buildingCount?: number | "h"
): number {
    // no houses
    if (buildingCount === 0 || buildingCount === undefined) {
        return property.rent ?? 0;
    }

    // houses (1–4)
    if (typeof buildingCount === "number") {
        return property.multpliedrent?.[buildingCount - 1] ?? 0;
    }

    // hotel
    if (buildingCount === "h") {
        return property.multpliedrent?.[4] ?? 0;
    }

    return 0;
}
