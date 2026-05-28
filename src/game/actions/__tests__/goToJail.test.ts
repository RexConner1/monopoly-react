import { beforeEach, describe, expect, it, vi } from "vitest";
import { goToJail } from "../../../../shared/game/actions/goToJail";
import { makePlayer } from "../../../test/factories/playerFactory";
import { makeGameContext } from "../../../test/factories/gameContextFactory";

vi.mock("../../../ui/audio/audio", () => ({
    playJailSfx: vi.fn(),
}));

import { playJailSfx } from "../../../ui/audio/audio";

describe("goToJail", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        document.body.innerHTML = "";
        vi.useFakeTimers();
    });

    it("moves the player to jail and sets jail state", () => {
        const player = makePlayer({
            id: "p1",
            position: 24,
            isInJail: false,
            jailTurnsRemaining: 0,
        });

        const ctx = makeGameContext({
            socketId: "p1",
        });

        const el = document.createElement("div");
        el.className = "player";
        el.setAttribute("player-id", player.id);
        document.body.appendChild(el);

        goToJail({ player, ctx });

        expect(player.position).toBe(10);
        expect(player.isInJail).toBe(true);
        expect(player.jailTurnsRemaining).toBe(3);
    });

    it("plays the jail sound effect", () => {
        const player = makePlayer({
            id: "p1",
        });

        const ctx = makeGameContext({
            socketId: "p1",
        });

        const el = document.createElement("div");
        el.className = "player";
        el.setAttribute("player-id", player.id);
        document.body.appendChild(el);

        goToJail({ player, ctx });

        expect(playJailSfx).toHaveBeenCalledWith(ctx.settings);
    });

    it("applies and later clears the jail animation on the player element", () => {
        const player = makePlayer({
            id: "p1",
        });

        const ctx = makeGameContext({
            socketId: "p1",
        });

        const el = document.createElement("div");
        el.className = "player";
        el.setAttribute("player-id", player.id);
        document.body.appendChild(el);

        goToJail({ player, ctx });

        expect(el.style.animation).toBe("part 0.4s ease-out");

        vi.advanceTimersByTime(400);

        expect(el.style.animation).toBe("");
    });
});
