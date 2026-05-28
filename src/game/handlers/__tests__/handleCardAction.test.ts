import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleCardAction } from "../handleCardAction";
import { makePlayer } from "../../../test/factories/playerFactory";
import { makeGameContext } from "../../../test/factories/gameContextFactory";
import type { ChanceCommunityChestCard } from "../../../assets/card";

vi.mock("../../actions/moveToTile", () => ({
    moveToTile: vi.fn(),
}));

vi.mock("../../actions/moveBySpaces", () => ({
    moveBySpaces: vi.fn(),
}));

vi.mock("../../actions/movePlayer", () => ({
    movePlayer: vi.fn(),
}));

vi.mock("../../actions/addFunds", () => ({
    addFunds: vi.fn(),
}));

vi.mock("../../actions/removeFunds", () => ({
    removeFunds: vi.fn(),
}));

vi.mock("../../../../shared/game/actions/goToJail", () => ({
    goToJail: vi.fn(),
}));

vi.mock("../../actions/addBalanceToOtherPlayers", () => ({
    addBalanceToOtherPlayers: vi.fn(),
}));

vi.mock("../../actions/applyPropertyCharges", () => ({
    applyPropertyCharges: vi.fn(),
}));

vi.mock("../../logic/board/findNextGroupPosition", () => ({
    findNextGroupPosition: vi.fn(),
}));

vi.mock("../handleChanceNearestLanding", () => ({
    handleChanceNearestLanding: vi.fn(),
}));

import { moveToTile } from "../../actions/moveToTile";
import { moveBySpaces } from "../../actions/moveBySpaces";
import { movePlayer } from "../../actions/movePlayer";
import { addFunds } from "../../actions/addFunds";
import { removeFunds } from "../../actions/removeFunds";
import { goToJail } from "../../../../shared/game/actions/goToJail";
import { addBalanceToOtherPlayers } from "../../actions/addBalanceToOtherPlayers";
import { applyPropertyCharges } from "../../actions/applyPropertyCharges";
import { findNextGroupPosition } from "../../logic/board/findNextGroupPosition";
import { handleChanceNearestLanding } from "../handleChanceNearestLanding";
import { properties } from "../../../../shared/types/property";

