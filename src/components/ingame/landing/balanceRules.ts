export function canPurchase(
    balance: number,
    price: number | undefined
): boolean {
    return balance >= (price ?? 0);
}
