import { Player } from "../../../assets/player";
import { PlayerProprety } from "../../../assets/types";

export function findPropertyOwner(
    clients: Map<string, Player>,
    location: number
): { owner: Player; prp: PlayerProprety } | null {
    for (const p of clients.values()) {
        const prp = p.properties.find(v => v.posistion === location);
        if (prp) return { owner: p, prp };
    }
    return null;
}
