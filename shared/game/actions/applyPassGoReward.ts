import { Player } from "../../../src/assets/player";

const PASS_GO_AMOUNT = 200;

export function applyPassGoReward(player: Player) {
    player.balance += PASS_GO_AMOUNT;

    return PASS_GO_AMOUNT;
}
