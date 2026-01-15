import { Player } from "../../assets/player";
import { GameContext } from "../../assets/gameContext";
import { notifyMessage } from "../../ui/notifications/notificationFactory";
import { playMoneyPlusSfx } from "../../ui/audio/audio";

export function addMoney(
    player: Player,
    amount: number,
    ctx: GameContext
) {
    if (amount <= 0) return;

    player.balance += amount;

    if (player.id !== ctx.socket.id) return;

    ctx.engineRef.current?.applyAnimation(2);

    if (ctx.settings?.notifications) {
        notifyMessage(ctx.notifyRef, "MONEY_ADDED", {
            amount
        });
    }

    playMoneyPlusSfx(ctx.settings);
}