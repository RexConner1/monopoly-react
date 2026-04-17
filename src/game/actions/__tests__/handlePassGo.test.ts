import { beforeEach, describe, expect, it, vi } from "vitest";
import { handlePassGo } from "../handlePassGo";
import { makePlayer } from "../../../test/factories/playerFactory";
import { makeGameContext } from "../../../test/factories/gameContextFactory";

vi.mock("../../../ui/audio/audio", () => ({
    playMoneyPlusSfx: vi.fn(),
}));

import { playMoneyPlusSfx } from "../../../ui/audio/audio";

describe("handlePassGo", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("adds $200 to the player's balance", () => {
        const player = makePlayer({
            id: "p2",
            username: "Bob",
            balance: 1500,
        });

        const ctx = makeGameContext({
            socketId: "p1",
            clients: new Map([[player.id, player]]),
        });

        handlePassGo({ player, ctx });

        expect(player.balance).toBe(1700);
    });

    it("plays the money plus sound effect", () => {
        const player = makePlayer({
            id: "p2",
            username: "Bob",
            balance: 1500,
        });

        const ctx = makeGameContext({
            socketId: "p1",
            clients: new Map([[player.id, player]]),
        });

        handlePassGo({ player, ctx });

        expect(playMoneyPlusSfx).toHaveBeenCalledWith(ctx.settings);
    });

    it("for the local player, notifies and animates when notifications are enabled", () => {
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

        handlePassGo({ player, ctx });

        expect(ctx.notifyRef.current?.message).toHaveBeenCalledWith(
            "200 of money is added to the account",
            "info",
            2,
            expect.any(Function),
            false
        );

        expect(ctx.engineRef.current?.applyAnimation).toHaveBeenCalledWith(2);
    });

    it("for the local player, does not notify when notifications are disabled but still animates", () => {
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

        handlePassGo({ player, ctx });

        expect(ctx.notifyRef.current?.message).not.toHaveBeenCalled();
        expect(ctx.engineRef.current?.applyAnimation).toHaveBeenCalledWith(2);
    });

    it("for a non-local player, does not notify or animate", () => {
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
            clients: new Map([[player.id, player]]),
        });

        handlePassGo({ player, ctx });

        expect(ctx.notifyRef.current?.message).not.toHaveBeenCalled();
        expect(ctx.engineRef.current?.applyAnimation).not.toHaveBeenCalled();
    });

    it("updates clients state with a map containing the updated player", () => {
        const player = makePlayer({
            id: "p1",
            username: "Alice",
            balance: 1500,
        });

        const ctx = makeGameContext({
            socketId: "p1",
            clients: new Map([[player.id, player]]),
        });

        handlePassGo({ player, ctx });

        expect(ctx.SetClients).toHaveBeenCalledTimes(1);

        const passedMap = ctx.SetClients.mock.calls[0][0] as Map<string, typeof player>;

        expect(passedMap).toBeInstanceOf(Map);
        expect(passedMap.get("p1")?.balance).toBe(1700);
    });
});
