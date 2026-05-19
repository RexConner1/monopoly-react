import { applyPassGoReward } from "../../../shared/game/actions/applyPassGoReward";
import { GameContext } from "../../assets/gameContext";
import { Player } from "../../assets/player";
import { playMoneyPlusSfx } from "../../ui/audio/audio";

export function handlePassGo({
    player,
    ctx
}: {
    player: Player;
    ctx: GameContext;
}) {
    const amount = applyPassGoReward(player);

    playMoneyPlusSfx(ctx.settings);

    const isLocal = player.id === ctx.socket.id;
    if (isLocal) {
        if (ctx.settings?.notifications) {
            ctx.notifyRef.current?.message(
                `${amount} of money is added to the account`,
                "info",
                2,
                () => {},
                false
            );
        }

        ctx.engineRef.current?.applyAnimation(2);
    }

    ctx.SetClients(new Map(ctx.clients.set(player.id, player)));
}
