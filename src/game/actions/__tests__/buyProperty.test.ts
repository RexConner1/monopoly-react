import { beforeEach, describe, expect, it, vi } from "vitest";
import { buyProperty } from "../buyProperty";
import { makePlayer } from "../../../test/factories/playerFactory";
import { makeGameContext } from "../../../test/factories/gameContextFactory";
import { Property } from "../../../assets/property";

vi.mock("../../../ui/audio/audio", () => ({
    playPurchaseSfx: vi.fn(),
}));

import { playPurchaseSfx } from "../../../ui/audio/audio";

describe("buyProperty", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("deducts the property price from the player's balance", () => {
        const player = makePlayer({
            id: "p1",
            username: "Alice",
            position: 39,
            balance: 1500,
        });

        const property: Property = {
            name: "Boardwalk",
            id: "boardwalk",
            position: 39,
            group: "darkblue",
            price: 400,
        };

        const ctx = makeGameContext({
            socketId: "p1",
            clients: new Map([[player.id, player]]),
        });

        buyProperty({
            player,
            property,
            ctx,
        });

        expect(player.balance).toBe(1100);
    });

    it("adds the purchased property to the player's property list using the player's current position", () => {
        const player = makePlayer({
            id: "p1",
            username: "Alice",
            position: 39,
            balance: 1500,
            properties: [],
        });

        const property: Property = {
            name: "Boardwalk",
            id: "boardwalk",
            position: 39,
            group: "darkblue",
            price: 400,
        };

        const ctx = makeGameContext({
            socketId: "p1",
            clients: new Map([[player.id, player]]),
        });

        buyProperty({
            player,
            property,
            ctx,
        });

        expect(player.properties).toHaveLength(1);
        expect(player.properties[0]).toEqual({
            position: 39,
            count: 0,
            group: "darkblue",
        });
    });

    it("notifies when notifications are enabled", () => {
        const player = makePlayer({
            id: "p1",
            username: "Alice",
            position: 39,
            balance: 1500,
        });

        const property: Property = {
            name: "Boardwalk",
            id: "boardwalk",
            position: 39,
            group: "darkblue",
            price: 400,
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

        buyProperty({
            player,
            property,
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
            position: 39,
            balance: 1500,
        });

        const property: Property = {
            name: "Boardwalk",
            id: "boardwalk",
            position: 39,
            group: "darkblue",
            price: 400,
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

        buyProperty({
            player,
            property,
            ctx,
        });

        expect(ctx.notifyRef.current?.message).not.toHaveBeenCalled();
    });

    it("plays purchase sound and applies the money deduction animation", () => {
        const player = makePlayer({
            id: "p1",
            username: "Alice",
            position: 39,
            balance: 1500,
        });

        const property: Property = {
            name: "Boardwalk",
            id: "boardwalk",
            position: 39,
            group: "darkblue",
            price: 400,
        };

        const ctx = makeGameContext({
            socketId: "p1",
            clients: new Map([[player.id, player]]),
        });

        buyProperty({
            player,
            property,
            ctx,
        });

        expect(playPurchaseSfx).toHaveBeenCalledWith(ctx.settings);
        expect(ctx.engineRef.current?.applyAnimation).toHaveBeenCalledWith(1);
    });

    it("emits history using the socket user as the buyer name", () => {
        const player = makePlayer({
            id: "p1",
            username: "Alice",
            position: 39,
            balance: 1500,
        });

        const property: Property = {
            name: "Boardwalk",
            id: "boardwalk",
            position: 39,
            group: "darkblue",
            price: 400,
        };

        const ctx = makeGameContext({
            socketId: "p1",
            clients: new Map([[player.id, player]]),
        });

        buyProperty({
            player,
            property,
            ctx,
        });

        expect(ctx.socket.emit).toHaveBeenCalledWith(
            "history",
            expect.objectContaining({
                action: "Alice bought Boardwalk",
                time: expect.any(String),
            })
        );
    });

    it("falls back to unknown player in history when the socket user is missing from clients", () => {
        const player = makePlayer({
            id: "p1",
            username: "Alice",
            position: 39,
            balance: 1500,
        });

        const property: Property = {
            name: "Boardwalk",
            id: "boardwalk",
            position: 39,
            group: "darkblue",
            price: 400,
        };

        const ctx = makeGameContext({
            socketId: "p1",
            clients: new Map(),
        });

        buyProperty({
            player,
            property,
            ctx,
        });

        expect(ctx.socket.emit).toHaveBeenCalledWith(
            "history",
            expect.objectContaining({
                action: "unknown player bought Boardwalk",
                time: expect.any(String),
            })
        );
    });
});
