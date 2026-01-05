import { Player } from "../../assets/player";
import { MonopolySettings, Property } from "../../assets/types";
import { calculateRent } from "../../game/logic/calculateRent";
import { findPropertyOwner } from "../../game/logic/findPropertyOwner";
import { notifyMessage } from "../../ui/notifications/notificationFactory";
import { Socket } from "../../assets/sockets";
import { playMoneyMinusSfx } from "../../ui/audio/audio";

export function handleRentPayment({
    socket,
    players,
    currentPlayer,
    property,
    location,
    notifyRef,
    settings,
    engineRef,
}: {
    socket: Socket;
    players: Map<string, Player>;
    currentPlayer: Player;
    property: Property;
    location: number;
    notifyRef: React.RefObject<any>;
    settings?: MonopolySettings;
    engineRef: React.RefObject<any>;
}) {
    const found = findPropertyOwner(Array.from(players.values()), location);
    if (!found) return;

    const { owner, property: ownedProperty } = found;

    const rent = calculateRent(
        property,
        ownedProperty,
        owner
    );

    if (settings?.notifications) {
        notifyMessage(notifyRef, "MONEY_DEDUCTED", { amount: rent });
    }

    playMoneyMinusSfx(settings);

    if (!ownedProperty.morgage) {
        currentPlayer.balance -= rent;
    }

    engineRef.current?.applyAnimation(1);

    socket.emit("pay", {
        balance: rent,
        from: currentPlayer.id,
        to: owner.id,
    });

    socket.emit(
        "history",
        `${currentPlayer.id} paid ${rent} to ${owner.id}`
    );
}
