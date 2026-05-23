import { GameContext } from "../../shared/game/context/gameContext";
import { MonopolyGameRef } from "../components/ingame/game";
import { NotificatorRef } from "../components/notificator";
import { Player } from "./player";

export interface ReactGameContext extends GameContext {
    engineRef: React.RefObject<MonopolyGameRef>;
    notifyRef: React.RefObject<NotificatorRef>;

    SetClients: React.Dispatch<
        React.SetStateAction<Map<string, Player>>
    >;
}
