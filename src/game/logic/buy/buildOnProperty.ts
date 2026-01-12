import { GameContext } from "../../../assets/gameContext";
import { Player } from "../../../assets/player";
import { history } from "../../../assets/types";
import { playPurchaseSfx } from "../../../ui/audio/audio";
import { notifyMessage } from "../../../ui/notifications/notificationFactory";

export function buildOnProperty({
    player,
    property,
    location,
    info,
    ctx
}: {
    player: Player;
    property: any;
    location?: number;
    info: object;
    ctx: GameContext
}) {
    playPurchaseSfx(ctx.settings);

    const propId = Array.from(new Map(player.properties.map((v, i) => [i, v])).entries()).filter(
        (v) => v[1].posistion === location
    )[0][0];

    const _info = info as {
        state: 1 | 2 | 3 | 4 | 5;
        money: number;
    };

    player.properties[propId].count = _info.state === 5 ? "h" : _info.state;

    if (_info.state === 5) {
        if (ctx.settings?.notifications === true)
            notifyMessage(ctx.notifyRef, "MONEY_DEDUCTED", {
                amount: property.ohousecost ?? 0
            });
        player.balance -= property.ohousecost ?? 0;
    } else {
        if (ctx.settings?.notifications === true)
            notifyMessage(ctx.notifyRef, "MONEY_DEDUCTED", {
                amount: property.housecost ?? 0
            });
        player.balance -= (property.housecost ?? 0) * _info.money;
    }

    ctx.engineRef.current?.applyAnimation(1);

    ctx.socket.emit(
        "history",
        history(`${ctx.clients.get(ctx.socket.id)?.username ?? "unknown player"} advanced ${property.name}`)
    );
}