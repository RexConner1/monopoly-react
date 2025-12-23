import { renderPlayer } from "./renderPlayer";

export function animatePlayers({
    players,
    rotation,
    settings,
    continueAnimation,
    onFrameComplete
}: any) {
    for (const player of players.filter((p: any) => p.balance >= 0)) {
        renderPlayer({
            player,
            rotation,
            settings
        });
    }

    onFrameComplete?.();

    if (continueAnimation()) {
        requestAnimationFrame(() =>
            animatePlayers({
                players,
                rotation,
                settings,
                continueAnimation,
                onFrameComplete
            })
        );
    }
}
