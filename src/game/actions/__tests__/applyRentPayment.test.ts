import { beforeEach, describe, expect, it, vi } from "vitest";
import { applyRentPayment } from "../../../../shared/game/actions/applyRentPayment";
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

describe("applyRentPayment", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("deducts payer balance", () => {
        const payer = makePlayer({
            id: "p1",
            username: "Alice",
            balance: 1500,
        });

        const owner = makePlayer({
            id: "p2",
            username: "Bob",
            balance: 1500,
        });

        const ctx = makeGameContext({
            socketId: "p1",
            clients: new Map([
                [payer.id, payer],
                [owner.id, owner],
            ]),
        });

        applyRentPayment({
            payer,
            owner,
            amount: 75,
            ctx,
        });

        expect(payer.balance).toBe(1425);
    });

    it("notifies when notifications are enabled", () => {
        const payer = makePlayer({
            id: "p1",
            username: "Alice",
            balance: 1500,
        });

        const owner = makePlayer({
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
            clients: new Map([
                [payer.id, payer],
                [owner.id, owner],
            ]),
        });

        applyRentPayment({
            payer,
            owner,
            amount: 50,
            ctx,
        });

        expect(notifyMessage).toHaveBeenCalledWith(
            ctx.notifyRef,
            "MONEY_DEDUCTED",
            { amount: 50 }
        );
    });

    it("does not notify when notifications are disabled", () => {
        const payer = makePlayer({
            id: "p1",
            username: "Alice",
            balance: 1500,
        });

        const owner = makePlayer({
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
                notifications: false,
            },
            clients: new Map([
                [payer.id, payer],
                [owner.id, owner],
            ]),
        });

        applyRentPayment({
            payer,
            owner,
            amount: 50,
            ctx,
        });

        expect(notifyMessage).not.toHaveBeenCalled();
    });

    it("plays money minus sound and applies the deduction animation", () => {
        const payer = makePlayer({
            id: "p1",
            username: "Alice",
            balance: 1500,
        });

        const owner = makePlayer({
            id: "p2",
            username: "Bob",
            balance: 1500,
        });

        const ctx = makeGameContext({
            socketId: "p1",
            clients: new Map([
                [payer.id, payer],
                [owner.id, owner],
            ]),
        });

        applyRentPayment({
            payer,
            owner,
            amount: 60,
            ctx,
        });

        expect(playMoneyMinusSfx).toHaveBeenCalledWith(ctx.settings);
        expect(ctx.engineRef.current?.applyAnimation).toHaveBeenCalledWith(1);
    });

    it("emits pay and history using player ids and usernames", () => {
        const payer = makePlayer({
            id: "p1",
            username: "Alice",
            balance: 1500,
        });

        const owner = makePlayer({
            id: "p2",
            username: "Bob",
            balance: 1500,
        });

        const ctx = makeGameContext({
            socketId: "p1",
            clients: new Map([
                [payer.id, payer],
                [owner.id, owner],
            ]),
        });

        applyRentPayment({
            payer,
            owner,
            amount: 80,
            ctx,
        });

        expect(ctx.socket.emit).toHaveBeenNthCalledWith(1, "pay", {
            balance: 80,
            from: "p1",
            to: "p2",
        });

        expect(ctx.socket.emit).toHaveBeenNthCalledWith(
            2,
            "history",
            expect.objectContaining({
                action: "Alice paid 80 to Bob",
                time: expect.any(String),
            })
        );
    });

    it("falls back to unknown user when players are missing from clients", () => {
        const payer = makePlayer({
            id: "p1",
            username: "Alice",
            balance: 1500,
        });

        const owner = makePlayer({
            id: "p2",
            username: "Bob",
            balance: 1500,
        });

        const ctx = makeGameContext({
            socketId: "p1",
            clients: new Map(),
        });

        applyRentPayment({
            payer,
            owner,
            amount: 30,
            ctx,
        });

        expect(ctx.socket.emit).toHaveBeenNthCalledWith(
            2,
            "history",
            expect.objectContaining({
                action: "unknown user paid 30 to unknown user",
                time: expect.any(String),
            })
        );
    });
});
