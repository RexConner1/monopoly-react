import { ReactGameContext } from "../../assets/reactGameContext";
import { Player } from "../../assets/player";
import { playMoneyMinusSfx } from "../../ui/audio/audio";


export function removeFunds({ player, amount, ctx }: {
    player: Player;
    amount: number;
    ctx: ReactGameContext;
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
