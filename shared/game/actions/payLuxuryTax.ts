import { GameContext } from "../context/gameContext";
import { Player } from "../../../src/assets/player";
import { history } from "../../../src/assets/types";
import { playMoneyMinusSfx } from "../../../src/ui/audio/audio";
import { notifyMessage } from "../../../src/ui/notifications/notificationFactory";

const LUXURY_TAX_AMOUNT = 100;

export function payLuxuryTax({
    player,
    ctx
}: {
    player: Player;
    ctx: GameContext;
}) {
    player.balance -= LUXURY_TAX_AMOUNT;

    if (ctx.effectsEnabled !== false) {
        if (ctx.settings?.notifications) {
            notifyMessage(ctx.notifyRef, "MONEY_DEDUCTED", {
                amount: LUXURY_TAX_AMOUNT,
            });
        }

        playMoneyMinusSfx(ctx.settings);

        ctx.engineRef.current?.applyAnimation?.(1);
    }

    ctx.socket.emit(
        "history",
        history(`${ctx.clients.get(ctx.socket.id)?.username ?? "unknown player"} paid luxury taxes`)
    );
}
