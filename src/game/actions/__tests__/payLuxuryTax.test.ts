import { beforeEach, describe, expect, it, vi } from "vitest";
import { payLuxuryTax } from "../payLuxuryTax";
import { makePlayer } from "../../../test/factories/playerFactory";
import { makeGameContext } from "../../../test/factories/gameContextFactory";

vi.mock("../../../ui/audio/audio", () => ({
    playMoneyMinusSfx: vi.fn(),
}));

import { playMoneyMinusSfx } from "../../../ui/audio/audio";

describe("payLuxuryTax", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("deducts $100 from the player's balance", () => {
        const player = makePlayer({
            id: "p1",
            username: "Alice",
            balance: 1500,
        });

        const ctx = makeGameContext({
            socketId: "p1",
            clients: new Map([[player.id, player]]),
        });

        payLuxuryTax({ player, ctx });

        expect(player.balance).toBe(1400);
    });

    it("notifies when notifications are enabled", () => {
        const player = makePlayer({
            id: "p1",
            username: "Alice",
            balance: 1500,
        });

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

        payLuxuryTax({ player, ctx });

        expect(ctx.notifyRef.current?.message).toHaveBeenCalledWith(
            "100 of money is deducted from the account",
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
        });

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

        payLuxuryTax({ player, ctx });

        expect(ctx.notifyRef.current?.message).not.toHaveBeenCalled();
    });

    it("plays money minus sound and applies deduction animation", () => {
        const player = makePlayer({
            id: "p1",
            username: "Alice",
            balance: 1500,
        });

        const ctx = makeGameContext({
            socketId: "p1",
            clients: new Map([[player.id, player]]),
        });

        payLuxuryTax({ player, ctx });

        expect(playMoneyMinusSfx).toHaveBeenCalledWith(ctx.settings);
        expect(ctx.engineRef.current?.applyAnimation).toHaveBeenCalledWith(1);
    });

    it("emits history using the socket user's username", () => {
        const player = makePlayer({
            id: "p1",
            username: "Alice",
            balance: 1500,
        });

        const ctx = makeGameContext({
            socketId: "p1",
            clients: new Map([[player.id, player]]),
        });

        payLuxuryTax({ player, ctx });

        expect(ctx.socket.emit).toHaveBeenCalledWith(
            "history",
            expect.objectContaining({
                action: "Alice paid luxury taxes",
                time: expect.any(String),
            })
        );
    });

    it("falls back to unknown player in history when the socket user is missing", () => {
        const player = makePlayer({
            id: "p1",
            username: "Alice",
            balance: 1500,
        });

        const ctx = makeGameContext({
            socketId: "p1",
            clients: new Map(),
        });

        payLuxuryTax({ player, ctx });

        expect(ctx.socket.emit).toHaveBeenCalledWith(
            "history",
            expect.objectContaining({
                action: "unknown player paid luxury taxes",
                time: expect.any(String),
            })
        );
    });
});
