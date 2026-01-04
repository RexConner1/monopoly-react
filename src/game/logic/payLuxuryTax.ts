import { Player } from "../../assets/player";
import { Socket } from "../../assets/sockets";
import { MonopolySettings, history } from "../../assets/types";
import { playMoneyMinusSfx } from "../../ui/audio/audio";
import { notifyMessage } from "../../ui/notifications/notificationFactory";

const LUXURY_TAX = 100;

export function payLuxuryTax({
    player,
    settings,
    notifyRef,
    engineRef,
    socket,
    clients
}: {
    player: Player;
    settings?: MonopolySettings;
    notifyRef?: React.RefObject<any>;
    engineRef?: React.RefObject<any>;
    socket: Socket
    clients: Map<string, Player>
}) {
    player.balance -= LUXURY_TAX;

    if (settings?.notifications === true && notifyRef)
        notifyMessage(notifyRef, "MONEY_DEDUCTED", {
            amount: LUXURY_TAX
        });

    playMoneyMinusSfx(settings);

    engineRef?.current?.applyAnimation(1);

    socket.emit(
        "history",
        history(`${clients.get(socket.id)?.username ?? "unknown player"} paid luxury taxes`)
    );
}