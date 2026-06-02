import { Player } from "../../../src/assets/player";
import { history } from "../../../src/assets/types";
import { notifyMessage } from "../../../src/ui/notifications/notificationFactory";
import { playMoneyPlusSfx } from "../../../src/ui/audio/audio";
import { GameContext } from "../context/gameContext";

export function addBalanceToOtherPlayers({
    player,
    amount,
    ctx,
}: {
    player?: Player;
    amount: number;
    ctx: GameContext;
}) {
    if (!player) return 0;

    const otherPlayers = Array.from(ctx.clients.values()).filter(
        (v) => v.id !== player.id
    );

    emitTransferSummaryHistory({
        player,
        amount,
        otherPlayers,
        ctx,
    });

    applyBalanceToOtherPlayers({
        player,
        amount,
        otherPlayers,
        ctx,
    });

    return otherPlayers.length;
}

function emitTransferSummaryHistory({
    player,
    amount,
    otherPlayers,
    ctx,
}: {
    player: Player;
    amount: number;
    otherPlayers: Player[];
    ctx: GameContext;
}) {
    if (player.id !== ctx.socket.id) return;

    const otherNames = otherPlayers
        .map((v) => v.username ?? "unknown user")
        .join(", ");

    const message =
        amount > 0
            ? `${player.username ?? "unknown user"} gave ${amount} money to [${otherNames}]`
            : `${player.username ?? "unknown user"} received ${-amount} money from [${otherNames}]`;

    ctx.socket.emit("history", history(message));
}

function applyBalanceToOtherPlayers({
    player,
    amount,
    otherPlayers,
    ctx,
}: {
    player: Player;
    amount: number;
    otherPlayers: Player[];
    ctx: GameContext;
}) {
    const updatedClients = new Map(ctx.clients);

    // player.balance -= amount * otherPlayers.length;
    // updatedClients.set(player.id, player);

    for (const other of otherPlayers) {
        other.balance += amount;

        if (ctx.effectsEnabled !== false && other.id === ctx.socket.id && ctx.settings?.notifications) {
            notifyMessage(ctx.notifyRef, "MONEY_ADDED", { amount });
            playMoneyPlusSfx(ctx.settings);
        }

        updatedClients.set(other.id, other);

        emitOtherPlayerTransfer({
            player,
            other,
            amount,
            ctx,
        });
    }

    ctx.SetClients(updatedClients);
}

function emitOtherPlayerTransfer({
    player,
    other,
    amount,
    ctx,
}: {
    player: Player;
    other: Player;
    amount: number;
    ctx: GameContext;
}) {
    if (player.id !== ctx.socket.id) return;

    if (amount > 0) {
        ctx.socket.emit("pay", {
            balance: amount,
            from: ctx.socket.id,
            to: other.id,
        });
        return;
    }

    ctx.socket.emit("pay", {
        balance: amount,
        from: other.id,
        to: ctx.socket.id,
    });

    ctx.socket.emit(
        "history",
        history(
            `${ctx.clients.get(ctx.socket.id)?.username ?? "unknown user"} pay ${amount} to ${
                ctx.clients.get(player.id)?.username ?? "unknown user"
            }`
        )
    );
}
