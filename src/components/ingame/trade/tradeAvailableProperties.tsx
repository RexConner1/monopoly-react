import { Socket } from "../../../assets/sockets.ts";
import { GameTrading } from "../../../assets/types";
import { Player } from "../../../assets/player.ts";

interface Props {
    players: Player[];
    tradeObj: GameTrading;
    socket: Socket;
    translateGroup: (g: any) => string;
    propretyMap: Map<number, any>;
    HouseIcon: string;
    HotelIcon: string;
}

export default function TradeAvailableProperties(prop: Props) {
    const isAgainst = prop.socket.id === prop.tradeObj.againstPlayer.id;
    const isTurn = prop.socket.id === prop.tradeObj.turnPlayer.id;

    if (!isAgainst && !isTurn) return <></>;

    const role = isAgainst ? "againstPlayer" : "turnPlayer";

    const player = prop.players.filter(
        (v) => v.id === prop.tradeObj[role].id
    )[0];

    return (
        <>
            {player.properties
                .filter(
                    (v) =>
                        !prop.tradeObj[role].prop
                            .map((v) => JSON.stringify(v))
                            .includes(JSON.stringify(v))
                )
                .filter(
                    (v) =>
                        v.morgage === undefined ||
                        (v.morgage !== undefined && v.morgage === false)
                )
                .map((v, i) => (
                    <div
                        key={i}
                        className="proprety-nav"
                        onClick={() => {
                            const b = JSON.parse(
                                JSON.stringify(prop.tradeObj)
                            ) as GameTrading;
                            b[role].prop.push(v);
                            prop.socket.emit("trade-update", b);
                        }}
                    >
                        <i
                            className="box"
                            style={{
                                backgroundColor: prop.translateGroup(v.group),
                            }}
                        ></i>

                        <h3
                            style={
                                v.morgage !== undefined &&
                                v.morgage === true
                                    ? { textDecoration: "line-through white" }
                                    : {}
                            }
                        >
                            {prop.propretyMap.get(v.posistion)?.name ?? ""}
                        </h3>

                        <div>
                            {v.count == "h" ? (
                                <img
                                    src={prop.HotelIcon.replace(
                                        "public/",
                                        ""
                                    )}
                                    alt=""
                                />
                            ) : typeof v.count === "number" &&
                              v.count > 0 ? (
                                <>
                                    <p>{v.count}</p>
                                    <img
                                        src={prop.HouseIcon.replace(
                                            "public/",
                                            ""
                                        )}
                                        alt=""
                                    />
                                </>
                            ) : (
                                <></>
                            )}
                        </div>
                    </div>
                ))}
        </>
    );
}