import { GameContext } from "../../assets/gameContext";
import { Player } from "../../assets/player";
import { notifyMessage } from "../../ui/notifications/notificationFactory";
import { playMoneyMinusSfx } from "../../ui/audio/audio";

export function applyPropertyCharges({
    player,
    buildingsCost = 1,
    hotelsCost = 1,
    ctx,
}: {
    player: Player;
    buildingsCost?: number;
    hotelsCost?: number;
    ctx: GameContext;
}) {
    const { socket, settings, notifyRef, engineRef, clients, SetClients } = ctx;

    const totalHouses = player.properties
        .filter((v) => typeof v.count === "number")
        .reduce((sum, v) => sum + (v.count as number), 0);

    const totalHotels = player.properties.filter((v) => v.count === "h").length;

    const paymentAmount =
        buildingsCost * totalHouses +
        hotelsCost * totalHotels;

    if (player.id === socket.id && paymentAmount > 0) {
        if (settings?.notifications) {
            notifyMessage(notifyRef, "MONEY_DEDUCTED", {
                amount: paymentAmount,
            });
        }

        playMoneyMinusSfx(settings);
        engineRef.current?.applyAnimation(1);
    }

    player.balance -= paymentAmount;

    const updatedClients = new Map(clients);
    updatedClients.set(player.id, player);
    SetClients(updatedClients);
}
