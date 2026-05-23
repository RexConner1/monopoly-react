import { ReactGameContext } from "../../assets/reactGameContext";
import { Player } from "../../assets/player";
import { playMoneyPlusSfx } from "../../ui/audio/audio";


export function addFunds({ player, amount, ctx }: {
    player: Player;
    amount: number;
    ctx: ReactGameContext;
}) {
    player.balance += amount;

    const isLocalPlayer = player.id === ctx.socket.id;

    if (!isLocalPlayer) return;

    ctx.engineRef.current?.applyAnimation(2);

    if (ctx.settings?.notifications) {
        ctx.notifyRef.current?.message(
            `${amount} of money is added to the account`,
            "info",
            2,
            () => {},
            false
        );
    }

    playMoneyPlusSfx(ctx.settings);
}
