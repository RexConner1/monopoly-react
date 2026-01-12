import { Player } from "../../../assets/player";
import { Socket } from "../../../assets/sockets";
import { Property } from "../../../assets/types";
import { showDialog } from "../../../ui/dialogs/dialogFactory";
import monopolyJSON from "../../../assets/monopoly.json";

export function handleMonopolsTrains({
    winningMode,
    clients,
    notifyRef,
    socket,
    mainTheme
}: {
    winningMode: string;
    clients: Map<string, Player>;
    notifyRef: React.RefObject<any>;
    socket: Socket;
    mainTheme: HTMLAudioElement;
}) {
    if (winningMode === "monopols" || winningMode === "monopols & trains") {
        function removeDuplicates(originalList: Array<any>) {
            // Create an empty array to store unique values
            const uniqueList: Array<any> = [];

            // Use the filter method to iterate through the original list
            originalList.filter(function (item) {
                // If the item is not already in the uniqueList, add it
                if (!uniqueList.includes(item)) {
                    uniqueList.push(item);
                }
                // Always return false in the filter function to skip duplicates
                return false;
            });

            // Return the uniqueList
            return uniqueList;
        }
        for (const p of Array.from(clients.values())) {
            const prpGrups = [];
            for (const prp of p.properties) {
                if (!["Special", "Railroad", "Utilities"].includes(prp.group)) prpGrups.push(prp.group);
            }
            let x: number = 0;

            for (const g of removeDuplicates(prpGrups)) {
                const c = prpGrups.filter((v) => v === g).length;
                const monopolyProperties = monopolyJSON.properties as Property[];
                const cc = monopolyProperties.filter((v) => v.group === g).length;
                if (c === cc) {
                    x += 1;
                }
            }
            if (x === 3) {
                mainTheme.pause();
                if (p.id === socket.id) {
                    showDialog(notifyRef, "THREE_SETS");
                } else {
                    showDialog(notifyRef, "THREE_SETS", {
                        playerName: p.username
                    });
                }
                return;
            }
        }
        if (winningMode === "monopols & trains") {
            // continue with trains winning state!
            for (const p of Array.from(clients.values())) {
                const c = p.properties.filter((v) => v.group === "Railroad").length;
                if (c === 4) {
                    mainTheme.pause();
                    if (p.id === socket.id) {
                        showDialog(notifyRef, "FOUR_RAILROADS");
                    } else {
                        showDialog(notifyRef, "FOUR_RAILROADS", {
                            playerName: p.username
                        });
                    }
                    return;
                }
            }
        }
    }
}
