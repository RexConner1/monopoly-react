import monopolyJSON from "../../assets/monopoly.json";
import { unique } from "../utils/unique";
import { showWinDialog } from "../../ui/dialogs/showWinDialog";

export function checkMonopolyWin(context: any): boolean {
    const { clients, socket, mainTheme } = context;

    for (const player of clients.values()) {
        const groups = player.properties
            .filter((p : any) => !["Special", "Railroad", "Utilities"].includes(p.group))
            .map((p : any) => p.group);

        let completed = 0;

        for (const g of unique(groups)) {
            const owned = groups.filter((v : any) => v === g).length;
            const total = monopolyJSON.properties.filter(v => v.group === g).length;
            if (owned === total) completed++;
        }

        if (completed === 3) {
            mainTheme.pause();
            showWinDialog(player, socket, context, "3 full monopolies");
            return true;
        }
    }
    return false;
}
