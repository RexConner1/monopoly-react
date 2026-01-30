import { GameContext } from "../../../assets/gameContext";
import { Player } from "../../../assets/player";
import { Property } from "../../../assets/property";
import { history } from "../../../assets/types";
import { playMoneyMinusSfx } from "../../../ui/audio/audio";
import { calculateRent } from "./calculateRent";
import { findPropertyOwner } from "./findPropertyOwner";

export function payRent({
    payer,
    property,
    location,
    rolls,
    ctx
}: {
    payer: Player;
    property: Property;
    location: number;
    rolls: number;
    ctx: GameContext
}) {
    const found = findPropertyOwner(ctx.clients, location);
    if (!found) return;

    const { owner, prp } = found;

    if (prp.morgage) return;

    const payment = calculateRent(property, owner, prp, rolls);

    if (ctx.settings?.notifications) {
        ctx.notifyRef.current?.message(
            `${payment} of money is deducted from the account`,
            "info",
            2,
            () => {},
            false
        );
    }

    playMoneyMinusSfx(ctx.settings);

    payer.balance -= payment;

    ctx.engineRef.current?.applyAnimation(1);

    ctx.socket.emit("pay", {
        balance: payment,
        from: payer.id,
        to: owner.id,
    });

    ctx.socket.emit(
        "history",
        history(
            `${ctx.clients.get(payer.id)?.username ?? "unknown user"} paid ${payment} to ${
                ctx.clients.get(owner.id)?.username ?? "unknown user"
            }`
        )
    );
}
