import { useMemo } from "react";

type MonopolyJson = {
    properties: Array<{
        id: string;
        name: string;
        posistion: number;
        group?: string;
        [k: string]: any;
    }>;
};

export function usePropertyMaps(monopolyJSON: MonopolyJson) {
    const propertyByPosition = useMemo(() => {
        return new Map(monopolyJSON.properties.map((obj) => [obj.posistion ?? 0, obj]));
    }, [monopolyJSON]);

    const propertyById = useMemo(() => {
        return new Map(monopolyJSON.properties.map((obj) => [obj.id, obj]));
    }, [monopolyJSON]);

    return { propertyByPosition, propertyById };
}
