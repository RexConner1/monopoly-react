import { Socket, Server } from "../../src/assets/sockets";
import monopolyJSON from "../../src/assets/monopoly.json";
import { GameTrading, MonopolyMode, MonopolyModes, historyAction } from "../../src/assets/types";
import { Player } from "./models/player";
import { PlayerJSON } from "./types/player";
import type { Client } from "./types/client";

export function createMonopolyServer({
    maxPlayers,
    onServerCreated,
    disconnectWhenUnavailable = false,
}: {
    maxPlayers: number;
    onServerCreated?: (host: string, server: Server) => void;
    disconnectWhenUnavailable?: boolean;
}) {
    const Clients = new Map<string, Client>();
    const logs_strings: string[] = [];

    let currentId = "";
    let gameStarted = false;
    let selectedMode: MonopolyMode = MonopolyModes[0];

    function getCurrentTime() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        return `${hours}:${minutes}`;
    }

    function EmitAll(event: string, args: unknown) {
        for (const client of Clients.values()) {
            client.socket.emit(event, args);
        }
    }

    function EmitExcepts(id: string, event: string, args: unknown) {
        for (const [clientId, client] of Clients.entries()) {
            if (clientId !== id) {
                client.socket.emit(event, args);
            }
        }
    }

    function getServerState() {
        return Clients.size < maxPlayers && !gameStarted ? 0 : gameStarted ? 1 : 2;
    }

    function getAlivePlayerIds() {
        return Array.from(Clients.values())
            .filter((v) => v.player.balance > 0)
            .map((v) => v.player.id);
    }

    function advanceTurnFrom(socketId: string) {
        const arr = getAlivePlayerIds();
        if (arr.length === 0) {
            currentId = "";
            return;
        }

        let i = arr.indexOf(socketId);
        i = (i + 1) % arr.length;
        currentId = arr[i];
    }

    function resetBalancesToSelectedMode() {
        for (const client of Clients.values()) {
            client.player.balance = selectedMode.startingCash;
        }
    }

    function emitReady(socketId: string, client: Client) {
        EmitAll("ready", {
            id: socketId,
            state: client.ready,
            selectedMode,
            players: Array.from(Clients.values()).map((v) => v.player.to_json()),
        });
    }

    function handleName(socket: Socket, server: Server, name: string) {
        const player = new Player(
            socket.id,
            name,
            Array.from(Clients.keys()).length,
            selectedMode.startingCash
        );

        if (currentId === "" || !Array.from(Clients.keys()).includes(currentId)) {
            currentId = socket.id;
        }

        Clients.set(socket.id, {
            player,
            socket,
            ready: false,
            positions: { x: 0, y: 0 },
        });

        const connectedMessage = `{${getCurrentTime()}} [${socket.id}] Player "${player.username}" has connected.`;
        server.logFunction(connectedMessage);
        logs_strings.push(connectedMessage);

        const other_players = Array.from(Clients.values()).map((x) => x.player.to_json());

        socket.emit("initials", {
            turn_id: currentId,
            other_players,
            selectedMode,
        });

        EmitExcepts(socket.id, "new-player", player.to_json());

        registerPlayerSocketEvents(socket, server, player);
    }

    function registerPlayerSocketEvents(socket: Socket, server: Server, player: Player) {
        socket.on("unjail", (option: "card" | "pay") => {
            try {
                EmitAll("unjail", {
                    to: player.id,
                    option,
                });
            } catch (e) {
                server.logFunction(e);
            }
        });

        socket.on("roll_dice", () => {
            try {
                const first = Math.floor(Math.random() * 6) + 1;
                const second = Math.floor(Math.random() * 6) + 1;

                const log = `{${getCurrentTime()}} [${socket.id}] Player "${player.username}" rolled a [${first},${second}].`;
                logs_strings.push(log);
                server.logFunction(log);

                const sum = first + second;
                const pos = (player.position + sum) % 40;

                EmitAll("dice_roll_result", {
                    listOfNums: [first, second, pos],
                    turnId: currentId,
                });
            } catch (e) {
                server.logFunction(e);
            }
        });

        socket.on("chorch_roll", (args: { is_chance: boolean; rolls: number }) => {
            try {
                const arr = args.is_chance ? monopolyJSON.chance : monopolyJSON.communitychest;
                const randomElement = arr[Math.floor(Math.random() * arr.length)];

                EmitAll("chorch_result", {
                    element: randomElement,
                    is_chance: args.is_chance,
                    rolls: args.rolls,
                    turnId: currentId,
                });
            } catch (e) {
                server.logFunction(e);
            }
        });

        socket.on("player_update", (args: { playerId: string; pJson: PlayerJSON }) => {
            const xplayer = Clients.get(args.playerId);
            if (!xplayer) return;

            xplayer.player.from_json(args.pJson);
            EmitExcepts(args.playerId, "player_update", args);
        });

        socket.on("finish-turn", (playerInfo: PlayerJSON) => {
            try {
                player.from_json(playerInfo);
                if (currentId !== socket.id) return;

                advanceTurnFrom(socket.id);

                EmitAll("turn-finished", {
                    from: socket.id,
                    turnId: currentId,
                    pJson: player.to_json(),
                    WinningMode: selectedMode.WinningMode,
                });
            } catch (e) {
                server.logFunction(e);
            }
        });

        socket.on("message", (message: string) => {
            try {
                server.logFunction(
                    `{${getCurrentTime()}} [${socket.id}] Player "${Clients.get(socket.id)?.player.username}" has messaged "${message}".`
                );

                EmitAll("message", {
                    from: player.username,
                    message,
                });
            } catch (e) {
                server.logFunction(e);
            }
        });

        socket.on("pay", (args: { balance: number; from: string; to: string }) => {
            try {
                const top = Clients.get(args.to)?.player;
                const fromp = Clients.get(args.from)?.player;

                if (!top || !fromp) return;

                top.balance += args.balance;
                fromp.balance -= args.balance;

                EmitAll("member_updating", {
                    playerId: args.to,
                    animation: "recieveMoney",
                    additional_props: [args.from],
                    pJson: [top.to_json(), fromp.to_json()],
                });
            } catch (e) {
                server.logFunction(e);
            }
        });

        socket.on("mouse", (args: { x: number; y: number }) => {
            const client = Clients.get(socket.id);
            if (!client) return;

            client.positions = args;
            Clients.set(socket.id, client);

            EmitExcepts(socket.id, "mouse", {
                id: socket.id,
                x: args.x,
                y: args.y,
            });
        });

        socket.on("history", (args: historyAction) => {
            EmitAll("history", args);
        });

        socket.on("trade", () => {
            if (!selectedMode.AllowDeals) return;
            EmitAll("trade", {});
        });

        socket.on("cancel-trade", () => {
            if (!selectedMode.AllowDeals) return;
            EmitAll("cancel-trade", {});
        });

        socket.on("submit-trade", (x: GameTrading) => {
            if (!selectedMode.AllowDeals) return;

            const turnPlayer = Clients.get(x.turnPlayer.id);
            const againstPlayer = Clients.get(x.againstPlayer.id);

            if (!turnPlayer || !againstPlayer) return;

            const againstPropStrings = x.againstPlayer.prop.map((v) => JSON.stringify(v));
            const turnPropStrings = x.turnPlayer.prop.map((v) => JSON.stringify(v));

            const turnGets = againstPlayer.player.properties.filter((v1) =>
                againstPropStrings.includes(JSON.stringify(v1))
            );

            againstPlayer.player.properties = againstPlayer.player.properties.filter(
                (v1) => !againstPropStrings.includes(JSON.stringify(v1))
            );

            const againstGets = turnPlayer.player.properties.filter((v1) =>
                turnPropStrings.includes(JSON.stringify(v1))
            );

            turnPlayer.player.properties = turnPlayer.player.properties.filter(
                (v1) => !turnPropStrings.includes(JSON.stringify(v1))
            );

            againstPlayer.player.balance -= x.againstPlayer.balance;
            turnPlayer.player.balance -= x.turnPlayer.balance;

            turnPlayer.player.balance += x.againstPlayer.balance;
            againstPlayer.player.balance += x.turnPlayer.balance;

            turnPlayer.player.properties.push(...turnGets);
            againstPlayer.player.properties.push(...againstGets);

            EmitAll("submit-trade", {
                pJsons: [turnPlayer.player.to_json(), againstPlayer.player.to_json()],
                action: `${turnPlayer.player.username} done a trade with ${againstPlayer.player.username}`,
            });
        });

        socket.on("trade-update", (x: GameTrading) => {
            if (!selectedMode.AllowDeals) return;
            EmitAll("trade-update", x);
        });
    }

    function handleReady(socket: Socket, server: Server, args: { ready?: boolean; mode?: MonopolyMode }) {
        try {
            const client = Clients.get(socket.id);
            if (!client) return;

            if (args.ready !== undefined) {
                client.ready = args.ready;
            }

            if (args.mode !== undefined) {
                selectedMode = args.mode;
                resetBalancesToSelectedMode();
            }

            Clients.set(socket.id, client);

            const readys = Array.from(Clients.values()).map((v) => v.ready);

            emitReady(socket.id, client);

            if (!readys.includes(false)) {
                server.logFunction("Game has Started, No more Players can join the Server");
                gameStarted = true;
                EmitAll("start-game", {});
            }
        } catch (e) {
            server.logFunction(e);
        }
    }

    function handleDisconnect(socket: Socket, server: Server) {
        try {
            if (Clients.has(socket.id)) {
                const disconnectedMessage = `{${getCurrentTime()}} [${socket.id}] Player "${Clients.get(socket.id)?.player.username}" has disconnected.`;
                server.logFunction(disconnectedMessage);
                logs_strings.push(disconnectedMessage);
            }

            Clients.delete(socket.id);

            if (currentId === socket.id) {
                advanceTurnFrom(socket.id);
            }

            EmitAll("disconnected-player", {
                id: socket.id,
                turn: currentId,
            });

            if (Array.from(Clients.keys()).length === 0) {
                if (gameStarted) {
                    server.logFunction("Game has Ended. Server is currently Open to new Players");
                }
                gameStarted = false;
            }
        } catch (e) {
            server.logFunction(e);
        }
    }

    new Server(
        (server) => {
            onServerCreated?.(server.code, server);
        },
        (socket: Socket, server: Server) => {
            const state = getServerState();
            socket.emit("state", state);

            if (state !== 0 && disconnectWhenUnavailable) {
                socket.disconnect();
                return;
            }

            socket.on("name", (name: string) => {
                try {
                    handleName(socket, server, name);
                } catch (e) {
                    server.logFunction(e);
                }
            });

            socket.on("ready", (args: { ready?: boolean; mode?: MonopolyMode }) => {
                handleReady(socket, server, args);
            });

            socket.on("disconnect", () => {
                handleDisconnect(socket, server);
            });
        }
    );
}