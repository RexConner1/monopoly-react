import { GameContext } from "../../assets/gameContext";
import { Player } from "../../assets/player";
import { Property } from "../../assets/property";
import { history } from "../../assets/types";
import { calculateRailroadRent } from "../logic/rent/calculateRailroadRent";
import { findPropertyOwner } from "../logic/rent/findPropertyOwner";
import { applyRentPayment } from "./applyRentPayment";
import { finishTurn } from "./finishTurn";

export function payChanceRent({
    payer,
    property,
    location,
    rentMultiplier,
    ctx,
}: {
    payer: Player;
    property: Property;
    location: number;
    rentMultiplier: number;
    ctx: GameContext;
}) {
    const found = findPropertyOwner(ctx.clients, location);
    if (!found) {
        finishTurn({ localPlayer: payer, ctx });
        return;
    }

    const { owner, prp } = found;

    if (prp.mortgaged) {
        finishTurn({ localPlayer: payer, ctx });
        return;
    }

    if (property.group === "Utilities") {
        const l = [
            Math.floor(Math.random() * 6) + 1,
            Math.floor(Math.random() * 6) + 1,
        ];

        ctx.socket.emit(
            "history",
            history(
                `${ctx.clients.get(payer.id)?.username ?? "unknown player"} rolled [${l[0]}, ${l[1]}]`
            )
        );

        ctx.engineRef.current?.diceResults({
            l: [l[0], l[1]],
            time: 2000,
            onDone: () => {
                const payment = (l[0] + l[1]) * rentMultiplier;

                applyRentPayment({
                    payer,
                    owner,
                    amount: payment,
                    ctx,
                });

                finishTurn({ localPlayer: payer, ctx });
            },
        });

        return;
    }

    if (property.group === "Railroad") {
        const payment = calculateRailroadRent(owner) * rentMultiplier;

        applyRentPayment({
            payer,
            owner,
            amount: payment,
            ctx,
        });

        finishTurn({ localPlayer: payer, ctx });
    }
}
