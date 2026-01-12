import { GameContext } from "../../../assets/gameContext";
import { Player } from "../../../assets/player";
import { history } from "../../../assets/types";
import { playPurchaseSfx } from "../../../ui/audio/audio";
import { notifyMessage } from "../../../ui/notifications/notificationFactory";

export function buySpecialAction({
    player,
    property,
    propretyMap,
    info,
    ctx
}: {
    player: Player;
    property: any;
    propretyMap: Map<number, any>;
    info: object;
    ctx: GameContext
}) {
    const price = property?.price ?? 0;

    if (ctx.settings?.notifications === true)
        notifyMessage(ctx.notifyRef, "MONEY_DEDUCTED", {
            amount: price
        });

    playPurchaseSfx(ctx.settings);

    player.balance -= price;

    ctx.engineRef.current?.applyAnimation(1);

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

    ctx.socket.emit(
        "history",
        history(
            `${ctx.clients.get(ctx.socket.id)?.username ?? "unknown player"} bought ${
                prp?.name ?? "unkown place"
            } with rent of ${calculateRent}`
        )
    );
}