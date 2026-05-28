import { Player } from "../../../src/assets/player";
import { Property } from "../../types/property";
import { playPurchaseSfx } from "../../../src/ui/audio/audio";
import { history } from "../../../src/assets/types";
import { GameContext } from "../context/gameContext";
import { notifyMessage } from "../../../src/ui/notifications/notificationFactory";

export function buySpecialProperty({
    player,
    property,
    rolls,
    ctx
}: {
    player: Player;
    property: Property;
    rolls: number;
    ctx: GameContext;
}) {
    const price = property.price ?? 0;
    player.balance -= price;

    if (ctx.effectsEnabled !== false) {
        if (ctx.settings?.notifications) {
            notifyMessage(ctx.notifyRef, "MONEY_DEDUCTED", {
                amount: price,
            });
        }

        playPurchaseSfx(ctx.settings);

        ctx.engineRef.current?.applyAnimation?.(1);
    }

    // add property ownership
    player.properties.push({
        position: player.position,
        count: 0,
        rent: rolls, // utilities use dice roll
        group: property.group ?? "",
    });

    ctx.socket.emit(
        "history",
        history(
            `${ctx.clients.get(player.id)?.username ?? "unknown player"} bought ${
                property.name ?? "unknown place"
            } with rent of ${rolls}`
        )
    );
}
