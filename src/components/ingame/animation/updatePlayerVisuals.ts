export function updatePlayerVisuals({
    player,
    element,
    rotation,
    settings
}: any) {
    const container = element.querySelector("div") as HTMLDivElement;

    container.style.rotate = `${-rotation}deg`;
    container.style.aspectRatio = "1";

    // Accessibility coloring
    if (settings?.accessibility?.[4]) {
        container.setAttribute("data-tooltip-color", player.color);
    } else if (container.hasAttribute("data-tooltip-color")) {
        const img = container.querySelector("img") as HTMLImageElement;
        if (img) img.style.filter = "";
        container.removeAttribute("data-tooltip-color");
    }

    syncJailIcon(player.isInJail, element, player);
}

function syncJailIcon(
    isInJail: boolean,
    element: HTMLDivElement,
    player: any
) {
    const hasJailIcon = element.querySelector("img.jailIcon") !== null;

    if (!isInJail && hasJailIcon) {
        const jailIcon = element.querySelector("img.jailIcon")!;
        jailIcon.remove();
        return;
    }

    if (isInJail && !hasJailIcon) {
        element.replaceChildren(createPlayerIcon(player, true));
    }
}

function createPlayerIcon(player: any, includeJail: boolean) {
    const icon = player.icon + 1;

    const wrapper = document.createElement("div");
    wrapper.setAttribute("data-tooltip-hover", player.username);

    const img = document.createElement("img");
    img.src = `./p${icon}.png`;
    wrapper.appendChild(img);

    if (includeJail) {
        const jailImg = document.createElement("img");
        jailImg.src = "./jail.png";
        jailImg.className = "jailIcon";
        wrapper.appendChild(jailImg);
    }

    return wrapper;
}
