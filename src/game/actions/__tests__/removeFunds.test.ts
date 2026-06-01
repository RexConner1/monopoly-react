import { beforeEach, describe, expect, it, vi } from "vitest";
import { removeFunds } from "../../../../shared/game/actions/removeFunds";
import { makePlayer } from "../../../test/factories/playerFactory";
import { makeGameContext } from "../../../test/factories/gameContextFactory";

vi.mock("../../../ui/audio/audio", () => ({
    playMoneyMinusSfx: vi.fn(),
}));

import { playMoneyMinusSfx } from "../../../ui/audio/audio";

describe("removeFunds", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("deducts balance for any player", () => {
        const player = makePlayer({
            id: "p2",
            username: "Bob",
            balance: 1500,
        });

        const ctx = makeGameContext({
            socketId: "p1",
        });

        removeFunds({
            player,
            amount: 200,
            ctx,
        });

        expect(player.balance).toBe(1300);
    });

    it("for the local player, animates, notifies, and plays sound", () => {
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
        });

        removeFunds({
            player,
            amount: 75,
            ctx,
        });

        expect(player.balance).toBe(1425);

        expect(ctx.engineRef.current?.applyAnimation).toHaveBeenCalledWith(1);

        expect(ctx.notifyRef.current?.message).toHaveBeenCalledWith(
            "75 of money is deducted from the account",
            "info",
            2,
            expect.any(Function),
            false
        );

        expect(playMoneyMinusSfx).toHaveBeenCalledWith(ctx.settings);
    });

    it("for a non-local player, only deducts balance", () => {
        const player = makePlayer({
            id: "p2",
            username: "Bob",
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
        });

        removeFunds({
            player,
            amount: 60,
            ctx,
        });

        expect(player.balance).toBe(1440);

        expect(ctx.engineRef.current?.applyAnimation).not.toHaveBeenCalled();
        expect(ctx.notifyRef.current?.message).not.toHaveBeenCalled();
        expect(playMoneyMinusSfx).not.toHaveBeenCalled();
    });

    it("does not notify when notifications are disabled, but still animates and plays sound for the local player", () => {
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
        });

        removeFunds({
            player,
            amount: 40,
            ctx,
        });

        expect(player.balance).toBe(1460);
        expect(ctx.engineRef.current?.applyAnimation).toHaveBeenCalledWith(1);
        expect(ctx.notifyRef.current?.message).not.toHaveBeenCalled();
        expect(playMoneyMinusSfx).toHaveBeenCalledWith(ctx.settings);
    });
});
