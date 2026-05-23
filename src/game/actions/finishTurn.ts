import { Player } from "../../assets/player";
import { ReactGameContext } from "../../assets/reactGameContext";


export function finishTurn({ localPlayer, ctx }: {
    localPlayer: Player;
    ctx: ReactGameContext;
}) {
    // SetClients(new Map(clients.set(socket.id, localPlayer)));
    const updatedClients = new Map(ctx.clients);
    updatedClients.set(ctx.socket.id, localPlayer);
    ctx.SetClients(updatedClients);

    ctx.engineRef.current?.freeDice();

    const json = localPlayer.toJson();
    ctx.socket.emit("finish-turn", json);
}