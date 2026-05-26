import { NotificationType } from "./notificationTypes";
import { notificationTemplates } from "./notificationTemplates";

export type MessageNotifierRef = {
    current: {
        message?: (
            message: string,
            type?: "info" | "warn" | "error",
            time?: number,
            after?: () => void,
            sfx?: boolean
        ) => void;
    } | null;
};

export function notifyMessage(
    notifier: MessageNotifierRef, //React.RefObject<NotificatorRef>,
    type: NotificationType,
    payload: {
        name?: string;
        amount?: number;
    } = {},
    options?: {
        level?: "info" | "warn" | "error";
        duration?: number;
        playSound?: boolean;
    }
) {
    const message = notificationTemplates[type](payload);

    notifier.current?.message?.(
        message,
        options?.level ?? "info",
        options?.duration ?? 2,
        () => {},
        options?.playSound ?? false
    );
}
