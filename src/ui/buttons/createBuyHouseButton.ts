export type BuyHouseButtonArgs = {
    button: HTMLButtonElement;

    index: number;
    count: number;

    houseCost: number;
    playerBalance: number;

    onAdvanceBuy: (payload: { state: number; money: number }) => void;
    closeStreet: () => void;
};

export function createBuyHouseButton({
    button,
    index,
    count,
    houseCost,
    playerBalance,
    onAdvanceBuy,
    closeStreet,
}: BuyHouseButtonArgs) {
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
