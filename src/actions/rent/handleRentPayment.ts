import { Player } from "../../assets/player";
import { Property } from "../../assets/types";
import { calculateRent } from "../../game/logic/rent/calculateRent";
import { findPropertyOwner } from "../../game/logic/findPropertyOwner";
import { notifyMessage } from "../../ui/notifications/notificationFactory";
import { playMoneyMinusSfx } from "../../ui/audio/audio";
import { GameContext } from "../../assets/gameContext";

export function handleRentPayment({
    players,
    currentPlayer,
    property,
    location,
    ctx
}: {
    players: Map<string, Player>;
    currentPlayer: Player;
    property: Property;
    location: number;
    ctx: GameContext
}) {
    const found = findPropertyOwner(Array.from(players.values()), location);
    if (!found) return;

    const { owner, property: ownedProperty } = found;

    const rent = calculateRent(
        property,
        ownedProperty,
        owner
    );

    if (ctx.settings?.notifications) {
        notifyMessage(ctx.notifyRef, "MONEY_DEDUCTED", { amount: rent });
    }

    playMoneyMinusSfx(ctx.settings);
    
    if (!ownedProperty.morgage) {
        currentPlayer.balance -= rent;
    }

    ctx.engineRef.current?.applyAnimation(1);

    ctx.socket.emit("pay", {
        balance: rent,
        from: currentPlayer.id,
        to: owner.id,
    });

    ctx.socket.emit(
        "history",
        `${currentPlayer.id} paid ${rent} to ${owner.id}`
    );
}
