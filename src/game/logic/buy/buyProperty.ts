import { GameContext } from "../../../assets/gameContext";
import { Player } from "../../../assets/player";
import { history } from "../../../assets/types";
import { playPurchaseSfx } from "../../../ui/audio/audio";
import { notifyMessage } from "../../../ui/notifications/notificationFactory";

export function buyProperty({
    player,
    property,
    propretyMap,
    ctx
}: {
    player: Player;
    property: any;
    propretyMap: Map<number, any>;
    ctx: GameContext
}) {
    const price = property?.price ?? 0;

    if (ctx.settings?.notifications === true)
        notifyMessage(ctx.notifyRef, "MONEY_DEDUCTED", {
            amount: price
        });

    player.balance -= (price);

    ctx.engineRef.current?.applyAnimation(1);

    player.properties.push({
        posistion: player.position,
        count: 0,
        group: propretyMap.get(player.position)?.group ?? "",
    });
    
    playPurchaseSfx(ctx.settings);

    ctx.socket.emit(
        "history",
        history(`${ctx.clients.get(ctx.socket.id)?.username ?? "unknown player"} bought ${property.name}`)
    );
}
