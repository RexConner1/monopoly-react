import { GameContext } from "../../assets/gameContext";
import { Player } from "../../assets/player";
import { playMoneyMinusSfx } from "../../ui/audio/audio";


export function removeFunds({ player, amount, ctx }: {
    player: Player;
    amount: number;
    ctx: GameContext;
}) {
    player.balance -= amount;

    const isLocalPlayer = player.id === ctx.socket.id;

    if (!isLocalPlayer) return;

    ctx.engineRef.current?.applyAnimation(1);

    if (ctx.settings?.notifications) {
        ctx.notifyRef.current?.message(
            `${amount} of money is deducted from the account`,
            "info",
            2,
            () => {},
            false
        );
    }

    playMoneyMinusSfx(ctx.settings);
}
