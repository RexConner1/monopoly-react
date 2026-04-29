import { Player } from "../../assets/player";

export function createPlayerElement({
    player,
    icon,
    inJail,
}: {
    player: Player;
    icon: number;
    inJail: boolean;
}) {
    const element = document.createElement("div");
    element.className = "player";
    element.setAttribute("player-id", player.id);
    element.setAttribute("player-position", player.position.toString());

    const inner = document.createElement("div");
    inner.setAttribute("data-tooltip-hover", player.username);

    const image = document.createElement("img");
    image.src = `./p${icon}.png`;

    inner.appendChild(image);
    element.appendChild(inner);

    if (inJail) {
        const jailImage = document.createElement("img");
        jailImage.src = "./jail.png";
        jailImage.className = "jailIcon";
        element.appendChild(jailImage);
    }

    return element;
}
