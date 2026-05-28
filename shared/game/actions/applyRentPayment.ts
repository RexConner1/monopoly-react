import { GameContext } from "../context/gameContext";
import { Player } from "../../../src/assets/player";
import { history } from "../../../src/assets/types";
import { playMoneyMinusSfx } from "../../../src/ui/audio/audio";
import { notifyMessage } from "../../../src/ui/notifications/notificationFactory";

export function applyRentPayment({
    payer,
    owner,
    amount,
    ctx,
}: {
    payer: Player;
    owner: Player;
    amount: number;
    ctx: GameContext;
}) {
    payer.balance -= amount;

    if (ctx.effectsEnabled !== false) {
        if (ctx.settings?.notifications) {
            notifyMessage(ctx.notifyRef, "MONEY_DEDUCTED", { amount });
        }
        playMoneyMinusSfx(ctx.settings);
        ctx.engineRef.current?.applyAnimation?.(1);
    }

    ctx.socket.emit("pay", {
        balance: amount,
        from: payer.id,
        to: owner.id,
    });

    ctx.socket.emit(
        "history",
        history(
            `${ctx.clients.get(payer.id)?.username ?? "unknown user"} paid ${amount} to ${
                ctx.clients.get(owner.id)?.username ?? "unknown user"
            }`
        )
    );
}