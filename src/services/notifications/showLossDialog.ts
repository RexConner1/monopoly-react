export function showLossDialog(context: any) {
    const { notifyRef } = context;
    notifyRef.current?.dialog(
        (close : any, btn : any) => ({
            innerHTML: "<h3>YOU LOST</h3>",
            buttons: [
                btn("CONTINUE WATCHING", close),
                btn("PLAY ANOTHER GAME", () => location.reload()),
            ],
        }),
        "loosing"
    );
}
