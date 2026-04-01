import { useState, useEffect, useRef } from "react";
import { Server, Socket } from "../../assets/sockets.ts";
import { Player, PlayerJSON } from "../../assets/player.ts";
import "../../monopoly.css";
import MonopolyNav, { MonopolyNavRef } from "../../components/ingame/nav.tsx";
import MonopolyGame, { MonopolyGameRef } from "../../components/ingame/game.tsx";
import NotifyElement, { NotificatorRef } from "../../components/notificator.tsx";
import monopolyJSON from "../../assets/monopoly.json";
import { MonopolySettings, MonopolyModes, historyAction, history, GameTrading, MonopolyMode, MonopolyCookie } from "../../assets/types.ts";
import { CookieManager } from "../../assets/cookieManager.ts";
import { playMoneyMinusSfx, playMoneyPlusSfx, playPurchaseSfx, playRollSfx } from "../../ui/audio/audio.ts";
import { getPropertyByPosition } from "../../assets/property.ts";
import { GameContext } from "../../assets/gameContext.ts";
import { buyProperty } from "../../game/actions/buyProperty.ts";
import { payRent } from "../../game/actions/payRent.ts";
import { payLuxuryTax } from "../../game/actions/payLuxuryTax.ts";
import { payIncomeTax } from "../../game/actions/payIncomeTax.ts";
import { movePlayer } from "../../game/actions/movePlayer.ts";
import { goToJail } from "../../game/actions/goToJail.ts";
import { advanceProperty } from "../../game/actions/advanceProperty.ts";
import { buySpecialProperty } from "../../game/actions/buySpecialProperty.ts";
import { moveToTile } from "../../game/actions/moveToTile.ts";
import { moveBySpaces } from "../../game/actions/moveBySpaces.ts";
import { removeFunds } from "../../game/actions/removeFunds.ts";
import { finishTurn } from "../../game/actions/finishTurn.ts";
import { addFunds } from "../../game/actions/addFunds.ts";
import { ChanceCommunityChestCard } from "../../assets/card.ts";
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

        const gameContext: GameContext = {
            settings,
            socket,
            engineRef,
            notifyRef,
            clients,
            SetClients
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
                        SetGameStartedDisplay(true);
                    }, 1000);
                }, 1000);
            }, 1000);
        };

        const socket_DisconnectedPlayer = (args: { id: string; turn: string }) => {
            SetCurrent(args.turn);
            if (clients.size > 2) {
                const name = clients.get(args.id)?.username ?? "player";
                notifyRef.current?.message(`${name} disconected`, "error");
            } else if (clients.has(args.id)) {
                mainTheme.pause();
                notifyRef.current?.dialog(
                    (close_func, createButton) => ({
                        innerHTML: `<h3> YOU WON! </h3> <p> your the only left player with the balance of ${
                            clients.get(socket.id)?.balance ?? 0
                        } </p>`,
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

            if (args.pJson.balance < 0) {
                if (args.pJson.id !== socket.id) {
                    if (clients.size > 2) {
                        const name = args.pJson.username;
                        notifyRef.current?.message(`${name} lost`, "info");
                    } else {
                        if (clients.has(socket.id)) {
                            mainTheme.pause();
                            notifyRef.current?.dialog(
                                (close_func, createButton) => ({
                                    innerHTML: `<h3> YOU WON! </h3> <p> your the only left player with the balance of ${
                                        clients.get(socket.id)?.balance ?? 0
                                    } </p>`,
                                    buttons: [
                                        createButton("PLAY ANOTHER GAME", () => {
                                            close_func();
                                            document.location.reload();
                                        }),
                                    ],
                                }),
                                "winning"
                            );
                        } else {
                            const xclient = Array.from(clients.values()).filter((v) => v.id !== args.pJson.id)[0];
                            const name = xclient.username ?? 0;
                            mainTheme.pause();
                            notifyRef.current?.dialog(
                                (close_func, createButton) => ({
                                    innerHTML: `<h3> ${name} WON! </h3> <p> ${name} won with the balance of ${
                                        clients.get(socket.id)?.balance ?? 0
                                    } </p>`,
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
                    }
                } else {
                    mainTheme.pause();
                    notifyRef.current?.dialog(
                        (close_func, createButton) => ({
                            innerHTML: `<h3> YOU LOST! </h3> <p> you lost your money and lost the monopol with a wanted balance of ${-(
                                clients.get(socket.id)?.balance ?? 0
                            )} </p>`,
                            buttons: [
                                createButton("CONTINUE WATCHING", () => {
                                    close_func();
                                }),
                                createButton("PLAY ANOTHER GAME", () => {
                                    close_func();
                                    document.location.reload();
                                }),
                            ],
                        }),
                        "losing"
                    );
                }

                destroyPlayer(args.pJson.id);
            }
            if (args.WinningMode === "monopols" || args.WinningMode === "monopols & trains") {
                function removeDuplicates(originalList: Array<any>) {
                    // Create an empty array to store unique values
                    const uniqueList: Array<any> = [];

                    // Use the filter method to iterate through the original list
                    originalList.filter(function (item) {
                        // If the item is not already in the uniqueList, add it
                        if (!uniqueList.includes(item)) {
                            uniqueList.push(item);
                        }
                        // Always return false in the filter function to skip duplicates
                        return false;
                    });

                    // Return the uniqueList
                    return uniqueList;
                }
                for (const p of Array.from(clients.values())) {
                    const prpGrups = [];
                    for (const prp of p.properties) {
                        if (!["Special", "Railroad", "Utilities"].includes(prp.group)) prpGrups.push(prp.group);
                    }
                    let x: number = 0;

                    for (const g of removeDuplicates(prpGrups)) {
                        const c = prpGrups.filter((v) => v === g).length;
                        const cc = monopolyJSON.properties.filter((v) => v.group === g).length;
                        if (c === cc) {
                            x += 1;
                        }
                    }
                    if (x === 3) {
                        mainTheme.pause();
                        if (p.id === socket.id) {
                            notifyRef.current?.dialog(
                                (close_func, createButton) => ({
                                    innerHTML: `<h3> YOU WON! </h3> <p> you have 3 sets! </p>`,
                                    buttons: [
                                        createButton("PLAY ANOTHER GAME", () => {
                                            close_func();
                                            document.location.reload();
                                        }),
                                    ],
                                }),
                                "winning"
                            );
                        } else {
                            notifyRef.current?.dialog(
                                (close_func, createButton) => ({
                                    innerHTML: `<h3> ${p.username} WON! </h3> <p> got 3 sets! </p>`,
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
                        return;
                    }
                }
                if (args.WinningMode === "monopols & trains") {
                    // continue with trains winning state!
                    for (const p of Array.from(clients.values())) {
                        const c = p.properties.filter((v) => v.group === "Railroad").length;
                        if (c === 4) {
                            mainTheme.pause();
                            if (p.id === socket.id) {
                                notifyRef.current?.dialog(
                                    (close_func, createButton) => ({
                                        innerHTML: `<h3> YOU WON! </h3> <p> you have 4 railroads! </p>`,
                                        buttons: [
                                            createButton("PLAY ANOTHER GAME", () => {
                                                close_func();
                                                document.location.reload();
                                            }),
                                        ],
                                    }),
                                    "winning"
                                );
                            } else {
                                notifyRef.current?.dialog(
                                    (close_func, createButton) => ({
                                        innerHTML: `<h3> ${p.username} WON! </h3> <p> got 4 railroads! </p>`,
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
                            return;
                        }
                    }
                }
            }

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
                ctx: gameContext, 
                afterFinished: () => {
                    if (args.turnId != socket.id && args.listOfNums[2] === 30) {
                        setTimeout(() => {
                            SetHistories((old) => [...old, history(`${clients.get(args.turnId)?.username ?? "unknown player"} goes to jail`)]);
                            goToJail({player: xplayer, ctx: gameContext});
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
                    const proprety = getPropertyByPosition(location);
                    if (proprety != undefined) {
                        if (proprety.id === "communitychest" || proprety.id === "chance") {
                            socket.emit("chorch_roll", { is_chance: proprety.id === "chance", rolls: args.listOfNums[0] + args.listOfNums[1] });
                        } else {
                            engineRef.current?.setStreet({
                                location,
                                rolls: args.listOfNums[1] + args.listOfNums[0],
                                onResponse: (b, info) => {
                                    var time_till_free = 0;
                                    if (b === "buy") {
                                        buyProperty({
                                            player: localPlayer,
                                            property: proprety,
                                            ctx: gameContext
                                        });
                                    } else if (b === "advance-buy") {
                                        const { state, money } = info as { 
                                            state: 1 | 2 | 3 | 4 | 5; 
                                            money: number; 
                                        };

                                        advanceProperty({
                                            player: localPlayer,
                                            property: proprety,
                                            location,
                                            state,
                                            money,
                                            ctx: gameContext
                                        });
                                    } else if (b === "someones") {
                                        const { rolls } = info as { rolls: number };
                                        
                                        payRent({
                                            payer: localPlayer,
                                            property: proprety,
                                            location,
                                            rolls,
                                            ctx: gameContext
                                        });
                                    } else if (b === "nothing") {
                                        if ((proprety?.id ?? "") == "gotojail") {
                                            goToJail({player: xplayer, ctx: gameContext});
                                        }

                                        if (proprety?.id === "incometax") {
                                            payIncomeTax({
                                                player: localPlayer,
                                                ctx: gameContext
                                            });
                                        }
                                        if (proprety?.id === "luxurytax") {
                                            payLuxuryTax({
                                                player: localPlayer,
                                                ctx: gameContext
                                            });
                                        }
                                    } else if (b === "special_action") {
                                        const { rolls } = info as { rolls: number };

                                        buySpecialProperty({
                                            player: localPlayer,
                                            property: proprety,
                                            rolls: rolls,
                                            ctx: gameContext
                                        });
                                    }

                                    setTimeout(() => {
                                        finishTurn({ localPlayer, ctx: gameContext });
                                    }, time_till_free);
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
                        notifyRef.current?.message(`${50} of money is deducted from the account`, "info", 2, () => {}, false);
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
                const c = args.element;
                const xplayer = clients.get(args.turnId);
                if (xplayer === undefined) return;
                function addBalanceToOthers(amnout: number) {
                    if (xplayer === undefined) return 0;

                    const other_players = Array.from(clients.values()).filter((v) => v.id !== xplayer.id);

                    if (xplayer.id === socket.id) {
                        if (amnout > 0) {
                            // give money
                            socket.emit(
                                "history",
                                history(
                                    `${xplayer.username ?? "unknown user"} gave ${amnout} money to [${other_players
                                        .map((v) => v.username)
                                        .join(", ")}]`
                                )
                            );
                        } else {
                            // get money!
                            socket.emit(
                                "history",
                                history(
                                    `${xplayer.username ?? "unknown user"} recieve ${-amnout} money from [${other_players
                                        .map((v) => v.username)
                                        .join(", ")}]`
                                )
                            );
                        }
                    }

                    for (const p of other_players) {
                        p.balance += amnout;
                        if (p.id === socket.id && settings !== undefined && settings.notifications === true) {
                            notifyRef.current?.message(`${amnout} of money is added to the account`, "info", 2, () => {}, false);
                            playMoneyPlusSfx(settings);
                        }
                        SetClients(new Map(clients.set(p.id, p)));

                        if (xplayer.id === socket.id) {
                            if (amnout > 0) {
                                socket.emit("pay", {
                                    balance: amnout,
                                    from: socket.id,
                                    to: p.id,
                                });
                            } else {
                                // recieve money
                                socket.emit("pay", {
                                    balance: amnout,
                                    from: p.id,
                                    to: socket.id,
                                });

                                socket.emit(
                                    "history",
                                    history(`
                                ${clients.get(socket.id)?.username ?? "unknown user"} pay ${payment_ammount} to ${
                                        clients.get(xplayer.id)?.username ?? "unknown user"
                                    }
                                `)
                                );
                            }
                        }
                    }
                    return other_players.length;
                }

                var time_till_finish = 0;
                switch (c.action) {
                    case "move":
                        if (c.tileid) {
                            time_till_finish = moveToTile({
                                tileId: c.tileid,
                                player: xplayer,
                                ctx: gameContext,
                            });
                        } else if (c.count) {
                            time_till_finish = moveBySpaces({
                                spaces: c.count,
                                player: xplayer,
                                ctx: gameContext,
                                get200whengo: true,
                                afterFinished: () => {},
                            });
                        }
                        break;

                    case "addfunds":
                        addFunds({
                            player: xplayer,
                            amount: c.amount ?? 0,
                            ctx: gameContext
                        });
                        break;
                        
                    case "jail":
                        if (c.subaction !== undefined) {
                            switch (c.subaction) {
                                case "getout":
                                    xplayer.getoutCards += 1;
                                    break;
                                case "goto":
                                    goToJail({player: xplayer, ctx: gameContext});
                                    break;
                            }
                            SetClients(new Map(clients.set(xplayer.id, xplayer)));
                        }
                        break;

                    case "removefunds":
                        removeFunds({
                            player: xplayer,
                            amount: c.amount ?? 0,
                            ctx: gameContext
                        });
                        break;

                    case "removefundstoplayers":
                        addBalanceToOthers(c.amount ?? 0);
                        if (xplayer.id === socket.id) engineRef.current?.applyAnimation(1);
                        break;

                    case "addfundsfromplayers":
                        addBalanceToOthers(-(c.amount ?? 0));
                        break;

                    case "movenearest":
                        if (!c.groupid) return;

                        function findNextValue(arr: number[], X: number) {
                            // Sort the array in ascending order
                            arr.sort((a, b) => a - b);

                            // Loop through the array to find the next value
                            for (let i = 0; i < arr.length; i++) {
                                if (arr[i] > X) {
                                    return arr[i];
                                }
                            }

                            // If no value greater than X is found, return the first element (wrap around)
                            return arr[0];
                        }

                        var p = "";

                        if (c.groupid === "utility") {
                            p = "Utilities";
                        } else {
                            p = "Railroad";
                        }
                        const arr = monopolyJSON.properties.filter((v) => v.group === p).map((v) => v.position);
                        const ongoingLocation = findNextValue(arr, xplayer.position);
                        const _generatorResults = movePlayer({finalPosition: ongoingLocation, player: xplayer, ctx: gameContext});
                        time_till_finish = -1;
                        _generatorResults.start();
                        setTimeout(() => {
                            if (xplayer.id === socket.id) {
                                const location = xplayer?.position ?? -1;
                                const proprety = getPropertyByPosition(location);
                                if (proprety !== undefined) {
                                    engineRef.current?.setStreet({
                                        location,
                                        rolls: args.rolls,
                                        onResponse: (b, info) => {
                                            if (b === "buy") {
                                                buyProperty({
                                                    player: xplayer,
                                                    property: proprety,
                                                    ctx: gameContext
                                                });
                                            
                                                finishTurn({ localPlayer: xplayer, ctx: gameContext });
                                            } else if (b === "special_action") {
                                                const { rolls } = info as { rolls: number };

                                                buySpecialProperty({
                                                    player: xplayer,
                                                    property: proprety,
                                                    rolls: rolls,
                                                    ctx: gameContext
                                                });

                                                finishTurn({ localPlayer: xplayer, ctx: gameContext });
                                            } else if (b === "someones") {
                                                const players = Array.from(clients.values());

                                                for (const p of players) {
                                                    for (const prp of p.properties) {
                                                        if (prp.position === location) {
                                                            var payment_ammount = 0;

                                                            if (proprety.group === "Utilities" && prp.rent) {
                                                                const l = [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1];
                                                                socket.emit(
                                                                    "history",
                                                                    history(
                                                                        `${clients.get(socket.id)?.username ?? "unknown player"} rolled [${l[0]}, ${
                                                                            l[1]
                                                                        }]`
                                                                    )
                                                                );

                                                                engineRef.current?.diceResults({
                                                                    l: [l[0], l[1]],
                                                                    time: 2000,
                                                                    onDone: () => {
                                                                        payment_ammount = (l[0] + l[1]) * (c.rentmultiplier ?? 1);
                                                                        if (settings !== undefined && settings.notifications === true)
                                                                            notifyRef.current?.message(
                                                                                `${payment_ammount} of money is deducted from the account`,
                                                                                "info",
                                                                                2,
                                                                                () => {},
                                                                                false
                                                                            );
                                                                        playMoneyMinusSfx(settings);

                                                                        xplayer.balance -= payment_ammount;
                                                                        engineRef.current?.applyAnimation(1);
                                                                        socket.emit("pay", {
                                                                            balance: payment_ammount,
                                                                            from: socket.id,
                                                                            to: p.id,
                                                                        });

                                                                        socket.emit(
                                                                            "history",
                                                                            history(
                                                                                `${
                                                                                    clients.get(socket.id)?.username ?? "unknown player"
                                                                                } pay ${payment_ammount} to ${
                                                                                    clients.get(p.id)?.username ?? "unknown player"
                                                                                }`
                                                                            )
                                                                        );

                                                                        finishTurn({ localPlayer: xplayer, ctx: gameContext });
                                                                    },
                                                                });
                                                            } else if (proprety.group === "Railroad") {
                                                                const count = p.properties
                                                                    .filter((v) => v.group === "Railroad")
                                                                    .filter(
                                                                        (v) =>
                                                                            v.mortgaged === undefined ||
                                                                            (v.mortgaged !== undefined && v.mortgaged === false)
                                                                    ).length;
                                                                const rents = [0, 25, 50, 100, 200];
                                                                payment_ammount = rents[count] * (c.rentmultiplier ?? 1);

                                                                if (settings !== undefined && settings.notifications === true)
                                                                    notifyRef.current?.message(
                                                                        `${payment_ammount} of money is deducted from the account`,
                                                                        "info",
                                                                        2,
                                                                        () => {},
                                                                        false
                                                                    );
                                                                playMoneyMinusSfx(settings);
                                                                if (prp.mortgaged === undefined || (prp.mortgaged !== undefined && prp.mortgaged === false))
                                                                    xplayer.balance -= payment_ammount;
                                                                engineRef.current?.applyAnimation(1);
                                                                socket.emit("pay", {
                                                                    balance: payment_ammount,
                                                                    from: socket.id,
                                                                    to: p.id,
                                                                });
                                                                socket.emit(
                                                                    "history",
                                                                    history(
                                                                        `${
                                                                            clients.get(socket.id)?.username ?? "unknown player"
                                                                        } pay ${payment_ammount} to ${
                                                                            clients.get(p.id)?.username ?? "unknown player"
                                                                        }`
                                                                    )
                                                                );

                                                                finishTurn({ localPlayer: xplayer, ctx: gameContext });
                                                            }
                                                        }
                                                    }
                                                }
                                            } else {
                                                engineRef.current?.freeDice();
                                                const json = (clients.get(socket.id) as Player).toJson();
                                                socket.emit("finish-turn", json);
                                            }
                                        },
                                    });
                                }
                            }
                        }, _generatorResults.time);
                        break;

                    case "propertycharges":
                        function sum(b: number[]) {
                            var s = 0;
                            for (const x of b) {
                                s += x;
                            }
                            return 1;
                        }
                        var payment_ammount =
                            (c.buildings ?? 1) * sum(xplayer.properties.filter((v) => typeof v.count === "number").map((v) => v.count as number)) +
                            (c.hotels ?? 1) * xplayer.properties.filter((v) => v.count === "h").length;
                        
                        if (xplayer.id === socket.id && payment_ammount > 0) {
                            if (settings !== undefined && settings.notifications === true)
                                notifyRef.current?.message(`${payment_ammount} of money is deducted from the account`, "info", 2, () => {}, false);
                            playMoneyMinusSfx(settings);
                            engineRef.current?.applyAnimation(1);
                        }
                        xplayer.balance -= payment_ammount;
                        SetClients(new Map(clients.set(xplayer.id, xplayer)));
                        break;
                    default:
                        break;
                }

                if (time_till_finish >= 0) {
                    setTimeout(() => {
                        SetClients(new Map(clients.set(xplayer.id, xplayer)));
                        if (xplayer.id === socket.id) {
                            engineRef.current?.freeDice();
                            socket.emit("finish-turn", (clients.get(socket.id) as Player).toJson());
                        }
                    }, time_till_finish);
                }
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
            notifyRef.current?.dialog(
                (close_func, createButton) => ({
                    innerHTML: `<h3> LOST CONNECTION </h3> <p> you were disconnected from the game </p>`,
                    buttons: [
                        createButton("PLAY ANOTHER GAME", () => {
                            close_func();
                            document.location.reload();
                        }),
                    ],
                }),
                "losing"
            );
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
                                notifyRef.current?.message(
                                    `${a} of money is deducted from the account for canceling mortgage`,
                                    "info",
                                    2,
                                    () => {},
                                    false
                                );

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
                                notifyRef.current?.message(`${a} of money is deducted from the account for mortgage`, "info", 2, () => {}, false);
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
                        <main>
                            <h3>{selectedMode.Name}</h3>
                            <table>
                                <tr>
                                    <td> Winning State:</td> <td>{selectedMode.WinningMode.toUpperCase()}</td>
                                </tr>
                                {/* <tr>
                                    <td> Buying System:</td> <td>{selectedMode.BuyingSystem.toUpperCase()}</td>
                                </tr> */}
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
                                            if (server !== undefined)
                                                socket.emit("ready", {
                                                    mode: v,
                                                });
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
                                    // const buyingChoice = window.prompt("Buying System State\n1=following-order\n2=card-firsts\n3=everything", "3");
                                    const allowTrade = window.confirm("Allow Trades");
                                    const allowMortgage = window.confirm("Allow Mortgage");
                                    const startingCash = window.prompt("Starting Cash", "1500");
                                    const turnTimer = window.prompt("Turn Timer", "0");
                                    const v = {
                                        AllowDeals: allowTrade,
                                        // BuyingSystem: buyingChoice === "2" ? "card-firsts" : buyingChoice === "3" ? "everything" : "following-order",
                                        WinningMode:
                                            winstateChoice === "2" ? "monopols" : winstateChoice === "3" ? "monopols & trains" : "last-standing",
                                        Name: "Custom Mode",
                                        mortageAllowed: allowMortgage,
                                        startingCash: startingCash === null ? 1500 : parseInt(startingCash) ?? 1500,
                                        turnTimer: turnTimer === null ? undefined : parseInt(turnTimer) ?? undefined,
                                    } as MonopolyMode;
                                    if (server !== undefined)
                                        socket.emit("ready", {
                                            mode: v,
                                        });
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
