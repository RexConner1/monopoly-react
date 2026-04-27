import type { MonopolyMode } from "../../../assets/types";
import type { Socket } from "../../../assets/sockets";

type CustomModeButtonProps = {
    selectedMode: MonopolyMode;
    server: unknown;
    socket: Socket;
};

export function CustomModeButton({ selectedMode, server, socket }: CustomModeButtonProps) {
    const isSelected = selectedMode.Name === "Custom Mode";
    const isDisabled = server === undefined;

    const handleClick = () => {
        if (isDisabled) return;

        // const winstateChoice = window.prompt("Winning State\n1=last-standing\n2=monopols\n3=monopols & trains", "3");
        const allowTrade = window.confirm("Allow Trades");
        const allowMortgage = window.confirm("Allow Mortgage");
        const startingCash = window.prompt("Starting Cash", "1500");
        const turnTimer = window.prompt("Turn Timer", "0");

        const mode: MonopolyMode = {
            AllowDeals: allowTrade,
            WinningMode: "last-standing", // winstateChoice === "2" ? "monopols" : winstateChoice === "3" ? "monopols & trains" : "last-standing",
            Name: "Custom Mode",
            mortageAllowed: allowMortgage,
            startingCash: startingCash === null ? 1500 : parseInt(startingCash) || 1500,
            turnTimer: turnTimer === null ? undefined : parseInt(turnTimer) || undefined,
        };

        socket.emit("ready", {
            mode,
        });
    };

    return (
        <p
            data-select={isSelected}
            data-disabled={isDisabled}
            onClick={handleClick}
        >
            Custom Mode
        </p>
    );
}
