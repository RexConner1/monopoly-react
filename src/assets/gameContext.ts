import { MonopolyGameRef } from "../components/game";
import { NotificatorRef } from "../components/notificator";
import { Player } from "./player";
import { Socket } from "./sockets";
import { MonopolySettings } from "./types";

export interface GameContext {
    settings?: MonopolySettings;

    socket: Socket;

    engineRef: React.RefObject<MonopolyGameRef>;
    notifyRef: React.RefObject<NotificatorRef>;

    clients: Map<string, Player>;
}
