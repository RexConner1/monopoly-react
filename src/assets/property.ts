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
    position: number;
    group: PropertyGroup;
    price?: number;
    rent?: number;
    multpliedrent?: number[];
    housecost?: number;
    hotelcost?: number;
}

export const properties: Property[] = monopolyJSON.properties as Property[];

export const propertyById = new Map(
    properties.map(p => [p.id, p])
);

export const propertyByPosition = new Map(
    properties.map(p => [p.position, p])
);


export function getPropertyById(id: string) {
    return propertyById.get(id);
}

export function getPropertyByPosition(pos: number) {
    return propertyByPosition.get(pos);
}
