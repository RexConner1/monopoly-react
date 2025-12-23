export function isUnaffordable(
    balance: number,
    price: number | undefined
): boolean {
    return balance - (price ?? 0) < 0;
}

export function shouldExitForOwnership(
    belongToMe: boolean,
    belongToOthers: boolean
): "me" | "others" | null {
    if (belongToMe) return "me";
    if (belongToOthers) return "others";
    return null;
}
