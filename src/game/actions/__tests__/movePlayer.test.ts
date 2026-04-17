import { beforeEach, describe, expect, it, vi } from "vitest";
import { movePlayer } from "../movePlayer";
import { makePlayer } from "../../../test/factories/playerFactory";
import { makeGameContext } from "../../../test/factories/gameContextFactory";

vi.mock("../../../ui/audio/audio", () => ({
    playStepSfx: vi.fn(),
}));

vi.mock("../handlePassGo", () => ({
    handlePassGo: vi.fn(),
}));

import { playStepSfx } from "../../../ui/audio/audio";
import { handlePassGo } from "../handlePassGo";

describe("movePlayer", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        document.body.innerHTML = "";
    });

    it("returns a plan with the correct total time", () => {
        const player = makePlayer({
            id: "p1",
            position: 7,
        });

        const ctx = makeGameContext({
            socketId: "p1",
        });

        const plan = movePlayer({
            finalPosition: 13,
            player,
            ctx,
        });

        expect(plan.time).toBe(2100);
        expect(typeof plan.start).toBe("function");
    });

    it("moves the player to the final position and calls afterFinished", () => {
        const player = makePlayer({
            id: "p1",
            position: 7,
        });

        const ctx = makeGameContext({
            socketId: "p1",
        });

        const element = document.createElement("div");
        element.className = "player";
        element.setAttribute("player-id", player.id);
        document.body.appendChild(element);

        const afterFinished = vi.fn();

        const plan = movePlayer({
            finalPosition: 9,
            player,
            ctx,
            afterFinished,
        });

        plan.start();

        vi.advanceTimersByTime(plan.time);

        expect(player.position).toBe(9);
        expect(afterFinished).toHaveBeenCalledTimes(1);
        expect(playStepSfx).toHaveBeenCalledTimes(2);
    });

    it("calls handlePassGo exactly once when moving forward across Go", () => {
        const player = makePlayer({
            id: "p1",
            position: 39,
        });

        const ctx = makeGameContext({
            socketId: "p1",
        });

        const element = document.createElement("div");
        element.className = "player";
        element.setAttribute("player-id", player.id);
        document.body.appendChild(element);

        const plan = movePlayer({
            finalPosition: 1,
            player,
            ctx,
            get200whengo: true,
            adding: true,
        });

        plan.start();

        vi.advanceTimersByTime(plan.time);

        expect(player.position).toBe(1);
        expect(handlePassGo).toHaveBeenCalledTimes(1);
    });

    it("does not call handlePassGo when get200whengo is false", () => {
        const player = makePlayer({
            id: "p1",
            position: 39,
        });

        const ctx = makeGameContext({
            socketId: "p1",
        });

        const element = document.createElement("div");
        element.className = "player";
        element.setAttribute("player-id", player.id);
        document.body.appendChild(element);

        const plan = movePlayer({
            finalPosition: 1,
            player,
            ctx,
            get200whengo: false,
            adding: true,
        });

        plan.start();

        vi.advanceTimersByTime(plan.time);

        expect(player.position).toBe(1);
        expect(handlePassGo).not.toHaveBeenCalled();
    });

    it("supports backward movement when adding is false", () => {
        const player = makePlayer({
            id: "p1",
            position: 1,
        });

        const ctx = makeGameContext({
            socketId: "p1",
        });

        const element = document.createElement("div");
        element.className = "player";
        element.setAttribute("player-id", player.id);
        document.body.appendChild(element);

        const plan = movePlayer({
            finalPosition: 39,
            player,
            ctx,
            adding: false,
            get200whengo: false,
        });

        plan.start();

        vi.advanceTimersByTime(plan.time);

        expect(player.position).toBe(39);
        expect(playStepSfx).toHaveBeenCalledTimes(2);
        expect(handlePassGo).not.toHaveBeenCalled();
    });

    it("applies the final animation and then clears it", () => {
        const player = makePlayer({
            id: "p1",
            position: 7,
        });

        const ctx = makeGameContext({
            socketId: "p1",
        });

        const element = document.createElement("div");
        element.className = "player";
        element.setAttribute("player-id", player.id);
        document.body.appendChild(element);

        const plan = movePlayer({
            finalPosition: 8,
            player,
            ctx,
        });

        plan.start();

        vi.advanceTimersByTime(plan.time);

        expect(element.style.animation).toBe("part 0.9s cubic-bezier(0,.7,.57,1)");

        vi.advanceTimersByTime(900);

        expect(element.style.animation).toBe("");
    });
});
