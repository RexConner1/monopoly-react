import { Player } from "../../assets/player";
import { Socket } from "../../assets/sockets";
import { MonopolySettings } from "../../assets/types";
import { calculateMoves } from "./calculateMoves";
import { calculateMoveTime } from "./moveTiming";
import { animatePlayerSteps } from "./stepAnimator";

export function playerMoveGenerator(
    finalPosition: number,
    player: Player,
    context: {
        settings: MonopolySettings | undefined;
        socket: Socket;
        notifyRef: any;
        engineRef: any;
        updateClients: () => void;
    },
    get200whengo = true,
    afterFinished?: () => void,
    adding = true
) {
    const moves = calculateMoves(player.position, finalPosition, adding);
    const time = calculateMoveTime(moves);

    return {
        time,
        func: () =>
            animatePlayerSteps(player, {
                moves,
                adding,
                target: finalPosition,
                get200whengo,
                ...context,
                onFinish: afterFinished
            })
    };
}
