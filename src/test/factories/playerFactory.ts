import { Player } from "../../assets/player";
import { PlayerProperty } from "../../assets/types";

type MakePlayerArgs = {
    id?: string;
    username?: string;
    icon?: number;
    position?: number;
    balance?: number;
    properties?: PlayerProperty[];
    isInJail?: boolean;
    jailTurnsRemaining?: number;
    getoutCards?: number;
    ready?: boolean;
    positions?: { x: number; y: number };
};

export function makePlayer({
    id = "p1",
    username = "Player 1",
    icon = 0,
    position = 0,
    balance = 1500,
    properties = [],
    isInJail = false,
    jailTurnsRemaining = 0,
    getoutCards = 0,
    ready = false,
    positions = { x: 0, y: 0 },
}: MakePlayerArgs = {}) {
    const player = new Player(id, username);

    player.icon = icon;
    player.position = position;
    player.balance = balance;
    player.properties = properties;
    player.isInJail = isInJail;
    player.jailTurnsRemaining = jailTurnsRemaining;
    player.getoutCards = getoutCards;
    player.ready = ready;
    player.positions = positions;

    return player;
}
