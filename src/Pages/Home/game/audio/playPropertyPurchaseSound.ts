export function playPropertyPurchaseSound(player: any, args: any, settings: any) {
    if (!player) return;

    if (JSON.stringify(player.properties) !== JSON.stringify(args.pJson.properties)) {
        const audio = new Audio("./buying1.mp3");
        audio.volume =
            0.5 *
            ((settings?.audio[1] ?? 100) / 100) *
            ((settings?.audio[0] ?? 100) / 100);
        audio.play();
    }
}
