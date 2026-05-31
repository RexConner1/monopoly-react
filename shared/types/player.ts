import { Player } from "../../src/assets/player";
import { GameContext } from "../game/context/gameContext";

export type PlayerJSON = {
    id: string;
    username: string;
    icon: number;
    position: number;
    balance: number;
    properties: Array<any>;
    isInJail: boolean;
    jailTurnsRemaining: number;
    getoutCards: number;
};

export type MovePlayerFn<TContext extends GameContext = GameContext> = (args: {
    finalPosition: number;
    player: Player;
    ctx: TContext;
    get200whengo?: boolean;
    afterFinished?: () => void;
    adding?: boolean;
}) => {
    start: () => void;
    time: number;
};
