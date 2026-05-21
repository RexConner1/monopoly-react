import { Player } from "../../../src/assets/player";
import { BotGameContext } from "../context/botGameContext";

export function updatePlayer({
    player,
    ctx,
}: {
    player: Player;
    ctx: BotGameContext;
}) {
    const updatedClients = new Map(ctx.clients);
    updatedClients.set(player.id, player);
    ctx.SetClients(updatedClients);
}
