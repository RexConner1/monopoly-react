// src/pages/Home/monopoly/sockets/registerMonopolySocketEvents.ts
import { Player } from "../../assets/player.ts";
import type { PlayerJSON } from "../../assets/player.ts";
import type { MonopolyMode, MonopolySettings, historyAction, GameTrading } from "../../assets/types.ts";
import { history } from "../../assets/types.ts";
import type { Server, Socket } from "../../assets/sockets.ts";
import { CookieManager } from "../../assets/cookieManager.ts";
import monopolyJSON from "../../assets/monopoly.json";
import type { GameContext } from "../../types.ts";
import type React from "react";
import { onTurnFinished } from "../../services/sockets/onTurnFinished.ts";
import { playerMoveGenerator } from "../../game/movement/playerMoveGenerator.ts";
import { destroyPlayer } from "../destroyPlayer.ts";
import { handleDiceRollResult } from "./handleDiceRollResult.ts";
import { handleChorchResult } from "./handleChorchResult.ts";
import { getMusicVolume, playMoneyMinusSfx } from "../../game/audio/audio.ts";

export type RegisterSocketDeps = {
    socket: Socket;
    name: string;
    server?: Server;

    clients: Map<string, Player>;
    setClients: (m: Map<string, Player>) => void;

    setCurrent: (id: string) => void;
    setGameStarted: (b: boolean) => void;
    setGameStartedDisplay: (b: boolean) => void;
    setReady: (b: boolean) => void;
    setMode: (m: MonopolyMode) => void;

    selectedModeRef: React.MutableRefObject<MonopolyMode>;
    setTrade: (x: GameTrading | boolean | undefined) => void;
    setHistories: (fn: (old: Array<historyAction>) => Array<historyAction>) => void;

    settings?: MonopolySettings;
    propertyByPosition: Map<number, any>;
    propertyById: Map<string, any>;

    engineRef: React.MutableRefObject<any>;
    navRef: React.MutableRefObject<any>;
    notifyRef: React.MutableRefObject<any>;
    mainTheme: HTMLAudioElement;
};

/**
 * Registers ALL socket + DOM event handlers used by the Monopoly page.
 *
 * Returned cleanup intentionally mirrors the original behavior.
 */
