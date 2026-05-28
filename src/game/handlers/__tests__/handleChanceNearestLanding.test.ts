import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleChanceNearestLanding } from "../handleChanceNearestLanding";
import { makePlayer } from "../../../test/factories/playerFactory";
import { makeGameContext } from "../../../test/factories/gameContextFactory";
import type { MoveNearestCard } from "../../../assets/card";

vi.mock("../../../../shared/types/property", async () => {
    const actual = await vi.importActual<typeof import("../../../../shared/types/property")>(
        "../../../../shared/types/property"
    );

    return {
        ...actual,
        getPropertyByPosition: vi.fn(),
    };
});

vi.mock("../../../../shared/game/actions/buyProperty", () => ({
    buyProperty: vi.fn(),
}));

vi.mock("../../../../shared/game/actions/buySpecialProperty", () => ({
    buySpecialProperty: vi.fn(),
}));

vi.mock("../../actions/payChanceRent", () => ({
    payChanceRent: vi.fn(),
}));

vi.mock("../../../../shared/game/actions/finishTurn", () => ({
    finishTurn: vi.fn(),
}));

import { getPropertyByPosition } from "../../../../shared/types/property";
import { buyProperty } from "../../../../shared/game/actions/buyProperty";
import { buySpecialProperty } from "../../../../shared/game/actions/buySpecialProperty";
import { payChanceRent } from "../../actions/payChanceRent";
import { finishTurn } from "../../../../shared/game/actions/finishTurn";

