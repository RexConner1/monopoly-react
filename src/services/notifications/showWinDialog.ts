export function showWinDialog(player: any, socket: any, context: any, reason: string) {
    const { notifyRef } = context;
    const isYou = player.id === socket.id;

    notifyRef.current?.dialog(
        (btn : any) => ({
            innerHTML: `<h3>${isYou ? "YOU WON!" : `${player.username} WON!`}</h3><p>${reason}</p>`,
            buttons: [btn("PLAY ANOTHER GAME", () => location.reload())],
        }),
        "winning"
    );
}
