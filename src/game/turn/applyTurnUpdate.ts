import { playPropertyPurchaseSound } from "../audio/playPropertyPurchaseSound";

export function applyTurnUpdate(args: any, context: any) {
    const { clients, settings, socket, SetClients } = context;
    const player = clients.get(args.from);

    playPropertyPurchaseSound(player, args, settings);

    if (args.from !== socket.id && player) {
        player.recieveJson(args.pJson);
        SetClients(new Map(clients.set(args.from, player)));
    }
}
