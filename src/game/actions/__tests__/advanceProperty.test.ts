import { beforeEach, describe, expect, it, vi } from "vitest";
import { advanceProperty } from "../../../../shared/game/actions/advanceProperty";
import { makePlayer } from "../../../test/factories/playerFactory";
import { makeGameContext } from "../../../test/factories/gameContextFactory";
import { Property } from "../../../../shared/types/property";

vi.mock("../../../ui/audio/audio", () => ({
    playPurchaseSfx: vi.fn(),
}));

import { playPurchaseSfx } from "../../../ui/audio/audio";

describe("advanceProperty", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns early if the player does not own the property at the location", () => {
        const player = makePlayer({
            id: "p1",
            username: "Alice",
            balance: 1500,
            properties: [],
        });

        const property: Property = {
            name: "Boardwalk",
            id: "boardwalk",
            position: 39,
            group: "darkblue",
            housecost: 200,
            hotelcost: 200,
        };

        const ctx = makeGameContext({
            socketId: "p1",
            clients: new Map([[player.id, player]]),
        });

        advanceProperty({
            player,
            property,
            location: 39,
            state: 1,
            money: 1,
            ctx,
        });

        expect(player.balance).toBe(1500);
        expect(ctx.notifyRef.current?.message).not.toHaveBeenCalled();
        expect(ctx.engineRef.current?.applyAnimation).not.toHaveBeenCalled();
        expect(ctx.socket.emit).not.toHaveBeenCalled();
        expect(playPurchaseSfx).not.toHaveBeenCalled();
    });

    it("sets house count and deducts house cost times money", () => {
        const player = makePlayer({
            id: "p1",
            username: "Alice",
            balance: 1500,
            properties: [
                {
                    position: 39,
                    count: 0,
                    group: "darkblue",
                },
            ],
        });

        const property: Property = {
            name: "Boardwalk",
            id: "boardwalk",
            position: 39,
            group: "darkblue",
            housecost: 200,
            hotelcost: 200,
        };

        const ctx = makeGameContext({
            socketId: "p1",
            clients: new Map([[player.id, player]]),
        });

        advanceProperty({
            player,
            property,
            location: 39,
            state: 3,
            money: 2,
            ctx,
        });

        expect(player.properties[0].count).toBe(3);
        expect(player.balance).toBe(1100);
    });

    it("sets hotel count to 'h' and deducts hotel cost when state is 5", () => {
        const player = makePlayer({
            id: "p1",
            username: "Alice",
            balance: 1500,
            properties: [
                {
                    position: 39,
                    count: 4,
                    group: "darkblue",
                },
            ],
        });

        const property: Property = {
            name: "Boardwalk",
            id: "boardwalk",
            position: 39,
            group: "darkblue",
            housecost: 200,
            hotelcost: 300,
        };

        const ctx = makeGameContext({
            socketId: "p1",
            clients: new Map([[player.id, player]]),
        });

        advanceProperty({
            player,
            property,
            location: 39,
            state: 5,
            money: 4,
            ctx,
        });

        expect(player.properties[0].count).toBe("h");
        expect(player.balance).toBe(1200);
    });

    it("notifies when notifications are enabled", () => {
        const player = makePlayer({
            id: "p1",
            username: "Alice",
            balance: 1500,
            properties: [
                {
                    position: 39,
                    count: 0,
                    group: "darkblue",
                },
            ],
        });

        const property: Property = {
            name: "Boardwalk",
            id: "boardwalk",
            position: 39,
            group: "darkblue",
            housecost: 200,
            hotelcost: 300,
        };

        const ctx = makeGameContext({
            socketId: "p1",
            settings: {
                gameEngine: "2d",
                accessibility: [100, 100, false, false, false],
                audio: [100, 100, 100],
                notifications: true,
            },
            clients: new Map([[player.id, player]]),
        });

        advanceProperty({
            player,
            property,
            location: 39,
            state: 2,
            money: 2,
            ctx,
        });

        expect(ctx.notifyRef.current?.message).toHaveBeenCalledWith(
            "400 of money is deducted from the account",
            "info",
            2,
            expect.any(Function),
            false
        );
    });

    it("does not notify when notifications are disabled", () => {
        const player = makePlayer({
            id: "p1",
            username: "Alice",
            balance: 1500,
            properties: [
                {
                    position: 39,
                    count: 0,
                    group: "darkblue",
                },
            ],
        });

        const property: Property = {
            name: "Boardwalk",
            id: "boardwalk",
            position: 39,
            group: "darkblue",
            housecost: 200,
            hotelcost: 300,
        };

        const ctx = makeGameContext({
            socketId: "p1",
            settings: {
                gameEngine: "2d",
                accessibility: [100, 100, false, false, false],
                audio: [100, 100, 100],
                notifications: false,
            },
            clients: new Map([[player.id, player]]),
        });

        advanceProperty({
            player,
            property,
            location: 39,
            state: 2,
            money: 2,
            ctx,
        });

        expect(ctx.notifyRef.current?.message).not.toHaveBeenCalled();
    });

    it("plays purchase sound and applies deduction animation", () => {
        const player = makePlayer({
            id: "p1",
            username: "Alice",
            balance: 1500,
            properties: [
                {
                    position: 39,
                    count: 0,
                    group: "darkblue",
                },
            ],
        });

        const property: Property = {
            name: "Boardwalk",
            id: "boardwalk",
            position: 39,
            group: "darkblue",
            housecost: 200,
            hotelcost: 300,
        };

        const ctx = makeGameContext({
            socketId: "p1",
            clients: new Map([[player.id, player]]),
        });

        advanceProperty({
            player,
            property,
            location: 39,
            state: 1,
            money: 1,
            ctx,
        });

        expect(playPurchaseSfx).toHaveBeenCalledWith(ctx.settings);
        expect(ctx.engineRef.current?.applyAnimation).toHaveBeenCalledWith(1);
    });

    it("emits history using the socket user's username", () => {
        const player = makePlayer({
            id: "p1",
            username: "Alice",
            balance: 1500,
            properties: [
                {
                    position: 39,
                    count: 0,
                    group: "darkblue",
                },
            ],
        });

        const property: Property = {
            name: "Boardwalk",
            id: "boardwalk",
            position: 39,
            group: "darkblue",
            housecost: 200,
            hotelcost: 300,
        };

        const ctx = makeGameContext({
            socketId: "p1",
            clients: new Map([[player.id, player]]),
        });

        advanceProperty({
            player,
            property,
            location: 39,
            state: 1,
            money: 1,
            ctx,
        });

        expect(ctx.socket.emit).toHaveBeenCalledWith(
            "history",
            expect.objectContaining({
                action: "Alice advanced Boardwalk",
                time: expect.any(String),
            })
        );
    });

    it("falls back to unknown player in history when the socket user is missing", () => {
        const player = makePlayer({
            id: "p1",
            username: "Alice",
            balance: 1500,
            properties: [
                {
                    position: 39,
                    count: 0,
                    group: "darkblue",
                },
            ],
        });

        const property: Property = {
            name: "Boardwalk",
            id: "boardwalk",
            position: 39,
            group: "darkblue",
            housecost: 200,
            hotelcost: 300,
        };

        const ctx = makeGameContext({
            socketId: "p1",
            clients: new Map(),
        });

        advanceProperty({
            player,
            property,
            location: 39,
            state: 1,
            money: 1,
            ctx,
        });

        expect(ctx.socket.emit).toHaveBeenCalledWith(
            "history",
            expect.objectContaining({
                action: "unknown player advanced Boardwalk",
                time: expect.any(String),
            })
        );
    });
});
