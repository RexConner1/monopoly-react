export function calculateMoves(
    current: number,
    target: number,
    adding: boolean
): number {
    if (adding) {
        let moves = (target - current) % 40;
        if (moves < 0) moves += 40;
        return moves;
    }

    let moves = current - target;
    if (moves < 0) moves += 40;
    return moves;
}
