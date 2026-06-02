import { beforeEach, describe, expect, it, vi } from "vitest";
import { addBalanceToOtherPlayers } from "../../../../shared/game/actions/addBalanceToOtherPlayers";
import { makePlayer } from "../../../test/factories/playerFactory";
import { makeGameContext } from "../../../test/factories/gameContextFactory";

vi.mock("../../../ui/notifications/notificationFactory", () => ({
    notifyMessage: vi.fn(),
}));

vi.mock("../../../ui/audio/audio", () => ({
    playMoneyPlusSfx: vi.fn(),
}));

import { notifyMessage } from "../../../ui/notifications/notificationFactory";
import { playMoneyPlusSfx } from "../../../ui/audio/audio";

describe("addBalanceToOtherPlayers", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns 0 when player is undefined", () => {
        const ctx = makeGameContext();

        const result = addBalanceToOtherPlayers({
            player: undefined,
            amount: 50,
            ctx,
        });

        expect(result).toBe(0);
        expect(ctx.socket.emit).not.toHaveBeenCalled();
        expect(ctx.SetClients).not.toHaveBeenCalled();
    });

    it("returns the number of other players", () => {
        const player = makePlayer({
            id: "p1",
            username: "Alice",
            balance: 1500,
        });

        const other1 = makePlayer({
            id: "p2",
            username: "Bob",
            balance: 1500,
        });

        const other2 = makePlayer({
            id: "p3",
            username: "Carol",
            balance: 1500,
        });

        const ctx = makeGameContext({
            socketId: "p1",
            clients: new Map([
                [player.id, player],
                [other1.id, other1],
                [other2.id, other2],
            ]),
        });

        const result = addBalanceToOtherPlayers({
            player,
            amount: 50,
            ctx,
        });

        expect(result).toBe(2);
    });

    it("adds the amount to every other player balance", () => {
        const player = makePlayer({
            id: "p1",
            username: "Alice",
            balance: 1500,
        });

        const other1 = makePlayer({
            id: "p2",
            username: "Bob",
            balance: 1000,
        });

        const other2 = makePlayer({
            id: "p3",
            username: "Carol",
            balance: 900,
        });

        const ctx = makeGameContext({
            socketId: "p1",
            clients: new Map([
                [player.id, player],
                [other1.id, other1],
                [other2.id, other2],
            ]),
        });

        addBalanceToOtherPlayers({
            player,
            amount: 50,
            ctx,
        });

        expect(other1.balance).toBe(1050);
        expect(other2.balance).toBe(950);
        expect(player.balance).toBe(1500);
    });

    it("emits summary history for positive amount when local player initiates", () => {
        const player = makePlayer({
            id: "p1",
            username: "Alice",
        });

        const other1 = makePlayer({
            id: "p2",
            username: "Bob",
        });

        const other2 = makePlayer({
            id: "p3",
            username: "Carol",
        });

        const ctx = makeGameContext({
            socketId: "p1",
            clients: new Map([
                [player.id, player],
                [other1.id, other1],
                [other2.id, other2],
            ]),
        });

        addBalanceToOtherPlayers({
            player,
            amount: 50,
            ctx,
        });

        expect(ctx.socket.emit).toHaveBeenCalledWith(
            "history",
            expect.objectContaining({
                action: "Alice gave 50 money to [Bob, Carol]",
                time: expect.any(String),
            })
        );
    });

    it("emits summary history for negative amount when local player initiates", () => {
        const player = makePlayer({
            id: "p1",
            username: "Alice",
        });

        const other1 = makePlayer({
            id: "p2",
            username: "Bob",
        });

        const other2 = makePlayer({
            id: "p3",
            username: "Carol",
        });

        const ctx = makeGameContext({
            socketId: "p1",
            clients: new Map([
                [player.id, player],
                [other1.id, other1],
                [other2.id, other2],
            ]),
        });

        addBalanceToOtherPlayers({
            player,
            amount: -50,
            ctx,
        });

        expect(ctx.socket.emit).toHaveBeenCalledWith(
            "history",
            expect.objectContaining({
                action: "Alice received 50 money from [Bob, Carol]",
                time: expect.any(String),
            })
        );
    });

    it("does not emit summary history when the initiating player is not the local socket player", () => {
        const player = makePlayer({
            id: "p2",
            username: "Bob",
        });

        const other = makePlayer({
            id: "p1",
            username: "Alice",
        });

        const ctx = makeGameContext({
            socketId: "p1",
            clients: new Map([
                [player.id, player],
                [other.id, other],
            ]),
        });

        addBalanceToOtherPlayers({
            player,
            amount: 50,
            ctx,
        });

        expect(ctx.socket.emit).not.toHaveBeenCalledWith(
            "history",
            expect.objectContaining({
                action: expect.stringContaining("gave"),
            })
        );
    });

    it("notifies and plays sound when a receiving other player is the local socket player and notifications are enabled", () => {
        const player = makePlayer({
            id: "p2",
            username: "Bob",
        });

        const localOther = makePlayer({
            id: "p1",
            username: "Alice",
            balance: 1000,
        });

        const ctx = makeGameContext({
            socketId: "p1",
            settings: {
                gameEngine: "2d",
                accessibility: [100, 100, false, false, false],
                audio: [100, 100, 100],
                notifications: true,
            },
            clients: new Map([
                [player.id, player],
                [localOther.id, localOther],
            ]),
        });

        addBalanceToOtherPlayers({
            player,
            amount: 50,
            ctx,
        });

        expect(localOther.balance).toBe(1050);
        expect(notifyMessage).toHaveBeenCalledWith(
            ctx.notifyRef,
            "MONEY_ADDED",
            { amount: 50 }
        );
        expect(playMoneyPlusSfx).toHaveBeenCalledWith(ctx.settings);
    });

    it("does not notify or play sound when notifications are disabled", () => {
        const player = makePlayer({
            id: "p2",
            username: "Bob",
        });

        const localOther = makePlayer({
            id: "p1",
            username: "Alice",
            balance: 1000,
        });

        const ctx = makeGameContext({
            socketId: "p1",
            settings: {
                gameEngine: "2d",
                accessibility: [100, 100, false, false, false],
                audio: [100, 100, 100],
                notifications: false,
            },
            clients: new Map([
                [player.id, player],
                [localOther.id, localOther],
            ]),
        });

        addBalanceToOtherPlayers({
            player,
            amount: 50,
            ctx,
        });

        expect(notifyMessage).not.toHaveBeenCalled();
        expect(playMoneyPlusSfx).not.toHaveBeenCalled();
    });

    it("updates clients with a new map containing the changed other players", () => {
        const player = makePlayer({
            id: "p1",
            username: "Alice",
        });

        const other = makePlayer({
            id: "p2",
            username: "Bob",
            balance: 1000,
        });

        const originalClients = new Map([
            [player.id, player],
            [other.id, other],
        ]);

        const ctx = makeGameContext({
            socketId: "p1",
            clients: originalClients,
        });

        addBalanceToOtherPlayers({
            player,
            amount: 25,
            ctx,
        });

        expect(ctx.SetClients).toHaveBeenCalledTimes(1);

        const passedMap = ctx.SetClients.mock.calls[0][0] as Map<string, typeof player>;

        expect(passedMap).toBeInstanceOf(Map);
        expect(passedMap).not.toBe(originalClients);
        expect(passedMap.get("p2")?.balance).toBe(1025);
    });

    it("emits pay events for positive amount when local player initiates", () => {
        const player = makePlayer({
            id: "p1",
            username: "Alice",
        });

        const other1 = makePlayer({
            id: "p2",
            username: "Bob",
        });

        const other2 = makePlayer({
            id: "p3",
            username: "Carol",
        });

        const ctx = makeGameContext({
            socketId: "p1",
            clients: new Map([
                [player.id, player],
                [other1.id, other1],
                [other2.id, other2],
            ]),
        });

        addBalanceToOtherPlayers({
            player,
            amount: 50,
            ctx,
        });

        expect(ctx.socket.emit).toHaveBeenCalledWith("pay", {
            balance: 50,
            from: "p1",
            to: "p2",
        });

        expect(ctx.socket.emit).toHaveBeenCalledWith("pay", {
            balance: 50,
            from: "p1",
            to: "p3",
        });
    });

    it("emits pay events for negative amount when local player initiates", () => {
        const player = makePlayer({
            id: "p1",
            username: "Alice",
        });

        const other = makePlayer({
            id: "p2",
            username: "Bob",
        });

        const ctx = makeGameContext({
            socketId: "p1",
            clients: new Map([
                [player.id, player],
                [other.id, other],
            ]),
        });

        addBalanceToOtherPlayers({
            player,
            amount: -50,
            ctx,
        });

        expect(ctx.socket.emit).toHaveBeenCalledWith("pay", {
            balance: -50,
            from: "p2",
            to: "p1",
        });
    });

    it("emits the per-player history line for negative amount", () => {
        const player = makePlayer({
            id: "p1",
            username: "Alice",
        });

        const other = makePlayer({
            id: "p2",
            username: "Bob",
        });

        const ctx = makeGameContext({
            socketId: "p1",
            clients: new Map([
                [player.id, player],
                [other.id, other],
            ]),
        });

        addBalanceToOtherPlayers({
            player,
            amount: -50,
            ctx,
        });

        expect(ctx.socket.emit).toHaveBeenCalledWith(
            "history",
            expect.objectContaining({
                action: "Alice pay -50 to Alice",
                time: expect.any(String),
            })
        );
    });
});
