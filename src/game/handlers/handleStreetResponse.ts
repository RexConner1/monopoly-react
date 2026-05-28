import { ReactGameContext } from "../../assets/reactGameContext";
import { Player } from "../../assets/player";
import { Property } from "../../../shared/types/property";

import { buyProperty } from "../../../shared/game/actions/buyProperty";
import { advanceProperty } from "../../../shared/game/actions/advanceProperty";
import { payRent } from "../../../shared/game/actions/payRent";
import { buySpecialProperty } from "../actions/buySpecialProperty";
import { payIncomeTax } from "../actions/payIncomeTax";
import { payLuxuryTax } from "../actions/payLuxuryTax";
import { goToJail } from "../actions/goToJail";
import { finishTurn } from "../actions/finishTurn";
import { StreetResponseType } from "../../assets/types";


export function handleStreetResponse({
    response,
    info,
    player,
    property,
    location,
    ctx,
}: {
    response: StreetResponseType;
    info: unknown;
    player: Player;
    property: Property;
    location: number;
    ctx: ReactGameContext;
}) {
    let time_till_free = 0;

    switch (response) {
        case "buy":
            buyProperty({
                player,
                property,
                ctx,
            });
            break;

        case "advance-buy": {
            const { state, money } = info as {
                state: 1 | 2 | 3 | 4 | 5;
                money: number;
            };

            advanceProperty({
                player,
                property,
                location,
                state,
                money,
                ctx,
            });
            break;
        }

        case "someones": {
            const { rolls } = info as { rolls: number };

            payRent({
                payer: player,
                property,
                location,
                rolls,
                ctx,
            });
            break;
        }

        case "nothing":
            if ((property?.id ?? "") === "gotojail") {
                goToJail({ player, ctx });
            }

            if (property?.id === "incometax") {
                payIncomeTax({ player, ctx });
            }

            if (property?.id === "luxurytax") {
                payLuxuryTax({ player, ctx });
            }
            break;

        case "special_action": {
            const { rolls } = info as { rolls: number };

            buySpecialProperty({
                player,
                property,
                rolls,
                ctx,
            });
            break;
        }
    }

    setTimeout(() => {
        finishTurn({ localPlayer: player, ctx });
    }, time_till_free);
}