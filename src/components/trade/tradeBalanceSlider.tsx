import { Socket } from "../../assets/sockets.ts";
import { GameTrading } from "../../assets/types";
import { Player } from "../../assets/player.ts";
import Slider from "../utils/slider.tsx";

interface Props {
    socket: Socket;
    tradeObj: GameTrading;
    players: Player[];
}

export default function TradeBalanceSlider(prop: Props) {
    return (
        <Slider
            max={
                prop.socket.id === prop.tradeObj.againstPlayer.id
                    ? prop.players.filter(
                          (v) => v.id === prop.tradeObj.againstPlayer.id
                      )[0].balance
                    : prop.players.filter(
                          (v) => v.id === prop.tradeObj.turnPlayer.id
                      )[0].balance
            }
            min={0}
            step={25}
            onChange={(e) => {
                const v = parseInt(e.currentTarget.value);
                const b = JSON.parse(
                    JSON.stringify(prop.tradeObj)
                ) as GameTrading;

                if (prop.socket.id === prop.tradeObj.againstPlayer.id) {
                    b.againstPlayer.balance = v;
                } else {
                    b.turnPlayer.balance = v;
                }

                prop.socket.emit("trade-update", b);
            }}
            suffix=" M"
        />
    );
}
