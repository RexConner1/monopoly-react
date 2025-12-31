import { NotificatorRef } from "../../components/notificator";
import { NotificationType } from "./notificationTypes";
import { notificationTemplates } from "./notificationTemplates";

export function notifyMessage(
    notifier: React.RefObject<NotificatorRef>,
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

    notifier.current?.message(
        message,
        options?.level ?? "info",
        options?.duration ?? 2,
        () => {},
        options?.playSound ?? false
    );
}
