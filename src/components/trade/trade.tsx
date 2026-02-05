import { Player } from "../../assets/player";

export function TradePlayerList({
    players,
    currentPlayerId,
    myTurn,
    onSelect,
}: {
    players: Player[];
    currentPlayerId: string;
    myTurn: boolean;
    onSelect: (playerId: string) => void;
}) {
    const targets = players.filter(p => p.id !== currentPlayerId);

    return (
        <>
            {targets.map(player => (
                <button
                    key={player.id}
                    style={{
                        animation: "tradepopout .3s cubic-bezier(0.21, 1.57, 0.55, 1)",
                    }}
                    data-selectable={myTurn}
                    onClick={() => myTurn && onSelect(player.id)}
                >
                    {player.username}
                </button>
            ))}
        </>
    );
}

export function CancelTradeButton({
    myTurn,
    socket,
    onCancelLocal,
}: {
    myTurn: boolean;
    socket: any;
    onCancelLocal: () => void;
}) {
    const handleClick = () => {
        if (!myTurn) return;
        socket.emit("cancel-trade");
        onCancelLocal();
    };

    return (
        <button
            data-selectable={myTurn}
            disabled={!myTurn}
            onClick={handleClick}
        >
            CANCEL TRADE
        </button>
    );
}
