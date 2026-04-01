import { NotificatorRef } from "../../components/notificator";
import { DialogKind, DialogPayload } from "./dialogTypes";
import { dialogTemplates } from "./dialogTemplates";

export function showDialog(
    notifier: React.RefObject<NotificatorRef>,
    type: DialogKind,
    payload: DialogPayload = {},
    soundtrack: "winning" | "losing" = "winning"
) {
    const template = dialogTemplates[type](payload);

    notifier.current?.dialog(
        (close, createButton) => ({
            innerHTML: `
                <h3>${template.title}</h3>
                <p>${template.body}</p>
            `,
            buttons: [
                createButton("PLAY ANOTHER GAME", () => {
                    close();
                    document.location.reload();
                }),
            ],
        }),
        soundtrack
    );
}
