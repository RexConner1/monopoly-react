import { canPurchase } from "../../game/rules/landing/balanceRules";
import { buildStreetDisplay } from "../../game/rules/landing/displayBuilders";

export function handleStreetSquare({
    x,
    belongToMe,
    belongToOthers,
    count,
    localPlayer,
    args,
    ShowStreet,
    SetStreetType,
    SetStreetDisplay,
    SetAdvancedStreet,
    swipeSound,
    searchForButtons
}: any) {
    if (!belongToMe && !canPurchase(localPlayer.balance, x.price)) {
        args.onResponse("nothing", {});
        ShowStreet(false);
        return;
    }

    if (belongToOthers) {
        args.onResponse("someones", {});
        ShowStreet(false);
        return;
    }

    if (belongToMe && count === "h") {
        args.onResponse("nothing", {});
        ShowStreet(false);
        return;
    }

    SetStreetType("Street");
    SetStreetDisplay(buildStreetDisplay(x));
    SetAdvancedStreet(belongToMe);

    swipeSound();
    ShowStreet(true);

    requestAnimationFrame(
        searchForButtons(belongToMe, args.location)
    );
}
