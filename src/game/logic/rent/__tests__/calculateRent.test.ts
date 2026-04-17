import { beforeEach, describe, expect, it, vi } from "vitest";
import { calculateRent } from "../calculateRent";
import { makePlayer } from "../../../../test/factories/playerFactory";
import { Property } from "../../../../assets/property";
import { PlayerProperty } from "../../../../assets/types";

vi.mock("../calculateUtilityRent", () => ({
    calculateUtilityRent: vi.fn(),
}));

vi.mock("../calculateRailroadRent", () => ({
    calculateRailroadRent: vi.fn(),
}));

vi.mock("../calculateStreetRent", () => ({
    calculateStreetRent: vi.fn(),
}));

import { calculateUtilityRent } from "../calculateUtilityRent";
import { calculateRailroadRent } from "../calculateRailroadRent";
import { calculateStreetRent } from "../calculateStreetRent";

describe("calculateRent", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("delegates to calculateUtilityRent for Utilities", () => {
        const owner = makePlayer({ id: "p2" });

        const property: Property = {
            name: "Electric Company",
            id: "electriccompany",
            position: 12,
            group: "Utilities",
        };

        const prp: PlayerProperty = {
            position: 12,
            count: 0,
            group: "Utilities",
            mortgaged: false,
        };

        vi.mocked(calculateUtilityRent).mockReturnValue(28);

        const result = calculateRent(property, owner, prp, 7);

        expect(calculateUtilityRent).toHaveBeenCalledWith(owner, 7);
        expect(calculateRailroadRent).not.toHaveBeenCalled();
        expect(calculateStreetRent).not.toHaveBeenCalled();
        expect(result).toBe(28);
    });

    it("delegates to calculateRailroadRent for Railroad", () => {
        const owner = makePlayer({ id: "p2" });

        const property: Property = {
            name: "Reading Railroad",
            id: "readingrailroad",
            position: 5,
            group: "Railroad",
        };

        const prp: PlayerProperty = {
            position: 5,
            count: 0,
            group: "Railroad",
            mortgaged: false,
        };

        vi.mocked(calculateRailroadRent).mockReturnValue(50);

        const result = calculateRent(property, owner, prp, 9);

        expect(calculateRailroadRent).toHaveBeenCalledWith(owner);
        expect(calculateUtilityRent).not.toHaveBeenCalled();
        expect(calculateStreetRent).not.toHaveBeenCalled();
        expect(result).toBe(50);
    });

    it("delegates to calculateStreetRent for normal color-group properties", () => {
        const owner = makePlayer({ id: "p2" });

        const property: Property = {
            name: "Boardwalk",
            id: "boardwalk",
            position: 39,
            group: "darkblue",
            rent: 50,
            multpliedrent: [200, 600, 1400, 1700, 2000],
        };

        const prp: PlayerProperty = {
            position: 39,
            count: 2,
            group: "darkblue",
            mortgaged: false,
        };

        vi.mocked(calculateStreetRent).mockReturnValue(600);

        const result = calculateRent(property, owner, prp, 11);

        expect(calculateStreetRent).toHaveBeenCalledWith(property, 2);
        expect(calculateUtilityRent).not.toHaveBeenCalled();
        expect(calculateRailroadRent).not.toHaveBeenCalled();
        expect(result).toBe(600);
    });

    it("passes 0 as the default dice roll for Utilities when diceRoll is undefined", () => {
        const owner = makePlayer({ id: "p2" });

        const property: Property = {
            name: "Water Works",
            id: "waterworks",
            position: 28,
            group: "Utilities",
        };

        const prp: PlayerProperty = {
            position: 28,
            count: 0,
            group: "Utilities",
            mortgaged: false,
        };

        vi.mocked(calculateUtilityRent).mockReturnValue(0);

        const result = calculateRent(property, owner, prp);

        expect(calculateUtilityRent).toHaveBeenCalledWith(owner, 0);
        expect(result).toBe(0);
    });
});
