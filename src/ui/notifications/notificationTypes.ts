export type NotificationType =
    | "PLAYER_DISCONNECTED"
    | "PLAYER_LOST"
    | "MONEY_DEDUCTED"
    | "MONEY_ADDED"
    | "MORTGAGE_DEDUCTED"
    | "MORTGAGE_CANCELED";

export type NotificationPayload = {
    name?: string;
    amount?: number;
};
