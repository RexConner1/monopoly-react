import { useState, useEffect, useRef } from "react";
import { Server, Socket } from "../../assets/sockets.ts";
import { Player } from "../../assets/player.ts";
import "../../monopoly.css";
import MonopolyNav, { MonopolyNavRef } from "../../components/ingame/nav.tsx";
import MonopolyGame, { MonopolyGameRef } from "../../components/ingame/game.tsx";
import NotifyElement, { NotificatorRef } from "../../components/notificator.tsx";
import { MonopolySettings, MonopolyModes, historyAction, history, GameTrading, MonopolyMode, MonopolyCookie } from "../../assets/types.ts";
import { CookieManager } from "../../assets/cookieManager.ts";
import { playMoneyMinusSfx, playPurchaseSfx, playRollSfx } from "../../ui/audio/audio.ts";
import { getPropertyByPosition } from "../../../shared/types/property.ts";
import { ReactGameContext } from "../../assets/reactGameContext.ts";
import { movePlayer } from "../../game/actions/movePlayer.ts";
import { goToJail } from "../../../shared/game/actions/goToJail.ts";
import { ChanceCommunityChestCard } from "../../assets/card.ts";
import { showDialog } from "../../ui/dialogs/dialogFactory.ts";
import { notifyMessage } from "../../ui/notifications/notificationFactory.ts";
import { handlePlayerBankruptcy } from "../../game/handlers/handleBankruptcy.ts";
import { handleMonopolsTrains } from "../../game/handlers/handleMonopolsTrains.ts";
import { handleStreetResponse } from "../../../shared/game/handlers/handleStreetResponse.ts";
import { handleCardAction } from "../../../shared/game/handlers/handleCardAction.ts";
import { SelectedModeSummary } from "../../components/menu/modes/selectedModeSummary.tsx";
import { CustomModeButton } from "../../components/menu/modes/customModeButton.tsx";
import { ModeList } from "../../components/menu/modes/modeList.tsx";
import { PlayerJSON } from "../../../shared/types/player.ts";
function App({ socket, name, server }: { socket: Socket; name: string; server: Server | undefined }) {
    const [clients, SetClients] = useState<Map<string, Player>>(new Map());
    const players = Array.from(clients.values());

    const [currentId, SetCurrent] = useState<string>("");
    const [gameStarted, SetGameStarted] = useState<boolean>(false);
    const [gameStartedDisplay, SetGameStartedDisplay] = useState<boolean>(false);
    const [imReady, SetReady] = useState<boolean>(false);
    const [selectedMode, SetMode] = useState<MonopolyMode>(MonopolyModes[0]);
    const [globalSettings, SetSettings] = useState<MonopolySettings>();
    const [mainTheme, SetTheme] = useState(new Audio("./main-theme.mp3"));
    const [startTIme, SetStartTime] = useState<Date>(new Date());
    const [histories, SetHistories] = useState<Array<historyAction>>([]);

    const [currentTrade, setTrade] = useState<GameTrading | boolean | undefined>(undefined);

    useEffect(() => {
        if (!gameStartedDisplay) return;
        // Sound Effect
        mainTheme.loop = true;
        mainTheme.play();

        mainTheme.volume = 0.25;
        if (globalSettings !== undefined) {
            mainTheme.volume = (globalSettings.audio[0] / 100) * (globalSettings.audio[2] / 100);
        }
        SetTheme(mainTheme);
        SetStartTime(new Date());
    }, [gameStartedDisplay]);

    useEffect(() => {
        const settings_interval = setInterval(() => {
            const parsedCookie = (JSON.parse(decodeURIComponent(CookieManager.get("monopolySettings") as string)) as MonopolyCookie).settings;
            SetSettings(parsedCookie);
        }, 1000);
        return () => {
            clearInterval(settings_interval);
        };
    }, [document.cookie]);

    useEffect(() => {
        if (globalSettings !== undefined) {
            mainTheme.volume = (globalSettings.audio[0] / 100) * (globalSettings.audio[2] / 100);
        }
    }, [globalSettings]);

    const engineRef = useRef<MonopolyGameRef>(null);
    const navRef = useRef<MonopolyNavRef>(null);
    const notifyRef = useRef<NotificatorRef>(null);

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
    useEffect(() => {
        let settings: MonopolySettings | undefined = undefined;

        const settings_interval = setInterval(() => {
            settings = (JSON.parse(decodeURIComponent(CookieManager.get("monopolySettings") as string)) as MonopolyCookie).settings;
        }, 1000);

        const reactGameContext: ReactGameContext = {
            settings,
            socket,
            engineRef,
            notifyRef,
            clients,
            SetClients,
            effectsEnabled: true
        };

        function mouseMove(e: MouseEvent) {
            const _pos = { x: e.clientX, y: e.clientY };
            const xplayer = clients.get(socket.id);
            socket.emit("mouse", _pos);
            xplayer ? (xplayer.positions = _pos) : "";
        }

        function destroyPlayer(playerId: string) {
            // remove player from clients
            function removePlayer() {
                clients.delete(playerId);
                SetClients(new Map(clients));

                // 1 frame to check if it isnt removed
                requestAnimationFrame(() => {
                    if (clients.has(playerId)) {
                        // request a loop frame!
                        requestAnimationFrame(removePlayer);
                    } else {
                    }
                });
            }
            removePlayer();

            // removing child from game div
            function removeChild() {
                const _element = document.querySelector(`div.player[player-id="${playerId}"]`);
                if (_element === null) return;
                if (_element.parentElement) _element.parentElement.removeChild(_element);
                _element.remove();

                // 1 frame to check if it isnt removed
                requestAnimationFrame(() => {
                    if (document.querySelector(`div.player[player-id="${playerId}"]`) !== null) {
                        // request a loop frame!
                        requestAnimationFrame(removeChild);
                    } else {
                    }
                });
            }
            removeChild();
        }

        //#region socket handeling
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

        const socket_Ready = (args: {
            id: string;
            state: boolean;
            selectedMode: MonopolyMode;
            players?: PlayerJSON[];
        }) => {
            const updatedClients = new Map(clients);

            if (args.players) {
                for (const pJson of args.players) {
                    const existing = updatedClients.get(pJson.id) ?? new Player(pJson.id, pJson.username);
                    existing.recieveJson(pJson);
                    updatedClients.set(pJson.id, existing);
                }
            } else {
                const x = updatedClients.get(args.id);
                if (x !== undefined) {
                    x.ready = args.state;
                    updatedClients.set(x.id, x);
                }
            }

            SetClients(updatedClients);
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
                        SetGameStartedDisplay(true);
                    }, 1000);
                }, 1000);
            }, 1000);
        };

        const socket_DisconnectedPlayer = (args: { id: string; turn: string }) => {
            SetCurrent(args.turn);
            if (clients.size > 2) {
                const name = clients.get(args.id)?.username ?? "player";
                notifyMessage(notifyRef, "PLAYER_DISCONNECTED", { name }, { level: "error" });
            } else if (clients.has(args.id)) {
                mainTheme.pause();
                showDialog(notifyRef, "YOU_WIN", {
                    balance: clients.get(socket.id)?.balance
                });
            }
            destroyPlayer(args.id);
        };

        const socket_TurnFinished = (args: { from: string; turnId: string; pJson: PlayerJSON; WinningMode: string }) => {
            const x = clients.get(args.from);

            if (x !== undefined && JSON.stringify(x.properties) != JSON.stringify(args.pJson.properties)) {
                // sound part - other player part
                playPurchaseSfx(settings);
            }

            if (args.from !== socket.id && x) {
                x.recieveJson(args.pJson);
                SetClients(new Map(clients.set(args.from, x)));
            }

            handlePlayerBankruptcy({
                bankruptPlayer: args.pJson,
                mainTheme,
                ctx: reactGameContext,
                destroyPlayer
            });

            handleMonopolsTrains({
                winningMode: args.WinningMode,
                mainTheme,
                ctx: reactGameContext
            });

            SetCurrent(args.turnId);
            if (args.turnId === socket.id) {
                const x = clients.get(args.turnId);
                if (x && x.isInJail) {
                    engineRef.current?.showJailsButtons((x?.getoutCards ?? -1) > 0);
                } else {
                }
            }
            navRef.current?.reRenderPlayerList();
        };

        const socket_Message = (message: { from: string; message: string }) => {
            navRef.current?.addMessage(message);
        };
        
        const socket_DiceRollResult = (args: { listOfNums: [number, number, number]; turnId: string }) => {
            SetHistories((old) => [
                ...old,
                history(
                    `${clients.get(args.turnId)?.username ?? "unknown player"} rolled [${args.listOfNums[0]}, ${args.listOfNums[1]}] moving to "${
                        getPropertyByPosition(args.listOfNums[2])?.name ?? ""
                    }"`
                ),
            ]);
            playRollSfx(settings);
            // const sumTimes = args.listOfNums[0] + args.listOfNums[1];
            const localPlayer = clients.get(socket.id) as Player;
            const xplayer = clients.get(args.turnId) as Player;
            const dice_generatorResults = movePlayer({
                finalPosition: args.listOfNums[2], 
                player: xplayer, 
                ctx: reactGameContext, 
                afterFinished: () => {
                    if (args.turnId != socket.id && args.listOfNums[2] === 30) {
                        setTimeout(() => {
                            SetHistories((old) => [...old, history(`${clients.get(args.turnId)?.username ?? "unknown player"} goes to jail`)]);
                            goToJail({player: xplayer, ctx: reactGameContext});
                        }, 800);
                    }
                }
            });

            engineRef.current?.diceResults({
                l: [args.listOfNums[0], args.listOfNums[1]],
                time: localPlayer.isInJail ? 2000 : dice_generatorResults.time + 2000 + 800,
                onDone: () => {
                    if (socket.id !== args.turnId) return;

                    const location = clients.get(socket.id)?.position ?? -1;
                    const property = getPropertyByPosition(location);
                    if (property != undefined) {
                        if (property.id === "communitychest" || property.id === "chance") {
                            socket.emit("chorch_roll", { is_chance: property.id === "chance", rolls: args.listOfNums[0] + args.listOfNums[1] });
                        } else {
                            engineRef.current?.setStreet({
                                location,
                                rolls: args.listOfNums[0] + args.listOfNums[1],
                                onResponse: (b, info) => {
                                    handleStreetResponse({
                                        response: b,
                                        info,
                                        player: localPlayer,
                                        property,
                                        location,
                                        ctx: reactGameContext,
                                    });
                                },
                            });
                        }
                    }
                },
            });

            if (xplayer.isInJail) {
                setTimeout(() => {
                    if (args.listOfNums[0] == args.listOfNums[1]) {
                        xplayer.isInJail = false;
                        setTimeout(() => {
                            dice_generatorResults.start();
                        }, 2000);
                    } else if (xplayer.jailTurnsRemaining > 0) {
                        xplayer.jailTurnsRemaining -= 1;
                        if (xplayer.jailTurnsRemaining === 0) {
                            xplayer.isInJail = false;
                        }
                    }
                    SetClients(new Map(clients.set(args.turnId, xplayer)));
                }, 1500);
            } else {
                setTimeout(() => {
                    dice_generatorResults.start();
                }, 2000);
            }
        };

        const socket_Unjail = (args: { to: string; option: "card" | "pay" }) => {
            const x = clients.get(args.to);
            if (x) {
                if (args.option === "card") {
                    x.getoutCards -= 1;
                } else {
                    x.balance -= 50;
                    if (x.id === socket.id && settings !== undefined && settings.notifications === true)
                        notifyMessage(notifyRef, "MONEY_DEDUCTED", { amount: 50 });
                    playMoneyMinusSfx(settings);
                }
                x.isInJail = false;
                x.jailTurnsRemaining = 0;
                SetClients(new Map(clients.set(args.to, x)));
            }
        };

        const socket_MemberUpdating = (args: {
            playerId: string;
            animation: "recieveMoney";
            additional_props: any[];
            pJson: [PlayerJSON, PlayerJSON];
        }) => {
            for (const x of args.pJson) {
                const p = clients.get(x.id);
                x.position = p?.position ?? x.position;
                p?.recieveJson(x);
            }

            if (socket.id === args.playerId) {
                engineRef.current?.applyAnimation(2);
            }
        };

        const socket_ChorchResult = (args: {
            element: ChanceCommunityChestCard;
            rolls: number;
            is_chance: boolean;
            turnId: string;
        }) => {
            SetHistories((old) => [
                ...old,
                history(
                    `${clients.get(args.turnId)?.username ?? "unknown player"} got ${
                        args.is_chance ? "chance" : "community chest "
                    } card that said "${args.element.title}"`
                ),
            ]);
            const numOfTime = 3000;
            engineRef.current?.chorch(args.element, args.is_chance, numOfTime);

            setTimeout(() => {
                const xplayer = clients.get(args.turnId);
                if (!xplayer) return;

                handleCardAction({
                    card: args.element,
                    player: xplayer,
                    rolls: args.rolls,
                    ctx: reactGameContext,
                    movePlayer
                });
            }, numOfTime);
        };

        function socket_Mouse(args: { id: string; x: number; y: number }) {
            const xplayer = clients.get(args.id);
            if (xplayer === undefined) return;
            xplayer.positions = { x: args.x, y: args.y };
            clients.set(args.id, xplayer);
        }
        
        function socket_networkDisconnect() {
            mainTheme.pause();
            showDialog(notifyRef, "DISCONNECTED", {}, "losing");
        }

        function socket_history(args: historyAction) {
            SetHistories((old) => [...old, args]);
        }

        function socket_playerUpdate(args: { playerId: string; pJson: PlayerJSON }) {
            const x = clients.get(args.playerId);
            if (x === undefined) return;
            x.recieveJson(args.pJson);
        }
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
            if (!selectedMode.AllowDeals) return;
            setTrade(true);
        });
        socket.on("cancel-trade", () => {
            if (!selectedMode.AllowDeals) return;
            setTrade(undefined);
        });
        socket.on("trade-update", (x: GameTrading) => {
            if (!selectedMode.AllowDeals) return;
            setTrade(x);
        });

        socket.on("submit-trade", (args: { pJsons: [PlayerJSON, PlayerJSON]; action: string }) => {
            if (!selectedMode.AllowDeals) return;
            setTrade(undefined);
            for (const PJS of args.pJsons) {
                const client = clients.get(PJS.id);
                if (client !== undefined) {
                    client.recieveJson(PJS);
                }
            }
            SetHistories((old) => [...old, history(args.action)]);
        });

        var to_emit_name = true;
        //#endregion
        if (to_emit_name) socket.emit("name", name);

        return () => {
            to_emit_name = false;
            clearInterval(settings_interval);
            document.removeEventListener("mousemove", mouseMove);
        };
    }, []);

    useEffect(() => {
        navRef.current?.reRenderPlayerList();
    }, [clients]);

    return gameStartedDisplay ? (
        <>
            {globalSettings !== undefined && globalSettings.accessibility[3] ? (
                <div className="cursors">
                    {Array.from(clients.values())
                        .filter((v) => v.id !== socket.id)
                        .map((v, i) => {
                            return (
                                <img
                                    src="./cursor.png"
                                    style={{
                                        translate: `${v.positions.x}px ${v.positions.y}px`,
                                    }}
                                    key={i}
                                    className="cursor"
                                />
                            );
                        })}
                </div>
            ) : (
                <></>
            )}
            <main>
                <MonopolyNav
                    currentTurn={currentId}
                    ref={navRef}
                    name={name}
                    socket={socket}
                    players={players}
                    server={server}
                    Morgage={{
                        onCanc: (a, prpName: string) => {
                            var settings = JSON.parse(decodeURIComponent(CookieManager.get("monopolySettings") as string))[
                                "monopolySettings"
                            ] as MonopolySettings;
                            const localPlayer = clients.get(socket.id);
                            if (localPlayer === undefined) return;
                            if (settings !== undefined && settings.notifications === true)
                                notifyMessage(notifyRef, "MORTGAGE_CANCELED", {
                                    amount: a
                                });

                            localPlayer.balance -= a;
                            engineRef.current?.applyAnimation(1);
                            playPurchaseSfx(settings);
                            socket.emit("history", history(`${clients.get(socket.id)?.username ?? "unknown player"} cancel mortgage on ${prpName}`));
                            SetClients(new Map(clients.set(socket.id, localPlayer)));
                        },
                        onMort: (a, prpName) => {
                            var settings = JSON.parse(decodeURIComponent(CookieManager.get("monopolySettings") as string))[
                                "monopolySettings"
                            ] as MonopolySettings;
                            const localPlayer = clients.get(socket.id);
                            if (localPlayer === undefined) return;
                            if (settings !== undefined && settings.notifications === true)
                                notifyMessage(notifyRef, "MORTGAGE_DEDUCTED", {
                                    amount: a
                                });

                            localPlayer.balance -= a;
                            engineRef.current?.applyAnimation(1);
                            playPurchaseSfx(settings);
                            socket.emit("history", history(`${clients.get(socket.id)?.username ?? "unknown player"} mortgaged ${prpName}`));
                            SetClients(new Map(clients.set(socket.id, localPlayer)));
                        },
                    }}
                    callServer={() => {
                        const root = document.body.querySelector("#root") as HTMLDivElement;

                        root.style.transform = "translateX(100%)";
                    }}
                    history={histories}
                    time={startTIme}
                    selectedMode={selectedMode}
                />

                <MonopolyGame
                    clickedOnBoard={(a) => {
                        navRef.current?.clickedOnBoard(a);
                    }}
                    ref={engineRef}
                    socket={socket}
                    players={Array.from(clients.values())}
                    myTurn={currentId === socket.id}
                    tradeObj={currentTrade}
                    tradeApi={{
                        onSelectPlayer(pId) {
                            const xplayer = clients.get(pId);
                            const localPlayer = clients.get(socket.id);
                            if (xplayer === undefined || localPlayer === undefined) return;
                            const x = {
                                turnPlayer: {
                                    id: localPlayer.id,
                                    balance: 0,
                                    prop: [],
                                },
                                againstPlayer: {
                                    id: xplayer.id,
                                    balance: 0,
                                    prop: [],
                                },
                            };
                            socket.emit("trade-update", x);
                        },
                    }}
                    selectedMode={selectedMode}
                />
            </main>
            <NotifyElement ref={notifyRef} />
            <div id="server">
                <main>
                    <div
                        className="upper"
                        onClick={() => {
                            const root = document.body.querySelector("#root") as HTMLDivElement;

                            root.style.transform = "";
                        }}
                    >
                        Server.exe
                    </div>
                    <div className="middle"></div>
                    <div className="lower">
                        <input type="text" />
                    </div>
                </main>
                <footer
                    onClick={() => {
                        const root = document.body.querySelector("#root") as HTMLDivElement;

                        root.style.transform = "";
                    }}
                >
                    <img src="icon.png" alt="" />
                </footer>
            </div>
        </>
    ) : (
        <div className="lobby">
            <main>
                <section>
                    <div>
                        <h3>Hello there {name}</h3>
                        the players that are currently in the lobby are
                        <div>
                            {Array.from(clients.values()).map((v, i) => {
                                return (
                                    <p style={v.ready ? { backgroundColor: "#32a852" } : {}} className="lobby-players" key={i}>
                                        {v.username}
                                    </p>
                                );
                            })}
                            <center>
                                <button
                                    disabled={gameStarted}
                                    onClick={() => {
                                        socket.emit("ready", {
                                            ready: !imReady,
                                        });
                                        SetReady(!imReady);
                                    }}
                                >
                                    {!imReady ? "Ready" : "Not Ready"}
                                </button>
                            </center>
                        </div>
                        <br />
                    </div>
                </section>
                <div>
                    {server === undefined ? (
                        <>
                            <p
                                style={{
                                    opacity: 0.5,
                                    margin: 0,
                                    textAlign: "center",
                                    fontWeight: "100",
                                }}
                            >
                                the server-admin is <br /> choosing the gamemode
                            </p>
                        </>
                    ) : (
                        <></>
                    )}

                    <div className="modes">
                        <SelectedModeSummary selectedMode={selectedMode} />
                        
                        <div className="selecting-mde">
                            <ModeList
                                modes={MonopolyModes}
                                selectedMode={selectedMode}
                                server={server}
                                socket={socket}
                            />
                            <CustomModeButton
                                selectedMode={selectedMode}
                                server={server}
                                socket={socket}
                            />
                        </div>
                    </div>
                </div>
            </main>

            <p id="floating-clock"></p>
        </div>
    );
}

export default App;
