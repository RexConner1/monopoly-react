import { Player } from "../../assets/player";
import { Socket } from "../../assets/sockets";
import { MonopolySettings, history } from "../../assets/types";
import { playPurchaseSfx } from "../../ui/audio/audio";
import { notifyMessage } from "../../ui/notifications/notificationFactory";

export function buyProperty({
    player,
    property,
    propretyMap,
    settings,
    notifyRef,
    engineRef,
    socket,
    clients
}: {
    player: Player;
    property: any;
    propretyMap: Map<number, any>;
    settings?: MonopolySettings;
    notifyRef?: React.RefObject<any>;
    engineRef?: React.RefObject<any>;
    socket: Socket
    clients: Map<string, Player>
}) {
    const price = property?.price ?? 0;

    if (settings?.notifications === true && notifyRef)
        notifyMessage(notifyRef, "MONEY_DEDUCTED", {
            amount: price
        });

    player.balance -= (price);

    engineRef?.current?.applyAnimation(1);

    player.properties.push({
        posistion: player.position,
        count: 0,
        group: propretyMap.get(player.position)?.group ?? "",
    });
    
    playPurchaseSfx(settings);

    socket.emit(
        "history",
        history(`${clients.get(socket.id)?.username ?? "unknown player"} bought ${property.name}`)
    );
}