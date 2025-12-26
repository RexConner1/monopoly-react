export function movePlayerToSquare(
    playerElement: HTMLDivElement,
    position: number
) {
    const currentPos =
        playerElement.parentElement?.getAttribute("data-position");

    if (currentPos && parseInt(currentPos) !== position) {
        playerElement.parentElement?.removeChild(playerElement);
        document
            .querySelector(`div.street[data-position="${position}"]`)
            ?.appendChild(playerElement);
    }
}
