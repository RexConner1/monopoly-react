import { Player } from "../../../src/assets/player";
import { Socket } from "../../../src/assets/sockets";
import { MonopolySettings, StreetResponseType } from "../../../src/assets/types";

export interface GameContext {
    settings?: MonopolySettings;

    socket: Socket;

    engineRef: {
        current: {
            diceResults?: (args: { 
                l: [number, number]; 
                time: number; 
                onDone: () => void 
            }) => void;
            setStreet?: (args: {
                location: number;
                rolls: number;
                onResponse: (action: StreetResponseType, info: object) => void;
            }) => unknown;
            applyAnimation?: (type: number) => void;
            freeDice?: () => void;
        } | null;
    };

    notifyRef: {
        current: {
            message?: (...args: any[]) => void;
        } | null;
    };

    clients: Map<string, Player>;
    
    SetClients: (next: Map<string, Player>) => void;
}
