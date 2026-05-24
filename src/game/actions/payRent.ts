import { ReactGameContext } from "../../assets/reactGameContext";
import { Player } from "../../assets/player";
import { Property } from "../../../shared/types/property";
import { calculateRent } from "../logic/rent/calculateRent";
import { findPropertyOwner } from "../logic/rent/findPropertyOwner";
import { applyRentPayment } from "./applyRentPayment";

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
    ctx: ReactGameContext
}) {
    const found = findPropertyOwner(ctx.clients, location);
    if (!found) return;

    const { owner, prp } = found;

    if (prp.mortgaged) return;

    const payment = calculateRent(property, owner, prp, rolls);

    applyRentPayment({
        payer,
        owner,
        amount: payment,
        ctx,
    });
}
