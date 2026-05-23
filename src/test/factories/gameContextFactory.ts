import React from "react";
import { vi } from "vitest";
import { ReactGameContext } from "../../assets/reactGameContext";
import { MonopolyGameRef } from "../../components/ingame/game";
import { NotificatorRef } from "../../components/notificator";
import { Socket } from "../../assets/sockets";
import { Player } from "../../assets/player";
import { MonopolySettings } from "../../assets/types";

type MakeGameContextArgs = {
    settings?: MonopolySettings;
    socketId?: string;
    clients?: Map<string, Player>;
};

export function makeGameContext({
    settings = {
        gameEngine: "2d",
        accessibility: [100, 100, false, false, false],
        audio: [100, 100, 100],
        notifications: true,
    },
    socketId = "p1",
    clients = new Map<string, Player>(),
}: MakeGameContextArgs = {}): ReactGameContext & {
    socket: Socket & { emit: ReturnType<typeof vi.fn> };
    SetClients: ReturnType<typeof vi.fn>;
    engineRef: React.RefObject<MonopolyGameRef>;
    notifyRef: React.RefObject<NotificatorRef>;
} {
    const emit = vi.fn();

    const socket = {
        id: socketId,
        emit,
        on: vi.fn(),
        disconnect: vi.fn(),
    } as unknown as Socket & { emit: ReturnType<typeof vi.fn> };

    const engineRef = {
        current: {
            diceResults: vi.fn(),
            freeDice: vi.fn(),
            setStreet: vi.fn(),
            chorch: vi.fn(),
            applyAnimation: vi.fn(),
            showJailsButtons: vi.fn(),
        },
    } as React.RefObject<MonopolyGameRef>;

    const notifyRef = {
        current: {
            message: vi.fn(),
            dialog: vi.fn(),
        },
    } as React.RefObject<NotificatorRef>;

    const SetClients = vi.fn();

    return {
        settings,
        socket,
        engineRef,
        notifyRef,
        clients,
        SetClients,
    };
}
