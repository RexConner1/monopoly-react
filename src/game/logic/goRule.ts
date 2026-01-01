import { Player } from "../../assets/player";

export function applyGoRule(
    player: Player,
    passedGo: boolean,
    enabled: boolean,
    onAward?: () => void
) {
    if (!enabled || !passedGo) return;

    player.balance += 200;
    onAward?.();
}
