import type { Player } from "../assets/player.ts";

export type DestroyPlayerDeps = {
    clients: Map<string, Player>;
    setClients: (next: Map<string, Player>) => void;
};

/**
 * Removes a player from the local clients map and ensures their DOM element is removed.
 * The DOM cleanup is intentionally defensive (requestAnimationFrame re-checks) because
 * the game uses direct DOM queries for some UI effects.
 */
export function destroyPlayer(playerId: string, deps: DestroyPlayerDeps) {
    const { clients, setClients } = deps;

    // 1) remove from clients
    function removePlayerFromState() {
        clients.delete(playerId);
        setClients(new Map(clients));

        requestAnimationFrame(() => {
            if (clients.has(playerId)) requestAnimationFrame(removePlayerFromState);
        });
    }
    removePlayerFromState();

    // 2) remove from DOM
    function removePlayerDomNode() {
        const el = document.querySelector(`div.player[player-id="${playerId}"]`);
        if (!el) return;
        if (el.parentElement) el.parentElement.removeChild(el);
        el.remove();

        requestAnimationFrame(() => {
            if (document.querySelector(`div.player[player-id="${playerId}"]`) !== null) {
                requestAnimationFrame(removePlayerDomNode);
            }
        });
    }
    removePlayerDomNode();
}
