import { describe, it, expect } from "vitest";
import { calculateRailroadRent } from "../calculateRailroadRent";
import { makePlayer } from "../../../../test/factories/playerFactory";

describe("calculateRailroadRent", () => {
    it("returns 25 when the owner has 1 non-mortgaged railroad", () => {
        const owner = makePlayer({
            properties: [
                {
                    position: 5,
                    count: 0,
                    group: "Railroad",
                    mortgaged: false,
                },
            ],
        });

        expect(calculateRailroadRent(owner)).toBe(25);
    });

    it("returns 50 when the owner has 2 non-mortgaged railroads", () => {
        const owner = makePlayer({
            properties: [
                {
                    position: 5,
                    count: 0,
                    group: "Railroad",
                    mortgaged: false,
                },
                {
                    position: 15,
                    count: 0,
                    group: "Railroad",
                    mortgaged: false,
                },
            ],
        });

        expect(calculateRailroadRent(owner)).toBe(50);
    });

    it("returns 100 when the owner has 3 non-mortgaged railroads", () => {
        const owner = makePlayer({
            properties: [
                {
                    position: 5,
                    count: 0,
                    group: "Railroad",
                    mortgaged: false,
                },
                {
                    position: 15,
                    count: 0,
                    group: "Railroad",
                    mortgaged: false,
                },
                {
                    position: 25,
                    count: 0,
                    group: "Railroad",
                    mortgaged: false,
                },
            ],
        });

        expect(calculateRailroadRent(owner)).toBe(100);
    });

    it("returns 200 when the owner has 4 non-mortgaged railroads", () => {
        const owner = makePlayer({
            properties: [
                {
                    position: 5,
                    count: 0,
                    group: "Railroad",
                    mortgaged: false,
                },
                {
                    position: 15,
                    count: 0,
                    group: "Railroad",
                    mortgaged: false,
                },
                {
                    position: 25,
                    count: 0,
                    group: "Railroad",
                    mortgaged: false,
                },
                {
                    position: 35,
                    count: 0,
                    group: "Railroad",
                    mortgaged: false,
                },
            ],
        });

        expect(calculateRailroadRent(owner)).toBe(200);
    });

    it("ignores mortgaged railroads", () => {
        const owner = makePlayer({
            properties: [
                {
                    position: 5,
                    count: 0,
                    group: "Railroad",
                    mortgaged: false,
                },
                {
                    position: 15,
                    count: 0,
                    group: "Railroad",
                    mortgaged: true,
                },
            ],
        });

        expect(calculateRailroadRent(owner)).toBe(25);
    });

    it("returns 0 when the owner has no railroads", () => {
        const owner = makePlayer({
            properties: [
                {
                    position: 1,
                    count: 0,
                    group: "Purple",
                    mortgaged: false,
                },
            ],
        });

        expect(calculateRailroadRent(owner)).toBe(0);
    });
});
