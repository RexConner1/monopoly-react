import { Player } from "../../../src/assets/player";
import { playPurchaseSfx } from "../../../src/ui/audio/audio";
import { history } from "../../../src/assets/types";
import { getPropertyByPosition, Property } from "../../types/property";
import { GameContext } from "../context/gameContext";

export function buyProperty({
    player,
    property,
    ctx
}: {
    player: Player;
    property: Property;
    ctx: GameContext;
}) {
    // deduct money
    const cost = property?.price ?? 0;
    player.balance -= cost;

    if (ctx.effectsEnabled !== false) {
        // sound
        playPurchaseSfx(ctx.settings);
    
        // notify
        if (ctx.settings?.notifications) {
            ctx.notifyRef.current?.message?.(
                `${cost} of money is deducted from the account`,
                "info",
                2,
                () => {},
                false
            );
        }

        // animation
        ctx.engineRef.current?.applyAnimation?.(1);
    }

    // add ownership
    player.properties.push({
        position: player.position,
        count: 0,
        group: getPropertyByPosition(player.position)?.group ?? "",
    });

    // history
    ctx.socket.emit(
        "history",
        history(
            `${ctx.clients.get(ctx.socket.id)?.username ?? "unknown player"} bought ${property.name}`
        )
    );
}