export function moveSteps<TPlayer extends { position: number; balance: number }>({
    player,
    finalPosition,
    adding = true,
    get200whengo = true,
    onStep,
    onPassGo,
    onFinish,
}: {
    player: TPlayer;
    finalPosition: number;
    adding?: boolean;
    get200whengo?: boolean;
    onStep?: () => void;
    onPassGo?: () => void;
    onFinish?: () => void;
}) {
    const { steps, time } = computeMovePlan({
        currentPosition: player.position,
        finalPosition,
        adding,
    });

    let i = 0;
    let addedMoney = false;
    const firstPosition = player.position;

    const step = () => {
        if (i >= steps) return;

        i += 1;
        
        const delta = adding ? 1 : -1;
        player.position = (player.position + delta + 40) % 40;

        onStep?.();

        if (player.position === 0 && get200whengo) {
            onPassGo?.();
            addedMoney = true;
        }

        if (i === steps) {
            player.position = finalPosition;

            if (!addedMoney && firstPosition > finalPosition && get200whengo) {
                onPassGo?.();
            }

            onFinish?.();
            return;
        }

        setTimeout(step, 0.35 * 1000);
    };

    return {
        start: step,
        time,
    };
}

function computeMovePlan({
    currentPosition,
    finalPosition,
    adding = true,
}: {
    currentPosition: number;
    finalPosition: number;
    adding?: boolean;
}) {
    let steps = (finalPosition - currentPosition) % 40;

    if ((finalPosition < currentPosition || steps < 0) && adding) {
        steps = 40 - currentPosition + finalPosition;
    }

    if (!adding) {
        steps = currentPosition - finalPosition;
        if (steps < 0) steps += 40;
    }

    const time = 0.35 * 1000 * steps;

    return { steps, time };
}
