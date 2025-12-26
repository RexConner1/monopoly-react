import { showLossDialog } from "../../services/notifications/showLossDialog";
import { showSpectatorWinDialog } from "../../services/notifications/showSpectatorWinDialog";

export function handleBankruptcy(args: any, context: any): boolean {
    const { clients, socket, destroyPlayer, mainTheme, notifyRef } = context;

    if (args.pJson.balance >= 0) return false;

    mainTheme.pause();

    if (args.pJson.id === socket.id) {
        showLossDialog(context);
    } else if (clients.size > 2) {
        notifyRef.current?.message(`${args.pJson.username} lost`, "info");
    } else {
        const winner = [...clients.values()].find(p => p.id !== args.pJson.id);
        showSpectatorWinDialog(winner, context);
    }

    destroyPlayer(args.pJson.id);
    return true;
}
