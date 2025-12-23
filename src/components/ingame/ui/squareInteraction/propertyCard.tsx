import StreetCard from "../cards/streetCard"

export function PropertyCard({
    streetType,
    streetDisplay
}: any) {
    if (streetType === "Railroad") {
        return <StreetCard railroad={streetDisplay} />;
    }

    if (streetType === "Utilities") {
        return <StreetCard utility={streetDisplay} />;
    }

    return <StreetCard street={streetDisplay} />;
}
