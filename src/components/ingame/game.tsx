import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import HouseIcon from "../../../public/h.png";
import HotelIcon from "../../../public/ho.png";
import { Player } from "./../../assets/player.ts";
import { Socket } from "../../assets/sockets.ts";
import { UtilitiesDisplayInfo, translateGroup } from "./streetCard.tsx";
import monopolyJSON from "../../assets/monopoly.json";
import { ChanceDisplayInfo } from "./specialCards.tsx";
import { MonopolyCookie, MonopolySettings, GameTrading, MonopolyMode } from "../../assets/types.ts";
import { CookieManager } from "../../assets/cookieManager.ts";
import DisplayHouses from "./displayHouses.tsx";
import DisplayStreets from "./displayStreets.tsx";
import TradePlayerPanel from "./trade/tradePlayerPanel.tsx";
import TradeBalanceSlider from "./trade/tradeBalanceSlider.tsx";
import TradeAvailableProperties from "./trade/tradeAvailableProperties.tsx";
import TradeCraftButtons from "./trade/tradeCraftButtons.tsx";
import TradeOpponentSelect from "./trade/tradeOpponentSelect.tsx";
import TradeRoleIndicator from "./trade/tradeRoleIndicator.tsx";
import { handleAdvancedPurchase } from "./purchase/advancedPurchase.ts";
import { handleSimplePurchase } from "./purchase/simplePurchase.ts";
import { handleStreetSquare } from "./landing/handleStreetSquare.ts";
import { handleRailroadSquare } from "./landing/handleRailroadSquare.ts";
import { handleUtilitySquare } from "./landing/handleUtilitySquare.ts";
import { handleSpecialSquare } from "./landing/handleSpecialSquare.ts";
import { StreetDisplayContainer } from "./squareInteraction/streetDisplayContainer.tsx";
import { ActionBar } from "./actionBar/actionBar.tsx";
import { propertiesDisplay } from "./propertyDisplay/propertiesDisplay.ts";
import { animatePlayers } from "./animation/animatePlayers.ts";


interface MonopolyGameProps {
    players: Array<Player>;
    myTurn: boolean;
    socket: Socket;
    clickedOnBoard: (a: number) => void;
    tradeObj?: undefined | GameTrading | boolean;
    tradeApi: {
        onSelectPlayer: (pId: string) => void;
    };
    selectedMode: MonopolyMode;
}
export interface MonopolyGameRef {
    diceResults: (args: { l: [number, number]; time: number; onDone: () => void }) => void;
    freeDice: () => void;
    setStreet: (args: {
        location: number;
        rolls: number;
        onResponse: (action: "nothing" | "buy" | "someones" | "special_action" | "advance-buy", info: object) => void;
    }) => void;
    chorch: (
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
        },
        is_chance: boolean,
        time: number
    ) => void;
    applyAnimation: (type: number) => void;
    showJailsButtons: (is_card: boolean) => void;
}

export interface g_SpecialAction {}
export type g_Buy = 0 | 1 | 2 | 3 | 4 | "h";

