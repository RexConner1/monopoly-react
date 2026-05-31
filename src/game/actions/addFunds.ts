import { Player } from "../../assets/player";
import { playMoneyPlusSfx } from "../../ui/audio/audio";
import { GameContext } from "../../../shared/game/context/gameContext";


export function addFunds({ player, amount, ctx }: {
    player: Player;
    amount: number;
    ctx: GameContext;
}) {
    player.balance += amount;

    const isLocalPlayer = player.id === ctx.socket.id;

    if (!isLocalPlayer) return;

    if (ctx.effectsEnabled !== false) {
        ctx.engineRef.current?.applyAnimation?.(2);

        if (ctx.settings?.notifications) {
            ctx.notifyRef.current?.message?.(
                `${amount} of money is added to the account`,
                "info",
                2,
                () => {},
                false
            );
        }

        playMoneyPlusSfx(ctx.settings);
    }
}
