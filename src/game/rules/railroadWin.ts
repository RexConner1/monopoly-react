import { showWinDialog } from "../../services/notifications/showWinDialog";

export function checkRailroadWin(context: any): boolean {
    const { clients, socket, mainTheme } = context;

    for (const player of clients.values()) {
        if (player.properties.filter((p : any) => p.group === "Railroad").length === 4) {
            mainTheme.pause();
            showWinDialog(player, socket, context, "all railroads");
            return true;
        }
    }
    return false;
}
