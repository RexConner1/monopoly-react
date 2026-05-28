import { GameContext } from "../context/gameContext";
import { Player } from "../../../src/assets/player";


export function finishTurn({ localPlayer, ctx }: {
    localPlayer: Player;
    ctx: GameContext;
}) {
    // SetClients(new Map(clients.set(socket.id, localPlayer)));
    const updatedClients = new Map(ctx.clients);
    // updatedClients.set(ctx.socket.id, localPlayer);
    updatedClients.set(localPlayer.id, localPlayer);
    ctx.SetClients(updatedClients);

    ctx.engineRef.current?.freeDice?.();

    const json = localPlayer.toJson();
    ctx.socket.emit("finish-turn", json);
}