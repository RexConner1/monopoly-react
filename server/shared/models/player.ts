import type { PlayerJSON } from "../types/player";

export class Player {
    public id: string;
    public username: string;
    public icon: number;
    public position: number;
    public balance: number;
    public properties: Array<any>;
    public isInJail: boolean;
    public jailTurnsRemaining: number;
    public getoutCards: number;

    constructor(
        _id: string,
        _name: string,
        _icon: number,
        cash: number = 1500
    ) {
        this.id = _id;
        this.username = _name;
        this.icon = _icon;
        this.position = 0;
        this.balance = cash;
        this.properties = [];
        this.isInJail = false;
        this.jailTurnsRemaining = 0;
        this.getoutCards = 0;
    }

    to_json(): PlayerJSON {
        return {
            id: this.id,
            username: this.username,
            icon: this.icon,
            position: this.position,
            balance: this.balance,
            properties: this.properties,
            isInJail: this.isInJail,
            jailTurnsRemaining: this.jailTurnsRemaining,
            getoutCards: this.getoutCards,
        };
    }

    from_json(json: PlayerJSON) {
        if (this.id !== json.id) return;

        this.position = json.position;
        this.balance = json.balance;
        this.properties = json.properties;
        this.isInJail = json.isInJail;
        this.jailTurnsRemaining = json.jailTurnsRemaining;
        this.getoutCards = json.getoutCards;
    }
}
