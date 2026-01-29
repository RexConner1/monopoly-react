import monopolyJSON from "./monopoly.json";

export type PropertyGroup =
    | "Purple"
    | "lightgreen"
    | "Violet"
    | "Orange"
    | "Red"
    | "Yellow"
    | "darkgreen"
    | "darkblue"
    | "Utilities"
    | "Railroad"
    | "Special";

export interface Property {
    name: string;
    id: string;
    posistion: number;
    group: PropertyGroup;

    // ownership
    ownedby?: number;
    mortgaged?: boolean;

    // pricing
    price?: number;
    rent?: number;
    multpliedrent?: number[];
    housecost?: number;
    hotelcost?: number;

    // houses
    buildings?: number;

    // probability stats
    averageProbability?: number;

    // misc relational metadata
    rel?: {
        Square: string;
        "Probability % (Jail Short)"?: number;
        "Probability % (Jail Long)"?: number;
        Rank?: number;
    };
}

export const properties: Property[] = monopolyJSON.properties as Property[];

export const propertyById = new Map(
    properties.map(p => [p.id, p])
);

export const propertyByPosition = new Map(
    properties.map(p => [p.posistion, p])
);


export function getPropertyById(id: string) {
    return propertyById.get(id);
}

export function getPropertyByPosition(pos: number) {
    return propertyByPosition.get(pos);
}
