export function TurnTimer({
    turnTimer,
    timer
}: {
    turnTimer?: number;
    timer: number;
}) {
    if (!turnTimer || turnTimer <= 0) return null;

    return (
        <>
            <p
                style={{
                    display: "inline-block",
                    opacity: 1,
                    color: "rgb(0, 114, 187)",
                    marginRight: 5
                }}
            >
                {turnTimer - timer}
            </p>
            <hr style={{ display: "inline", opacity: 0.5 }} />
        </>
    );
}
