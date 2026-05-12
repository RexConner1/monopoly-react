import { Server } from "../../src/assets/sockets.ts";
import { createMonopolyServer } from "../shared/server.ts";

export async function main(
    playersCount: number,
    f?: (host: string, Server: Server) => void
) {
    const maxPlayers = playersCount > 0 ? Math.min(playersCount, 6) : 6;

    createMonopolyServer({
        maxPlayers,
        onServerCreated: f,
        disconnectWhenUnavailable: false,
    });
}
