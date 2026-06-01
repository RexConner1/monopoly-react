import { GameContext } from "../../../shared/game/context/gameContext";
import { Player } from "../../../src/assets/player";
import { playMoneyMinusSfx } from "../../../src/ui/audio/audio";


export function removeFunds({ player, amount, ctx }: {
    player: Player;
    amount: number;
    ctx: GameContext;
}) {
    player.balance -= amount;

    const isLocalPlayer = player.id === ctx.socket.id;
    if (!isLocalPlayer) return;

    if (ctx.effectsEnabled !== false) {
        ctx.engineRef.current?.applyAnimation?.(1);

        if (ctx.settings?.notifications) {
            ctx.notifyRef.current?.message?.(
                `${amount} of money is deducted from the account`,
                "info",
                2,
                () => {},
                false
            );
        }

        playMoneyMinusSfx(ctx.settings);
    }
}
