import { GameContext } from "../../assets/gameContext";
import { Player } from "../../assets/player";
import { Property } from "../../assets/property";
import { playPurchaseSfx } from "../../ui/audio/audio";
import { history } from "../../assets/types";

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

    if (ctx.settings?.notifications) {
        ctx.notifyRef.current?.message(
            `${price} of money is deducted from the account`,
            "info",
            2,
            () => {},
            false
        );
    }

    playPurchaseSfx(ctx.settings);

    player.balance -= price;

    ctx.engineRef.current?.applyAnimation(1);

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