describe("handleCardAction", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
    });

    const makeBase = () => {
        const player = makePlayer({
            id: "p1",
            username: "Alice",
            position: 7,
            balance: 1500,
            properties: [],
        });

        const ctx = makeGameContext({
            socketId: "p1",
            clients: new Map([[player.id, player]]),
        }) as ReturnType<typeof makeGameContext> & {
            properties: Array<{
                name: string;
                id: string;
                position: number;
                group: string;
            }>;
        };

        ctx.properties = [
            {
                name: "Reading Railroad",
                id: "readingrailroad",
                position: 5,
                group: "Railroad",
            },
            {
                name: "Pennsylvania Railroad",
                id: "pennsylvaniarailroad",
                position: 15,
                group: "Railroad",
            },
            {
                name: "Electric Company",
                id: "electriccompany",
                position: 12,
                group: "Utilities",
            },
            {
                name: "Water Works",
                id: "waterworks",
                position: 28,
                group: "Utilities",
            },
        ];

        return { player, ctx };
    };

    it("handles move cards with tileid by calling moveToTile and finishing turn after the returned delay", () => {
        const { player, ctx } = makeBase();

        vi.mocked(moveToTile).mockReturnValue(1200);

        const card: ChanceCommunityChestCard = {
            title: "Advance to Go",
            action: "move",
            tileid: "go",
        } as ChanceCommunityChestCard;

        handleCardAction({
            card,
            player,
            rolls: 0,
            ctx,
        });

        expect(moveToTile).toHaveBeenCalledWith({
            tileId: "go",
            player,
            ctx,
        });

        expect(ctx.SetClients).not.toHaveBeenCalled();
        expect(ctx.socket.emit).not.toHaveBeenCalledWith("finish-turn", expect.anything());

        vi.advanceTimersByTime(1200);

        expect(ctx.SetClients).toHaveBeenCalledTimes(1);

        const updatedClients = ctx.SetClients.mock.calls[0][0] as Map<string, typeof player>;
        expect(updatedClients.get(player.id)).toBe(player);

        expect(ctx.engineRef.current?.freeDice).toHaveBeenCalledTimes(1);
        expect(ctx.socket.emit).toHaveBeenCalledWith("finish-turn", player.toJson());
    });

    it("handles move cards with count by calling moveBySpaces and finishing turn after the returned delay", () => {
        const { player, ctx } = makeBase();

        vi.mocked(moveBySpaces).mockReturnValue(900);

        const card: ChanceCommunityChestCard = {
            title: "Go Back 3 Spaces",
            action: "move",
            count: -3,
        } as ChanceCommunityChestCard;

        handleCardAction({
            card,
            player,
            rolls: 0,
            ctx,
        });

        expect(moveBySpaces).toHaveBeenCalledWith({
            spaces: -3,
            player,
            ctx,
            get200whengo: true,
            afterFinished: expect.any(Function),
        });

        vi.advanceTimersByTime(900);

        expect(ctx.engineRef.current?.freeDice).toHaveBeenCalledTimes(1);
        expect(ctx.socket.emit).toHaveBeenCalledWith("finish-turn", player.toJson());
    });

    it("handles addfunds by calling addFunds and then finishing turn immediately", () => {
        const { player, ctx } = makeBase();

        const card: ChanceCommunityChestCard = {
            title: "Bank pays you dividend of $50",
            action: "addfunds",
            amount: 50,
        } as ChanceCommunityChestCard;

        handleCardAction({
            card,
            player,
            rolls: 0,
            ctx,
        });

        expect(addFunds).toHaveBeenCalledWith({
            player,
            amount: 50,
            ctx,
        });

        vi.runAllTimers();

        expect(ctx.engineRef.current?.freeDice).toHaveBeenCalledTimes(1);
        expect(ctx.socket.emit).toHaveBeenCalledWith("finish-turn", player.toJson());
    });

    it("handles removefunds by calling removeFunds and then finishing turn immediately", () => {
        const { player, ctx } = makeBase();

        const card: ChanceCommunityChestCard = {
            title: "Pay poor tax of $15",
            action: "removefunds",
            amount: 15,
        } as ChanceCommunityChestCard;

        handleCardAction({
            card,
            player,
            rolls: 0,
            ctx,
        });

        expect(removeFunds).toHaveBeenCalledWith({
            player,
            amount: 15,
            ctx,
        });

        vi.runAllTimers();

        expect(ctx.engineRef.current?.freeDice).toHaveBeenCalledTimes(1);
        expect(ctx.socket.emit).toHaveBeenCalledWith("finish-turn", player.toJson());
    });

    it("handles jail/getout by incrementing getoutCards, updating clients, and finishing turn", () => {
        const { player, ctx } = makeBase();

        const card: ChanceCommunityChestCard = {
            title: "Get Out of Jail Free",
            action: "jail",
            subaction: "getout",
        } as ChanceCommunityChestCard;

        handleCardAction({
            card,
            player,
            rolls: 0,
            ctx,
        });

        expect(player.getoutCards).toBe(1);
        expect(goToJail).not.toHaveBeenCalled();
        expect(ctx.SetClients).toHaveBeenCalledTimes(1);

        vi.runAllTimers();

        expect(ctx.socket.emit).toHaveBeenCalledWith("finish-turn", player.toJson());
    });

    it("handles jail/goto by calling goToJail, updating clients, and finishing turn", () => {
        const { player, ctx } = makeBase();

        const card: ChanceCommunityChestCard = {
            title: "Go to Jail",
            action: "jail",
            subaction: "goto",
        } as ChanceCommunityChestCard;

        handleCardAction({
            card,
            player,
            rolls: 0,
            ctx,
        });

        expect(goToJail).toHaveBeenCalledWith({
            player,
            ctx,
        });

        expect(ctx.SetClients).toHaveBeenCalledTimes(1);

        vi.runAllTimers();

        expect(ctx.socket.emit).toHaveBeenCalledWith("finish-turn", player.toJson());
    });

    it("handles removefundstoplayers by calling addBalanceToOtherPlayers with positive amount, animating for local player, and finishing turn", () => {
        const { player, ctx } = makeBase();

        const card: ChanceCommunityChestCard = {
            title: "Pay each player $50",
            action: "removefundstoplayers",
            amount: 50,
        } as ChanceCommunityChestCard;

        handleCardAction({
            card,
            player,
            rolls: 0,
            ctx,
        });

        expect(addBalanceToOtherPlayers).toHaveBeenCalledWith({
            player,
            amount: 50,
            ctx,
        });

        expect(ctx.engineRef.current?.applyAnimation).toHaveBeenCalledWith(1);

        vi.runAllTimers();

        expect(ctx.socket.emit).toHaveBeenCalledWith("finish-turn", player.toJson());
    });

    it("handles addfundsfromplayers by calling addBalanceToOtherPlayers with negative amount and finishing turn", () => {
        const { player, ctx } = makeBase();

        const card: ChanceCommunityChestCard = {
            title: "Collect $50 from every player",
            action: "addfundsfromplayers",
            amount: 50,
        } as ChanceCommunityChestCard;

        handleCardAction({
            card,
            player,
            rolls: 0,
            ctx,
        });

        expect(addBalanceToOtherPlayers).toHaveBeenCalledWith({
            player,
            amount: -50,
            ctx,
        });

        vi.runAllTimers();

        expect(ctx.socket.emit).toHaveBeenCalledWith("finish-turn", player.toJson());
    });

    it("handles propertycharges by calling applyPropertyCharges and finishing turn", () => {
        const { player, ctx } = makeBase();

        const card: ChanceCommunityChestCard = {
            title: "Street repairs",
            action: "propertycharges",
            buildings: 40,
            hotels: 115,
        } as ChanceCommunityChestCard;

        handleCardAction({
            card,
            player,
            rolls: 0,
            ctx,
        });

        expect(applyPropertyCharges).toHaveBeenCalledWith({
            player,
            buildingsCost: 40,
            hotelsCost: 115,
            ctx,
        });

        vi.runAllTimers();

        expect(ctx.socket.emit).toHaveBeenCalledWith("finish-turn", player.toJson());
    });

    it("handles movenearest by finding the next group position, starting movePlayer, and then calling handleChanceNearestLanding", () => {
        const { player, ctx } = makeBase();

        vi.mocked(findNextGroupPosition).mockReturnValue(15);

        const start = vi.fn();
        vi.mocked(movePlayer).mockReturnValue({
            start,
            time: 2000,
        });

        const card: ChanceCommunityChestCard = {
            title: "Advance token to nearest Railroad",
            action: "movenearest",
            groupid: "railroad",
            rentmultiplier: 2,
        } as ChanceCommunityChestCard;

        handleCardAction({
            card,
            player,
            rolls: 8,
            ctx,
        });

        expect(findNextGroupPosition).toHaveBeenCalledWith({
            properties,
            groupId: "railroad",
            currentPosition: player.position,
        });

        expect(movePlayer).toHaveBeenCalledWith({
            finalPosition: 15,
            player,
            ctx,
        });

        expect(start).toHaveBeenCalledTimes(1);

        expect(ctx.socket.emit).not.toHaveBeenCalledWith("finish-turn", expect.anything());

        vi.advanceTimersByTime(2000);

        expect(handleChanceNearestLanding).toHaveBeenCalledWith({
            player,
            rolls: 8,
            card,
            ctx,
        });

        expect(ctx.engineRef.current?.freeDice).not.toHaveBeenCalled();
    });

    it("returns early for movenearest when no next group position is found", () => {
        const { player, ctx } = makeBase();

        vi.mocked(findNextGroupPosition).mockReturnValue(null);

        const card: ChanceCommunityChestCard = {
            title: "Advance token to nearest Utility",
            action: "movenearest",
            groupid: "utility",
            rentmultiplier: 10,
        } as ChanceCommunityChestCard;

        handleCardAction({
            card,
            player,
            rolls: 6,
            ctx,
        });

        expect(movePlayer).not.toHaveBeenCalled();
        expect(handleChanceNearestLanding).not.toHaveBeenCalled();
        expect(ctx.SetClients).not.toHaveBeenCalled();
        expect(ctx.socket.emit).not.toHaveBeenCalledWith("finish-turn", expect.anything());
    });

    it("does not emit finish-turn when the acting player is not the local socket player", () => {
        const { ctx } = makeBase();

        const remotePlayer = makePlayer({
            id: "p2",
            username: "Bob",
            balance: 1500,
        });

        const card: ChanceCommunityChestCard = {
            title: "Bank pays you dividend of $50",
            action: "addfunds",
            amount: 50,
        } as ChanceCommunityChestCard;

        handleCardAction({
            card,
            player: remotePlayer,
            rolls: 0,
            ctx,
        });

        vi.runAllTimers();

        expect(addFunds).toHaveBeenCalledWith({
            player: remotePlayer,
            amount: 50,
            ctx,
        });

        expect(ctx.engineRef.current?.freeDice).not.toHaveBeenCalled();
        expect(ctx.socket.emit).not.toHaveBeenCalledWith("finish-turn", expect.anything());
    });
});
