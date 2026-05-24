import { Player } from "../../assets/player";
import { Property } from "../../../shared/types/property";

export function renderUpgradeButtons({
    container,
    property,
    player,
    location,
    onAdvanceBuy,
    onContinue,
    onClose,
}: {
    container: HTMLDivElement;
    property: Property;
    player: Player;
    location: number;
    onAdvanceBuy: (payload: object) => void;
    onContinue: () => void;
    onClose: () => void;
}) {
    container.replaceChildren();

    const propIndex = player.properties.findIndex(
        v => v.position === location
    );

    if (propIndex === -1) return;

    const rawCount = player.properties[propIndex].count;
    const count = rawCount === "h" ? 5 : rawCount;

    const balance = player.balance;

    for (let index = count + 1; index < 6; index++) {
        const btn = document.createElement("button");

        if (index === 5) {
            createBuyHotelButton({
                button: btn,
                index,
                count,
                houseCost: property.hotelcost ?? 0,
                playerBalance: balance,
                onAdvanceBuy,
                closeStreet: onClose,
            });
        } else {
            createBuyHouseButton({
                button: btn,
                index,
                count,
                houseCost: property.housecost ?? 0,
                playerBalance: balance,
                onAdvanceBuy,
                closeStreet: onClose,
            });
        }

        container.appendChild(btn);
    }

    createContinueButton({
        parent: container,
        onContinue,
        onClose
    });
}

function createBuyHotelButton({
    button,
    index,
    count,
    houseCost,
    playerBalance,
    onAdvanceBuy,
    closeStreet,
}: {
    button: HTMLButtonElement;

    index: number;
    count: number;

    houseCost: number;
    playerBalance: number;

    onAdvanceBuy: (payload: { state: number; money: number }) => void;
    closeStreet: () => void;
}) {
    button.innerHTML = "Buy hotel";

    // rule: must have 4 houses and enough money
    const cannotAfford = houseCost > playerBalance;
    const notNextState = index !== count + 1;

    button.disabled = cannotAfford || notNextState;

    button.onclick = () => {
        onAdvanceBuy({
            state: index,
            money: 1,
        });

        closeStreet();
    };
}

function createBuyHouseButton({
    button,
    index,
    count,
    houseCost,
    playerBalance,
    onAdvanceBuy,
    closeStreet,
}: {
    button: HTMLButtonElement;

    index: number;
    count: number;

    houseCost: number;
    playerBalance: number;

    onAdvanceBuy: (payload: { state: number; money: number }) => void;
    closeStreet: () => void;
}) {
    const housesToBuy = index - count;
    const totalCost = housesToBuy * houseCost;

    button.innerHTML = `Buy ${index} house${index > 1 ? "s" : ""}`;

    button.disabled = totalCost > playerBalance;

    button.onclick = () => {
        onAdvanceBuy({
            state: index,
            money: housesToBuy,
        });

        closeStreet();
    };
}

function createContinueButton({
    parent,
    onContinue,
    onClose
}: {
    parent: HTMLElement;
    onContinue: () => void;
    onClose: () => void;
}) {
    const btn = document.createElement("button");

    btn.innerHTML = "CONTINUE";

    btn.onclick = () => {
        onContinue();
        onClose();
    };

    parent.appendChild(btn);

    return btn;
}
