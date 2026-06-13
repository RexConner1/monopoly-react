import { describe, expect, it } from "vitest";
import { findNextGroupPosition } from "../../../../../shared/game/logic/board/findNextGroupPosition";

const mockProperties = [
    { group: "Utilities", position: 12 },
    { group: "Utilities", position: 28 },
    { group: "Railroad", position: 5 },
    { group: "Railroad", position: 15 },
    { group: "Railroad", position: 25 },
    { group: "Railroad", position: 35 },
] as any;

describe("findNextGroupPosition", () => {
    it("finds next utility ahead", () => {
        expect(
            findNextGroupPosition({
                properties: mockProperties,
                groupId: "utility",
                currentPosition: 10,
            })
        ).toBe(12);
    });

    it("wraps around for utilities", () => {
        expect(
            findNextGroupPosition({
                properties: mockProperties,
                groupId: "utility",
                currentPosition: 30,
            })
        ).toBe(12);
    });

    it("finds next railroad ahead", () => {
        expect(
            findNextGroupPosition({
                properties: mockProperties,
                groupId: "railroad",
                currentPosition: 16,
            })
        ).toBe(25);
    });

    it("wraps around for railroad", () => {
        expect(
            findNextGroupPosition({
                properties: mockProperties,
                groupId: "railroad",
                currentPosition: 36,
            })
        ).toBe(5);
    });

    it("returns null if groupId is invalid", () => {
        expect(
            findNextGroupPosition({
                properties: mockProperties,
                groupId: "unknown",
                currentPosition: 10,
            })
        ).toBeNull();
    });
});
