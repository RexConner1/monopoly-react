import HouseIcon from "../../../../public/h.png";
import HotelIcon from "../../../../public/ho.png";
import { calculateDisplayedRent } from "../../../game/rules/calculateRent";

export function renderPropertySlot({
    slot,
    property,
    player,
    settings
}: any) {
    slot.setAttribute("data-tooltip-hover", player.username);
    slot.style.cursor = "pointer";
    slot.style.zIndex = "5";

    slot.onclick = () => {
        const playerEl = document.querySelector(
            `div.player[player-id="${player.id}"]`
        ) as HTMLDivElement;

        playerEl.style.animation =
            "spin2 1s cubic-bezier(.21, 1.57, .55, 1) infinite";

        setTimeout(() => {
            playerEl.style.animation = "";
        }, 1000);
    };

    switch (property.count) {
        case 0:
            renderEmptyProperty(slot, property, player, settings);
            break;

        case 1:
        case 2:
        case 3:
        case 4:
            renderHouses(slot, property.count);
            break;

        case "h":
            renderHotel(slot);
            break;
    }
}

function renderEmptyProperty(
    slot: HTMLDivElement,
    property: any,
    player: any,
    settings: any
) {
    let rent = calculateDisplayedRent(property, player);

    if (rent > 0) {
        slot.innerHTML = `<p>${rent}M</p>`;
        applyOwnerStyling(slot, player, settings, true);
    } else {
        slot.style.backgroundColor = "rgba(0,0,0,25%)";
        applyOwnerStyling(slot, player, settings, false);
    }
}

function renderHouses(slot: HTMLDivElement, count: number) {
    for (let i = 0; i < count; i++) {
        const img = document.createElement("img");
        img.src = HouseIcon.replace("public/", "");
        slot.appendChild(img);
    }
}

function renderHotel(slot: HTMLDivElement) {
    const img = document.createElement("img");
    img.src = HotelIcon.replace("public/", "");
    slot.appendChild(img);
}

function applyOwnerStyling(
    slot: HTMLDivElement,
    player: any,
    settings: any,
    highlight: boolean
) {
    if (settings?.accessibility?.[4]) {
        slot.style.backgroundColor = player.color;
        slot.style.boxShadow = "0px 0px 5px black";
    } else if (highlight) {
        slot.style.backgroundColor = "rgba(0,0,0,75%)";
    }
}
