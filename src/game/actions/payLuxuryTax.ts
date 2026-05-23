import { ReactGameContext } from "../../assets/reactGameContext";
import { Player } from "../../assets/player";
import { history } from "../../assets/types";
import { playMoneyMinusSfx } from "../../ui/audio/audio";

const LUXURY_TAX_AMOUNT = 100;

export function payLuxuryTax({
    player,
    ctx
}: {
    player: Player;
    ctx: ReactGameContext;
}) {
    player.balance -= LUXURY_TAX_AMOUNT;

    if (ctx.settings?.notifications) {
        ctx.notifyRef.current?.message(
            `${LUXURY_TAX_AMOUNT} of money is deducted from the account`,
            "info",
            2,
            () => {},
            false
        );
    }

    playMoneyMinusSfx(ctx.settings);

    ctx.engineRef.current?.applyAnimation(1);

    ctx.socket.emit(
        "history",
        history(`${ctx.clients.get(ctx.socket.id)?.username ?? "unknown player"} paid luxury taxes`)
    );
}
