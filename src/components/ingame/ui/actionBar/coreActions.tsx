import RollIcon from "../../../../../public/roll.png";

export function CoreActions() {
    return (
        <>
            <button data-button-type="roll" aria-disabled={false}>
                <p>ROLL THE</p>
                <img
                    style={{ marginLeft: 10 }}
                    src={RollIcon.replace("public/", "")}
                />
            </button>

            <button
                data-button-type="pay"
                data-tooltip-hover="pay"
                aria-disabled={true}
            >
                <img src="pay1.png" />
            </button>

            <button
                data-button-type="card"
                data-tooltip-hover="card"
                aria-disabled={true}
            >
                <img src="golden-card.png" />
            </button>
        </>
    );
}
