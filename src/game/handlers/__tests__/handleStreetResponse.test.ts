import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleStreetResponse } from "../handleStreetResponse";
import { makePlayer } from "../../../test/factories/playerFactory";
import { makeGameContext } from "../../../test/factories/gameContextFactory";
import { Property } from "../../../../shared/types/property";

vi.mock("../../../../shared/game/actions/buyProperty", () => ({
    buyProperty: vi.fn(),
}));

vi.mock("../../actions/advanceProperty", () => ({
    advanceProperty: vi.fn(),
}));

vi.mock("../../actions/payRent", () => ({
    payRent: vi.fn(),
}));

vi.mock("../../actions/buySpecialProperty", () => ({
    buySpecialProperty: vi.fn(),
}));

vi.mock("../../actions/payIncomeTax", () => ({
    payIncomeTax: vi.fn(),
}));

vi.mock("../../actions/payLuxuryTax", () => ({
    payLuxuryTax: vi.fn(),
}));

vi.mock("../../actions/goToJail", () => ({
    goToJail: vi.fn(),
}));

vi.mock("../../actions/finishTurn", () => ({
    finishTurn: vi.fn(),
}));

import { buyProperty } from "../../../../shared/game/actions/buyProperty";
import { advanceProperty } from "../../actions/advanceProperty";
import { payRent } from "../../actions/payRent";
import { buySpecialProperty } from "../../actions/buySpecialProperty";
import { payIncomeTax } from "../../actions/payIncomeTax";
import { payLuxuryTax } from "../../actions/payLuxuryTax";
import { goToJail } from "../../actions/goToJail";
import { finishTurn } from "../../actions/finishTurn";

describe("handleStreetResponse", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
    });

    const makeBase = () => {
        const player = makePlayer({
            id: "p1",
            username: "Alice",
            balance: 1500,
            position: 39,
        });

        const ctx = makeGameContext({
            socketId: "p1",
            clients: new Map([[player.id, player]]),
        });

        const property: Property = {
            name: "Boardwalk",
            id: "boardwalk",
            position: 39,
            group: "darkblue",
            rent: 50,
            multpliedrent: [200, 600, 1400, 1700, 2000],
            price: 400,
            housecost: 200,
            hotelcost: 200,
        };

        return { player, ctx, property };
    };

    it("handles 'buy' by calling buyProperty and then finishTurn", () => {
        const { player, ctx, property } = makeBase();

        handleStreetResponse({
            response: "buy",
            info: undefined,
            player,
            property,
            location: 39,
            ctx,
        });

        expect(buyProperty).toHaveBeenCalledWith({
            player,
            property,
            ctx,
        });

        expect(finishTurn).not.toHaveBeenCalled();

        vi.runAllTimers();

        expect(finishTurn).toHaveBeenCalledWith({
            localPlayer: player,
            ctx,
        });
    });

    it("handles 'advance-buy' by calling advanceProperty with parsed info and then finishTurn", () => {
        const { player, ctx, property } = makeBase();

        handleStreetResponse({
            response: "advance-buy",
            info: {
                state: 3,
                money: 2,
            },
            player,
            property,
            location: 39,
            ctx,
        });

        expect(advanceProperty).toHaveBeenCalledWith({
            player,
            property,
            location: 39,
            state: 3,
            money: 2,
            ctx,
        });

        vi.runAllTimers();

        expect(finishTurn).toHaveBeenCalledWith({
            localPlayer: player,
            ctx,
        });
    });

    it("handles 'someones' by calling payRent with parsed rolls and then finishTurn", () => {
        const { player, ctx, property } = makeBase();

        handleStreetResponse({
            response: "someones",
            info: {
                rolls: 7,
            },
            player,
            property,
            location: 39,
            ctx,
        });

        expect(payRent).toHaveBeenCalledWith({
            payer: player,
            property,
            location: 39,
            rolls: 7,
            ctx,
        });

        vi.runAllTimers();

        expect(finishTurn).toHaveBeenCalledWith({
            localPlayer: player,
            ctx,
        });
    });

    it("handles 'special_action' by calling buySpecialProperty and then finishTurn", () => {
        const { player, ctx, property } = makeBase();

        handleStreetResponse({
            response: "special_action",
            info: {
                rolls: 11,
            },
            player,
            property,
            location: 39,
            ctx,
        });

        expect(buySpecialProperty).toHaveBeenCalledWith({
            player,
            property,
            rolls: 11,
            ctx,
        });

        vi.runAllTimers();

        expect(finishTurn).toHaveBeenCalledWith({
            localPlayer: player,
            ctx,
        });
    });

    it("handles 'nothing' with gotojail by calling goToJail and then finishTurn", () => {
        const { player, ctx } = makeBase();

        const property: Property = {
            name: "Go To Jail",
            id: "gotojail",
            position: 30,
            group: "Special",
        };

        handleStreetResponse({
            response: "nothing",
            info: undefined,
            player,
            property,
            location: 30,
            ctx,
        });

        expect(goToJail).toHaveBeenCalledWith({
            player,
            ctx,
        });

        expect(payIncomeTax).not.toHaveBeenCalled();
        expect(payLuxuryTax).not.toHaveBeenCalled();

        vi.runAllTimers();

        expect(finishTurn).toHaveBeenCalledWith({
            localPlayer: player,
            ctx,
        });
    });

    it("handles 'nothing' with incometax by calling payIncomeTax and then finishTurn", () => {
        const { player, ctx } = makeBase();

        const property: Property = {
            name: "Income Tax",
            id: "incometax",
            position: 4,
            group: "Special",
        };

        handleStreetResponse({
            response: "nothing",
            info: undefined,
            player,
            property,
            location: 4,
            ctx,
        });

        expect(payIncomeTax).toHaveBeenCalledWith({
            player,
            ctx,
        });

        expect(goToJail).not.toHaveBeenCalled();
        expect(payLuxuryTax).not.toHaveBeenCalled();

        vi.runAllTimers();

        expect(finishTurn).toHaveBeenCalledWith({
            localPlayer: player,
            ctx,
        });
    });

    it("handles 'nothing' with luxurytax by calling payLuxuryTax and then finishTurn", () => {
        const { player, ctx } = makeBase();

        const property: Property = {
            name: "Luxury Tax",
            id: "luxurytax",
            position: 38,
            group: "Special",
        };

        handleStreetResponse({
            response: "nothing",
            info: undefined,
            player,
            property,
            location: 38,
            ctx,
        });

        expect(payLuxuryTax).toHaveBeenCalledWith({
            player,
            ctx,
        });

        expect(goToJail).not.toHaveBeenCalled();
        expect(payIncomeTax).not.toHaveBeenCalled();

        vi.runAllTimers();

        expect(finishTurn).toHaveBeenCalledWith({
            localPlayer: player,
            ctx,
        });
    });

    it("for 'nothing' with a normal property, only finishes the turn", () => {
        const { player, ctx, property } = makeBase();

        handleStreetResponse({
            response: "nothing",
            info: undefined,
            player,
            property,
            location: 39,
            ctx,
        });

        expect(goToJail).not.toHaveBeenCalled();
        expect(payIncomeTax).not.toHaveBeenCalled();
        expect(payLuxuryTax).not.toHaveBeenCalled();

        vi.runAllTimers();

        expect(finishTurn).toHaveBeenCalledWith({
            localPlayer: player,
            ctx,
        });
    });
});
