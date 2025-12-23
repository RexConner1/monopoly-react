import { PropertyCard } from "./propertyCard";
import { PropertyActions } from "./propertyActions";

export function PropertyPanel({
    streetType,
    streetDisplay,
    advancedStreet
}: any) {
    return (
        <>
            <h3>
                {advancedStreet
                    ? "would you like to buy this card?"
                    : "you can buy houses and hotels"}
            </h3>

            <PropertyCard
                streetType={streetType}
                streetDisplay={streetDisplay}
            />

            <PropertyActions advancedStreet={advancedStreet} />
        </>
    );
}