// Create the component with forwardRef
const MonopolyGame = forwardRef<MonopolyGameRef, MonopolyGameProps>((prop, ref) => {
    const propretyMap = new Map(
        monopolyJSON.properties.map((obj) => {
            return [obj.posistion ?? 0, obj];
        })
    );

    const [showDice, SetShowDice] = useState<boolean>(false);
    const [sended, SetSended] = useState<boolean>(false);
    const [showStreet, ShowStreet] = useState<boolean>(false);
    const [advnacedStreet, SetAdvancedStreet] = useState<boolean>(false);
    const [rotation, SetRotation] = useState<number>(0);
    const [scale, SetScale] = useState<number>(1);
    const [settings, SetSettings] = useState<MonopolySettings>();
    const [timer, SetTimer] = useState<number>(0);
    useEffect(() => {
        const settings_interval = setInterval(() => {
            SetSettings((JSON.parse(decodeURIComponent(CookieManager.get("monopolySettings") as string)) as MonopolyCookie).settings);
        }, 200);

        return () => {
            clearInterval(settings_interval);
        };
    }, [document.cookie]);

    const [streetDisplay, SetStreetDisplay] = useState<{}>({
        cardCost: -1,
        hotelsCost: -1,
        housesCost: -1,
        multpliedrent: [-1, -1, -1, -1, -1],
        rent: -1,
        rentWithColorSet: -1,
        title: "deafult",
        type: "electricity",
    } as UtilitiesDisplayInfo);

    const [streetType, SetStreetType] = useState<"Street" | "Utilities" | "Railroad" | "Chance" | "CommunityChest">("Street");

    function diceAnimation(a: number, b: number) {
        const element = document.getElementById("dice-panel") as HTMLDivElement;

        var bb = true;
        var t = -1;

        function randomCube() {
            var l = "./c";
            const numA = Math.floor(Math.random() * 6) + 1;
            const numB = Math.floor(Math.random() * 6) + 1;
            element.innerHTML = `
                <img src="${l}${numA}.png" />
                <img src="${l}${numB}.png" />
                
                `;
        }
        function anim() {
            if (bb) {
                randomCube();
                t += 1;
                requestAnimationFrame(anim);
            } else {
                var l = "./c";
                element.innerHTML = `
                <img src="${l}${a}.png" />
                <img src="${l}${b}.png" />
                `;
            }
        }
        setTimeout(() => {
            bb = false;
        }, 1000);

        requestAnimationFrame(anim);
    }
    function applyAnimation(type: number) {
        const element = document.querySelector("img#moneyAnimations");
        if (element === null) return;
        const imageElement = element as HTMLImageElement;
        imageElement.setAttribute("data-anim", "0");
        requestAnimationFrame(() => {
            imageElement.setAttribute("data-anim", type.toString());
            setTimeout(() => {
                imageElement.setAttribute("data-anim", "0");
            }, 1000);
        });
    }
    function swipeSound() {
        const _settings = (JSON.parse(decodeURIComponent(CookieManager.get("monopolySettings") as string)) as MonopolyCookie).settings;
        let audio = new Audio("./card.mp3");
        audio.volume = ((_settings?.audio[1] ?? 100) / 100) * ((_settings?.audio[0] ?? 100) / 100);
        audio.loop = false;
        audio.play();
    }

    useImperativeHandle(ref, () => ({
        diceResults: (args) => {
            diceAnimation(...args.l);
            SetShowDice(true);
            setTimeout(() => {
                SetShowDice(false);
                args.onDone();
            }, args.time);
        },
        freeDice: () => {
            const element = document.getElementById("dice-panel") as HTMLDivElement;
            element.innerHTML = "";
            SetSended(false);
        },
        setStreet: (args) => {
            // find data based on location
            const localPlayer = prop.players.filter((v) => v.id === prop.socket.id)[0];
            const x = propretyMap.get(args.location);

            if (x && args.location !== -1 && args.location < 40 && args.location >= 0) {
                function searchForButtons(
                    advanced: boolean,
                    location: number,
                    fartherInfo?: {
                        rolls: number;
                    }
                ) {
                    function clickSound() {
                        const _settings = (JSON.parse(decodeURIComponent(CookieManager.get("monopolySettings") as string)) as MonopolyCookie).settings;
                        let audio = new Audio("./click.mp3");
                        audio.volume = ((_settings?.audio[1] ?? 100) / 100) * ((_settings?.audio[0] ?? 100) / 100);
                        audio.loop = false;
                        audio.play();
                    }
                    function func() {
                        if (advanced) {
                            handleAdvancedPurchase({
                                propretyMap,
                                location,
                                localPlayer,
                                args,
                                prop,
                                ShowStreet,
                                clickSound
                            });
                        } else {
                            handleSimplePurchase({
                                args,
                                fartherInfo,
                                ShowStreet,
                                clickSound
                            });
                        }
                    }
                    return func;
                }

                var belong_to_me = false;
                var belong_to_others = false;
                var count: 0 | 1 | 2 | 3 | 4 | "h" = 0;
                // check states
                for (const _prp of localPlayer.properties) {
                    if (!belong_to_me && _prp.posistion === args.location) {
                        belong_to_me = true;
                        count = _prp.count;
                    }
                }
                for (const _p of prop.players) {
                    for (const _prp of _p.properties) {
                        if (_prp.posistion === args.location && _p.id != localPlayer.id) belong_to_others = true;
                    }
                }

                switch (x.group) {
                    case "Special":
                        handleSpecialSquare(args, ShowStreet);
                        break;

                    case "Utilities":
                        handleUtilitySquare({
                            x,
                            belongToMe: belong_to_me,
                            belongToOthers: belong_to_others,
                            localPlayer,
                            args,
                            ShowStreet,
                            SetStreetType,
                            SetStreetDisplay,
                            SetAdvancedStreet,
                            swipeSound,
                            searchForButtons
                        });
                        break;

                    case "Railroad":
                        handleRailroadSquare({
                            x,
                            belongToMe: belong_to_me,
                            belongToOthers: belong_to_others,
                            localPlayer,
                            args,
                            ShowStreet,
                            SetStreetType,
                            SetStreetDisplay,
                            swipeSound,
                            searchForButtons
                        });
                        break;

                    default:
                        handleStreetSquare({
                            x,
                            belongToMe: belong_to_me,
                            belongToOthers: belong_to_others,
                            count,
                            localPlayer,
                            args,
                            ShowStreet,
                            SetStreetType,
                            SetStreetDisplay,
                            SetAdvancedStreet,
                            swipeSound,
                            searchForButtons
                        });
                }
            } else {
                args.onResponse("nothing", {});
                ShowStreet(false);
            }
        },
        chorch(element, is_chance, time) {
            SetStreetType(is_chance ? "Chance" : "CommunityChest");
            SetStreetDisplay({
                title: element.title,
            } as ChanceDisplayInfo);
            swipeSound();
            ShowStreet(true);
            setTimeout(() => {
                ShowStreet(false);
            }, time);
        },
        applyAnimation(type) {
            applyAnimation(type);
        },
        showJailsButtons: (is_card: boolean) => {
            const payElement = document.querySelector(`button[data-button-type="pay"]`) as HTMLButtonElement;
            const cardElement = document.querySelector(`button[data-button-type="card"]`) as HTMLButtonElement;
            const rollElement = document.querySelector(`button[data-button-type="roll"]`) as HTMLButtonElement;

            function returnToNormal() {
                rollElement.onclick = () => {
                    SetSended(true);
                    prop.socket.emit("roll_dice");
                    console.warn("roll after return to normal");
                    SetTimer(0);
                };
                SetTimer(0);
                SetSended(true);
                cardElement.onclick = () => {};
                cardElement.setAttribute("aria-disabled", "true");
                setTimeout(() => {
                    cardElement.setAttribute("aria-disabled", "true");
                }, 300);

                payElement.style.translate = "0px 0px";
                payElement.onclick = () => {};
                payElement.setAttribute("aria-disabled", "true");
                setTimeout(() => {
                    payElement.setAttribute("aria-disabled", "true");
                }, 300);
            }

            payElement.setAttribute("aria-disabled", "false");
            payElement.onclick = () => {
                // handle paying
                applyAnimation(1);

                prop.socket.emit("unjail", "pay");
                prop.socket.emit("roll_dice");
                console.warn("pay");

                returnToNormal();
            };

            if (is_card) {
                const cardButton = cardElement as HTMLButtonElement;
                cardButton.setAttribute("aria-disabled", "false");
                cardButton.onclick = () => {
                    // take 1 card
                    prop.socket.emit("unjail", "card");
                    prop.socket.emit("roll_dice");
                    console.warn("card");
                    returnToNormal();
                };
            }
            rollElement.onclick = () => {
                prop.socket.emit("roll_dice");
                console.warn("roll when in jail");
                returnToNormal();
                SetSended(true);
                SetTimer(0);
            };
        },
    }));

    useEffect(() => {
        // Rotation and Scale with mouse
        (document.getElementById("locations") as HTMLDivElement).onwheel = (e) => {
            if (e.shiftKey) {
                SetScale((old) => old + (e.deltaY * (settings !== undefined ? settings.accessibility[1] : 5)) / 5000);
            } else {
                SetRotation((old) => old + (e.deltaY * (settings !== undefined ? settings.accessibility[0] : 45)) / 100);
            }
        };
        // Clicking Street
        const safe = Array.from(propretyMap.values()).filter((v) => v.group != "Special");
        for (const x of safe) {
            const element = (document.getElementById("locations") as HTMLDivElement).querySelector(
                `div.street[data-position="${x.posistion}"]`
            ) as HTMLDivElement;

            element.onclick = () => {
                prop.clickedOnBoard(x.posistion);
            };

            element.onmousemove = () => {
                element.style.cursor = "pointer";
                element.style.backgroundColor = "rgba(0,0,0,15%)";
            };
            element.onmouseleave = () => {
                element.style.cursor = "unset";
                element.style.scale = "1";
                element.style.backgroundColor = "rgba(0,0,0,0%)";
            };
        }
    }, [settings]);

    useEffect(() => {
        var continue_to_animate = true;
        const animate = () => {
            animatePlayers({
                players: prop.players,
                rotation,
                settings,
                continueAnimation: () => continue_to_animate,
                onFrameComplete: () => {
                    const container = document.getElementById("display-houses") as HTMLDivElement;
                    propertiesDisplay(container, prop.players, settings);
                }
            });
        };
        requestAnimationFrame(animate);

        return () => {
            continue_to_animate = false;
        };
    }, [prop.players, rotation]);

    useEffect(() => {
        const rollElement = document.querySelector(`button[data-button-type="roll"]`) as HTMLButtonElement;
        rollElement.onclick = () => {
            SetSended(true);
            prop.socket.emit("roll_dice");
            console.warn("first roll");
            SetTimer(0);
        };
    }, []);

    useEffect(() => {
        if (prop.myTurn && !sended) {
            var l: NodeJS.Timeout | undefined = undefined;
            if (prop.selectedMode.turnTimer !== undefined && prop.selectedMode.turnTimer > 0) {
                var x = 0;
                l = setInterval(() => {
                    x += 1;
                    SetTimer(x);
                    if (prop.selectedMode.turnTimer !== undefined && prop.selectedMode.turnTimer > 0) {
                        if (x >= prop.selectedMode.turnTimer) {
                            if (prop.myTurn && !sended) {
                                const rollElement = document.querySelector(`button[data-button-type="roll"]`) as HTMLButtonElement;
                                rollElement.click();
                                SetTimer(0);
                                clearInterval(l);
                            }
                        }
                    }
                }, 1000);
            }
        }

        return () => {
            clearInterval(l);
            SetTimer(0);
            console.log("stopped");
        };
    }, [prop.myTurn, sended, prop.selectedMode]);
    return (
        <>
            <div className="game" style={prop.tradeObj !== undefined ? { translate: "0px -100%" } : {}}>
                <div style={{ overflowY: "hidden" }}>
                    <div id="dice-panel" data-show={showDice}></div>
                    <div
                        className="board"
                        style={{
                            transform: `translateX(-50%) translateY(-50%) rotate(${rotation}deg) scale(${scale})`,
                        }}
                        id="locations"
                    >
                        <DisplayHouses />
                        <DisplayStreets />
                    </div>
                    <ActionBar
                        myTurn={prop.myTurn}
                        sended={sended}
                        selectedMode={prop.selectedMode}
                        timer={timer}
                        onTrade={() => {
                            SetSended(true);
                            prop.socket.emit("trade");
                        }}
                    />
                    <StreetDisplayContainer
                        streetType={streetType}
                        streetDisplay={streetDisplay}
                        showStreet={showStreet}
                        advancedStreet={advnacedStreet}
                    />
                    <img data-anim="0" id="moneyAnimations" alt="" />
                </div>
                <div className="trade-table">
                    <div className="middle">
                        <h3>Trade</h3>
                        {typeof prop.tradeObj !== "object" ? (
                            <TradeOpponentSelect
                                players={prop.players}
                                socket={prop.socket}
                                myTurn={prop.myTurn}
                                tradeApi={prop.tradeApi}
                                setSended={SetSended}
                            />
                        ) : (
                            <>
                                <div className="trade-mission">
                                    <div className="flexchild">
                                        {prop.socket.id === prop.tradeObj.againstPlayer.id || prop.socket.id === prop.tradeObj.turnPlayer.id ? (
                                            <div className="trade-craft">
                                                <TradeRoleIndicator
                                                    socket={prop.socket}
                                                    tradeObj={prop.tradeObj as GameTrading}
                                                />
                                                <TradeBalanceSlider
                                                    socket={prop.socket}
                                                    tradeObj={prop.tradeObj as GameTrading}
                                                    players={prop.players}
                                                />
                                                <br />

                                                <TradeAvailableProperties
                                                    players={prop.players}
                                                    tradeObj={prop.tradeObj as GameTrading}
                                                    socket={prop.socket}
                                                    translateGroup={translateGroup}
                                                    propretyMap={propretyMap}
                                                    HouseIcon={HouseIcon}
                                                    HotelIcon={HotelIcon}
                                                />
                                            </div>
                                        ) : (
                                            <></>
                                        )}
                                    </div>

                                    <div className="flexchild">
                                        <TradePlayerPanel
                                            label="current player"
                                            playerId={prop.tradeObj.turnPlayer.id}
                                            tradePlayer={prop.tradeObj.turnPlayer}
                                            allPlayers={prop.players}
                                            socket={prop.socket}
                                            tradeObj={prop.tradeObj}
                                            role="turnPlayer"
                                            propretyMap={propretyMap}
                                        />

                                        <TradePlayerPanel
                                            label="opponent player"
                                            playerId={prop.tradeObj.againstPlayer.id}
                                            tradePlayer={prop.tradeObj.againstPlayer}
                                            allPlayers={prop.players}
                                            socket={prop.socket}
                                            tradeObj={prop.tradeObj}
                                            role="againstPlayer"
                                            propretyMap={propretyMap}
                                        />
                                    </div>
                                    <div className="flexchild"></div>
                                </div>

                                <TradeCraftButtons
                                    myTurn={prop.myTurn}
                                    tradeObj={prop.tradeObj as GameTrading}
                                    socket={prop.socket}
                                    setSended={SetSended}
                                />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
});
export default MonopolyGame;
