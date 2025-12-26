import { movePlayerToSquare } from "./movePlayerToSquare";
import { updatePlayerVisuals } from "./updatePlayerVisuals";

export function renderPlayer({
    player,
    rotation,
    settings
}: any) {
    const location = player.position;
    const element =
        document.querySelector(
            `div.player[player-id="${player.id}"]`
        ) as HTMLDivElement | null;

    if (!element) {
        createPlayer(player);
        return;
    }

    movePlayerToSquare(element, location);
    updatePlayerVisuals({
        player,
        element,
        rotation,
        settings
    });
}

function createPlayer(player: any) {
    const icon = player.icon + 1;

    const element = document.createElement("div");
    element.className = "player";
    element.setAttribute("player-id", player.id);
    element.setAttribute(
        "player-position",
        player.position.toString()
    );

    const wrapper = document.createElement("div");
    wrapper.setAttribute("data-tooltip-hover", player.username);

    const img = document.createElement("img");
    img.src = `./p${icon}.png`;
    wrapper.appendChild(img);

    element.appendChild(wrapper);

    if (player.isInJail) {
        const jailImg = document.createElement("img");
        jailImg.src = "./jail.png";
        jailImg.className = "jailIcon";
        element.appendChild(jailImg);
    }

    document
        .querySelector(`div.street[data-position="${player.position}"]`)
        ?.appendChild(element);
}
