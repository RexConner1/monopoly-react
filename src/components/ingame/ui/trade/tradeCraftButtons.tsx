import { Socket } from "../../../../assets/sockets.ts";
import { GameTrading } from "../../../../assets/types";

interface Props {
    myTurn: boolean;
    tradeObj: GameTrading;
    socket: Socket;
    setSended: (v: boolean) => void;
}

export default function TradeCraftButtons(prop: Props) {
    if (prop.myTurn) {
        return (
            <center>
                <div className="trade-craft-buttons">
                    <button
                        data-selectable={prop.myTurn}
                        onClick={() => {
                            if (prop.myTurn) {
                                prop.socket.emit("cancel-trade");
                                prop.setSended(false);
                            }
                        }}
                    >
                        CANCEL
                    </button>

                    <button
                        data-selectable={prop.myTurn}
                        onClick={() => {
                            if (prop.myTurn) {
                                prop.socket.emit("trade");
                            }
                        }}
                    >
                        BACK
                    </button>

                    <button
                        data-selectable={prop.myTurn}
                        onClick={() => {
                            if (prop.myTurn) {
                                prop.socket.emit(
                                    "submit-trade",
                                    prop.tradeObj
                                );
                                prop.setSended(false);
                            }
                        }}
                    >
                        SUBMIT
                    </button>
                </div>
            </center>
        );
    }

    if (prop.tradeObj.againstPlayer.id === prop.socket.id) {
        return (
            <center>
                <div className="trade-craft-buttons">
                    <button
                        data-selectable={prop.myTurn}
                        onClick={() => {
                            prop.socket.emit("trade");
                        }}
                    >
                        CANCEL
                    </button>
                </div>
            </center>
        );
    }

    return <></>;
}