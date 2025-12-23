import { TurnTimer } from "./turnTimer";
import { CoreActions } from "./coreActions";
import { TradeAction } from "./tradeAction";

export function ActionBar({
    myTurn,
    sended,
    selectedMode,
    timer,
    onTrade
}: any) {
    const isVisible = myTurn && !sended;

    return (
        <div
            className="action-bar"
            style={isVisible ? {} : { translate: "-50% 20vh" }}
        >
            <TurnTimer
                turnTimer={selectedMode.turnTimer}
                timer={timer}
            />

            <CoreActions />

            <TradeAction
                allowDeals={selectedMode.AllowDeals}
                onTrade={onTrade}
            />
        </div>
    );
}
