import { describe, it, expect } from "vitest";
import { finishTurn } from "../finishTurn";
import { makePlayer } from "../../../test/factories/playerFactory";
import { makeGameContext } from "../../../test/factories/gameContextFactory";

describe("finishTurn", () => {
    it("updates clients with the local player using the socket id as the key", () => {
        const oldPlayer = makePlayer({
            id: "p1",
            username: "Old Name",
            balance: 1500,
        });

        const localPlayer = makePlayer({
            id: "p1",
            username: "New Name",
            balance: 1200,
        });

        const clients = new Map<string, typeof localPlayer>([
            ["p1", oldPlayer],
        ]);

        const ctx = makeGameContext({
            socketId: "p1",
            clients,
        });

        finishTurn({ localPlayer, ctx });

        expect(ctx.SetClients).toHaveBeenCalledTimes(1);

        const updatedClients = ctx.SetClients.mock.calls[0][0] as Map<string, typeof localPlayer>;

        expect(updatedClients).toBeInstanceOf(Map);
        expect(updatedClients).not.toBe(clients);
        expect(updatedClients.get("p1")).toBe(localPlayer);

        expect(clients.get("p1")).toBe(oldPlayer);
    });

    it("frees the dice in the engine", () => {
        const localPlayer = makePlayer({ id: "p1" });
        const ctx = makeGameContext({
            socketId: "p1",
            clients: new Map([["p1", localPlayer]]),
        });

        finishTurn({ localPlayer, ctx });

        expect(ctx.engineRef.current?.freeDice).toHaveBeenCalledTimes(1);
    });

    it("emits finish-turn with the player's serialized json", () => {
        const localPlayer = makePlayer({
            id: "p1",
            username: "Alice",
            balance: 1337,
            position: 7,
        });

        const ctx = makeGameContext({
            socketId: "p1",
            clients: new Map([["p1", localPlayer]]),
        });

        finishTurn({ localPlayer, ctx });

        expect(ctx.socket.emit).toHaveBeenCalledWith(
            "finish-turn",
            localPlayer.toJson()
        );
    });
});
