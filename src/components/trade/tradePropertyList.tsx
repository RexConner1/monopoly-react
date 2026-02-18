import { Player } from "../../assets/player";
import { Socket } from "../../assets/sockets";
import { GameTrading, PlayerProperty } from "../../assets/types";
import HouseIcon from "../../../public/h.png";
import HotelIcon from "../../../public/ho.png";
import { translateGroup } from "../ingame/streetCard";
import { getPropertyByPosition } from "../../assets/property";

type TradeSide = "againstPlayer" | "turnPlayer";

export function TradePropertyList({ 
    players, 
    trade, 
    socket, 
    side 
}: {
    players: Player[];
    trade: GameTrading;
    socket: Socket;
    side: TradeSide;
}) {
    const properties = getTradeEligibleProperties(players, trade, side);

    return (
        <PropertyList
            properties={properties}
            trade={trade}
            socket={socket}
            side={side}
        />
    );
}

function PropertyList({
    properties,
    trade,
    socket,
    side,
}: {
    properties: PlayerProperty[];
    trade: GameTrading;
    socket: Socket;
    side: TradeSide;
}) {
    return (
        <>
            {properties.map((property, i) => (
                <PropertyNavItem
                    key={property.posistion ?? i}
                    property={property}
                    trade={trade}
                    socket={socket}
                    side={side}
                />
            ))}
        </>
    );
}

function PropertyNavItem({
    property,
    trade,
    socket,
    side,
}: {
    property: PlayerProperty;
    trade: GameTrading;
    socket: Socket;
    side: TradeSide;
}) {
    const handleClick = () => {
        const updated = JSON.parse(JSON.stringify(trade)) as GameTrading;
        updated[side].prop.push(property);
        socket.emit("trade-update", updated);
    };

    return (
        <div className="proprety-nav" onClick={handleClick}>
            <PropertyColorBox group={property.group} />
            <PropertyTitle property={property} />
            <PropertyCountIndicator property={property} />
        </div>
    );
}

function PropertyColorBox({ group }: { group: string }) {
    return (
        <i
            className="box"
            style={{ backgroundColor: translateGroup(group) }}
        />
    );
}

function PropertyTitle({ property }: { property: PlayerProperty }) {
    const style =
        property.morgage === true
            ? { textDecoration: "line-through white" }
            : {};

    return (
        <h3 style={style}>
            {getPropertyByPosition(property.posistion)?.name ?? ""}
        </h3>
    );
}

function PropertyCountIndicator({ property }: { property: PlayerProperty }) {
    if (property.count === "h") {
        return <img src={HotelIcon.replace("public/", "")} alt="" />;
    }

    if (typeof property.count === "number" && property.count > 0) {
        return (
            <>
                <p>{property.count}</p>
                <img src={HouseIcon.replace("public/", "")} alt="" />
            </>
        );
    }

    return null;
}

function getTradeEligibleProperties(
    players: Player[],
    trade: GameTrading,
    side: TradeSide
): PlayerProperty[] {
    const playerId = trade[side].id;
    const excludedPositions = trade[side].prop.map(p => p.posistion);
    const player = players.find(p => p.id === playerId);
    if (!player) return [];

    return player.properties.filter(
        p =>
            !excludedPositions.includes(p.posistion) &&
            (p.morgage === undefined || p.morgage === false)
    );
}
