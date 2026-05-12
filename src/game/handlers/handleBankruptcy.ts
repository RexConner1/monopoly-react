import { PlayerJSON } from "../../../shared/types/player";
import { GameContext } from "../../assets/gameContext";
import { showDialog } from "../../ui/dialogs/dialogFactory";
import { notifyMessage } from "../../ui/notifications/notificationFactory";

export function handlePlayerBankruptcy({
    bankruptPlayer,
    mainTheme,
    ctx,
    destroyPlayer
}: {
    bankruptPlayer: PlayerJSON;
    mainTheme: HTMLAudioElement;
    ctx: GameContext
    destroyPlayer: (id: string) => void;
}) {
    if (bankruptPlayer.balance < 0) {
        if (bankruptPlayer.id !== ctx.socket.id) {
            if (ctx.clients.size > 2) {
                const name = bankruptPlayer.username;
                notifyMessage(ctx.notifyRef, "PLAYER_LOST", { name });
            } else {
                if (ctx.clients.has(ctx.socket.id)) {
                    mainTheme.pause();
                    showDialog(ctx.notifyRef, "YOU_WIN", {
                        balance: ctx.clients.get(ctx.socket.id)?.balance
                    });
                } else {
                    const xclient = Array.from(ctx.clients.values()).filter((v) => v.id !== bankruptPlayer.id)[0];
                    const name = xclient.username ?? 0;
                    mainTheme.pause();
                    showDialog(ctx.notifyRef, "PLAYER_WON", {
                        playerName: name,
                        balance: ctx.clients.get(ctx.socket.id)?.balance
                    });
                }
            }
        } else {
            mainTheme.pause();
            showDialog(ctx.notifyRef, "YOU_LOST", {
                balance: ctx.clients.get(ctx.socket.id)?.balance
            }, "losing");
        }

        destroyPlayer(bankruptPlayer.id);
    }
}