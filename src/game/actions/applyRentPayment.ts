import { GameContext } from "../../assets/gameContext";
import { Player } from "../../assets/player";
import { history } from "../../assets/types";
import { playMoneyMinusSfx } from "../../ui/audio/audio";
import { notifyMessage } from "../../ui/notifications/notificationFactory";

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
    if (ctx.settings?.notifications) {
        notifyMessage(ctx.notifyRef, "MONEY_DEDUCTED", { amount });
    }

    playMoneyMinusSfx(ctx.settings);

    payer.balance -= amount;

    ctx.engineRef.current?.applyAnimation(1);

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