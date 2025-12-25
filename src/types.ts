import { Player } from "./assets/player.ts";

/**
 * Centralized UI + Game Context
 * Passed into socket handlers and rules
 */
export type GameContext = {
    socket: any;

    clients: Map<string, Player>;
    SetClients: (clients: Map<string, Player>) => void;

    SetCurrent: (id: string) => void;

    settings?: {
        audio?: [number, number, number];
    };

    monopolyJSON: any;

    notifyRef: React.MutableRefObject<any>;
    engineRef: React.MutableRefObject<any>;
    navRef: React.MutableRefObject<any>;

    mainTheme: HTMLAudioElement;

    destroyPlayer: (playerId: string) => void;
};
