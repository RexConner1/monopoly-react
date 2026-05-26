import { Player } from "../../../src/assets/player";
import { Property } from "../../types/property";
import { history } from "../../../src/assets/types";
import { playPurchaseSfx } from "../../../src/ui/audio/audio";
import { GameContext } from "../context/gameContext";


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
    const propIndex = player.properties.findIndex(
        v => v.position === location
    );

    if (propIndex === -1) return;

    player.properties[propIndex].count = state === 5 ? "h" : state;

    const cost = state === 5
        ? (property.hotelcost ?? 0)
        : (property.housecost ?? 0) * money;
    player.balance -= cost;

    if (ctx.effectsEnabled !== false) {
        playPurchaseSfx(ctx.settings);

        if (ctx.settings?.notifications) {
            ctx.notifyRef.current?.message?.(
                `${cost} of money is deducted from the account`,
                "info",
                2,
                () => {},
                false
            );
        }

        ctx.engineRef.current?.applyAnimation?.(1);       
    }

    ctx.socket.emit(
        "history",
        history(
            `${ctx.clients.get(ctx.socket.id)?.username ?? "unknown player"} advanced ${property.name}`
        )
    );
}
