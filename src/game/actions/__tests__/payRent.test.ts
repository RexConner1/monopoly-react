import { describe, it, expect, vi, beforeEach } from "vitest";
import { payRent } from "../payRent";
import { makePlayer } from "../../../test/factories/playerFactory";
import { makeGameContext } from "../../../test/factories/gameContextFactory";
import { Property } from "../../../assets/property";

vi.mock("../../../ui/audio/audio", () => ({
    playMoneyMinusSfx: vi.fn(),
}));

describe("payRent", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("does nothing when no owner is found", () => {
        const payer = makePlayer({
            id: "p1",
            username: "Alice",
            balance: 1500,
        });

        const property: Property = {
            name: "Boardwalk",
            id: "boardwalk",
            position: 39,
            group: "darkblue",
            rent: 50,
            multpliedrent: [200, 600, 1400, 1700, 2000],
        };

        const ctx = makeGameContext({
            socketId: "p1",
            clients: new Map([[payer.id, payer]]),
        });

        payRent({
            payer,
            property,
            location: 39,
            rolls: 0,
            ctx,
        });

        expect(payer.balance).toBe(1500);
        expect(ctx.engineRef.current?.applyAnimation).not.toHaveBeenCalled();
        expect(ctx.socket.emit).not.toHaveBeenCalledWith(
            "pay",
            expect.anything()
        );
    });

    it("does nothing when the found property is mortgaged", () => {
        const payer = makePlayer({
            id: "p1",
            username: "Alice",
            balance: 1500,
        });

        const owner = makePlayer({
            id: "p2",
            username: "Bob",
            properties: [
                {
                    position: 39,
                    count: 0,
                    group: "darkblue",
                    mortgaged: true,
                },
            ],
        });

        const property: Property = {
            name: "Boardwalk",
            id: "boardwalk",
            position: 39,
            group: "darkblue",
            rent: 50,
            multpliedrent: [200, 600, 1400, 1700, 2000],
        };

        const ctx = makeGameContext({
            socketId: "p1",
            clients: new Map([
                [payer.id, payer],
                [owner.id, owner],
            ]),
        });

        payRent({
            payer,
            property,
            location: 39,
            rolls: 0,
            ctx,
        });

        expect(payer.balance).toBe(1500);
        expect(ctx.engineRef.current?.applyAnimation).not.toHaveBeenCalled();
        expect(ctx.socket.emit).not.toHaveBeenCalledWith(
            "pay",
            expect.anything()
        );
    });

    it("deducts rent, animates, emits pay, and emits history for a normal property", () => {
        const payer = makePlayer({
            id: "p1",
            username: "Alice",
            balance: 1500,
        });

        const owner = makePlayer({
            id: "p2",
            username: "Bob",
            properties: [
                {
                    position: 39,
                    count: 0,
                    group: "darkblue",
                    mortgaged: false,
                },
            ],
        });

        const property: Property = {
            name: "Boardwalk",
            id: "boardwalk",
            position: 39,
            group: "darkblue",
            rent: 50,
            multpliedrent: [200, 600, 1400, 1700, 2000],
        };

        const ctx = makeGameContext({
            socketId: "p1",
            clients: new Map([
                [payer.id, payer],
                [owner.id, owner],
            ]),
        });

        payRent({
            payer,
            property,
            location: 39,
            rolls: 0,
            ctx,
        });

        expect(payer.balance).toBe(1450);

        expect(ctx.notifyRef.current?.message).toHaveBeenCalledWith(
            "50 of money is deducted from the account",
            "info",
            2,
            expect.any(Function),
            false
        );

        expect(ctx.engineRef.current?.applyAnimation).toHaveBeenCalledWith(1);

        expect(ctx.socket.emit).toHaveBeenCalledWith("pay", {
            balance: 50,
            from: "p1",
            to: "p2",
        });

        expect(ctx.socket.emit).toHaveBeenCalledWith(
            "history",
            expect.objectContaining({
                action: "Alice paid 50 to Bob",
                time: expect.any(String),
            })
        );
    });

    it("uses dice roll for utilities", () => {
        const payer = makePlayer({
            id: "p1",
            username: "Alice",
            balance: 1500,
        });

        const owner = makePlayer({
            id: "p2",
            username: "Bob",
            properties: [
                {
                    position: 12,
                    count: 0,
                    group: "Utilities",
                    mortgaged: false,
                },
            ],
        });

        const property: Property = {
            name: "Electric Company",
            id: "electriccompany",
            position: 12,
            group: "Utilities",
        };

        const ctx = makeGameContext({
            socketId: "p1",
            clients: new Map([
                [payer.id, payer],
                [owner.id, owner],
            ]),
        });

        payRent({
            payer,
            property,
            location: 12,
            rolls: 7,
            ctx,
        });

        expect(payer.balance).toBe(1472);

        expect(ctx.socket.emit).toHaveBeenCalledWith("pay", {
            balance: 28,
            from: "p1",
            to: "p2",
        });
    });

    it("uses railroad rent for railroads", () => {
        const payer = makePlayer({
            id: "p1",
            username: "Alice",
            balance: 1500,
        });

        const owner = makePlayer({
            id: "p2",
            username: "Bob",
            properties: [
                {
                    position: 5,
                    count: 0,
                    group: "Railroad",
                    mortgaged: false,
                },
                {
                    position: 15,
                    count: 0,
                    group: "Railroad",
                    mortgaged: false,
                },
            ],
        });

        const property: Property = {
            name: "Reading Railroad",
            id: "readingrailroad",
            position: 5,
            group: "Railroad",
        };

        const ctx = makeGameContext({
            socketId: "p1",
            clients: new Map([
                [payer.id, payer],
                [owner.id, owner],
            ]),
        });

        payRent({
            payer,
            property,
            location: 5,
            rolls: 0,
            ctx,
        });

        expect(payer.balance).toBe(1450);

        expect(ctx.socket.emit).toHaveBeenCalledWith("pay", {
            balance: 50,
            from: "p1",
            to: "p2",
        });
    });
});
