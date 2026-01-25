export type BuyHotelButtonArgs = {
    button: HTMLButtonElement;

    index: number;
    count: number;

    houseCost: number;
    playerBalance: number;

    onAdvanceBuy: (payload: { state: number; money: number }) => void;
    closeStreet: () => void;
};

export function createBuyHotelButton({
    button,
    index,
    count,
    houseCost,
    playerBalance,
    onAdvanceBuy,
    closeStreet,
}: BuyHotelButtonArgs) {
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
