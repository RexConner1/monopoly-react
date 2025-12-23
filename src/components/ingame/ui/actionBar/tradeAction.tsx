export function TradeAction({
    allowDeals,
    onTrade
}: {
    allowDeals: boolean;
    onTrade: () => void;
}) {
    if (!allowDeals) return null;

    return (
        <button
            data-button-type="trade"
            data-tooltip-hover="trade"
            aria-disabled={false}
            onClick={onTrade}
        >
            <img src="morgage.png" />
        </button>
    );
}
