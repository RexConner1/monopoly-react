import { GameContext } from "../../../assets/gameContext";
import { history } from "../../../assets/types";

export function rollDice(ctx: GameContext): [number, number] {
    const roll: [number, number] = [
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1
    ];

    const username = ctx.clients.get(ctx.socket.id)?.username ?? "unknown player";

    ctx.socket.emit(
        "history",
        history(`${username} rolled [${roll[0]}, ${roll[1]}]`)
    );

    return roll;
}
