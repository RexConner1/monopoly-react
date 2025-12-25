export function showSpectatorWinDialog(winner: any, context: any) {
    const { notifyRef } = context;

    if (!winner) return;

    notifyRef.current?.dialog(
        (close : any, btn : any) => ({
            innerHTML: `
                <h3>${winner.username} WON!</h3>
                <p>${winner.username} won with a balance of ${winner.balance}</p>
            `,
            buttons: [
                btn("PLAY ANOTHER GAME", () => {
                    close();
                    document.location.reload();
                }),
            ],
        }),
        "winning"
    );
}
