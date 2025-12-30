import { DialogKind, DialogPayload } from "./dialogTypes";

export const dialogTemplates: Record<
    DialogKind,
    (payload: DialogPayload) => { title: string; body: string }
> = {
    YOU_WIN: ({ balance }) => ({
        title: "YOU WON!",
        body: `You're the only player left with a balance of ${balance ?? 0}`
    }),

    PLAYER_WON: ({ playerName, balance }) => ({
        title: `${playerName} WON!`,
        body: `${playerName} won with a balance of ${balance ?? 0}`
    }),

    YOU_LOST: ({ balance }) => ({
        title: "YOU LOST!",
        body: `You lost the game with a balance of ${-(balance ?? 0)}`
    }),

    DISCONNECTED: () => ({
        title: "LOST CONNECTION",
        body: "You were disconnected from the game"
    }),

    THREE_SETS: ({ playerName }) => ({
        title: playerName ? `${playerName} WON!` : "YOU WON!",
        body: "Got 3 property sets!"
    }),

    FOUR_RAILROADS: ({ playerName }) => ({
        title: playerName ? `${playerName} WON!` : "YOU WON!",
        body: "Got 4 railroads!"
    }),
};
