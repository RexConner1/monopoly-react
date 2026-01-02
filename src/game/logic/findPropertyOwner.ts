import { Player } from "../../assets/player";

export function findPropertyOwner(players: Player[], position: number) {
    for (const player of players) {
        for (const prop of player.properties) {
            if (prop.posistion === position) {
                return { owner: player, property: prop };
            }
        }
    }
    return null;
}
