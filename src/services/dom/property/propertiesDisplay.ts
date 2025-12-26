import { resetPropertySlots } from "./resetPropertySlots";
import { renderPropertySlot } from "./renderPropertySlot";

export function propertiesDisplay(
    container: HTMLDivElement,
    players: any[],
    settings: any
) {
    resetPropertySlots(container);

    for (const player of players) {
        for (const property of player.properties) {
            const slot = container.querySelector(
                `div.street-houses[data-position="${property.posistion}"]`
            ) as HTMLDivElement | null;

            if (!slot) continue;

            renderPropertySlot({
                slot,
                property,
                player,
                settings
            });
        }
    }
}
