export function getPlayerElement(playerId: string): HTMLDivElement {
    return document.querySelector(
        `div.player[player-id="${playerId}"]`
    ) as HTMLDivElement;
}
