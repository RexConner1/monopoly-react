import type { MonopolyMode } from "../../assets/types";
import type { Socket } from "../../assets/sockets";
import RollIcon from "../../../public/roll.png";

type ActionBarProps = {
    myTurn: boolean;
    sended: boolean;
    timer: number;
    selectedMode: MonopolyMode;
    socket: Socket;
    setSended: (value: boolean) => void;
};

export function ActionBar({
    myTurn,
    sended,
    timer,
    selectedMode,
    socket,
    setSended,
}: ActionBarProps) {
    const isActive = myTurn && !sended;

    const remainingTime =
        selectedMode.turnTimer !== undefined && selectedMode.turnTimer > 0
            ? selectedMode.turnTimer - timer
            : null;

    const handleTradeClick = () => {
        setSended(true);
        socket.emit("trade");
    };

    return (
        <div
            className="action-bar"
            style={isActive ? {} : { translate: "-50% 20vh" }}
        >
            <TurnTimer remainingTime={remainingTime} />

            <button data-button-type="roll" aria-disabled={false}>
                <p>ROLL THE </p>
                <img
                    style={{ marginLeft: 10 }}
                    src={RollIcon.replace("public/", "")}
                    alt=""
                />
            </button>

            <button data-button-type="build" data-tooltip-hover="build" aria-disabled={true}>
                <img src="build.png" alt="" />
            </button>

            <button data-button-type="pay" data-tooltip-hover="pay" aria-disabled={true}>
                <img src="pay1.png" alt="" />
            </button>

            <button data-button-type="card" data-tooltip-hover="card" aria-disabled={true}>
                <img src="golden-card.png" alt="" />
            </button>

            {selectedMode.AllowDeals && (
                <button
                    data-button-type="trade"
                    data-tooltip-hover="trade"
                    aria-disabled={false}
                    onClick={handleTradeClick}
                >
                    <img src="morgage.png" alt="" />
                </button>
            )}
        </div>
    );
}

function TurnTimer({ remainingTime }: { remainingTime: number | null }) {
    if (remainingTime === null) return null;

    return (
        <>
            <p
                style={{
                    display: "inline-block",
                    opacity: 1,
                    color: "rgb(0, 114, 187)",
                    marginRight: 5,
                }}
            >
                {remainingTime}
            </p>
            <hr style={{ display: "inline", opacity: 0.5 }} />
        </>
    );
}
