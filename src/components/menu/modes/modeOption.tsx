import type { MonopolyMode } from "../../../assets/types";
import type { Socket } from "../../../assets/sockets";

type ModeOptionProps = {
    mode: MonopolyMode;
    selectedMode: MonopolyMode;
    server: unknown;
    socket: Socket;
};

export function ModeOption({ mode, selectedMode, server, socket }: ModeOptionProps) {
    const isSelected = JSON.stringify(mode) === JSON.stringify(selectedMode);
    const isDisabled = server === undefined;

    const handleClick = () => {
        if (isDisabled) return;

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
            {mode.Name}
        </p>
    );
}
