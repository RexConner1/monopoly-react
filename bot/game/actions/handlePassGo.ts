import { applyPassGoReward } from "../../../shared/game/actions/applyPassGoReward.ts";
import { Player } from "../../../src/assets/player.ts";

export function handlePassGo({
    player,
    clients
}: {
    player: Player;
    clients: Map<string, Player>;
}) {
    applyPassGoReward(player);

    clients.set(player.id, player);
}
