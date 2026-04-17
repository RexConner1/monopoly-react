import { beforeEach, describe, expect, it, vi } from "vitest";
import { addFunds } from "../addFunds";
import { makePlayer } from "../../../test/factories/playerFactory";
import { makeGameContext } from "../../../test/factories/gameContextFactory";

vi.mock("../../../ui/audio/audio", () => ({
    playMoneyPlusSfx: vi.fn(),
}));

import { playMoneyPlusSfx } from "../../../ui/audio/audio";

describe("addFunds", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("adds balance for any player", () => {
        const player = makePlayer({
            id: "p2",
            username: "Bob",
            balance: 1500,
        });

        const ctx = makeGameContext({
            socketId: "p1",
        });

        addFunds({
            player,
            amount: 200,
            ctx,
        });

        expect(player.balance).toBe(1700);
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

        addFunds({
            player,
            amount: 75,
            ctx,
        });

        expect(player.balance).toBe(1575);

        expect(ctx.engineRef.current?.applyAnimation).toHaveBeenCalledWith(2);

        expect(ctx.notifyRef.current?.message).toHaveBeenCalledWith(
            "75 of money is added to the account",
            "info",
            2,
            expect.any(Function),
            false
        );

        expect(playMoneyPlusSfx).toHaveBeenCalledWith(ctx.settings);
    });

    it("for a non-local player, only adds balance", () => {
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

        addFunds({
            player,
            amount: 60,
            ctx,
        });

        expect(player.balance).toBe(1560);

        expect(ctx.engineRef.current?.applyAnimation).not.toHaveBeenCalled();
        expect(ctx.notifyRef.current?.message).not.toHaveBeenCalled();
        expect(playMoneyPlusSfx).not.toHaveBeenCalled();
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

        addFunds({
            player,
            amount: 40,
            ctx,
        });

        expect(player.balance).toBe(1540);
        expect(ctx.engineRef.current?.applyAnimation).toHaveBeenCalledWith(2);
        expect(ctx.notifyRef.current?.message).not.toHaveBeenCalled();
        expect(playMoneyPlusSfx).toHaveBeenCalledWith(ctx.settings);
    });
});
