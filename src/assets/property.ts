// game/data/boardData.ts

import monopolyJSON from "./monopoly.json";
import { Property } from "./types";


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
