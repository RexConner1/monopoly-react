export type DialogKind =
    | "YOU_WIN"
    | "PLAYER_WON"
    | "YOU_LOST"
    | "DISCONNECTED"
    | "THREE_SETS"
    | "FOUR_RAILROADS";

export type DialogPayload = {
    playerName?: string;
    balance?: number;
};
