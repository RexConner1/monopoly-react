import { PlayerProperty, Property } from "../../../assets/types";

export function calculatePropertyRent(
    propAttributes: Property,
    property: PlayerProperty
): number {

        if (property.count === 0) return propAttributes.rent ?? 0;

        if (typeof property.count === "number") {
            return propAttributes.multpliedrent?.[property.count - 1] ?? 0;
        }

        if (property.count === "h") {
            return propAttributes.multpliedrent?.[4] ?? 0;
        }

        return 0;
}
