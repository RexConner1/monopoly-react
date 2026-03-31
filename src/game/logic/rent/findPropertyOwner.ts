import { Player } from "../../../assets/player";
import { PlayerProperty } from "../../../assets/types";

export function findPropertyOwner(
    clients: Map<string, Player>,
    location: number
): { owner: Player; prp: PlayerProperty } | null {
    for (const p of clients.values()) {
        const prp = p.properties.find(v => v.position === location);
        if (prp) return { owner: p, prp };
    }
    return null;
}
