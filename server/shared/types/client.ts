import { Socket } from "../../../src/assets/sockets";
import { Player } from "../models/player";

export interface Client {
    player: Player;
    socket: Socket;
    ready: boolean;
    positions: { x: number; y: number };
}
