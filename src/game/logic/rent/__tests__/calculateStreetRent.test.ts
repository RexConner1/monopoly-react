import { describe, it, expect } from "vitest";
import { calculateStreetRent } from "../calculateStreetRent";
import { Property } from "../../../../assets/property";

describe("calculateStreetRent", () => {
    const property: Property = {
        name: "Boardwalk",
        id: "boardwalk",
        position: 39,
        group: "darkblue",
        rent: 50,
        multpliedrent: [200, 600, 1400, 1700, 2000],
    };

    it("returns base rent when buildingCount is 0", () => {
        expect(calculateStreetRent(property, 0)).toBe(50);
    });

    it("returns base rent when buildingCount is undefined", () => {
        expect(calculateStreetRent(property)).toBe(50);
    });

    it("returns the correct rent for 1 through 4 houses", () => {
        expect(calculateStreetRent(property, 1)).toBe(200);
        expect(calculateStreetRent(property, 2)).toBe(600);
        expect(calculateStreetRent(property, 3)).toBe(1400);
        expect(calculateStreetRent(property, 4)).toBe(1700);
    });

    it("returns the hotel rent when buildingCount is 'h'", () => {
        expect(calculateStreetRent(property, "h")).toBe(2000);
    });

    it("returns 0 when multiplied rent data is missing for houses", () => {
        const noMultipliedRent: Property = {
            name: "Test Property",
            id: "test-property",
            position: 1,
            group: "Purple",
            rent: 2,
        };

        expect(calculateStreetRent(noMultipliedRent, 1)).toBe(0);
    });

    it("returns 0 when property has no rent and no multiplied rent", () => {
        const noRentData: Property = {
            name: "Test Property",
            id: "test-property-2",
            position: 3,
            group: "Purple",
        };

        expect(calculateStreetRent(noRentData)).toBe(0);
        expect(calculateStreetRent(noRentData, 2)).toBe(0);
        expect(calculateStreetRent(noRentData, "h")).toBe(0);
    });
});
