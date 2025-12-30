import { createButton } from "../../ui/dom/buttonFactory";
import { canAfford, housePurchaseCost } from "../../game/rules/purchase/purchaseRules";

export function renderPurchaseButtons(
    container: HTMLDivElement,
    property: any,
    currentCount: number,
    balance: number,
    onPurchase: (nextState: number, money: number) => void
) {
    for (let nextCount = currentCount + 1; nextCount <= 5; nextCount++) {
        const isHotel = nextCount === 5;

        const cost = isHotel
            ? property.ohousecost ?? 0
            : housePurchaseCost(
                  nextCount - currentCount,
                  property.housecost ?? 0
              );

        const disabled =
            nextCount !== currentCount + 1 ||
            !canAfford(cost, balance);

        const label = isHotel
            ? "buy hotel"
            : `buy ${nextCount} house${nextCount > 1 ? "s" : ""}`;

        container.appendChild(
            createButton(
                label,
                () => onPurchase(
                    nextCount,
                    isHotel ? 1 : nextCount - currentCount
                ),
                disabled
            )
        );
    }
}
