import { ChanceOrChestPanel } from "./chanceOrChestPanel";
import { PropertyPanel } from "./propertyPanel";

export function StreetDisplayContainer({
    streetType,
    streetDisplay,
    showStreet,
    advancedStreet
}: any) {
    const isChanceLike =
        streetType === "Chance" || streetType === "CommunityChest";

    return (
        <div
            className={
                isChanceLike
                    ? "chance-display-actions"
                    : "card-display-actions"
            }
            style={
                showStreet
                    ? {}
                    : { transform: "translateY(-50%) translateX(-70vw)" }
            }
        >
            {isChanceLike ? (
                <ChanceOrChestPanel streetDisplay={streetDisplay} />
            ) : (
                <PropertyPanel
                    streetType={streetType}
                    streetDisplay={streetDisplay}
                    advancedStreet={advancedStreet}
                />
            )}
        </div>
    );
}
