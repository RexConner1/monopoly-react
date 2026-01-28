import { Player } from "../../assets/player";
import { playPurchaseSfx } from "../../ui/audio/audio";
import { history } from "../../assets/types";
import { GameContext } from "../../assets/gameContext";
import { getPropertyByPosition, Property } from "../../assets/property";

export function buyProperty({
    player,
    property,
    ctx
}: {
    player: Player;
    property: Property;
    ctx: GameContext;
}) {
    const cost = property?.price ?? 0;

    // notify
    if (ctx.settings?.notifications) {
        ctx.notifyRef.current?.message(
            `${cost} of money is deducted from the account`,
            "info",
            2,
            () => {},
            false
        );
    }

    // deduct money
    player.balance -= cost;

    // animation
    ctx.engineRef.current?.applyAnimation(1);

    // add ownership
    player.properties.push({
        posistion: player.position,
        count: 0,
        group: getPropertyByPosition(player.position)?.group ?? "",
    });

    // sound
    playPurchaseSfx(ctx.settings);

    // history
    ctx.socket.emit(
        "history",
        history(
            `${ctx.clients.get(ctx.socket.id)?.username ?? "unknown player"} bought ${property.name}`
        )
    );
}