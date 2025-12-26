import { Socket } from "../../assets/sockets.ts";
import { Player } from "../../assets/player.ts";

interface Props {
    players: Player[];
    socket: Socket;
    myTurn: boolean;
    tradeApi: {
        onSelectPlayer: (pId: string) => void;
    };
    setSended: (v: boolean) => void;
}

export default function TradeOpponentSelect(prop: Props) {
    return (
        <>
            <h2>Select your opponent</h2>

            <center>
                <div className="select-players">
                    {prop.players
                        .filter((v) => v.id !== prop.socket.id)
                        .map((v, i) => (
                            <button
                                key={i}
                                style={{
                                    animation:
                                        "tradepopout .3s cubic-bezier(0.21, 1.57, 0.55, 1)",
                                }}
                                data-selectable={prop.myTurn}
                                onClick={() => {
                                    if (prop.myTurn) {
                                        prop.tradeApi.onSelectPlayer(v.id);
                                    }
                                }}
                            >
                                {v.username}
                            </button>
                        ))}

                    <button
                        data-selectable={prop.myTurn}
                        onClick={() => {
                            if (prop.myTurn) {
                                prop.socket.emit("cancel-trade");
                                prop.setSended(false);
                            }
                        }}
                    >
                        CANCEL TRADE
                    </button>
                </div>
            </center>
        </>
    );
}