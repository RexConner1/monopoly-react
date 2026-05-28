import { beforeEach, describe, expect, it, vi } from "vitest";
import { buySpecialProperty } from "../../../../shared/game/actions/buySpecialProperty";
import { makePlayer } from "../../../test/factories/playerFactory";
import { makeGameContext } from "../../../test/factories/gameContextFactory";
import { Property } from "../../../../shared/types/property";

vi.mock("../../../ui/audio/audio", () => ({
    playPurchaseSfx: vi.fn(),
}));

import { playPurchaseSfx } from "../../../ui/audio/audio";

describe("buySpecialProperty", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("deducts the special property price from the player's balance", () => {
        const player = makePlayer({
            id: "p1",
            username: "Alice",
            position: 12,
            balance: 1500,
        });

        const property: Property = {
            name: "Electric Company",
            id: "electriccompany",
            position: 12,
            group: "Utilities",
            price: 150,
        };

        const ctx = makeGameContext({
            socketId: "p1",
            clients: new Map([[player.id, player]]),
        });

        buySpecialProperty({
            player,
            property,
            rolls: 7,
            ctx,
        });

        expect(player.balance).toBe(1350);
    });

    it("adds the property to the player with the current position, group, and rolled rent", () => {
        const player = makePlayer({
            id: "p1",
            username: "Alice",
            position: 12,
            balance: 1500,
            properties: [],
        });

        const property: Property = {
            name: "Electric Company",
            id: "electriccompany",
            position: 12,
            group: "Utilities",
            price: 150,
        };

        const ctx = makeGameContext({
            socketId: "p1",
            clients: new Map([[player.id, player]]),
        });

        buySpecialProperty({
            player,
            property,
            rolls: 7,
            ctx,
        });

        expect(player.properties).toHaveLength(1);
        expect(player.properties[0]).toEqual({
            position: 12,
            count: 0,
            rent: 7,
            group: "Utilities",
        });
    });

    it("notifies when notifications are enabled", () => {
        const player = makePlayer({
            id: "p1",
            username: "Alice",
            position: 12,
            balance: 1500,
        });

        const property: Property = {
            name: "Electric Company",
            id: "electriccompany",
            position: 12,
            group: "Utilities",
            price: 150,
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

        buySpecialProperty({
            player,
            property,
            rolls: 7,
            ctx,
        });

        expect(ctx.notifyRef.current?.message).toHaveBeenCalledWith(
            "150 of money is deducted from the account",
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
            position: 12,
            balance: 1500,
        });

        const property: Property = {
            name: "Electric Company",
            id: "electriccompany",
            position: 12,
            group: "Utilities",
            price: 150,
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

        buySpecialProperty({
            player,
            property,
            rolls: 7,
            ctx,
        });

        expect(ctx.notifyRef.current?.message).not.toHaveBeenCalled();
    });

    it("plays purchase sound and applies the money deduction animation", () => {
        const player = makePlayer({
            id: "p1",
            username: "Alice",
            position: 12,
            balance: 1500,
        });

        const property: Property = {
            name: "Electric Company",
            id: "electriccompany",
            position: 12,
            group: "Utilities",
            price: 150,
        };

        const ctx = makeGameContext({
            socketId: "p1",
            clients: new Map([[player.id, player]]),
        });

        buySpecialProperty({
            player,
            property,
            rolls: 7,
            ctx,
        });

        expect(playPurchaseSfx).toHaveBeenCalledWith(ctx.settings);
        expect(ctx.engineRef.current?.applyAnimation).toHaveBeenCalledWith(1);
    });

    it("emits history using the player id lookup and includes the rent roll", () => {
        const player = makePlayer({
            id: "p1",
            username: "Alice",
            position: 12,
            balance: 1500,
        });

        const property: Property = {
            name: "Electric Company",
            id: "electriccompany",
            position: 12,
            group: "Utilities",
            price: 150,
        };

        const ctx = makeGameContext({
            socketId: "different-socket",
            clients: new Map([[player.id, player]]),
        });

        buySpecialProperty({
            player,
            property,
            rolls: 7,
            ctx,
        });

        expect(ctx.socket.emit).toHaveBeenCalledWith(
            "history",
            expect.objectContaining({
                action: "Alice bought Electric Company with rent of 7",
                time: expect.any(String),
            })
        );
    });

    it("falls back to unknown player and unknown place in history when data is missing", () => {
        const player = makePlayer({
            id: "p1",
            username: "Alice",
            position: 12,
            balance: 1500,
        });

        const property = {
            group: "Utilities",
        } as Property;

        const ctx = makeGameContext({
            socketId: "different-socket",
            clients: new Map(),
        });

        buySpecialProperty({
            player,
            property,
            rolls: 7,
            ctx,
        });

        expect(ctx.socket.emit).toHaveBeenCalledWith(
            "history",
            expect.objectContaining({
                action: "unknown player bought unknown place with rent of 7",
                time: expect.any(String),
            })
        );
    });
});
