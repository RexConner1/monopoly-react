import { waitForElement } from "../../dom/waitForElement";
import { clearElement } from "../../dom/clearElement";
import { normalizeHouseCount, findPropertyIndex } from "../../rules/purchase/propertyLogic";
import { renderPurchaseButtons } from "./renderPurchaseButtons";
import { createContinueButton } from "./commonButtons";

export function handleAdvancedPurchase({
    propretyMap,
    location,
    localPlayer,
    args,
    prop,
    ShowStreet,
    clickSound
}: any) {
    waitForElement<HTMLDivElement>("div#advanced-responses", (container) => {
        const property = propretyMap.get(location);
        if (!property) return;

        clearElement(container);

        const propertyIndex = findPropertyIndex(
            localPlayer.properties,
            args.location
        );
        if (propertyIndex === -1) return;

        const currentCount = normalizeHouseCount(
            localPlayer.properties[propertyIndex].count
        );

        const balance =
            prop.players.find((v:any) => v.id === prop.socket.id)?.balance ?? 0;

        renderPurchaseButtons(
            container,
            property,
            currentCount,
            balance,
            (nextState, money) => {
                args.onResponse("advance-buy", {
                    state: nextState,
                    money
                });
                ShowStreet(false);
            }
        );

        container.appendChild(
            createContinueButton(() => {
                clickSound();
                args.onResponse("nothing", {});
                ShowStreet(false);
            })
        );
    });
}
