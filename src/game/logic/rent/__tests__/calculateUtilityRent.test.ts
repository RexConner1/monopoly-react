import { describe, it, expect } from "vitest";
import { calculateUtilityRent } from "../calculateUtilityRent";
import { makePlayer } from "../../../../test/factories/playerFactory";

describe("calculateUtilityRent", () => {
    it("returns diceRoll * 4 when the owner has 1 utility", () => {
        const owner = makePlayer({
            properties: [
                {
                    position: 12,
                    count: 0,
                    group: "Utilities",
                    mortgaged: false,
                },
            ],
        });

        expect(calculateUtilityRent(owner, 7)).toBe(28);
    });

    it("returns diceRoll * 10 when the owner has 2 utilities", () => {
        const owner = makePlayer({
            properties: [
                {
                    position: 12,
                    count: 0,
                    group: "Utilities",
                    mortgaged: false,
                },
                {
                    position: 28,
                    count: 0,
                    group: "Utilities",
                    mortgaged: false,
                },
            ],
        });

        expect(calculateUtilityRent(owner, 7)).toBe(70);
    });

    it("returns 0 when the diceRoll is 0", () => {
        const owner = makePlayer({
            properties: [
                {
                    position: 12,
                    count: 0,
                    group: "Utilities",
                    mortgaged: false,
                },
            ],
        });

        expect(calculateUtilityRent(owner, 0)).toBe(0);
    });

    it("uses the one-utility multiplier when the owner has no utilities", () => {
        const owner = makePlayer({
            properties: [],
        });

        expect(calculateUtilityRent(owner, 8)).toBe(32);
    });

    it("counts utility properties only", () => {
        const owner = makePlayer({
            properties: [
                {
                    position: 12,
                    count: 0,
                    group: "Utilities",
                    mortgaged: false,
                },
                {
                    position: 5,
                    count: 0,
                    group: "Railroad",
                    mortgaged: false,
                },
                {
                    position: 1,
                    count: 0,
                    group: "Purple",
                    mortgaged: false,
                },
            ],
        });

        expect(calculateUtilityRent(owner, 6)).toBe(24);
    });
});
