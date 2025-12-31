// ui/notifications/notificationTemplates.ts

import { NotificationType, NotificationPayload } from "./notificationTypes";

export const notificationTemplates: Record<
    NotificationType,
    (payload: NotificationPayload) => string
> = {
    PLAYER_DISCONNECTED: ({ name }) =>
        `${name ?? "A player"} disconnected`,

    PLAYER_LOST: ({ name }) =>
        `${name ?? "A player"} lost`,

    MONEY_DEDUCTED: ({ amount }) =>
        `${amount ?? 0} of money is deducted from the account`,

    MONEY_ADDED: ({ amount }) =>
        `${amount ?? 0} of money is added to the account`,

    MORTGAGE_DEDUCTED: ({ amount }) =>
        `${amount ?? 0} of money is deducted from the account for mortgage`,

    MORTGAGE_CANCELED: ({ amount }) =>
        `${amount ?? 0} of money is deducted from the account for canceling mortgage`,
};
