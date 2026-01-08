import { Player } from "../../../assets/player";
import { Socket } from "../../../assets/sockets";
import { MonopolySettings, history } from "../../../assets/types";
import { playPurchaseSfx } from "../../../ui/audio/audio";
import { notifyMessage } from "../../../ui/notifications/notificationFactory";

export function buildOnProperty({
    player,
    property,
    location,
    info,
    settings,
    notifyRef,
    engineRef,
    socket,
    clients
}: {
    player: Player;
    property: any;
    location?: number;
    info: object;
    settings: MonopolySettings | undefined;
    notifyRef?: React.RefObject<any>;
    engineRef?: React.RefObject<any>;
    socket: Socket
    clients: Map<string, Player>
}) {
    playPurchaseSfx(settings);

    const propId = Array.from(new Map(player.properties.map((v, i) => [i, v])).entries()).filter(
        (v) => v[1].posistion === location
    )[0][0];

    const _info = info as {
        state: 1 | 2 | 3 | 4 | 5;
        money: number;
    };

    player.properties[propId].count = _info.state === 5 ? "h" : _info.state;

    if (_info.state === 5) {
        if (settings?.notifications === true && notifyRef)
            notifyMessage(notifyRef, "MONEY_DEDUCTED", {
                amount: property.ohousecost ?? 0
            });
        player.balance -= property.ohousecost ?? 0;
    } else {
        if (settings?.notifications === true && notifyRef)
            notifyMessage(notifyRef, "MONEY_DEDUCTED", {
                amount: property.housecost ?? 0
            });
        player.balance -= (property.housecost ?? 0) * _info.money;
    }

    engineRef?.current?.applyAnimation(1);

    socket.emit(
        "history",
        history(`${clients.get(socket.id)?.username ?? "unknown player"} advanced ${property.name}`)
    );
}