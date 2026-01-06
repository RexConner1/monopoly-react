import { useState, useEffect, useRef } from "react";
import { Server, Socket } from "../../assets/sockets.ts";
import { Player, PlayerJSON } from "../../assets/player.ts";
import "../../monopoly.css";
import MonopolyNav, { MonopolyNavRef } from "../../components/nav/nav.tsx";
import MonopolyGame, { MonopolyGameRef } from "../../components/game.tsx";
import NotifyElement, { NotificatorRef } from "../../components/notificator.tsx";
import monopolyJSON from "../../assets/monopoly.json";
import { MonopolySettings, MonopolyModes, historyAction, history, GameTrading, MonopolyMode, Property } from "../../assets/types.ts";
import { CookieManager } from "../../assets/cookieManager.ts";
import { playerMoveGenerator } from "../../game/movement/playerMoveGenerator.ts";
import { playJailSfx, playMoneyMinusSfx, playMoneyPlusSfx, playPurchaseSfx, playRollSfx } from "../../ui/audio/audio.ts";
import { showDialog } from "../../ui/dialogs/dialogFactory.ts";
import { notifyMessage } from "../../ui/notifications/notificationFactory.ts";
import { buyProperty } from "../../game/logic/buyProperty.ts";
import { buildOnProperty } from "../../game/logic/buildOnProperty.ts";
import { payLuxuryTax } from "../../game/logic/payLuxuryTax.ts";
import { payIncomeTax } from "../../game/logic/payIncomeTax.ts";
import { handleRentPayment } from "../../actions/rent/handleRentPayment.ts";
import { buySpecialAction } from "../../game/logic/buySpecialAction.ts";
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
            const parsedCookie = JSON.parse(decodeURIComponent(CookieManager.get("monopolySettings") as string))["monopolySettings"];
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

    const monopolyProperties = monopolyJSON.properties as Property[];
    const propretyMap = new Map(
        monopolyProperties.map((obj) => {
            return [obj.posistion ?? 0, obj];
        })
    );
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
            settings = JSON.parse(decodeURIComponent(CookieManager.get("monopolySettings") as string))["monopolySettings"];
        }, 1000);

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
                    updateClients: () =>
                        SetClients(new Map(clients.set(_xplayer.id, _xplayer)))
                },
                get200whengo,
                afterFinished,
                adding
            );
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
                notifyMessage(notifyRef, "PLAYER_DISCONNECTED", { name });
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
                        notifyMessage(notifyRef, "PLAYER_LOST", { name });
                    } else {
                        if (clients.has(socket.id)) {
                            mainTheme.pause();
                            showDialog(notifyRef, "YOU_WIN", {
                                balance: clients.get(socket.id)?.balance
                            });
                        } else {
                            const xclient = Array.from(clients.values()).filter((v) => v.id !== args.pJson.id)[0];
                            const name = xclient.username ?? 0;
                            mainTheme.pause();
                            showDialog(notifyRef, "PLAYER_WON", {
                                playerName: name,
                                balance: clients.get(socket.id)?.balance
                            });
                        }
                    }
                } else {
                    mainTheme.pause();
                    showDialog(notifyRef, "YOU_LOST", {
                        balance: clients.get(socket.id)?.balance
                    }, "losing");
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
                        const cc = monopolyProperties.filter((v) => v.group === g).length;
                        if (c === cc) {
                            x += 1;
                        }
                    }
                    if (x === 3) {
                        mainTheme.pause();
                        if (p.id === socket.id) {
                            showDialog(notifyRef, "THREE_SETS");
                        } else {
                            showDialog(notifyRef, "THREE_SETS", {
                                playerName: p.username
                            });
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
                                showDialog(notifyRef, "FOUR_RAILROADS");
                            } else {
                                showDialog(notifyRef, "FOUR_RAILROADS", {
                                    playerName: p.username
                                });
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
                        propretyMap.get(args.listOfNums[2])?.name ?? ""
                    }"`
                ),
            ]);
            
            playRollSfx(settings);

            // const sumTimes = args.listOfNums[0] + args.listOfNums[1];
            const localPlayer = clients.get(socket.id) as Player;
            const xplayer = clients.get(args.turnId) as Player;
            const dice_generatorResults = playerMoveGENERATOR(args.listOfNums[2], xplayer, true, () => {
                if (args.turnId != socket.id && args.listOfNums[2] === 30) {
                    setTimeout(() => {
                        SetHistories((old) => [...old, history(`${clients.get(args.turnId)?.username ?? "unknown player"} goes to jail`)]);
                        const generatorResults = playerMoveGENERATOR(10, xplayer, false, () => {
                            xplayer.position = 10;
                            xplayer.isInJail = true;
                            
                            playJailSfx(settings);
                            
                            xplayer.jailTurnsRemaining = 3;
                        });
                        generatorResults.func();
                    }, 800);
                }
            });

            engineRef.current?.diceResults({
                l: [args.listOfNums[0], args.listOfNums[1]],
                time: localPlayer.isInJail ? 2000 : dice_generatorResults.time + 2000 + 800,
                onDone: () => {
                    if (socket.id !== args.turnId) return;

                    const location = clients.get(socket.id)?.position ?? -1;
                    const property = propretyMap.get(location);
                    if (property != undefined) {
                        if (property.id === "communitychest" || property.id === "chance") {
                            socket.emit("chorch_roll", { is_chance: property.id === "chance", rolls: args.listOfNums[0] + args.listOfNums[1] });
                        } else {
                            engineRef.current?.setStreet({
                                location,
                                rolls: args.listOfNums[1] + args.listOfNums[0],
                                onResponse: (b, info) => {
                                    var time_till_free = 0;
                                    if (b === "buy") {
                                        buyProperty({
                                            player: localPlayer,
                                            property,
                                            propretyMap,
                                            settings,
                                            notifyRef,
                                            engineRef,
                                            socket,
                                            clients
                                        })
                                    } else if (b === "advance-buy") {
                                        buildOnProperty({
                                            player: localPlayer,
                                            property,
                                            location,
                                            info,
                                            settings,
                                            notifyRef,
                                            engineRef,
                                            socket,
                                            clients
                                        })
                                    } else if (b === "someones") {
                                        handleRentPayment({
                                            socket,
                                            players: clients,
                                            currentPlayer: localPlayer,
                                            property,
                                            location,
                                            notifyRef,
                                            settings,
                                            engineRef,
                                        })
                                    } else if (b === "nothing") {
                                        if ((property?.id ?? "") == "gotojail") {
                                            const generatorResults = playerMoveGENERATOR(10, xplayer, false, () => {
                                                xplayer.position = 10;
                                                xplayer.isInJail = true;
                                                xplayer.jailTurnsRemaining = 3;
                                            });

                                            time_till_free = generatorResults.time;
                                            generatorResults.func();
                                        }

                                        if (property?.id === "incometax") {
                                            payIncomeTax({
                                                player: localPlayer,
                                                settings,
                                                notifyRef,
                                                engineRef,
                                                socket,
                                                clients
                                            })
                                        }
                                        if (property?.id === "luxerytax") {
                                            payLuxuryTax({
                                                player: localPlayer,
                                                settings,
                                                notifyRef,
                                                engineRef,
                                                socket,
                                                clients
                                            })
                                        }
                                    } else if (b === "special_action") {
                                        buySpecialAction({
                                            player: localPlayer,
                                            property,
                                            propretyMap,
                                            info,
                                            settings,
                                            notifyRef,
                                            engineRef,
                                            socket,
                                            clients
                                        })
                                    }

                                    setTimeout(() => {
                                        SetClients(new Map(clients.set(socket.id, localPlayer)));
                                        engineRef.current?.freeDice();
                                        const json = (clients.get(socket.id) as Player).toJson();
                                        socket.emit("finish-turn", json);
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
                            dice_generatorResults.func();
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
                    dice_generatorResults.func();
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
                        notifyMessage(notifyRef, "MONEY_DEDUCTED", {
                            amount: 50
                        });

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
            element: {
                title: string;
                action: string;
                tileid: string;
                groupid?: undefined;
                rentmultiplier?: undefined;
                amount?: undefined;
                subaction?: undefined;
                count?: undefined;
                buildings?: undefined;
                hotels?: undefined;
            };
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
                function addBalanceToOthers(amount: number) {
                    if (xplayer === undefined) return 0;

                    const other_players = Array.from(clients.values()).filter((v) => v.id !== xplayer.id);

                    if (xplayer.id === socket.id) {
                        if (amount > 0) {
                            // give money
                            socket.emit(
                                "history",
                                history(
                                    `${xplayer.username ?? "unknown user"} gave ${amount} money to [${other_players
                                        .map((v) => v.username)
                                        .join(", ")}]`
                                )
                            );
                        } else {
                            // get money!
                            socket.emit(
                                "history",
                                history(
                                    `${xplayer.username ?? "unknown user"} recieve ${-amount} money from [${other_players
                                        .map((v) => v.username)
                                        .join(", ")}]`
                                )
                            );
                        }
                    }

                    for (const p of other_players) {
                        p.balance += amount;
                        if (p.id === socket.id && settings !== undefined && settings.notifications === true) {
                            notifyMessage(notifyRef, "MONEY_ADDED", {
                                amount: amount
                            });
                            
                            playMoneyPlusSfx(settings);
                        }
                        SetClients(new Map(clients.set(p.id, p)));

                        if (xplayer.id === socket.id) {
                            if (amount > 0) {
                                socket.emit("pay", {
                                    balance: amount,
                                    from: socket.id,
                                    to: p.id,
                                });
                            } else {
                                // recieve money
                                socket.emit("pay", {
                                    balance: amount,
                                    from: p.id,
                                    to: socket.id,
                                });

                                socket.emit(
                                    "history",
                                    history(`
                                ${clients.get(socket.id)?.username ?? "unknown user"} pay ${payment_amount} to ${
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
                            const p = new Map(
                                monopolyProperties.map((obj) => {
                                    return [obj.id, obj];
                                })
                            );
                            const targetPos = p.get(c.tileid)?.posistion;
                            if (targetPos === undefined) break;

                            const _generatorResults = playerMoveGENERATOR(targetPos, xplayer);
                            time_till_finish = _generatorResults.time;
                            _generatorResults.func();
                        } else if (c.count) {
                            const _generatorResults = playerMoveGENERATOR((xplayer.position + c.count) % 40, xplayer, true, () => {}, c.count >= 0);
                            time_till_finish = _generatorResults.time;
                            _generatorResults.func();
                        }
                        break;

                    case "addfunds":
                        xplayer.balance += c.amount ?? 0;
                        if (xplayer.id === socket.id) {
                            if (settings !== undefined && settings.notifications === true)
                                notifyMessage(notifyRef, "MONEY_ADDED", {
                                    amount: c.amount ?? 0
                                });
                            
                            playMoneyPlusSfx(settings);

                            engineRef.current?.applyAnimation(2);
                        }
                        break;
                    case "jail":
                        if (c.subaction !== undefined) {
                            switch (c.subaction) {
                                case "getout":
                                    xplayer.getoutCards += 1;
                                    break;
                                case "goto":
                                    const _generatorResults = playerMoveGENERATOR(10, xplayer, false, () => {
                                        xplayer.position = 10;
                                        xplayer.isInJail = true;

                                        playJailSfx(settings);
                                        
                                        xplayer.jailTurnsRemaining = 3;
                                    });
                                    time_till_finish = _generatorResults.time;
                                    _generatorResults.func();
                                    break;
                            }
                            SetClients(new Map(clients.set(xplayer.id, xplayer)));
                        }
                        break;

                    case "removefunds":
                        xplayer.balance -= c.amount ?? 0;
                        if (xplayer.id === socket.id) {
                            engineRef.current?.applyAnimation(1);
                            if (settings !== undefined && settings.notifications === true)
                                notifyMessage(notifyRef, "MONEY_DEDUCTED", {
                                    amount: c.amount ?? 0
                                });
                            
                            playMoneyMinusSfx(settings);
                        }
                        break;
                    // amount
                    case "removefundstoplayers":
                        addBalanceToOthers(c.amount ?? 0);
                        // xplayer.balance -= (c.amount ?? 0) * l;
                        if (xplayer.id === socket.id) engineRef.current?.applyAnimation(1);
                        break;

                    case "addfundsfromplayers":
                        addBalanceToOthers(-(c.amount ?? 0));
                        // xplayer.balance += (c.amount ?? 0) * l;
                        // if (xplayer.id === socket.id)
                        //     engineRef.current?.applyAnimation(2);
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
                        const arr = monopolyProperties.filter((v) => v.group === p).map((v) => v.posistion);
                        const ongoingLocation = findNextValue(arr, xplayer.position);
                        const _generatorResults = playerMoveGENERATOR(ongoingLocation, xplayer);
                        time_till_finish = -1;
                        _generatorResults.func();
                        setTimeout(() => {
                            if (xplayer.id === socket.id) {
                                const location = xplayer?.position ?? -1;
                                const property = propretyMap.get(location);
                                if (property !== undefined) {
                                    engineRef.current?.setStreet({
                                        location,
                                        rolls: args.rolls,
                                        onResponse: (b, info) => {
                                            if (b === "buy") {
                                                if (settings !== undefined && settings.notifications === true)
                                                    notifyMessage(notifyRef, "MONEY_DEDUCTED", {
                                                        amount: property?.price ?? 0
                                                    });
                                                xplayer.balance -= (property?.price ?? 0) * 1;

                                                engineRef.current?.applyAnimation(1);
                                                const prp = propretyMap.get(xplayer.position);
                                                xplayer.properties.push({
                                                    posistion: xplayer.position,
                                                    count: 0,
                                                    group: prp?.group ?? "",
                                                });

                                                playPurchaseSfx(settings);

                                                SetClients(new Map(clients.set(socket.id, xplayer)));
                                                engineRef.current?.freeDice();
                                                const json = (clients.get(socket.id) as Player).toJson();
                                                socket.emit("finish-turn", json);

                                                socket.emit(
                                                    "history",
                                                    history(
                                                        `${clients.get(socket.id)?.username ?? "unknown player"} bought ${
                                                            prp?.name ?? "unkown place"
                                                        }`
                                                    )
                                                );
                                            } else if (b === "special_action") {
                                                console.log(info);
                                                if (settings !== undefined && settings.notifications === true)
                                                    notifyMessage(notifyRef, "MONEY_DEDUCTED", {
                                                        amount: property?.price ?? 0
                                                    });
                                                xplayer.balance -= (property?.price ?? 0) * 1;

                                                const _info = info as {
                                                    rolls: number;
                                                };

                                                const calculateRent = _info.rolls;
                                                engineRef.current?.applyAnimation(1);
                                                const prp = propretyMap.get(xplayer.position);
                                                xplayer.properties.push({
                                                    posistion: xplayer.position,
                                                    count: 0,
                                                    rent: calculateRent,
                                                    group: prp?.group ?? "",
                                                });
                                                
                                                playPurchaseSfx(settings);

                                                SetClients(new Map(clients.set(socket.id, xplayer)));
                                                engineRef.current?.freeDice();
                                                const json = (clients.get(socket.id) as Player).toJson();
                                                socket.emit("finish-turn", json);

                                                socket.emit(
                                                    "history",
                                                    history(
                                                        `${clients.get(socket.id)?.username ?? "unknown player"} bought ${
                                                            prp?.name ?? "unkown place"
                                                        } with rent of ${calculateRent}`
                                                    )
                                                );
                                            } else if (b === "someones") {
                                                const players = Array.from(clients.values());

                                                for (const p of players) {
                                                    for (const prp of p.properties) {
                                                        if (prp.posistion === location) {
                                                            var payment_amount = 0;

                                                            if (property.group === "Utilities" && prp.rent) {
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
                                                                        payment_amount = (l[0] + l[1]) * (c.rentmultiplier ?? 1);
                                                                        if (settings !== undefined && settings.notifications === true)
                                                                            notifyMessage(notifyRef, "MONEY_DEDUCTED", {
                                                                                amount: payment_amount
                                                                            });

                                                                        playMoneyMinusSfx(settings);

                                                                        xplayer.balance -= payment_amount;
                                                                        engineRef.current?.applyAnimation(1);
                                                                        socket.emit("pay", {
                                                                            balance: payment_amount,
                                                                            from: socket.id,
                                                                            to: p.id,
                                                                        });

                                                                        socket.emit(
                                                                            "history",
                                                                            history(
                                                                                `${
                                                                                    clients.get(socket.id)?.username ?? "unknown player"
                                                                                } pay ${payment_amount} to ${
                                                                                    clients.get(p.id)?.username ?? "unknown player"
                                                                                }`
                                                                            )
                                                                        );

                                                                        SetClients(new Map(clients.set(socket.id, xplayer)));
                                                                        engineRef.current?.freeDice();
                                                                        const json = (clients.get(socket.id) as Player).toJson();
                                                                        socket.emit("finish-turn", json);
                                                                    },
                                                                });
                                                            } else if (property.group === "Railroad") {
                                                                const count = p.properties
                                                                    .filter((v) => v.group === "Railroad")
                                                                    .filter(
                                                                        (v) =>
                                                                            v.morgage === undefined ||
                                                                            (v.morgage !== undefined && v.morgage === false)
                                                                    ).length;
                                                                const rents = [0, 25, 50, 100, 200];
                                                                payment_amount = rents[count] * (c.rentmultiplier ?? 1);

                                                                if (settings !== undefined && settings.notifications === true)
                                                                    notifyMessage(notifyRef, "MONEY_DEDUCTED", {
                                                                        amount: payment_amount
                                                                    });

                                                                playMoneyMinusSfx(settings);
                                                                
                                                                if (prp.morgage === undefined || (prp.morgage !== undefined && prp.morgage === false))
                                                                    xplayer.balance -= payment_amount;
                                                                engineRef.current?.applyAnimation(1);
                                                                socket.emit("pay", {
                                                                    balance: payment_amount,
                                                                    from: socket.id,
                                                                    to: p.id,
                                                                });
                                                                socket.emit(
                                                                    "history",
                                                                    history(
                                                                        `${
                                                                            clients.get(socket.id)?.username ?? "unknown player"
                                                                        } pay ${payment_amount} to ${
                                                                            clients.get(p.id)?.username ?? "unknown player"
                                                                        }`
                                                                    )
                                                                );
                                                                SetClients(new Map(clients.set(socket.id, xplayer)));
                                                                engineRef.current?.freeDice();
                                                                const json = (clients.get(socket.id) as Player).toJson();
                                                                socket.emit("finish-turn", json);
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
                        var payment_amount =
                            (c.buildings ?? 1) * sum(xplayer.properties.filter((v) => typeof v.count === "number").map((v) => v.count as number)) +
                            (c.hotels ?? 1) * xplayer.properties.filter((v) => v.count === "h").length;
                        console.log(`
${(c.buildings ?? 1) * sum(xplayer.properties.filter((v) => typeof v.count === "number").map((v) => v.count as number))} + 
${(c.hotels ?? 1) * xplayer.properties.filter((v) => v.count === "h").length} 
which is ${payment_amount}
                        `);
                        if (xplayer.id === socket.id && payment_amount > 0) {
                            if (settings !== undefined && settings.notifications === true)
                                notifyMessage(notifyRef, "MONEY_DEDUCTED", {
                                    amount: payment_amount
                                });

                            playMoneyMinusSfx(settings);

                            engineRef.current?.applyAnimation(1);
                        }
                        xplayer.balance -= payment_amount;
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
