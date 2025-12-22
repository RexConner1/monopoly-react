import { Socket } from "../../../assets/sockets.ts";
import { GameTrading } from "../../../assets/types";
import { Player } from "../../../assets/player.ts";
import { translateGroup } from "../streetCard";
import HouseIcon from "../../../../public/h.png";
import HotelIcon from "../../../../public/ho.png";


interface Props {
    label: string;
    playerId: string;
    tradePlayer: GameTrading["turnPlayer"] | GameTrading["againstPlayer"];
    allPlayers: Player[];
    socket: Socket;
    tradeObj: GameTrading;
    role: "turnPlayer" | "againstPlayer";
    propretyMap: Map<number, any>;
}

export default function TradePlayerPanel({
    label,
    playerId,
    tradePlayer,
    allPlayers,
    socket,
    tradeObj,
    role,
    propretyMap
}: Props) {
    const username =
        allPlayers.find(p => p.id === playerId)?.username ?? "";

    const isActionable = socket.id === playerId;

    const removeProperty = (index: number) => {
        if (!isActionable) return;

        const updated = JSON.parse(JSON.stringify(tradeObj)) as GameTrading;
        updated[role].prop.splice(index, 1);
        socket.emit("trade-update", updated);
    };

    return (
        <div className="player">
            <h5>
                {label}
                <h2>{username}</h2>
            </h5>

            <table>
                <tbody>
                    <tr>
                        <td>Balance</td>
                        <td>{tradePlayer.balance} M</td>
                    </tr>

                    {tradePlayer.prop.length > 0 && (
                        <tr>
                            <td>Properties</td>
                            <td>
                                {tradePlayer.prop.map((v, i) => (
                                    <div
                                        key={i}
                                        className="proprety-nav"
                                        data-actionable={isActionable}
                                        onClick={() => removeProperty(i)}
                                    >
                                        <i
                                            className="box"
                                            style={{
                                                backgroundColor: translateGroup(v.group),
                                            }}
                                        />

                                        <h3
                                            style={
                                                v.morgage === true
                                                    ? { textDecoration: "line-through white" }
                                                    : {}
                                            }
                                        >
                                            {propretyMap.get(v.posistion)?.name ?? ""}
                                        </h3>

                                        <div>
                                            {v.count === "h" ? (
                                                <img
                                                    src={HotelIcon.replace("public/", "")}
                                                    alt="Hotel"
                                                />
                                            ) : typeof v.count === "number" && v.count > 0 ? (
                                                <>
                                                    <p>{v.count}</p>
                                                    <img
                                                        src={HouseIcon.replace("public/", "")}
                                                        alt="House"
                                                    />
                                                </>
                                            ) : null}
                                        </div>
                                    </div>
                                ))}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}