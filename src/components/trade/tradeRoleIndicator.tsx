import { Socket } from "../../assets/sockets.ts";
import { GameTrading } from "../../assets/types";

interface Props {
    socket: Socket;
    tradeObj: GameTrading;
}

export default function TradeRoleIndicator(prop: Props) {
    return (
        <p>
            {prop.socket.id === prop.tradeObj.againstPlayer.id
                ? "You are the Opponent"
                : "You are the Current Player"}
        </p>
    );
}