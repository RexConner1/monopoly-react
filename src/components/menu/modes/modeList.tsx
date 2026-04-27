import type { MonopolyMode } from "../../../assets/types";
import type { Socket } from "../../../assets/sockets";
import { ModeOption } from "./modeOption";

type ModeListProps = {
    modes: MonopolyMode[];
    selectedMode: MonopolyMode;
    server: unknown;
    socket: Socket;
};

export function ModeList({ modes, selectedMode, server, socket }: ModeListProps) {
    return (
        <>
            {modes.map((mode, index) => (
                <ModeOption
                    key={index}
                    mode={mode}
                    selectedMode={selectedMode}
                    server={server}
                    socket={socket}
                />
            ))}
        </>
    );
}
