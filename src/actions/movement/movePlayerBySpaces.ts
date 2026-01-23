import { Player } from "../../assets/player";
import { GameContext } from "../../assets/gameContext";
import { movePlayer } from "../../game/movement/movePlayer";

const BOARD_SIZE = 40;

export function movePlayerBySpaces(
    spaces: number,
    player: Player,
    ctx: GameContext
): number {
    const newPosition =
        (player.position + spaces + BOARD_SIZE) % BOARD_SIZE;

    const result = movePlayer(
        newPosition,
        player,
        ctx,
        true,
        () => {},
        spaces >= 0
    );

    result.func();

    return result.time;
}