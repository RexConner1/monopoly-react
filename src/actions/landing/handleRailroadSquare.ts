import { canPurchase } from "../../game/logic/landing/balanceRules";
import { buildRailroadDisplay } from "../../game/logic/landing/displayBuilders";

export function handleRailroadSquare({
    x,
    belongToMe,
    belongToOthers,
    localPlayer,
    args,
    ShowStreet,
    SetStreetType,
    SetStreetDisplay,
    swipeSound,
    searchForButtons
}: any) {
    if (belongToMe) {
        args.onResponse("nothing", {});
        return;
    }

    if (belongToOthers) {
        args.onResponse("someones", {});
        ShowStreet(false);
        return;
    }

    if (!canPurchase(localPlayer.balance, x.price)) {
        args.onResponse("nothing", {});
        ShowStreet(false);
        return;
    }

    SetStreetType("Railroad");
    SetStreetDisplay(buildRailroadDisplay(x));

    swipeSound();
    ShowStreet(true);

    requestAnimationFrame(searchForButtons(false, args.location));
}
