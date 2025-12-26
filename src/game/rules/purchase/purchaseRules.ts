export function canAfford(
    cost: number,
    balance: number
): boolean {
    return cost <= balance;
}

export function housePurchaseCost(
    housesToBuy: number,
    houseCost: number
): number {
    return housesToBuy * houseCost;
}
