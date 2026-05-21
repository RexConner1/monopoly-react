import { applyPassGoReward } from "../../../shared/game/actions/applyPassGoReward.ts";
import { Player } from "../../../src/assets/player.ts";
import { BotGameContext } from "../context/botGameContext.ts";
import { updatePlayer } from "../state/updatePlayer.ts";

export function handlePassGo({
    player,
    ctx
}: {
    player: Player;
    ctx: BotGameContext;
}) {
    applyPassGoReward(player);

    updatePlayer({ player, ctx });
}
