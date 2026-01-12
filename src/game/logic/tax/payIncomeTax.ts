import { GameContext } from "../../../assets/gameContext";
import { Player } from "../../../assets/player";
import { history } from "../../../assets/types";
import { playMoneyMinusSfx } from "../../../ui/audio/audio";
import { notifyMessage } from "../../../ui/notifications/notificationFactory";

const INCOME_TAX = 200;

export function payIncomeTax({
    player,
    ctx
}: {
    player: Player;
    ctx: GameContext
}) {
    player.balance -= INCOME_TAX;

    if (ctx.settings?.notifications === true && ctx.notifyRef)
        notifyMessage(ctx.notifyRef, "MONEY_DEDUCTED", {
            amount: INCOME_TAX
        });

    playMoneyMinusSfx(ctx.settings);

    ctx.engineRef.current?.applyAnimation(1);

    ctx.socket.emit(
        "history",
        history(`${ctx.clients.get(ctx.socket.id)?.username ?? "unknown player"} paid income taxes`)
    );
}