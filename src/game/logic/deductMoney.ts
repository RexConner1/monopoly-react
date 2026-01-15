import { Player } from "../../assets/player";
import { GameContext } from "../../assets/gameContext";
import { notifyMessage } from "../../ui/notifications/notificationFactory";
import { playMoneyMinusSfx } from "../../ui/audio/audio";

export function deductMoney(
    player: Player,
    amount: number,
    ctx: GameContext
) {
    if (amount <= 0) return;

    player.balance -= amount;

    if (player.id !== ctx.socket.id) return;

    ctx.engineRef.current?.applyAnimation(1);

    if (ctx.settings?.notifications) {
        notifyMessage(ctx.notifyRef, "MONEY_DEDUCTED", {
            amount
        });
    }

    playMoneyMinusSfx(ctx.settings);
}