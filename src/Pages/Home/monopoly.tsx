// src/pages/Home/monopoly.tsx
import { useState, useEffect, useRef } from "react";
import { Server, Socket } from "../../assets/sockets.ts";
import { Player } from "../../assets/player.ts";
import "../../monopoly.css";
import MonopolyNav, { MonopolyNavRef } from "../../components/nav/nav.tsx";
import MonopolyGame, { MonopolyGameRef } from "../../components/game.tsx";
import NotifyElement, { NotificatorRef } from "../../components/notificator.tsx";
import monopolyJSON from "../../assets/monopoly.json";
import { MonopolyModes, historyAction, history, GameTrading, MonopolyMode, MonopolySettings } from "../../assets/types.ts";
import { CookieManager } from "../../assets/cookieManager.ts";
import { useMonopolySettings } from "../../game/hooks/useMonopolySettings.ts";
import { usePropertyMaps } from "../../game/hooks/usePropertyMaps.ts";
import { getMusicVolume } from "../../game/audio/audio.ts";
import { registerMonopolySocketEvents } from "../../services/sockets/registerMonopolySocketEvents.ts";

function App({ socket, name, server }: { socket: Socket; name: string; server: Server | undefined }) {
    const [clients, SetClients] = useState<Map<string, Player>>(new Map());
    const players = Array.from(clients.values());

    const [currentId, SetCurrent] = useState<string>("");
    const [gameStarted, SetGameStarted] = useState<boolean>(false);
    const [gameStartedDisplay, SetGameStartedDisplay] = useState<boolean>(false);
    const [imReady, SetReady] = useState<boolean>(false);
    const [selectedMode, SetMode] = useState<MonopolyMode>(MonopolyModes[0]);
    const [mainTheme, SetTheme] = useState(new Audio("./main-theme.mp3"));
    const [startTIme, SetStartTime] = useState<Date>(new Date());
    const [histories, SetHistories] = useState<Array<historyAction>>([]);

    const [currentTrade, setTrade] = useState<GameTrading | boolean | undefined>(undefined);

    // Cookie-backed settings (polled)
    const globalSettings = useMonopolySettings();
    const { propertyByPosition: propretyMap, propertyById } = usePropertyMaps(monopolyJSON as any);

    // Keep refs in sync for code that runs inside long-lived socket handlers
    const selectedModeRef = useRef(selectedMode);
    useEffect(() => {
        selectedModeRef.current = selectedMode;
    }, [selectedMode]);

    useEffect(() => {
        if (!gameStartedDisplay) return;

        // Start (or resume) the music theme
        mainTheme.loop = true;
        mainTheme.volume = getMusicVolume(globalSettings, 0.25);
        mainTheme.play();

        SetTheme(mainTheme);
        SetStartTime(new Date());
    }, [gameStartedDisplay, globalSettings]);

    // Keep music volume in sync with settings changes
    useEffect(() => {
        mainTheme.volume = getMusicVolume(globalSettings, 0.25);
    }, [globalSettings]);

    const engineRef = useRef<MonopolyGameRef>(null);
    const navRef = useRef<MonopolyNavRef>(null);
    const notifyRef = useRef<NotificatorRef>(null);

    useEffect(() => {
        const cleanup = registerMonopolySocketEvents({
            socket,
            name,
            server,

            clients,
            setClients: SetClients,

            setCurrent: SetCurrent,
            setGameStarted: SetGameStarted,
            setGameStartedDisplay: SetGameStartedDisplay,
            setReady: SetReady,
            setMode: SetMode,

            selectedModeRef,
            setTrade,
            setHistories: SetHistories,

            settings: globalSettings,
            propertyByPosition: propretyMap,
            propertyById,

            engineRef,
            navRef,
            notifyRef,
            mainTheme,
        });

        return cleanup;
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
                            var settings = JSON.parse(decodeURIComponent(CookieManager.get("monopolySettings") as string))["monopolySettings"] as MonopolySettings;
                            const localPlayer = clients.get(socket.id);
                            if (localPlayer === undefined) return;
                            if (settings !== undefined && settings.notifications === true)
                                notifyRef.current?.message(`${a} of money is deducted from the account for canceling mortgage`, "info", 2, () => {}, false);

                            localPlayer.balance -= a;
                            engineRef.current?.applyAnimation(1);
                            var audio = new Audio("./buying1.mp3");
                            audio.volume = 0.5 * ((settings?.audio[1] ?? 100) / 100) * ((settings?.audio[0] ?? 100) / 100);
                            audio.loop = false;
                            audio.play();
                            socket.emit("history", history(`${clients.get(socket.id)?.username ?? "unknown player"} cancel mortgage on ${prpName}`));
                            SetClients(new Map(clients.set(socket.id, localPlayer)));
                        },
                        onMort: (a, prpName) => {
                            var settings = JSON.parse(decodeURIComponent(CookieManager.get("monopolySettings") as string))["monopolySettings"] as MonopolySettings;
                            const localPlayer = clients.get(socket.id);
                            if (localPlayer === undefined) return;
                            if (settings !== undefined && settings.notifications === true)
                                notifyRef.current?.message(`${a} of money is deducted from the account for mortgage`, "info", 2, () => {}, false);
                            localPlayer.balance -= a;
                            engineRef.current?.applyAnimation(1);
                            var audio = new Audio("./buying1.mp3");
                            audio.volume = 0.5 * ((settings?.audio[1] ?? 100) / 100) * ((settings?.audio[0] ?? 100) / 100);
                            audio.loop = false;
                            audio.play();
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
                                        socket.emit("ready", { ready: !imReady });
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
                            <p style={{ opacity: 0.5, margin: 0, textAlign: "center", fontWeight: "100" }}>
                                the server-admin is <br /> choosing the gamemode
                            </p>
                        </>
                    ) : (
                        <></>
                    )}

                    <div className="modes">
                        <main>
                            <h3>{selectedMode.Name}</h3>
                            <table>
                                <tr>
                                    <td> Winning State:</td> <td>{selectedMode.WinningMode.toUpperCase()}</td>
                                </tr>
                                <tr>
                                    <td>Trades: </td>
                                    <td>{selectedMode.AllowDeals ? "ALLOWED" : "NOT-ALLOWED"}</td>
                                </tr>
                                <tr>
                                    <td>Mortgage: </td>
                                    <td>{selectedMode.mortageAllowed ? "ALLOWED" : "NOT-ALLOWED"}</td>
                                </tr>
                                <tr>
                                    <td>Starting Cash: </td>
                                    <td>{selectedMode.startingCash} M</td>
                                </tr>
                                <tr>
                                    <td>Turn Timer: </td>
                                    <td>
                                        {selectedMode.turnTimer === undefined ||
                                        (typeof selectedMode.turnTimer === "number" && selectedMode.turnTimer === 0)
                                            ? "No Timer"
                                            : JSON.stringify(selectedMode.turnTimer) + " Sec"}
                                    </td>
                                </tr>
                            </table>
                        </main>
                        <div className="selecting-mde">
                            {MonopolyModes.map((v, k) => {
                                return (
                                    <p
                                        data-select={JSON.stringify(v) === JSON.stringify(selectedMode)}
                                        key={k}
                                        onClick={() => {
                                            if (server !== undefined) socket.emit("ready", { mode: v });
                                        }}
                                        data-disabled={server === undefined}
                                    >
                                        {v.Name}
                                    </p>
                                );
                            })}
                            <p
                                data-select={selectedMode.Name === "Custom Mode"}
                                data-disabled={server === undefined}
                                onClick={() => {
                                    const winstateChoice = window.prompt("Winning State\n1=last-standing\n2=monopols\n3=monopols & trains", "3");
                                    const allowTrade = window.confirm("Allow Trades");
                                    const allowMortgage = window.confirm("Allow Mortgage");
                                    const startingCash = window.prompt("Starting Cash", "1500");
                                    const turnTimer = window.prompt("Turn Timer", "0");
                                    const v = {
                                        AllowDeals: allowTrade,
                                        WinningMode:
                                            winstateChoice === "2" ? "monopols" : winstateChoice === "3" ? "monopols & trains" : "last-standing",
                                        Name: "Custom Mode",
                                        mortageAllowed: allowMortgage,
                                        startingCash: startingCash === null ? 1500 : parseInt(startingCash) ?? 1500,
                                        turnTimer: turnTimer === null ? undefined : parseInt(turnTimer) ?? undefined,
                                    } as MonopolyMode;
                                    if (server !== undefined) socket.emit("ready", { mode: v });
                                }}
                            >
                                Custom Mode
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            <p id="floating-clock"></p>
        </div>
    );
}

export default App;