export function registerMonopolySocketEvents(deps: RegisterSocketDeps) {
    const {
        socket,
        name,
        server,
        clients,
        setClients: SetClients,
        setCurrent: SetCurrent,
        setGameStarted: SetGameStarted,
        setGameStartedDisplay: SetGameStartedDisplay,
        setMode: SetMode,
        selectedModeRef,
        setTrade,
        setHistories: SetHistories,
        settings: globalSettings,
        propertyByPosition: propretyMap,
        engineRef,
        navRef,
        notifyRef,
        mainTheme,
    } = deps;

    // Server debug log rendering (kept from original)
    if (server !== undefined) {
        server.RenderLogs((array) => {
            try {
                const x = document.body.querySelector("#server main div.middle") as HTMLDivElement;
                x.innerHTML = "";
                for (const v of array) {
                    x.innerHTML += `<p> ${v.join("\t")} </p>`;
                }
            } catch {}
        });
    }

    // Local, cookie-backed settings snapshot used by movement generator.
    let settings: MonopolySettings | undefined = undefined;
    const settings_interval = setInterval(() => {
        try {
            settings = JSON.parse(decodeURIComponent(CookieManager.get("monopolySettings") as string))["monopolySettings"] as MonopolySettings;
        } catch {}
    }, 1000);

    function mouseMove(e: MouseEvent) {
        const _pos = { x: e.clientX, y: e.clientY };
        const xplayer = clients.get(socket.id);
        socket.emit("mouse", _pos);
        if (xplayer) xplayer.positions = _pos;
    }

    const destroyPlayerBound = (playerId: string) => destroyPlayer(playerId, { clients, setClients: SetClients });

    function playerMoveGENERATOR(
        final_position: number,
        _xplayer: Player,
        get200whengo = true,
        afterFinished?: () => void,
        adding = true
    ) {
        return playerMoveGenerator(
            final_position,
            _xplayer,
            {
                settings,
                socket,
                notifyRef,
                engineRef,
                updateClients: () => SetClients(new Map(clients.set(_xplayer.id, _xplayer))),
            },
            get200whengo,
            afterFinished,
            adding
        );
    }

    // ----------------
    // Socket handlers
    // ----------------
    const socket_Initials = (args: { turn_id: string; other_players: Array<PlayerJSON>; selectedMode: MonopolyMode }) => {
        SetCurrent(args.turn_id.toString());
        for (const x of args.other_players) {
            SetClients(clients.set(x.id, new Player(x.id, x.username).recieveJson(x)));
        }
        SetMode(args.selectedMode);
    };

    const socket_NewPlayer = (args: PlayerJSON) => {
        SetClients(new Map(clients.set(args.id, new Player(args.id, args.username).recieveJson(args))));
    };

    const socket_Ready = (args: { id: string; state: boolean; selectedMode: MonopolyMode }) => {
        const x = clients.get(args.id);
        if (x === undefined) return;
        x.ready = args.state;
        SetClients(new Map(clients.set(x.id, x)));
        SetMode(args.selectedMode);
    };

    const socket_StartGame = () => {
        SetGameStarted(true);
        function A(n: number) {
            const p = document.querySelector("p#floating-clock") as HTMLParagraphElement;
            p.innerHTML = `${n}`;
            p.className = "clocking";
        }
        A(3);
        setTimeout(() => {
            A(2);
            setTimeout(() => {
                A(1);
                setTimeout(() => {
                    // start music immediately on display start
                    mainTheme.loop = true;
                    mainTheme.volume = getMusicVolume(globalSettings, 0.25);
                    mainTheme.play();
                    SetGameStartedDisplay(true);
                }, 1000);
            }, 1000);
        }, 1000);
    };

    const socket_DisconnectedPlayer = (args: { id: string; turn: string }) => {
        SetCurrent(args.turn);
        if (clients.size > 2) {
            const n = clients.get(args.id)?.username ?? "player";
            notifyRef.current?.message(`${n} disconected`, "error");
        } else if (clients.has(args.id)) {
            mainTheme.pause();
            notifyRef.current?.dialog(
                (close_func: any, createButton: any) => ({
                    innerHTML: `<h3> YOU WON! </h3> <p> your the only left player with the balance of ${clients.get(socket.id)?.balance ?? 0} </p>`,
                    buttons: [
                        createButton("PLAY ANOTHER GAME", () => {
                            close_func();
                            document.location.reload();
                        }),
                    ],
                }),
                "winning"
            );
        }
        destroyPlayerBound(args.id);
    };

    const socket_TurnFinished = (args: { from: string; turnId: string; pJson: PlayerJSON; WinningMode: string }) => {
        const context: GameContext = {
            socket,
            clients,
            SetClients,
            SetCurrent,
            settings,
            monopolyJSON,
            notifyRef,
            engineRef,
            navRef,
            mainTheme,
            destroyPlayer: destroyPlayerBound,
        };

        onTurnFinished(args, context);
    };

    const socket_Message = (message: { from: string; message: string }) => {
        navRef.current?.addMessage(message);
    };

    const socket_DiceRollResult = (args: { listOfNums: [number, number, number]; turnId: string }) => {
        handleDiceRollResult(args, {
            clients,
            socket,
            settings,
            propertyByPosition: propretyMap,
            setClients: SetClients,
            setHistories: SetHistories,
            engineRef,
            notifyRef,
            playerMove: playerMoveGENERATOR,
        });
    };

    const socket_Unjail = (args: { to: string; option: "card" | "pay" }) => {
        const x = clients.get(args.to);
        if (x) {
            if (args.option === "card") {
                x.getoutCards -= 1;
            } else {
                x.balance -= 50;
                if (x.id === socket.id && settings !== undefined && (settings as any).notifications === true)
                    notifyRef.current?.message(`${50} of money is deducted from the account`, "info", 2, () => {}, false);
                playMoneyMinusSfx(settings);
            }
            x.isInJail = false;
            x.jailTurnsRemaining = 0;
            SetClients(new Map(clients.set(args.to, x)));
        }
    };

    const socket_MemberUpdating = (args: { playerId: string; animation: "recieveMoney"; additional_props: any[]; pJson: [PlayerJSON, PlayerJSON] }) => {
        for (const x of args.pJson) {
            const p = clients.get(x.id);
            x.position = p?.position ?? x.position;
            p?.recieveJson(x);
        }

        if (socket.id === args.playerId) {
            engineRef.current?.applyAnimation(2);
        }
    };

    const socket_ChorchResult = (args: any) => {
        handleChorchResult(args, {
            clients,
            socket,
            settings,
            monopolyJSON,
            propertyByPosition: propretyMap,
            setClients: SetClients,
            setHistories: SetHistories,
            engineRef,
            notifyRef,
            playerMove: playerMoveGENERATOR,
        });
    };

    function socket_Mouse(args: { id: string; x: number; y: number }) {
        const p = clients.get(args.id);
        if (!p) return;
        p.positions = { x: args.x, y: args.y } as any;
    }

    function socket_networkDisconnect() {
        mainTheme.pause();
        notifyRef.current?.dialog(
            (close_func: any, createButton: any) => ({
                innerHTML: `<h3> YOU GOT DISCONNECTED </h3>`,
                buttons: [
                    createButton("RELOAD", () => {
                        close_func();
                        document.location.reload();
                    }),
                ],
            }),
            "error"
        );
    }

    function socket_playerUpdate(args: { playerId: string; pJson: PlayerJSON }) {
        const x = clients.get(args.playerId);
        if (x === undefined) return;
        x.recieveJson(args.pJson);
    }

    function socket_history(h: historyAction) {
        SetHistories((old) => [...old, h]);
    }

    // ----------------
    // Register
    // ----------------
    document.addEventListener("mousemove", mouseMove);
    socket.on("initials", socket_Initials);
    socket.on("new-player", socket_NewPlayer);
    socket.on("ready", socket_Ready);
    socket.on("start-game", socket_StartGame);
    socket.on("disconnected-player", socket_DisconnectedPlayer);
    socket.on("turn-finished", socket_TurnFinished);
    socket.on("message", socket_Message);
    socket.on("dice_roll_result", socket_DiceRollResult);
    socket.on("unjail", socket_Unjail);
    socket.on("member_updating", socket_MemberUpdating);
    socket.on("chorch_result", socket_ChorchResult);
    socket.on("mouse", socket_Mouse);
    socket.on("disconnect", socket_networkDisconnect);
    socket.on("player_update", socket_playerUpdate);
    socket.on("history", socket_history);

    // Trade
    socket.on("trade", () => {
        if (!selectedModeRef.current.AllowDeals) return;
        setTrade(true);
    });
    socket.on("cancel-trade", () => {
        if (!selectedModeRef.current.AllowDeals) return;
        setTrade(undefined);
    });
    socket.on("trade-update", (x: GameTrading) => {
        if (!selectedModeRef.current.AllowDeals) return;
        setTrade(x);
    });

    socket.on("submit-trade", (args: { pJsons: [PlayerJSON, PlayerJSON]; action: string }) => {
        if (!selectedModeRef.current.AllowDeals) return;
        setTrade(undefined);
        for (const PJS of args.pJsons) {
            const client = clients.get(PJS.id);
            if (client !== undefined) {
                client.recieveJson(PJS);
            }
        }
        SetHistories((old) => [...old, history(args.action)]);
    });

    // Announce name once
    socket.emit("name", name);

    return () => {
        clearInterval(settings_interval);
        document.removeEventListener("mousemove", mouseMove);
    };
}
