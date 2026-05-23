import { Player } from "../../../src/assets/player";
import { GameContext } from "../../../shared/game/context/gameContext";

export function updatePlayer({
    player,
    ctx,
}: {
    player: Player;
    ctx: GameContext;
}) {
    const updatedClients = new Map(ctx.clients);
    updatedClients.set(player.id, player);
    ctx.SetClients(updatedClients);
}