describe("handleChanceNearestLanding", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const makeCard = (): MoveNearestCard => ({
        title: "Advance token to nearest Railroad",
        action: "movenearest",
        groupid: "railroad",
        rentmultiplier: 2,
    });

    it("returns early when the player is not the local socket player", () => {
        const player = makePlayer({
            id: "p2",
            username: "Bob",
            position: 5,
        });

        const ctx = makeGameContext({
            socketId: "p1",
            clients: new Map([[player.id, player]]),
        });

        handleChanceNearestLanding({
            player,
            rolls: 7,
            card: makeCard(),
            ctx,
        });

        expect(ctx.engineRef.current?.setStreet).not.toHaveBeenCalled();
        expect(buyProperty).not.toHaveBeenCalled();
        expect(buySpecialProperty).not.toHaveBeenCalled();
        expect(payChanceRent).not.toHaveBeenCalled();
        expect(finishTurn).not.toHaveBeenCalled();
    });

    it("returns early when there is no property at the player's position", () => {
        const player = makePlayer({
            id: "p1",
            username: "Alice",
            position: 5,
        });

        const ctx = makeGameContext({
            socketId: "p1",
            clients: new Map([[player.id, player]]),
        });

        vi.mocked(getPropertyByPosition).mockReturnValue(undefined);

        handleChanceNearestLanding({
            player,
            rolls: 8,
            card: makeCard(),
            ctx,
        });

        expect(getPropertyByPosition).toHaveBeenCalledWith(5);
        expect(ctx.engineRef.current?.setStreet).not.toHaveBeenCalled();
        expect(finishTurn).not.toHaveBeenCalled();
    });

    it("calls setStreet with the player's location and rolls", () => {
        const player = makePlayer({
            id: "p1",
            username: "Alice",
            position: 15,
        });

        const ctx = makeGameContext({
            socketId: "p1",
            clients: new Map([[player.id, player]]),
        });

        vi.mocked(getPropertyByPosition).mockReturnValue({
            name: "Reading Railroad",
            id: "readingrailroad",
            position: 15,
            group: "Railroad",
        } as any);

        handleChanceNearestLanding({
            player,
            rolls: 9,
            card: makeCard(),
            ctx,
        });

        expect(ctx.engineRef.current?.setStreet).toHaveBeenCalledWith({
            location: 15,
            rolls: 9,
            onResponse: expect.any(Function),
        });
    });

    it("handles 'buy' by calling buyProperty and then finishTurn", () => {
        const player = makePlayer({
            id: "p1",
            username: "Alice",
            position: 15,
        });

        const ctx = makeGameContext({
            socketId: "p1",
            clients: new Map([[player.id, player]]),
        });

        const property = {
            name: "Reading Railroad",
            id: "readingrailroad",
            position: 15,
            group: "Railroad",
            price: 200,
        } as any;

        vi.mocked(getPropertyByPosition).mockReturnValue(property);

        handleChanceNearestLanding({
            player,
            rolls: 9,
            card: makeCard(),
            ctx,
        });

        const setStreetArgs = vi.mocked(ctx.engineRef.current!.setStreet).mock.calls[0][0];
        setStreetArgs.onResponse("buy", {});

        expect(buyProperty).toHaveBeenCalledWith({
            player,
            property,
            ctx,
        });

        expect(finishTurn).toHaveBeenCalledWith({
            localPlayer: player,
            ctx,
        });
    });

    it("handles 'special_action' by calling buySpecialProperty and then finishTurn", () => {
        const player = makePlayer({
            id: "p1",
            username: "Alice",
            position: 12,
        });

        const ctx = makeGameContext({
            socketId: "p1",
            clients: new Map([[player.id, player]]),
        });

        const property = {
            name: "Electric Company",
            id: "electriccompany",
            position: 12,
            group: "Utilities",
            price: 150,
        } as any;

        vi.mocked(getPropertyByPosition).mockReturnValue(property);

        handleChanceNearestLanding({
            player,
            rolls: 5,
            card: {
                title: "Advance token to nearest Utility",
                action: "movenearest",
                groupid: "utility",
                rentmultiplier: 10,
            },
            ctx,
        });

        const setStreetArgs = vi.mocked(ctx.engineRef.current!.setStreet).mock.calls[0][0];
        setStreetArgs.onResponse("special_action", { rolls: 5 });

        expect(buySpecialProperty).toHaveBeenCalledWith({
            player,
            property,
            rolls: 5,
            ctx,
        });

        expect(finishTurn).toHaveBeenCalledWith({
            localPlayer: player,
            ctx,
        });
    });

    it("handles 'someones' by calling payChanceRent with the card rent multiplier", () => {
        const player = makePlayer({
            id: "p1",
            username: "Alice",
            position: 25,
        });

        const ctx = makeGameContext({
            socketId: "p1",
            clients: new Map([[player.id, player]]),
        });

        const property = {
            name: "B. & O. Railroad",
            id: "borailroad",
            position: 25,
            group: "Railroad",
        } as any;

        vi.mocked(getPropertyByPosition).mockReturnValue(property);

        const card: MoveNearestCard = {
            title: "Advance token to nearest Railroad",
            action: "movenearest",
            groupid: "railroad",
            rentmultiplier: 2,
        };

        handleChanceNearestLanding({
            player,
            rolls: 6,
            card,
            ctx,
        });

        const setStreetArgs = vi.mocked(ctx.engineRef.current!.setStreet).mock.calls[0][0];
        setStreetArgs.onResponse("someones", { rolls: 6 });

        expect(payChanceRent).toHaveBeenCalledWith({
            payer: player,
            property,
            location: 25,
            rentMultiplier: 2,
            ctx,
        });

        expect(finishTurn).not.toHaveBeenCalled();
    });

    it("handles the default case by finishing the turn", () => {
        const player = makePlayer({
            id: "p1",
            username: "Alice",
            position: 28,
        });

        const ctx = makeGameContext({
            socketId: "p1",
            clients: new Map([[player.id, player]]),
        });

        const property = {
            name: "Water Works",
            id: "waterworks",
            position: 28,
            group: "Utilities",
        } as any;

        vi.mocked(getPropertyByPosition).mockReturnValue(property);

        handleChanceNearestLanding({
            player,
            rolls: 4,
            card: {
                title: "Advance token to nearest Utility",
                action: "movenearest",
                groupid: "utility",
                rentmultiplier: 10,
            },
            ctx,
        });

        const setStreetArgs = vi.mocked(ctx.engineRef.current!.setStreet).mock.calls[0][0];
        setStreetArgs.onResponse("nothing", {});

        expect(finishTurn).toHaveBeenCalledWith({
            localPlayer: player,
            ctx,
        });
    });
});
