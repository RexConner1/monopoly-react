import { beforeEach, describe, expect, it, vi } from "vitest";
import { payChanceRent } from "../payChanceRent";
import { makePlayer } from "../../../test/factories/playerFactory";
import { makeGameContext } from "../../../test/factories/gameContextFactory";
import { Property } from "../../../assets/property";

vi.mock("../applyRentPayment", () => ({
    applyRentPayment: vi.fn(),
}));

vi.mock("../finishTurn", () => ({
    finishTurn: vi.fn(),
}));

vi.mock("../../logic/rent/calculateRailroadRent", () => ({
    calculateRailroadRent: vi.fn(),
}));

import { applyRentPayment } from "../applyRentPayment";
import { finishTurn } from "../finishTurn";
import { calculateRailroadRent } from "../../logic/rent/calculateRailroadRent";

describe("payChanceRent", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("finishes turn immediately when no owner is found", () => {
        const payer = makePlayer({
            id: "p1",
            username: "Alice",
            balance: 1500,
        });

        const property: Property = {
            name: "Reading Railroad",
            id: "readingrailroad",
            position: 5,
            group: "Railroad",
        };

        const ctx = makeGameContext({
            socketId: "p1",
            clients: new Map([[payer.id, payer]]),
        });

        payChanceRent({
            payer,
            property,
            location: 5,
            rentMultiplier: 2,
            ctx,
        });

        expect(applyRentPayment).not.toHaveBeenCalled();
        expect(finishTurn).toHaveBeenCalledWith({
            localPlayer: payer,
            ctx,
        });
    });

    it("finishes turn immediately when the found property is mortgaged", () => {
        const payer = makePlayer({
            id: "p1",
            username: "Alice",
        });

        const owner = makePlayer({
            id: "p2",
            username: "Bob",
            properties: [
                {
                    position: 5,
                    count: 0,
                    group: "Railroad",
                    mortgaged: true,
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

        payChanceRent({
            payer,
            property,
            location: 5,
            rentMultiplier: 2,
            ctx,
        });

        expect(applyRentPayment).not.toHaveBeenCalled();
        expect(finishTurn).toHaveBeenCalledWith({
            localPlayer: payer,
            ctx,
        });
    });

    it("applies multiplied railroad rent and then finishes turn", () => {
        const payer = makePlayer({
            id: "p1",
            username: "Alice",
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

        vi.mocked(calculateRailroadRent).mockReturnValue(50);

        payChanceRent({
            payer,
            property,
            location: 5,
            rentMultiplier: 2,
            ctx,
        });

        expect(calculateRailroadRent).toHaveBeenCalledWith(owner);

        expect(applyRentPayment).toHaveBeenCalledWith({
            payer,
            owner,
            amount: 100,
            ctx,
        });

        expect(finishTurn).toHaveBeenCalledWith({
            localPlayer: payer,
            ctx,
        });
    });

    it("for utilities emits roll history, shows dice results, applies payment in onDone, and finishes turn", () => {
        const payer = makePlayer({
            id: "p1",
            username: "Alice",
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

        vi.spyOn(Math, "random")
            .mockReturnValueOnce(0)
            .mockReturnValueOnce(0.5);

        type DiceResultsArgs = {
            l: [number, number];
            time: number;
            onDone: () => void;
        };

        (ctx.engineRef.current!.diceResults as any).mockImplementation(
            ({ onDone }: DiceResultsArgs) => {
                onDone();
            }
        );

        payChanceRent({
            payer,
            property,
            location: 12,
            rentMultiplier: 10,
            ctx,
        });

        expect(ctx.socket.emit).toHaveBeenCalledWith(
            "history",
            expect.objectContaining({
                action: expect.stringContaining('Alice rolled [1, 4]'),
                time: expect.any(String),
            })
        );

        expect(ctx.engineRef.current?.diceResults).toHaveBeenCalledWith({
            l: [1, 4],
            time: 2000,
            onDone: expect.any(Function),
        });

        expect(applyRentPayment).toHaveBeenCalledWith({
            payer,
            owner,
            amount: 50,
            ctx,
        });

        expect(finishTurn).toHaveBeenCalledWith({
            localPlayer: payer,
            ctx,
        });
    });
});
