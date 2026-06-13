import { beforeEach, describe, expect, it, vi } from "vitest";
import { moveToTile } from "../../../../shared/game/actions/moveToTile";
import { makePlayer } from "../../../test/factories/playerFactory";
import { makeGameContext } from "../../../test/factories/gameContextFactory";

vi.mock("../../../../shared/types/property", async () => {
    const actual = await vi.importActual<typeof import("../../../../shared/types/property")>("../../../../shared/types/property");

    return {
        ...actual,
        getPropertyById: vi.fn(),
    };
});

vi.mock("../movePlayer", () => ({
    movePlayer: vi.fn(),
}));

import { getPropertyById } from "../../../../shared/types/property";
import { movePlayer } from "../movePlayer";

describe("moveToTile", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns 0 and does not call movePlayer when the tile id is not found", () => {
        const player = makePlayer({
            id: "p1",
            position: 7,
        });

        const ctx = makeGameContext({
            socketId: "p1",
        });

        vi.mocked(getPropertyById).mockReturnValue(undefined);

        const result = moveToTile({
            tileId: "missing-tile",
            player,
            ctx,
            movePlayer
        });

        expect(result).toBe(0);
        expect(movePlayer).not.toHaveBeenCalled();
    });

    it("looks up the tile, calls movePlayer with the tile position, starts the plan, and returns the plan time", () => {
        const player = makePlayer({
            id: "p1",
            position: 7,
        });

        const ctx = makeGameContext({
            socketId: "p1",
        });

        vi.mocked(getPropertyById).mockReturnValue({
            name: "Boardwalk",
            id: "boardwalk",
            position: 39,
            group: "darkblue",
        } as any);

        const start = vi.fn();

        vi.mocked(movePlayer).mockReturnValue({
            start,
            time: 3200,
        });

        const result = moveToTile({
            tileId: "boardwalk",
            player,
            ctx,
            movePlayer
        });

        expect(getPropertyById).toHaveBeenCalledWith("boardwalk");

        expect(movePlayer).toHaveBeenCalledWith({
            finalPosition: 39,
            player,
            ctx,
        });

        expect(start).toHaveBeenCalledTimes(1);
        expect(result).toBe(3200);
    });
});
