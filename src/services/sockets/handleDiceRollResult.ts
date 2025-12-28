import type { Player } from "../../assets/player.ts";
import type { PlayerJSON } from "../../assets/player.ts";
import type { MonopolySettings, historyAction } from "../../assets/types.ts";
import { history } from "../../assets/types.ts";
import type React from "react";
import { playRollSfx, playPurchaseSfx, playMoneyMinusSfx } from "../../game/audio/audio.ts";

export type DiceRollArgs = { listOfNums: [number, number, number]; turnId: string };

export type PlayerMoveGenerator = (
    finalPos: number,
    player: Player,
    get200whenGo?: boolean,
    afterFinished?: () => void,
    adding?: boolean
) => { func: () => void; time: number };

export type HandleDiceRollDeps = {
    clients: Map<string, Player>;
    socket: any;
    settings?: MonopolySettings;
    propertyByPosition: Map<number, any>;
    setClients: (m: Map<string, Player>) => void;
    setHistories: (fn: (old: Array<historyAction>) => Array<historyAction>) => void;
    engineRef: React.MutableRefObject<any>;
    notifyRef: React.MutableRefObject<any>;
    playerMove: PlayerMoveGenerator;
};

export function handleDiceRollResult(args: DiceRollArgs, deps: HandleDiceRollDeps) {
    const { clients, socket, settings, propertyByPosition, setClients, setHistories, engineRef, notifyRef, playerMove } = deps;

    setHistories((old) => [
        ...old,
        history(
            `${clients.get(args.turnId)?.username ?? "unknown player"} rolled [${args.listOfNums[0]}, ${args.listOfNums[1]}] moving to "${
                propertyByPosition.get(args.listOfNums[2])?.name ?? ""
            }"`
        ),
    ]);

    playRollSfx(settings);

    const localPlayer = clients.get(socket.id) as Player;
    const xplayer = clients.get(args.turnId) as Player;

    const dice_generatorResults = playerMove(args.listOfNums[2], xplayer, true, () => {
        if (args.turnId != socket.id && args.listOfNums[2] === 30) {
            setTimeout(() => {
                setHistories((old) => [...old, history(`${clients.get(args.turnId)?.username ?? "unknown player"} goes to jail`)]);
                const generatorResults = playerMove(10, xplayer, false, () => {
                    xplayer.position = 10;
                    xplayer.isInJail = true;
                    playSfxJail();
                    xplayer.jailTurnsRemaining = 3;
                });
                generatorResults.func();
            }, 800);
        }
    });

    function playSfxJail() {
        // kept inline to avoid circular deps with other handlers
        const audio = new Audio("./jail.mp3");
        audio.volume = 0.5 * ((settings?.audio[1] ?? 100) / 100) * ((settings?.audio[0] ?? 100) / 100);
        audio.loop = false;
        audio.play();
    }

    engineRef.current?.diceResults({
        l: [args.listOfNums[0], args.listOfNums[1]],
        time: localPlayer.isInJail ? 2000 : dice_generatorResults.time + 2000 + 800,
        onDone: () => {
            if (socket.id !== args.turnId) return;

            const location = clients.get(socket.id)?.position ?? -1;
            const proprety = propertyByPosition.get(location);
            if (proprety != undefined) {
                if (proprety.id === "communitychest" || proprety.id === "chance") {
                    socket.emit("chorch_roll", {
                        is_chance: proprety.id === "chance",
                        rolls: args.listOfNums[0] + args.listOfNums[1],
                    });
                } else {
                    engineRef.current?.setStreet({
                        location,
                        rolls: args.listOfNums[1] + args.listOfNums[0],
                        onResponse: (b: string, info: any) => {
                            let time_till_free = 0;

                            if (b === "buy") {
                                if (settings !== undefined && (settings as any).notifications === true)
                                    notifyRef.current?.message(
                                        `${(proprety?.price ?? 0) * 1} of money is deducted from the account`,
                                        "info",
                                        2,
                                        () => {},
                                        false
                                    );
                                localPlayer.balance -= (proprety?.price ?? 0) * 1;
                                engineRef.current?.applyAnimation(1);
                                localPlayer.properties.push({
                                    posistion: localPlayer.position,
                                    count: 0,
                                    group: propertyByPosition.get(localPlayer.position)?.group ?? "",
                                });
                                playPurchaseSfx(settings);

                                socket.emit("history", history(`${clients.get(socket.id)?.username ?? "unknown player"} bought ${proprety.name}`));
                            } else if (b === "advance-buy") {
                                playPurchaseSfx(settings);
                                const propId = Array.from(new Map(localPlayer.properties.map((v, i) => [i, v])).entries()).filter(
                                    (v) => v[1].posistion === location
                                )[0][0];

                                const _info = info as { state: 1 | 2 | 3 | 4 | 5; money: number };
                                localPlayer.properties[propId].count = _info.state === 5 ? "h" : _info.state;

                                if (_info.state === 5) {
                                    if (settings !== undefined && (settings as any).notifications === true)
                                        notifyRef.current?.message(
                                            `${proprety.ohousecost ?? 0} of money is deducted from the account`,
                                            "info",
                                            2,
                                            () => {},
                                            false
                                        );
                                    localPlayer.balance -= proprety.ohousecost ?? 0;
                                    engineRef.current?.applyAnimation(1);
                                } else {
                                    if (settings !== undefined && (settings as any).notifications === true)
                                        notifyRef.current?.message(
                                            `${proprety.housecost ?? 0} of money is deducted from the account`,
                                            "info",
                                            2,
                                            () => {},
                                            false
                                        );
                                    localPlayer.balance -= (proprety.housecost ?? 0) * _info.money;
                                    engineRef.current?.applyAnimation(1);
                                }

                                socket.emit("history", history(`${clients.get(socket.id)?.username ?? "unknown player"} advanced ${proprety.name}`));
                            } else if (b === "someones") {
                                const players = Array.from(clients.values());
                                for (const p of players) {
                                    for (const prp of p.properties) {
                                        if (prp.posistion === location) {
                                            let payment_ammount = 0;

                                            if (proprety.group === "Utilities" && prp.rent) {
                                                const multy_ = p.properties.filter((v) => v.group === "Utilities").length === 2 ? 10 : 4;
                                                payment_ammount = prp.rent * multy_;
                                            } else if (proprety.group === "Railroad") {
                                                const count = p.properties
                                                    .filter((v) => v.group === "Railroad")
                                                    .filter((v) => v.morgage === undefined || (v.morgage !== undefined && v.morgage === false)).length;
                                                const rents = [0, 25, 50, 100, 200];
                                                payment_ammount = rents[count];
                                            } else if (prp.count === 0) {
                                                payment_ammount = proprety?.rent ?? 0;
                                            } else if (typeof prp.count === "number" && prp.count > 0) {
                                                payment_ammount = (proprety?.multpliedrent ?? [0, 0, 0, 0])[prp.count - 1] ?? 0;
                                            } else if (prp.count === "h") {
                                                payment_ammount = (proprety?.multpliedrent ?? [0, 0, 0, 0, 0])[4] ?? 0;
                                            }
                                            if (settings !== undefined && (settings as any).notifications === true)
                                                notifyRef.current?.message(`${payment_ammount} of money is deducted from the account`, "info", 2, () => {}, false);
                                            playMoneyMinusSfx(settings);
                                            if (prp.morgage === undefined || (prp.morgage !== undefined && prp.morgage === false))
                                                localPlayer.balance -= payment_ammount;
                                            engineRef.current?.applyAnimation(1);
                                            socket.emit("pay", { balance: payment_ammount, from: socket.id, to: p.id });
                                            engineRef.current?.applyAnimation(1);
                                            socket.emit(
                                                "history",
                                                history(
                                                    `${clients.get(socket.id)?.username ?? "unknown user"} pay ${payment_ammount} to ${
                                                        clients.get(p.id)?.username ?? "unknown user"
                                                    }`
                                                )
                                            );
                                        }
                                    }
                                }
                            } else if (b === "nothing") {
                                if ((proprety?.id ?? "") == "gotojail") {
                                    const generatorResults = playerMove(10, xplayer, false, () => {
                                        xplayer.position = 10;
                                        xplayer.isInJail = true;
                                        xplayer.jailTurnsRemaining = 3;
                                    });

                                    time_till_free = generatorResults.time;
                                    generatorResults.func();
                                }

                                if (proprety?.id === "incometax") {
                                    localPlayer.balance -= 200;
                                    if (settings !== undefined && (settings as any).notifications === true)
                                        notifyRef.current?.message(`${200} of money is deducted from the account`, "info", 2, () => {}, false);
                                    playMoneyMinusSfx(settings);
                                    engineRef.current?.applyAnimation(1);
                                    socket.emit("history", history(`${clients.get(socket.id)?.username ?? "unknown player"} payed income taxes`));
                                }
                                if (proprety?.id === "luxerytax") {
                                    localPlayer.balance -= 100;
                                    if (settings !== undefined && (settings as any).notifications === true)
                                        notifyRef.current?.message(`${100} of money is deducted from the account`, "info", 2, () => {}, false);
                                    playMoneyMinusSfx(settings);
                                    engineRef.current?.applyAnimation(1);
                                    socket.emit("history", history(`${clients.get(socket.id)?.username ?? "unknown player"} payed luxery taxes`));
                                }
                            } else if (b === "special_action") {
                                if (settings !== undefined && (settings as any).notifications === true)
                                    notifyRef.current?.message(
                                        `${(proprety?.price ?? 0) * 1} of money is deducted from the account`,
                                        "info",
                                        2,
                                        () => {},
                                        false
                                    );
                                playPurchaseSfx(settings);
                                localPlayer.balance -= (proprety?.price ?? 0) * 1;
                                engineRef.current?.applyAnimation(1);

                                const _info = info as { rolls: number };
                                const prp = propertyByPosition.get(localPlayer.position);
                                const calculateRent = _info.rolls;
                                localPlayer.properties.push({
                                    posistion: localPlayer.position,
                                    count: 0,
                                    rent: calculateRent,
                                    group: prp?.group ?? "",
                                });

                                socket.emit(
                                    "history",
                                    history(
                                        `${clients.get(socket.id)?.username ?? "unknown player"} bought ${
                                            prp?.name ?? "unkown place"
                                        } with rent of ${calculateRent}`
                                    )
                                );
                            }

                            setTimeout(() => {
                                setClients(new Map(clients.set(socket.id, localPlayer)));
                                engineRef.current?.freeDice();
                                const json = (clients.get(socket.id) as any as { toJson: () => PlayerJSON }).toJson();
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
            setClients(new Map(clients.set(args.turnId, xplayer)));
        }, 1500);
    } else {
        setTimeout(() => {
            dice_generatorResults.func();
        }, 2000);
    }
}
