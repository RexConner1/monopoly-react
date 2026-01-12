import { GameContext } from "../../../assets/gameContext";
import { Player } from "../../../assets/player";
import { history } from "../../../assets/types";
import { playMoneyMinusSfx } from "../../../ui/audio/audio";
import { notifyMessage } from "../../../ui/notifications/notificationFactory";

const LUXURY_TAX = 100;

export function payLuxuryTax({
    player,
    ctx
}: {
    player: Player;
    ctx: GameContext;
}) {
    player.balance -= LUXURY_TAX;

    if (ctx.settings?.notifications === true)
        notifyMessage(ctx.notifyRef, "MONEY_DEDUCTED", {
            amount: LUXURY_TAX
        });

    playMoneyMinusSfx(ctx.settings);

    ctx.engineRef.current?.applyAnimation(1);

    ctx.socket.emit(
        "history",
        history(`${ctx.clients.get(ctx.socket.id)?.username ?? "unknown player"} paid luxury taxes`)
    );
}