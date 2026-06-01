import { Player } from "../../assets/player";
import { ChanceCommunityChestCard } from "../../assets/card";

import { moveToTile } from "../actions/moveToTile";
import { moveBySpaces } from "../actions/moveBySpaces";
// import { movePlayer } from "../actions/movePlayer";

import { addFunds } from "../../../shared/game/actions/addFunds";
import { removeFunds } from "../../../shared/game/actions/removeFunds";
import { goToJail } from "../../../shared/game/actions/goToJail";

import { addBalanceToOtherPlayers } from "../actions/addBalanceToOtherPlayers";
import { applyPropertyCharges } from "../actions/applyPropertyCharges";

import { findNextGroupPosition } from "../logic/board/findNextGroupPosition";
import { handleChanceNearestLanding } from "./handleChanceNearestLanding";
import { properties } from "../../../shared/types/property";
import { MovePlayerFn } from "../../../shared/types/player";
import { GameContext } from "../../../shared/game/context/gameContext";

export function handleCardAction<TContext extends GameContext>({
    card,
    player,
    rolls,
    ctx,
    movePlayer,
}: {
    card: ChanceCommunityChestCard;
    player: Player;
    rolls: number;
    ctx: TContext;
    movePlayer: MovePlayerFn<TContext>;
}) {
    const { clients, SetClients, socket, engineRef } = ctx;

    let time_till_finish = 0;

    switch (card.action) {
        case "move":
            if (card.tileid) {
                time_till_finish = moveToTile({
                    tileId: card.tileid,
                    player,
                    ctx,
                    movePlayer
                });
            } else if (card.count) {
                time_till_finish = moveBySpaces({
                    spaces: card.count,
                    player,
                    ctx,
                    movePlayer,
                    get200whengo: true,
                    afterFinished: () => {},
                });
            }
            break;

        case "addfunds":
            addFunds({
                player,
                amount: card.amount ?? 0,
                ctx,
            });
            break;

        case "jail":
            if (card.subaction) {
                if (card.subaction === "getout") {
                    player.getoutCards += 1;
                } else if (card.subaction === "goto") {
                    goToJail({ player, ctx });
                }

                const updated = new Map(clients);
                updated.set(player.id, player);
                SetClients(updated);
            }
            break;

        case "removefunds":
            removeFunds({
                player,
                amount: card.amount ?? 0,
                ctx,
            });
            break;

        case "removefundstoplayers":
            addBalanceToOtherPlayers({
                player,
                amount: card.amount ?? 0,
                ctx,
            });

            if (player.id === socket.id) {
                engineRef.current?.applyAnimation?.(1);
            }
            break;

        case "addfundsfromplayers":
            addBalanceToOtherPlayers({
                player,
                amount: -(card.amount ?? 0),
                ctx,
            });
            break;

        case "movenearest": {
            const ongoingLocation = findNextGroupPosition({
                properties: properties,
                groupId: card.groupid,
                currentPosition: player.position,
            });

            if (ongoingLocation === null) return;

            const result = movePlayer({
                finalPosition: ongoingLocation,
                player,
                ctx,
            });

            time_till_finish = -1;
            result.start();

            setTimeout(() => {
                handleChanceNearestLanding({
                    player,
                    rolls,
                    card,
                    ctx,
                });
            }, result.time);

            break;
        }

        case "propertycharges":
            applyPropertyCharges({
                player,
                buildingsCost: card.buildings ?? 1,
                hotelsCost: card.hotels ?? 1,
                ctx,
            });
            break;
    }

    if (time_till_finish >= 0) {
        setTimeout(() => {
            const updated = new Map(clients);
            updated.set(player.id, player);
            SetClients(updated);

            if (player.id === socket.id) {
                engineRef.current?.freeDice?.();
                socket.emit("finish-turn", player.toJson());
            }
        }, time_till_finish);
    }
}
