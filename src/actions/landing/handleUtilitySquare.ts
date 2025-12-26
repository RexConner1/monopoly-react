import { canPurchase } from "../../game/rules/landing/balanceRules";
import { buildUtilityDisplay } from "../../game/rules/landing/displayBuilders";

export function handleUtilitySquare({
    x,
    belongToMe,
    belongToOthers,
    localPlayer,
    args,
    ShowStreet,
    SetStreetType,
    SetStreetDisplay,
    SetAdvancedStreet,
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

    SetStreetType("Utilities");
    SetStreetDisplay(buildUtilityDisplay(x));
    SetAdvancedStreet(false);

    swipeSound();
    ShowStreet(true);

    requestAnimationFrame(
        searchForButtons(false, args.location, { rolls: args.rolls })
    );
}
