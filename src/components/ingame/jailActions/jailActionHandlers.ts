export function handlePayToExitJail({
    socket,
    applyAnimation,
    returnToNormal
}: any) {
    applyAnimation(1);
    socket.emit("unjail", "pay");
    socket.emit("roll_dice");
    console.warn("pay");
    returnToNormal();
}

export function handleCardToExitJail({
    socket,
    returnToNormal
}: any) {
    socket.emit("unjail", "card");
    socket.emit("roll_dice");
    console.warn("card");
    returnToNormal();
}

export function handleRollInJail({
    socket,
    returnToNormal,
    SetSended,
    SetTimer
}: any) {
    socket.emit("roll_dice");
    console.warn("roll when in jail");
    returnToNormal();
    SetSended(true);
    SetTimer(0);
}
