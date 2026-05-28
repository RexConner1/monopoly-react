import { ReactGameContext } from "../../assets/reactGameContext";
import { Player } from "../../assets/player";
import { MoveNearestCard } from "../../assets/card";
import { getPropertyByPosition } from "../../../shared/types/property";
import { buyProperty } from "../../../shared/game/actions/buyProperty";
import { buySpecialProperty } from "../../../shared/game/actions/buySpecialProperty";
import { payChanceRent } from "../actions/payChanceRent";
import { finishTurn } from "../actions/finishTurn";

export function handleChanceNearestLanding({
    player,
    rolls,
    card,
    ctx,
}: {
    player: Player;
    rolls: number;
    card: MoveNearestCard;
    ctx: ReactGameContext;
}) {
    if (player.id !== ctx.socket.id) return;

    const location = player.position ?? -1;
    const property = getPropertyByPosition(location);
    if (!property) return;

    ctx.engineRef.current?.setStreet({
        location,
        rolls,
        onResponse: (response, info) => {
            switch (response) {
                case "buy":
                    buyProperty({ player, property, ctx });
                    finishTurn({ localPlayer: player, ctx });
                    break;

                case "special_action": {
                    const { rolls } = info as { rolls: number };
                    buySpecialProperty({ player, property, rolls, ctx });
                    finishTurn({ localPlayer: player, ctx });
                    break;
                }

                case "someones":
                    payChanceRent({
                        payer: player,
                        property,
                        location,
                        rentMultiplier: card.rentmultiplier ?? 1,
                        ctx,
                    });
                    break;

                default:
                    finishTurn({ localPlayer: player, ctx });
                    break;
            }
        },
    });
}
