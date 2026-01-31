import { GameContext } from "../../assets/gameContext";
import { Player } from "../../assets/player";
import { history } from "../../assets/types";
import { playMoneyMinusSfx } from "../../ui/audio/audio";

const INCOME_TAX_AMOUNT = 200;

export function payIncomeTax({
    player,
    ctx
}: {
    player: Player;
    ctx: GameContext;
}) {
    player.balance -= INCOME_TAX_AMOUNT;

    if (ctx.settings?.notifications) {
        ctx.notifyRef.current?.message(
            `${INCOME_TAX_AMOUNT} of money is deducted from the account`,
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
        history(`${ctx.clients.get(ctx.socket.id)?.username ?? "unknown player"} paid income taxes`)
    );
}