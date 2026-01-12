import { Player, PlayerJSON } from "../../../assets/player";
import { Socket } from "../../../assets/sockets";
import { showDialog } from "../../../ui/dialogs/dialogFactory";
import { notifyMessage } from "../../../ui/notifications/notificationFactory";

export function handlePlayerBankruptcy({
    bankruptPlayer,
    clients,
    socket,
    notifyRef,
    mainTheme,
    destroyPlayer
}: {
    bankruptPlayer: PlayerJSON;
    clients: Map<string, Player>;
    socket: Socket;
    notifyRef: React.RefObject<any>;
    mainTheme: HTMLAudioElement;
    destroyPlayer: (id: string) => void;
}) {
 
    if (bankruptPlayer.balance < 0) {
        if (bankruptPlayer.id !== socket.id) {
            if (clients.size > 2) {
                const name = bankruptPlayer.username;
                notifyMessage(notifyRef, "PLAYER_LOST", { name });
            } else {
                if (clients.has(socket.id)) {
                    mainTheme.pause();
                    showDialog(notifyRef, "YOU_WIN", {
                        balance: clients.get(socket.id)?.balance
                    });
                } else {
                    const xclient = Array.from(clients.values()).filter((v) => v.id !== bankruptPlayer.id)[0];
                    const name = xclient.username ?? 0;
                    mainTheme.pause();
                    showDialog(notifyRef, "PLAYER_WON", {
                        playerName: name,
                        balance: clients.get(socket.id)?.balance
                    });
                }
            }
        } else {
            mainTheme.pause();
            showDialog(notifyRef, "YOU_LOST", {
                balance: clients.get(socket.id)?.balance
            }, "losing");
        }

        destroyPlayer(bankruptPlayer.id);
    }
}