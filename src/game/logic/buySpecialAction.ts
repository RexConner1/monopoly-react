import { Player } from "../../assets/player";
import { Socket } from "../../assets/sockets";
import { MonopolySettings, history } from "../../assets/types";
import { playPurchaseSfx } from "../../ui/audio/audio";
import { notifyMessage } from "../../ui/notifications/notificationFactory";

export function buySpecialAction({
    player,
    property,
    propretyMap,
    info,
    settings,
    notifyRef,
    engineRef,
    socket,
    clients
}: {
    player: Player;
    property: any;
    propretyMap: Map<number, any>;
    info: object;
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
    
    playPurchaseSfx(settings);

    player.balance -= price;

    engineRef?.current?.applyAnimation(1);

    const _info = info as {
        rolls: number;
    };
    const prp = propretyMap.get(player.position);
    const calculateRent = _info.rolls;

    player.properties.push({
        posistion: player.position,
        count: 0,
        rent: calculateRent,
        group: prp?.group ?? "",
    });

    socket.emit(
        "history",
        history(
            `${clients.get(socket.id)?.username ?? "unknown player"} bought ${
                prp?.name ?? "unkown place"
            } with rent of ${calculateRent}`
        )
    );
}