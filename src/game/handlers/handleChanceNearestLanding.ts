import { GameContext } from "../../assets/gameContext";
import { Player } from "../../assets/player";
import { MoveNearestCard } from "../../assets/card";
import { getPropertyByPosition } from "../../assets/property";
import { buyProperty } from "../actions/buyProperty";
import { buySpecialProperty } from "../actions/buySpecialProperty";
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
    ctx: GameContext;
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
