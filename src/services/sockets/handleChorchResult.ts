// src/pages/Home/monopoly/sockets/handleChorchResult.ts
import type { Player } from "../../assets/player.ts";
import type { MonopolySettings, historyAction } from "../../assets/types.ts";
import { history } from "../../assets/types.ts";
import type React from "react";

export type ChorchResultArgs = any;

export type PlayerMoveGenerator = (
    finalPos: number,
    player: Player,
    get200whenGo?: boolean,
    afterFinished?: () => void,
    adding?: boolean
) => { func: () => void; time: number };

export type HandleChorchDeps = {
    clients: Map<string, Player>;
    socket: any;
    settings?: MonopolySettings;
    monopolyJSON: any;
    propertyByPosition: Map<number, any>;
    setClients: (m: Map<string, Player>) => void;
    setHistories: (fn: (old: Array<historyAction>) => Array<historyAction>) => void;
    engineRef: React.MutableRefObject<any>;
    notifyRef: React.MutableRefObject<any>;
    playerMove: PlayerMoveGenerator;
};

/**
 * Handles the server "chorch_result" (chance/community chest) event.
 *
 * This is a direct extraction from the original `monopoly.tsx`.
 */
export function handleChorchResult(args: ChorchResultArgs, deps: HandleChorchDeps) {
    const {
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
    } = deps;

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
                    socket.emit("payall", { from: xplayer.id, amount: amnout });
                    for (const x of other_players) {
                        x.balance += amnout;
                    }
                } else {
                    // recieve money
                    socket.emit(
                        "history",
                        history(
                            `${xplayer.username ?? "unknown user"} recieved ${amnout} money from [${other_players
                                .map((v) => v.username)
                                .join(", ")}]`
                        )
                    );
                    socket.emit("payall", { to: xplayer.id, amount: -amnout });
                    for (const x of other_players) {
                        x.balance -= -amnout;
                    }
                }

                SetClients(new Map(clients.set(xplayer.id, xplayer)));
                SetClients(new Map(clients));
            } else {
            }
        }
        if (c.action === "go-to") {
            const selected_Tile = monopolyJSON.properties.find((v: any) => v.id === c.tileid);
            if (selected_Tile === undefined) return;
            const generatorResults = playerMoveGENERATOR(selected_Tile.posistion, xplayer, true);
            generatorResults.func();
        } else if (c.action === "go-to-nearest-group") {
            if (c.groupid === undefined) return;
            const properties = monopolyJSON.properties.filter((v: any) => v.group === c.groupid);
            const currentPos = xplayer.position;

            const sortedProperties = properties.sort((a: any, b: any) => a.posistion - b.posistion);
            let found = properties.find((p:any) => p.posistion > currentPos) ?? properties[0];

            // If no property is found, wrap around to the first property on the board
            if (!found) {
                found = sortedProperties[0];
            }

            // create generator results and check it if it is buying stage
            const generatorResults = playerMoveGENERATOR(found.posistion, xplayer, true, () => {
                if (xplayer.id === socket.id) {
                    // allow buy stage
                    // calculate rent
                    const localPlayer = clients.get(socket.id) as Player;
                    let buyStageAllowed = true;
                    for (const x of clients.values()) {
                        for (const p of x.properties) {
                            if (p.posistion === found.posistion) {
                                buyStageAllowed = false;
                                const boardProperty = propretyMap.get(p.posistion);
                                if (!boardProperty?.multpliedrent) return;
                                let payment_ammount = 0;
                                if (p.count === 0) {
                                    payment_ammount = found?.rent ?? 0;
                                } else if (typeof p.count === "number" && p.count > 0) {
                                    payment_ammount = (found?.multpliedrent ?? [0, 0, 0, 0])[p.count - 1] ?? 0;
                                } else if (p.count === "h") {
                                    payment_ammount = (found?.multpliedrent ?? [0, 0, 0, 0, 0])[4] ?? 0;
                                }

                                payment_ammount *= boardProperty.multpliedrent;

                                if (settings !== undefined && settings.notifications === true)
                                    notifyRef.current?.message(`${payment_ammount} of money is deducted from the account`, "info", 2, () => {}, false);

                                // sound effect
                                var audio = new Audio("./moneyminus.mp3");
                                audio.volume = ((settings?.audio[1] ?? 100) / 100) * ((settings?.audio[0] ?? 100) / 100);
                                audio.loop = false;
                                audio.play();
                                localPlayer.balance -= payment_ammount;
                                engineRef.current?.applyAnimation(1);
                                socket.emit("pay", { balance: payment_ammount, from: socket.id, to: x.id });
                                engineRef.current?.applyAnimation(1);
                            }
                        }
                    }

                    if (buyStageAllowed) {
                        // allow
                        engineRef.current?.setStreet({
                            location: found.posistion,
                            rolls: args.rolls,
                            onResponse: (b: string, info: any) => {
                                if (b === "buy") {
                                    if (settings !== undefined && settings.notifications === true)
                                        notifyRef.current?.message(
                                            `${(found?.price ?? 0) * 1} of money is deducted from the account`,
                                            "info",
                                            2,
                                            () => {},
                                            false
                                        );

                                    localPlayer.balance -= (found?.price ?? 0) * 1;
                                    engineRef.current?.applyAnimation(1);
                                    localPlayer.properties.push({
                                        posistion: localPlayer.position,
                                        count: 0,
                                        group: propretyMap.get(localPlayer.position)?.group ?? "",
                                    });
                                    // sound effect
                                    var audio = new Audio("./buying1.mp3");
                                    audio.volume = 0.5 * ((settings?.audio[1] ?? 100) / 100) * ((settings?.audio[0] ?? 100) / 100);
                                    audio.loop = false;
                                    audio.play();
                                } else if (b === "special_action") {
                                    if (settings !== undefined && settings.notifications === true)
                                        notifyRef.current?.message(
                                            `${(found?.price ?? 0) * 1} of money is deducted from the account`,
                                            "info",
                                            2,
                                            () => {},
                                            false
                                        );

                                    // sound effect
                                    var audio = new Audio("./buying1.mp3");
                                    audio.volume = 0.5 * ((settings?.audio[1] ?? 100) / 100) * ((settings?.audio[0] ?? 100) / 100);
                                    audio.loop = false;
                                    audio.play();
                                    localPlayer.balance -= (found?.price ?? 0) * 1;
                                    engineRef.current?.applyAnimation(1);

                                    const _info = info as {
                                        rolls: number;
                                    };
                                    const prp = propretyMap.get(localPlayer.position);
                                    const calculateRent = _info.rolls;
                                    localPlayer.properties.push({
                                        posistion: localPlayer.position,
                                        count: 0,
                                        rent: calculateRent,
                                        group: prp?.group ?? "",
                                    });
                                }
                            },
                        });
                    }
                }
            });
            generatorResults.func();
        } else if (c.action === "pay-amount-to-bank") {
            if (c.amount === undefined) return;
            if (xplayer.id === socket.id) {
                if (settings !== undefined && settings.notifications === true)
                    notifyRef.current?.message(`${c.amount} of money is deducted from the account`, "info", 2, () => {}, false);

                // sound effect
                var audio = new Audio("./moneyminus.mp3");
                audio.volume = ((settings?.audio[1] ?? 100) / 100) * ((settings?.audio[0] ?? 100) / 100);
                audio.loop = false;
                audio.play();
                xplayer.balance -= c.amount;
                engineRef.current?.applyAnimation(1);
                SetClients(new Map(clients.set(xplayer.id, xplayer)));
                socket.emit("history", history(`${xplayer.username ?? "unknown user"} payed ${c.amount} to bank`));
            }
        } else if (c.action === "recieve-amount-from-bank") {
            if (c.amount === undefined) return;
            if (xplayer.id === socket.id) {
                if (settings !== undefined && settings.notifications === true)
                    notifyRef.current?.message(`${c.amount} of money is added to the account`, "info", 2, () => {}, false);

                // sound effect
                var audio = new Audio("./moneyplus.mp3");
                audio.volume = ((settings?.audio[1] ?? 100) / 100) * ((settings?.audio[0] ?? 100) / 100);
                audio.loop = false;
                audio.play();
                xplayer.balance += c.amount;
                engineRef.current?.applyAnimation(2);
                SetClients(new Map(clients.set(xplayer.id, xplayer)));
                socket.emit("history", history(`${xplayer.username ?? "unknown user"} recieved ${c.amount} from bank`));
            }
        } else if (c.action === "pay-amount-to-other-players") {
            if (c.amount === undefined) return;
            if (xplayer.id === socket.id) {
                if (settings !== undefined && settings.notifications === true)
                    notifyRef.current?.message(`${c.amount} of money is deducted from the account`, "info", 2, () => {}, false);

                // sound effect
                var audio = new Audio("./moneyminus.mp3");
                audio.volume = ((settings?.audio[1] ?? 100) / 100) * ((settings?.audio[0] ?? 100) / 100);
                audio.loop = false;
                audio.play();
                xplayer.balance -= c.amount;
                engineRef.current?.applyAnimation(1);
                addBalanceToOthers(c.amount);
                SetClients(new Map(clients.set(xplayer.id, xplayer)));
            }
        } else if (c.action === "recieve-amount-from-other-players") {
            if (c.amount === undefined) return;
            if (xplayer.id === socket.id) {
                if (settings !== undefined && settings.notifications === true)
                    notifyRef.current?.message(`${c.amount} of money is added to the account`, "info", 2, () => {}, false);

                // sound effect
                var audio = new Audio("./moneyplus.mp3");
                audio.volume = ((settings?.audio[1] ?? 100) / 100) * ((settings?.audio[0] ?? 100) / 100);
                audio.loop = false;
                audio.play();
                xplayer.balance += c.amount;
                engineRef.current?.applyAnimation(2);
                addBalanceToOthers(-c.amount);
                SetClients(new Map(clients.set(xplayer.id, xplayer)));
            }
        } else if (c.action === "house-fees") {
            if (c.buildings === undefined || c.hotels === undefined) return;
            if (xplayer.id === socket.id) {
                let buildCount = 0;
                let hotelCount = 0;
                for (const prp of xplayer.properties) {
                    if (prp.count === "h") {
                        hotelCount += 1;
                    } else if (typeof prp.count === "number" && prp.count > 0) {
                        buildCount += prp.count;
                    }
                }
                const amount = c.buildings * buildCount + c.hotels * hotelCount;
                if (settings !== undefined && settings.notifications === true)
                    notifyRef.current?.message(`${amount} of money is deducted from the account`, "info", 2, () => {}, false);

                // sound effect
                var audio = new Audio("./moneyminus.mp3");
                audio.volume = ((settings?.audio[1] ?? 100) / 100) * ((settings?.audio[0] ?? 100) / 100);
                audio.loop = false;
                audio.play();
                xplayer.balance -= amount;
                engineRef.current?.applyAnimation(1);
                SetClients(new Map(clients.set(xplayer.id, xplayer)));
            }
        } else if (c.action === "create-getout-card") {
            if (xplayer.id === socket.id) {
                xplayer.getoutCards += 1;
                SetClients(new Map(clients.set(xplayer.id, xplayer)));
            }
        } else if (c.action === "move-by-amount") {
            if (c.count === undefined) return;
            const currentPos = xplayer.position;
            const newpos = currentPos + c.count;
            const generatorResults = playerMoveGENERATOR(newpos, xplayer, false);
            generatorResults.func();
        }
    }, numOfTime);
}
