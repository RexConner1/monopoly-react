import { describe, it, expect, vi, beforeEach } from "vitest";
import { applyPropertyCharges } from "../../../../shared/game/actions/applyPropertyCharges";
import { makePlayer } from "../../../test/factories/playerFactory";
import { makeGameContext } from "../../../test/factories/gameContextFactory";

vi.mock("../../../ui/audio/audio", () => ({
    playMoneyMinusSfx: vi.fn(),
}));

vi.mock("../../../ui/notifications/notificationFactory", () => ({
    notifyMessage: vi.fn(),
}));

import { playMoneyMinusSfx } from "../../../ui/audio/audio";
import { notifyMessage } from "../../../ui/notifications/notificationFactory";

describe("applyPropertyCharges", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("calculates house + hotel charges correctly", () => {
        const player = makePlayer({
            id: "p1",
            balance: 1000,
            properties: [
                { position: 1, count: 2, group: "a" },
                { position: 2, count: 3, group: "a" },
                { position: 3, count: "h", group: "a" },
            ],
        });

        const ctx = makeGameContext({
            socketId: "p1",
            clients: new Map([[player.id, player]]),
        });

        applyPropertyCharges({
            player,
            buildingsCost: 10,
            hotelsCost: 50,
            ctx,
        });

        // houses = 2 + 3 = 5 → 5 * 10 = 50
        // hotels = 1 → 1 * 50 = 50
        // total = 100

        expect(player.balance).toBe(900);
    });

    it("triggers animation + sound + notification for local player", () => {
        const player = makePlayer({
            id: "p1",
            balance: 1000,
            properties: [{ position: 1, count: 1, group: "a" }],
        });

        const ctx = makeGameContext({
            socketId: "p1",
            settings: { notifications: true } as any,
            clients: new Map([[player.id, player]]),
        });

        applyPropertyCharges({
            player,
            buildingsCost: 10,
            hotelsCost: 50,
            ctx,
        });

        expect(playMoneyMinusSfx).toHaveBeenCalled();
        expect(ctx.engineRef.current?.applyAnimation).toHaveBeenCalledWith(1);
        expect(notifyMessage).toHaveBeenCalled();
    });

    it("does not trigger UI effects for non-local player", () => {
        const player = makePlayer({
            id: "p2",
            balance: 1000,
            properties: [{ position: 1, count: 1, group: "a" }],
        });

        const ctx = makeGameContext({
            socketId: "p1",
            clients: new Map([[player.id, player]]),
        });

        applyPropertyCharges({
            player,
            buildingsCost: 10,
            hotelsCost: 50,
            ctx,
        });

        expect(playMoneyMinusSfx).not.toHaveBeenCalled();
        expect(ctx.engineRef.current?.applyAnimation).not.toHaveBeenCalled();
        expect(notifyMessage).not.toHaveBeenCalled();
    });
});
