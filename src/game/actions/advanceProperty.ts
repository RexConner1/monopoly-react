import { GameContext } from "../../assets/gameContext";
import { Player } from "../../assets/player";
import { Property } from "../../assets/property";
import { history } from "../../assets/types";
import { playPurchaseSfx } from "../../ui/audio/audio";


export function advanceProperty({
    player,
    property,
    location,
    state,
    money,
    ctx
}: {
    player: Player;
    property: Property;
    location: number;
    state: 1 | 2 | 3 | 4 | 5;
    money: number;
    ctx: GameContext;
}) {
    playPurchaseSfx(ctx.settings);

    const propIndex = player.properties.findIndex(
        v => v.position === location
    );

    if (propIndex === -1) return;

    player.properties[propIndex].count = state === 5 ? "h" : state;

    const cost = state === 5
        ? (property.hotelcost ?? 0)
        : (property.housecost ?? 0) * money;

    if (ctx.settings?.notifications) {
        ctx.notifyRef.current?.message(
            `${cost} of money is deducted from the account`,
            "info",
            2,
            () => {},
            false
        );
    }

    player.balance -= cost;

    ctx.engineRef.current?.applyAnimation(1);

    ctx.socket.emit(
        "history",
        history(
            `${ctx.clients.get(ctx.socket.id)?.username ?? "unknown player"} advanced ${property.name}`
        )
    );
}
