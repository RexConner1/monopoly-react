import { describe, it, expect } from "vitest";
import { findPropertyOwner } from "../findPropertyOwner";
import { makePlayer } from "../../../../../src/test/factories/playerFactory";

describe("findPropertyOwner", () => {
    it("returns the owner and property when a player owns the location", () => {
        const player1 = makePlayer({
            id: "p1",
            username: "Alice",
        });

        const player2 = makePlayer({
            id: "p2",
            username: "Bob",
            properties: [
                {
                    position: 5,
                    count: 0,
                    group: "Railroad",
                    mortgaged: false,
                },
            ],
        });

        const clients = new Map([
            [player1.id, player1],
            [player2.id, player2],
        ]);

        const result = findPropertyOwner(clients, 5);

        expect(result).not.toBeNull();
        expect(result?.owner.id).toBe("p2");
        expect(result?.owner.username).toBe("Bob");
        expect(result?.prp.position).toBe(5);
        expect(result?.prp.group).toBe("Railroad");
    });

    it("returns null when nobody owns the location", () => {
        const player1 = makePlayer({
            id: "p1",
            properties: [
                {
                    position: 1,
                    count: 0,
                    group: "Purple",
                    mortgaged: false,
                },
            ],
        });

        const player2 = makePlayer({
            id: "p2",
            properties: [
                {
                    position: 3,
                    count: 0,
                    group: "Purple",
                    mortgaged: false,
                },
            ],
        });

        const clients = new Map([
            [player1.id, player1],
            [player2.id, player2],
        ]);

        const result = findPropertyOwner(clients, 39);

        expect(result).toBeNull();
    });

    it("returns the first matching owner found in the clients map", () => {
        const sharedProperty = {
            position: 12,
            count: 0 as const,
            group: "Utilities",
            mortgaged: false,
        };

        const player1 = makePlayer({
            id: "p1",
            username: "Alice",
            properties: [sharedProperty],
        });

        const player2 = makePlayer({
            id: "p2",
            username: "Bob",
            properties: [sharedProperty],
        });

        const clients = new Map([
            [player1.id, player1],
            [player2.id, player2],
        ]);

        const result = findPropertyOwner(clients, 12);

        expect(result).not.toBeNull();
        expect(result?.owner.id).toBe("p1");
    });
});
