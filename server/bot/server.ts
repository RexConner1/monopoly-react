import { Server } from "../../src/assets/sockets";
import { createMonopolyServer } from "../shared/server";

export async function main(f?: (Server: Server) => void) {
    const maxPlayers = 6;

    createMonopolyServer({
        maxPlayers,
        onServerCreated: (_host, server) => {
            f?.(server);
        },
        disconnectWhenUnavailable: true,
    });
}
