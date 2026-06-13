import { beforeEach, describe, expect, it, vi } from "vitest";
import { moveBySpaces } from "../../../../shared/game/actions/moveBySpaces";
import { makePlayer } from "../../../test/factories/playerFactory";
import { makeGameContext } from "../../../test/factories/gameContextFactory";

vi.mock("../movePlayer", () => ({
    movePlayer: vi.fn(),
}));

import { movePlayer } from "../movePlayer";

describe("moveBySpaces", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("calls movePlayer with the computed forward final position, starts the plan, and returns the plan time", () => {
        const player = makePlayer({
            id: "p1",
            position: 7,
        });

        const ctx = makeGameContext({
            socketId: "p1",
        });

        const start = vi.fn();

        vi.mocked(movePlayer).mockReturnValue({
            start,
            time: 1400,
        });

        const afterFinished = vi.fn();

        const result = moveBySpaces({
            spaces: 6,
            player,
            ctx,
            movePlayer,
            get200whengo: true,
            afterFinished,
        });

        expect(movePlayer).toHaveBeenCalledWith({
            finalPosition: 13,
            player,
            ctx,
            get200whengo: true,
            afterFinished,
            adding: true,
        });

        expect(start).toHaveBeenCalledTimes(1);
        expect(result).toBe(1400);
    });

    it("wraps correctly when moving forward past Go", () => {
        const player = makePlayer({
            id: "p1",
            position: 39,
        });

        const ctx = makeGameContext({
            socketId: "p1",
        });

        const start = vi.fn();

        vi.mocked(movePlayer).mockReturnValue({
            start,
            time: 700,
        });

        moveBySpaces({
            spaces: 3,
            player,
            ctx,
            movePlayer,
        });

        expect(movePlayer).toHaveBeenCalledWith({
            finalPosition: 2,
            player,
            ctx,
            get200whengo: true,
            afterFinished: undefined,
            adding: true,
        });

        expect(start).toHaveBeenCalledTimes(1);
    });

    it("passes adding=false for negative movement and computes the wrapped final position", () => {
        const player = makePlayer({
            id: "p1",
            position: 2,
        });

        const ctx = makeGameContext({
            socketId: "p1",
        });

        const start = vi.fn();

        vi.mocked(movePlayer).mockReturnValue({
            start,
            time: 1050,
        });

        moveBySpaces({
            spaces: -3,
            player,
            ctx,
            movePlayer,
            get200whengo: false,
        });

        expect(movePlayer).toHaveBeenCalledWith({
            finalPosition: -1,
            player,
            ctx,
            get200whengo: false,
            afterFinished: undefined,
            adding: false,
        });

        expect(start).toHaveBeenCalledTimes(1);
    });
});
